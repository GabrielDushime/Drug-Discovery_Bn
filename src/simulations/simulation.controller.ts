import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SimulationService } from './simulation.service';
import { CreateSimulationDto, SimulationResponseDto } from './dtos/simulation.dto';
import { UserRole } from '../users/entities/user.entity';
import { Request } from '../common/interfaces/request.interface'; 

@ApiTags('simulations')
@Controller('simulations')
@ApiBearerAuth('Authentication')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SimulationsController {
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
}
