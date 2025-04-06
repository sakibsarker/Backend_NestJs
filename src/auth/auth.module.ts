import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersService } from 'src/users/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), // Set JWT as the default strategy
    JwtModule.register({
      secret: 'ljfdlk343443y', // Replace with a secure secret key
      signOptions: { expiresIn: '1h' }, // Token expiration time
    }),
    TypeOrmModule.forFeature([User]), // Register the User entity with TypeORM
  ],
  providers: [AuthService, UsersService, JwtStrategy], // Remove PrismaService
  controllers: [AuthController],
})
export class AuthModule {}
