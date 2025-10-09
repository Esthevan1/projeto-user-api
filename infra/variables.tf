# === Configurações gerais ===
variable "project" {
  description = "Nome do projeto"
  type        = string
  default     = "projeto-user-api"
}

variable "region" {
  description = "Região AWS"
  type        = string
  default     = "eu-north-1"
}

variable "container_port" {
  description = "Porta interna do container"
  type        = number
  default     = 3000
}

# === Banco de dados ===
variable "db_name" {
  description = "Nome do banco"
  type        = string
  default     = "appdb"
}

variable "db_user" {
  description = "Usuário do banco"
  type        = string
  default     = "appuser"
}

variable "db_pass" {
  description = "Senha do banco"
  type        = string
  default     = "AppUser123!"
}

variable "db_password" {
  description = "AppUser123!"
  type        = string
  sensitive   = true
}

variable "image_tag" {
  description = "7f43896"
  type        = string
}