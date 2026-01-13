import { promises as fs } from "fs";
import path from "path";
import { spawn } from "child_process";
import { PlanStep } from "../../core/types";

interface CommandSpec {
  command: string;
  args?: string[];
  label: string;
}

interface CliResult {
  stdoutFile: string;
  stderrFile: string;
  exitCode: number;
  durationMs: number;
  stdout: string;
  stderr: string;
  evidenceFile: string;
}

interface CliSuccessCriteria {
  stdoutRegex?: string;
  stderrRegex?: string;
  stdoutJsonPath?: string;
  stderrJsonPath?: string;
}

export async function executeCliStep(step: PlanStep, stepDir: string): Promise<CliResult> {
  const cli = step.config?.cli;
  if (!cli?.command && !cli?.pipeline) {
    throw new Error("cli step requires config.cli.command or config.cli.pipeline");
  }

  const stdoutPath = path.join(stepDir, "stdout.txt");
  const stderrPath = path.join(stepDir, "stderr.txt");
  const startedAt = Date.now();
  const env = cli.env ? { ...process.env, ...cli.env } : process.env;
  const commands = toCommandList(cli);

  ensureAwsCredentials(commands, env);

  let stdoutRaw = "";
  let stderrRaw = "";
  let stdoutLog = "";
  let stderrLog = "";
  const commandResults: CommandResult[] = [];
  let lastExitCode = 0;

  for (const command of commands) {
    const result = await runCommand(command, cli, env);
    commandResults.push(result);
    stdoutRaw = appendRaw(stdoutRaw, result.stdout);
    stderrRaw = appendRaw(stderrRaw, result.stderr);
    stdoutLog += formatChunk(command, result.stdout);
    stderrLog += formatChunk(command, result.stderr);
    lastExitCode = result.exitCode;
    if (result.exitCode !== 0) {
      break;
    }
  }

  const errorPattern = detectErrorPattern(cli.errorPatterns, stderrRaw);
  const successFailure = validateSuccessCriteria(cli.successCriteria, stdoutRaw, stderrRaw);
  const failureMessage =
    lastExitCode !== 0
      ? `CLI command failed exitCode=${lastExitCode}`
      : errorPattern
      ? `CLI stderr matched error pattern: ${errorPattern}`
      : successFailure;

  const redacted = redactOutput(stdoutRaw, stderrRaw, stdoutLog, stderrLog, env, cli.env);
  const durationMs = Date.now() - startedAt;
  await fs.writeFile(stdoutPath, redacted.stdoutLog, "utf-8");
  await fs.writeFile(stderrPath, redacted.stderrLog, "utf-8");
  const evidencePath = path.join(stepDir, "evidence.html");
  const evidenceHtml = buildCliEvidenceHtml(step, {
    stdout: redacted.stdoutLog,
    stderr: redacted.stderrLog,
    exitCode: lastExitCode,
    durationMs,
    commands: commandResults
  });
  await fs.writeFile(evidencePath, evidenceHtml, "utf-8");

  if (failureMessage) {
    throw new Error(failureMessage);
  }

  return {
    stdoutFile: path.basename(stdoutPath),
    stderrFile: path.basename(stderrPath),
    exitCode: lastExitCode,
    durationMs,
    stdout: redacted.stdoutRaw,
    stderr: redacted.stderrRaw,
    evidenceFile: path.basename(evidencePath)
  };
}

