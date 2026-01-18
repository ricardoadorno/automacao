/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { executeCliStep } from "../src/domains/cli/cli";
import { PlanStep } from "../src/core/types";

describe("P5 cli step", () => {
  it("runs command and writes logs and metadata", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const stepDir = path.join(tempRoot, "step");
    await fs.mkdir(stepDir, { recursive: true });

    const step: PlanStep = {
      type: "cli",
      config: {
        cli: {
          command: process.execPath,
          args: ["-e", "console.log('ok'); console.error('err');"],
          cwd: tempRoot
        }
      }
    };

    const result = await executeCliStep(step, stepDir);

    const stdout = await fs.readFile(path.join(stepDir, "stdout.txt"), "utf-8");
    const stderr = await fs.readFile(path.join(stepDir, "stderr.txt"), "utf-8");

    expect(stdout).toContain("ok");
    expect(stderr).toContain("err");
    expect(result.exitCode).toBe(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    await fs.access(path.join(stepDir, "evidence.html"));
  });

  it("runs pipeline with pre/script/post and captures outputs", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const stepDir = path.join(tempRoot, "step");
    await fs.mkdir(stepDir, { recursive: true });

    const step: PlanStep = {
      type: "cli",
      config: {
        cli: {
          cwd: tempRoot,
          pipeline: {
            pre: [
              { command: process.execPath, args: ["-e", "require('fs').writeFileSync('a.txt','hi')"] }
            ],
            script: {
              command: process.execPath,
              args: ["-e", "const fs=require('fs'); const s=fs.readFileSync('a.txt','utf-8'); console.log('len='+s.length);"]
            },
            post: [
              { command: process.execPath, args: ["-e", "require('fs').unlinkSync('a.txt')"] }
            ]
          }
        }
      }
    };

    const result = await executeCliStep(step, stepDir);
    const stdout = await fs.readFile(path.join(stepDir, "stdout.txt"), "utf-8");

    expect(result.exitCode).toBe(0);
    expect(stdout).toContain("len=2");
    await expect(fs.access(path.join(tempRoot, "a.txt"))).rejects.toThrow();
  });

  it("fails when exitCode is non-zero", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const stepDir = path.join(tempRoot, "step");
    await fs.mkdir(stepDir, { recursive: true });

    const step: PlanStep = {
      type: "cli",
      config: {
        cli: {
          command: process.execPath,
          args: ["-e", "process.exit(2);"]
        }
      }
    };

    await expect(executeCliStep(step, stepDir)).rejects.toThrow("exitCode=2");
  }, { timeout: 15000 });

  it("fails when stderr matches error pattern", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const stepDir = path.join(tempRoot, "step");
    await fs.mkdir(stepDir, { recursive: true });

    const step: PlanStep = {
      type: "cli",
      config: {
        cli: {
          command: process.execPath,
          args: ["-e", "console.error('fatal: boom');"]
        }
      }
    };

    await expect(executeCliStep(step, stepDir)).rejects.toThrow("stderr matched error pattern");
  });

  it("fails when successCriteria is not met", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const stepDir = path.join(tempRoot, "step");
    await fs.mkdir(stepDir, { recursive: true });

    const step: PlanStep = {
      type: "cli",
      config: {
        cli: {
          command: process.execPath,
          args: ["-e", "console.log('ok');"],
          successCriteria: { stdoutRegex: "done" }
        }
      }
    };

    await expect(executeCliStep(step, stepDir)).rejects.toThrow("successCriteria");
  });

  it("redacts secrets from logs", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const stepDir = path.join(tempRoot, "step");
    await fs.mkdir(stepDir, { recursive: true });

    const secret = "supersecretvalue";
    const step: PlanStep = {
      type: "cli",
      config: {
        cli: {
          command: process.execPath,
          args: ["-e", "console.log(process.env.AWS_SECRET_ACCESS_KEY);"],
          env: { AWS_SECRET_ACCESS_KEY: secret }
        }
      }
    };

    await executeCliStep(step, stepDir);

    const stdout = await fs.readFile(path.join(stepDir, "stdout.txt"), "utf-8");
    expect(stdout).not.toContain(secret);
    expect(stdout).toContain("***");
  });

  it("fails fast when aws credentials are missing", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const stepDir = path.join(tempRoot, "step");
    await fs.mkdir(stepDir, { recursive: true });

    const step: PlanStep = {
      type: "cli",
      config: {
        cli: {
          command: "aws",
          args: ["s3", "ls"]
        }
      }
    };

    await expect(executeCliStep(step, stepDir)).rejects.toThrow("AWS credentials missing");
  });
});
