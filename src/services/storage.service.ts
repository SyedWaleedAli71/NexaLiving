import * as sharp from 'sharp';
import { uploadBuffer, deleteByPublicId, StoredImage } from '../config/storage';

export interface ProcessedImage { url: string; publicId: string; }

export async function processAndStoreImage(
  buffer: Buffer,
  opts: { folder?: string; width?: number; height?: number; cover?: boolean } = {}
): Promise<StoredImage> {
  let pipeline = (sharp as any).default ? (sharp as any).default(buffer) : (sharp as any)(buffer);
  if (opts.width && opts.height) {
    pipeline = pipeline.resize(opts.width, opts.height, { fit: 'cover', withoutEnlargement: true }).rotate();
  } else {
    pipeline = pipeline.rotate();
  }
  const out = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return uploadBuffer(out, { folder: opts.folder, format: 'jpeg' });
}

export { deleteByPublicId };
