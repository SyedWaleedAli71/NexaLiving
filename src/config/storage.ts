import { env } from './env';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

let cloudinary: any = null;
if (env.STORAGE_DRIVER === 'cloudinary') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cloud = require('cloudinary').v2;
  cloud.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  cloudinary = cloud;
}

export const storageDriver = env.STORAGE_DRIVER;

export interface StoredImage {
  url: string;
  publicId: string;
}

export async function uploadBuffer(
  buffer: Buffer,
  opts: { folder?: string; width?: number; height?: number; format?: 'jpeg' | 'webp' | 'png' } = {}
): Promise<StoredImage> {
  const format = opts.format || 'jpeg';
  // sharp resize handled by caller for now; this stores the already-processed buffer
  if (storageDriver === 'cloudinary' && cloudinary) {
    const publicId = `${opts.folder || 'nexaliving'}/${uuidv4()}`;
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: opts.folder, public_id: publicId, resource_type: 'image' },
        (err: any, result: any) => {
          if (err) return reject(err);
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      stream.end(buffer);
    });
  }
  // local driver: write to uploads/
  const id = uuidv4();
  const fname = `${id}.${format === 'jpeg' ? 'jpg' : format}`;
  const fpath = path.join(UPLOAD_DIR, fname);
  await fs.promises.writeFile(fpath, buffer);
  return { url: `/uploads/${fname}`, publicId: id };
}

export async function deleteByPublicId(publicId: string): Promise<void> {
  if (storageDriver === 'cloudinary' && cloudinary) {
    await cloudinary.uploader.destroy(publicId);
    return;
  }
  const fname = publicId.replace(/[^a-zA-Z0-9._-]/g, '');
  const fpath = path.join(UPLOAD_DIR, fname);
  try {
    await fs.promises.unlink(fpath);
  } catch {
    /* ignore */
  }
}

export function serveStaticPath(): string {
  return UPLOAD_DIR;
}
