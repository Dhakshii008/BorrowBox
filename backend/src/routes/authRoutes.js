import { Router } from 'express';
import { register, login, me, updateProfile, changePassword } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { uploadImages } from '../middleware/upload.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);
router.put('/profile', auth, uploadImages, updateProfile);
router.put('/password', auth, changePassword);

export default router;