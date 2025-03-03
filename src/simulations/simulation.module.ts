import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SimulationService } from './simulation.service';
import { Simulation } from './entities/simulation.entity';
import { User } from '../users/entities/user.entity';
import { MolecularModelsModule } from '../molecular-models/molecular-models.module';
import { SimulationsController } from './simulation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Simulation, User]),
    MolecularModelsModule, 
  ],
  controllers: [SimulationsController],
  providers: [SimulationService],
  exports: [SimulationService],
})
export class SimulationsModule {}