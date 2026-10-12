resource "aws_iam_role" "redirect" {
  name               = "${var.project}-redirect-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "redirect_logs" {
  role       = aws_iam_role.redirect.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "redirect_dynamodb" {
  name = "read-links-table"
  role = aws_iam_role.redirect.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:GetItem"]
      Resource = aws_dynamodb_table.links.arn
    }]
  })
}