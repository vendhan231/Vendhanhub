# Employee Management & Billing System

## Overview
This project is an Employee Management and Billing System designed to streamline the management of employees, projects, attendance, billing records, and internal messaging. It provides a robust backend built with Node.js, Express.js, and TypeScript, utilizing PostgreSQL as the database.

## Technology Stack
- **Backend Framework**: Node.js with Express.js
- **TypeScript**: For type safety and better development experience
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JSON Web Tokens (JWT)
- **Password Hashing**: bcrypt.js
- **Input Validation**: Zod
- **File Uploads**: Multer
- **CORS**: cors middleware
- **Environment Variables**: dotenv

## Project Structure
```
employee-management-billing-backend
├── prisma
│   ├── schema.prisma
│   └── migrations
├── src
│   ├── api
│   │   ├── routes
│   │   ├── controllers
│   │   ├── services
│   │   ├── middleware
│   │   └── validators
│   ├── config
│   ├── utils
│   └── server.ts
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

## Features
- **User Management**: Create, read, update, and delete user profiles.
- **Project Management**: Manage projects with billing types and rates.
- **Daily Work Reports**: Employees can submit daily work reports.
- **Leave Requests**: Employees can request leaves and manage their status.
- **Attendance Tracking**: Clock in and clock out functionality for attendance management.
- **Billing Records**: Manage billing records and import data from CSV files.
- **Billing Calculator**: Calculate and finalize billing periods for employees.
- **Internal Messaging**: Send and receive messages within the application.
- **AI Integration**: Interact with the Gemini AI service for content generation.

## Getting Started
1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd employee-management-billing-backend
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Set up the database**:
   - Create a PostgreSQL database and update the `.env` file with the database connection string.

4. **Run migrations**:
   ```
   npx prisma migrate dev
   ```

5. **Start the server**:
   ```
   npm run dev
   ```

## API Documentation
Refer to the individual route files in the `src/api/routes` directory for detailed API endpoints and their usage.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.