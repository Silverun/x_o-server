const { v4: uuidv4 } = require("uuid");
const { InMemorySessionStore } = require("../store/sessionStore");
const sessionStore = new InMemorySessionStore();

const sessionManager = (socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  if (sessionID) {
    const session = sessionStore.findSession(sessionID);
    if (session) {
      socket.sessionID = sessionID;
      socket.userID = session.userID;
      socket.username = session.username;
      return next();
    }
  }
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.sessionID = uuidv4();
  socket.userID = uuidv4();
  socket.username = username;
  next();
};

module.exports = {
  sessionStore,
  sessionManager,
};
