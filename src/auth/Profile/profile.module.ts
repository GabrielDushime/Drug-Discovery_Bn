import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../Profile/entity/profile.entity';
import { ProfileService } from '../Profile/profile.service';
import { ProfileController } from '../Profile/profile.controller';
import { UsersModule } from '../../users/users.module';
import { FileUploadModule } from '../Profile/file-upload.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile]),
    UsersModule,
    FileUploadModule,
  ],
  providers: [ProfileService],
  controllers: [ProfileController],
  exports: [ProfileService],
})
export class ProfileModule {}