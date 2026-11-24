import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import mongoose from 'mongoose';

test('production serves the built site and deep links, with JSON API/body errors', async () => 
{
    const previousPort = process.env.PORT;
    const previousEnv = process.env.NODE_ENV;
    process.env.PORT = '0';
    process.env.NODE_ENV = 'production';
    // Never connect this smoke test to the real configured database.
    const connect = mock.method(mongoose, 'connect', async () => ({ connection: { host: 'test-database' } }));
    let server;
    try {
        ({ server } = await import('../server.js'));
        if (!server.listening) await once(server, 'listening');
        const base = `http://127.0.0.1:${server.address().port}`;
        for (const route of ['/', '/login', '/profile/demo']) {
            const res = await fetch(base + route);
            assert.equal(res.status, 200);
            assert.match(await res.text(), /<title>X Clone<\/title>/);
        }
        const favicon = await fetch(base + '/favicon.svg');
        assert.equal(favicon.status, 200);
        assert.match(favicon.headers.get('content-type'), /image\/svg\+xml/);
        const missing = await fetch(base + '/api/not-a-route');
        assert.equal(missing.status, 404);
        assert.deepEqual(await missing.json(), { error: 'API route not found' });
        const malformed = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{invalid' });
        assert.equal(malformed.status, 400);
        assert.deepEqual(await malformed.json(), { error: 'Invalid request body' });
    } finally {
        if (server) {
            server.closeAllConnections();
            await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
        }
        connect.mock.restore();
        if (previousPort === undefined) delete process.env.PORT; else process.env.PORT = previousPort;
        if (previousEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousEnv;
    }
});
