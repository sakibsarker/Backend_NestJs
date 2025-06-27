import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus } from './entities/room.entity';
import { CreateRoomDto, JoinRoomDto } from './dto/videocall.dto';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class VideocallService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  async createRoom(
    hostUserId: number,
    createRoomDto: CreateRoomDto,
  ): Promise<Room> {
    const roomCode = this.generateRoomCode();

    const room = this.roomRepository.create({
      roomCode,
      hostUserId,
      isPrivate: createRoomDto.isPrivate || false,
      password: createRoomDto.password
        ? await bcrypt.hash(createRoomDto.password, 10)
        : undefined,
      status: RoomStatus.WAITING,
    });

    return await this.roomRepository.save(room);
  }

  async joinRoom(userId: number, joinRoomDto: JoinRoomDto): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { roomCode: joinRoomDto.roomCode },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.status === RoomStatus.ENDED) {
      throw new BadRequestException('Room has ended');
    }

    if (room.hostUserId === userId) {
      // Host is joining their own room
      if (room.status === RoomStatus.WAITING) {
        room.status = RoomStatus.ACTIVE;
        room.startTime = new Date();
        return await this.roomRepository.save(room);
      }
      return room;
    }

    // Check if room is private and password is required
    if (room.isPrivate && room.password) {
      if (!joinRoomDto.password) {
        throw new ForbiddenException('Password required for private room');
      }

      const isPasswordValid = await bcrypt.compare(
        joinRoomDto.password,
        room.password,
      );
      if (!isPasswordValid) {
        throw new ForbiddenException('Invalid password');
      }
    }

    // Check if room is full (only 2 participants allowed)
    if (room.participantUserId && room.participantUserId !== userId) {
      throw new BadRequestException('Room is full');
    }

    // Add participant to room
    room.participantUserId = userId;
    if (room.status === RoomStatus.WAITING) {
      room.status = RoomStatus.ACTIVE;
      room.startTime = new Date();
    }

    return await this.roomRepository.save(room);
  }

  async leaveRoom(userId: number, roomId: string): Promise<void> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.hostUserId === userId) {
      // Host is leaving, end the room
      room.status = RoomStatus.ENDED;
      room.endTime = new Date();
      await this.roomRepository.save(room);
    } else if (room.participantUserId === userId) {
      // Participant is leaving
      room.participantUserId = undefined;
      if (room.status === RoomStatus.ACTIVE) {
        room.status = RoomStatus.WAITING;
      }
      await this.roomRepository.save(room);
    }
  }

  async getRoomByCode(roomCode: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { roomCode },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async getRoomById(roomId: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async getMyRooms(userId: number): Promise<Room[]> {
    return await this.roomRepository.find({
      where: [{ hostUserId: userId }, { participantUserId: userId }],
      order: { createdAt: 'DESC' },
    });
  }

  private generateRoomCode(): string {
    // Generate a 6-character room code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async endRoom(roomId: string, userId: number): Promise<void> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.hostUserId !== userId) {
      throw new ForbiddenException('Only room host can end the room');
    }

    room.status = RoomStatus.ENDED;
    room.endTime = new Date();
    await this.roomRepository.save(room);
  }
}
