# 🚗 GHS3 - Automotive Garage Management System

## Quick Start Guide

### Step 1: Install Dependencies
Double-click `install.bat` or run in terminal:
```bash
npm install
```

### Step 2: Seed Database
Double-click `seed.bat` or run:
```bash
cd backend
npm run seed
```

### Step 3: Start Application
Double-click `start.bat` or run these commands in separate terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Step 4: Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

### Step 5: Login
Use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Owner | admin@garage.com | admin123 |
| Manager | manager@garage.com | manager123 |
| Mechanic | mechanic@garage.com | mechanic123 |
| Receptionist | receptionist@garage.com | receptionist123 |

---

## 📋 Features Overview

### ✅ Implemented
- **Dashboard**: Real-time stats, revenue tracking, workload distribution
- **Garage Board**: Kanban-style workflow visualization
- **Cars Management**: List, filter, and track vehicles
- **Authentication**: JWT-based secure login with role-based access
- **MongoDB Integration**: Fully seeded database with sample data

### 🔨 Ready to Implement
- Customer CRUD operations
- Invoice generation and payment tracking
- Inventory management with low-stock alerts
- Mechanic performance analytics
- Online booking system
- Document uploads (photos, reports)
- Mobile-responsive views

---

## 🏗️ Architecture

### Backend (Clean Architecture)
```
src/
├── domain/           # Business entities (interfaces)
├── application/      # Business logic (services, DTOs)
├── infrastructure/   # External concerns (models, repositories, database)
└── presentation/     # HTTP layer (controllers, routes, middleware)
```

**Key Principles:**
- Controllers handle HTTP only
- Services contain business logic
- Repositories handle database operations
- DTOs validate inputs with Joi
- Centralized error handling

### Frontend (Next.js 14 App Router)
```
src/
├── app/              # Pages and routes
│   ├── (dashboard)/  # Protected routes
│   ├── login/        # Auth pages
│   └── layout.tsx    # Root layout
├── components/       # Reusable UI components
│   ├── ui/          # ShadCN components
│   └── layout/      # Layout components
├── lib/             # Utilities and API client
└── store/           # Zustand state management
```

**Design Philosophy:**
- Apple-inspired minimal UI
- No glassmorphism or excessive gradients
- Clean typography and spacing
- Functional, accessible components

---

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Role-Based Access Control**: Owner, Manager, Mechanic, Receptionist
- **API Rate Limiting**: Prevents abuse
- **CORS Protection**: Configured for frontend origin
- **Helmet.js**: Security headers
- **Input Validation**: Joi schemas on all endpoints

---

## 📊 Database Schema

### Collections
1. **Users** - Authentication and authorization
2. **Mechanics** - Staff information and performance
3. **Customers** - Customer profiles and history
4. **Cars** - Vehicle tracking through workflow stages
5. **Services** - Service catalog with pricing
6. **Inventory** - Stock management
7. **Invoices** - Billing and payments
8. **Bookings** - Online appointment system

---

## 🎨 UI Components (ShadCN)

Pre-built components:
- Button
- Card
- Input
- Label
- Table
- (More can be added from ShadCN as needed)

All components follow:
- Minimal borders
- Subtle shadows
- Clean spacing
- Accessible markup

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user
- `GET /api/auth/profile` - Get current user

### Cars
- `GET /api/cars` - List cars (supports filters)
- `POST /api/cars` - Add car
- `GET /api/cars/:id` - Get car details
- `PUT /api/cars/:id` - Update car
- `DELETE /api/cars/:id` - Remove car
- `GET /api/cars/dashboard` - Dashboard stats
- `GET /api/cars/garage-board` - Garage board data

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice
- `POST /api/invoices/:id/payment` - Add payment
- `GET /api/invoices/outstanding` - Unpaid invoices
- `GET /api/invoices/revenue-stats` - Revenue analytics

---

## 🔧 Customization Guide

### Adding a New Service Module

**1. Create Domain Entity** (`backend/src/domain/entities/YourEntity.ts`)
```typescript
export interface IYourEntity {
  _id?: string;
  // your fields
}
```

**2. Create Mongoose Model** (`backend/src/infrastructure/models/YourEntity.model.ts`)
```typescript
import mongoose, { Schema } from 'mongoose';
// Define schema and export model
```

**3. Create Repository** (`backend/src/infrastructure/repositories/YourEntity.repository.ts`)
```typescript
export class YourEntityRepository {
  async findAll() { }
  async create(data) { }
  // CRUD methods
}
```

**4. Create Service** (`backend/src/application/services/YourEntity.service.ts`)
```typescript
export class YourEntityService {
  constructor() {
    this.repository = new YourEntityRepository();
  }
  // Business logic
}
```

**5. Create Controller** (`backend/src/presentation/controllers/YourEntity.controller.ts`)
```typescript
export class YourEntityController {
  // HTTP handlers
}
```

**6. Create Routes** (`backend/src/presentation/routes/yourEntity.routes.ts`)
```typescript
import { Router } from 'express';
// Define routes
```

**7. Add Frontend Page** (`frontend/src/app/(dashboard)/your-module/page.tsx`)
```tsx
'use client';
export default function YourModulePage() {
  // React component
}
```

---

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB connection string in `.env`
- Ensure port 5000 is available
- Run `npm install` in backend folder

### Frontend won't start
- Ensure port 3000 is available
- Run `npm install` in frontend folder
- Check `.env.local` has correct API URL

### Database connection issues
- Verify MongoDB Atlas credentials
- Check network connectivity
- Ensure IP is whitelisted in MongoDB Atlas

### Authentication errors
- Clear browser localStorage
- Check JWT_SECRET in backend `.env`
- Verify token expiration settings

---

## 📦 Dependencies

### Backend
- express - Web framework
- mongoose - MongoDB ODM
- jsonwebtoken - JWT auth
- bcryptjs - Password hashing
- joi - Validation
- cors - CORS middleware
- helmet - Security headers
- morgan - Logging

### Frontend
- next - React framework
- react - UI library
- @radix-ui - Headless components
- tailwindcss - CSS framework
- zustand - State management
- axios - HTTP client

---

## 🚀 Deployment

### Backend (e.g., Railway, Render, Heroku)
1. Set environment variables
2. Deploy from `backend/` directory
3. Run build: `npm run build`
4. Start: `npm start`

### Frontend (e.g., Vercel, Netlify)
1. Set `NEXT_PUBLIC_API_URL` environment variable
2. Deploy from `frontend/` directory
3. Build command: `npm run build`
4. Output directory: `.next`

---

## 📝 Next Steps

1. **Complete CRUD Pages**: Customers, Invoices, Inventory, Mechanics, Bookings
2. **Add File Uploads**: Integrate Cloudinary for photos
3. **Build Reports**: PDF generation for invoices
4. **Add Notifications**: Email/SMS alerts
5. **Mobile App**: React Native version
6. **Analytics Dashboard**: Advanced reporting
7. **Customer Portal**: Public-facing booking site

---

## 💡 Tips

- Use `Ctrl+C` to stop servers
- Check console for errors
- API responses follow format: `{ success, message, data }`
- Frontend state persists in localStorage
- Database auto-seeds with sample data

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the README.md
3. Check API documentation
4. Inspect browser console
5. Check backend terminal logs

---

**Built with ❤️ using modern web technologies**
