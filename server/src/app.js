import express from 'express';
import cors from 'cors';
import itemRoutes from './routes/items.js';
import authRoutes from './routes/auth.js';
import firebaseAuthRoutes from './routes/authRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import errorHandler from './firebase/errorMiddleware.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HomeSpace API Running...",
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/firebase-auth', firebaseAuthRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/upload', uploadRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

export default app;
