import { test, expect } from '@playwright/test';

const firstId = '507f1f77bcf86cd799439011';
const secondId = '507f1f77bcf86cd799439012';

// Isolated API fixtures: browser checks never modify real accounts or Cloudinary.
async function mockApi(page) {
    const users = [
        { _id: firstId, username: 'adrian', fullName: 'Adrian Foster', email: 'adrian@example.test', bio: 'Running, gaming, and trying to keep my plants alive.', link: 'https://example.test/adrian', followers: [], following: [], profileImg: '', coverImg: '', createdAt: '2026-01-15T12:00:00Z' },
        { _id: secondId, username: 'maya', fullName: 'Maya Bennett', email: 'maya@example.test', bio: 'Coffee and weekend walks.', link: '', followers: [], following: [], profileImg: '', coverImg: '', createdAt: '2026-01-15T12:00:00Z' },
    ];
    const state = {
        active: users[0], users,
        posts: [
            { _id: 'post-a', text: 'My first project update', user: users[0], likes: [firstId], comments: [], createdAt: '2026-11-18T12:00:00Z' },
            { _id: 'post-b', text: 'A walk around the city', user: users[1], likes: [firstId], comments: [], createdAt: '2026-11-18T12:00:00Z' },
        ],
        notifications: { [firstId]: [{ _id: 'notification-a', type: 'follow', from: { username: 'private_a_actor' } }], [secondId]: [] },
    };
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) pageErrors.push(message.text());
    });
    await page.route('**/api/**', async (route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname;
        const method = request.method();
        const body = method === 'POST' ? request.postDataJSON() ?? {} : {};
        const reply = (data, status = 200) => route.fulfill({ status, json: data });
        if (path === '/api/auth/me') return state.active ? reply(state.active) : reply({ error: 'Unauthorized' }, 401);
        if (path === '/api/auth/logout') { state.active = null; return reply({ message: 'Logged out' }); }
        if (path === '/api/auth/login') { state.active = users.find((user) => user.username === body.username); return state.active ? reply(state.active) : reply({ error: 'Invalid username or password' }, 400); }
        if (path === '/api/auth/signup') {
            state.active = { ...users[0], ...body, _id: 'new-user', bio: '', link: '', following: [], followers: [] };
            users.push(state.active);
            return reply(state.active, 201);
        }
        if (path === '/api/users/suggested') return reply(users.filter((user) => user._id !== state.active?._id && !state.active?.following.includes(user._id)));
        if (path.startsWith('/api/users/profile/')) {
            const user = users.find((item) => item.username === decodeURIComponent(path.split('/').pop()));
            return user ? reply({ ...user, postCount: state.posts.filter((post) => post.user._id === user._id).length }) : reply({ error: 'User not found' }, 404);
        }
        if (path === '/api/users/update') { Object.assign(state.active, body); return reply(state.active); }
        if (path.startsWith('/api/users/follow/')) {
            const target = users.find((user) => user._id === path.split('/').pop());
            if (state.active.following.includes(target._id)) {
                state.active.following = state.active.following.filter((id) => id !== target._id);
                target.followers = target.followers.filter((id) => id !== state.active._id);
            } else {
                state.active.following.push(target._id); target.followers.push(state.active._id);
            }
            return reply({ message: 'Updated following' });
        }
        if (path === '/api/notifications') {
            if (method === 'DELETE') { state.notifications[state.active._id] = []; return reply({ message: 'Cleared' }); }
            return reply(state.notifications[state.active._id] ?? []);
        }
        if (path === '/api/posts/create') {
            if (!body.text?.trim() && !body.img) return reply({ error: 'Post must have text, emoji or an image' }, 400);
            state.posts.unshift({ _id: 'new-post', ...body, user: state.active, likes: [], comments: [], createdAt: new Date().toISOString() });
            return reply(state.posts[0], 201);
        }
        if (path.startsWith('/api/posts/like/')) {
            const post = state.posts.find((item) => item._id === path.split('/').pop());
            post.likes = post.likes.includes(state.active._id) ? post.likes.filter((id) => id !== state.active._id) : [...post.likes, state.active._id];
            return reply(post.likes);
        }
        if (path.startsWith('/api/posts/comment/')) {
            const post = state.posts.find((item) => item._id === path.split('/').pop());
            post.comments.push({ _id: 'new-comment', text: body.text, user: state.active });
            return reply(post);
        }
        if (path.startsWith('/api/posts/') && method === 'DELETE') { state.posts = state.posts.filter((post) => post._id !== path.split('/').pop()); return reply({ message: 'Deleted' }); }
        if (path === '/api/posts/all') return reply(state.posts);
        if (path === '/api/posts/following') return reply(state.posts.filter((post) => state.active.following.includes(post.user._id)));
        if (path.startsWith('/api/posts/user/')) return reply(state.posts.filter((post) => post.user.username === decodeURIComponent(path.split('/').pop())));
        if (path.startsWith('/api/posts/likes/')) return reply(state.posts.filter((post) => post.likes.includes(path.split('/').pop())));
        return reply({ error: 'Unknown test endpoint' }, 404);
    });
    return { state, pageErrors };
}

