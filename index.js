require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const dbStatus = require("./modules/dbStatus");
const User = require("./models/User");

// Import API modules
const apiRoot = require("./api/index");
const userAPI = require("./api/user");
const instructorAPI = require("./api/instructor");
const customerAPI = require("./api/customer");
const packageAPI = require("./api/package");
const saleAPI = require("./api/sale");
const classAPI = require("./api/class");
const attendanceAPI = require("./api/attendance");

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

// Redirect root to the API landing page
app.get("/", (req, res) => {
  res.redirect("/api");
});

app.use(express.static(publicDir));

// Render the database status page
app.get("/status", async (req, res) => {
  try {
    const html = await dbStatus.renderStatusPage();
    res.send(html);
  } catch (err) {
    res.status(500).send(`Error building status page: ${err.message}`);
  }
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
async function ensureTestUsers() {
  const configuredPassword = process.env.TEST_USER_PASSWORD;
  if (!configuredPassword) {
    console.log("Skipping test account creation: TEST_USER_PASSWORD is not set.");
    return;
  }

  const testUsers = [
    {
      username: process.env.TEST_MANAGER_USERNAME || 'manager_test',
      role: 'manager',
      email: process.env.TEST_MANAGER_EMAIL || 'manager_test@yogitrack.local'
    },
    {
      username: process.env.TEST_INSTRUCTOR_USERNAME || 'instructor_test',
      role: 'instructor',
      email: process.env.TEST_INSTRUCTOR_EMAIL || 'instructor_test@yogitrack.local'
    }
  ];

  for (const account of testUsers) {
    const existing = await User.findOne({ username: account.username });
    if (existing) continue;

    const user = new User({
      username: account.username,
      password: configuredPassword,
      role: account.role,
      email: account.email
    });
    await user.save();
    console.log(`Created test account: ${account.username} (${account.role})`);
  }
}

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'yoga_hom',
      serverSelectionTimeoutMS: 5000
    });
    console.log("MongoDB connected");
    await ensureTestUsers();
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.error("App will start without database connectivity");
  }

  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
}

start();

