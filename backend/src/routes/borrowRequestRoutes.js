import { Router } from 'express';
import {
  createBorrowRequest,
  myBorrowRequests,
  receivedBorrowRequests,
  acceptBorrowRequest,
  declineBorrowRequest,
} from '../controllers/borrowRequestController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.post('/', createBorrowRequest);
router.get('/my', myBorrowRequests);
router.get('/received', receivedBorrowRequests);
router.put('/:id/accept', acceptBorrowRequest);
router.put('/:id/decline', declineBorrowRequest);

export default router;