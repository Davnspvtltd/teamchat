# Project Dependencies

This file lists all the dependencies required to run the Enterprise Chat Application.

## System Requirements

- **Node.js**: Version 16 or higher
- **PostgreSQL**: Version 12 or higher

## NPM Packages

These packages will be installed using `npm install`:

### Core Dependencies

```json
{
  "dependencies": {
    "@hookform/resolvers": "^3.0.0",
    "@neondatabase/serverless": "^0.6.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "cmdk": "^0.2.0",
    "connect-pg-simple": "^9.0.0",
    "date-fns": "^2.30.0",
    "drizzle-orm": "^0.28.0",
    "drizzle-zod": "^0.5.0",
    "embla-carousel-react": "^8.0.0",
    "express": "^4.18.0",
    "express-session": "^1.17.0",
    "framer-motion": "^10.0.0",
    "input-otp": "^1.0.0",
    "lucide-react": "^0.298.0",
    "memorystore": "^1.6.0",
    "next-themes": "^0.2.0",
    "passport": "^0.6.0",
    "passport-local": "^1.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.0.0",
    "react-icons": "^4.10.0",
    "react-resizable-panels": "^1.0.0",
    "recharts": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "vaul": "^0.8.0",
    "wouter": "^2.0.0",
    "ws": "^8.0.0",
    "zod": "^3.0.0",
    "zod-validation-error": "^1.0.0"
  }
}
```

### UI Components from Radix UI

```json
{
  "dependencies": {
    "@radix-ui/react-accordion": "^1.0.0",
    "@radix-ui/react-alert-dialog": "^1.0.0",
    "@radix-ui/react-aspect-ratio": "^1.0.0",
    "@radix-ui/react-avatar": "^1.0.0",
    "@radix-ui/react-checkbox": "^1.0.0",
    "@radix-ui/react-collapsible": "^1.0.0",
    "@radix-ui/react-context-menu": "^2.0.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-hover-card": "^1.0.0",
    "@radix-ui/react-label": "^2.0.0",
    "@radix-ui/react-menubar": "^1.0.0",
    "@radix-ui/react-navigation-menu": "^1.0.0",
    "@radix-ui/react-popover": "^1.0.0",
    "@radix-ui/react-progress": "^1.0.0",
    "@radix-ui/react-radio-group": "^1.0.0",
    "@radix-ui/react-scroll-area": "^1.0.0",
    "@radix-ui/react-select": "^1.0.0",
    "@radix-ui/react-separator": "^1.0.0",
    "@radix-ui/react-slider": "^1.0.0",
    "@radix-ui/react-slot": "^1.0.0",
    "@radix-ui/react-switch": "^1.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "@radix-ui/react-toast": "^1.0.0",
    "@radix-ui/react-toggle": "^1.0.0",
    "@radix-ui/react-toggle-group": "^1.0.0",
    "@radix-ui/react-tooltip": "^1.0.0"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.0",
    "@tailwindcss/vite": "^4.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@types/connect-pg-simple": "^7.0.0",
    "@types/express": "^4.17.0",
    "@types/express-session": "^1.17.0",
    "@types/node": "^20.0.0",
    "@types/passport": "^1.0.0",
    "@types/passport-local": "^1.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/ws": "^8.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.0.0",
    "drizzle-kit": "^0.20.0",
    "esbuild": "^0.19.0",
    "postcss": "^8.0.0",
    "tailwindcss": "^3.0.0",
    "tailwindcss-animate": "^1.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

## Installation

To install all dependencies, run:

```bash
npm install
```

## Database Setup

After installing the dependencies, you need to set up the PostgreSQL database. Create a new database called `enterprise_chat` (or any name you prefer) and update the `.env` file with your database credentials:

```
DATABASE_URL=postgresql://username:password@localhost:5432/enterprise_chat
PGHOST=localhost
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=enterprise_chat
PGPORT=5432
```

Then run the database migrations:

```bash
npm run db:push
```

## Running the Application

Start the development server:

```bash
npm run dev
```

This will start both the backend Express server and the frontend Vite development server.