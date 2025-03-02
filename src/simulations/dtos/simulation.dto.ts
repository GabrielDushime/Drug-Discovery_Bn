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
  @IsNotEmpty()
  status: SimulationStatus;

  @ApiProperty({
    example: 'Error in force field parameters',
    description: 'Error message if the simulation failed',
    required: false,
  })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiProperty({
    example: { bindingAffinity: -9.2, rmsd: 1.5 },
    description: 'Results of the simulation',
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

  @ApiProperty({ nullable: true })
  results: object;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  startedAt: Date;

  @ApiProperty({ nullable: true })
  completedAt: Date;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  molecularModelId: string;
}