const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";

// MIME types mapping
const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

const server = http.createServer((req, res) => {
  // Remove query string and decode URL
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  
  // Security: prevent directory traversal
  if (urlPath.includes("..")) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("403 Forbidden");
    return;
  }

  // Default to index.html for root
  if (urlPath === "/") {
    urlPath = "/index.html";
  }

  // Build file path
  const filePath = path.join(process.cwd(), urlPath);

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }

    // Stream file to response (memory efficient)
    const mimeType = getMimeType(filePath);
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
});

server.listen(PORT, HOST, () => {
  console.log(`\n🚀 Run Viewer Server Started!`);
  console.log(`\n📂 Serving files from: ${process.cwd()}`);
  console.log(`🌐 Open in browser: http://${HOST}:${PORT}`);
  console.log(`\n💡 Tips:`);
  console.log(`   - View all runs: http://${HOST}:${PORT}/index.html`);
  console.log(`   - Run 'npm run index' to update the runs list`);
  console.log(`   - Press Ctrl+C to stop the server\n`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error(`   Try a different port: PORT=3001 npm run serve\n`);
  } else {
    console.error("\n❌ Server error:", err, "\n");
  }
  process.exit(1);
});
