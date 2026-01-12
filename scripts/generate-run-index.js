const fs = require("fs");
const path = require("path");

async function main() {
  const root = process.cwd();
  const runsDir = path.join(root, "runs");
  let entries = [];
  try {
    entries = await fs.promises.readdir(runsDir, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === "ENOENT") {
      await writeIndex([]);
      return;
    }
    throw error;
  }

  const runs = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const runId = entry.name;
    const summaryPath = path.join(runsDir, runId, "00_runSummary.json");
    try {
      const raw = await fs.promises.readFile(summaryPath, "utf-8");
      const summary = JSON.parse(raw);
      runs.push({
        runId,
        feature: summary.feature || "-",
        env: summary.env || "-",
        startedAt: summary.startedAt || "",
        finishedAt: summary.finishedAt || "",
        counts: summarizeCounts(summary.steps || [])
      });
    } catch (error) {
      runs.push({
        runId,
        feature: "-",
        env: "-",
        startedAt: "",
        finishedAt: "",
        counts: { OK: 0, FAIL: 0, SKIPPED: 0 }
      });
    }
  }

  runs.sort((a, b) => {
    if (a.startedAt && b.startedAt) {
      return b.startedAt.localeCompare(a.startedAt);
    }
    return b.runId.localeCompare(a.runId);
  });

  await writeIndex(runs);
}

function summarizeCounts(steps) {
  const counts = { OK: 0, FAIL: 0, SKIPPED: 0 };
  for (const step of steps) {
    if (counts[step.status] !== undefined) {
      counts[step.status] += 1;
    }
  }
  return counts;
}

async function writeIndex(runs) {
  const rows = runs
    .map((run) => {
      const link = `runs/${run.runId}/index.html`;
      const counts = `OK=${run.counts.OK} FAIL=${run.counts.FAIL} SKIPPED=${run.counts.SKIPPED}`;
      return `<tr>
  <td><a href="${link}">${escapeHtml(run.runId)}</a></td>
  <td>${escapeHtml(run.feature)}</td>
  <td>${escapeHtml(run.env)}</td>
  <td>${escapeHtml(run.startedAt || "-")}</td>
  <td>${escapeHtml(run.finishedAt || "-")}</td>
  <td>${escapeHtml(counts)}</td>
</tr>`;
    })
    .join("");

  const empty = runs.length === 0 ? "<p>No runs found.</p>" : "";
  const table = runs.length === 0 ? "" : `<table>
  <thead>
    <tr>
      <th>Run</th>
      <th>Feature</th>
      <th>Env</th>
      <th>Started</th>
      <th>Finished</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>`;

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Runs index</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    a { color: #1a4c9a; text-decoration: none; }
  </style>
</head>
<body>
  <h1>Runs index</h1>
  ${empty}
  ${table}
</body>
</html>`;

  await fs.promises.writeFile(path.join(process.cwd(), "index.html"), html, "utf-8");
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
