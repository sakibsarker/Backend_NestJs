import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract token from Authorization header
      ignoreExpiration: false, // Ensure token expiration is checked
      secretOrKey: 'ljfdlk343443y', // Replace with your secret key
    });
  }

  async validate(payload: any) {
    // Fetch the user from the database using the UsersService
    const users = await this.usersService.getAllUsers();
    const user = users.find((u) => u.id === payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user; // Return the user object
  }
}
