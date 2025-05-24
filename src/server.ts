import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import notesRoutes from "./routes/notes";
import { errorHandler } from "./middlewares/errorHandler";
import { authMiddleware } from "./middlewares/authHandler";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { SOCKET_ACTIONS } from "./models/Common";
import config from "./config/config";
import connectDB from "./config/database";

const app = express();
app.use(cors());

connectDB();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.socketClientUrl, // Adjust as needed for React app
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.query.token as string;
  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_KEY as Secret
      ) as JwtPayload;
      (socket as any).userId = decoded.userId;
      (socket as any).username = decoded.username;
      return next();
    } catch (err) {
      console.log(err);
      return next(new Error("Authentication error"));
    }
  } else {
    return next(new Error("No token provided"));
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use(authMiddleware);
app.use("/api/notes", notesRoutes);

app.use(errorHandler);

const noteSubscribers = new Map<string, string[]>();

io.on("connection", (socket) => {
  console.log("a user connected", (socket as any).userId);
  socket.on(SOCKET_ACTIONS.JOIN_NOTE, (noteId: string) => {
    socket.join(noteId);
    const currentUser = (socket as any).username;
    console.log(`${currentUser} joined ${noteId}`);
    if (noteSubscribers.has(noteId)) {
      const subscribers = noteSubscribers.get(noteId) as string[];
      if (!subscribers?.includes(currentUser)) {
        noteSubscribers.set(noteId, [...subscribers, currentUser]);
      }
    } else {
      noteSubscribers.set(noteId, [currentUser]);
    }

    io.to(noteId).emit(SOCKET_ACTIONS.NOTE_USERS, noteSubscribers.get(noteId));
  });

  socket.on(SOCKET_ACTIONS.LEAVE_NOTE, (noteId: string) => {
    socket.leave(noteId);
    const currentUser = (socket as any).username;
    console.log(`${currentUser} left ${noteId}`);
    if (noteSubscribers.has(noteId)) {
      let subscribers = noteSubscribers.get(noteId) as string[];
      subscribers = subscribers.filter((user) => user !== currentUser);
      noteSubscribers.set(noteId, subscribers);
    }
    io.to(noteId).emit(SOCKET_ACTIONS.NOTE_USERS, noteSubscribers.get(noteId));
  });

  socket.on("disconnect", () => {
    const user = (socket as any).username;
    console.log("user disconnected", user);
    for (let [noteId, users] of noteSubscribers) {
      if (users.includes(user)) {
        socket.leave(noteId);
        const filteredUsers = users.filter((v) => v !== user);
        noteSubscribers.set(noteId, filteredUsers);
      }
      io.to(noteId).emit(
        SOCKET_ACTIONS.NOTE_USERS,
        noteSubscribers.get(noteId)
      );
    }
  });
});

httpServer.listen(config.port, () => {
  console.log(`Server is running at http://localhost:${config.port}`);
});

export default app;
