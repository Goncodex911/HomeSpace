import express from 'express';
import cors from 'cors';
import itemRoutes from './routes/items.js';
import authRoutes from './routes/auth.js';
import storeRoutes from './routes/stores.js';
import cartRoutes from './routes/cart.js';
import paymentRoutes from './routes/payment.js';
import orderRoutes from './routes/orders.js';
import { protect } from './middlewares/auth.js';

const app = express();
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('HomeSpace API is running ahihi');
});

app.get(['/model-viewer', '/api/model-viewer'], (req, res) => {
  // Trích xuất modelUrl thô từ query string để không bị cắt xén bởi dấu '&' trong URL của Tripo3D
  const rawQuery = req.url.split('?')[1] || '';
  let modelUrl = '';
  
  if (rawQuery.includes('modelUrl=')) {
    const parts = rawQuery.split('modelUrl=');
    if (parts[1]) {
      modelUrl = decodeURIComponent(parts[1]).split('&bg=')[0];
    }
  } else {
    modelUrl = req.query.modelUrl || '';
  }

  const background = req.query.bg || '#eeeeea';
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"></script>
  <style>
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: ${background}; }
    model-viewer { width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>
  <model-viewer 
    src="${modelUrl || ''}" 
    camera-controls 
    shadow-intensity="1.2" 
    exposure="1.0"
    interaction-prompt="auto"
    touch-action="pan-y">
  </model-viewer>
</body>
</html>`);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/orders', orderRoutes);


export default app;


