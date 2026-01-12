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

  const empty = runs.length === 0 ? `<div class="empty">
  <div class="empty-icon">📦</div>
  <div class="empty-text">No runs found</div>
  <div class="empty-hint">Run your first test plan with: npm start -- --plan examples/plan.json --out runs</div>
</div>` : "";
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Runs Index - Automation Framework</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: #f5f7fa;
      padding: 0;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 8px;
    }
    
    .header .subtitle {
      opacity: 0.9;
      font-size: 14px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }
    
    .controls {
      background: white;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }
    
    .controls input {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      flex: 1;
      min-width: 200px;
    }
    
    .controls button {
      padding: 8px 16px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    }
    
    .controls button:hover {
      background: #5568d3;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .stat-card .label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .stat-card .value {
      font-size: 32px;
      font-weight: 600;
      color: #333;
    }
    
    .stat-card.success .value { color: #28a745; }
    .stat-card.failed .value { color: #dc3545; }
    .stat-card.skipped .value { color: #ffc107; }
    
    table { 
      border-collapse: collapse; 
      width: 100%; 
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    thead {
      background: #667eea;
      color: white;
    }
    
    th { 
      padding: 14px 16px; 
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td { 
      padding: 14px 16px; 
      border-bottom: 1px solid #f0f0f0;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    tbody tr {
      transition: background 0.2s;
    }
    
    tbody tr:hover { 
      background: #f8f9fa; 
    }
    
    a { 
      color: #667eea; 
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }
    
    a:hover {
      color: #5568d3;
      text-decoration: underline;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 6px;
    }
    
    .badge.ok { background: #d4edda; color: #155724; }
    .badge.fail { background: #f8d7da; color: #721c24; }
    .badge.skip { background: #fff3cd; color: #856404; }
    
    .empty {
      background: white;
      padding: 60px 24px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.3;
    }
    
    .empty-text {
      color: #666;
      font-size: 18px;
      margin-bottom: 8px;
    }
    
    .empty-hint {
      color: #999;
      font-size: 14px;
    }
    
    .refresh-indicator {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 13px;
      color: #666;
      display: none;
    }
    
    .refresh-indicator.active {
      display: block;
      animation: fadeIn 0.3s;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 16px;
      }
      
      .stats {
        grid-template-columns: 1fr;
      }
      
      table {
        font-size: 13px;
      }
      
      th, td {
        padding: 10px 12px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="container">
      <h1>🚀 Automation Runs</h1>
      <div class="subtitle">Test execution results and evidence</div>
    </div>
  </div>
  
  <div class="container">
    <div class="controls">
      <input type="text" id="searchInput" placeholder="🔍 Search by run ID, feature, or env..." />
      <button onclick="location.reload()">🔄 Refresh</button>
    </div>
    
    <div class="stats" id="stats"></div>
    
    ${empty}
    ${table}
  </div>
  
  <div class="refresh-indicator" id="refreshIndicator">
    Auto-refresh in <span id="countdown">30</span>s
  </div>
  
  <script>
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
      });
    }
    
    // Calculate and display statistics
    function updateStats() {
      const rows = document.querySelectorAll('tbody tr');
      let totalRuns = rows.length;
      let totalOK = 0, totalFail = 0, totalSkipped = 0;
      
      rows.forEach(row => {
        const statusText = row.cells[5]?.textContent || '';
        const okMatch = statusText.match(/OK=(\\d+)/);
        const failMatch = statusText.match(/FAIL=(\\d+)/);
        const skipMatch = statusText.match(/SKIPPED=(\\d+)/);
        
        if (okMatch) totalOK += parseInt(okMatch[1]);
        if (failMatch) totalFail += parseInt(failMatch[1]);
        if (skipMatch) totalSkipped += parseInt(skipMatch[1]);
      });
      
      const statsHtml = \`
        <div class="stat-card">
          <div class="label">Total Runs</div>
          <div class="value">\${totalRuns}</div>
        </div>
        <div class="stat-card success">
          <div class="label">Steps Passed</div>
          <div class="value">\${totalOK}</div>
        </div>
        <div class="stat-card failed">
          <div class="label">Steps Failed</div>
          <div class="value">\${totalFail}</div>
        </div>
        <div class="stat-card skipped">
          <div class="label">Steps Skipped</div>
          <div class="value">\${totalSkipped}</div>
        </div>
      \`;
      
      const statsContainer = document.getElementById('stats');
      if (statsContainer) {
        statsContainer.innerHTML = statsHtml;
      }
    }
    
    // Auto-refresh countdown (optional, disabled by default)
    let autoRefresh = false;
    let countdown = 30;
    
    if (autoRefresh) {
      const indicator = document.getElementById('refreshIndicator');
      const countdownSpan = document.getElementById('countdown');
      indicator.classList.add('active');
      
      setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          location.reload();
        }
        countdownSpan.textContent = countdown;
      }, 1000);
    }
    
    // Initialize
    updateStats();
  </script>
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
