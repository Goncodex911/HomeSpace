import express from 'express';
import cors from 'cors';
import itemRoutes from './routes/items.js';
import authRoutes from './routes/auth.js';
import storeRoutes from './routes/stores.js';
import orderRoutes from './routes/orders.js';
import cartRoutes from './routes/cart.js';
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
app.use('/api/stores', storeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);

export default app;

