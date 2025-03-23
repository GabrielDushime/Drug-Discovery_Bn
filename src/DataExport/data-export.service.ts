import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Simulation } from '../simulations/entities/simulation.entity';
import * as json2csv from 'json2csv';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class DataExportService {
  private readonly logger = new Logger(DataExportService.name);
  private readonly exportDir = path.join(process.cwd(), 'exports');

  constructor(
    @InjectRepository(Simulation)
    private readonly simulationRepository: Repository<Simulation>,
  ) {
    // Ensure export directory exists
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  async exportSimulationAsJSON(simulationId: string): Promise<string> {
    const simulation = await this.getSimulation(simulationId);
    const filename = `simulation_${simulationId}_${Date.now()}.json`;
    const filePath = path.join(this.exportDir, filename);

    try {
      const data = JSON.stringify(simulation.results, null, 2);
      fs.writeFileSync(filePath, data);
      this.logger.log(`Exported simulation ${simulationId} as JSON to ${filePath}`);
      return filePath;
    } catch (error) {
      this.logger.error(`Failed to export simulation ${simulationId} as JSON: ${error.message}`);
      throw error;
    }
  }

  async exportSimulationAsCSV(simulationId: string): Promise<string> {
    const simulation = await this.getSimulation(simulationId);
    const filename = `simulation_${simulationId}_${Date.now()}.csv`;
    const filePath = path.join(this.exportDir, filename);
  
    try {
      // Extract trajectory data which is most suitable for CSV format
      const results = simulation.results as any;
      
      if (!results.trajectory_sample || Object.keys(results.trajectory_sample).length === 0) {
        throw new Error('No trajectory data available for CSV export');
      }
      
      // Convert trajectory sample to array of objects for CSV conversion
      const trajectoryData: Array<Record<string, any>> = [];
      const keys = Object.keys(results.trajectory_sample);
      const dataLength = results.trajectory_sample[keys[0]].length;
      
      for (let i = 0; i < dataLength; i++) {
        const dataPoint: Record<string, any> = {};
        keys.forEach(key => {
          dataPoint[key] = results.trajectory_sample[key][i];
        });
        trajectoryData.push(dataPoint);
      }
      
      // Convert to CSV using json2csv
      const parser = new json2csv.Parser({ fields: keys });
      const csv = parser.parse(trajectoryData);
      
      fs.writeFileSync(filePath, csv);
      this.logger.log(`Exported simulation ${simulationId} as CSV to ${filePath}`);
      return filePath;
    } catch (error) {
      this.logger.error(`Failed to export simulation ${simulationId} as CSV: ${error.message}`);
      throw error;
    }
  }
  async exportSimulationAsPDF(simulationId: string): Promise<string> {
    const simulation = await this.getSimulation(simulationId);
    const filename = `simulation_${simulationId}_${Date.now()}.pdf`;
    const filePath = path.join(this.exportDir, filename);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);
        
        
        stream.on('close', () => {
          this.logger.log(`Exported simulation ${simulationId} as PDF to ${filePath}`);
          resolve(filePath);
        });
        
        doc.pipe(stream);
        
        // PDF Content
        doc.fontSize(20).text(`Simulation Report: ${simulation.name}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Simulation ID: ${simulation.id}`);
        doc.fontSize(14).text(`Type: ${simulation.type}`);
        doc.fontSize(14).text(`Status: ${simulation.status}`);
        doc.fontSize(14).text(`Started: ${simulation.startedAt.toLocaleString()}`);
        doc.fontSize(14).text(`Completed: ${simulation.completedAt.toLocaleString()}`);
        
        doc.moveDown();
        doc.fontSize(16).text('Parameters:', { underline: true });
        
        // Add parameters
        Object.entries(simulation.parameters).forEach(([key, value]) => {
          doc.fontSize(12).text(`${key}: ${value}`);
        });
        
        // Add results if available
        const results = simulation.results as any;
        if (results) {
          doc.moveDown();
          doc.fontSize(16).text('Results Summary:', { underline: true });
          
          // Statistics
          if (results.statistics) {
            doc.moveDown();
            doc.fontSize(14).text('Statistics:');
            Object.entries(results.statistics).forEach(([key, value]) => {
              doc.fontSize(12).text(`${key}: ${value}`);
            });
          }
          
          // Convergence metrics
          if (results.convergence_metrics) {
            doc.moveDown();
            doc.fontSize(14).text('Convergence Metrics:');
            Object.entries(results.convergence_metrics).forEach(([key, value]) => {
              doc.fontSize(12).text(`${key}: ${value}`);
            });
          }
          
          // Information about trajectory
          if (results.simulation_time) {
            doc.moveDown();
            doc.fontSize(14).text(`Total Simulation Time: ${results.simulation_time} ps`);
          }
          
          if (results.total_frames) {
            doc.fontSize(14).text(`Total Frames: ${results.total_frames}`);
          }
        }
        
        doc.end();
      } catch (error) {
        this.logger.error(`Failed to export simulation ${simulationId} as PDF: ${error.message}`);
        reject(error);
      }
    });
  }

  private async getSimulation(simulationId: string): Promise<Simulation> {
    const simulation = await this.simulationRepository.findOne({ where: { id: simulationId } });
    if (!simulation) {
      throw new NotFoundException(`Simulation with ID ${simulationId} not found`);
    }
    
    if (!simulation.results) {
      throw new NotFoundException(`No results found for simulation ${simulationId}`);
    }
    
    return simulation;
  }
}