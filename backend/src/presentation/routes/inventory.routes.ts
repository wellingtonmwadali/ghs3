import { Router } from 'express';
import { InventoryController } from '../controllers/Inventory.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const inventoryController = new InventoryController();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get low stock items
router.get('/low-stock', inventoryController.getLowStock);

// Create item
router.post('/', inventoryController.createItem);

// Get all items with filters
router.get('/', inventoryController.getAllItems);

// Get item by ID
router.get('/:id', inventoryController.getItem);

// Update item
router.put('/:id', inventoryController.updateItem);

// Update stock quantity
router.patch('/:id/stock', inventoryController.updateStock);

// Delete item
router.delete('/:id', inventoryController.deleteItem);

export default router;
