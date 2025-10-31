import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Waiting queue for users looking for a match
let waitingUsers = [];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("start-session", () => {
    console.log("User starting session:", socket.id);

    if (waitingUsers.length > 0) {
      // Match with a waiting user
      const partner = waitingUsers.shift();
      const roomId = `room-${socket.id}-${partner.id}`;

      socket.join(roomId);
      partner.join(roomId);

      // Notify both users that they've been matched
      socket.emit("matched", { roomId });
      partner.emit("matched", { roomId });

      console.log(`Matched ${socket.id} with ${partner.id} in room ${roomId}`);
    } else {
      // Add to waiting queue
      waitingUsers.push(socket);
      socket.emit("waiting");
      console.log("User added to waiting queue:", socket.id);
    }
  });

  socket.on("send-message", ({ roomId, message }) => {
    console.log(`Message in ${roomId}:`, message);
    // Broadcast to everyone in the room except sender
    socket.to(roomId).emit("receive-message", { message });
  });

  socket.on("end-session", ({ roomId }) => {
    console.log(`User ${socket.id} ending session in room ${roomId}`);
    // Notify the other person in the room
    socket.to(roomId).emit("partner-left");
    socket.leave(roomId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Remove from waiting queue if present
    waitingUsers = waitingUsers.filter(user => user.id !== socket.id);
  });
});

// Prioritize SOCKET_PORT to avoid conflicts with React Router app
// If PORT is set but SOCKET_PORT is not, use PORT + 1 (e.g., 3000 -> 3001)
const port = process.env.SOCKET_PORT || 
  (process.env.PORT ? parseInt(process.env.PORT) + 1 : 3001);
httpServer.listen(port, () => {
  console.log(`Socket.io server listening on port ${port}`);
});
