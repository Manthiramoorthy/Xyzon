const express = require('express');
const mailRoutes = require('./routes/mailRoutes');
const templateRoutes = require('./routes/templateRoutes');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));
app.use(cookieParser());
app.set('trust proxy', 1);
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api/', apiLimiter);

app.use(cors({
    origin: '*', // Allow all origins, adjust as needed for security
    methods: 'GET,POST,PUT,DELETE', // Allow specific methods
    allowedHeaders: 'Content-Type'
}))

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/templates', templateRoutes);

// DB + start
async function start() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB || 'xyzon' });
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (e) {
        console.error('Failed to start server', e);
        process.exit(1);
    }
}
start();
