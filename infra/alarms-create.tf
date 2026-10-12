resource "aws_cloudwatch_metric_alarm" "create_errors" {
  alarm_name          = "${var.project}-create-errors"
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.create.function_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}