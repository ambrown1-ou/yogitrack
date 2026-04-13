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
   TEST_USER_PASSWORD=
   TEST_MANAGER_USERNAME=manager_test
   TEST_INSTRUCTOR_USERNAME=instructor_test
   ```
3. Start the server: `npm start`

## Built-in Test Accounts

On startup, YogiTrack creates these test users if they do not already exist only when `TEST_USER_PASSWORD` is set:

- Manager: `manager_test`
- Instructor: `instructor_test`
- Password: value of `TEST_USER_PASSWORD`

There is no default password for test acccounts.
If `TEST_USER_PASSWORD` is not set, authentication fails.

## API Routes

- `/api/auth` - Authentication
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
