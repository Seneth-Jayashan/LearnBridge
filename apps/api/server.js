import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/Database.js'; 
import routes from './routes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
    origin: [
        process.env.CORS_ORIGIN || 'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(morgan('combined'));

// ── Rate Limiters ─────────────────────────────────────────────────────

// General limiter for all routes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests from this IP, please try again later." }
});

// Relaxed limiter specifically for PDF generation (large payloads + slow AI processing)
const pdfLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many PDF generation requests. Please wait before trying again." }
});

app.use(limiter);

// ── Body Parsers ──────────────────────────────────────────────────────

// Large limit for PDF base64 uploads
app.use('/api/v1/pdf', express.json({ limit: '50mb' }));
app.use('/api/v1/pdf', express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api/v1/pdf', pdfLimiter);

// Standard limit for all other routes
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ── Mongo Sanitize ────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (req.body) {
    req.body = mongoSanitize.sanitize(req.body);
  }
  if (req.params) {
    req.params = mongoSanitize.sanitize(req.params);
  }
  // Skipping req.query — read-only in Express 5
  next();
});

// ── Routes ────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── Base Routes ───────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.status(200).json({ message: 'LearnBridge API is running secure & fast!' });
});

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get('/api/v1/test', (req, res) => {
    res.status(200).json({ message: 'Test route is working!' });
});

// ── 404 Handler ───────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});