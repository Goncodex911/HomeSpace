import express from 'express';
import cors from 'cors';
import itemRoutes from './routes/items.js';
import authRoutes from './routes/auth.js';
import storeRoutes from './routes/stores.js';
import cartRoutes from './routes/cart.js';
import paymentRoutes from './routes/payment.js';
import orderRoutes from './routes/orders.js';
import reviewRoutes from './routes/reviews.js';
import favoriteRoutes from './routes/favorites.js';
import chatRoutes from './routes/chat.js';
import { protect } from './middlewares/auth.js';

const app = express();
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.get('/', (req, res) => {
    res.send('HomeSpace API is running ahihi');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/chat', chatRoutes);


export default app;


