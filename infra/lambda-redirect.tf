data "archive_file" "redirect" {
  type        = "zip"
  source_dir  = "${path.module}/../src/redirect"
  output_path = "${path.module}/build/redirect.zip"
}

resource "aws_lambda_function" "redirect" {
  function_name = "${var.project}-redirect"
  role          = aws_iam_role.redirect.arn
  runtime       = "nodejs22.x"
  handler       = "index.handler"

  filename         = data.archive_file.redirect.output_path
  source_code_hash = data.archive_file.redirect.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.links.name
    }
  }

  depends_on = [aws_cloudwatch_log_group.redirect]
}