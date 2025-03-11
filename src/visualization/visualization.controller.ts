import { Controller, Get, Param, UseGuards, HttpException, HttpStatus, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { VisualizationService } from './visualization.service';

@ApiTags('visualization')
@Controller('visualization')
@ApiBearerAuth('Authentication')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisualizationController {
  private readonly logger = new Logger(VisualizationController.name);

  constructor(private readonly visualizationService: VisualizationService) {}

  @Get('model/:id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get molecular model data for 3D visualization' })
  @ApiParam({ name: 'id', description: 'Molecular model ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Returns model data formatted for Three.js visualization' })
  @ApiResponse({ status: 404, description: 'Model not found' })
  async getModelForVisualization(@Param('id') id: string) {
    try {
      return await this.visualizationService.getModelForVisualization(id);
    } catch (error) {
      this.handleVisualizationError(error);
    }
  }

  @Get('trajectory/:id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get simulation trajectory data for 3D visualization' })
  @ApiParam({ name: 'id', description: 'Simulation ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Returns trajectory data formatted for Three.js visualization' })
  @ApiResponse({ status: 404, description: 'Simulation not found' })
  async getTrajectoryForVisualization(@Param('id') id: string) {
    try {
      return await this.visualizationService.getSimulationTrajectoryForVisualization(id);
    } catch (error) {
      this.handleVisualizationError(error);
    }
  }

  private handleVisualizationError(error: any) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    this.logger.error(`Visualization error: ${error.message}`);
    throw new InternalServerErrorException(`Failed to prepare visualization data: ${error.message}`);
  }
}