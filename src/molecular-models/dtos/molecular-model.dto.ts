import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ModelFormat } from '../entities/molecular-model.entity';

export class CreateMolecularModelDto {
  @ApiProperty({
    example: 'Protein-Ligand Complex',
    description: 'The name of the molecular model',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'A complex of protein and ligand for binding affinity analysis',
    description: 'Description of the molecular model',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: ModelFormat,
    example: ModelFormat.PDB,
    description: 'The format of the molecular model file',
  })
  @IsEnum(ModelFormat)
  @IsNotEmpty()
  format: ModelFormat;
}

export class MolecularModelResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: ModelFormat })
  format: ModelFormat;

  @ApiProperty()
  isValidated: boolean;

  @ApiProperty({
    type: 'object',
    nullable: true,
    description: 'Validation results for the molecular model',
    properties: {},  
    additionalProperties: true,  
  })
  validationResults: object;

  @ApiProperty()
  uploadedAt: Date;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  filePath: string; 
}
