import { Router } from 'express';
import {
  generateHandover,
  verifyHandover,
  verifyHandoverByToken,
  handoverInfo,
  requestReturn,
  confirmReturn,
  myTransactions,
  ownedTransactions,
} from '../controllers/transactionController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/handover/info/:token', handoverInfo);

router.use(auth);

router.post('/handover/:requestId/generate', generateHandover);
router.post('/handover/:requestId/verify', verifyHandover);
router.post('/handover/verify', verifyHandoverByToken);
router.post('/:id/request-return', requestReturn);
router.put('/:id/confirm-return', confirmReturn);
router.get('/my', myTransactions);
router.get('/owned', ownedTransactions);

export default router;