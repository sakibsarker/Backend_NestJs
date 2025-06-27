import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Headers,
} from '@nestjs/common';
import { VideocallService } from './videocall.service';
import { CreateRoomDto, JoinRoomDto } from './dto/videocall.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('videocall')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
export class VideocallController {
  constructor(private readonly videocallService: VideocallService) {}

  @Post('rooms')
  async createRoom(
    @Headers('authorization') auth: string,
    @Body() createRoomDto: CreateRoomDto,
  ) {
    const userId = this.extractUserIdFromAuth(auth);
    return await this.videocallService.createRoom(userId, createRoomDto);
  }

  @Post('rooms/join')
  async joinRoom(
    @Headers('authorization') auth: string,
    @Body() joinRoomDto: JoinRoomDto,
  ) {
    const userId = this.extractUserIdFromAuth(auth);
    return await this.videocallService.joinRoom(userId, joinRoomDto);
  }

  @Get('rooms/:id')
  async getRoomById(@Param('id') id: string) {
    return await this.videocallService.getRoomById(id);
  }

  @Get('rooms/code/:code')
  async getRoomByCode(@Param('code') code: string) {
    return await this.videocallService.getRoomByCode(code);
  }

  @Get('my-rooms')
  async getMyRooms(@Request() req) {
    return await this.videocallService.getMyRooms(req.user.id);
  }

  @Put('rooms/:id/leave')
  async leaveRoom(@Request() req, @Param('id') id: string) {
    return await this.videocallService.leaveRoom(req.user.id, id);
  }

  @Delete('rooms/:id')
  async endRoom(@Request() req, @Param('id') id: string) {
    return await this.videocallService.endRoom(id, req.user.id);
  }

  private extractUserIdFromAuth(authHeader: string): number {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authorization header required');
    }
    const userId = authHeader.replace('Bearer ', '');
    return parseInt(userId, 10);
  }
}
