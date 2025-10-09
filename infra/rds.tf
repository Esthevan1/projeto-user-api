resource "aws_security_group" "rds_sg" {
  name   = "${var.project}-rds-sg"
  vpc_id = data.aws_vpc.default.id

  # MVP: aberto para simplificar a entrega
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_subnet_group" "db_subnets" {
  name       = "${var.project}-db-subnets"
  subnet_ids = data.aws_subnets.default.ids
}

resource "aws_db_instance" "pg" {
  identifier             = "${var.project}-pg"
  engine                 = "postgres"
  engine_version         = "15"
  instance_class         = "db.t4g.micro"
  allocated_storage      = 20
  username               = var.db_user
  password               = var.db_password
  apply_immediately      = true
  db_name                = var.db_name
  publicly_accessible    = true # MVP
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.db_subnets.name
  skip_final_snapshot    = true
}
