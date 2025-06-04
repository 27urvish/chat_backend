// const express = require('express');
// const cors = require('cors');
// const userRoutes = require('./routes/authRoutes');
// const Message = require('./models/chat');
// const http = require('http');
// const { Server } = require('socket.io');

// const app = express();
// const server = http.createServer(app);

// // ✅ CORS for frontend (adjust origin as needed)
// const corsOptions = {
//     origin: 'http://localhost:3000',
//     credentials: true,
// };
// app.use(cors(corsOptions));
// app.use(express.json());

// // ✅ REST API routes
// app.use('/api', userRoutes);

// // ✅ Initialize socket.io
// const io = new Server(server, {
//     cors: corsOptions,
//     transports: ["websocket", "polling"],
// })

// // ✅ Socket.io handlers
// io.on('connection', (socket) => {
//     console.log(`🔌 New user connected: ${socket.id}`);

//     //   socket.on('join', (userId) => {
//     //     socket.join(userId);
//     //     console.log(`User ${userId} joined`);
//     //   });
//     // Add these to your Socket.IO server
//     socket.on('initiate-call', ({ to, from, callType }) => {
//         socket.to(to).emit('incoming-call', { from, callType });
//     });

//     socket.on('accept-call', ({ to, from }) => {
//         socket.to(to).emit('call-accepted', { from });
//     });

//     socket.on('reject-call', ({ to, from }) => {
//         socket.to(to).emit('call-rejected', { from });
//     });

//     socket.on('end-call', ({ to, from }) => {
//         socket.to(to).emit('call-ended', { from });
//     });

//     socket.on('webrtc-offer', ({ to, offer }) => {
//         socket.to(to).emit('webrtc-offer', { offer, from: socket.id });
//     });

//     socket.on('webrtc-answer', ({ to, answer }) => {
//         socket.to(to).emit('webrtc-answer', { answer, from: socket.id });
//     });

//     socket.on('webrtc-ice-candidate', ({ to, candidate }) => {
//         socket.to(to).emit('webrtc-ice-candidate', { candidate, from: socket.id });
//     });

//     socket.on('sendMessage', async ({ sender, recipient, content }) => {
//         console.log(`📩 sendMessage event received: sender=${sender}, recipient=${recipient}, content=${content}`);
//         try {
//             if (!sender || !recipient || !content) {
//                 throw new Error('Missing sender, recipient, or content');
//             }

//             console.log(`📩 Message from ${sender} to ${recipient}: ${content}`);
//             const newMessage = new Message({ sender, recipient, content });
//             await newMessage.save();
//             io.to(sender).emit('message', newMessage);
//             io.to(recipient).emit('message', newMessage);
//         } catch (err) {
//             console.error('❌ Error in sendMessage:', err.message);
//             // Optional: emit error back to sender
//             socket.emit('errorMessage', { error: err.message });
//         }
//     });

//     socket.on('disconnect', () => {
//         console.log(`❌ User disconnected: ${socket.id}`);
//     });
// });

// // ✅ Export server to use in index.js
// module.exports = server;



const express = require("express")
const cors = require("cors")
const userRoutes = require("./routes/authRoutes")
const Message = require("./models/chat")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const server = http.createServer(app)

// ✅ CORS for frontend (adjust origin as needed)
const corsOptions = {
  origin: ["http://localhost:3000" , "https://chat-frontend-indol-three.vercel.app/"],
  credentials: true,
}
app.use(cors(corsOptions))
app.use(express.json())

// ✅ REST API routes
app.use("/api", userRoutes)

// ✅ Initialize socket.io
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
})

// Store user socket mappings
const userSockets = new Map()

// ✅ Socket.io handlers
io.on("connection", (socket) => {
  console.log(`🔌 New user connected: ${socket.id}`)

  // Handle user joining with their ID
  socket.on("join", (userId) => {
    socket.userId = userId
    userSockets.set(userId, socket.id)
    socket.join(userId)
    console.log(`👤 User ${userId} joined with socket ${socket.id}`)

    // Notify user is online
    socket.broadcast.emit("user-online", userId)
  })

  // Video call signaling events
  socket.on("initiate-call", ({ to, from, callType }) => {
    console.log(`📞 Call initiated: ${from} -> ${to} (${callType})`)
    const recipientSocketId = userSockets.get(to)
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("incoming-call", { from, callType })
    } else {
      socket.emit("call-failed", { reason: "User not available" })
    }
  })

  socket.on("accept-call", ({ to, from }) => {
    console.log(`✅ Call accepted: ${from} -> ${to}`)
    const callerSocketId = userSockets.get(to)
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-accepted", { from })
    }
  })

  socket.on("reject-call", ({ to, from }) => {
    console.log(`❌ Call rejected: ${from} -> ${to}`)
    const callerSocketId = userSockets.get(to)
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-rejected", { from })
    }
  })

  socket.on("end-call", ({ to, from }) => {
    console.log(`📞 Call ended: ${from} -> ${to}`)
    const recipientSocketId = userSockets.get(to)
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("call-ended", { from })
    }
  })

  // WebRTC signaling events
  socket.on("webrtc-offer", ({ to, offer }) => {
    console.log(`📡 WebRTC offer: ${socket.userId} -> ${to}`)
    const recipientSocketId = userSockets.get(to)
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("webrtc-offer", {
        offer,
        from: socket.userId,
      })
    }
  })

  socket.on("webrtc-answer", ({ to, answer }) => {
    console.log(`📡 WebRTC answer: ${socket.userId} -> ${to}`)
    const recipientSocketId = userSockets.get(to)
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("webrtc-answer", {
        answer,
        from: socket.userId,
      })
    }
  })

  socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
    console.log(`🧊 ICE candidate: ${socket.userId} -> ${to}`)
    const recipientSocketId = userSockets.get(to)
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("webrtc-ice-candidate", {
        candidate,
        from: socket.userId,
      })
    }
  })

  // Chat message handling
  socket.on("sendMessage", async ({ sender, recipient, content }) => {
    console.log(`📩 sendMessage event received: sender=${sender}, recipient=${recipient}, content=${content}`)
    try {
      if (!sender || !recipient || !content) {
        throw new Error("Missing sender, recipient, or content")
      }

      console.log(`📩 Message from ${sender} to ${recipient}: ${content}`)
      const newMessage = new Message({ sender, recipient, content })
      await newMessage.save()

      // Send to sender
      socket.emit("message", newMessage)

      // Send to recipient
      const recipientSocketId = userSockets.get(recipient)
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("message", newMessage)
      }
    } catch (err) {
      console.error("❌ Error in sendMessage:", err.message)
      socket.emit("errorMessage", { error: err.message })
    }
  })

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`)

    // Remove user from online users
    if (socket.userId) {
      userSockets.delete(socket.userId)
      socket.broadcast.emit("user-offline", socket.userId)
    }
  })
})

// ✅ Export server to use in index.js
module.exports = server
