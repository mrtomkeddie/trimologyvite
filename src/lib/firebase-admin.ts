
'use server';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error: any) {
    console.error(
      '----------------------------------------------------------------------\n' +
      'Firebase admin initialization error. This is likely because your\n' +
      'Firebase service account environment variables are not configured\n' +
      'correctly in your `.env.local` file. Please ensure FIREBASE_PROJECT_ID,\n' +
      'FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.\n' +
      '----------------------------------------------------------------------'
    );
    throw error;
  }
}


export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
