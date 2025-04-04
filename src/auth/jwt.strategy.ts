
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';  
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,  
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }


  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);  
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      userId: user.id, 
      email: user.email,
      role: user.role,
      fullName: user.fullName,  
    };
  }
}
