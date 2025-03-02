import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { MolecularModelsService } from './molecular-models.service';
import { MolecularModelsController } from './molecular-models.controller';
import { MolecularModel } from './entities/molecular-model.entity';
import { MolecularValidationService } from './molecular-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MolecularModel]),
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads/molecular-models');
          // Create directory if it doesn't exist
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, file.fieldname + '-' + uniqueSuffix + ext);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.pdb', '.mol2', '.sdf'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only PDB, MOL2, and SDF files are allowed.'), false);
        }
      },
    }),
  ],
  controllers: [MolecularModelsController],
  providers: [MolecularModelsService, MolecularValidationService],
  exports: [MolecularModelsService],
})
export class MolecularModelsModule {}