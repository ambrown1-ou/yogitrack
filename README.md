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

## API Routes

- `/api/auth` - Authentication
- `/api/instructor` - Instructors
- `/api/customer` - Customers
- `/api/class` - Classes
- `/api/attendance` - Attendance
- `/api/package` - Packages
- `/api/sale` - Sales
- `/status` - Database status

## Endpoints

- `GET /` - Main application page
- `GET /status` - Database status and collections information

## Features

- Real-time MongoDB connection status
- Lists all available collections in the database
- Responsive web interface
- Security headers and crawler blocking
