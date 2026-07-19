import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Admin SDK JSON key file is located at the server/ root
const serviceAccountPath = path.resolve(__dirname, '../../homespace-dcded-firebase-adminsdk-fbsvc-8152ade140.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount)
});

export const auth = getAuth(app);
