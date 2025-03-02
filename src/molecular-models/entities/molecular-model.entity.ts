import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Simulation } from '../../simulations/entities/simulation.entity';

export enum ModelFormat {
  PDB = 'pdb',
  MOL2 = 'mol2',
  SDF = 'sdf',
}

@Entity('molecular_models')
export class MolecularModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ModelFormat,
  })
  format: ModelFormat;

  @Column()
  filePath: string;

  @Column({ default: false })
  isValidated: boolean;

  @Column({ type: 'json', nullable: true })
  validationResults: object;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt: Date;

  @ManyToOne(() => User, (user) => user.molecularModels)
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => Simulation, (simulation) => simulation.molecularModel)
  simulations: Simulation[];
}