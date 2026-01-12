# API Domain - Curl-based Testing

This domain allows you to execute API tests using curl commands without API specifications.

## Overview

The API domain has been completely refactored to work with curl commands, providing:
- Simple curl file parsing
- Variable interpolation from previous steps
- Beautiful HTML evidence generation
- Support for request/response data exports

## File Structure

- `curl.ts` - Parse and interpolate curl commands
- `api.ts` - Main API step execution logic
- `api-template.html` - Beautiful HTML template for evidence

## Usage

### 1. Create a curl file

Create a `.curl` file with your curl command. Use `{{variable}}` syntax for interpolation:

```bash
# examples/api/get-user.curl
curl 'https://api.example.com/users/{{userId}}' \
  -H 'Authorization: Bearer {{token}}' \
  -H 'Accept: application/json'
```

### 2. Configure your plan

Add the `curlPath` to your plan and define API steps:

```json
{
  "metadata": {
    "feature": "User API Test",
    "ticket": "API-123"
  },
  "curlPath": "examples/api/get-user.curl",
  "steps": [
    {
      "id": "get-user",
      "type": "api",
      "exports": {
        "userName": {
          "source": "responseData",
          "jsonPath": "name"
        },
        "userEmail": {
          "source": "responseData",
          "jsonPath": "email"
        }
      }
    }
  ]
}
```

### 3. Run your plan

```bash
npm start -- --plan examples/api/plan.json --out runs
```

## Variable Interpolation

Variables from previous steps or context can be injected into the curl command:

```bash
curl 'https://api.example.com/posts' \
  -X POST \
  -H 'Content-Type: application/json' \
  --data '{"title":"{{postTitle}}","userId":{{userId}}}'
```

Variables are replaced with values from the execution context.

## Exports

You can export data from API responses to use in subsequent steps:

### Export from JSON response (responseData)

```json
{
  "exports": {
    "userId": {
      "source": "responseData",
      "jsonPath": "data.user.id"
    }
  }
}
```

### Export using regex (responseText)

```json
{
  "exports": {
    "token": {
      "source": "responseText",
      "regex": "token\":\"([^\"]+)\""
    }
  }
}
```

## Evidence Generation

Each API step generates a beautiful HTML evidence file with:
- ✅ Request details (method, URL, headers, body)
- ✅ Response details (status, headers, body)
- ✅ Timing information
- ✅ Syntax highlighting for JSON
- ✅ Copy-to-clipboard functionality
- ✅ Professional UI with gradient colors

The evidence file is saved as `evidence.html` in the step directory.

## Step Outputs

API steps produce the following outputs:

- `evidenceFile` - HTML evidence filename
- `responseData` - Parsed response (JSON object or string)
- `statusCode` - HTTP status code

## Examples

See the `examples/api/` directory for complete examples:
- `get-post.curl` - Simple GET request
- `plan.json` - Complete plan with exports

## Technical Details

### Curl Parsing

The `parseCurl` function extracts:
- URL (with variable placeholders)
- HTTP method
- Headers
- Request body

### HTTP Execution

Uses native Node.js `fetch` API (Node 18+) for HTTP requests.

### Template Engine

The HTML evidence uses a simple string replacement system with placeholders like `{{STEP_ID}}`, `{{METHOD}}`, etc.

## Troubleshooting

### "curlPath is required for API steps"

Make sure your plan has a `curlPath` property pointing to a valid `.curl` file.

### Variables not interpolating

Check that:
1. Variables are exported from previous steps
2. Variables are referenced with `{{variableName}}` syntax
3. Previous steps have completed successfully

### Response parsing errors

If the response isn't JSON, it will be stored as plain text in `responseData`. Use `responseText` with regex for non-JSON responses.
