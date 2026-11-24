# X Clone

A full-stack social app inspired by X, written in JavaScript with MongoDB, Express, React, and Node.js (the MERN stack). Users can edit their profiles, publish posts with images and emoji, and like or comment on posts. The app includes notifications and separate feeds for all posts and posts from accounts they follow.

## Tech stack

- **React, React Router, and Vite** power the frontend. Tailwind CSS and daisyUI handle styling and components. React Icons provides icons, and React Hot Toast shows success and error messages.
- **TanStack Query** fetches and caches API data, then refreshes it after actions such as posting or following an account.
- **Node.js and Express** serve the REST API. MongoDB stores users, posts, and notifications, and Mongoose defines their data models.
- **JWTs in HTTP-only cookies** keep users signed in. bcryptjs hashes passwords, and Cloudinary stores post, profile, and cover images.
- **Postman, Playwright, and Node’s test runner** support manual API checks, browser tests, and backend tests. ESLint checks the JavaScript. See the [Postman scripting notes](instructions/).

## Run locally

Use Node.js 22.12 or newer. From the repository root, install the backend and frontend dependencies.

```sh
npm ci
npm ci --prefix frontend
```

Copy [`.env.example`](.env.example) to `.env` in the repository root. Add your MongoDB connection string, a random JWT secret, and your Cloudinary credentials. Keep `.env` private.

Run the backend and frontend in separate terminals from the repository root.

```sh
npm run dev
npm run dev --prefix frontend
```

Open `http://localhost:3000`. Vite forwards API requests to Express on port `5000`.

## Tests

```sh
npm test
npm run lint
npm run test:e2e --prefix frontend
```

`npm test` builds the frontend and runs the backend tests. Playwright tests the built app with mock API responses. On Windows, Playwright uses installed Microsoft Edge. On other platforms, run `npx playwright install chromium` from `frontend` before the browser tests.

## Deploy to Render

Create a [Render Web Service](https://render.com/docs/web-services) from the GitHub repository and leave the root directory blank. Express serves the built React app and the API from the same service.

- Set the build command to `npm run build`.
- Set the start command to `npm start`.

In the Render dashboard, set [`NODE_VERSION=22.x`](https://render.com/docs/node-version) and `NODE_ENV=production`. Add `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` using the values for your deployment. Allow the service to connect to MongoDB. Render provides `PORT`.
