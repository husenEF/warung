import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as https from 'https';
import * as http from 'http';

const mkdir = promisify(fs.mkdir);

@Injectable()
export class FileService {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.baseUrl =
      this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
    void this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists() {
    try {
      await mkdir(this.uploadDir, { recursive: true });
    } catch {
      // Directory already exists or error creating it
    }
  }

  async downloadAndSaveImage(
    fileUrl: string,
    fileName: string,
  ): Promise<{ localPath: string; publicUrl: string }> {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.uploadDir, fileName);
      const file = fs.createWriteStream(filePath);

      const protocol = fileUrl.startsWith('https') ? https : http;

      protocol
        .get(fileUrl, (response) => {
          if (response.statusCode !== 200) {
            reject(
              new Error(`Failed to download image: ${response.statusCode}`),
            );
            return;
          }

          response.pipe(file);

          file.on('finish', () => {
            file.close();
            const publicUrl = `${this.baseUrl}/uploads/${fileName}`;
            resolve({ localPath: filePath, publicUrl });
          });

          file.on('error', (error) => {
            fs.unlink(filePath, () => {}); // Delete the file if error
            reject(error);
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  generateFileName(originalName: string, extension: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    return `${timestamp}_${randomString}${extension}`;
  }
}
