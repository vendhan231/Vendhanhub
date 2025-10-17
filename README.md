# Data Entry and Billing Management System

A comprehensive web-based application for managing data entry projects, automated billing calculations, and administrative oversight. The system supports dynamic project configurations, file-based data import, duplicate detection, and real-time billing calculations.

## 🚀 Application Features

### **Core Data Entry Features**
- **Dynamic Project Configuration**: JSON-based field definitions for customizable report and item-level fields
- **Flexible Field Types**: Support for text, number, date, select dropdowns, and textarea fields
- **File Upload Processing**: Automatic CSV/Excel data extraction with case-insensitive field mapping
- **Duplicate Detection**: Real-time Object ID validation across all reports within projects
- **Automatic Billing**: Per-item, per-record, or custom field-based billing calculations

### **User Management & Authentication**
- **JWT-Based Authentication**: Secure session management with role-based access control
- **User Roles**: Admin and User permissions with appropriate feature restrictions
- **Profile Management**: User profile updates and password management

### **Report Management**
- **Dynamic Form Generation**: Forms automatically adapt to project field configurations
- **Real-time Validation**: Required field checking, data type validation, and duplicate prevention
- **File Upload Integration**: Pre-populate forms from CSV/Excel data imports
- **Billing Preview**: Live calculation display before report submission
- **Transaction Safety**: Atomic report creation with billing and indexing

### **Billing System**
- **Automatic Calculation**: Based on project-specific billing rules and configurations
- **Status Management**: Pending → Paid workflow with admin controls
- **Admin Management**: Edit amounts, change status, delete records with audit trails
- **Export Functionality**: CSV export for all billing data and analytics

### **Analytics Dashboard**
- **Overview Metrics**: Total billing, reports, projects, and active users
- **Project Performance**: Billing summaries and activity metrics per project
- **User Performance**: Individual productivity and earnings tracking
- **Export Options**: CSV downloads for comprehensive analytics data

### **Administrative Functions**
- **Project Management**: Create, edit, and delete projects with dynamic field configurations
- **User Administration**: Complete CRUD operations for user accounts
- **Billing Oversight**: Monitor, approve, and manage all billing records
- **System Analytics**: Comprehensive reporting and performance insights

## 🏗️ Architecture Overview

### **Backend Architecture**
- **Framework**: Node.js with Express.js for RESTful API development
- **Database**: SQLite with Prisma ORM for type-safe database operations
- **Authentication**: JWT token-based authentication with middleware protection
- **Validation**: Zod schemas for comprehensive input validation and type safety
- **File Processing**: XLSX and CSV parsers for data import functionality
- **Transaction Management**: Prisma transactions for data consistency

### **Frontend Architecture**
- **Framework**: React with TypeScript for type-safe component development
- **State Management**: React hooks with context for authentication and data flow
- **UI Components**: Tailwind CSS for responsive, modern interface design
- **Form Handling**: Dynamic form generation with validation feedback
- **File Upload**: Client-side file processing with preview functionality

### **Database Schema**
- **Projects**: JSON-based field and billing configurations
- **Reports**: Dynamic report data with item-level details
- **ReportItems**: Individual item entries with flexible field storage
- **BillingRecords**: Automated billing calculations and status tracking
- **ObjectIDIndex**: Fast duplicate detection and indexing
- **Users**: Authentication and profile management

## 🛠️ Technical Stack

### **Backend Technologies**
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: SQLite
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **File Processing**: xlsx, csv-parser
- **Password Hashing**: bcrypt
- **Development**: TypeScript, ts-node-dev

### **Frontend Technologies**
- **Framework**: React 18+
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Build Tool**: Vite
- **State Management**: React Context + Hooks

### **Development Tools**
- **Version Control**: Git
- **Package Manager**: npm
- **Database GUI**: Prisma Studio
- **API Testing**: Postman/Insomnia
- **Code Quality**: ESLint, Prettier

## 🚀 Getting Started

### **Prerequisites**
- Node.js (v16 or higher)
- npm or yarn package manager
- Git for version control

