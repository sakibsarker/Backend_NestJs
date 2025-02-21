import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from 'src/auth/roles.enum';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async signup(createUserDto: CreateUserDto) {
    const { email, password, name, role } = createUserDto;

    // Validate email uniqueness
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user in the database with the provided role
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || Role.Customer, // Default to Customer if no role is provided
      },
    });

    // Exclude the password field from the response
    const { password: _, ...result } = user;
    return result;
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany();
    return users.map(({ password, ...user }) => user); // Exclude password field
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Exclude the password field from the response
    const { password: _, ...result } = user;
    return result;
  }
}
