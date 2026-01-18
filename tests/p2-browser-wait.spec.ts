/// <reference types="vitest" />
import { describe, expect, it, vi } from "vitest";
import { runActions } from "../src/domains/browser/actions";

describe("P2 browser wait actions", () => {
  it("waits for request by url", async () => {
    const waitForRequest = vi.fn(async (predicate: (req: { url(): string }) => boolean, options: { timeout: number }) => {
      expect(options.timeout).toBe(15000);
      const mockRequest = { url: () => "https://example.com/orders/123" };
      expect(predicate(mockRequest)).toBe(true);
    });
    const page = { waitForRequest } as unknown as { waitForRequest: typeof waitForRequest };

    const timings = await runActions(page as any, [
      { type: "waitForRequest", url: "/orders", timeoutMs: 15000 }
    ]);

    expect(waitForRequest).toHaveBeenCalledTimes(1);
    expect(timings[0].type).toBe("waitForRequest");
  });

  it("waits for response by regex and status", async () => {
    const waitForResponse = vi.fn(async (predicate: (res: { url(): string; status(): number }) => boolean) => {
      const mockResponse = {
        url: () => "https://api.example.com/users/42",
        status: () => 200
      };
      expect(predicate(mockResponse)).toBe(true);
    });
    const page = { waitForResponse } as unknown as { waitForResponse: typeof waitForResponse };

    const timings = await runActions(page as any, [
      { type: "waitForResponse", urlRegex: "api.example.com/users", status: 200 }
    ]);

    expect(waitForResponse).toHaveBeenCalledTimes(1);
    expect(timings[0].type).toBe("waitForResponse");
  });

  it("errors when wait action has no url or regex", async () => {
    const page = { waitForRequest: vi.fn() } as unknown as { waitForRequest: () => void };
    await expect(
      runActions(page as any, [{ type: "waitForRequest" } as any])
    ).rejects.toThrow("waitForRequest/Response requires url or urlRegex");
  });
});
