import express from "express";
import authRoutes from "./routes/auth.routes.js"; //always add .js at the end when using import, otherwise it will throw an error
import dotenv from "dotenv";
import connectMongoDB from "./db/connectMongoDB.js";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); //middleware to parse JSON bodies of incoming requests (ie. make json usable as req.body in js)
app.use(express.urlencoded({ extended: true })); //middleware to parse URL-encoded bodies of incoming requests (ie. make form data usable as req.body in js)


app.use(cookieParser()); //middleware to parse cookies from incoming requests (ie. make cookies usable as req.cookies in js

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectMongoDB();
})