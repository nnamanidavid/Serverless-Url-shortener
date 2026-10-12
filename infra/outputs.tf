output "api_url" {
  value = aws_apigatewayv2_api.main.api_endpoint
}

output "table_name" {
  value = aws_dynamodb_table.links.name
}