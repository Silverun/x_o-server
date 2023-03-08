const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const cors = require("cors");
const { sessionManager, sessionStore } = require("./middleware/sessions");

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "https://admin.socket.io"],
    credentials: true,
  },
});

instrument(io, {
  auth: false,
  mode: "development",
  store: sessionStore,
});

io.use(sessionManager);

io.on("connection", async (socket) => {
  // persist session
  sessionStore.saveSession(socket.sessionID, {
    userID: socket.userID,
    username: socket.username,
    connected: true,
  });

  // emit session details
  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });
  // join the "userID" room on connection
  socket.join(socket.userID);

  const users = [];
  sessionStore.findAllSessions().forEach((session) => {
    users.push({
      userID: session.userID,
      username: session.username,
      connected: session.connected,
    });
  });
  socket.emit("users", users);
  // notify existing users
  socket.broadcast.emit("user_connected", {
    userID: socket.userID,
    username: socket.username,
    connected: true,
  });

  socket.on("disconnect", async () => {
    console.log("disconnect ran");
  });

  socket.on("invite_player", (id) => {
    socket.to(id).emit("game_invitation", {
      from: socket.userID,
      by: socket.username,
    });
  });

  socket.on("join_room", (fromId) => {
    //join room of other player
    socket.join(fromId);
    socket.to(fromId).emit("game_accepted");
  });

  socket.on("turn_end", (squares, gameRoom) => {
    socket.broadcast.to(gameRoom).emit("turn_start", squares);
  });

  socket.on("play_again_click", (gameRoom) => {
    socket.broadcast.to(gameRoom).emit("play_again_trigger");
  });
});

httpServer.listen(process.env.PORT || 5000, () => {
  console.log("Server running");
});
