import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { CustomerModel } from '../../infrastructure/models/Customer.model';
import { MechanicModel } from '../../infrastructure/models/Mechanic.model';
import { ServiceModel } from '../../infrastructure/models/Service.model';
import { InventoryModel } from '../../infrastructure/models/Inventory.model';
import { UserModel } from '../../infrastructure/models/User.model';
import { CarModel } from '../../infrastructure/models/Car.model';

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...\n');

    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    await Promise.all([
      CustomerModel.deleteMany({}),
      MechanicModel.deleteMany({}),
      ServiceModel.deleteMany({}),
      InventoryModel.deleteMany({}),
      UserModel.deleteMany({}),
      CarModel.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data\n');

    // Seed Mechanics
    const mechanics = await MechanicModel.insertMany([
      {
        firstName: 'John',
        lastName: 'Painter',
        email: 'john.painter@garage.com',
        phone: '+1234567890',
        specialization: 'painter',
        skills: ['Spray Painting', 'Body Repair', 'Accident Repair'],
        activeJobs: [],
        completedJobs: [],
        performance: {
          totalJobsCompleted: 45,
          averageTurnaroundTime: 48,
          efficiencyScore: 92,
          customerRating: 4.7
        },
        laborHoursLogged: 520,
        availability: 'available',
        hireDate: new Date('2023-01-15'),
        salary: 55000
      },
      {
        firstName: 'Sarah',
        lastName: 'Detailer',
        email: 'sarah.detailer@garage.com',
        phone: '+1234567891',
        specialization: 'detailer',
        skills: ['Interior Detail', 'Engine Detail', 'Buffing', 'Ceramic Coating'],
        activeJobs: [],
        completedJobs: [],
        performance: {
          totalJobsCompleted: 67,
          averageTurnaroundTime: 6,
          efficiencyScore: 95,
          customerRating: 4.9
        },
        laborHoursLogged: 380,
        availability: 'available',
        hireDate: new Date('2023-03-20'),
        salary: 48000
      },
      {
        firstName: 'Mike',
        lastName: 'Installer',
        email: 'mike.installer@garage.com',
        phone: '+1234567892',
        specialization: 'installer',
        skills: ['PPF Installation', 'Window Tinting', 'Wrap Installation'],
        activeJobs: [],
        completedJobs: [],
        performance: {
          totalJobsCompleted: 38,
          averageTurnaroundTime: 12,
          efficiencyScore: 88,
          customerRating: 4.6
        },
        laborHoursLogged: 410,
        availability: 'available',
        hireDate: new Date('2023-06-10'),
        salary: 52000
      }
    ]);
    console.log(`✅ Seeded ${mechanics.length} mechanics`);

    // Seed Users
    const users = await UserModel.insertMany([
      {
        firstName: 'Admin',
        lastName: 'Owner',
        email: 'admin@garage.com',
        password: 'admin123',
        role: 'owner',
        isActive: true
      },
      {
        firstName: 'Manager',
        lastName: 'Smith',        email: 'manager@garage.com',
        password: 'manager123',
        role: 'manager',
        isActive: true
      },
      {
        firstName: 'John',
        lastName: 'Painter',
        email: 'mechanic@garage.com',
        password: 'mechanic123',
        role: 'mechanic',
        mechanicId: mechanics[0]._id,
        isActive: true
      },
      {
        firstName: 'Jane',
        lastName: 'Receptionist',
        email: 'receptionist@garage.com',
        password: 'receptionist123',
        role: 'receptionist',
        isActive: true
      }
    ]);
    console.log(`✅ Seeded ${users.length} users`);

    // Seed Customers
    const customers = await CustomerModel.insertMany([
      {
        name: 'Robert Johnson',
        email: 'robert.j@email.com',
        phone: '+1234560001',
        address: '123 Main St, Los Angeles, CA 90001',
        notes: 'Preferred customer, always on time',
        serviceHistory: []
      },
      {
        name: 'Maria Garcia',
        email: 'maria.g@email.com',
        phone: '+1234560002',
        address: '456 Oak Ave, San Diego, CA 92101',
        serviceHistory: []
      },
      {
        name: 'David Lee',
        email: 'david.lee@email.com',
        phone: '+1234560003',
        address: '789 Pine Rd, Santa Monica, CA 90401',
        notes: 'Owns multiple vehicles',
        serviceHistory: []
      }
    ]);
    console.log(`✅ Seeded ${customers.length} customers`);

    // Seed Services
    const services = await ServiceModel.insertMany([
      // Colour & Repair
      {
        name: 'Spray Painting',
        category: 'colour_repair',
        description: 'Professional spray painting service for cars',
        basePrice: 800,
        estimatedDuration: 48,
        requiresAssessment: true,
        isActive: true
      },
      {
        name: 'Accident Repair',
        category: 'colour_repair',
        description: 'Complete accident repair and bodywork',
        basePrice: 1500,
        estimatedDuration: 72,
        requiresAssessment: true,
        isActive: true
      },
      {
        name: 'Full Body Repaint',
        category: 'colour_repair',
        description: 'Complete vehicle repainting',
        basePrice: 3000,
        estimatedDuration: 120,
        requiresAssessment: true,
        isActive: true
      },
      // Clean & Shine
      {
        name: 'Interior Detail',
        category: 'clean_shine',
        description: 'Deep interior cleaning and detailing',
        basePrice: 150,
        estimatedDuration: 4,
        requiresAssessment: false,
        packages: [
          { name: 'Basic', price: 150, features: ['Vacuum', 'Dashboard Clean', 'Window Clean'] },
          { name: 'Premium', price: 250, features: ['Basic + Leather Conditioning', 'Steam Clean', 'Odor Removal'] },
          { name: 'Ultimate', price: 350, features: ['Premium + Carpet Shampoo', 'Headliner Clean', 'Protection Treatment'] }
        ],
        isActive: true
      },
      {
        name: 'Engine Detail',
        category: 'clean_shine',
        description: 'Engine bay cleaning and detailing',
        basePrice: 100,
        estimatedDuration: 2,
        requiresAssessment: false,
        isActive: true
      },
      {
        name: 'Buffing & Polish',
        category: 'clean_shine',
        description: 'Paint correction and buffing',
        basePrice: 300,
        estimatedDuration: 6,
        requiresAssessment: false,
        isActive: true
      },
      // Coat & Guard
      {
        name: 'PPF Installation',
        category: 'coat_guard',
        description: 'Paint Protection Film installation',
        basePrice: 2000,
        estimatedDuration: 16,
        requiresAssessment: true,
        packages: [
          { name: 'Front Bumper', price: 500, features: ['Front Bumper Coverage'] },
          { name: 'Front End', price: 1200, features: ['Hood, Bumper, Fenders, Mirrors'] },
          { name: 'Full Body', price: 4500, features: ['Complete Vehicle Coverage'] }
        ],
        isActive: true
      },
      {
        name: 'Ceramic Coating',
        category: 'coat_guard',
        description: 'Professional ceramic coating application',
        basePrice: 800,
        estimatedDuration: 8,
        requiresAssessment: false,
        packages: [
          { name: '1 Year', price: 800, features: ['1 Year Protection', 'Paint Prep', 'Single Layer'] },
          { name: '3 Years', price: 1200, features: ['3 Year Protection', 'Paint Correction', 'Double Layer'] },
          { name: '5 Years', price: 1800, features: ['5 Year Protection', 'Full Correction', 'Triple Layer'] }
        ],
        isActive: true
      },
      {
        name: 'Window Tinting',
        category: 'coat_guard',
        description: 'Professional window tinting service',
        basePrice: 300,
        estimatedDuration: 4,
        requiresAssessment: false,
        isActive: true
      }
    ]);
    console.log(`✅ Seeded ${services.length} services`);

    // Seed Inventory
    const inventory = await InventoryModel.insertMany([
      {
        itemName: 'Automotive Paint - Black',
        category: 'paint',
        sku: 'PAINT-BLK-001',
        brand: 'PPG',
        quantity: 25,
        unit: 'liters',
        minStockLevel: 10,
        costPerUnit: 45,
        supplier: {
          name: 'Auto Paint Supply Co.',
          contact: '+1234567800',
          email: 'supplier@autopaint.com'
        },
        isActive: true
      },
      {
        itemName: 'Automotive Paint - White',
        category: 'paint',
        sku: 'PAINT-WHT-001',
        brand: 'PPG',
        quantity: 30,
        unit: 'liters',
        minStockLevel: 10,
        costPerUnit: 45,
        supplier: {
          name: 'Auto Paint Supply Co.',
          contact: '+1234567800'
        },
        isActive: true
      },
      {
        itemName: 'Ceramic Coating Solution',
        category: 'chemical',
        sku: 'CERA-001',
        brand: 'Gtechniq',
        quantity: 15,
        unit: 'bottles',
        minStockLevel: 5,
        costPerUnit: 120,
        supplier: {
          name: 'DetailPro Supplies',
          contact: '+1234567801'
        },
        isActive: true
      },
      {
        itemName: 'PPF Roll - Clear',
        category: 'film',
        sku: 'PPF-CLR-60',
        brand: 'XPEL',
        quantity: 3,
        unit: 'rolls',
        minStockLevel: 2,
        costPerUnit: 800,
        supplier: {
          name: 'XPEL Distributor',
          contact: '+1234567802'
        },
        isActive: true
      },
      {
        itemName: 'Window Tint Film - 15%',
        category: 'film',
        sku: 'TINT-15-001',
        brand: '3M',
        quantity: 8,
        unit: 'rolls',
        minStockLevel: 3,
        costPerUnit: 150,
        supplier: {
          name: '3M Authorized Dealer',
          contact: '+1234567803'
        },
        isActive: true
      },
      {
        itemName: 'Interior Detailing Spray',
        category: 'chemical',
        sku: 'DET-INT-001',
        brand: 'Chemical Guys',
        quantity: 20,
        unit: 'bottles',
        minStockLevel: 8,
        costPerUnit: 15,
        supplier: {
          name: 'DetailPro Supplies',
          contact: '+1234567801'
        },
        isActive: true
      }
    ]);
    console.log(`✅ Seeded ${inventory.length} inventory items`);

    // Seed some sample cars
    const sampleCars = await CarModel.insertMany([
      {
        customerId: customers[0]._id,
        customerName: customers[0].name,
        vehicleModel: 'Toyota Camry 2020',
        vehiclePlate: 'ABC-1234',
        vehicleYear: 2020,
        vehicleColor: 'Silver',
        serviceType: 'clean_shine',
        services: ['Interior Detail', 'Engine Detail'],
        stage: 'detailing',
        statusProgress: 60,
        assignedMechanicId: mechanics[1]._id?.toString(),
        assignedMechanicName: `${mechanics[1].firstName} ${mechanics[1].lastName}`,
        estimatedCost: 250,
        paidAmount: 0,
        paymentStatus: 'pending',
        checkInDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        expectedCompletionDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        daysInGarage: 2,
        beforePhotos: []
      },
      {
        customerId: customers[1]._id,
        customerName: customers[1].name,
        vehicleModel: 'BMW 3 Series 2021',
        vehiclePlate: 'XYZ-5678',
        vehicleYear: 2021,
        vehicleColor: 'Black',
        serviceType: 'coat_guard',
        services: ['Ceramic Coating'],
        stage: 'quality_check',
        statusProgress: 90,
        assignedMechanicId: mechanics[1]._id?.toString(),
        assignedMechanicName: `${mechanics[1].firstName} ${mechanics[1].lastName}`,
        estimatedCost: 1200,
        paidAmount: 600,
        paymentStatus: 'partial',
        checkInDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        expectedCompletionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        daysInGarage: 4,
        beforePhotos: []
      },
      {
        customerId: customers[2]._id,
        customerName: customers[2].name,
        vehicleModel: 'Tesla Model 3 2022',
        vehiclePlate: 'TES-9999',
        vehicleYear: 2022,
        vehicleColor: 'White',
        serviceType: 'colour_repair',
        services: ['Spray Painting'],
        stage: 'painting',
        statusProgress: 45,
        assignedMechanicId: mechanics[0]._id?.toString(),
        assignedMechanicName: `${mechanics[0].firstName} ${mechanics[0].lastName}`,
        estimatedCost: 800,
        paidAmount: 0,
        paymentStatus: 'pending',
        checkInDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        expectedCompletionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        daysInGarage: 3,
        damageAssessment: 'Minor scratch on rear bumper',
        beforePhotos: []
      }
    ]);
    console.log(`✅ Seeded ${sampleCars.length} sample cars`);

    console.log('\n✨ Database seeding completed successfully!\n');
    console.log('📧 Login credentials:');
    console.log('   Owner: admin@garage.com / admin123');
    console.log('   Manager: manager@garage.com / manager123');
    console.log('   Mechanic: mechanic@garage.com / mechanic123');
    console.log('   Receptionist: receptionist@garage.com / receptionist123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
