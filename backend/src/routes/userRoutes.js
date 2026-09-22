import { Router } from 'express';
import { getReputation, getPublicProfile } from '../controllers/userController.js';

const router = Router();

router.get('/:userId/reputation', getReputation);
router.get('/public/:id', getPublicProfile);

export default router;