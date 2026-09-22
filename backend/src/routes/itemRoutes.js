import { Router } from 'express';
import {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/itemController.js';
import { auth } from '../middleware/auth.js';
import { uploadImages } from '../middleware/upload.js';

const router = Router();

router.get('/', listItems);
router.get('/:id', getItem);
router.post('/', auth, uploadImages, createItem);
router.put('/:id', auth, uploadImages, updateItem);
router.delete('/:id', auth, deleteItem);

export default router;