import process from 'node:process';
import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    workers: 1,
    reporter: 'list',
    use: {
        baseURL: 'http://127.0.0.1:3100',
        browserName: 'chromium',
        channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),
        viewport: { width: 1280, height: 900 },
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: 'npm run preview -- --host 127.0.0.1 --port 3100 --strictPort',
        url: 'http://127.0.0.1:3100',
        reuseExistingServer: false,
    },
});
