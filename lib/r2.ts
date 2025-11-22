import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const bucketName = process.env.R2_BUCKET_NAME!;

export interface UploadParams {
  key: string;
  body: Buffer;
  contentType: string;
}

export async function uploadToR2(params: UploadParams): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
  });

  await r2Client.send(command);

  // Return public URL
  return `${process.env.R2_PUBLIC_URL}/${params.key}`;
}

export async function getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  // URL valid for 1 hour
  return await getSignedUrl(r2Client, command, { expiresIn: 3600 });
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  // URL valid for 24 hours
  return await getSignedUrl(r2Client, command, { expiresIn: 86400 });
}

export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await r2Client.send(command);
}

export function generateStoragePath(
  photographerId: string,
  albumId: string,
  filename: string,
  type: 'original' | 'optimized' | 'thumbnail'
): string {
  return `galleries/${photographerId}/${albumId}/${type}/${filename}`;
}
