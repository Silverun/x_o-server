const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const sessionManager = require("./middleware/sessions");

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000"],
    // credentials: true,
  },
});

// io.use((socket, next) => {
//   const username = socket.handshake.auth.username;
//   if (!username) {
//     return next(new Error("invalid username"));
//   }
//   socket.username = username;
//   next();
// });

io.use(sessionManager);

io.on("connection", async (socket) => {
  socket.join(socket.userID);

  socket.broadcast.emit("user_connected", {
    userID: socket.id,
    username: socket.username,
  });

  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  const users = [];
  for (let [id, socket] of io.of("/").sockets) {
    users.push({
      userID: id,
      username: socket.username,
    });
  }
  socket.emit("users", users);

  socket.on("invite_player", (id) => {
    socket.to(id).emit("game_invitation", { from: socket.id });
  });
});

httpServer.listen(process.env.PORT || 5000, () => {
  console.log("Server running");
});
