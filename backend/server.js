const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
// A signing key is required in production. Do not use a hard-coded production
// fallback: it would allow forged sessions on a deployed site.
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production'
    ? 'local-development-secret-change-me'
    : null);

// Registration documents are not persisted by this application. Memory storage
// keeps the serverless function compatible with Vercel's ephemeral filesystem.
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS']
}));
app.use(express.json());
app.use(cookieParser());

const MONGO_URI = process.env.MONGODB_URI;
let databaseConnection = Promise.resolve(null);
if (MONGO_URI) {
    databaseConnection = mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
        .then(() => console.log('Connected to MongoDB Atlas.'))
        .catch(() => {
            console.error('MongoDB connection failed; using temporary in-memory storage.');
            return null;
        });
} else {
    console.warn('MONGODB_URI is not set; using temporary in-memory storage.');
}

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true }
}, { timestamps: true });
const appointmentSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    problem: String,
    requestedSlot: String,
    status: { type: String, default: 'PENDING' }
}, { timestamps: true });
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

const databaseIsReady = () => mongoose.connection.readyState === 1;

const requireDoctor = (req, res, next) => {
    if (!JWT_SECRET) return res.status(503).json({ message: 'Server authentication is not configured.' });
    try {
        const { role } = jwt.verify(req.cookies.auth_token, JWT_SECRET);
        if (role !== 'doctor') return res.status(403).json({ message: 'Doctor access is required.' });
        return next();
    } catch {
        return res.status(401).json({ message: 'Please sign in again.' });
    }
};

// Used only for local development when MONGODB_URI has not been configured.
const registeredUsers = [];
const appointments = [{
    id: '101',
    name: 'A. Pakhira',
    problem: 'Sports Injury Recovery',
    requestedSlot: 'Mon 10:00 AM',
    status: 'PENDING'
}];

app.post('/api/auth/register', upload.any(), async (req, res) => {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name || !role) {
        return res.status(400).json({ message: 'Email, password, name, and role are required.' });
    }
    await databaseConnection;
    if (databaseIsReady()) {
        try {
            if (await User.exists({ email: email.toLowerCase() })) {
                return res.status(400).json({ message: 'User already exists.' });
            }
            await User.create({ email, password: await bcrypt.hash(password, 10), name, role });
            return res.status(201).json({ success: true, message: 'Registration successful!' });
        } catch (error) {
            if (error.code === 11000) return res.status(400).json({ message: 'User already exists.' });
            return res.status(500).json({ message: 'Unable to create user.' });
        }
    }

    registeredUsers.push({ email, password: await bcrypt.hash(password, 10), name, role });
    return res.status(201).json({ success: true, message: 'Registration successful!' });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!JWT_SECRET) {
        return res.status(503).json({
            message: 'Server authentication is not configured. Add JWT_SECRET to the deployment environment variables.'
        });
    }
    await databaseConnection;
    const user = databaseIsReady()
        ? await User.findOne({ email: (email || '').toLowerCase() }).lean()
        : registeredUsers.find(candidate => candidate.email === email);

    if (!user || !(await bcrypt.compare(password || '', user.password))) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000
    });
    return res.json({ success: true, role: user.role });
});

app.get('/api/auth/check-role', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token || !JWT_SECRET) return res.status(401).json({ role: null });

    try {
        return res.json({ role: jwt.verify(token, JWT_SECRET).role });
    } catch {
        return res.status(401).json({ role: null });
    }
});

app.post('/api/appointments', async (req, res) => {
    const { name, phone, email, date, time, message } = req.body;
    if (!name || !phone || !date) {
        return res.status(400).json({ message: 'Name, phone number, and date are required.' });
    }

    await databaseConnection;
    const appointment = {
        id: String(Date.now()), name, phone, email,
        problem: message || 'General consultation',
        requestedSlot: `${date}${time ? ` ${time}` : ''}`,
        status: 'PENDING'
    };
    if (databaseIsReady()) {
        return Appointment.create(appointment)
            .then(() => res.status(201).json({ success: true }))
            .catch(() => res.status(500).json({ message: 'Unable to save appointment.' }));
    }
    appointments.push(appointment);
    return res.status(201).json({ success: true });
});

app.get('/api/admin/appointments', requireDoctor, async (req, res) => {
    await databaseConnection;
    if (databaseIsReady()) return res.json(await Appointment.find({ status: 'PENDING' }).lean());
    return res.json(appointments.filter(appointment => appointment.status === 'PENDING'));
});

app.patch('/api/appointments/:id', requireDoctor, async (req, res) => {
    await databaseConnection;
    if (databaseIsReady()) {
        const appointment = await Appointment.findOneAndUpdate(
            { id: req.params.id }, { status: req.body.status }, { new: true }
        );
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        return res.json({ success: true });
    }
    const appointment = appointments.find(candidate => candidate.id === req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    appointment.status = req.body.status;
    return res.json({ success: true });
});

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
