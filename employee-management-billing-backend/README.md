# Employee Management Billing Backend

## Database Configuration

This application supports both local SQLite and server-based databases.

### Local SQLite (Default)
The application uses SQLite by default for easy setup and development.

### Server Database Setup

To use a server-based database (PostgreSQL, MySQL, SQL Server), follow these steps:

1. **Install Database Server**
   - PostgreSQL: `sudo apt install postgresql postgresql-contrib`
   - MySQL: `sudo apt install mysql-server`
   - SQL Server: Follow Microsoft's installation guide

2. **Create Database**
   ```sql
   -- PostgreSQL
   CREATE DATABASE employee_billing;
   CREATE USER billing_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE employee_billing TO billing_user;

   -- MySQL
   CREATE DATABASE employee_billing;
   CREATE USER 'billing_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON employee_billing.* TO 'billing_user'@'localhost';
   ```

3. **Configure Environment Variables**
   Edit `.env` file:
   ```env
   USE_SERVER_DB=true
   SERVER_DB_URL="postgresql://billing_user:your_password@localhost:5432/employee_billing"
   # Or for MySQL:
   # SERVER_DB_URL="mysql://billing_user:your_password@localhost:3306/employee_billing"
   # Or for SQL Server:
   # SERVER_DB_URL="sqlserver://localhost:1433;database=employee_billing;username=billing_user;password=your_password"
   ```

4. **Update Prisma Schema**
   Change the datasource in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // or "mysql" or "sqlserver"
     url      = env("DATABASE_URL")
   }
   ```

5. **Run Migrations**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

6. **Start Server**
   ```bash
   npm run dev
   ```

The server will log which database type is being used on startup.

## LAN Access

The server is configured to bind to all network interfaces, making it accessible from other devices on the LAN.

- **Server IP**: 192.168.29.106
- **Port**: 3000
- **Access URL**: http://192.168.29.106:3000

## Real-time Updates

The application uses Socket.IO for real-time data synchronization across all connected clients.

## Features

- User authentication and authorization
- Project management with dynamic fields
- Work report submission with Excel/CSV upload
- Billing calculation with custom formulas
- Real-time notifications
- LAN accessibility
- Database flexibility (SQLite or server-based)