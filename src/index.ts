// Socket server
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// Connect to DB
import mongoose = require('mongoose');
import dotenv = require('dotenv');
dotenv.config();


// Start on port
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

