const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose'); // Using MongoDB for Render storage
const path = require('path');
const app = express();

// --- 1. CONFIGURATION & CLOUD DATABASE ---
// Replace the link below with your MongoDB Atlas connection string
const MONGODB_URI = "YOUR_MONGODB_ATLAS_CONNECTION_STRING_HERE"; 
const PORT = process.env.PORT || 3000; // Render requires dynamic port

mongoose.connect(MONGODB_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ DB Connection Error:", err));

// Database Schemas (Replaces your .txt file logic)
const Message = mongoose.model('Message', new mongoose.Schema({
    user: String,
    avatar: String,
    type: String,
    content: String,
    replyTo: String,
    time: String
}));

const Settings = mongoose.model('Settings', new mongoose.Schema({
    groupName: { type: String, default: "Cloud Hub" },
    wallpaper: { type: String, default: "" }
}));

// --- 2. MIDDLEWARE ---
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public'))); // Connects to your public folder
app.use(session({ 
    secret: 'cloud-god-mode', 
    resave: false, 
    saveUninitialized: true 
}));

// --- 3. API ROUTES ---

// Login
app.post('/api/login', (req, res) => {
    req.session.user = req.body.username;
    req.session.avatar = req.body.avatar;
    res.json({ success: true });
});

// Save Message (Now saves to MongoDB)
app.post('/api/save', async (req, res) => {
    if (!req.session.user) return res.status(401).send();
    try {
        const entry = new Message({
            user: req.session.user,
            avatar: req.session.avatar,
            type: req.body.type || 'text',
            content: req.body.content,
            replyTo: req.body.replyTo || null,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        await entry.save();
        res.json({ status: 'sent' });
    } catch (err) { res.status(500).json({ error: "Save Failed" }); }
});

// Get History (Now reads from MongoDB)
app.get('/api/history', async (req, res) => {
    try {
        const history = await Message.find().sort({ _id: 1 });
        res.json({ history });
    } catch (err) { res.json({ history: [] }); }
});

// Settings Logic
app.get('/api/settings', async (req, res) => {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
});

app.post('/api/settings', async (req, res) => {
    await Settings.findOneAndUpdate({}, req.body, { upsert: true });
    res.json({ success: true });
});

app.get('/api/ping', (req, res) => res.json({ online: true }));

// --- 4. START SERVER ---
server.listen(PORT, () => console.log(`🚀 CLOUD SERVER LIVE ON PORT ${PORT}`)); // Listens on Render's port
