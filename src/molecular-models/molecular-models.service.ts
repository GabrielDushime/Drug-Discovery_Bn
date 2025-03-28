import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

import { MolecularModel, ModelFormat } from './entities/molecular-model.entity';
import { CreateMolecularModelDto, MolecularModelResponseDto } from './dtos/molecular-model.dto';
import { MolecularValidationService } from './molecular-validation.service';

function getUploadDirectory(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    return path.join(process.cwd(), 'uploads', 'molecular-models');
  } else {
    return path.join(os.tmpdir(), 'molecular-models-uploads');
  }
}

@Injectable()
export class MolecularModelsService {
  private uploadDir: string;

  constructor(
    @InjectRepository(MolecularModel)
    private molecularModelRepository: Repository<MolecularModel>,
    private molecularValidationService: MolecularValidationService,
  ) {
    this.uploadDir = getUploadDirectory();
    fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  async create(
    createMolecularModelDto: CreateMolecularModelDto,
    file: Express.Multer.File,
    userId: string,
  ): Promise<MolecularModelResponseDto> {
    const { name, description, format } = createMolecularModelDto;

    let modelFormat = format;
    if (!modelFormat) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.pdb') modelFormat = ModelFormat.PDB;
      else if (ext === '.mol2') modelFormat = ModelFormat.MOL2;
      else if (ext === '.sdf') modelFormat = ModelFormat.SDF;
      else throw new Error('Unsupported file format');
    }
    
    const filename = `molecular-model-${Date.now()}-${Math.round(Math.random() * 1000000)}${path.extname(file.originalname)}`;
    const destinationPath = path.join(this.uploadDir, filename);

    await fs.move(file.path, destinationPath);
    
    const validation = await this.molecularValidationService.validateMolecularModel(
      destinationPath,
      modelFormat,
    );
    
    const molecularModel = this.molecularModelRepository.create({
      name,
      description,
      format: modelFormat,
      filePath: destinationPath,
      isValidated: validation.isValid,
      validationResults: validation.results,
      userId,
    });

    const savedModel = await this.molecularModelRepository.save(molecularModel);
    return this.toResponseDto(savedModel);
  }

  private toResponseDto(model: MolecularModel): MolecularModelResponseDto {
    return {
      id: model.id,
      name: model.name,
      description: model.description,
      format: model.format,
      filePath: model.filePath,
      isValidated: model.isValidated,
      validationResults: model.validationResults,
      uploadedAt: model.uploadedAt,
      userId: model.userId,
    };
  }

  async findAll(userId: string): Promise<MolecularModelResponseDto[]> {
    const models = await this.molecularModelRepository.find({
      where: { userId },
      order: { uploadedAt: 'DESC' },
    });
    return models.map(model => this.toResponseDto(model));
  }

  async findAllByAdmin(): Promise<MolecularModelResponseDto[]> {
    const models = await this.molecularModelRepository.find({
      order: { uploadedAt: 'DESC' },
    });
    return models.map(model => this.toResponseDto(model));
  }

  async findOne(id: string): Promise<MolecularModelResponseDto> {
    const model = await this.molecularModelRepository.findOne({ where: { id } });
    if (!model) {
      throw new NotFoundException(`Molecular model with ID ${id} not found`);
    }
    return this.toResponseDto(model);
  }

  async remove(id: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const model = await this.molecularModelRepository.findOne({ where: { id } });
    
    if (!model) {
      throw new NotFoundException(`Molecular model with ID ${id} not found`);
    }
    
    if (!isAdmin && model.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this model');
    }
    
    try {
      if (await fs.pathExists(model.filePath)) {
        await fs.remove(model.filePath);
      }
    } catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }

    await this.molecularModelRepository.remove(model);
  }

  async getModelFile(id: string): Promise<{ path: string; filename: string }> {
    const model = await this.findOne(id);
    
    if (!await fs.pathExists(model.filePath)) {
      throw new NotFoundException('Model file not found on disk');
    }

    const filename = path.basename(model.filePath);

    return { path: model.filePath, filename };
  }
}