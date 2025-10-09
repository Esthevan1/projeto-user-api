data "aws_secretsmanager_secret" "db_url" {
  name = "projeto-user-api/db_url"
}

data "aws_secretsmanager_secret_version" "db_url" {
  secret_id = data.aws_secretsmanager_secret.db_url.id
}

# Cluster ECS
resource "aws_ecs_cluster" "this" {
  name = "${var.project}-cluster"
}

# Log group para a app
resource "aws_cloudwatch_log_group" "logs" {
  name              = "/ecs/${var.project}"
  retention_in_days = 7
}

# SG das tasks (recebem tráfego do ALB)
resource "aws_security_group" "ecs_tasks_sg" {
  name   = "${var.project}-ecs-sg"
  vpc_id = data.aws_vpc.default.id

  # ALB -> tasks (porta da app)
  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Monta a image URI e DATABASE_URL
locals {
  image_uri = "${aws_ecr_repository.repo.repository_url}:${var.image_tag}"
  db_url    = "postgresql://${var.db_user}:${var.db_pass}@${aws_db_instance.pg.address}:5432/${var.db_name}?schema=public"
}

# Task Definition (Fargate)
resource "aws_ecs_task_definition" "task" {
  family                   = "${var.project}-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
  {
    name      = "api"
    image     = "${aws_ecr_repository.repo.repository_url}:${var.image_tag}"
    essential = true

    # por enquanto, mantém fallback com db push (até versionarmos migrations)
    command = ["sh","-lc","npx prisma migrate deploy; npx prisma db push --accept-data-loss; node dist/server.js"]

    portMappings = [
      {
        containerPort = 3000
        protocol      = "tcp"
      }
    ]

    # variáveis NÃO sensíveis aqui
    environment = [
      { name = "PORT", value = "3000" }
    ]

    # DATABASE_URL via Secret
    secrets = [
      {
        name      = "DATABASE_URL"
        valueFrom = data.aws_secretsmanager_secret_version.db_url.arn
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = "/ecs/projeto-user-api"
        awslogs-region        = "eu-north-1"
        awslogs-stream-prefix = "ecs"
      }
    }
  }
])
  

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }
}

# Service atachado ao ALB
resource "aws_ecs_service" "svc" {
  name            = "${var.project}-svc"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_tasks_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.tg.arn
    container_name   = "api"
    container_port   = var.container_port
  }

  depends_on = [
    aws_lb_listener.http,
    aws_db_instance.pg
  ]
}

