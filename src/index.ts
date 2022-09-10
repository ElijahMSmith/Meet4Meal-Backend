import express from 'express';
import cors from 'cors';
import dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());

// Import routes
import userRoutes from './routes/UserRoutes';

// Middlewares
app.use(express.json());
app.use('/user', userRoutes);

// Connect to DB
import mongoose = require('mongoose');
mongoose.connect(process.env.DB_CONNECT, () => {
    console.log('Connected to MongoDB Successfully');
});

// Start on port
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
