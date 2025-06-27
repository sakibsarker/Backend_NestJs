import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { VideocallModule } from './videocall/videocall.module';

@Module({
  imports: [
    ConfigModule.forRoot(), // Load environment variables from .env
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, // Use the DATABASE_URL from .env
      entities: [__dirname + '/**/*.entity{.ts,.js}'], // Path to your entities
      synchronize: true, // Set to false in production
      dropSchema: true, // This will drop and recreate the schema
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    VideocallModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
