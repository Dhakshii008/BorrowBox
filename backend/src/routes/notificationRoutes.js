import { Router } from 'express';
import {
  getNotifications,
  markRead,
  markAllRead,
} from '../controllers/notificationController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);

export default router;