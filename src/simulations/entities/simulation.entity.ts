import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MolecularModel } from '../../molecular-models/entities/molecular-model.entity';

export enum SimulationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum SimulationType {
  MOLECULAR_DYNAMICS = 'molecular_dynamics',
  ENERGY_MINIMIZATION = 'energy_minimization',
  BINDING_AFFINITY = 'binding_affinity',
}

@Entity('simulations')
export class Simulation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: SimulationType,
    default: SimulationType.MOLECULAR_DYNAMICS,
  })
  type: SimulationType;

  @Column({ type: 'json', default: {} })
  parameters: object;

  @Column({
    type: 'enum',
    enum: SimulationStatus,
    default: SimulationStatus.PENDING,
  })
  status: SimulationStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  resultPath: string;

  @Column({ type: 'json', nullable: true })
  results: object;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @ManyToOne(() => User, (user) => user.simulations)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => MolecularModel, (model) => model.simulations)
  molecularModel: MolecularModel;

  @Column()
  molecularModelId: string;
}
