import { 
    Column, 
    Entity, 
    OneToMany, 
    PrimaryGeneratedColumn, 
    CreateDateColumn, 
    UpdateDateColumn 
  } from 'typeorm';
  import { MolecularModel } from '../../molecular-models/entities/molecular-model.entity';
  import { Simulation } from '../../simulations/entities/simulation.entity';
  
  export enum UserRole {
    RESEARCHER = 'researcher',
    ADMIN = 'admin',
  }
  
  @Entity('users')
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ unique: true })
    email: string;
  
    @Column({ select: false }) 
    password: string;
  
    @Column()
    fullName: string;
  
    @Column({
      type: 'enum',
      enum: UserRole,
      default: UserRole.RESEARCHER,
    })
    role: UserRole;
  
    @Column({ default: true })
    isActive: boolean;
  
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
  
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
  
    @OneToMany(() => MolecularModel, (model) => model.user, { cascade: true })
    molecularModels: MolecularModel[];
  
    @OneToMany(() => Simulation, (simulation) => simulation.user, { cascade: true })
    simulations: Simulation[];
  }
  