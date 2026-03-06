import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../../application/services/Inventory.service';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  createItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.inventoryService.createItem(req.body);
      res.status(201).json({
        success: true,
        data: item
      });
    } catch (error) {
      next(error);
    }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await this.inventoryService.updateItem(id, req.body);
      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      next(error);
    }
  };

  getItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await this.inventoryService.getItemById(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }
      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      next(error);
    }
  };

  getAllItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, category, lowStock, page, limit } = req.query;
      const result = await this.inventoryService.getAllItems({
        search: search as string,
        category: category as string,
        lowStock: lowStock === 'true',
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });
      res.json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages
        }
      });
    } catch (error) {
      next(error);
    }
  };

  deleteItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.inventoryService.deleteItem(id);
      res.json({
        success: true,
        message: 'Item deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getLowStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await this.inventoryService.getLowStockItems();
      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      next(error);
    }
  };

  updateStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const item = await this.inventoryService.updateStock(id, quantity);
      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      next(error);
    }
  };
}
