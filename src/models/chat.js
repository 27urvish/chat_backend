const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  fileUrl: { type: String, required: false },
  fileName: { type: String, required: false },
  fileType: { type: String, required: false },
  fileSize: { type: Number, required: false },
});

// module.exports = mongoose.model('Message', messageSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;