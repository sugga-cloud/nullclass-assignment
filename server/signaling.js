
// Simple Socket.IO signaling server for WebRTC
import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log(`[signaling] New connection: ${socket.id}`);

  socket.on("join", (room) => {
    console.log(`[signaling] ${socket.id} joined room ${room}`);
    socket.join(room);
    socket.to(room).emit("peer-joined");
  });

  socket.on("signal", ({ room, data }) => {
    console.log(`[signaling] Signal from ${socket.id} → room ${room}`);
    socket.to(room).emit("signal", data);
  });

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        console.log(`[signaling] ${socket.id} left room ${room}`);
        socket.to(room).emit("peer-left");
      }
    }
  });
});

const PORT = process.env.SIGNAL_PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`[signaling] Server running on port ${PORT}`);
});