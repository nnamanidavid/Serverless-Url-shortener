resource "aws_cloudwatch_log_group" "create" {
  name              = "/aws/lambda/${var.project}-create"
  retention_in_days = var.log_retention_days
}