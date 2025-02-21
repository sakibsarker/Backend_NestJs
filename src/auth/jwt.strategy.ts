import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from './roles.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract token from Authorization header
      ignoreExpiration: false, // Ensure token expiration is checked
      secretOrKey: 'ljfdlk343443y', // Replace with your secret key
    });
  }

  async validate(payload: any) {
    // Return the user object (you can fetch additional user details here if needed)
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
