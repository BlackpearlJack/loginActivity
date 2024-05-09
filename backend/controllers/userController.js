import asyncHandler from "../middlewares/asynchandler.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import createToken from "../utils/createToken.js";

const createUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        res.status(400);
        throw new Error("Please fill all fields");
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error("User already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ username, email, password: hashedPassword });

    try {
        await newUser.save();
        createToken(res, newUser._id);
        
        res.status(201).json({
            _id: newUser._id, 
            username: newUser.username, 
            email: newUser.email, 
            isAdmin: newUser.isAdmin, 
            });

    } catch (error) {
        res.status(400);
        throw new Error("Invalid user data");        
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email});
    if (existingUser) {
        const isPasswordValid = await bcrypt.compare(
            password,
            existingUser.password
        )

        if (isPasswordValid) {
            createToken(res, existingUser._id);

            res.status(200).json({
                _id: existingUser._id,
                username: existingUser.username,
                email: existingUser.email,
                isAdmin: existingUser.isAdmin,
            });

            return; // Exit function after sending response
            
        }
    }
});

const logoutCurrentUser = asyncHandler(async (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
    });

    res.status(200).json({ message: "Logged out successfully" });
});

export { createUser, loginUser, logoutCurrentUser };