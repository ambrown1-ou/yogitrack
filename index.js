require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const dbStatus = require("./api_helpers/dbStatus");
const { initializeCounters } = require("./api_helpers/idGenerator");
const User = require("./api_models/User");

// Import API modules
const apiRoot = require("./api_items/index");
const userAPI = require("./api_items/user");
const instructorAPI = require("./api_items/instructor");
const customerAPI = require("./api_items/customer");
const packageAPI = require("./api_items/package");
const saleAPI = require("./api_items/sale");
const classAPI = require("./api_items/class");
const attendanceAPI = require("./api_items/attendance");

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");

// Trust Heroku's reverse proxy for secure cookies
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'yogitrack-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redirect root to the app dashboard
app.get("/", (req, res) => {
  res.redirect("/app");
});

app.use(express.static(publicDir));

// Serve React app
app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "react_app", "index.html"));
});

app.use(express.static(path.join(__dirname, "react_app")));

// Render the database status page
app.get("/status", async (req, res) => {
  // Check if user is authenticated
  if (!req.session.userId) {
    return res.status(401).send('<h1>Authentication Required</h1><p>You must be logged in to view the database status. <a href="/app">Go to login</a></p>');
  }

  try {
    const html = await dbStatus.renderStatusPage();
    res.send(html);
  } catch (err) {
    res.status(500).send(`Error building status page: ${err.message}`);
  }
});

// Require authentication for all API routes except /api/user/login and /api/user/register
app.use("/api", (req, res, next) => {
  // Allow unauthenticated access to login and register endpoints
  if ((req.path === '/user/login' || req.path === '/user/register') && (req.method === 'POST' || req.method === 'GET')) {
    return next();
  }

  // Check if user is authenticated
  if (!req.session.userId) {
    // For browser requests, show login message
    if (req.accepts('html')) {
      return res.status(401).send('<h1>Authentication Required</h1><p>You must be logged in to access the API. <a href="/app">Go to login</a></p>');
    }
    // For API requests, return 401 error
    return res.status(401).json({
      success: false,
      results: [{ error: 'Authentication required. Please log in.' }],
      resultsType: 'error'
    });
  }

  next();
});

// Mount API modules
app.use("/api/user", userAPI);
app.use("/api", apiRoot);
app.use("/api/instructor", instructorAPI);
app.use("/api/customer", customerAPI);
app.use("/api/package", packageAPI);
app.use("/api/sale", saleAPI);
app.use("/api/class", classAPI);
app.use("/api/attendance", attendanceAPI);

// Connect to MongoDB and start the Express server
async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'yoga_hom',
      serverSelectionTimeoutMS: 5000
    });
    console.log("MongoDB connected");
    await initializeCounters();
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.error("App will start without database connectivity");
  }

  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
}

start();

