/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import Database from "better-sqlite3";
import { executeSqlEvidenceStep } from "../src/sql";
import { PlanStep } from "../src/types";

vi.mock("playwright", () => {
  return {
    chromium: {
      launch: async () => {
        return {
          newPage: async () => ({
            goto: async () => undefined,
            screenshot: async ({ path: filePath }: { path: string }) => {
              await fs.writeFile(filePath, "fake");
            }
          }),
          close: async () => undefined
        };
      }
    }
  };
});

describe("P1 SQLite adapter", () => {
  it("runs query against sqlite and generates evidence", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const stepDir = path.join(tempRoot, "step");
    await fs.mkdir(stepDir, { recursive: true });

    const dbPath = path.join(tempRoot, "demo.db");
    const db = new Database(dbPath);
    db.exec("create table todos (id integer primary key, title text, run_date text);");
    db.exec("insert into todos (id, title, run_date) values (1, 'task', '2026-01-10');");
    db.close();

    const step: PlanStep = {
      type: "sqlEvidence",
      config: {
        sql: {
          adapter: "sqlite",
          dbPath,
          query: "select id, title, run_date from todos where id = 1",
          expectRows: 1
        }
      }
    };

    const result = await executeSqlEvidenceStep(step, stepDir);

    await fs.access(path.join(stepDir, "evidence.html"));
    await fs.access(path.join(stepDir, "screenshot.png"));
    await fs.access(path.join(stepDir, "hashes.json"));
    await fs.access(path.join(stepDir, "result.json"));
    expect(result.rows).toBe(1);
    expect(result.rowsData[0].id).toBe("1");
  });
});
