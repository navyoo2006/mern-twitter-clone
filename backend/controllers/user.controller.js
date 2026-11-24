//packages
import bcryptjs from "bcryptjs";
import {v2 as cloudinary} from "cloudinary";

//models
import User from "../models/user.model.js"; 
import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import { PUBLIC_USER_FIELDS, ownUserResponse } from "../lib/utils/userFields.js";




export const getUserProfile = async (req, res) => 
{
    const {username} = req.params;

    try
    {
        const user = await User.findOne({username}).select(PUBLIC_USER_FIELDS);

        if (!user)
        {
            return res.status(404).json({error: "User not found"});
        }

        const postCount = await Post.countDocuments({ user: user._id });
        res.status(200).json({ ...user.toObject(), postCount });
    }

    catch (error)
    {
        console.log("Error in getUserProfile:", error.message);
        res.status(500).json({error: error.message});
        
    }
}

export const followUnfollowUser = async (req, res) =>
{
    try
    {
        const {id} = req.params; //id of the user to follow/unfollow

        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        if ( id === req.user._id.toString() )
        {
            return res.status(400).json({error: "You cannot follow/unfollow yourself"});
        }
        
        if (!userToModify || !currentUser)
        {
            return res.status(404).json({error: "User not found"});
        }

        const isFollowing = currentUser.following.some((followedId) => followedId.toString() === id);

        // Unfollow the user
        if (isFollowing)
        {
            //use pull to remove a follower from the array

            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });

            await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

            //TODO: Return the id of the user as a response


            return res.status(200).json({message: "User unfollowed successfully"});
        }

        // Follow
        else
        {
            //use push to add a follower to the array

            await User.findByIdAndUpdate(id, { $addToSet: { followers: req.user._id } });

            await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: id } });

            const newNotification = new Notification({
                type: "follow",
                from: req.user._id,
                to: userToModify._id,
            });

            await newNotification.save();
            
            //TODO: Return the id of the user as a response

            //send follow notification to the user being followed
            return res.status(200).json({message: "User followed successfully"});
        }

    }

    catch (error)
    {
        console.log("Error in followUnfollowUser:", error.message);

        res.status(500).json({error: error.message});
    }
}

export const getSuggestedUsers = async (req, res) =>
{
    try
    {
        const userId = req.user._id;

        const userFollowedByMe = await User.findById(userId).select("following");

        const users = await User.aggregate
        ([
            { 
                $match: 
                { 
                    _id: { $ne: userId } 
                } 
            },

            { 
                $sample: { size: 10 } 
            }

        ]);

        if (!userFollowedByMe) return res.status(404).json({ error: "User not found" });

        const filteredUsers = users.filter((user) => !userFollowedByMe.following.includes(user._id));
        
        const suggestedUsers = filteredUsers.slice(0, 4);

        const publicUsers = suggestedUsers.map((user) => Object.fromEntries(
            PUBLIC_USER_FIELDS.split(" ").filter((field) => field in user).map((field) => [field, user[field]])
        ));

        res.status(200).json(publicUsers);
    }

    catch(error)
    {
        console.log("Error in getSuggestedUsers:", error.message);
        res.status(500).json({error: error.message});
    }
}

// Extract Cloudinary IDs without deleting local defaults or unrelated remote images.
const imagePublicId = (image) => {
    if (!image) return null;
    try {
        const url = new URL(image);
        if (url.hostname !== "res.cloudinary.com") return null;
        const uploadPath = url.pathname.split("/upload/")[1];
        return uploadPath?.replace(/^v\d+\//, "").replace(/\.[^/.]+$/, "") || null;
    } catch {
        return null;
    }
};

export const updateUser = async (req, res) => {
    const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
    const uploadedImages = [];
    let saved = false;

    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: "User not found" });

        for (const [field, value] of Object.entries({ fullName, email, username, bio, link, currentPassword, newPassword })) {
            if (value !== undefined && typeof value !== "string") {
                return res.status(400).json({ error: `${field} must be text` });
            }
        }
        if (fullName !== undefined && !fullName.trim()) return res.status(400).json({ error: "Full name is required" });
        if (username !== undefined && !/^[a-zA-Z0-9_]{1,30}$/.test(username)) {
            return res.status(400).json({ error: "Username must contain 1-30 letters, numbers or underscores" });
        }
        if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }
        let normalizedLink = link?.trim();
        if (normalizedLink) {
            try {
                const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(normalizedLink) ? normalizedLink : `https://${normalizedLink}`);
                if (!["http:", "https:"].includes(url.protocol)) throw new Error();
                normalizedLink = url.href;
            } catch {
                return res.status(400).json({ error: "Link must be a valid HTTP or HTTPS URL" });
            }
        }

        if (Boolean(currentPassword) !== Boolean(newPassword)) {
            return res.status(400).json({ error: "Both the current and new passwords must be provided" });
        }
        if (currentPassword && newPassword) {
            if (!(await bcryptjs.compare(currentPassword, user.password))) {
                return res.status(400).json({ error: "Current password is incorrect" });
            }
            if (newPassword.length < 6) return res.status(400).json({ error: "New password must be at least 6 characters long" });
            user.password = await bcryptjs.hash(newPassword, 10);
        }

        for (const field of ["profileImg", "coverImg"]) {
            if (req.body[field] != null && typeof req.body[field] !== "string") {
                return res.status(400).json({ error: "Images must be image data or a URL" });
            }
        }
        const oldImages = [];
        for (const field of ["profileImg", "coverImg"]) {
            const image = req.body[field];
            if (image === undefined || image === null) continue;
            if (typeof image !== "string") return res.status(400).json({ error: "Images must be image data or a URL" });
            const oldId = imagePublicId(user[field]);
            if (image) {
                const uploaded = await cloudinary.uploader.upload(image);
                uploadedImages.push(uploaded.public_id);
                user[field] = uploaded.secure_url;
                if (oldId && oldId !== uploaded.public_id) oldImages.push(oldId);
            } else {
                user[field] = "";
                if (oldId) oldImages.push(oldId);
            }
        }
        if (fullName !== undefined) user.fullName = fullName.trim();
        if (email !== undefined) user.email = email.trim();
        if (username !== undefined) user.username = username;
        if (bio !== undefined) user.bio = bio;
        if (link !== undefined) user.link = normalizedLink;

        await user.save();
        saved = true;
        // Failed cleanup must not turn a successfully saved profile into an error.
        await Promise.allSettled(oldImages.map(async (id) => cloudinary.uploader.destroy(id)));
        return res.status(200).json(ownUserResponse(user));
    } catch (error) {
        if (!saved) await Promise.allSettled(uploadedImages.filter(Boolean).map(async (id) => cloudinary.uploader.destroy(id)));
        console.error("Error in updateUser:", error.message);
        if (error.code === 11000) return res.status(409).json({ error: "Username or email is already in use" });
        return res.status(500).json({ error: "Unable to update profile. Please try again." });
    }
};
