variable "region" {
  type    = string
  default = "us-east-1"
}


variable "project" {
  type    = string
  default = "url-shortener-tf"
}

variable "log_retention_days" {
  type    = number
  default = 7
}

variable "alarm_email" {
  type        = string
  description = "Email that receives alarm notifications"
}