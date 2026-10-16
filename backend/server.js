//packages
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import {v2 as cloudinary} from "cloudinary";

//routes
import authRoutes from "./routes/auth.routes.js"; //always add .js at the end when using import, otherwise it will throw an error
import userRoutes from "./routes/user.routes.js";
import postRoutes from "./routes/post.routes.js";


//utility
import connectMongoDB from "./db/connectMongoDB.js";




dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); //middleware to parse JSON bodies of incoming requests (ie. make json usable as req.body in js)
app.use(express.urlencoded({ extended: true })); //middleware to parse URL-encoded bodies of incoming requests (ie. make form data usable as req.body in js)


app.use(cookieParser()); //middleware to parse cookies from incoming requests (ie. make cookies usable as req.cookies in js

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectMongoDB();
})