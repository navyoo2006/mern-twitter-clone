import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { ownUserResponse } from "../lib/utils/userFields.js";

export const signup = async (req, res) => {
    try
    {
        const { fullName, username, email, password } = req.body; //take info from the request body
        if (![fullName, username, email, password].every((value) => typeof value === "string" && value.trim())) {
            return res.status(400).json({ error: "All fields are required" });
        }
        if (!/^[a-zA-Z0-9_]{1,30}$/.test(username)) return res.status(400).json({ error: "Username must contain 1-30 letters, numbers or underscores" });
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //check if the emails valid

        if (!emailRegex.test(email))
        {
            return res.status(400).json({ error: "Invalid email format" });
        }

        const existingUser = await User.findOne({ username}); //check if the username already exists in the database
        if(existingUser)
        {
            return res.status(400).json({ error: "Username already exists" });
        }

        const existingEmail = await User.findOne({ email }); //check if email exists
        if(existingEmail)
        {
            return res.status(400).json({ error: "Email already exists" });
        }

        
        if (password.length < 6)
        {
            return res.status(400).json({ error: "Password must be at least 6 characters long"});
        }

        // hash the password before saving to the database (for security reasons)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt); //hide the password so the plain password isnt stored in the database

        const newUser = new User({
            fullName,
            username,
            email,
            password: hashedPassword,
        });

        if (newUser)
        {
            await newUser.save();
            generateTokenAndSetCookie(newUser._id, res);
            return res.status(201).json(ownUserResponse(newUser));
        }
        else
        {
            return res.status(400).json({ error: "Invalid user data" });
        }

    } 

    catch (error)
    {
        console.log("Error in signup controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const login = async (req, res) => {
    try
    {
        const {username, password} = req.body;
        if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }
        const user = await User.findOne({username});
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || ""); //compare the password from the request body with the hashed password in the database to ensure that it's correct 

        if (!user || !isPasswordCorrect)
        {
            return res.status(400).json({error: "Invalid username or password"});
        }

        generateTokenAndSetCookie(user._id, res);

        return res.status(200).json(ownUserResponse(user));

    }
    catch(error)
    {
        console.log("Error in login controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const logout = async (req, res) => 
{
    try
    {
        res.cookie("jwt", "", {maxAge:0});
        res.status(200).json({message: "Logged out successfully"});
    }

    catch(error)
    {
        console.log("Error in logout controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}


export const getMe = async (req, res) => 
{
    try
    {
        const user = await User.findById(req.user._id).select("-password"); //find the user by id and exclude the password field
        res.status(200).json(user);
    }

    catch(error)
    {
        console.log("Error in getMe controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}