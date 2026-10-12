
data "archive_file" "create" {
  type        = "zip"
  source_dir  = "${path.module}/../src/create"
  output_path = "${path.module}/build/create.zip"
}

resource "aws_lambda_function" "create" {
  function_name = "${var.project}-create"
  role          = aws_iam_role.create.arn
  runtime       = "nodejs22.x"
  handler       = "index.handler"

  filename         = data.archive_file.create.output_path
  source_code_hash = data.archive_file.create.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.links.name
    }
  }


  depends_on = [aws_cloudwatch_log_group.create]
}