import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as https from 'https';
import * as http from 'http';

@Injectable()
export class CloudflareR2Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName =
      this.configService.get<string>('R2_BUCKET_NAME') || 'warung-telegram';

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: this.configService.get<string>('R2_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID') || '',
        secretAccessKey:
          this.configService.get<string>('R2_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  async downloadImageFromUrl(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;

      client
        .get(url, (response) => {
          if (response.statusCode !== 200) {
            reject(
              new Error(`Failed to download image: ${response.statusCode}`),
            );
            return;
          }

          const chunks: Buffer[] = [];

          response.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });

          response.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer);
          });

          response.on('error', (error) => {
            reject(error);
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  private getMimeTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    return mimeTypes[extension || ''] || 'image/jpeg';
  }

  generateFileName(prefix: string, extension: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    return `${prefix}_${timestamp}_${randomString}${extension}`;
  }

  async uploadImageFromUrl(
    imageUrl: string,
    fileName?: string,
  ): Promise<{
    key: string;
    publicUrl: string;
    presignedUrl: string;
  }> {
    try {
      // Download image from URL
      const imageBuffer = await this.downloadImageFromUrl(imageUrl);

      // Generate filename if not provided
      const extension = imageUrl.split('.').pop() || 'jpg';
      const key = fileName || this.generateFileName('product', `.${extension}`);

      // Get MIME type
      const contentType = this.getMimeTypeFromUrl(imageUrl);

      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: imageBuffer,
        ContentType: contentType,
        ACL: 'public-read', // Make the object publicly readable
      });

      await this.s3Client.send(command);

      // Generate public URL
      const publicUrl = `${this.configService.get('R2_PUBLIC_URL')}/${key}`;

      // Generate presigned URL (for temporary access)
      const presignedUrl = await this.getPresignedUrl(key);

      return {
        key,
        publicUrl,
        presignedUrl,
      };
    } catch (error) {
      console.error('Error uploading image to R2:', error);
      throw new Error('Failed to upload image to Cloudflare R2');
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string = 'image/jpeg',
  ): Promise<{
    key: string;
    publicUrl: string;
    presignedUrl: string;
  }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read',
      });

      await this.s3Client.send(command);

      const publicUrl = `${this.configService.get('R2_PUBLIC_URL')}/${key}`;
      const presignedUrl = await this.getPresignedUrl(key);

      return {
        key,
        publicUrl,
        presignedUrl,
      };
    } catch (error) {
      console.error('Error uploading buffer to R2:', error);
      throw new Error('Failed to upload image to Cloudflare R2');
    }
  }

  async getPresignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteObject(key: string): Promise<void> {
    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error deleting object from R2:', error);
      throw new Error('Failed to delete image from Cloudflare R2');
    }
  }
}
