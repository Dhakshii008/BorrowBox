import { Router } from 'express';
import {
  createReview,
  listReviewsForUser,
  listMyReviews,
} from '../controllers/reviewController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/user/:userId', listReviewsForUser);
router.get('/mine', auth, listMyReviews);
router.post('/', auth, createReview);

export default router;