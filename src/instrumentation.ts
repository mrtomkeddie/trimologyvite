import { config } from 'dotenv';
import path from 'path';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    config({ path: path.resolve(process.cwd(), '.env.local') });
  }
}
