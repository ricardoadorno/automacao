const http = require("http");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const execAsync = promisify(exec);
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";

// Track running executions
const runningExecutions = new Map();

// API endpoints
const routes = {
  "/api/plans": handleGetPlans,
  "/api/run": handleRunPlan,
  "/api/status": handleGetStatus,
  "/api/runs": handleGetRuns
};

async function handleGetPlans(req, res) {
  try {
    const plansDir = path.join(process.cwd(), "examples");
    const plans = await findPlans(plansDir);
    
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ plans }));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
}

async function findPlans(dir, basePath = "") {
  const plans = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name);
    
    if (entry.isDirectory()) {
      const subPlans = await findPlans(fullPath, relativePath);
      plans.push(...subPlans);
    } else if (entry.name === "plan.json") {
      try {
        const content = await fs.promises.readFile(fullPath, "utf-8");
        const plan = JSON.parse(content);
        
        plans.push({
          path: path.join("examples", relativePath).replace(/\\/g, "/"),
          fullPath: fullPath,
          feature: plan.metadata?.feature || "Unnamed",
          ticket: plan.metadata?.ticket || "",
          env: plan.metadata?.env || "",
          stepsCount: plan.steps?.length || 0
        });
      } catch (error) {
        // Skip invalid plan files
      }
    }
  }
  
  return plans;
}

async function handleRunPlan(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }
  
  let body = "";
  req.on("data", chunk => { body += chunk; });
  req.on("end", async () => {
    try {
      const { planPath } = JSON.parse(body);
      
      if (!planPath) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "planPath is required" }));
        return;
      }
      
      const resolvedPlanPath = resolvePlanPath(planPath);
      const executionId = Date.now().toString();
      const safePlanPath = resolvedPlanPath.replace(/"/g, '\\"');
      const command = `npm start -- --plan "${safePlanPath}" --out runs`;
      
      runningExecutions.set(executionId, {
        planPath,
        status: "running",
        startedAt: new Date().toISOString(),
        output: []
      });
      
      // Execute in background
      const child = exec(command, { cwd: process.cwd() });
      
      child.stdout.on("data", (data) => {
        const execution = runningExecutions.get(executionId);
        if (!execution) {
          return;
        }
        const text = data.toString();
        execution.output.push(text);
        if (text.includes("Run ") && text.includes(" finished:")) {
          execution.status = "completed";
          execution.finishedAt = new Date().toISOString();
        }
      });
      
      child.stderr.on("data", (data) => {
        const execution = runningExecutions.get(executionId);
        if (!execution) {
          return;
        }
        execution.output.push(`ERROR: ${data.toString()}`);
      });
      
      const finalizeExecution = (status, details = {}) => {
        const execution = runningExecutions.get(executionId);
        if (!execution || execution.status !== "running") {
          return;
        }
        execution.status = status;
        execution.finishedAt = new Date().toISOString();
        Object.assign(execution, details);
      };

      child.on("exit", (code, signal) => {
        finalizeExecution(code === 0 ? "completed" : "failed", {
          exitCode: code,
          signal
        });
        exec("npm run index", { cwd: process.cwd() });
      });

      child.on("close", (code, signal) => {
        finalizeExecution(code === 0 ? "completed" : "failed", {
          exitCode: code,
          signal
        });
      });

      child.on("error", (error) => {
        finalizeExecution("failed", { error: error.message });
      });
      
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ 
        executionId,
        message: "Execution started",
        planPath 
      }));
      
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
}

function resolvePlanPath(planPath) {
  const plansDir = path.join(process.cwd(), "examples");
  const normalized = planPath.replace(/\\/g, "/");
  const relative =
    normalized.startsWith("examples/") ? normalized.slice("examples/".length) : normalized;
  const resolved = path.resolve(plansDir, relative);

  if (!resolved.startsWith(plansDir + path.sep) && resolved !== plansDir) {
    throw new Error("planPath must stay within examples/");
  }

  return resolved;
}

async function handleGetStatus(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const executionId = url.searchParams.get("id");
  
  if (!executionId) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "executionId is required" }));
    return;
  }
  
  const execution = runningExecutions.get(executionId);
  
  if (!execution) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Execution not found" }));
    return;
  }
  
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(execution));
}

async function handleGetRuns(req, res) {
  try {
    const runsDir = path.join(process.cwd(), "runs");
    if (!fs.existsSync(runsDir)) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ runs: [], page: 1, pageSize: 5, total: 0 }));
      return;
    }
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.max(
      1,
      Math.min(20, Number.parseInt(url.searchParams.get("pageSize") ?? "5", 10) || 5)
    );
    const entries = await fs.promises.readdir(runsDir, { withFileTypes: true });
    const runIds = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort((a, b) => b.localeCompare(a));
    const total = runIds.length;
    const start = (page - 1) * pageSize;
    const pageIds = runIds.slice(start, start + pageSize);
    const runs = await Promise.all(
      pageIds.map(async (runId) => {
        const summaryPath = path.join(runsDir, runId, "00_runSummary.json");
        try {
          const summaryRaw = await fs.promises.readFile(summaryPath, "utf-8");
          const summary = JSON.parse(summaryRaw);
          const counts = { OK: 0, FAIL: 0, SKIPPED: 0 };
          for (const step of summary.steps ?? []) {
            if (step.status === "OK") counts.OK += 1;
            if (step.status === "FAIL") counts.FAIL += 1;
            if (step.status === "SKIPPED") counts.SKIPPED += 1;
          }
          const status =
            counts.FAIL > 0 ? "FAIL" : counts.SKIPPED > 0 ? "SKIPPED" : "OK";
          return {
            runId,
            feature: summary.feature ?? "",
            ticket: summary.ticket ?? "",
            env: summary.env ?? "",
            startedAt: summary.startedAt ?? "",
            finishedAt: summary.finishedAt ?? "",
            status,
            counts,
            steps: summary.steps?.length ?? 0
          };
        } catch (error) {
          return { runId };
        }
      })
    );
    
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ runs, page, pageSize, total }));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
}

// Main server
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // API routes
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const handler = routes[pathname];
  if (handler) {
    handler(req, res);
    return;
  }
  
  // Static files
  serveStatic(req, res);
});

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  
  if (urlPath.includes("..")) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("403 Forbidden");
    return;
  }
  
  if (urlPath === "/") {
    urlPath = "/dashboard.html";
  }
  
  const filePath = path.join(process.cwd(), urlPath);
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml"
    };
    
    const mimeType = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, { 
      "Content-Type": mimeType,
      "Content-Length": stats.size 
    });
    
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    
    stream.on("error", (streamErr) => {
      console.error("Stream error:", streamErr);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
      }
      res.end("500 Internal Server Error");
    });
  });
}

server.listen(PORT, HOST, () => {
  console.log(`\n🚀 Automation Dashboard Started!`);
  console.log(`\n📂 Serving from: ${process.cwd()}`);
  console.log(`🌐 Dashboard: http://${HOST}:${PORT}`);
  console.log(`📊 Runs index: http://${HOST}:${PORT}/index.html`);
  console.log(`\n💡 Features:`);
  console.log(`   - Browse and run test plans`);
  console.log(`   - Monitor execution status`);
  console.log(`   - View results in real-time`);
  console.log(`\n⌨️  Press Ctrl+C to stop\n`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error(`   Try: PORT=3001 npm run dashboard\n`);
  } else {
    console.error("\n❌ Server error:", err, "\n");
  }
  process.exit(1);
});
