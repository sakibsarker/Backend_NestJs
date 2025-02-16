import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  async signup(@Body() userData: Prisma.UserCreateInput) {
    return this.usersService.signup(userData);
  }
  @Get('all')
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get('hello')
  getHello(): string {
    return 'Hello User World';
  }
}
