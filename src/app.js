// const express = require("express")
// const cors = require("cors")
// const userRoutes = require("./routes/authRoutes")
// const Message = require("./models/chat")
// const http = require("http")
// const { Server } = require("socket.io")
// const multer = require("multer")
// const { exec } = require("child_process")
// const path = require("path")
// const fs = require("fs")
// const crypto = require("crypto")

// const app = express()
// const server = http.createServer(app)

// // ✅ CORS for frontend
// const corsOptions = {
//   origin: "*",
//   credentials: true,
// }
// app.use(cors(corsOptions))
// app.use(express.json())

// // ✅ Ensure upload directory exists
// if (!fs.existsSync("uploads")) fs.mkdirSync("uploads")

// // ✅ Multer setup with hashed filenames
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/")
//   },
//   filename: (req, file, cb) => {
//     const hash = crypto
//       .createHash("md5")
//       .update(Date.now() + file.originalname)
//       .digest("hex")
//     const ext = path.extname(file.originalname)
//     cb(null, `${hash}${ext}`)
//   },
// })
// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     // Allow images, documents, and audio files
//     const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|wav|ogg|mp4|avi|mov/
//     const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
//     const mimetype = allowedTypes.test(file.mimetype)

//     if (mimetype && extname) {
//       return cb(null, true)
//     } else {
//       cb(new Error("Invalid file type"))
//     }
//   },
// })

// // ✅ REST API routes
// app.use("/api", userRoutes)

// // ✅ Face Swap Endpoint
// app.post("/api/face-swap", upload.fields([{ name: "source" }, { name: "target" }]), (req, res) => {
//   if (!req.files.source || !req.files.target) {
//     return res.status(400).json({ error: "Source and target images required" })
//   }

//   const sourcePath = req.files.source[0].path
//   const targetPath = req.files.target[0].path
//   const outputHash = crypto
//     .createHash("md5")
//     .update(Date.now() + "output")
//     .digest("hex")
//   const outputPath = `uploads/${outputHash}.jpg`
//   const pythonScriptPath = path.join(__dirname, "controller", "chat", "swap_face.py")

//   const cmd = `python3 ${pythonScriptPath} ${sourcePath} ${targetPath} ${outputPath}`

//   exec(cmd, (err, stdout, stderr) => {
//     console.log("STDOUT:", stdout)
//     if (stderr) console.warn("WARN:", stderr)

//     if (err) {
//       console.error("❌ Error:", err.message)
//       return res.status(500).json({ error: "Face swap failed", stderr })
//     }

//     res.json({ result: `http://localhost:5000/${outputPath}` })
//   })
// })

// // ✅ Chat File Upload Endpoint
// app.post("/api/chat/upload", upload.single("file"), (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded" })
//     }

//     const { userId, chatId, fileType } = req.body

//     if (!userId || !chatId) {
//       return res.status(400).json({ error: "Missing userId or chatId" })
//     }

//     // Generate file URL
//     const fileUrl = `https://chat-backend-nskn.onrender.com/uploads/${req.file.filename}`

//     // Return file information
//     res.json({
//       success: true,
//       fileUrl,
//       fileName: req.file.originalname,
//       fileSize: req.file.size,
//       fileType: req.file.mimetype,
//       uploadedAt: new Date().toISOString(),
//     })
//   } catch (error) {
//     console.error("❌ File upload error:", error)
//     res.status(500).json({ error: "Failed to upload file" })
//   }
// })

// // ✅ Serve uploaded files statically
// app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// // ✅ Initialize socket.io
// const io = new Server(server, {
//   cors: corsOptions,
//   transports: ["websocket", "polling"],
// })

// const userSockets = new Map()

// io.on("connection", (socket) => {
//   console.log(`🔌 New user connected: ${socket.id}`)

//   socket.on("join", (userId) => {
//     socket.userId = userId
//     userSockets.set(userId, socket.id)
//     socket.join(userId)
//     socket.broadcast.emit("user-online", userId)
//   })

//   socket.on("initiate-call", ({ to, from, callType }) => {
//     const recipientSocketId = userSockets.get(to)
//     if (recipientSocketId) {
//       io.to(recipientSocketId).emit("incoming-call", { from, callType })
//     } else {
//       socket.emit("call-failed", { reason: "User not available" })
//     }
//   })

//   socket.on("accept-call", ({ to, from }) => {
//     const callerSocketId = userSockets.get(to)
//     if (callerSocketId) {
//       io.to(callerSocketId).emit("call-accepted", { from })
//     }
//   })

//   socket.on("reject-call", ({ to, from }) => {
//     const callerSocketId = userSockets.get(to)
//     if (callerSocketId) {
//       io.to(callerSocketId).emit("call-rejected", { from })
//     }
//   })

