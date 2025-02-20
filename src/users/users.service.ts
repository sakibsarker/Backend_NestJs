import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Signup a new user
   *- User creation data (email, password, name)
   *  The created user (without the password field)
   */
  async signup(data: Prisma.UserCreateInput) {
    const { email, password, name } = data;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user in the database with the hashed password
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword, // Store the hashed password
      },
    });

    // Return the user without the password field
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Get all users
   * A list of all users (without their passwords)
   */
  async getAllUsers() {
    const users = await this.prisma.user.findMany();

    // Remove the password field from each user
    return users.map(({ password, ...user }) => user);
  }

  /**
   * Validate user credentials
   *  - User's email
   * - User's plain-text password
   *  The user object (without the password field) if valid, otherwise null
   */
  async validateUser(email: string, password: string): Promise<any> {
    // Find the user by email
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Return the user without the password field
    const { password: _, ...result } = user;
    return result;
  }
}
