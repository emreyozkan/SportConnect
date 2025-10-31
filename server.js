import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import bcrypt from "bcrypt";
import User from "./models/user.js";
import Post from "./models/Post.js";
import http from "http";

dotenv.config();

const app = express();

app.set("view engine", "ejs");

app.use(
  cors({
    origin: "http://localhost:5100",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secretkey",
    resave: false,
    saveUninitialized: false,
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const user = await User.findById(req.session.userId).select("-password");
    if (!user) return res.redirect("/login");

    const rawSuggestedUsers = await User.aggregate([
      { $match: { _id: { $ne: user._id } } },
      { $sample: { size: 3 } },
      { $project: { password: 0 } }
    ]);

    const suggestedUsers = rawSuggestedUsers.map(suggestedUser => {
      const isFriend = user.friends && user.friends.includes(suggestedUser._id);
      const requestSent = user.friendRequestsSent && user.friendRequestsSent.includes(suggestedUser._id);
      return {
        ...suggestedUser,
        isFriend,
        requestSent
      };
    });

    const analytics = {
      totalUsers: await User.countDocuments(),
      activeToday: 10,
      mostPopularActivity: "Running"
    };

    const posts = [
      {
        id: 1,
        content: "Had a great run this morning!",
        author: {
          fullname: "John Doe",
          avatar: "/images/avatar1.png"
        },
        createdAt: "1 hour ago" 
      },
      {
        id: 2,
        content: "Loving the new yoga class at the gym.",
        author: {
          fullname: "Jane Smith",
          avatar: "/images/avatar2.png"
        },
        createdAt: "2 hours ago" 
      }
    ];

    const suggestedActivities = [
      { emoji: "🏃‍♂️", name: "Morning Run", date: "Today" },
      { emoji: "🧘‍♀️", name: "Yoga Session", date: "Tomorrow" },
      { emoji: "🚴‍♂️", name: "Cycling", date: "Next Week" }
    ];

    const upcomingEvents = [
      {
        emoji: "⚽",
        name: "Football Match",
        timeLeft: "2 days"
      },
      {
        emoji: "🏀",
        name: "Basketball Tournament",
        timeLeft: "5 days"
      },
      {
        emoji: "🎾",
        name: "Tennis Workshop",
        timeLeft: "1 week"
      }
    ];

    res.render("index", {
      user,
      suggestedUsers,
      analytics,
      posts,
      suggestedActivities,
      upcomingEvents
    });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.get("/activities", (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  res.render("activities");
});

app.get("/profile", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const user = await User.findById(req.session.userId).select("-password");
    if (!user) return res.redirect("/login");
    const posts = await Post.find({ author: req.session.userId }).populate("author", "-password");
    res.render("profile", { user, posts });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.post("/update-bio", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
  try {
    const { bio } = req.body;
    await User.findByIdAndUpdate(req.session.userId, { bio });
    res.redirect("/profile");
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/add-post", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
  try {
    const { content } = req.body;
    const newPost = new Post({
      content,
      author: req.session.userId,
      createdAt: new Date()
    });
    await newPost.save();
    const populatedPost = await newPost.populate("author", "-password");
    res.json(populatedPost);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { email, password, confirmPassword, fullname } = req.body;
    if (!email || !password || !confirmPassword || !fullname) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, fullname });
    await newUser.save();
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    req.session.userId = user._id;
    res.redirect("/");
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

const server = http.createServer(app);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5100;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});