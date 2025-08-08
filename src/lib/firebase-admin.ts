
'use server';
import { cert, getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const getFirebaseAdmin = () => {
  const apps = getApps();
  if (apps.length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
        'Firebase Admin SDK initialization failed. ' +
        'Please ensure all FIREBASE_* environment variables are set in your .env.local file. ' +
        'Refer to .env.example for required variables.'
    );
  }

  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    return initializeApp({
      credential: cert({
        project_id: projectId,
        client_email: clientEmail,
        private_key: privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error: any) {
    console.error("Firebase Admin SDK Initialization Error:", error.message);
    throw new Error(`Firebase Admin SDK initialization failed. Details: ${error.message}`);
  }
};

const adminApp = getFirebaseAdmin();

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export const adminStorage = getStorage(adminApp);
