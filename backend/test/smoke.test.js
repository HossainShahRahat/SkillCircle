import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.CLIENT_URLS = 'http://localhost:5173';
process.env.JWT_SECRET = 'skillcircle-test-secret';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.STORAGE_MODE = 'simulated';
process.env.BODY_LIMIT = '15mb';
process.env.APP_BASE_URL = 'http://localhost:4000';
process.env.FORCE_HTTPS = 'false';

const { createHttpServer } = await import('../src/app.js');

async function startTestServer() {
  const { httpServer } = createHttpServer();
  await new Promise((resolve) => {
    httpServer.listen(0, '127.0.0.1', resolve);
  });

  const address = httpServer.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    async close() {
      await new Promise((resolve, reject) => {
        httpServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    },
  };
}

async function requestJson(baseUrl, path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  return { response, data };
}

test('health endpoint responds successfully', async () => {
  const server = await startTestServer();
  try {
    const { response, data } = await requestJson(server.baseUrl, '/api/health');
    assert.equal(response.status, 200);
    assert.equal(data.ok, true);
  } finally {
    await server.close();
  }
});

test('demo login works in local memory mode', async () => {
  const server = await startTestServer();
  try {
    const { response, data } = await requestJson(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      body: {
        email: 'maya@skillcircle.dev',
        password: 'password123',
      },
    });

    assert.equal(response.status, 200);
    assert.ok(data.token);
    assert.equal(data.user.email, 'maya@skillcircle.dev');
  } finally {
    await server.close();
  }
});

test('creating a post in an unjoined private circle is forbidden', async () => {
  const server = await startTestServer();
  try {
    const login = await requestJson(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      body: {
        email: 'maya@skillcircle.dev',
        password: 'password123',
      },
    });

    const { response, data } = await requestJson(server.baseUrl, '/api/posts', {
      method: 'POST',
      token: login.data.token,
      body: {
        content: 'Trying to post somewhere private',
        circleId: 'c_demo_2',
      },
    });

    assert.equal(response.status, 403);
    assert.match(data.message, /Join the circle/i);
  } finally {
    await server.close();
  }
});

test('liking or commenting on a missing post returns not found', async () => {
  const server = await startTestServer();
  try {
    const login = await requestJson(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      body: {
        email: 'maya@skillcircle.dev',
        password: 'password123',
      },
    });

    const token = login.data.token;

    const likeResult = await requestJson(server.baseUrl, '/api/posts/missing-post/like', {
      method: 'POST',
      token,
      body: {},
    });
    assert.equal(likeResult.response.status, 404);
    assert.match(likeResult.data.message, /Post not found/i);

    const commentResult = await requestJson(server.baseUrl, '/api/posts/missing-post/comments', {
      method: 'POST',
      token,
      body: { content: 'hello' },
    });
    assert.equal(commentResult.response.status, 404);
    assert.match(commentResult.data.message, /Post not found/i);
  } finally {
    await server.close();
  }
});