function buildCliEvidenceHtml(
  step: PlanStep,
  data: {
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
    commands: CommandResult[];
  }
): string {
  const cli = step.config?.cli;
  const command = cli?.command ?? "-";
  const args = cli?.args ? cli.args.join(" ") : "-";
  const cwd = cli?.cwd ?? "-";
  const timeoutMs = cli?.timeoutMs !== undefined ? String(cli.timeoutMs) : "-";

  const metaLine = [
    `Step: ${escapeHtml(step.id ?? step.type)}`,
    `Command: ${escapeHtml(command)}`,
    `Args: ${escapeHtml(args)}`,
    `Cwd: ${escapeHtml(cwd)}`,
    `TimeoutMs: ${escapeHtml(timeoutMs)}`,
    `Exit: ${escapeHtml(String(data.exitCode))}`,
    `DurationMs: ${escapeHtml(String(data.durationMs))}`
  ].join(" · ");

  const descriptionBlock = step.description
    ? `<div class="description">${escapeHtml(step.description)}</div>`
    : "";

  const commandRows = data.commands
    .map((entry) => {
      return `<tr>
  <td>${escapeHtml(entry.label)}</td>
  <td>${escapeHtml(entry.commandLine)}</td>
  <td>${escapeHtml(String(entry.exitCode))}</td>
  <td>${escapeHtml(String(entry.durationMs))}</td>
</tr>`;
    })
    .join("");

  const commandTable = data.commands.length
    ? `<h3>Commands</h3><table><thead><tr><th>Label</th><th>Command</th><th>Exit</th><th>DurationMs</th></tr></thead><tbody>${commandRows}</tbody></table>`
    : "";

  const stdoutHtml = data.stdout
    ? `<h3>Stdout</h3><pre>${escapeHtml(data.stdout)}</pre>`
    : "<p>No stdout output.</p>";
  const stderrHtml = data.stderr
    ? `<h3>Stderr</h3><pre>${escapeHtml(data.stderr)}</pre>`
    : "<p>No stderr output.</p>";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: "Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande", sans-serif; padding: 10px; color: #1f2328; background: #f5f2ec; }
    .card { max-width: 980px; margin: 0 auto; background: #fff; border-radius: 10px; box-shadow: 0 10px 28px rgba(25, 28, 32, 0.12); overflow: hidden; border: 1px solid #e2ddd3; padding: 10px; }
    h2, h3 { margin: 8px 0 4px; font-size: 12px; font-weight: 600; }
    .summary { font-size: 11px; color: #3b3f44; background: #f7f5ef; border: 1px solid #e0dbd1; border-radius: 8px; padding: 6px 8px; margin-bottom: 8px; }
    .description { padding: 6px 8px; border-radius: 8px; background: #fff7db; border: 1px solid #f0e0a8; font-size: 11px; margin-bottom: 8px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 8px; font-size: 10px; }
    td, th { border: 1px solid #d6d0c6; padding: 3px 5px; text-align: left; vertical-align: top; }
    th { background: #f3f1ea; width: 120px; }
    pre { background: #f7f5ef; padding: 6px; white-space: pre-wrap; font-size: 10px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>CLI Evidence</h2>
    <div class="summary">${metaLine}</div>
    ${descriptionBlock}
    ${commandTable}
    ${stdoutHtml}
    ${stderrHtml}
  </div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface CommandResult {
  label: string;
  commandLine: string;
  exitCode: number;
  durationMs: number;
  stdout: string;
  stderr: string;
}

function toCommandList(cli: NonNullable<PlanStep["config"]>["cli"]): CommandSpec[] {
  if (!cli) {
    return [];
  }
  if (cli.pipeline) {
    const commands: CommandSpec[] = [];
    if (cli.pipeline.pre) {
      cli.pipeline.pre.forEach((item, index) => {
        commands.push({ command: item.command, args: item.args, label: `pre#${index + 1}` });
      });
    }
    commands.push({
      command: cli.pipeline.script.command,
      args: cli.pipeline.script.args,
      label: "script"
    });
    if (cli.pipeline.post) {
      cli.pipeline.post.forEach((item, index) => {
        commands.push({ command: item.command, args: item.args, label: `post#${index + 1}` });
      });
    }
    return commands;
  }
  if (cli.command) {
    return [{ command: cli.command, args: cli.args, label: "run" }];
  }
  return [];
}

async function runCommand(
  spec: CommandSpec,
  cli: NonNullable<PlanStep["config"]>["cli"],
  env: NodeJS.ProcessEnv
): Promise<CommandResult> {
  if (!cli) {
    throw new Error("cli config missing");
  }
  const startedAt = Date.now();
  const child = spec.args
    ? spawn(spec.command, spec.args, { cwd: cli.cwd, env })
    : spawn(spec.command, { cwd: cli.cwd, env, shell: true });

  let stdout = "";
  let stderr = "";

  if (child.stdout) {
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
  }

  if (child.stderr) {
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
  }

  const result = await new Promise<CommandResult>((resolve, reject) => {
    let settled = false;
    let timedOut = false;
    let timeoutId: NodeJS.Timeout | undefined;

    if (cli.timeoutMs !== undefined) {
      timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, cli.timeoutMs);
    }

    child.on("error", (error) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      stderr += `${error.message}\n`;
      resolve({
        label: spec.label,
        commandLine: formatCommand(spec),
        exitCode: -1,
        durationMs: Date.now() - startedAt,
        stdout,
        stderr
      });
    });

    child.on("close", (code) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (timedOut) {
        stderr += `Command timed out after ${cli.timeoutMs}ms\n`;
      }
      resolve({
        label: spec.label,
        commandLine: formatCommand(spec),
        exitCode: timedOut ? -1 : code ?? -1,
        durationMs: Date.now() - startedAt,
        stdout,
        stderr
      });
    });
  });

  return result;
}

function formatCommand(spec: CommandSpec): string {
  if (spec.args && spec.args.length > 0) {
    return `${spec.command} ${spec.args.join(" ")}`;
  }
  return spec.command;
}

function formatChunk(spec: CommandSpec, content: string): string {
  if (!content) {
    return "";
  }
  return `--- ${spec.label}: ${formatCommand(spec)} ---\n${content}\n`;
}

function detectErrorPattern(errorPatterns: string[] | undefined, stderr: string): string | null {
  const patterns = errorPatterns && errorPatterns.length > 0
    ? errorPatterns
    : ["error", "failed", "fatal", "exception"];
  for (const pattern of patterns) {
    const regex = new RegExp(pattern, "i");
    if (regex.test(stderr)) {
      return pattern;
    }
  }
  return null;
}

function validateSuccessCriteria(
  criteria: CliSuccessCriteria | undefined,
  stdout: string,
  stderr: string
): string | null {
  if (!criteria) {
    return null;
  }
  if (criteria.stdoutRegex && !new RegExp(criteria.stdoutRegex).test(stdout)) {
    return "CLI successCriteria failed: stdoutRegex";
  }
  if (criteria.stderrRegex && !new RegExp(criteria.stderrRegex).test(stderr)) {
    return "CLI successCriteria failed: stderrRegex";
  }
  if (criteria.stdoutJsonPath && !hasJsonPath(stdout, criteria.stdoutJsonPath)) {
    return "CLI successCriteria failed: stdoutJsonPath";
  }
  if (criteria.stderrJsonPath && !hasJsonPath(stderr, criteria.stderrJsonPath)) {
    return "CLI successCriteria failed: stderrJsonPath";
  }
  return null;
}

function hasJsonPath(text: string, jsonPath: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return false;
  }
  return getByJsonPath(parsed, jsonPath) !== undefined;
}

function getByJsonPath(value: unknown, pathValue: string): unknown {
  const parts = pathValue.split(".").filter(Boolean);
  let current: unknown = value;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function ensureAwsCredentials(commands: CommandSpec[], env: NodeJS.ProcessEnv): void {
  const usesAws = commands.some((command) => {
    if (command.command.toLowerCase() === "aws") {
      return true;
    }
    return command.args ? command.args[0]?.toLowerCase() === "aws" : false;
  });
  if (!usesAws) {
    return;
  }

  const accessKey = env.AWS_ACCESS_KEY_ID;
  const secretKey = env.AWS_SECRET_ACCESS_KEY;
  if (!accessKey || !secretKey) {
    throw new Error("AWS credentials missing: set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
  }
}

function redactOutput(
  stdoutRaw: string,
  stderrRaw: string,
  stdoutLog: string,
  stderrLog: string,
  env: NodeJS.ProcessEnv,
  cliEnv?: Record<string, string>
): { stdoutRaw: string; stderrRaw: string; stdoutLog: string; stderrLog: string } {
  const secrets = collectSecrets(env, cliEnv);
  if (secrets.length === 0) {
    return { stdoutRaw, stderrRaw, stdoutLog, stderrLog };
  }
  return {
    stdoutRaw: redactText(stdoutRaw, secrets),
    stderrRaw: redactText(stderrRaw, secrets),
    stdoutLog: redactText(stdoutLog, secrets),
    stderrLog: redactText(stderrLog, secrets)
  };
}

function collectSecrets(env: NodeJS.ProcessEnv, cliEnv?: Record<string, string>): string[] {
  const combined: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") {
      combined[key] = value;
    }
  }
  if (cliEnv) {
    for (const [key, value] of Object.entries(cliEnv)) {
      combined[key] = value;
    }
  }

  const secrets: string[] = [];
  for (const [key, value] of Object.entries(combined)) {
    if (!value || value.length < 4) {
      continue;
    }
    if (/secret|token|key|password/i.test(key)) {
      secrets.push(value);
    }
  }
  return Array.from(new Set(secrets));
}

function redactText(text: string, secrets: string[]): string {
  let output = text;
  for (const secret of secrets) {
    output = output.split(secret).join("***");
  }
  return output;
}

function appendRaw(current: string, next: string): string {
  if (!next) {
    return current;
  }
  if (!current) {
    return next;
  }
  return `${current}\n${next}`;
}
