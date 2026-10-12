import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomInt } from "node:crypto";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;

// Rules from the README
const ALIAS_PATTERN = /^[a-z0-9-]{3,30}$/;
const RESERVED = new Set(["links", "admin", "api", "health"]);
const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const CODE_LENGTH = 7;
const MAX_ATTEMPTS = 3;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const generateCode = () =>
  Array.from({ length: CODE_LENGTH }, () => CHARS[randomInt(CHARS.length)]).join("");

const isValidUrl = (value) => {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

// Atomic "check and write": fails if shortCode already exists
const saveLink = (shortCode, longUrl) =>
  client.send(
    new PutCommand({
      TableName: TABLE,
      Item: { shortCode, longUrl, createdAt: new Date().toISOString() },
      ConditionExpression: "attribute_not_exists(shortCode)",
    })
  );

const isTaken = (err) => err.name === "ConditionalCheckFailedException";

export const handler = async (event) => {
  try {
    // 1. Parse the body (API Gateway sends it as a string)
    let body;
    try {
      body = JSON.parse(event.body ?? "{}");
    } catch {
      return json(400, { error: "Invalid request body" });
    }

    // 2. Validate the URL
    if (typeof body.url !== "string" || !isValidUrl(body.url)) {
      return json(400, { error: "Invalid URL" });
    }

    const host = event.requestContext?.domainName ?? "<your-domain>";
    const respond = (code) =>
      json(201, { shortCode: code, shortUrl: `https://${host}/${code}` });

    // 3a. Custom alias path
    if (body.alias !== undefined) {
      const alias = typeof body.alias === "string" ? body.alias.toLowerCase() : "";

      if (!ALIAS_PATTERN.test(alias) || RESERVED.has(alias)) {
        return json(400, { error: "Invalid alias" });
      }

      try {
        await saveLink(alias, body.url);
      } catch (err) {
        if (isTaken(err)) return json(409, { error: "Alias already in use" });
        throw err;
      }

      console.log(JSON.stringify({ event: "created", code: alias, custom: true }));
      return respond(alias);
    }

    // 3b. Generated code path: retry on collision
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const code = generateCode();
      try {
        await saveLink(code, body.url);
        console.log(JSON.stringify({ event: "created", code, custom: false }));
        return respond(code);
      } catch (err) {
        if (!isTaken(err)) throw err;
        console.log(JSON.stringify({ event: "collision", code, attempt }));
      }
    }

    // All attempts collided: our problem, not the client's
    throw new Error("Could not generate a unique code");
  } catch (err) {
    console.error(JSON.stringify({ event: "error", message: err.message }));
    return json(500, { error: "Internal server error" });
  }
};