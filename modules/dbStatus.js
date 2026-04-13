/*
  DB Status: Utilities for inspecting and reporting MongoDB connection state.
  Provides getConnectionCode(), getConnectionText(), and renderStatusPage() for
  the /status route and the API landing page.
*/

const mongoose = require("mongoose");

// Returns the current MongoDB connection state code
function getConnectionCode() {
  return mongoose.connection.readyState;
}

// Converts a connection state code to a human-readable string
const CONNECTION_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
function getConnectionText(code) {
  return CONNECTION_STATES[code] || 'unknown';
}

// Escapes HTML special characters to prevent XSS
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Builds and returns the full database status HTML page
async function renderStatusPage() {
  const conn = mongoose.connection;
  const connectionCode = getConnectionCode();
  const connectionText = getConnectionText(connectionCode);

  let databaseName = conn.name || "not connected";
  let collections = [];

  if (connectionCode === 1 && conn.db) {
    const collectionInfo = await conn.db.listCollections().toArray();
    collections = collectionInfo
      .map((c) => c.name)
      .sort((a, b) => a.localeCompare(b));
  }

  const collectionsHtml =
    collections.length > 0
      ? `<ul>${collections
          .map((name) => `<li>${escapeHtml(name)}</li>`)
          .join("")}</ul>`
      : "<p>No collections available.</p>";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Database Status</title>
  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
  <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <main class="container medium">
    <div class="card">
      <h1>Database Status</h1>

      <p><strong>Connection code:</strong> ${escapeHtml(connectionCode)}</p>
      <p><strong>Connection status:</strong> ${escapeHtml(connectionText)}</p>
      <p><strong>Database name:</strong> ${escapeHtml(databaseName)}</p>

      <h2>Collections</h2>
      ${collectionsHtml}
    </div>
  </main>
</body>
</html>`;
}

module.exports = {
  getConnectionCode,
  renderStatusPage
};
