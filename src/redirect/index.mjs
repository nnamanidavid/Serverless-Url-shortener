import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;

// Matches the alias rules in the README: a-z, 0-9, hyphen, 3 to 30 characters
const CODE_PATTERN = /^[a-z0-9-]{3,30}$/;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  try {
    // 1. Read the code and lowercase it
    const code = (event.pathParameters?.code ?? "").toLowerCase();

    // 2. Validate before touching the database
    if (!CODE_PATTERN.test(code)) {
      console.log(JSON.stringify({ event: "invalid_code", code }));
      return json(400, { error: "Invalid code" });
    }

    // 3. Look it up
    const result = await client.send(
      new GetCommand({ TableName: TABLE, Key: { shortCode: code } })
    );

    // 4. Not found
    if (!result.Item) {
      console.log(JSON.stringify({ event: "not_found", code }));
      return json(404, { error: "Link not found" });
    }

    // 5. Found: redirect
    console.log(JSON.stringify({ event: "redirect", code }));
    return {
      statusCode: 302,
      headers: { Location: result.Item.longUrl },
      body: "",
    };
  } catch (err) {
    // 6. Log the real error, return a generic message
    console.error(JSON.stringify({ event: "error", message: err.message }));
    return json(500, { error: "Internal server error" });
  }
};