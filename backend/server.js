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

const reviews = [
    {
        id: 'rev-1',
        name: 'Aniket Sen',
        rating: 5,
        treatment: 'Sports Injury Recovery',
        review: 'Suffered a severe ankle sprain during a cricket tournament. Dr. Subhajit tailored a targeted rehab and mobility regimen. I was back playing competitively in 5 weeks without any pain!',
        recommend: true,
        date: '24 Sep 2026'
    },
    {
        id: 'rev-2',
        name: 'Sangeeta Roy',
        rating: 5,
        treatment: 'Frozen Shoulder Therapy',
        review: 'I had been dealing with excruciating shoulder stiffness for over 7 months. Dr. Subhajit’s hands-on mobilization and posture corrections gave me 90% relief within just 3 weeks.',
        recommend: true,
        date: '18 Sep 2026'
    },
    {
        id: 'rev-3',
        name: 'Rajesh Ganguly',
        rating: 5,
        treatment: 'Post-Surgery Knee Rehab',
        review: 'Following my knee replacement, I was nervous about rehabilitation. The care and patience Dr. Subhajit provided was exceptional. Today I can climb stairs without any assistance!',
        recommend: true,
        date: '10 Sep 2026'
    },
    {
        id: 'rev-4',
        name: 'Debolina Chatterjee',
        rating: 5,
        treatment: 'Chronic Lower Back Pain',
        review: 'Years of desk job created chronic lumbar pain. His posture education, ergonomic tips, and core strengthening exercises did wonders. Highly recommended clinic in Kolkata!',
        recommend: true,
        date: '02 Sep 2026'
    }
];

const clinicPhotos = [
    {
        id: 'photo-1',
        title: 'Modern Treatment & Therapy Bay',
        category: 'Clinic Facility',
        caption: 'Spacious, sanitized, and fully-equipped manual therapy bay at Roy PhysioCare. Designed for 1-on-1 private patient sessions with ergonomic examination beds.',
        imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
        uploadedBy: 'Dr. Subhajit Mukherjee',
        date: '02 Oct 2026'
    },
    {
        id: 'photo-2',
        title: 'Spinal Decompression & Posture Correction Setup',
        category: 'Spine & Neuro Rehab',
        caption: 'Specialized cervical and lumbar traction equipment used for slip disc, cervical spondylosis, and sciatica decompression. Safe, gentle, and medically supervised.',
        imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
        uploadedBy: 'Dr. Subhajit Mukherjee',
        date: '28 Sep 2026'
    },
    {
        id: 'photo-3',
        title: 'Advanced Electrotherapy & Ultrasound Modalities',
        category: 'Equipment & Modalities',
        caption: 'Latest IFT, TENS, and therapeutic ultrasound machines for rapid pain reduction, deep tissue inflammation control, and accelerated tissue healing.',
        imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
        uploadedBy: 'Roy PhysioCare Clinic',
        date: '22 Sep 2026'
    },
    {
        id: 'photo-4',
        title: 'Sports Injury Rehab & Strength Conditioning Area',
        category: 'Sports Therapy',
        caption: 'Functional exercise station equipped with resistance bands, balance boards, and active rehabilitation tools to restore joint stability and athletic performance.',
        imageUrl: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=1200&q=80',
        uploadedBy: 'Dr. Subhajit Mukherjee',
        date: '15 Sep 2026'
    },
    {
        id: 'photo-5',
        title: 'Doctor Consultation & Evaluation Room',
        category: 'Clinic Facility',
        caption: 'Private diagnostic room for thorough 60-minute initial patient evaluation, range-of-motion assessments, and personalized treatment roadmap planning.',
        imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
        uploadedBy: 'Dr. Subhajit Mukherjee',
        date: '10 Sep 2026'
    },
    {
        id: 'photo-6',
        title: 'Targeted Joint & Muscle Recovery Station',
        category: 'Equipment & Modalities',
        caption: 'Modern therapeutic tools and clinical accessories for precision deep tissue release, mobilization, and post-operative recovery.',
        imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
        uploadedBy: 'Roy PhysioCare Clinic',
        date: '05 Sep 2026'
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
            const list = await Photo.find().sort({ createdAt: -1 }).lean();
            if (list && list.length > 0) {
                return res.json(list);
            }
            // If database is empty, seed initial clinic photos
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
