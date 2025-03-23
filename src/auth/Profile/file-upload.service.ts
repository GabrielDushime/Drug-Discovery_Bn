import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);

@Injectable()
export class FileUploadService {
  private uploadDir: string;
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
    this.baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3000');
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists(): Promise<void> {
    const profileUploadsDir = path.join(process.cwd(), this.uploadDir, 'profiles');
    if (!(await existsAsync(profileUploadsDir))) {
      try {
        await mkdirAsync(profileUploadsDir, { recursive: true });
      } catch (error) {
        console.error('Error creating upload directory:', error);
      }
    }
  }

  async saveProfilePhoto(file: Express.Multer.File, userId: string): Promise<{ url: string; filename: string }> {
    // Generate a unique filename
    const fileExtension = path.extname(file.originalname);
    const filename = `${userId}_${uuidv4()}${fileExtension}`;
    
    // Define path to save the file
    const uploadPath = path.join(process.cwd(), this.uploadDir, 'profiles', filename);
    
    // Save the file
    await writeFileAsync(uploadPath, file.buffer);
    
    // Return the URL to access the file
    const fileUrl = `${this.baseUrl}/uploads/profiles/${filename}`;
    
    return {
      url: fileUrl,
      filename: filename,
    };
  }

  async deleteProfilePhoto(filename: string): Promise<void> {
    if (!filename) return;
    
    const filePath = path.join(process.cwd(), this.uploadDir, 'profiles', filename);
    
    // Check if the file exists before attempting to delete
    if (await existsAsync(filePath)) {
      try {
        await promisify(fs.unlink)(filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  }
}