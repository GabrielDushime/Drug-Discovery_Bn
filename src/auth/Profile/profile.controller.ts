import { 
    Body, 
    Controller, 
    Delete, 
    Get, 
    Post, 
    Put, 
    UploadedFile, 
    UseGuards, 
    UseInterceptors, 
    Request,
    ParseFilePipeBuilder,
    HttpStatus
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../guards/jwt-auth.guard';
  import { ProfileService } from './profile.service';
  import { UpdateProfileDto, ProfilePhotoDto } from './dto/update-profile.dto';
  
  @ApiTags('Profile')
  @Controller('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authentication')
  export class ProfileController {
    constructor(private profileService: ProfileService) {}
  
    @Get()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({
      status: 200,
      description: 'Profile retrieved successfully',
    })
    async getProfile(@Request() req) {
      return this.profileService.findByUserId(req.user.id);
    }
  
    @Put()
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({
      status: 200,
      description: 'Profile updated successfully',
    })
    async updateProfile(
      @Request() req,
      @Body() updateProfileDto: UpdateProfileDto,
    ) {
      return this.profileService.updateProfile(req.user.id, updateProfileDto);
    }
  
    @Post('photo')
    @ApiOperation({ summary: 'Upload profile photo' })
    @ApiConsumes('multipart/form-data')
    @ApiResponse({
      status: 200,
      description: 'Profile photo uploaded successfully',
    })
    @UseInterceptors(FileInterceptor('photo'))
    async uploadProfilePhoto(
      @Request() req,
      @UploadedFile(
        new ParseFilePipeBuilder()
          .addFileTypeValidator({
            fileType: /(jpg|jpeg|png)$/,
          })
          .addMaxSizeValidator({
            maxSize: 5 * 1024 * 1024, // 5MB
          })
          .build({
            errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
          }),
      )
      file: Express.Multer.File,
    ) {
      return this.profileService.updateProfilePhoto(req.user.id, file);
    }
  
    @Delete('photo')
    @ApiOperation({ summary: 'Delete profile photo' })
    @ApiResponse({
      status: 200,
      description: 'Profile photo deleted successfully',
    })
    async deleteProfilePhoto(@Request() req) {
      return this.profileService.deleteProfilePhoto(req.user.id);
    }
  }