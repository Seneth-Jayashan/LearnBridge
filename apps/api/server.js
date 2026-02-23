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
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(morgan('combined'));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests from this IP, please try again later." }
});
// Only enable rate limiting in production
if (process.env.NODE_ENV === "production") {
   app.use(limiter);
}

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  // Sanitize the Body (where the user data is)
  if (req.body) {
    req.body = mongoSanitize.sanitize(req.body);
  }
  
  // Sanitize Params (url parameters like :id)
  if (req.params) {
    req.params = mongoSanitize.sanitize(req.params);
  }

  // We SKIP req.query because it is read-only in Express 5
  // If you need to sanitize query params, access them safely inside your controllers
  
  next();
});

app.use('/api/v1', routes);

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


app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});