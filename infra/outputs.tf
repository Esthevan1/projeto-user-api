output "ecr_repository_url" { value = aws_ecr_repository.repo.repository_url }
output "alb_dns" { value = aws_lb.app_alb.dns_name }
output "rds_endpoint" { value = aws_db_instance.pg.address }
