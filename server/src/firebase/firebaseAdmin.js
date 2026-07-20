import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, '../../homespace-dcded-firebase-adminsdk-fbsvc-8152ade140.json');

let auth = null;

if (existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  const app = initializeApp({
    credential: cert(serviceAccount),
  });
  auth = getAuth(app);
} else {
  console.warn(
    'Firebase Admin SDK key not found. Google login is disabled until homespace-dcded-firebase-adminsdk-fbsvc-8152ade140.json is added to server/.'
  );
}

export { auth };
