const express = require('express');
// const { loginUser, signUp } = require('../controller/userController');
const {loginUser , getAllUsers} = require('../controller/auth/loginController');
const signUp = require('../controller/auth/signupController');
const protect = require('../middleware/middleware');
const getUserById = require('../controller/chat/chatController');
const Message = require('../models/chat')


const router = express.Router();

router.post('/login' , loginUser )
router.post('/sign-up' , signUp )
router.get('/get-all-user' ,protect, getAllUsers) 
router.get('/get-user-by-id/:id' ,protect, getUserById) 
router.get('/messages/:userId/:chatUserId', async (req, res) => {
    const { userId, chatUserId } = req.params;

    try {
        const messages = await Message.find({
            $or: [
                { sender: userId, recipient: chatUserId },
                { sender: chatUserId, recipient: userId }
            ]
        }).sort({ createdAt: 1 }); // sort by timestamp

        res.json(messages);
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
module.exports = router;
