const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    port: 3333,
    dir: './files'
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-p':
      case '--port':
        options.port = parseInt(args[++i]);
        if (isNaN(options.port)) {
          console.error('Error: Port must be a number');
          process.exit(1);
        }
        break;
      case '-d':
      case '--dir':
        options.dir = args[++i];
        if (!options.dir) {
          console.error('Error: Directory path is required');
          process.exit(1);
        }
        break;
      case '-h':
      case '--help':
        console.log('Usage: node file-server.js [options]');
        console.log('Options:');
        console.log('  -p, --port <port>    Port number (default: 3000)');
        console.log('  -d, --dir <path>     Base directory (default: ./files)');
        console.log('  -h, --help          Show this help message');
        process.exit(0);
      default:
        console.error(`Error: Unknown option ${args[i]}`);
        console.log('Use --help for usage information');
        process.exit(1);
    }
  }

  return options;
}

// Configuration
const { port: PORT, dir: BASE_DIR } = parseArgs();

// Ensure base directory exists
async function ensureBaseDir() {
  try {
    await fs.access(BASE_DIR);
  } catch (error) {
    await fs.mkdir(BASE_DIR, { recursive: true });
    console.log(`Created directory: ${BASE_DIR}`);
  }
}

// Helper function to get safe file path
function getSafePath(requestPath) {
  const safePath = path.join(BASE_DIR, requestPath);
  // Prevent directory traversal attacks
  if (!safePath.startsWith(path.resolve(BASE_DIR))) {
    throw new Error('Invalid path');
  }
  return safePath;
}

// Handle directory listing
async function handleDir(res, dirPath) {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const listing = items.map(item => ({
      name: item.name,
      type: item.isDirectory() ? 'directory' : 'file',
      path: item.name
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ items: listing }));
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Directory not found' }));
  }
}

// Handle file reading
async function handleRead(res, filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'File not found' }));
  }
}

// Handle file writing
async function handleWrite(res, filePath, data) {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(filePath, data, 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'File written successfully' }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to write file' }));
  }
}

// Main request handler
async function handleRequest(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const requestPath = parsedUrl.pathname.substring(1) || ''; // Remove leading slash

  try {
    const safePath = getSafePath(requestPath);

    switch (req.method) {
      case 'GET':
        if (parsedUrl.query.action === 'dir') {
          await handleDir(res, safePath);
        } else {
          await handleRead(res, safePath);
        }
        break;

      case 'POST':
      case 'PUT':
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          await handleWrite(res, safePath, body);
        });
        break;

      case 'DELETE':
        try {
          await fs.unlink(safePath);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'File deleted successfully' }));
        } catch (error) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'File not found' }));
        }
        break;

      default:
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
}

// Start server
async function startServer() {
  await ensureBaseDir();

  const server = http.createServer(handleRequest);

  server.listen(PORT, () => {
    console.log(`File server running on http://localhost:${PORT}`);
    console.log(`Base directory: ${path.resolve(BASE_DIR)}`);
    console.log('\nAPI Usage:');
    console.log('- GET /path/to/file - Read file');
    console.log('- GET /path/to/dir?action=dir - List directory');
    console.log('- POST /path/to/file - Write file (body = content)');
    console.log('- PUT /path/to/file - Write file (body = content)');
    console.log('- DELETE /path/to/file - Delete file');
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  });
}

startServer().catch(console.error);