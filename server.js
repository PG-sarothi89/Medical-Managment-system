/**
 * APS Medical Management System — Built-in Local HTTP Server
 * Lightweight zero-dependency static server with automatic MIME types.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { handleApiRequest } = require("./api");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json"
};

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/")) {
    return handleApiRequest(req, res);
  }

  let reqUrl = req.url.split("?")[0];
  if (reqUrl === "/" || reqUrl === "") {
    reqUrl = "/index.html";
  }

  const safePath = path.normalize(decodeURIComponent(reqUrl)).replace(/^(\.\.[\/\\])+/, "");
  const filePath = path.join(ROOT, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 Not Found</title></head>
        <body style="font-family:sans-serif; text-align:center; padding:50px;">
          <h2>404 - File Not Found</h2>
          <p>The requested URL <code>${reqUrl}</code> was not found.</p>
          <a href="/index.html" style="color:#008be3; font-weight:bold;">Return to Login Portal</a>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const fileSize = stats.size;
    const range = req.headers.range;

    // Support HTTP Range requests for video/audio streaming
    if (range && (ext === ".mp4" || ext === ".webm" || ext === ".ogg")) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.writeHead(416, {
          "Content-Range": `bytes */${fileSize}`,
          "Content-Type": contentType
        });
        return res.end();
      }

      const chunksize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": contentType
      });
      fileStream.pipe(res);
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": fileSize,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-cache"
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

const os = require("os");

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

const HOST = "0.0.0.0";
server.listen(PORT, HOST, async () => {
  const localIp = getLocalIp();
  console.log("\n=======================================================");
  console.log(" [INFO] CURO Medical Management System Server Running");
  console.log(` [INFO] Desktop:     http://localhost:${PORT}`);
  console.log(` [INFO] Mobile Phone: http://${localIp}:${PORT}`);
  console.log(` [INFO] PostgreSQL 18: localhost:${process.env.PGPORT || 8000} (DB: ${process.env.PGDATABASE || "curo_db"})`);
  console.log(` [INFO] REST API:     http://localhost:${PORT}/api/status`);
  console.log("=======================================================\n");
});
