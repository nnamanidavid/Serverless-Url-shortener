resource "aws_iam_role" "create" {
  name               = "${var.project}-create-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}


resource "aws_iam_role_policy_attachment" "create_logs" {
  role       = aws_iam_role.create.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}


resource "aws_iam_role_policy" "create_dynamodb" {
  name = "write-links-table"
  role = aws_iam_role.create.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:PutItem"]
      Resource = aws_dynamodb_table.links.arn
    }]
  })
}