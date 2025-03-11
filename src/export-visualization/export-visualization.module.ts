import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Simulation } from '../simulations/entities/simulation.entity';
import { MolecularModel } from '../molecular-models/entities/molecular-model.entity';
import { DataExportService } from '../DataExport/data-export.service';
import { DataExportController } from '../DataExport/data-export.controller';
import { VisualizationService } from '../visualization/visualization.service';
import { VisualizationController } from '../visualization/visualization.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Simulation, MolecularModel])
  ],
  providers: [
    DataExportService,
    VisualizationService
  ],
  controllers: [
    DataExportController,
    VisualizationController
  ],
  exports: [
    DataExportService,
    VisualizationService
  ]
})
export class ExportVisualizationModule {}