test('profile count includes authored posts only and updates after creating and deleting', async ({ page }) => {
    const { pageErrors } = await mockApi(page);
    await page.goto('/profile/adrian');
    await expect(page.getByText('1 post', { exact: true })).toBeVisible();
    await page.getByText('Likes', { exact: true }).click();
    await expect(page.getByText('A walk around the city', { exact: true })).toBeVisible();
    await expect(page.getByText('1 post', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Home', exact: true }).click();
    await page.getByPlaceholder('What is happening?!').fill('Another project update');
    await page.getByRole('button', { name: 'Post', exact: true }).click();
    await expect(page.getByText('Another project update', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Profile', exact: true }).click();
    await expect(page.getByText('2 posts', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Delete post', exact: true }).first().click();
    await expect(page.getByText('1 post', { exact: true })).toBeVisible();
    expect(pageErrors).toEqual([]);
});

test('notification hamburger has pointer cursor and a dark working menu; navigation text is white', async ({ page }) => {
    const { pageErrors } = await mockApi(page);
    await page.goto('/notifications');
    const menu = page.getByLabel('Notification menu');
    await expect(menu).toHaveCSS('cursor', 'pointer');
    await menu.click();
    const action = page.getByRole('button', { name: 'Delete all notifications' });
    await expect(action).toBeVisible();
    await expect(action.locator('xpath=../..')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await page.screenshot({ path: 'test-results/notification-menu.png', fullPage: true });
    await expect(page.getByRole('link', { name: 'Home', exact: true })).toHaveCSS('color', 'rgb(255, 255, 255)');
    await action.click();
    await expect(page.getByText('No notifications', { exact: true })).toBeVisible();
    expect(pageErrors).toEqual([]);
});

test('emoji selection replaces selected text and blank posts show the exact validation message', async ({ page }) => {
    const { pageErrors } = await mockApi(page);
    await page.goto('/');
    const composer = page.getByPlaceholder('What is happening?!');
    await composer.fill('Hello world');
    await composer.evaluate((element) => element.setSelectionRange(6, 11));
    await page.getByRole('button', { name: 'Add emoji', exact: true }).click();
    await page.getByRole('button', { name: 'Rocket', exact: true }).click();
    await expect(composer).toHaveValue('Hello 🚀');
    await expect(composer).toBeFocused();
    await composer.fill('');
    await page.getByRole('button', { name: 'Post', exact: true }).click();
    await expect(page.getByText('Post must have text, emoji or an image', { exact: true })).toBeVisible();
    expect(pageErrors).toEqual([]);
});

test('profile bio grows, fields clear, link is correct, close button works, and renaming navigates', async ({ page }) => {
    const { pageErrors } = await mockApi(page);
    await page.goto('/profile/adrian');
    await expect(page.getByRole('link', { name: 'https://example.test/adrian', exact: true })).toHaveAttribute('href', 'https://example.test/adrian');
    await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
    const bio = page.getByPlaceholder('Bio', { exact: true });
    const initial = await bio.boundingBox();
    await bio.fill('A full paragraph about this project.\n'.repeat(15));
    expect((await bio.boundingBox()).height).toBeGreaterThan(initial.height);
    await page.getByRole('button', { name: 'Close update profile' }).click();
    await expect(bio).not.toBeVisible();
    await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
    await bio.fill('');
    await page.getByPlaceholder('Link', { exact: true }).fill('');
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Running, gaming, and trying to keep my plants alive.', { exact: true })).not.toBeVisible();
    await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
    await page.getByPlaceholder('Username', { exact: true }).fill('adrian_new');
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await expect(page).toHaveURL(/\/profile\/adrian_new$/);
    await expect(page.getByText('1 post', { exact: true })).toBeVisible();
    expect(pageErrors).toEqual([]);
});

test('following refreshes profile follower counts', async ({ page }) => {
    const { pageErrors } = await mockApi(page);
    await page.goto('/profile/maya');
    await page.getByRole('button', { name: 'Follow', exact: true }).first().click();
    await expect(page.getByRole('button', { name: 'Unfollow', exact: true })).toBeVisible();
    await expect(page.getByText('Followers', { exact: true }).locator('..')).toContainText('1');
    await page.getByRole('button', { name: 'Unfollow', exact: true }).click();
    await expect(page.getByText('Followers', { exact: true }).locator('..')).toContainText('0');
    expect(pageErrors).toEqual([]);
});

test('logout and account switching do not reuse another account notifications', async ({ page }) => {
    const { pageErrors } = await mockApi(page);
    await page.goto('/notifications');
    await expect(page.getByText('@private_a_actor', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Log out', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.getByPlaceholder('Username', { exact: true }).fill('maya');
    await page.getByPlaceholder('Password', { exact: true }).fill('test-only-password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.getByRole('link', { name: 'Notifications', exact: true }).click();
    await expect(page.getByText('No notifications', { exact: true })).toBeVisible();
    await expect(page.getByText('@private_a_actor', { exact: true })).not.toBeVisible();
    expect(pageErrors).toEqual([]);
});

test('small screens and profile modal remain usable without horizontal overflow', async ({ page }) => {
    const { pageErrors } = await mockApi(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/profile/adrian');
    await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
    await expect(page.getByPlaceholder('Link', { exact: true })).toBeVisible();
    await expect(page.locator('#edit_profile_modal .modal-box')).toHaveCSS('opacity', '1');
    await expect(page.locator('#edit_profile_modal .modal-box')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/mobile-profile.png', fullPage: true });
    expect(pageErrors).toEqual([]);
});

test('signup renders the feed without a browser error', async ({ page }) => {
    const { state, pageErrors } = await mockApi(page);
    state.active = null;
    await page.goto('/signup');
    await page.getByPlaceholder('Email', { exact: true }).fill('new@example.test');
    await page.getByPlaceholder('Username', { exact: true }).fill('new_demo');
    await page.getByPlaceholder('Full Name', { exact: true }).fill('New Demo');
    await page.getByPlaceholder('Password', { exact: true }).fill('test-only-password');
    await page.getByRole('button', { name: 'Sign up', exact: true }).click();
    await expect(page.getByPlaceholder('What is happening?!')).toBeVisible();
    expect(pageErrors).toEqual([]);
});

test('a profile update completing after logout cannot restore the old session', async ({ page }) => {
    const { state, pageErrors } = await mockApi(page);
    let release;
    const pending = new Promise((resolve) => { release = resolve; });
    await page.route('**/api/users/update', async (route) => {
        const savedUser = { ...state.active, ...route.request().postDataJSON() };
        await pending;
        await route.fulfill({ json: savedUser });
    });
    await page.goto('/profile/adrian');
    await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
    await page.getByPlaceholder('Bio', { exact: true }).fill('A pending update');
    const request = page.waitForRequest('**/api/users/update');
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await request;
    await page.getByRole('button', { name: 'Close update profile' }).click();
    await page.getByRole('button', { name: 'Log out', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    const response = page.waitForResponse('**/api/users/update');
    release();
    await response;
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    expect(pageErrors).toEqual([]);
});
