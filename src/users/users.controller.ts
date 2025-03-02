import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    UseGuards,
  } from '@nestjs/common';
  import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
  import { UsersService } from './users.service';
  import { CreateUserDto, UserResponseDto } from './dtos/user.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { UserRole } from './entities/user.entity';
  
  @ApiTags('Users')
  @Controller('users')
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    @Post()
    @ApiOperation({ summary: 'Create a new user' })
    @ApiResponse({
      status: 201,
      description: 'User created successfully',
      type: UserResponseDto,
    })
    @ApiResponse({
      status: 409,
      description: 'Email already exists',
    })
    async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
      return this.usersService.createUser(createUserDto);
    }
  
    @Get()
    @ApiBearerAuth('Authentication')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all users' })
    @ApiResponse({
      status: 200,
      description: 'Return all users',
      type: [UserResponseDto],
    })
    async findAll(): Promise<UserResponseDto[]> {
      return this.usersService.findAll();
    }
  
    @Get(':id')
    @ApiBearerAuth('Authentication')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get a user by ID' })
    @ApiResponse({
      status: 200,
      description: 'Return the user',
      type: UserResponseDto,
    })
    @ApiResponse({
      status: 404,
      description: 'User not found',
    })
    async findOne(@Param('id') id: string): Promise<UserResponseDto> {
      return this.usersService.findOne(id);
    }
  
    @Put(':id')
    @ApiBearerAuth('Authentication')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update a user' })
    @ApiResponse({
      status: 200,
      description: 'User updated successfully',
      type: UserResponseDto,
    })
    @ApiResponse({
      status: 404,
      description: 'User not found',
    })
    async update(
      @Param('id') id: string,
      @Body() updateData: Partial<CreateUserDto>,
    ): Promise<UserResponseDto> {
      return this.usersService.update(id, updateData);
    }
  
    @Delete(':id')
    @ApiBearerAuth('Authentication')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete a user' })
    @ApiResponse({
      status: 200,
      description: 'User deleted successfully',
    })
    @ApiResponse({
      status: 404,
      description: 'User not found',
    })
    async remove(@Param('id') id: string): Promise<void> {
      return this.usersService.remove(id);
    }
  }