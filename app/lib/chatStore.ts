// In-memory store for chat sessions
// Note: In a real serverless environment, this should be replaced with
// a persistent store like Vercel KV, Redis, or a database

interface User {
  id: string;
  timestamp: number;
}

interface Room {
  id: string;
  users: [string, string];
  messages: Message[];
  createdAt: number;
}

interface Message {
  roomId: string;
  userId: string;
  text: string;
  timestamp: number;
}

class ChatStore {
  private waitingUsers: User[] = [];
  private rooms: Map<string, Room> = new Map();
  private userToRoom: Map<string, string> = new Map();
  private lastMessageIndex: Map<string, number> = new Map();

  constructor() {
    // Clean up every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    const ROOM_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    // Remove old rooms
    for (const [roomId, room] of this.rooms.entries()) {
      if (now - room.createdAt > ROOM_TIMEOUT) {
        this.rooms.delete(roomId);
        // Clean up user mappings
        room.users.forEach(userId => this.userToRoom.delete(userId));
      }
    }

    // Remove old waiting users
    this.waitingUsers = this.waitingUsers.filter(
      user => now - user.timestamp < 5 * 60 * 1000 // 5 minutes
    );
  }

  startSession(userId: string): { status: 'waiting' } | { status: 'matched'; roomId: string; partnerId: string } {
    // Check if user is already in a room
    if (this.userToRoom.has(userId)) {
      const roomId = this.userToRoom.get(userId)!;
      const room = this.rooms.get(roomId);
      if (room) {
        const partnerId = room.users.find(id => id !== userId)!;
        return { status: 'matched', roomId, partnerId };
      }
    }

    // Try to match with a waiting user
    const waitingUser = this.waitingUsers.shift();

    if (waitingUser && waitingUser.id !== userId) {
      // Create a room
      const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const room: Room = {
        id: roomId,
        users: [userId, waitingUser.id],
        messages: [],
        createdAt: Date.now()
      };

      this.rooms.set(roomId, room);
      this.userToRoom.set(userId, roomId);
      this.userToRoom.set(waitingUser.id, roomId);
      this.lastMessageIndex.set(userId, 0);
      this.lastMessageIndex.set(waitingUser.id, 0);

      return { status: 'matched', roomId, partnerId: waitingUser.id };
    }

    // Add to waiting queue
    this.waitingUsers.push({ id: userId, timestamp: Date.now() });
    return { status: 'waiting' };
  }

  sendMessage(userId: string, roomId: string, text: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.users.includes(userId)) {
      return false;
    }

    const message: Message = {
      roomId,
      userId,
      text,
      timestamp: Date.now()
    };

    room.messages.push(message);
    return true;
  }

  getNewMessages(userId: string, roomId: string): Message[] {
    const room = this.rooms.get(roomId);
    if (!room || !room.users.includes(userId)) {
      return [];
    }

    const lastIndex = this.lastMessageIndex.get(userId) || 0;
    const newMessages = room.messages.slice(lastIndex);
    this.lastMessageIndex.set(userId, room.messages.length);

    return newMessages;
  }

  getRoomStatus(userId: string): { status: 'none' } | { status: 'waiting' } | { status: 'matched'; roomId: string } {
    // Check if in a room
    const roomId = this.userToRoom.get(userId);
    if (roomId && this.rooms.has(roomId)) {
      return { status: 'matched', roomId };
    }

    // Check if waiting
    if (this.waitingUsers.some(u => u.id === userId)) {
      return { status: 'waiting' };
    }

    return { status: 'none' };
  }

  endSession(userId: string, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Remove user from room mapping
    this.userToRoom.delete(userId);
    this.lastMessageIndex.delete(userId);

    // If both users left, delete the room
    const remainingUsers = room.users.filter(id => this.userToRoom.has(id));
    if (remainingUsers.length === 0) {
      this.rooms.delete(roomId);
    }
  }

  removeFromQueue(userId: string) {
    this.waitingUsers = this.waitingUsers.filter(u => u.id !== userId);
  }
}

// Singleton instance
export const chatStore = new ChatStore();
