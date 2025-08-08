import { config } from 'dotenv';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    config({ path: '.env.local' });
  }
}
