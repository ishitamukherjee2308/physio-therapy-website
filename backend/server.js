// Import Required Modules
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your_neon_cyberpunk_secret_key_123';

// Configure File Upload Storage
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
const upload = multer({ dest: 'uploads/' });

// Configure Application Middleware
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS']
}));
app.use(express.json());
app.use(cookieParser());

/* Database Connection */
const MONGO_URI = 'mongodb://ishumonamukherjee_db_user:Mona2026@cluster0-shard-00-00.hfw8e4v.mongodb.net:27017/physioTherapyDB?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
})
.then(() => console.log('⚡ Connected to Cloud MongoDB Atlas!'))
.catch(err => {
    console.error('❌ Cloud Connection Blocked. Using In-Memory Fallback mode.');
    console.log('💡 APIs will continue using temporary memory storage.');
});

// Temporary In-Memory Storage
let registeredUsers = [];

let appointments = [
    {
        id: "101",
        name: "A. Pakhira",
        problem: "Sports Injury Recovery",
        requestedSlot: "Mon 10:00 AM",
        status: "PENDING"
    }
];

/* Authentication Routes */

// Register New User
app.post('/api/auth/register', upload.any(), async (req, res) => {
    const { email, password, name, role } = req.body;

    if (registeredUsers.find(u => u.email === email))
        return res.status(400).json({ message: "User already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);

    registeredUsers.push({
        email,
        password: hashedPassword,
        name,
        role
    });

    res.json({
        success: true,
        message: "Registration successful!"
    });
});

// Authenticate User Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    const user = registeredUsers.find(u => u.email === email);

    if (user && await bcrypt.compare(password, user.password)) {

        const token = jwt.sign(
            { role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.json({
            success: true,
            role: user.role
        });
    }

    res.status(401).json({
        message: "Invalid credentials."
    });
});

// Verify Logged-In User Role
app.get('/api/auth/check-role', (req, res) => {
    const token = req.cookies.auth_token;

    if (!token)
        return res.status(401).json({ role: null });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ role: decoded.role });

    } catch {
        res.status(401).json({ role: null });
    }
});

/* Admin Routes */

// Fetch Pending Appointments
app.get('/api/admin/appointments', (req, res) => {
    res.json(
        appointments.filter(a => a.status === 'PENDING')
    );
});

// Update Appointment Status
app.patch('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = appointments.find(a => a.id === id);

    if (appointment) {
        appointment.status = status;
        return res.json({ success: true });
    }

    res.status(404).json({
        message: "Appointment not found"
    });
});

// Start Express Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`CLINICAL CORE PORTAL RUNNING ON PORT: ${PORT}`);
});