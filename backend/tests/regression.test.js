import { afterEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import User from '../models/user.model.js';
import Post from '../models/post.model.js';
import Notification from '../models/notification.model.js';
import { v2 as cloudinary } from 'cloudinary';
import { getUserProfile, getSuggestedUsers, followUnfollowUser, updateUser } from '../controllers/user.controller.js';
import { createPost, deletePost, getAllPosts, getLikedPosts } from '../controllers/post.controller.js';
import { signup, login } from '../controllers/auth.controller.js';
import bcrypt from 'bcryptjs';
import { protectRoute } from '../middleware/protectRoute.js';
import { generateTokenAndSetCookie } from '../lib/utils/generateToken.js';
import { PUBLIC_USER_FIELDS } from '../lib/utils/userFields.js';

const userId = '507f1f77bcf86cd799439011';
const targetId = '507f1f77bcf86cd799439012';
const response = () => ({
    count: 0,
    status(code) { this.code = code; return this; },
    json(data) { assert.equal(++this.count, 1, 'only one response may be sent'); this.data = data; return this; },
});
const userDocument = () => new User({ _id: userId, fullName: 'Demo User', username: 'demo', email: 'private@example.test', password: 'original-hash', bio: 'Old bio', link: 'https://example.test' });
afterEach(() => mock.restoreAll());

test('profile count filters by author and public responses exclude private fields', async () => {
    mock.method(User, 'findOne', () => ({ select(fields) {
        assert.equal(fields, PUBLIC_USER_FIELDS);
        return Promise.resolve(new User({ _id: userId, username: 'demo' }));
    } }));
    mock.method(Post, 'countDocuments', async (filter) => {
        assert.deepEqual(filter, { user: new User({ _id: userId })._id });
        return 1;
    });
    const res = response();
    await getUserProfile({ params: { username: 'demo' } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.data.postCount, 1);
    assert.equal(res.data.email, undefined);
    assert.equal(res.data.password, undefined);
});

test('suggestions only expose public fields and exclude followed accounts', async () => {
    mock.method(User, 'findById', () => ({ select: async () => ({ following: [targetId] }) }));
    mock.method(User, 'aggregate', async () => [{ _id: targetId }, { _id: userId, username: 'public', email: 'private@example.test', password: 'hash' }]);
    const res = response();
    await getSuggestedUsers({ user: { _id: userId } }, res);
    assert.equal(res.data.length, 1);
    assert.deepEqual(Object.keys(res.data[0]).sort(), ['_id', 'username']);
});

for (const following of [false, true]) {
    test(`${following ? 'unfollow' : 'follow'} sends one response and updates both accounts`, async () => {
        const writes = [];
        mock.method(User, 'findById', async (id) => id === targetId ? { _id: targetId } : { following: following ? [targetId] : [] });
        mock.method(User, 'findByIdAndUpdate', async (...args) => writes.push(args));
        mock.method(Notification.prototype, 'save', async function () { return this; });
        const res = response();
        await followUnfollowUser({ params: { id: targetId }, user: { _id: userId } }, res);
        assert.equal(res.code, 200);
        assert.equal(res.count, 1);
        assert.equal(writes.length, 2);
        assert.ok(writes.every(([, update]) => following ? update.$pull : update.$addToSet));
    });
}

test('bio and link can be cleared without changing other fields or exposing the hash', async () => {
    const user = userDocument();
    mock.method(User, 'findById', async () => user);
    mock.method(user, 'save', async () => user);
    const res = response();
    await updateUser({ user: { _id: userId }, body: { bio: '', link: '' } }, res);
    assert.equal(res.code, 200);
    assert.equal(user.bio, '');
    assert.equal(user.link, '');
    assert.equal(user.username, 'demo');
    assert.equal(user.password, 'original-hash');
    assert.equal(res.data.password, undefined);
});

test('unsafe links are rejected before saving', async () => {
    mock.method(User, 'findById', async () => userDocument());
    const res = response();
    await updateUser({ user: { _id: userId }, body: { link: 'javascript:alert(1)' } }, res);
    assert.equal(res.code, 400);
});

test('failed second upload preserves existing images and cleans up the new first upload', async () => {
    const user = userDocument();
    user.profileImg = 'https://res.cloudinary.com/demo/image/upload/v1/old-avatar.png';
    user.coverImg = 'https://res.cloudinary.com/demo/image/upload/v1/old-cover.png';
    mock.method(User, 'findById', async () => user);
    const save = mock.method(user, 'save', async () => user);
    let uploadCount = 0;
    mock.method(cloudinary.uploader, 'upload', async () => {
        if (++uploadCount === 2) throw new Error('upload failed');
        return { public_id: 'new-avatar', secure_url: 'https://example.test/new.png' };
    });
    const destroy = mock.method(cloudinary.uploader, 'destroy', async () => ({}));
    const res = response();
    await updateUser({ user: { _id: userId }, body: { profileImg: 'data-avatar', coverImg: 'data-cover' } }, res);
    assert.equal(res.code, 500);
    assert.equal(save.mock.callCount(), 0);
    assert.deepEqual(destroy.mock.calls.map((call) => call.arguments[0]), ['new-avatar']);
});

test('old image is removed only after save; cleanup failure does not fail a saved update', async () => {
    const user = userDocument();
    user.profileImg = 'https://res.cloudinary.com/demo/image/upload/v1/folder/old-avatar.png';
    let saved = false;
    mock.method(User, 'findById', async () => user);
    mock.method(user, 'save', async () => { saved = true; return user; });
    mock.method(cloudinary.uploader, 'upload', async () => ({ public_id: 'new-avatar', secure_url: 'https://example.test/new.png' }));
    mock.method(cloudinary.uploader, 'destroy', async (id) => { assert.equal(saved, true); assert.equal(id, 'folder/old-avatar'); throw new Error('cleanup failed'); });
    const res = response();
    await updateUser({ user: { _id: userId }, body: { profileImg: 'new-data' } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.data.profileImg, 'https://example.test/new.png');
});

test('duplicate username reports a conflict and rolls back new storage uploads', async () => {
    const user = userDocument();
    mock.method(User, 'findById', async () => user);
    mock.method(user, 'save', async () => { throw Object.assign(new Error('duplicate'), { code: 11000 }); });
    mock.method(cloudinary.uploader, 'upload', async () => ({ public_id: 'new-avatar', secure_url: 'https://example.test/new.png' }));
    const destroy = mock.method(cloudinary.uploader, 'destroy', async () => ({}));
    const res = response();
    await updateUser({ user: { _id: userId }, body: { username: 'taken', profileImg: 'new-data' } }, res);
    assert.equal(res.code, 409);
    assert.deepEqual(destroy.mock.calls[0].arguments, ['new-avatar']);
});

test('delete errors return JSON without throwing another error', async () => {
    mock.method(Post, 'findById', async () => { throw new Error('database unavailable'); });
    const res = response();
    await deletePost({ params: { id: targetId } }, res);
    assert.equal(res.code, 500);
    assert.deepEqual(res.data, { error: 'Internal Server Error' });
});

test('feeds populate only public author/commenter fields and likes filter by the viewed user', async () => {
    mock.method(User, 'findById', async () => ({ _id: userId, likedPosts: [targetId] }));
    const filters = [];
    const selections = [];
    mock.method(Post, 'find', (filter) => {
        filters.push(filter);
        const query = { sort() { return this; }, populate(options) { selections.push(options.select); return this; }, then(resolve) { return Promise.resolve([]).then(resolve); } };
        return query;
    });
    await getAllPosts({}, response());
    await getLikedPosts({ params: { id: userId } }, response());
    assert.deepEqual(filters[1], { likes: userId });
    assert.equal(selections.length, 4);
    assert.ok(selections.every((fields) => fields === PUBLIC_USER_FIELDS));
});

test('empty/whitespace posts are rejected and emoji-only posts are accepted', async () => {
    mock.method(User, 'findById', async () => ({ _id: userId }));
    mock.method(Post.prototype, 'save', async function () { return this; });
    for (const [text, code] of [['', 400], ['  \n ', 400], ['\u{1f600}', 201]]) {
        const res = response();
        await createPost({ user: { _id: userId }, body: { text } }, res);
        assert.equal(res.code, code);
        if (code === 400) assert.equal(res.data.error, 'Post must have text, emoji or an image');
    }
});

test('malformed signup and invalid JWT return client errors', async () => {
    const signupRes = response();
    await signup({ body: {} }, signupRes);
    assert.equal(signupRes.code, 400);
    const authRes = response();
    await protectRoute({ cookies: { jwt: 'invalid' } }, authRes, () => assert.fail('invalid JWT must not authenticate'));
    assert.equal(authRes.code, 401);
});

test('cookies use Secure in production and permit HTTP development', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.JWT_SECRET;
    try {
        process.env.JWT_SECRET = 'test-only-secret';
        for (const [env, expected] of [['development', false], ['production', true]]) {
            process.env.NODE_ENV = env;
            generateTokenAndSetCookie(userId, { cookie(name, token, options) { assert.equal(name, 'jwt'); assert.equal(options.secure, expected); assert.equal(options.httpOnly, true); } });
        }
    } finally {
        if (originalEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalEnv;
        if (originalSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = originalSecret;
    }
});

test('signup returns complete own profile data without the password hash', async () => {
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-only-secret';
    try {
        mock.method(User, 'findOne', async () => null);
        mock.method(User.prototype, 'save', async function () { return this; });
        const res = response();
        res.cookie = () => {};
        await signup({ body: { fullName: 'Demo User', username: 'new_demo', email: 'demo@example.test', password: 'test-password' } }, res);
        assert.equal(res.code, 201);
        assert.equal(res.data.bio, '');
        assert.equal(res.data.link, '');
        assert.equal(res.data.email, 'demo@example.test');
        assert.equal(res.data.password, undefined);
    } finally {
        if (originalSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = originalSecret;
    }
});

test('failed signup save never issues an authentication cookie', async () => {
    mock.method(User, 'findOne', async () => null);
    mock.method(User.prototype, 'save', async () => { throw new Error('save failed'); });
    const res = response();
    res.cookie = () => assert.fail('failed account creation must not authenticate');
    await signup({ body: { fullName: 'Demo User', username: 'new_demo', email: 'demo@example.test', password: 'test-password' } }, res);
    assert.equal(res.code, 500);
});

test('valid login returns the complete own profile and excludes the password hash', async () => {
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-only-secret';
    try {
        const user = userDocument();
        user.password = await bcrypt.hash('test-password', 4);
        mock.method(User, 'findOne', async () => user);
        const res = response();
        let cookieSet = false;
        res.cookie = () => { cookieSet = true; };
        await login({ body: { username: 'demo', password: 'test-password' } }, res);
        assert.equal(res.code, 200);
        assert.equal(cookieSet, true);
        assert.equal(res.data.bio, 'Old bio');
        assert.equal(res.data.password, undefined);
    } finally {
        if (originalSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = originalSecret;
    }
});
