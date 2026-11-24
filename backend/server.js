//packages
import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import {v2 as cloudinary} from "cloudinary";

//routes
import authRoutes from "./routes/auth.routes.js"; //always add .js at the end when using import, otherwise it will throw an error
import userRoutes from "./routes/user.routes.js";
import postRoutes from "./routes/post.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

//utility
import connectMongoDB from "./db/connectMongoDB.js";

dotenv.config();
process.env.NODE_ENV ||= "production";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

app.use(express.json({ limit:"5mb" })); //middleware to parse JSON bodies of incoming requests (ie. make json usable as req.body in js), and the limit shouldn't be too large to avoid DoS attacks
app.use(express.urlencoded({ extended: true })); //middleware to parse URL-encoded bodies of incoming requests (ie. make form data usable as req.body in js)


app.use(cookieParser()); //middleware to parse cookies from incoming requests (ie. make cookies usable as req.cookies in js

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", (req, res) => res.status(404).json({ error: "API route not found" }));
if (process.env.NODE_ENV === "production")
{
    app.use(express.static(path.join(__dirname, "/frontend/dist")));

    app.get("/{*splat}", (req, res) =>
    {
        res.sendFile(path.resolve(__dirname,"frontend", "dist", "index.html"));
    });
}


export const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectMongoDB();
})
// Keep API errors readable by the client, including invalid or oversized bodies.
app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 413 ? "Image is too large. Please use a smaller image." : status === 400 ? "Invalid request body" : "Internal server error" });
});
