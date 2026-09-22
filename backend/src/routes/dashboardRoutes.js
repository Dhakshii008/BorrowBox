import { Router } from 'express';
import { dashboardStats } from '../controllers/itemController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, dashboardStats);

export default router;