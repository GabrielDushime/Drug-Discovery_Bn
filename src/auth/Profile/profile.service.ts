import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entity/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from '../../users/users.service';

import { FileUploadService } from './file-upload.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private usersService: UsersService,
    private fileUploadService: FileUploadService,
  ) {}

  async findByUserId(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    
    if (!profile) {
      // Create a profile if it doesn't exist
      return this.createProfile(userId);
    }
    
    return profile;
  }

  private async createProfile(userId: string): Promise<Profile> {
    const user = await this.usersService.findOne(userId);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    // Create a new profile with the correct structure
    const newProfile = new Profile();
    newProfile.userId = userId;
    
    // Handle the first name (could be null)
    if (user.fullName) {
      newProfile.firstName = user.fullName.split(' ')[0] || null;
      
      // Handle last name (could be null)
      const lastNameParts = user.fullName.split(' ').slice(1);
      newProfile.lastName = lastNameParts.length > 0 ? lastNameParts.join(' ') : null;
    } else {
      newProfile.firstName = null;
      newProfile.lastName = null;
    }
    
    // Initialize other fields as null
    newProfile.telephone = null;
    newProfile.address = null;
    newProfile.city = null;
    newProfile.state = null;
    newProfile.postalCode = null;
    newProfile.country = null;
    newProfile.photoUrl = null;
    newProfile.photoFilename = null;
    
    // Save the profile to the database
    return this.profileRepository.save(newProfile);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.findByUserId(userId);
    
    // Update profile fields (manually to be type-safe)
    if (updateProfileDto.firstName !== undefined) {
      profile.firstName = updateProfileDto.firstName;
    }
    if (updateProfileDto.lastName !== undefined) {
      profile.lastName = updateProfileDto.lastName;
    }
    if (updateProfileDto.telephone !== undefined) {
      profile.telephone = updateProfileDto.telephone;
    }
    if (updateProfileDto.address !== undefined) {
      profile.address = updateProfileDto.address;
    }
    if (updateProfileDto.city !== undefined) {
      profile.city = updateProfileDto.city;
    }
    if (updateProfileDto.state !== undefined) {
      profile.state = updateProfileDto.state;
    }
    if (updateProfileDto.postalCode !== undefined) {
      profile.postalCode = updateProfileDto.postalCode;
    }
    if (updateProfileDto.country !== undefined) {
      profile.country = updateProfileDto.country;
    }
    
    // If email is updated, update it in the user entity as well
    if (updateProfileDto.email) {
      await this.usersService.updateEmail(userId, updateProfileDto.email);
    }
    
    // Update fullName in user entity if firstName or lastName is provided
    if (updateProfileDto.firstName !== undefined || updateProfileDto.lastName !== undefined) {
      const firstName = updateProfileDto.firstName !== undefined 
        ? updateProfileDto.firstName 
        : profile.firstName || '';
      
      const lastName = updateProfileDto.lastName !== undefined 
        ? updateProfileDto.lastName 
        : profile.lastName || '';
      
      const fullName = `${firstName} ${lastName}`.trim();
      
      if (fullName) {
        await this.usersService.updateFullName(userId, fullName);
      }
    }
    
    return this.profileRepository.save(profile);
  }

  async updateProfilePhoto(userId: string, file: Express.Multer.File): Promise<Profile> {
    const profile = await this.findByUserId(userId);
    
    // Delete the old photo if it exists
    if (profile.photoFilename) {
      await this.fileUploadService.deleteProfilePhoto(profile.photoFilename);
    }
    
    // Save the new photo
    const { url, filename } = await this.fileUploadService.saveProfilePhoto(file, userId);
    
    // Update the profile with the new photo information
    profile.photoUrl = url;
    profile.photoFilename = filename;
    
    return this.profileRepository.save(profile);
  }

  async deleteProfilePhoto(userId: string): Promise<Profile> {
    const profile = await this.findByUserId(userId);
    
    // Delete the photo file
    if (profile.photoFilename) {
      await this.fileUploadService.deleteProfilePhoto(profile.photoFilename);
    }
    
    // Update the profile to remove photo references
    profile.photoUrl = null;
    profile.photoFilename = null;
    
    return this.profileRepository.save(profile);
  }
}