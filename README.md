# YogiTrack

A yoga studio management API built with Node.js, Express, and MongoDB.

## Features

- Instructor, customer, class, and attendance management
- Package and sale tracking
- Session-based authentication

## Setup

1. Install dependencies: `npm install`
2. Create a `.env` file:
   ```
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_secret
   PORT=3000
   ```
3. Start the server: `npm start`
- Password: value of `TEST_USER_PASSWORD`

There is no default password for test acccounts.
If `TEST_USER_PASSWORD` is not set, authentication fails.

## Required Modules

| Module | Purpose |
|---|---|
| `express` | Web framework for routing and middleware |
| `mongoose` | MongoDB object modeling for schema definition and database interaction |
| `bcryptjs` | Hashes and verifies user passwords before storing them |
| `express-session` | Maintains server-side login sessions across requests |
| `dotenv` | Loads environment variables from a `.env` file |
| `cors` | Adds Cross-Origin Resource Sharing headers for API access control |

## API Response Format

All POST endpoints return JSON in the following structure:

**Success:**
```json
{
  "success": true,
  "results": [],
  "resultsType": "array"
}
```

**Error:**
```json
{
  "success": false,
  "results": [{ "error": "Error detail" }],
  "resultsType": "error"
}
```

**Confirmation required** (e.g. duplicate record detected):
```json
{
  "success": false,
  "results": [{ "details": "...", "action": "/api/...", "formData": {} }],
  "resultsType": "confirmation"
}
```

To confirm, re-POST the `formData` object from `results[0]` to the `action` URL.

## API Routes

- `/api/user` - Manage Users
- `/api/instructor` - Instructors - IN PROGRESS
- `/api/customer` - Customers
- `/api/class` - Classes - IN PROGRESS
- `/api/attendance` - Attendance - IN PROGRESS
- `/api/package` - Packages
- `/api/sale` - Sales - IN PROGRESS

## Endpoints

- `GET /` - Main application page - IN PROGRESS
- `GET /status` - Database status and collections information

## Features

- Real-time MongoDB connection status
- Lists all available collections in the database
- Interactive API for development and testing
