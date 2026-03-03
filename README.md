# GHS3 - Garage Management System

A comprehensive automotive garage management system built with modern technologies.

## 🚀 Technology Stack

### Backend
- **Node.js + Express** - RESTful API
- **TypeScript** - Type-safe development
- **MongoDB** - Database
- **Clean Architecture** - Separation of concerns with controllers, services, and repositories
- **JWT Authentication** - Secure user authentication
- **Joi** - DTO validation

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS
- **ShadCN UI** - High-quality UI components
- **Zustand** - State management
- **Axios** - HTTP client

## 📦 Project Structure

```
ghs3/
├── backend/
│   ├── src/
│   │   ├── domain/           # Domain entities
│   │   ├── application/      # Business logic (services, DTOs)
│   │   ├── infrastructure/   # Data access (models, repositories)
│   │   ├── presentation/     # HTTP layer (controllers, routes, middleware)
│   │   ├── database/         # Database seeders
│   │   └── server.ts        # Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js app router
│   │   ├── components/      # React components
│   │   ├── lib/            # Utilities
│   │   └── store/          # State management
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (connection string provided)

### Backend Setup

```bash
cd backend
npm install
npm run seed    # Seed database with sample data
npm run dev     # Start development server
```

The backend will run on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev     # Start development server
```

The frontend will run on `http://localhost:3000`

## 🔐 Default Login Credentials

After seeding the database, use these credentials:

- **Owner**: admin@garage.com / admin123
- **Manager**: manager@garage.com / manager123
- **Mechanic**: mechanic@garage.com / mechanic123
- **Receptionist**: receptionist@garage.com / receptionist123

## 🎯 Key Features

### Core Dashboard
- Real-time garage statistics
- Revenue tracking (daily, weekly, monthly)
- Workload distribution visualization
- Active mechanics overview

### Garage Board (Kanban)
- Visual workflow stages
- Live car tracking
- Progress indicators
- Mechanic assignments

### Service Categories
1. **Colour & Repair** - Painting, accident repair, bodywork
2. **Clean & Shine** - Detailing, buffing, cleaning
3. **Coat & Guard** - PPF, ceramic coating, tinting

### Additional Modules
- Customer Management
- Invoice & Payment Tracking
- Inventory Management
- Mechanic Performance Tracking
- Online Booking System

## 🏗️ Architecture Highlights

### Clean Architecture (Backend)
- **Controllers**: HTTP request/response handling only
- **Services**: Business logic implementation
- **Repositories**: Database interaction abstraction
- **DTOs**: Input validation with Joi schemas
- **Middleware**: Centralized error handling & authentication

### Design Principles (Frontend)
- Apple-inspired clean UI
- Minimal, functional design
- No glassmorphism or excessive gradients
- Custom spacing (avoiding Tailwind defaults)
- Accessible, semantic components

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Cars
- `GET /api/cars` - List all cars (with filters)
- `POST /api/cars` - Add new car
- `GET /api/cars/:id` - Get car details
- `PUT /api/cars/:id` - Update car
- `GET /api/cars/dashboard` - Dashboard statistics
- `GET /api/cars/garage-board` - Garage board data

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `POST /api/invoices/:id/payment` - Add payment
- `GET /api/invoices/revenue-stats` - Revenue statistics

## 🔒 Role-Based Access Control

- **Owner**: Full system access
- **Manager**: Operations + reports
- **Mechanic**: View/update assigned jobs only
- **Receptionist**: Bookings, customers, payments

## 📊 Database Schema

Key collections:
- Users
- Mechanics
- Customers
- Cars
- Services
- Inventory
- Invoices
- Bookings

## 🚦 Development Status

✅ Completed:
- Backend API with clean architecture
- MongoDB database design & seeding
- Authentication & authorization
- Dashboard UI
- Garage board UI
- Cars listing UI
- Core navigation

🔨 In Progress:
- Customer management
- Invoice management
- Inventory tracking
- Booking system

## 📝 License

See LICENSE file

## 👨‍💻 Development

Built with modern best practices:
- TypeScript for type safety
- ESLint for code quality
- RESTful API design
- Responsive UI design
- Secure authentication
- Clean code principles
