import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { SimulationStatus, SimulationType } from '../entities/simulation.entity';

export class CreateSimulationDto {
  @ApiProperty({
    example: 'Molecular Dynamics Simulation',
    description: 'The name of the simulation',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: SimulationType,
    example: SimulationType.MOLECULAR_DYNAMICS,
    description: 'The type of simulation to run',
  })
  @IsEnum(SimulationType)
  @IsNotEmpty()
  type: SimulationType;

  @ApiProperty({
    example: {
      temperature: 310,
      pressure: 1,
      timeStep: 0.002,
      totalSteps: 1000000,
    },
    description: 'Parameters for the simulation',
  })
  @IsObject()
  @IsNotEmpty()
  parameters: object;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The ID of the molecular model to simulate',
  })
  @IsUUID()
  @IsNotEmpty()
  molecularModelId: string;
}

export class UpdateSimulationStatusDto {
  @ApiProperty({
    enum: SimulationStatus,
    example: SimulationStatus.PROCESSING,
    description: 'The updated status of the simulation',
  })
  @IsEnum(SimulationStatus)
  @IsOptional()
  status?: SimulationStatus;

  @ApiProperty({
    example: 'Error in force field parameters',
    description: 'Error message if the simulation failed',
    required: false,
  })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiProperty({
    example: { 
      statistics: {
        mean_potential_energy: 100000.5,
        std_potential_energy: 50.2,
        mean_temperature: 310.1,
        mean_pressure: 1.01
      },
      convergence_metrics: {
        energy_rmsd: 0.005,
        temperature_stability: 1.2
      },
      trajectory_sample: {
        time: [0, 10, 20],
        potential_energy: [99989.1, 99992.2, 100001.3]
      }
    },
    description: 'Processed results of the simulation',
    required: false,
  })
  @IsObject()
  @IsOptional()
  results?: object;
}

export class SimulationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: SimulationType })
  type: SimulationType;

  @ApiProperty()
  parameters: object;

  @ApiProperty({ enum: SimulationStatus })
  status: SimulationStatus;

  @ApiProperty({ nullable: true })
  errorMessage: string;

  @ApiProperty({ nullable: true })
  resultPath: string;

  @ApiProperty({ 
    nullable: true,
    description: 'Detailed simulation results with processed data',
    example: {
      statistics: {
        mean_potential_energy: 100000.5,
        std_potential_energy: 50.2,
        mean_temperature: 310.1,
        mean_pressure: 1.01
      },
      convergence_metrics: {
        energy_rmsd: 0.005,
        temperature_stability: 1.2
      },
      trajectory_sample: {
        time: [0, 10, 20],
        potential_energy: [99989.1, 99992.2, 100001.3]
      }
    }
  })
  results: object;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  startedAt: Date;

  @ApiProperty()
  completedAt: Date;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  molecularModelId: string;
}

// Add a new DTO for simulation analytics
export class SimulationAnalyticsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: SimulationType })
  type: SimulationType;

  @ApiProperty({ 
    description: 'Statistical analysis of the simulation results',
    example: {
      mean_potential_energy: 100000.5,
      std_potential_energy: 50.2,
      mean_temperature: 310.1,
      mean_pressure: 1.01,
      equilibration_time: 500.0
    }
  })
  statistics: Record<string, number>;

  @ApiProperty({ 
    description: 'Metrics for evaluating simulation quality and convergence',
    example: {
      energy_rmsd: 0.005,
      temperature_stability: 1.2,
      pressure_stability: 0.05,
      equilibration_percentage: 25.0
    }
  })
  convergence_metrics: Record<string, number>;

  @ApiProperty({
    description: 'Sampled trajectory data points for visualization',
    example: {
      time: [0, 200, 400, 600, 800, 1000],
      potential_energy: [99989.1, 99992.2, 100001.3, 100005.7, 100003.8, 100002.1]
    }
  })
  trajectory_sample: Record<string, Array<number>>;

  @ApiProperty({
    description: 'Total simulation time in picoseconds',
    example: 1000.0
  })
  simulation_time: number;
}