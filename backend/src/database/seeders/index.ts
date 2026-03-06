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
        lastName: 'Kamau',
        email: 'john.kamau@garage.co.ke',
        phone: '+254712345678',
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
        birthday: new Date('1990-03-05'),
        salary: 75000
      },
      {
        firstName: 'Sarah',
        lastName: 'Wanjiku',
        email: 'sarah.wanjiku@garage.co.ke',
        phone: '+254723456789',
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
        birthday: new Date('1992-03-12'),
        salary: 65000
      },
      {
        firstName: 'Mike',
        lastName: 'Omondi',
        email: 'mike.omondi@garage.co.ke',
        phone: '+254734567890',
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
        birthday: new Date('1988-03-18'),
        salary: 70000
      },
      {
        firstName: 'David',
        lastName: 'Mutua',
        email: 'david.mutua@garage.co.ke',
        phone: '+254745678901',
        specialization: 'technician',
        skills: ['Engine Diagnostics', 'Electrical Systems', 'Mechanical Repair'],
        activeJobs: [],
        completedJobs: [],
        performance: {
          totalJobsCompleted: 52,
          averageTurnaroundTime: 24,
          efficiencyScore: 90,
          customerRating: 4.8
        },
        laborHoursLogged: 480,
        availability: 'available',
        hireDate: new Date('2022-11-05'),
        birthday: new Date('1985-03-03'),
        salary: 80000
      },
      {
        firstName: 'Grace',
        lastName: 'Njeri',
        email: 'grace.njeri@garage.co.ke',
        phone: '+254756789012',
        specialization: 'painter',
        skills: ['Color Matching', 'Spray Painting', 'Panel Beating'],
        activeJobs: [],
        completedJobs: [],
        performance: {
          totalJobsCompleted: 41,
          averageTurnaroundTime: 36,
          efficiencyScore: 89,
          customerRating: 4.7
        },
        laborHoursLogged: 445,
        availability: 'available',
        hireDate: new Date('2023-04-18'),
        birthday: new Date('1991-03-25'),
        salary: 72000
      },
      {
        firstName: 'Peter',
        lastName: 'Kiplagat',
        email: 'peter.kiplagat@garage.co.ke',
        phone: '+254767890123',
        specialization: 'detailer',
        skills: ['Ceramic Coating', 'Paint Correction', 'Interior Detailing'],
        activeJobs: [],
        completedJobs: [],
        performance: {
          totalJobsCompleted: 58,
          averageTurnaroundTime: 8,
          efficiencyScore: 93,
          customerRating: 4.9
        },
        laborHoursLogged: 390,
        availability: 'available',
        hireDate: new Date('2023-02-14'),
        birthday: new Date('1993-03-07'),
        salary: 68000
      },
      {
        firstName: 'Lucy',
        lastName: 'Akinyi',
        email: 'lucy.akinyi@garage.co.ke',
        phone: '+254778901234',
        specialization: 'installer',
        skills: ['Vinyl Wrapping', 'PPF Installation', 'Graphics Application'],
        activeJobs: [],
        completedJobs: [],
        performance: {
          totalJobsCompleted: 35,
          averageTurnaroundTime: 14,
          efficiencyScore: 87,
          customerRating: 4.6
        },
        laborHoursLogged: 370,
        availability: 'available',
        hireDate: new Date('2023-07-22'),
        birthday: new Date('1989-03-14'),
        salary: 69000
      },
      {
        firstName: 'Daniel',
        lastName: 'Mwangi',
        email: 'daniel.mwangi@garage.co.ke',
        phone: '+254789012345',
        specialization: 'technician',
        skills: ['AC Systems', 'Suspension', 'Brake Systems'],
        activeJobs: [],
        completedJobs: [],
        performance: {
          totalJobsCompleted: 48,
          averageTurnaroundTime: 20,
          efficiencyScore: 91,
          customerRating: 4.8
        },
        laborHoursLogged: 450,
        availability: 'available',
        hireDate: new Date('2023-01-30'),
        birthday: new Date('1987-03-21'),
        salary: 78000
      },
      {
        firstName: 'Anne',
        lastName: 'Chemutai',
        email: 'anne.chemutai@garage.co.ke',
        phone: '+254790123456',
        specialization: 'painter',
        skills: ['Blending', 'Surface Preparation', 'Clear Coating'],
        activeJobs: [],
        completedJobs: [],
        performance: {
          totalJobsCompleted: 39,
          averageTurnaroundTime: 40,
          efficiencyScore: 88,
          customerRating: 4.7
        },
        laborHoursLogged: 420,
        availability: 'available',
        hireDate: new Date('2023-05-11'),
        birthday: new Date('1994-03-09'),
        salary: 71000
      },
      {
        firstName: 'James',
        lastName: 'Otieno',
        email: 'james.otieno@garage.co.ke',
        phone: '+254701234567',
        specialization: 'detailer',
        skills: ['Engine Bay Detailing', 'Leather Treatment', 'Headlight Restoration'],
        activeJobs: [],
        completedJobs: [],
        performance: {
          totalJobsCompleted: 62,
          averageTurnaroundTime: 7,
          efficiencyScore: 94,
          customerRating: 4.8
        },
        laborHoursLogged: 400,
        availability: 'available',
        hireDate: new Date('2023-03-08'),
        birthday: new Date('1990-03-16'),
        salary: 67000
      },
      {
        firstName: 'Mary',
        lastName: 'Wambui',
        email: 'mary.wambui@garage.co.ke',
        phone: '+254712345689',
        specialization: 'installer',
        skills: ['Window Tinting', 'Paint Protection Film', 'Decals'],
        activeJobs: [],
        completedJobs: [],
        performance: {
          totalJobsCompleted: 33,
          averageTurnaroundTime: 15,
          efficiencyScore: 86,
          customerRating: 4.5
        },
        laborHoursLogged: 355,
        availability: 'available',
        hireDate: new Date('2023-08-19'),
        birthday: new Date('1992-03-28'),
        salary: 66000
      },
      {
        firstName: 'Patrick',
        lastName: 'Kimani',
        email: 'patrick.kimani@garage.co.ke',
        phone: '+254723456790',
        specialization: 'technician',
        skills: ['Transmission', 'Engine Repair', 'Computer Diagnostics'],
        activeJobs: [],
        completedJobs: [],
        performance: {
          totalJobsCompleted: 44,
          averageTurnaroundTime: 28,
          efficiencyScore: 89,
          customerRating: 4.7
        },
        laborHoursLogged: 465,
        availability: 'available',
        hireDate: new Date('2022-12-12'),
        birthday: new Date('1986-03-11'),
        salary: 79000
      },
      {
        firstName: 'Rebecca',
        lastName: 'Njoroge',
        email: 'rebecca.njoroge@garage.co.ke',
        phone: '+254734567891',
        specialization: 'painter',
        skills: ['Custom Paint', 'Airbrushing', 'Refinishing'],
        activeJobs: [],
        completedJobs: [],
        performance: {
          totalJobsCompleted: 37,
          averageTurnaroundTime: 44,
          efficiencyScore: 87,
          customerRating: 4.6
        },
        laborHoursLogged: 410,
        availability: 'available',
        hireDate: new Date('2023-06-03'),
        birthday: new Date('1995-03-22'),
        salary: 70000
      },
      {
        firstName: 'Thomas',
        lastName: 'Korir',
        email: 'thomas.korir@garage.co.ke',
        phone: '+254745678902',
        specialization: 'detailer',
        skills: ['Steam Cleaning', 'Odor Removal', 'Fabric Protection'],
        activeJobs: [],
        completedJobs: [],
        performance: {
          totalJobsCompleted: 55,
          averageTurnaroundTime: 9,
          efficiencyScore: 92,
          customerRating: 4.8
        },
        laborHoursLogged: 385,
        availability: 'available',
        hireDate: new Date('2023-04-25'),
        birthday: new Date('1991-03-30'),
        salary: 66000
      },
      {
        firstName: 'Elizabeth',
        lastName: 'Wairimu',
        email: 'elizabeth.wairimu@garage.co.ke',
        phone: '+254756789013',
        specialization: 'installer',
        skills: ['Full Vehicle Wrap', 'Chrome Delete', 'Emblem Installation'],
        activeJobs: [],
        completedJobs: [],
        performance: {
          totalJobsCompleted: 31,
          averageTurnaroundTime: 16,
          efficiencyScore: 85,
          customerRating: 4.5
        },
        laborHoursLogged: 345,
        availability: 'available',
        hireDate: new Date('2023-09-01'),
        birthday: new Date('1993-03-19'),
        salary: 65000
      }
    ]);
    console.log(`✅ Seeded ${mechanics.length} mechanics`);

    // Seed Users
    const users = await UserModel.insertMany([
      {
        firstName: 'Admin',
        lastName: 'Owner',
        email: 'admin@garage.co.ke',
        password: '$2a$12$5NIYlaphHKKE4ZzMHjdV5.4VFx9WRT9LZf0nnWdWy5K.G/BZZebqm',
        role: 'owner',
        isActive: true
      },
      {
        firstName: 'Manager',
        lastName: 'Kipchoge',        
        email: 'manager@garage.co.ke',
        password: '$2a$12$5NIYlaphHKKE4ZzMHjdV5.4VFx9WRT9LZf0nnWdWy5K.G/BZZebqm',
        role: 'manager',
        isActive: true
      },
      {
        firstName: 'John',
        lastName: 'Kamau',
        email: 'mechanic@garage.co.ke',
       password: '$2a$12$5NIYlaphHKKE4ZzMHjdV5.4VFx9WRT9LZf0nnWdWy5K.G/BZZebqm',
        role: 'mechanic',
        mechanicId: mechanics[0]._id,
        isActive: true
      },
      {
        firstName: 'Jane',
        lastName: 'Achieng',
        email: 'receptionist@garage.co.ke',
        password: '$2a$12$5NIYlaphHKKE4ZzMHjdV5.4VFx9WRT9LZf0nnWdWy5K.G/BZZebqm',
        role: 'receptionist',
        isActive: true
      }
    ]);
    console.log(`✅ Seeded ${users.length} users`);

    // Seed Customers
    const customers = await CustomerModel.insertMany([
      {
        name: 'Robert Njoroge',
        email: 'robert.njoroge@email.com',
        phone: '+254701234567',
        address: 'Westlands, Nairobi',
        birthday: new Date('1985-06-15'),
        notes: 'Preferred customer, always on time',
        serviceHistory: []
      },
      {
        name: 'Maria Mutua',
        email: 'maria.mutua@email.com',
        phone: '+254702345678',
        address: 'Lavington, Nairobi',
        birthday: new Date('1990-09-22'),
        serviceHistory: []
      },
      {
        name: 'David Kimani',
        email: 'david.kimani@email.com',
        phone: '+254703456789',
        address: 'Karen, Nairobi',
        birthday: new Date('1978-12-03'),
        serviceHistory: []
      }
    ]);
    console.log(`✅ Seeded ${customers.length} customers`);
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

    // Seed 24 sample cars (4 per stage) with KBB plates
    const carModels = [
      { make: 'BMW', model: '3 Series', years: [2020, 2021, 2022, 2023] },
      { make: 'BMW', model: '5 Series', years: [2020, 2021, 2022, 2023] },
      { make: 'BMW', model: 'X5', years: [2020, 2021, 2022, 2023] },
      { make: 'Mercedes', model: 'C-Class', years: [2020, 2021, 2022, 2023] },
      { make: 'Mercedes', model: 'E-Class', years: [2020, 2021, 2022, 2023] },
      { make: 'Mercedes', model: 'GLE', years: [2020, 2021, 2022, 2023] },
      { make: 'Audi', model: 'A4', years: [2020, 2021, 2022, 2023] },
      { make: 'Audi', model: 'A6', years: [2020, 2021, 2022, 2023] },
      { make: 'Audi', model: 'Q5', years: [2020, 2021, 2022, 2023] },
      { make: 'Toyota', model: 'Camry', years: [2019, 2020, 2021, 2022] },
      { make: 'Toyota', model: 'Land Cruiser', years: [2020, 2021, 2022, 2023] },
      { make: 'Nissan', model: 'Patrol', years: [2019, 2020, 2021, 2022] },
      { make: 'Nissan', model: 'X-Trail', years: [2019, 2020, 2021, 2022] }
    ];
    
    const colors = ['Black', 'White', 'Silver', 'Blue', 'Gray', 'Red'];
    const stages = ['waiting_inspection', 'in_repair', 'painting', 'detailing', 'quality_check', 'ready_pickup'];
    const serviceTypes = ['colour_repair', 'clean_shine', 'coat_guard'];
    
    const sampleCars = [];
    let plateNumber = 1;
    
    for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
      const stage = stages[stageIndex];
      
      for (let carInStage = 0; carInStage < 6; carInStage++) {
        const carModel = carModels[Math.floor(Math.random() * carModels.length)];
        const year = carModel.years[Math.floor(Math.random() * carModel.years.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
        
        // Assign mechanics based on stage
        let assignedMechanic = null;
        let statusProgress = 0;
        
        if (stage === 'in_repair') {
          assignedMechanic = mechanics[0];
          statusProgress = 30;
        } else if (stage === 'painting') {
          assignedMechanic = mechanics[0];
          statusProgress = 50;
        } else if (stage === 'detailing') {
          assignedMechanic = mechanics[1];
          statusProgress = 70;
        } else if (stage === 'quality_check') {
          statusProgress = 90;
        } else if (stage === 'ready_pickup') {
          statusProgress = 100;
        }
        
        const daysInGarage = Math.floor(Math.random() * 7) + 1;
        const plateStr = `KBB${String(plateNumber).padStart(3, '0')}${String.fromCharCode(65 + carInStage)}`;
        plateNumber++;
        
        sampleCars.push({
          customerId: customer._id,
          customerName: customer.name,
          vehicleModel: `${carModel.make} ${carModel.model} ${year}`,
          vehiclePlate: plateStr,
          vehicleYear: year,
          vehicleColor: color,
          serviceType: serviceType,
          services: ['Interior Detail'],
          stage: stage,
          statusProgress: statusProgress,
          assignedMechanicId: assignedMechanic?._id?.toString(),
          assignedMechanicName: assignedMechanic ? `${assignedMechanic.firstName} ${assignedMechanic.lastName}` : undefined,
          estimatedCost: Math.floor(Math.random() * 100000) + 50000, // Ksh 50k-150k
          paidAmount: statusProgress >= 90 ? Math.floor(Math.random() * 50000) : 0,
          paymentStatus: statusProgress >= 90 ? (Math.random() > 0.5 ? 'partial' : 'pending') : 'pending',
          checkInDate: new Date(Date.now() - daysInGarage * 24 * 60 * 60 * 1000),
          expectedCompletionDate: new Date(Date.now() + (7 - daysInGarage) * 24 * 60 * 60 * 1000),
          daysInGarage: daysInGarage,
          damageAssessment: serviceType === 'colour_repair' ? 'Minor scratches and paint damage' : undefined,
          beforePhotos: []
        });
      }
    }
    
    await CarModel.insertMany(sampleCars);
    console.log(`✅ Seeded ${sampleCars.length} sample cars (6 per stage) with KBB plates`);

    console.log('\n✨ Database seeding completed successfully!\n');
    console.log('📧 Login credentials:');
    console.log('   Owner: admin@garage.co.ke / admin123');
    console.log('   Manager: manager@garage.co.ke / manager123');
    console.log('   Mechanic: mechanic@garage.co.ke / mechanic123');
    console.log('   Receptionist: receptionist@garage.co.ke / receptionist123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
