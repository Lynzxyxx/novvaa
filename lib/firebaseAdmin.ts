import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getDatabase, Database } from 'firebase-admin/database';

/**
 * Firebase Realtime Database (Admin SDK) — dipakai untuk menyimpan akun
 * pelanggan berlangganan (email + password ter-hash), status pesanan QRIS,
 * dan sisa token pemakaian. Butuh Service Account dari Firebase Console:
 * Project settings -> Service accounts -> Generate new private key, plus
 * URL Realtime Database (Build -> Realtime Database -> aktifkan dulu).
 */
function initAdmin() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    throw new Error(
      'Firebase belum dikonfigurasi. Isi FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, dan FIREBASE_DATABASE_URL di Environment Variables.'
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    databaseURL,
  });
}

let _db: Database | null = null;
export function getRTDB(): Database {
  if (!_db) _db = getDatabase(initAdmin());
  return _db;
}

export function firebaseConfigured() {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_DATABASE_URL
  );
}
