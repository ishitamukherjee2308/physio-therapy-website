const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const path = require('path');

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
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(cookieParser());

// Serve static frontend assets locally with HTML extension support
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath, { extensions: ['html'] }));

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

const reviewSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    treatment: { type: String, required: true },
    review: { type: String, required: true },
    recommend: { type: Boolean, default: true },
    date: { type: String }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

const photoSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    caption: { type: String, required: true },
    category: { type: String, default: 'Clinic Facility' },
    imageUrl: { type: String, required: true },
    uploadedBy: { type: String, default: 'Dr. Subhajit Mukherjee' },
    date: { type: String }
}, { timestamps: true });

const Photo = mongoose.models.Photo || mongoose.model('Photo', photoSchema);

const databaseIsReady = () => mongoose.connection.readyState === 1;

const requireDoctor = (req, res, next) => {
    if (!JWT_SECRET) return res.status(503).json({ message: 'Server authentication is not configured.' });
    try {
        const token = req.cookies.auth_token;
        if (!token) return res.status(401).json({ message: 'Please sign in first.' });
        const { role } = jwt.verify(token, JWT_SECRET);
        if (role !== 'doctor') return res.status(403).json({ message: 'Doctor access is required.' });
        return next();
    } catch {
        return res.status(401).json({ message: 'Please sign in again.' });
    }
};

// In-memory fallback for local development when MONGODB_URI is not configured
const registeredUsers = [];
(async () => {
    try {
        const docPassword = await bcrypt.hash('Doctor@123', 10);
        registeredUsers.push({
            name: 'Dr. Subhajit Mukherjee',
            email: 'subhajitmukherjee.physio@gmail.com',
            password: docPassword,
            role: 'doctor'
        });
        registeredUsers.push({
            name: 'Dr. Subhajit Mukherjee',
            email: 'doctor@clinic.com',
            password: docPassword,
            role: 'doctor'
        });
        const patientPassword = await bcrypt.hash('Patient@123', 10);
        registeredUsers.push({
            name: 'Demo Patient',
            email: 'patient@clinic.com',
            password: patientPassword,
            role: 'patient'
        });
    } catch (err) {
        console.error('Error pre-seeding demo users:', err);
    }
})();

const appointments = [{
    id: '101',
    name: 'A. Pakhira',
    phone: '+91 76794 42194',
    email: 'pakhira@example.com',
    problem: 'Sports Injury Recovery',
    requestedSlot: 'Mon 10:00 AM',
    status: 'PENDING'
}, {
    id: '100',
    name: 'Modhurima Di',
    phone: '+91 98765 43210',
    email: 'modhurima@example.com',
    problem: 'Post-Surgery Lumbar Decompression Rehab',
    requestedSlot: '18 Jan 2026 11:00 AM',
    status: 'APPROVED'
}];

const reviews = [];

