resource "aws_dynamodb_table" "links" {
  name         = "${var.project}-links"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "shortCode"

  attribute {
    name = "shortCode"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }


  deletion_protection_enabled = true
}