import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { parseCurl, interpolateCurl, loadCurl } from "../src/domains/api/curl";
import { executeApiStep } from "../src/domains/api/api";

describe("API Domain - Curl-based", () => {
  describe("parseCurl", () => {
    it("should parse simple GET curl command", () => {
      const curl = `curl 'https://api.example.com/users'`;
      const result = parseCurl(curl);

      expect(result.url).toBe("https://api.example.com/users");
      expect(result.method).toBe("GET");
      expect(result.headers).toEqual({});
      expect(result.body).toBeUndefined();
    });

    it("should parse curl with method", () => {
      const curl = `curl 'https://api.example.com/users' -X POST`;
      const result = parseCurl(curl);

      expect(result.method).toBe("POST");
    });

    it("should parse curl with headers", () => {
      const curl = `curl 'https://api.example.com/users' -H 'Authorization: Bearer token' -H 'Content-Type: application/json'`;
      const result = parseCurl(curl);

      expect(result.headers).toEqual({
        Authorization: "Bearer token",
        "Content-Type": "application/json"
      });
    });

    it("should parse curl with body", () => {
      const curl = `curl 'https://api.example.com/users' -X POST --data '{"name":"John"}'`;
      const result = parseCurl(curl);

      expect(result.body).toBe('{"name":"John"}');
    });

    it("should handle multiline curl", () => {
      const curl = `curl 'https://api.example.com/users' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        --data '{"name":"John"}'`;
      const result = parseCurl(curl);

      expect(result.method).toBe("POST");
      expect(result.headers["Content-Type"]).toBe("application/json");
    });
  });

  describe("interpolateCurl", () => {
    it("should replace variables in URL", () => {
      const parsed = {
        url: "https://api.example.com/users/{{userId}}",
        method: "GET",
        headers: {}
      };
      const result = interpolateCurl(parsed, { userId: "123" });

      expect(result.url).toBe("https://api.example.com/users/123");
    });

    it("should replace variables in headers", () => {
      const parsed = {
        url: "https://api.example.com/users",
        method: "GET",
        headers: {
          Authorization: "Bearer {{token}}"
        }
      };
      const result = interpolateCurl(parsed, { token: "abc123" });

      expect(result.headers.Authorization).toBe("Bearer abc123");
    });

    it("should replace variables in body", () => {
      const parsed = {
        url: "https://api.example.com/users",
        method: "POST",
        headers: {},
        body: '{"name":"{{name}}","age":{{age}}}'
      };
      const result = interpolateCurl(parsed, { name: "John", age: 30 });

      expect(result.body).toBe('{"name":"John","age":30}');
    });

    it("should handle missing variables", () => {
      const parsed = {
        url: "https://api.example.com/users/{{userId}}",
        method: "GET",
        headers: {}
      };
      const result = interpolateCurl(parsed, {});

      expect(result.url).toBe("https://api.example.com/users/{{userId}}");
    });
  });

  describe("executeApiStep (integration)", () => {
    const testDir = path.join(__dirname, "..", "runs", "test-api");
    const curlPath = path.join(testDir, "test.curl");

    beforeAll(async () => {
      await fs.mkdir(testDir, { recursive: true });
      
      // Create test curl file
      const curlContent = `curl 'https://jsonplaceholder.typicode.com/posts/1' \\
  -H 'Accept: application/json'`;
      await fs.writeFile(curlPath, curlContent, "utf-8");
    });

    afterAll(async () => {
      try {
        await fs.rm(testDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it("should execute API request and generate evidence", async () => {
      const step = {
        id: "test-get-post",
        type: "api" as const
      };

      const result = await executeApiStep(step, curlPath, testDir, {});

      expect(result.evidenceFile).toBe("evidence.html");
      expect(result.statusCode).toBe(200);
      expect(result.responseData).toBeDefined();

      // Verify evidence file was created
      const evidencePath = path.join(testDir, "evidence.html");
      const evidenceExists = await fs.access(evidencePath).then(() => true).catch(() => false);
      expect(evidenceExists).toBe(true);

      // Verify evidence contains expected content
      const evidenceContent = await fs.readFile(evidencePath, "utf-8");
      expect(evidenceContent).toContain("API Evidence");
      expect(evidenceContent).toContain("GET");
      expect(evidenceContent).toContain("jsonplaceholder.typicode.com");
    });

    it("should interpolate variables from context", async () => {
      const curlWithVars = `curl 'https://jsonplaceholder.typicode.com/posts/{{postId}}' \\
  -H 'Accept: application/json'`;
      
      const varCurlPath = path.join(testDir, "test-vars.curl");
      await fs.writeFile(varCurlPath, curlWithVars, "utf-8");

      const step = {
        id: "test-interpolation",
        type: "api" as const
      };

      const result = await executeApiStep(step, varCurlPath, testDir, { postId: "2" });

      expect(result.statusCode).toBe(200);
      expect(result.responseData).toBeDefined();
      
      const data = result.responseData as { id: number };
      expect(data.id).toBe(2);
    });
  });
});
