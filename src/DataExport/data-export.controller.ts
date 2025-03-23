import { Controller, Get, Param, Res, UseGuards, HttpException, HttpStatus, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { DataExportService } from './data-export.service';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('data-export')
@Controller('data-export')
@ApiBearerAuth('Authentication')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DataExportController {
  private readonly logger = new Logger(DataExportController.name);

  constructor(private readonly dataExportService: DataExportService) {}

  @Get('json/:id')
  @Roles(UserRole.ADMIN, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Export simulation results as JSON' })
  @ApiParam({ name: 'id', description: 'Simulation ID to export', type: 'string' })
  @ApiResponse({ status: 200, description: 'JSON file download' })
  @ApiResponse({ status: 404, description: 'Simulation not found' })
  async exportJSON(@Param('id') id: string, @Res() res: Response) {
    try {
      const filePath = await this.dataExportService.exportSimulationAsJSON(id);
      const fileName = path.basename(filePath);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      this.handleExportError(error);
    }
  }

  @Get('csv/:id')
  @Roles(UserRole.ADMIN, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Export simulation trajectory data as CSV' })
  @ApiParam({ name: 'id', description: 'Simulation ID to export', type: 'string' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  @ApiResponse({ status: 404, description: 'Simulation not found' })
  async exportCSV(@Param('id') id: string, @Res() res: Response) {
    try {
      const filePath = await this.dataExportService.exportSimulationAsCSV(id);
      const fileName = path.basename(filePath);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      this.handleExportError(error);
    }
  }

  @Get('pdf/:id')
  @Roles(UserRole.ADMIN, UserRole.RESEARCHER)
  @ApiOperation({ summary: 'Export simulation results as PDF report' })
  @ApiParam({ name: 'id', description: 'Simulation ID to export', type: 'string' })
  @ApiResponse({ status: 200, description: 'PDF file download' })
  @ApiResponse({ status: 404, description: 'Simulation not found' })
  async exportPDF(@Param('id') id: string, @Res() res: Response) {
    try {
      const filePath = await this.dataExportService.exportSimulationAsPDF(id);
      const fileName = path.basename(filePath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      this.handleExportError(error);
    }
  }

  private handleExportError(error: any) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    this.logger.error(`Export error: ${error.message}`);
    throw new InternalServerErrorException(`Failed to export data: ${error.message}`);
  }
}