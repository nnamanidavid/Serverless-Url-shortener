resource "aws_cloudwatch_log_group" "redirect" {
  name              = "/aws/lambda/${var.project}-redirect"
  retention_in_days = var.log_retention_days
}