//   socket.on("end-call", ({ to, from }) => {
//     const recipientSocketId = userSockets.get(to)
//     if (recipientSocketId) {
//       io.to(recipientSocketId).emit("call-ended", { from })
//     }
//   })

//   socket.on("webrtc-offer", ({ to, offer }) => {
//     const recipientSocketId = userSockets.get(to)
//     if (recipientSocketId) {
//       io.to(recipientSocketId).emit("webrtc-offer", {
//         offer,
//         from: socket.userId,
//       })
//     }
//   })

//   socket.on("webrtc-answer", ({ to, answer }) => {
//     const recipientSocketId = userSockets.get(to)
//     if (recipientSocketId) {
//       io.to(recipientSocketId).emit("webrtc-answer", {
//         answer,
//         from: socket.userId,
//       })
//     }
//   })

//   socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
//     const recipientSocketId = userSockets.get(to)
//     if (recipientSocketId) {
//       io.to(recipientSocketId).emit("webrtc-ice-candidate", {
//         candidate,
//         from: socket.userId,
//       })
//     }
//   })

//   socket.on("sendMessage", async ({ sender, recipient, content, fileUrl, fileName, fileType, fileSize }) => {
//     try {
//       if (!sender || !recipient || (!content && !fileUrl)) {
//         throw new Error("Missing sender, recipient, or content/file")
//       }

//       // Create message object with file attachment support
//       const messageData = {
//         sender,
//         recipient,
//         content: content || "",
//         timestamp: new Date().toISOString(),
//       }

//       // Add file data if present
//       if (fileUrl) {
//         messageData.fileUrl = fileUrl
//         messageData.fileName = fileName
//         messageData.fileType = fileType
//         messageData.fileSize = fileSize
//       }

//       const newMessage = new Message(messageData)
//       await newMessage.save()

//       // Emit to sender
//       socket.emit("message", newMessage)

//       // Emit to recipient
//       const recipientSocketId = userSockets.get(recipient)
//       if (recipientSocketId) {
//         io.to(recipientSocketId).emit("message", newMessage)
//       }

//       console.log(`📨 Message sent from ${sender} to ${recipient}${fileUrl ? " with file attachment" : ""}`)
//     } catch (err) {
//       console.error("❌ Error in sendMessage:", err.message)
//       socket.emit("errorMessage", { error: err.message })
//     }
//   })

//   socket.on("disconnect", () => {
//     if (socket.userId) {
//       userSockets.delete(socket.userId)
//       socket.broadcast.emit("user-offline", socket.userId)
//     }
//     console.log(`❌ User disconnected: ${socket.id}`)
//   })
// })

// // ✅ Error handling middleware
// app.use((error, req, res, next) => {
//   if (error instanceof multer.MulterError) {
//     if (error.code === "LIMIT_FILE_SIZE") {
//       return res.status(400).json({ error: "File too large. Maximum size is 10MB." })
//     }
//   }
//   res.status(500).json({ error: error.message })
// })

// // ✅ Export server
// module.exports = server



const express = require("express")
const cors = require("cors")
const userRoutes = require("./routes/authRoutes")
const Message = require("./models/chat")
const http = require("http")
const { Server } = require("socket.io")
const multer = require("multer")
const { exec } = require("child_process")
const path = require("path")
const fs = require("fs")
const crypto = require("crypto")

const app = express()
const server = http.createServer(app)

// ✅ CORS for frontend
const corsOptions = {
  origin: "*",
  credentials: true,
}
app.use(cors(corsOptions))
app.use(express.json())

// ✅ Ensure upload directory exists
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads")

// ✅ Multer setup with hashed filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    const hash = crypto
      .createHash("md5")
      .update(Date.now() + file.originalname)
      .digest("hex")
    const ext = path.extname(file.originalname)
    cb(null, `${hash}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, documents, and audio files
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|wav|ogg|mp4|avi|mov/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Invalid file type"))
    }
  },
})

// ✅ REST API routes
app.use("/api", userRoutes)

// ✅ Chat File Upload Endpoint
app.post("/api/chat/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    const { userId, chatId, fileType } = req.body

    if (!userId || !chatId) {
      return res.status(400).json({ error: "Missing userId or chatId" })
    }

    // Generate file URL - make sure this matches your server's domain
    const fileUrl = `https://chat-backend-nskn.onrender.com/uploads/${req.file.filename}`

    console.log(`📁 File uploaded: ${req.file.filename}, Size: ${req.file.size}, Type: ${req.file.mimetype}`)

    // Return file information
    res.json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ File upload error:", error)
    res.status(500).json({ error: "Failed to upload file" })
  }
})

