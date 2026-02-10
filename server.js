const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'cloud-god-mode', resave: false, saveUninitialized: true }));

const DB_FILE = 'group_database.txt';
const SETTINGS_FILE = 'settings.json';

if (!fs.existsSync(SETTINGS_FILE)) fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ groupName: "Cloud Hub", wallpaper: "" }));

app.post('/api/login', (req, res) => {
    req.session.user = req.body.username;
    req.session.avatar = req.body.avatar;
    res.json({ success: true });
});

app.post('/api/save', (req, res) => {
    if (!req.session.user) return res.status(401).send();
    const entry = {
        id: "m-" + Date.now(),
        user: req.session.user,
        avatar: req.session.avatar,
        type: req.body.type || 'text',
        content: req.body.content,
        replyTo: req.body.replyTo || null,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    fs.appendFileSync(DB_FILE, JSON.stringify(entry) + "\n");
    res.json({ status: 'sent' });
});

app.get('/api/history', (req, res) => {
    const history = fs.existsSync(DB_FILE) ? fs.readFileSync(DB_FILE, 'utf8').trim().split('\n').filter(l => l).map(l => JSON.parse(l)) : [];
    res.json({ history });
});

app.get('/api/settings', (req, res) => res.json(JSON.parse(fs.readFileSync(SETTINGS_FILE))));
app.post('/api/settings', (req, res) => {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(req.body));
    res.json({ success: true });
});

app.get('/api/ping', (req, res) => res.json({ online: true }));
app.listen(3000, '0.0.0.0', () => console.log('ALL-IN-ONE SERVER LIVE ON PORT 3000'));