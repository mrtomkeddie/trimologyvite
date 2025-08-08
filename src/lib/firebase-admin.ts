
import { cert, getApps, initializeApp, getApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

declare global {
  // Avoid re-init during hot reload
  // eslint-disable-next-line no-var
  var __FIREBASE_ADMIN_APP__: App | undefined;
}

function resolveServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const sa = JSON.parse(json);
      if (typeof sa.private_key === 'string') {
        sa.private_key = sa.private_key.replace(/\\n/g, '\n');
      }
      return sa;
    } catch (e) {
      console.error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
      throw e;
    }
  }

  // Fallback to individual variables if JSON is not provided
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  const missing: string[] = [];
  if (!projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');

  if (missing.length > 0) {
    const msg = `Missing Firebase env vars: ${missing.join(', ')}. Check your .env.local file.`;
    console.error(msg);
    throw new Error(msg);
  }

  privateKey = privateKey!.replace(/\\n/g, '\n');

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  };
}


function getFirebaseAdminApp(): App {
  if (global.__FIREBASE_ADMIN_APP__) return global.__FIREBASE_ADMIN_APP__;

  const existing = getApps().find(app => app.name === '[DEFAULT]');
  if (existing) {
    global.__FIREBASE_ADMIN_APP__ = existing;
    return existing;
  }

  const sa = resolveServiceAccount();

  const app = initializeApp({ 
    credential: cert(sa as any),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
  global.__FIREBASE_ADMIN_APP__ = app;
  return app;
}


export const adminDb = getFirestore(getFirebaseAdminApp());
export const adminAuth = getAuth(getFirebaseAdminApp());
export const adminStorage = getStorage(getFirebaseAdminApp());
