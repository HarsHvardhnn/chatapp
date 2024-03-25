import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./Routes/userRoutes.js";
import chatRoutes from "./Routes/chatRoutes.js";
import messageRoutes from "./Routes/messageRoutes.js";
import { notFound, errorHandler } from "./Middleware/errorMiddleware.js";
import path from 'path'
import cors from 'cors';

dotenv.config();
connectDB();
const app = express();

app.use(express.json());
// app.use(cors(
//   {
//       origin: '*',
//       methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//       credentials: true,
//       optionsSuccessStatus: 204, 
//     }
// ))
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);


const __dirname1 = path.resolve();

if(process.env.NODE_ENV === 'production'){

  app.use(express.static(path.join(__dirname1, '/client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname1, "client", "build", "index.html"));
  });
}
else{
  app.get("/", (req, res) => {
    res.send("API is not running");
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server is running on Port: ${PORT}`)
);

import { Server } from "socket.io";

const io = new Server(server, {
  pingTimeout: 60000,
  cors:
      {
          origin: '*',
          methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
          credentials: true,
          optionsSuccessStatus: 204, 
        }
    
});

io.on("connection", (socket) => {
 

  socket.on("setup", (userData) => {
    socket.join(userData._id);
   
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
  
  });

  socket.on("leave room", (room) => {
    if (!room) return;
    socket.leave(room);
  
  });

  socket.on("new message", (newMessageReceived) => {
    var chat = newMessageReceived.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;

      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));

  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.off("setup", (userData) => {
 
    socket.leave(userData._id);
  });
});
