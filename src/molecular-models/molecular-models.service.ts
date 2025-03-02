import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { MolecularModel, ModelFormat } from './entities/molecular-model.entity';
import { CreateMolecularModelDto, MolecularModelResponseDto } from './dtos/molecular-model.dto';
import { MolecularValidationService } from './molecular-validation.service';

@Injectable()
export class MolecularModelsService {
  constructor(
    @InjectRepository(MolecularModel)
    private molecularModelRepository: Repository<MolecularModel>,
    private molecularValidationService: MolecularValidationService,
  ) {}

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
    
   
    const validation = await this.molecularValidationService.validateMolecularModel(
      file.path,
      modelFormat,
    );
    
    // Create and save the molecular model
    const molecularModel = this.molecularModelRepository.create({
      name,
      description,
      format: modelFormat,
      filePath: file.path,  
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

  async findOne(id: string): Promise<MolecularModelResponseDto> {
    const model = await this.molecularModelRepository.findOne({ where: { id } });
    if (!model) {
      throw new NotFoundException(`Molecular model with ID ${id} not found`);
    }
    return this.toResponseDto(model);  
  }

  async remove(id: string, userId: string): Promise<void> {
    const model = await this.molecularModelRepository.findOne({ where: { id, userId } });
    if (!model) {
      throw new NotFoundException(`Molecular model with ID ${id} not found`);
    }

   
    try {
      if (fs.existsSync(model.filePath)) {
        fs.unlinkSync(model.filePath);  
      }
    } catch (error) {
      
      console.error(`Error deleting file: ${error.message}`);
    }
    
    await this.molecularModelRepository.remove(model);
  }

  async getModelFile(id: string): Promise<{ path: string; filename: string }> {
    const model = await this.findOne(id);
    
    if (!fs.existsSync(model.filePath)) {
      throw new NotFoundException('Model file not found on disk');
    }
    
    const filename = path.basename(model.filePath);
    return { path: model.filePath, filename };  
  }
}
