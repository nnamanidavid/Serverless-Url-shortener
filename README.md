# URL Shortener API

## POST /links: Create a short link

**Request body (JSON)**
{
  "url": "https://example.com/some/long/page",
  "alias": "my-link"        // optional
}

**Success: 201 Created**
{
  "shortCode": "my-link",
  "shortUrl": "https://<your-domain>/my-link"
}

**Errors**
| Status | When | Body |
|---|---|---|
| 400 | `url` missing, invalid, or not http/https | {"error": "Invalid URL"} |
| 400 | `alias` breaks the alias rules or is a reserved word | {"error": "Invalid alias"} |
| 409 | `alias` already taken | {"error": "Alias already in use"} |
| 500 | Unexpected failure (DynamoDB down, bug) | {"error": "Internal server error"} |


## GET /{code}: Redirect to the original URL

**Path parameter**
| Name | Description |
|---|---|
| `code` | The short code or custom alias, e.g. `abc123` or `my-link` |

No request body.

**Success: 302 Found**

```
HTTP/1.1 302 Found
Location: https://example.com/some/long/page
```

Response body: empty.

**Errors**
| Status | When | Body |
|---|---|---|
| 400 | `code` contains characters or a length outside the allowed alias rules | {"error": "Invalid code"} |
| 404 | No link exists for this `code` | {"error": "Link not found"} |
| 500 | Unexpected failure (DynamoDB down, bug) | {"error": "Internal server error"} |


## Decisions

### 1. Alias rules
- Allowed characters: lowercase letters, numbers, hyphen (`a-z 0-9 -`). Reason: safe inside a URL.
- Length: 3 to 30 characters. Reason: blocks junk and storage abuse.
- Case: not case-sensitive. All aliases are converted to lowercase before saving. Reason: `Promo` and `promo` should be the same link, so users don't land on the wrong page.

### 2. Reserved words
- Blocked aliases: `links`, `admin`, `api`, `health`. Reason: avoids clashes with future routes.

### 3. Code generation (no alias given)
- Length: 7 characters, using `a-z 0-9`. Reason: about 78 billion combinations, plenty for this project.
- Collisions: use a conditional write (`attribute_not_exists(shortCode)`). If it fails, generate a new code and retry up to 3 times, then return `500`. Reason: avoids check-then-write race conditions.