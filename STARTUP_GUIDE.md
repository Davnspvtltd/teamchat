# Enterprise Chat Application - Startup Guide

This guide will help you set up and run the Enterprise Chat Application on your local machine. The application is built using Node.js for the backend and React for the frontend, with PostgreSQL as the database.

## Prerequisites

Before getting started, make sure you have the following installed on your system:

- Node.js (version 16 or higher)
- npm (usually comes with Node.js)
- PostgreSQL (version 12 or higher)

## Installation

Follow these steps to set up the application:

### 1. Clone the repository

```bash
git clone <repository-url>
cd enterprise-chat-app
```

### 2. Install dependencies

```bash
npm install
```

This will install all required dependencies for both the frontend and backend.

### 3. Set up the database

Create a PostgreSQL database for the application:

```bash
createdb enterprise_chat
```

### 4. Configure environment variables

Create a `.env` file in the root directory with the following content:

```
# Database configuration
DATABASE_URL=postgresql://username:password@localhost:5432/enterprise_chat
PGHOST=localhost
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=enterprise_chat
PGPORT=5432

# Session secret
SESSION_SECRET=your_random_session_secret
```

Replace `username`, `password`, and other values with your PostgreSQL credentials.

### 5. Run database migrations

Initialize the database and run migrations:

```bash
npm run db:push
```

## Running the Application

### Development mode

To start the application in development mode:

```bash
npm run dev
```

This will start both the backend server and the frontend development server. The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Production mode

To build and run the application in production mode:

1. Build the frontend:

```bash
npm run build
```

2. Start the server:

```bash
npm start
```

The application will be available at http://localhost:5000.

## Project Structure

- `/client`: Frontend React application
  - `/src`: Source code
    - `/components`: React components
    - `/hooks`: Custom React hooks
    - `/lib`: Utility functions and libraries
    - `/pages`: Main application pages
- `/server`: Backend Express application
  - `/routes.ts`: API routes
  - `/storage.ts`: Data access layer
  - `/auth.ts`: Authentication logic
  - `/db.ts`: Database connection
- `/shared`: Shared code between frontend and backend
  - `/schema.ts`: Database schema definitions

## API Endpoints

The application exposes the following API endpoints:

### Authentication
- `POST /api/register`: Register a new user
- `POST /api/login`: Log in an existing user
- `POST /api/logout`: Log out the current user
- `GET /api/user`: Get the current user's profile

### Conversations
- `GET /api/conversations`: Get all conversations for the current user
- `GET /api/conversations/:id`: Get a specific conversation by ID
- `POST /api/conversations`: Create a new group conversation
- `POST /api/conversations/direct`: Create or get a direct conversation with another user

### Messages
- `GET /api/conversations/:id/messages`: Get all messages for a conversation
- `POST /api/messages`: Send a new message to a conversation
- `DELETE /api/messages/:id`: Delete a message
- `PATCH /api/messages/:id`: Edit a message

### Users
- `GET /api/users`: Get all users in the system
- `PATCH /api/users/:id`: Update a user's profile

## WebSocket Events

The application uses WebSockets for real-time communication:

- `message`: Sent when a new message is created
- `typing`: Sent when a user is typing in a conversation
- `user_status`: Sent when a user's status changes

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Make sure PostgreSQL is running
2. Verify that the database credentials in the `.env` file are correct
3. Check that the database exists and is accessible

### Port Conflicts

If the application fails to start due to port conflicts:

1. Change the port numbers in the configuration
2. Make sure no other applications are using ports 5000 or 5173

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Express Documentation](https://expressjs.com/en/api.html)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)