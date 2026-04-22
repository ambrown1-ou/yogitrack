const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { renderTemplate } = require("../api_helpers/templateEngine");
const { getConnectionCode } = require("../api_helpers/dbStatus");
const { escapeHtml } = require("../api_helpers/routeFactory");

// GET / - Render the API landing page with DB status, collection record counts, and module links
router.get("/", async(req, res) => {
	// Check current MongoDB connection state
	const code = getConnectionCode();
	const statusTextMap = {
		0: 'Disconnected',
		1: 'Connected',
		2: 'Connecting',
		3: 'Disconnecting'
	};
	const statusText = statusTextMap[code] || 'Unknown';
	const statusColor = code === 1 ? 'green' : 'red';
	const dbName = mongoose.connection.name || 'not connected';
	const dbStatus = `<span style="color:${statusColor};font-weight:bold">${statusText}</span> - ${dbName}`;

	// Check if user is logged in
	const isLoggedIn = req.session?.username ? true : false;
	const loginUser = isLoggedIn
		 ? `${escapeHtml(req.session.username)} (${escapeHtml(req.session.role || 'unknown role')})`
		 : 'Not logged in';
	const loginStatusColor = isLoggedIn ? 'green' : '#555';
	const logoutLink = isLoggedIn
		 ? `<form method="POST" action="/api/user/logout" style="display:inline"><input type="hidden" name="_browserForm" value="1"><button type="submit" class="link-button">Logout</button></form>`
		 : '';
	const loginStatus = `<span style="color:${loginStatusColor};font-weight:bold">${loginUser}</span>${logoutLink}`;

	// Build module list for the landing page table
	const modules = [
    {
			name: "User",
			path: "/api/user",
			collection: "users",
			description: "Register, login, and manage authenticated session"
		}, {
			name: "Instructor",
			path: "/api/instructor",
			collection: "instructors",
			description: "Manage yoga instructors"
		}, {
			name: "Customer",
			path: "/api/customer",
			collection: "customers",
			description: "Manage customers"
		}, {
			name: "Package",
			path: "/api/package",
			collection: "packages",
			description: "Manage class packages"
		}, {
			name: "Sale",
			path: "/api/sale",
			collection: "sales",
			description: "Manage package purchases and payments"
		}, {
			name: "Class",
			path: "/api/class",
			collection: "classes",
			description: "Manage class schedule"
		}, {
			name: "Attendance",
			path: "/api/attendance",
			collection: "attendances",
			description: "Record and manage class attendance"
		}
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