const { v4: uuidv4 } = require("uuid");

const { InMemorySessionStore } = require("../store/sessionStore");
const sessionStore = new InMemorySessionStore();

const sessionManager = (socket, next) => {
  console.log("sessions ran");
  console.log("socket handshake auth", socket.handshake.auth);

  const sessionID = socket.handshake.auth.sessionID;
  if (sessionID) {
    // find existing session
    const session = sessionStore.findSession(sessionID);
    console.log("session", session);
    console.log("Find all sessions", sessionStore.findAllSessions());
    if (session) {
      socket.sessionID = sessionID;
      socket.userID = session.userID;
      socket.username = session.username;
      return next();
    }
  }
  const username = socket.handshake.auth.username;
  if (!username) {
    console.log("invalid username");
    return next(new Error("invalid username"));
  }
  // create new session
  socket.sessionID = uuidv4();
  socket.userID = uuidv4();
  socket.username = username;
  next();
};

module.exports = sessionManager;