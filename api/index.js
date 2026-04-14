const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { renderTemplate } = require("../modules/templateEngine");
const { getConnectionCode } = require("../modules/dbStatus");
const { escapeHtml } = require("../modules/routeFactory");

// GET / - Render the API landing page with DB status, collection record counts, and module links
router.get("/", async (req, res) => {
  // Check current MongoDB connection state
  const code = getConnectionCode();
  const statusText = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' }[code] || 'Unknown';
  const statusColor = code === 1 ? 'green' : 'red';
  const dbName = mongoose.connection.name || 'not connected';
  const dbStatus = `<span style="color:${statusColor};font-weight:bold">${statusText}</span> - ${dbName}`;
  const loginUser = req.session?.username
    ? `${escapeHtml(req.session.username)} (${escapeHtml(req.session.role || 'unknown role')})`
    : 'Not logged in';
  const loginStatusColor = req.session?.username ? 'green' : '#555';
  const loginStatus = `<span style="color:${loginStatusColor};font-weight:bold">${loginUser}</span>`;

  // Build module list for the landing page table
  const modules = [
    { name: "User",       path: "/api/user",       collection: "users",       description: "Register, login, and manage authenticated session" },
    { name: "Instructor", path: "/api/instructor", collection: "instructors", description: "Manage yoga instructors" },
    { name: "Customer",   path: "/api/customer",   collection: "customers",   description: "Manage customers" },
    { name: "Package",    path: "/api/package",    collection: "packages",    description: "Manage class packages" },
    { name: "Sale",       path: "/api/sale",       collection: "sales",       description: "Manage package purchases and payments" },
    { name: "Class",      path: "/api/class",      collection: "classes",     description: "Manage class schedule" },
    { name: "Attendance", path: "/api/attendance", collection: "attendances", description: "Record and manage class attendance" }
  ];

  const moduleLinks = modules
    .map(module => {
      return `
      <tr>
        <td><strong>${module.name}</strong></td>
        <td>${module.description}</td>
        <td><a href="${module.path}">View Methods</a></td>
      </tr>`;
    })
    .join("");

  const html = renderTemplate('apiIndex', {
    moduleLinks,
    dbStatus,
    loginStatus
  });

  res.send(html);
});

module.exports = router;
