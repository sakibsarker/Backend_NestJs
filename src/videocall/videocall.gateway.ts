import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { VideocallService } from './videocall.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface ConnectedUser {
  userId: number;
  roomId?: string;
  socketId: string;
}

@Injectable()
@WebSocketGateway({
  namespace: '/videocall',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class VideocallGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, ConnectedUser> = new Map();

  constructor(private videocallService: VideocallService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    const user = this.connectedUsers.get(client.id);
    if (user && user.roomId) {
      // Notify other user in the room that this user has disconnected
      client.to(user.roomId).emit('user-disconnected', { userId: user.userId });

      try {
        // Clean up room state if needed
        await this.videocallService.leaveRoom(user.userId, user.roomId);
      } catch (error) {
        console.error('Error cleaning up on disconnect:', error);
      }
    }

    this.connectedUsers.delete(client.id);
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: number },
  ) {
    try {
      console.log(`User ${data.userId} joining room ${data.roomId}`);

      // Store user connection info
      this.connectedUsers.set(client.id, {
        userId: data.userId,
        roomId: data.roomId,
        socketId: client.id,
      });

      // Join the socket.io room
      await client.join(data.roomId);

      // Get room details
      const room = await this.videocallService.getRoomById(data.roomId);

      // Notify the user they've joined
      client.emit('joined-room', { roomId: data.roomId, room });

      // Notify other users in the room
      client.to(data.roomId).emit('user-joined', {
        userId: data.userId,
        socketId: client.id,
      });

      console.log(
        `User ${data.userId} successfully joined room ${data.roomId}`,
      );
    } catch (error) {
      console.error('Error joining room:', error);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: number },
  ) {
    try {
      console.log(`User ${data.userId} leaving room ${data.roomId}`);

      // Leave the socket.io room
      await client.leave(data.roomId);

      // Notify other users
      client.to(data.roomId).emit('user-left', { userId: data.userId });

      // Remove from connected users or update room info
      const user = this.connectedUsers.get(client.id);
      if (user) {
        user.roomId = undefined;
        this.connectedUsers.set(client.id, user);
      }

      // Update room state
      await this.videocallService.leaveRoom(data.userId, data.roomId);

      console.log(`User ${data.userId} successfully left room ${data.roomId}`);
    } catch (error) {
      console.error('Error leaving room:', error);
      client.emit('error', { message: error.message });
    }
  }

  // WebRTC Signaling
  @SubscribeMessage('webrtc-offer')
  handleWebRTCOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; offer: RTCSessionDescriptionInit },
  ) {
    console.log(`WebRTC offer from ${client.id} in room ${data.roomId}`);
    // Forward offer to other users in the room
    client.to(data.roomId).emit('webrtc-offer', {
      offer: data.offer,
      fromSocketId: client.id,
    });
  }

  @SubscribeMessage('webrtc-answer')
  handleWebRTCAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomId: string;
      answer: RTCSessionDescriptionInit;
      targetSocketId: string;
    },
  ) {
    console.log(`WebRTC answer from ${client.id} to ${data.targetSocketId}`);
    // Send answer to specific user
    client.to(data.targetSocketId).emit('webrtc-answer', {
      answer: data.answer,
      fromSocketId: client.id,
    });
  }

  @SubscribeMessage('webrtc-ice-candidate')
  handleICECandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomId: string;
      candidate: RTCIceCandidateInit;
      targetSocketId?: string;
    },
  ) {
    console.log(`ICE candidate from ${client.id}`);
    if (data.targetSocketId) {
      // Send to specific user
      client.to(data.targetSocketId).emit('webrtc-ice-candidate', {
        candidate: data.candidate,
        fromSocketId: client.id,
      });
    } else {
      // Broadcast to room
      client.to(data.roomId).emit('webrtc-ice-candidate', {
        candidate: data.candidate,
        fromSocketId: client.id,
      });
    }
  }

  // Chat functionality
  @SubscribeMessage('send-message')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomId: string;
      message: string;
      userId: number;
      userName: string;
    },
  ) {
    console.log(
      `Message from user ${data.userId} in room ${data.roomId}: ${data.message}`,
    );

    // Broadcast message to all users in the room
    this.server.to(data.roomId).emit('receive-message', {
      message: data.message,
      userId: data.userId,
      userName: data.userName,
      timestamp: new Date().toISOString(),
    });
  }

  // Media control events
  @SubscribeMessage('toggle-video')
  handleToggleVideo(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { roomId: string; userId: number; videoEnabled: boolean },
  ) {
    console.log(`User ${data.userId} toggled video: ${data.videoEnabled}`);
    client.to(data.roomId).emit('user-video-toggle', {
      userId: data.userId,
      videoEnabled: data.videoEnabled,
    });
  }

  @SubscribeMessage('toggle-audio')
  handleToggleAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { roomId: string; userId: number; audioEnabled: boolean },
  ) {
    console.log(`User ${data.userId} toggled audio: ${data.audioEnabled}`);
    client.to(data.roomId).emit('user-audio-toggle', {
      userId: data.userId,
      audioEnabled: data.audioEnabled,
    });
  }

  // Screen sharing events
  @SubscribeMessage('screen-share-start')
  handleScreenShareStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: number },
  ) {
    console.log(`User ${data.userId} started screen sharing`);
    client.to(data.roomId).emit('screen-share-started', {
      userId: data.userId,
    });
  }

  @SubscribeMessage('screen-share-stop')
  handleScreenShareStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: number },
  ) {
    console.log(`User ${data.userId} stopped screen sharing`);
    client.to(data.roomId).emit('screen-share-stopped', {
      userId: data.userId,
    });
  }
}
