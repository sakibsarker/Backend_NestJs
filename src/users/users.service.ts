import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  async signup(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
    });
  }
  async getAllUsers() {
    return this.prisma.user.findMany();
  }
}
