import express from 'express';
import cors from 'cors';
import itemRoutes from './routes/items.js';
import authRoutes from './routes/auth.js';
import { protect } from './middlewares/auth.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('HomeSpace API is running ahihi');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

export default app;

