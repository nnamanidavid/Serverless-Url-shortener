resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true


  default_route_settings {
    throttling_burst_limit = 20
    throttling_rate_limit  = 10
  }
}