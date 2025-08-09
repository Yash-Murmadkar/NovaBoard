import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// const JWT_SECRET = process.env.JWT_SECRET;
// const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    // Don't send hashed password back
    const userSafe = { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt };

    return res.status(201).json({ user: userSafe, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    const userSafe = { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt };

    return res.status(200).json({ user: userSafe, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    // User is already attached to req by authMiddleware
    const userSafe = { 
      id: req.user._id, 
      name: req.user.name, 
      email: req.user.email, 
      createdAt: req.user.createdAt 
    };
    return res.status(200).json(userSafe);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
