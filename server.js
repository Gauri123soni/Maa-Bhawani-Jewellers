const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const port = process.env.PORT || 3000;
const rootDir = __dirname;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const subscribers = [];
const users = new Map();
const orders = new Map();
const rates = {
  gold24: 75000,
  gold22: 69000,
  gold18: 56500,
  silver: 90000,
  source: 'sample',
  updatedAt: new Date().toISOString()
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function parseBody(req, body) {
  if (req.headers['content-type']?.includes('application/json')) {
    return JSON.parse(body);
  }
  return Object.fromEntries(new URLSearchParams(body));
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;

  if (req.method === 'GET' && pathname === '/api/rates') {
    sendJson(res, 200, rates);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/rates') {
    readBody(req).then(body => {
      let data;
      try {
        data = parseBody(req, body);
      } catch {
        sendJson(res, 400, { success: false, message: 'Invalid request body.' });
        return;
      }

      const purity = String(data.purity || '24');
      const key = data.metal === 'silver' ? 'silver' : `gold${purity}`;
      const value = Number(data.rate);
      if (!Object.hasOwn(rates, key) || !Number.isFinite(value) || value <= 0) {
        sendJson(res, 400, { success: false, message: 'Enter a valid metal rate.' });
        return;
      }

      rates[key] = value;
      rates.source = 'admin';
      rates.updatedAt = new Date().toISOString();
      sendJson(res, 200, { success: true, message: 'Rate updated successfully.', rates });
    }).catch(() => {
      sendJson(res, 400, { success: false, message: 'Unable to read request body.' });
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/register') {
    readBody(req).then(body => {
      let data;
      try {
        data = parseBody(req, body);
      } catch {
        sendJson(res, 400, { success: false, message: 'Invalid request body.' });
        return;
      }

      const name = String(data.name || '').trim();
      const email = String(data.email || '').trim().toLowerCase();
      const password = String(data.password || '');
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
        sendJson(res, 400, { success: false, message: 'Enter your name, a valid email, and a password with at least 8 characters.' });
        return;
      }
      if (users.has(email)) {
        sendJson(res, 409, { success: false, message: 'An account with this email already exists.' });
        return;
      }

      const salt = crypto.randomBytes(16);
      const passwordHash = crypto.scryptSync(password, salt, 64);
      users.set(email, { name, salt, passwordHash });
      sendJson(res, 201, { success: true, user: { name, email }, message: 'Account created. You can now sign in.' });
    }).catch(() => sendJson(res, 400, { success: false, message: 'Unable to read request body.' }));
    return;
  }

  if (req.method === 'POST' && pathname === '/api/login') {
    readBody(req).then(body => {
      let data;
      try {
        data = parseBody(req, body);
      } catch {
        sendJson(res, 400, { success: false, message: 'Invalid request body.' });
        return;
      }

      const email = String(data.email || '').trim().toLowerCase();
      const password = String(data.password || '');
      const user = users.get(email);
      if (!user) {
        sendJson(res, 401, { success: false, message: 'Email or password is incorrect.' });
        return;
      }

      const attemptedHash = crypto.scryptSync(password, user.salt, 64);
      if (!crypto.timingSafeEqual(user.passwordHash, attemptedHash)) {
        sendJson(res, 401, { success: false, message: 'Email or password is incorrect.' });
        return;
      }
      sendJson(res, 200, { success: true, user: { name: user.name, email }, message: 'Signed in successfully.' });
    }).catch(() => sendJson(res, 400, { success: false, message: 'Unable to read request body.' }));
    return;
  }

  if (req.method === 'POST' && pathname === '/api/orders') {
    readBody(req).then(body => {
      let data;
      try {
        data = parseBody(req, body);
      } catch {
        sendJson(res, 400, { success: false, message: 'Invalid request body.' });
        return;
      }

      if (!Array.isArray(data.items) || data.items.length === 0) {
        sendJson(res, 400, { success: false, message: 'Your cart is empty.' });
        return;
      }

      const items = data.items.map(item => ({
        id: String(item.id || ''),
        name: String(item.name || '').trim(),
        category: String(item.category || 'Jewellery'),
        image: String(item.image || ''),
        price: Number(item.price),
        quantity: Number(item.quantity || 1)
      }));
      if (items.some(item => !item.name || !Number.isFinite(item.price) || item.price < 0 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
        sendJson(res, 400, { success: false, message: 'Cart contains an invalid item.' });
        return;
      }

      const orderCode = `MBJ-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const order = {
        orderCode,
        customer: String(data.customer || 'Guest').trim().slice(0, 100),
        email: String(data.email || '').trim().slice(0, 254),
        status: 'Confirmed',
        createdAt: new Date().toISOString(),
        items,
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      };
      orders.set(orderCode, order);
      sendJson(res, 201, { success: true, order });
    }).catch(() => sendJson(res, 400, { success: false, message: 'Unable to read request body.' }));
    return;
  }

  const orderCode = pathname.startsWith('/api/orders/')
    ? decodeURIComponent(pathname.slice('/api/orders/'.length))
    : pathname === '/api/order' ? reqUrl.searchParams.get('code') : null;
  if (req.method === 'GET' && orderCode !== null) {
    const order = orders.get(orderCode);
    if (!order) {
      sendJson(res, 404, { success: false, message: 'Order not found.' });
      return;
    }
    sendJson(res, 200, { success: true, order, ...order });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/subscribe') {
    readBody(req).then(body => {
      try {
        const data = JSON.parse(body);
        const email = data.email?.trim();

        if (!email || !email.includes('@')) {
          sendJson(res, 400, { success: false, message: 'Please provide a valid email.' });
          return;
        }

        if (!subscribers.includes(email)) {
          subscribers.push(email);
        }

        sendJson(res, 200, { success: true, message: `Thank you for subscribing, ${email}!` });
      } catch {
        sendJson(res, 400, { success: false, message: 'Invalid request body.' });
      }
    }).catch(() => {
      sendJson(res, 400, { success: false, message: 'Unable to read request body.' });
    });

    return;
  }

  if (req.method === 'GET' && pathname === '/api/subscribers') {
    sendJson(res, 200, { count: subscribers.length, subscribers });
    return;
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Invalid URL path');
    return;
  }
  const filePath = path.resolve(rootDir, `.${decodedPath}`);
  if (filePath !== rootDir && !filePath.startsWith(`${rootDir}${path.sep}`)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('File not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
