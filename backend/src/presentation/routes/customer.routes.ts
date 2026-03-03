import { Router } from 'express';
import { CustomerController } from '../controllers/Customer.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const customerController = new CustomerController();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create customer
router.post('/', customerController.createCustomer);

// Get all customers with pagination and search
router.get('/', customerController.getAllCustomers);

// Search customers
router.get('/search', customerController.searchCustomers);

// Get top customers
router.get('/top', customerController.getTopCustomers);

// Get customer by ID
router.get('/:id', customerController.getCustomer);

// Get customer service history
router.get('/:id/history', customerController.getCustomerServiceHistory);

// Update customer
router.put('/:id', customerController.updateCustomer);

// Add service to customer history
router.post('/:id/history', customerController.addServiceToHistory);

// Delete customer
router.delete('/:id', customerController.deleteCustomer);

export default router;