// ✅ Face Swap Endpoint
app.post("/api/face-swap", upload.fields([{ name: "source" }, { name: "target" }]), (req, res) => {
  if (!req.files.source || !req.files.target) {
    return res.status(400).json({ error: "Source and target images required" })
  }

  const sourcePath = req.files.source[0].path
  const targetPath = req.files.target[0].path
  const outputHash = crypto
    .createHash("md5")
    .update(Date.now() + "output")
    .digest("hex")
  const outputPath = `uploads/${outputHash}.jpg`
  const pythonScriptPath = path.join(__dirname, "controller", "chat", "swap_face.py")

  const cmd = `python3 ${pythonScriptPath} ${sourcePath} ${targetPath} ${outputPath}`

  exec(cmd, (err, stdout, stderr) => {
    console.log("STDOUT:", stdout)
    if (stderr) console.warn("WARN:", stderr)

    if (err) {
      console.error("❌ Error:", err.message)
      return res.status(500).json({ error: "Face swap failed", stderr })
    }

    res.json({ result: `http://localhost:5000/${outputPath}` })
  })
})

// ✅ Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// ✅ Initialize socket.io
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
})

const userSockets = new Map()

io.on("connection", (socket) => {
  console.log(`🔌 New user connected: ${socket.id}`)

  socket.on("join", (userId) => {
    socket.userId = userId
    userSockets.set(userId, socket.id)
    socket.join(userId)
    socket.broadcast.emit("user-online", userId)
  })

  socket.on("initiate-call", ({ to, from, callType }) => {
    const recipientSocketId = userSockets.get(to)
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("incoming-call", { from, callType })
    } else {
      socket.emit("call-failed", { reason: "User not available" })
    }
  })

  socket.on("accept-call", ({ to, from }) => {
    const callerSocketId = userSockets.get(to)
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-accepted", { from })
    }
  })

  socket.on("reject-call", ({ to, from }) => {
    const callerSocketId = userSockets.get(to)
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-rejected", { from })
    }
  })

  socket.on("end-call", ({ to, from }) => {
    const recipientSocketId = userSockets.get(to)
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("call-ended", { from })
    }
  })

  socket.on("webrtc-offer", ({ to, offer }) => {
    const recipientSocketId = userSockets.get(to)
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("webrtc-offer", {
        offer,
        from: socket.userId,
      })
    }
  })

  socket.on("webrtc-answer", ({ to, answer }) => {
    const recipientSocketId = userSockets.get(to)
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("webrtc-answer", {
        answer,
        from: socket.userId,
      })
    }
  })

  socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
    const recipientSocketId = userSockets.get(to)
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("webrtc-ice-candidate", {
        candidate,
        from: socket.userId,
      })
    }
  })

  socket.on("sendMessage", async ({ sender, recipient, content, fileUrl, fileName, fileType, fileSize }) => {
    try {
      if (!sender || !recipient || (!content && !fileUrl)) {
        throw new Error("Missing sender, recipient, or content/file")
      }

      // Create message object with file attachment support
      const messageData = {
        sender,
        recipient,
        content: content || "",
        timestamp: new Date().toISOString(),
      }

      // Add file data if present
      if (fileUrl) {
        messageData.fileUrl = fileUrl
        messageData.fileName = fileName
        messageData.fileType = fileType
        messageData.fileSize = fileSize

        // If it's a file-only message, set a default content
        if (!content || content.startsWith("📎")) {
          messageData.content = `📎 ${fileName}`
        }
      }

      const newMessage = new Message(messageData)
      await newMessage.save()

      console.log(`📨 Message saved to database:`, {
        id: newMessage._id,
        hasFile: !!fileUrl,
        fileName: fileName || "none",
      })

      // Emit to sender
      socket.emit("message", newMessage)

      // Emit to recipient
      const recipientSocketId = userSockets.get(recipient)
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("message", newMessage)
      }

      console.log(`📨 Message sent from ${sender} to ${recipient}${fileUrl ? " with file attachment" : ""}`)
    } catch (err) {
      console.error("❌ Error in sendMessage:", err.message)
      socket.emit("errorMessage", { error: err.message })
    }
  })

  socket.on("disconnect", () => {
    if (socket.userId) {
      userSockets.delete(socket.userId)
      socket.broadcast.emit("user-offline", socket.userId)
    }
    console.log(`❌ User disconnected: ${socket.id}`)
  })
})

// ✅ Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large. Maximum size is 10MB." })
    }
  }
  res.status(500).json({ error: error.message })
})

// ✅ Export server
module.exports = server
