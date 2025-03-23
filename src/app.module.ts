import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MolecularModel } from './molecular-models/entities/molecular-model.entity';
import { User } from './users/entities/user.entity';
import { Simulation } from './simulations/entities/simulation.entity';
import { MolecularModelsModule } from './molecular-models/molecular-models.module';
import { SimulationsModule } from './simulations/simulation.module';
import { ExportVisualizationModule } from './export-visualization/export-visualization.module';
import { ProfileModule } from './auth/Profile/profile.module';
import { StaticAssetsModule } from './auth/Profile/static-assets/static-assets.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      entities: [User, MolecularModel, Simulation],
      synchronize: true, 
      ssl: { rejectUnauthorized: false }, 
    }),
    UsersModule,
    AuthModule,
    MolecularModelsModule,
    SimulationsModule ,
    ExportVisualizationModule,
    ProfileModule,
    StaticAssetsModule,
  ],
})
export class AppModule {}
