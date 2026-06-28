import { PayOS } from '@payos/node';
import dotenv from 'dotenv';

dotenv.config();

let payOS = null;

const clientId = process.env.PAYOS_CLIENT_ID;
const apiKey = process.env.PAYOS_API_KEY;
const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

if (clientId && apiKey && checksumKey && clientId !== 'your_client_id') {
  try {
    payOS = new PayOS({ clientId, apiKey, checksumKey });
    console.log('PayOS initialized successfully.');
  } catch (error) {
    console.error('Error initializing PayOS:', error.message);
  }
} else {
  console.warn('PayOS keys are missing or invalid in .env. Payment features will mock links instead.');
}

export default payOS;