const clinicPhotos = [
    {
        id: 'photo-1',
        title: 'Doctor Consultation & Diagnosis Desk',
        category: 'Clinic Facility',
        caption: 'Dr. Subhajit Mukherjee, PT at his clinical evaluation and diagnostic desk at Roy PhysioCare, conducting comprehensive 1-on-1 patient consultations and range-of-motion assessments.',
        imageUrl: 'image/dr_subhajit_mukherjee.jpg',
        uploadedBy: 'Dr. Subhajit Mukherjee',
        date: '10 Oct 2026'
    },
    {
        id: 'photo-2',
        title: 'Myofascial Decompression & Back Cupping',
        category: 'Equipment & Modalities',
        caption: 'Clinical vacuum cupping therapy performed by Dr. Subhajit Mukherjee to relieve severe lumbar spasm, decompress deep fascia, and promote accelerated microcirculation.',
        imageUrl: 'image/cupping_therapy.jpg',
        uploadedBy: 'Dr. Subhajit Mukherjee',
        date: '10 Oct 2026'
    },
    {
        id: 'photo-3',
        title: 'Spinal Mobility & Wall Bar Posture Therapy',
        category: 'Spine & Neuro Rehab',
        caption: 'Targeted spinal realignment and active posture rehabilitation using clinical wall bars and resistance straps for chronic back, scoliosis, and postural imbalance.',
        imageUrl: 'image/posture_wallbar.png',
        uploadedBy: 'Dr. Subhajit Mukherjee',
        date: '10 Oct 2026'
    },
    {
        id: 'photo-4',
        title: 'Post-Surgical Treadmill Gait & Joint Rehab',
        category: 'Spine & Neuro Rehab',
        caption: 'Dr. Subhajit Mukherjee assisting a patient with supervised gait training, joint stability, and treadmill rehabilitation following surgery and joint replacement.',
        imageUrl: 'image/treadmill_rehab.png',
        uploadedBy: 'Dr. Subhajit Mukherjee',
        date: '10 Oct 2026'
    },
    {
        id: 'photo-5',
        title: 'Sports Rehabilitation & Coordination Agility Drills',
        category: 'Sports Therapy',
        caption: 'Floor agility ladder and neuromuscular coordination training session in clinic to restore dynamic footwork, joint stability, and athletic confidence.',
        imageUrl: 'image/agility_ladder.png',
        uploadedBy: 'Dr. Subhajit Mukherjee',
        date: '10 Oct 2026'
    },
    {
        id: 'photo-6',
        title: 'Balance & Gait Agility Cone Training',
        category: 'Spine & Neuro Rehab',
        caption: 'Dynamic cone stepping drills supervised by Dr. Subhajit Mukherjee for fall prevention, senior mobility enhancement, and neurological gait restoration.',
        imageUrl: 'image/balance_training.png',
        uploadedBy: 'Dr. Subhajit Mukherjee',
        date: '10 Oct 2026'
    },
    {
        id: 'photo-7',
        title: 'Targeted Knee Joint Decompression Cupping',
        category: 'Equipment & Modalities',
        caption: 'Clinical multi-cup vacuum decompression applied around the knee joint to reduce chronic inflammation, joint stiffness, and accelerate healing in osteoarthritis and meniscus issues.',
        imageUrl: 'image/knee_cupping.jpg',
        uploadedBy: 'Dr. Subhajit Mukherjee',
        date: '10 Oct 2026'
    }
];

app.post('/api/auth/register', upload.any(), async (req, res) => {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name || !role) {
        return res.status(400).json({ message: 'Email, password, name, and role are required.' });
    }
    const normalizedEmail = (email || '').toLowerCase().trim();
    await databaseConnection;
    if (databaseIsReady()) {
        try {
            if (await User.exists({ email: normalizedEmail })) {
                return res.status(400).json({ message: 'User already exists.' });
            }
            await User.create({ email: normalizedEmail, password: await bcrypt.hash(password, 10), name, role });
            return res.status(201).json({ success: true, message: 'Registration successful!' });
        } catch (error) {
            if (error.code === 11000) return res.status(400).json({ message: 'User already exists.' });
            return res.status(500).json({ message: 'Unable to create user.' });
        }
    }

    if (registeredUsers.some(u => u.email === normalizedEmail)) {
        return res.status(400).json({ message: 'User already exists.' });
    }

    registeredUsers.push({ email: normalizedEmail, password: await bcrypt.hash(password, 10), name, role });
    return res.status(201).json({ success: true, message: 'Registration successful!' });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!JWT_SECRET) {
        return res.status(503).json({
            message: 'Server authentication is not configured. Add JWT_SECRET to the deployment environment variables.'
        });
    }
    const normalizedEmail = (email || '').toLowerCase().trim();
    await databaseConnection;
    const user = databaseIsReady()
        ? await User.findOne({ email: normalizedEmail }).lean()
        : registeredUsers.find(candidate => candidate.email === normalizedEmail);

    if (!user || !(await bcrypt.compare(password || '', user.password))) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ role: user.role, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000
    });
    return res.json({ success: true, role: user.role, name: user.name });
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });
    return res.json({ success: true, message: 'Logged out successfully.' });
});

app.get('/api/auth/check-role', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token || !JWT_SECRET) return res.status(401).json({ role: null });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return res.json({ role: decoded.role, name: decoded.name || null });
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
        id: String(Date.now()),
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : '',
        problem: message ? message.trim() : 'General consultation',
        requestedSlot: `${date}${time ? ` ${time}` : ''}`,
        status: 'PENDING'
    };
    if (databaseIsReady()) {
        return Appointment.create(appointment)
            .then(() => res.status(201).json({ success: true }))
            .catch(() => res.status(500).json({ message: 'Unable to save appointment.' }));
    }
    appointments.unshift(appointment);
    return res.status(201).json({ success: true });
});

