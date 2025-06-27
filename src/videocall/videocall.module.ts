import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideocallService } from './videocall.service';
import { VideocallController } from './videocall.controller';
import { VideocallGateway } from './videocall.gateway';
import { Room } from './entities/room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room])],
  controllers: [VideocallController],
  providers: [VideocallService, VideocallGateway],
  exports: [VideocallService],
})
export class VideocallModule {}
