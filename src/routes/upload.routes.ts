import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { memoryUpload } from '../middleware/upload';
import { asyncHandler } from '../utils/asyncHandler';
import { processAndStoreImage, deleteByPublicId } from '../services/storage.service';
import { ok, created } from '../utils/respond';
import { ApiError } from '../utils/ApiError';

const r = Router();
r.use(authenticate);
r.post('/images', memoryUpload.array('images', 6), asyncHandler(async (req, res) => {
  const filesArr = (req as any).files as Express.Multer.File[];
  if (!filesArr || !filesArr.length) throw ApiError.badRequest('VALIDATION_ERROR', 'No files uploaded');
  const out: any[] = [];
  for (const f of filesArr) out.push(await processAndStoreImage(f.buffer, { folder: 'uploads' }));
  created(res, { images: out });
}));
r.delete('/images/:publicId', asyncHandler(async (req, res) => {
  await deleteByPublicId(req.params.publicId);
  ok(res, { message: 'Deleted' });
}));
export default r;