app.get('/api/admin/appointments', requireDoctor, async (req, res) => {
    await databaseConnection;
    if (databaseIsReady()) return res.json(await Appointment.find({ status: 'PENDING' }).sort({ createdAt: -1 }).lean());
    return res.json(appointments.filter(appointment => appointment.status === 'PENDING'));
});

app.get('/api/admin/history', requireDoctor, async (req, res) => {
    await databaseConnection;
    if (databaseIsReady()) {
        return res.json(await Appointment.find({ status: { $ne: 'PENDING' } }).sort({ updatedAt: -1 }).lean());
    }
    return res.json(appointments.filter(appointment => appointment.status !== 'PENDING'));
});

app.patch('/api/appointments/:id', requireDoctor, async (req, res) => {
    await databaseConnection;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required.' });

    if (databaseIsReady()) {
        const appointment = await Appointment.findOneAndUpdate(
            { id: req.params.id }, { status }, { new: true }
        );
        if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
        return res.json({ success: true, appointment });
    }
    const appointment = appointments.find(candidate => candidate.id === req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });

    appointment.status = status;
    return res.json({ success: true, appointment });
});

// Reviews API
app.get('/api/reviews', async (req, res) => {
    await databaseConnection;
    if (databaseIsReady()) {
        try {
            await Review.deleteMany({ id: { $in: ['rev-1', 'rev-2', 'rev-3', 'rev-4'] } });
            const list = await Review.find().sort({ createdAt: -1 }).lean();
            return res.json(list);
        } catch {
            return res.status(500).json({ message: 'Unable to load reviews.' });
        }
    }
    return res.json(reviews);
});

app.post('/api/reviews', async (req, res) => {
    const { name, rating, treatment, review, recommend } = req.body;
    if (!name || !rating || !treatment || !review) {
        return res.status(400).json({ message: 'Name, rating, treatment, and review message are required.' });
    }

    const newReview = {
        id: 'rev-' + Date.now(),
        name: name.trim(),
        rating: Math.max(1, Math.min(5, Number(rating) || 5)),
        treatment: treatment.trim(),
        review: review.trim(),
        recommend: recommend !== false,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    await databaseConnection;
    if (databaseIsReady()) {
        try {
            const created = await Review.create(newReview);
            return res.status(201).json({ success: true, review: created });
        } catch {
            return res.status(500).json({ message: 'Unable to save review.' });
        }
    }

    reviews.unshift(newReview);
    return res.status(201).json({ success: true, review: newReview });
});

// Clinic & Therapy Photos API
app.get('/api/photos', async (req, res) => {
    await databaseConnection;
    if (databaseIsReady()) {
        try {
            await Photo.deleteMany({ imageUrl: { $regex: 'unsplash.com', $options: 'i' } });
            const list = await Photo.find().sort({ createdAt: -1 }).lean();
            if (list && list.length > 0) {
                return res.json(list);
            }
            await Photo.insertMany(clinicPhotos);
            return res.json(clinicPhotos);
        } catch {
            return res.status(500).json({ message: 'Unable to load clinic photos.' });
        }
    }
    return res.json(clinicPhotos);
});

app.post('/api/photos', async (req, res) => {
    const { title, caption, category, imageUrl, uploadedBy } = req.body;
    if (!title || !caption || !imageUrl) {
        return res.status(400).json({ message: 'Title, caption, and photo image are required.' });
    }

    const newPhoto = {
        id: 'photo-' + Date.now(),
        title: title.trim(),
        caption: caption.trim(),
        category: (category || 'Clinic Facility').trim(),
        imageUrl: imageUrl.trim(),
        uploadedBy: (uploadedBy || 'Dr. Subhajit Mukherjee').trim(),
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    await databaseConnection;
    if (databaseIsReady()) {
        try {
            const created = await Photo.create(newPhoto);
            return res.status(201).json({ success: true, photo: created });
        } catch {
            return res.status(500).json({ message: 'Unable to save photo.' });
        }
    }

    clinicPhotos.unshift(newPhoto);
    return res.status(201).json({ success: true, photo: newPhoto });
});

// Non-API route fallback to frontend SPA/Static pages (compatible with Express 4 and 5)
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(frontendPath, 'index.html'));
    }
    next();
});

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
