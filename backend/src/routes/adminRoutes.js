import { Router } from 'express';
import {
  adminStats,
  adminUsers,
  adminItems,
  adminTransactions,
  adminReports,
  adminDeleteItem,
  adminDeleteUser,
  adminResolveReport,
} from '../controllers/adminController.js';
import { auth, admin } from '../middleware/auth.js';

const router = Router();

router.use(auth, admin);

router.get('/stats', adminStats);
router.get('/users', adminUsers);
router.get('/items', adminItems);
router.get('/transactions', adminTransactions);
router.get('/reports', adminReports);
router.delete('/items/:id', adminDeleteItem);
router.delete('/users/:id', adminDeleteUser);
router.put('/reports/:id/resolve', adminResolveReport);

export default router;