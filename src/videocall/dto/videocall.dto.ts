import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateRoomDto {
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean = false;

  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;
}

export class JoinRoomDto {
  @IsString()
  roomCode: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class WebRTCSignalDto {
  @IsString()
  roomId: string;

  @IsString()
  signal: string;

  @IsString()
  type: 'offer' | 'answer' | 'ice-candidate';
}
