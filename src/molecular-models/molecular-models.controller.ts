import { Body, Controller, Delete, Get, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { MolecularModelsService } from './molecular-models.service';
import { CreateMolecularModelDto, MolecularModelResponseDto } from './dtos/molecular-model.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Express } from 'express';

@ApiTags('Molecular Models')
@ApiBearerAuth('Authentication')
@Controller('molecular-models')
 @UseGuards(JwtAuthGuard) 
export class MolecularModelsController {
  constructor(private readonly molecularModelsService: MolecularModelsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new molecular model' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        format: { type: 'string', enum: ['pdb', 'mol2', 'sdf'] },
        file: {
          type: 'string',
          format: 'binary',
        },
      }
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Molecular model uploaded successfully',
    type: MolecularModelResponseDto,
  })
  async create(
    @Body() createMolecularModelDto: CreateMolecularModelDto,
    @UploadedFile() file: Express.Multer.File, 
    @Req() req: any,
  ): Promise<MolecularModelResponseDto> {
    return this.molecularModelsService.create(
      createMolecularModelDto,
      file,
      req.user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all molecular models for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Return all molecular models',
    type: [MolecularModelResponseDto],
  })
  async findAll(@Req() req: any): Promise<MolecularModelResponseDto[]> {
    return this.molecularModelsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a molecular model by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the molecular model',
    type: MolecularModelResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Molecular model not found',
  })
  async findOne(@Param('id') id: string): Promise<MolecularModelResponseDto> {
    return this.molecularModelsService.findOne(id);
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'Download the molecular model file' })
  @ApiResponse({
    status: 200,
    description: 'Returns the molecular model file',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async downloadFile(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const { path, filename } = await this.molecularModelsService.getModelFile(id);
    res.download(path, filename);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a molecular model' })
  @ApiResponse({
    status: 200,
    description: 'Molecular model deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Molecular model not found',
  })
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    return this.molecularModelsService.remove(id, req.user.id);
  }
}
