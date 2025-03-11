import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, HttpException, HttpStatus, InternalServerErrorException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SimulationService } from './simulation.service';
import { CreateSimulationDto, SimulationAnalyticsDto, SimulationResponseDto } from './dtos/simulation.dto';
import { UserRole } from '../users/entities/user.entity';
import { Request } from '../common/interfaces/request.interface'; 

@ApiTags('simulations')
@Controller('simulations')
@ApiBearerAuth('Authentication')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SimulationsController {
  private readonly logger = new Logger(SimulationsController.name);

  constructor(private readonly simulationsService: SimulationService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Create a new simulation' })
  @ApiResponse({
    status: 201,
    description: 'The simulation has been successfully created',
    type: SimulationResponseDto,
  })
  async create(@Body() createSimulationDto: CreateSimulationDto, @Req() req: Request) {
    try {
      const user = req.user;
      if (!user) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }
      return await this.simulationsService.createSimulation(createSimulationDto, user.id);
    } catch (error) {
      throw new HttpException(error.message || 'Failed to create simulation', HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get all simulations' })
  @ApiResponse({
    status: 200,
    description: 'Returns all simulations',
    type: [SimulationResponseDto],
  })
  async getAll() {
    return await this.simulationsService.getAllSimulations();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get a simulation by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the simulation with the specified ID',
    type: SimulationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Simulation not found' })
  async getById(@Param('id') id: string) {
    try {
      return await this.simulationsService.getSimulationById(id);
    } catch (error) {
      throw new HttpException(error.message || 'Simulation not found', HttpStatus.NOT_FOUND);
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a simulation' })
  @ApiResponse({ status: 204, description: 'The simulation has been successfully deleted' })
  @ApiResponse({ status: 404, description: 'Simulation not found' })
  async delete(@Param('id') id: string) {
    try {
      await this.simulationsService.deleteSimulation(id);
      return { success: true };
    } catch (error) {
      throw new HttpException(error.message || 'Simulation not found', HttpStatus.NOT_FOUND);
    }
  }

  @Post('/run-dask/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Run Distributed Simulation with OpenMM & Dask' })
  @ApiParam({ name: 'id', description: 'Simulation ID to run', type: 'string' })
  @ApiResponse({ status: 200, description: 'Simulation started successfully' })
  @ApiResponse({ status: 404, description: 'Simulation not found' })
  @ApiResponse({ status: 500, description: 'Simulation execution failed' })
  async runSimulation(@Param('id') id: string) {
    try {
      this.logger.log(`Starting OpenMM simulation for ID: ${id}`);
      const result = await this.simulationsService.runDistributedSimulation(id);
      this.logger.log(`Simulation ${id} executed successfully with OpenMM.`);
      
      return { 
        message: 'Simulation executed successfully on Dask cluster with OpenMM', 
        simulationId: id,
        result 
      };
    } catch (error) {
      this.logger.error(`Failed to execute simulation ${id} on OpenMM: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to execute simulation on OpenMM: ' + error.message);
    }
  }

  // New endpoint for retrieving simulation analytics
  @Get('/analytics/:id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get processed analytics data for a completed simulation' })
  @ApiParam({ name: 'id', description: 'Simulation ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Returns processed analytics from the simulation results',
    type: SimulationAnalyticsDto,
  })
  @ApiResponse({ status: 404, description: 'Simulation not found or not completed' })
  async getSimulationAnalytics(@Param('id') id: string) {
    try {
      this.logger.log(`Retrieving analytics for simulation ID: ${id}`);
      const analytics = await this.simulationsService.getSimulationAnalytics(id);
      this.logger.log(`Successfully retrieved analytics for simulation ${id}`);
      return analytics;
    } catch (error) {
      this.logger.error(`Failed to retrieve analytics for simulation ${id}: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new InternalServerErrorException('Failed to retrieve simulation analytics: ' + error.message);
    }
  }
}
