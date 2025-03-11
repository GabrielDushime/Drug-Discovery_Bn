import { Injectable, NotFoundException,Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Simulation } from './entities/simulation.entity';
import { CreateSimulationDto, SimulationAnalyticsDto, UpdateSimulationStatusDto } from './dtos/simulation.dto';
import { SimulationStatus } from './entities/simulation.entity';
import { User } from '../users/entities/user.entity';
import { MolecularModel } from '../molecular-models/entities/molecular-model.entity';
import { exec } from 'child_process';
import * as path from 'path';

@Injectable()
export class SimulationService {

  private readonly logger = new Logger(SimulationService.name)

  constructor(
    @InjectRepository(Simulation)
    private readonly simulationRepository: Repository<Simulation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MolecularModel)
    private molecularModelRepository: Repository<MolecularModel>, 
   
  ) {}

  async createSimulation(createSimulationDto: CreateSimulationDto, userId: string): Promise<Simulation> {
    const { name, type, parameters, molecularModelId } = createSimulationDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const molecularModel = await this.molecularModelRepository.findOne({ where: { id: molecularModelId } });
    if (!molecularModel) throw new NotFoundException('Molecular model not found');

    const currentTime = new Date();
    
    const simulation = this.simulationRepository.create({
      name,
      type,
      parameters,
      status: SimulationStatus.PENDING,
      user,
      molecularModel,
      userId,
      molecularModelId,
      startedAt: currentTime,       
      completedAt: currentTime,      
      errorMessage: '',              
      resultPath: '',                
      results: {},                   
    });

    return await this.simulationRepository.save(simulation);
  }

  async updateSimulationStatus(id: string, updateDto: UpdateSimulationStatusDto): Promise<Simulation> {
    const simulation = await this.simulationRepository.findOne({ where: { id } });
    if (!simulation) throw new NotFoundException('Simulation not found');

    if (updateDto.status) simulation.status = updateDto.status;
    if (updateDto.errorMessage) simulation.errorMessage = updateDto.errorMessage;
    if (updateDto.results) simulation.results = updateDto.results;
    
    
    if (updateDto.status === SimulationStatus.COMPLETED) {
      simulation.completedAt = new Date();
    }
    if (updateDto.status === SimulationStatus.PROCESSING) {
      simulation.startedAt = new Date();
    }

    return await this.simulationRepository.save(simulation);
  }

  async getSimulationById(id: string): Promise<Simulation> {
    const simulation = await this.simulationRepository.findOne({ where: { id }, relations: ['user', 'molecularModel'] });
    if (!simulation) throw new NotFoundException('Simulation not found');
    return simulation;
  }

  async getAllSimulations(): Promise<Simulation[]> {
    return await this.simulationRepository.find({ relations: ['user', 'molecularModel'] });
  }

  async deleteSimulation(id: string): Promise<void> {
    const simulation = await this.simulationRepository.findOne({ where: { id } });
    if (!simulation) throw new NotFoundException('Simulation not found');
    await this.simulationRepository.remove(simulation);
  }

  
  async runDistributedSimulation(simulationId: string): Promise<any> {
    
    const simulation = await this.simulationRepository.findOne({ 
      where: { id: simulationId }
    });
    
    if (!simulation) {
      throw new NotFoundException(`Simulation with ID ${simulationId} not found`);
    }
    
    await this.updateSimulationStatus(simulationId, { status: SimulationStatus.PROCESSING });
    
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), 'src/scripts/dask_worker.py');
      
      const simulationData = JSON.stringify({
        type: simulation.type,
        parameters: simulation.parameters
      });
      
      this.logger.log(`Starting Dask simulation for ID: ${simulationId}`);
      
     
      const safeJson = JSON.stringify(simulationData); 
      const command = `python ${scriptPath} ${simulationId} '${safeJson}'`;
      
      this.logger.log(`Executing command: ${command}`);
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Dask computation failed for simulation ${simulationId}: ${stderr}`);
          
          this.updateSimulationStatus(simulationId, { 
            status: SimulationStatus.FAILED, 
            errorMessage: stderr 
          });
          return reject({ error: 'Simulation failed', details: stderr });
        }
        
        try {
         
          const jsonStartIndex = stdout.indexOf('{');
          const jsonEndIndex = stdout.lastIndexOf('}') + 1;
          
          if (jsonStartIndex === -1 || jsonEndIndex === 0) {
            throw new Error('No valid JSON found in output');
          }
          
          const jsonStr = stdout.substring(jsonStartIndex, jsonEndIndex);
          const results = JSON.parse(jsonStr);
          
          this.updateSimulationStatus(simulationId, { 
            status: SimulationStatus.COMPLETED, 
            results: results 
          });
          this.logger.log(`Simulation ${simulationId} completed successfully`);
          resolve(results);
        } catch (parseError) {
          this.logger.error(`Error parsing simulation results: ${parseError.message}, Output: ${stdout}`);
          this.updateSimulationStatus(simulationId, { 
            status: SimulationStatus.FAILED, 
            errorMessage: `Error parsing results: ${parseError.message}` 
          });
          reject({ error: 'Error parsing simulation results', details: parseError.message });
        }
      });
    });
  }


  async getSimulationAnalytics(simulationId: string): Promise<SimulationAnalyticsDto> {
    const simulation = await this.simulationRepository.findOne({ 
      where: { id: simulationId }
    });
    
    if (!simulation) {
      throw new NotFoundException(`Simulation with ID ${simulationId} not found`);
    }
    
    if (simulation.status !== SimulationStatus.COMPLETED) {
      throw new NotFoundException(`Simulation ${simulationId} has not completed successfully`);
    }
    
    if (!simulation.results) {
      throw new NotFoundException(`No results found for simulation ${simulationId}`);
    }
    
    const results = simulation.results as any;
    
    
    const analytics: SimulationAnalyticsDto = {
      id: simulation.id,
      name: simulation.name,
      type: simulation.type,
      statistics: results.statistics || {},
      convergence_metrics: results.convergence_metrics || {},
      trajectory_sample: results.trajectory_sample || {},
      simulation_time: results.simulation_time || 0
    };
    
    return analytics;
  }

}