import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Simulation } from '../simulations/entities/simulation.entity';
import { MolecularModel } from '../molecular-models/entities/molecular-model.entity';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);


interface Atom {
  serial: number;
  name: string;
  element: string;
  residueName: string;
  chainId: string;
  residueNumber: number;
  position: { x: number; y: number; z: number };
}

interface Bond {
  atomIndex1: number;
  atomIndex2: number;
  distance: number;
}

interface TrajectoryFrame {
  time: any;
  potentialEnergy: any;
  kineticEnergy: any;
  temperature: any;

}

interface StructureData {
  atoms: Atom[];
  bonds: Bond[];
  atomCount: number;
  bondCount: number;
}

@Injectable()
export class VisualizationService {
  private readonly logger = new Logger(VisualizationService.name);

  constructor(
    @InjectRepository(Simulation)
    private readonly simulationRepository: Repository<Simulation>,
    @InjectRepository(MolecularModel)
    private readonly molecularModelRepository: Repository<MolecularModel>,
  ) {}

  async getModelForVisualization(molecularModelId: string): Promise<any> {
    try {
      const model = await this.molecularModelRepository.findOne({
        where: { id: molecularModelId }
      });
      
      if (!model) {
        throw new NotFoundException(`Molecular model with ID ${molecularModelId} not found`);
      }
      
      
      const modelPath = model.filePath;
      
      if (!modelPath || !fs.existsSync(modelPath)) {
        throw new NotFoundException(`Model file not found at ${modelPath}`);
      }
      
   
      const structureData = await this.processPDBForThreeJS(modelPath);
      
      return {
        id: model.id,
        name: model.name,
        description: model.description,
        structureData
      };
    } catch (error) {
      this.logger.error(`Failed to get model for visualization: ${error.message}`);
      throw error;
    }
  }

  async getSimulationTrajectoryForVisualization(simulationId: string): Promise<any> {
    try {
      const simulation = await this.simulationRepository.findOne({
        where: { id: simulationId },
        relations: ['molecularModel']
      });
      
      if (!simulation) {
        throw new NotFoundException(`Simulation with ID ${simulationId} not found`);
      }
      
      if (!simulation.molecularModel) {
        throw new NotFoundException(`No molecular model associated with simulation ${simulationId}`);
      }
      
     
      const modelData = await this.getModelForVisualization(simulation.molecularModelId);
      
     
      const results = simulation.results as any;
      
      if (!results || !results.trajectory_sample) {
        throw new NotFoundException(`No trajectory data available for simulation ${simulationId}`);
      }
      
      
      const trajectoryFrames = this.formatTrajectoryForThreeJS(results.trajectory_sample);
      
      return {
        simulation: {
          id: simulation.id,
          name: simulation.name,
          type: simulation.type,
          parameters: simulation.parameters
        },
        model: modelData,
        trajectory: trajectoryFrames
      };
    } catch (error) {
      this.logger.error(`Failed to get trajectory for visualization: ${error.message}`);
      throw error;
    }
  }

  private async processPDBForThreeJS(pdbFilePath: string): Promise<StructureData> {
    try {
  
      const validationScriptPath = path.join(process.cwd(), 'src/scripts/molecular_validation.py');
      const { stdout } = await execPromise(`python ${validationScriptPath} ${pdbFilePath}`);
      
      const validationResult = JSON.parse(stdout);
      
      if (!validationResult.isValid) {
        throw new Error(`Invalid PDB file: ${validationResult.message || validationResult.error}`);
      }
      
     
      const pdbContent = fs.readFileSync(pdbFilePath, 'utf8');
      
  
      const atoms: Atom[] = [];
      const lines = pdbContent.split('\n');
      
      for (const line of lines) {
       
        if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
          try {
            const atomType = line.substring(76, 78).trim();
            const x = parseFloat(line.substring(30, 38));
            const y = parseFloat(line.substring(38, 46));
            const z = parseFloat(line.substring(46, 54));
            const serial = parseInt(line.substring(6, 11).trim());
            const name = line.substring(12, 16).trim();
            const residueName = line.substring(17, 20).trim();
            const chainId = line.substring(21, 22);
            const residueNumber = parseInt(line.substring(22, 26).trim());
            
            atoms.push({
              serial,
              name,
              element: atomType,
              residueName,
              chainId,
              residueNumber,
              position: { x, y, z }
            });
          } catch (e) {
            this.logger.warn(`Error parsing atom line: ${line}`);
          
          }
        }
      }
      
      
      const bonds = this.calculateSimplifiedBonds(atoms);
      
      return {
        atoms,
        bonds,
        atomCount: atoms.length,
        bondCount: bonds.length
      };
    } catch (error) {
      this.logger.error(`Failed to process PDB for Three.js: ${error.message}`);
      throw error;
    }
  }

  private calculateSimplifiedBonds(atoms: Atom[]): Bond[] {
    
    const bonds: Bond[] = [];
    const maxBondDistance = 2.0; 
    
  
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const atom1 = atoms[i];
        const atom2 = atoms[j];
        
        
        if (atom1.residueNumber !== atom2.residueNumber && 
            Math.abs(atom1.residueNumber - atom2.residueNumber) > 1) {
          continue;
        }
        
        const distance = Math.sqrt(
          Math.pow(atom1.position.x - atom2.position.x, 2) +
          Math.pow(atom1.position.y - atom2.position.y, 2) +
          Math.pow(atom1.position.z - atom2.position.z, 2)
        );
        
        if (distance < maxBondDistance) {
          bonds.push({
            atomIndex1: i,
            atomIndex2: j,
            distance
          });
        }
      }
    }
    
    return bonds;
  }

  private formatTrajectoryForThreeJS(trajectoryData: any): TrajectoryFrame[] {
   
    const frames: TrajectoryFrame[] = [];
    
    
    const times = trajectoryData.time || [];
    const numFrames = times.length;
    
    for (let i = 0; i < numFrames; i++) {
      
      frames.push({
        time: times[i],
        
        potentialEnergy: trajectoryData.potential_energy?.[i] || 0,
        kineticEnergy: trajectoryData.kinetic_energy?.[i] || 0,
        temperature: trajectoryData.temperature?.[i] || 0,
       
      });
    }
    
    return frames;
  }
}