### **Installation**

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd data-entry-billing-system
   ```

2. **Backend Setup**
   ```bash
   cd employee-management-billing-backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../  # Return to root directory
   npm install
   ```

4. **Environment Configuration**
   ```bash
   cd employee-management-billing-backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Database Initialization**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

### **Running the Application**

1. **Start Backend Server**
   ```bash
   cd employee-management-billing-backend
   npm run dev
   ```
   Backend API will be available at `http://localhost:3000`

2. **Start Frontend Development Server**
   ```bash
   # In a new terminal, from root directory
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`

### **Default Credentials**
- **Admin User**: username: `admin`, password: `admin123`
- **Test User**: username: `employee1`, password: `emp123`

## 📋 API Endpoints

### **Authentication**
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration
- `POST /auth/logout` - Session termination

### **Project Management**
- `GET /projects` - List all projects
- `POST /projects` - Create new project (Admin)
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project (Admin)
- `DELETE /projects/:id` - Delete project (Admin)

### **Report Management**
- `GET /reports` - List reports (filtered by user role)
- `POST /reports` - Submit new report
- `GET /reports/:id` - Get report details
- `POST /reports/check-duplicate` - Check Object ID duplicates

### **File Upload**
- `POST /upload/extract` - Upload and extract CSV/Excel data

### **Billing Management**
- `GET /billing` - List billing records (role-based)
- `PUT /billing/:id` - Update billing record (Admin)
- `DELETE /billing/:id` - Delete billing record (Admin)

### **Analytics**
- `GET /analytics/summary` - Dashboard statistics (Admin)
- `GET /analytics/by-project` - Project performance data
- `GET /analytics/by-user` - User performance data

## 🔧 Development Commands

### **Backend Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm test            # Run test suite
```

### **Database Management**
```bash
npx prisma migrate dev    # Create and apply migrations
npx prisma generate       # Generate Prisma client
npx prisma studio         # Open database GUI
npx prisma db push        # Push schema changes
```

### **Frontend Scripts**
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

## 📊 Key Features & Functions

### **Dynamic Project Configuration**
- JSON-based field definitions for report and item levels
- Support for required/optional fields and unique constraints
- Flexible billing rules (per-item, per-record, custom field-based)

### **Intelligent File Processing**
- Automatic field mapping with case-insensitive matching
- Support for CSV and Excel formats
- Data validation and preview before import

### **Duplicate Prevention**
- Real-time Object ID validation within reports
- Cross-report duplicate detection
- Warning system with duplicate history display

### **Automated Billing Engine**
- Configurable billing calculations based on project rules
- Real-time preview and validation
- Transaction-safe billing record creation

### **Comprehensive Analytics**
- Multi-dimensional performance metrics
- Export capabilities for reporting
- Real-time dashboard updates

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Input validation and sanitization
- SQL injection prevention via Prisma ORM
- CORS configuration for cross-origin requests

## 📈 Performance Optimizations

- Database indexing for fast duplicate checking
- Pagination for large datasets
- Lazy loading for dropdown options
- Optimized CSV export for large data sets
- Transaction management for data consistency

## 🧪 Testing

```bash
# Backend testing
cd employee-management-billing-backend
npm test

# Frontend testing
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

## 🔄 Current Updates

### **Version 1.0.0 - Complete Implementation**
- ✅ Full data entry and billing system implementation
- ✅ Dynamic project configurations with JSON field definitions
- ✅ File upload processing for CSV/Excel data extraction
- ✅ Duplicate detection and prevention system
- ✅ Automated billing calculations with multiple rule types
- ✅ Complete admin dashboard with analytics
- ✅ User management and authentication system
- ✅ Responsive frontend with modern UI/UX
- ✅ RESTful API with comprehensive endpoints
- ✅ Database schema with proper relations and indexing
- ✅ Type-safe implementation with TypeScript
- ✅ Transaction safety and error handling
- ✅ Export functionality for reports and analytics

The system is now production-ready and fully functional for managing data entry projects with automated billing and comprehensive administrative oversight.
