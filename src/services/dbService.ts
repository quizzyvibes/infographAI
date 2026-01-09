
import { db, storage, auth } from './firebase';
// @ts-ignore
import { collection, addDoc, query, where, orderBy, getDocs, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
// @ts-ignore
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { HistoryItem, SystemConfig } from '../types';

const COLLECTION_NAME = 'infographics';
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_DOC = 'global';

/**
 * Helper: Firestore throws an error if a field is 'undefined'.
 * This recursively converts undefined values to null or strips them.
 */
const sanitizeForFirestore = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;
  
  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }

  // Handle Objects
  const newObj: any = {};
  for (const key in obj) {
    const value = obj[key];
    if (value !== undefined) {
      newObj[key] = sanitizeForFirestore(value);
    } else {
      newObj[key] = null; // Convert undefined to null
    }
  }
  return newObj;
};

// Check if DB is initialized before performing operations
const ensureDb = () => {
  if (!db) throw new Error("Firebase Firestore is not initialized. Check your API Keys.");
  return db;
};

const ensureStorage = () => {
  if (!storage) throw new Error("Firebase Storage is not initialized. Check your API Keys.");
  return storage;
};

/**
 * Uploads a Base64 image to Firebase Storage and returns the download URL and path.
 */
export const uploadImageToStorage = async (userId: string, base64Image: string): Promise<{ url: string, path: string }> => {
  const s = ensureStorage();
  try {
    // Create a unique path: users/{userId}/{timestamp}.png
    const timestamp = Date.now();
    const path = `users/${userId}/${timestamp}.png`;
    const storageRef = ref(s, path);

    await uploadString(storageRef, base64Image, 'data_url');
    const url = await getDownloadURL(storageRef);
    
    return { url, path };
  } catch (error: any) {
    console.error("Storage Upload Error:", error);
    if (error.code === 'storage/unauthorized') {
      throw new Error("Storage Permission Denied. Check Firebase Storage Rules.");
    }
    throw new Error("Image upload failed.");
  }
};

/**
 * Saves a history item to Firestore.
 * If the image is a Base64 string, it uploads it first.
 */
export const saveHistoryItemToDb = async (userId: string, item: Omit<HistoryItem, 'id' | 'userId'>, base64Image?: string): Promise<HistoryItem> => {
  let imageUrl = item.imageUrl;
  let storagePath = item.storagePath;

  // If we have a raw base64 string provided, upload it first
  if (base64Image && base64Image.startsWith('data:')) {
    try {
      const upload = await uploadImageToStorage(userId, base64Image);
      imageUrl = upload.url;
      storagePath = upload.path;
    } catch (e) {
      console.warn("Image upload failed, falling back to base64 storage in document (not recommended for large files)", e);
      // We continue, effectively saving the base64 string directly to Firestore if storage fails
      // This is a fallback to ensure data isn't lost, though Firestore has size limits.
    }
  }

  const rawItem = {
    ...item,
    userId,
    imageUrl, 
    storagePath: storagePath || null,
    timestamp: Date.now()
  };

  // CRITICAL FIX: Sanitize undefined values before sending to Firestore
  const cleanItem = sanitizeForFirestore(rawItem);

  try {
    const d = ensureDb();
    const docRef = await addDoc(collection(d, COLLECTION_NAME), cleanItem);
    return { ...cleanItem, id: docRef.id, storagePath: storagePath || undefined };
  } catch (error: any) {
    console.error("Firestore Save Error:", error);
    if (error.code === 'permission-denied') {
      throw new Error("Firestore Permission Denied. Check Firestore Rules.");
    }
    throw new Error(error.message || "Failed to save to database.");
  }
};

/**
 * Updates an existing item (e.g., adding article data)
 */
export const updateHistoryItemInDb = async (itemId: string, updates: Partial<HistoryItem>) => {
  const d = ensureDb();
  const docRef = doc(d, COLLECTION_NAME, itemId);
  const cleanUpdates = sanitizeForFirestore(updates);
  await updateDoc(docRef, cleanUpdates);
};

/**
 * Fetches user's history from Firestore.
 */
export const getUserHistory = async (userId: string): Promise<HistoryItem[]> => {
  try {
    const d = ensureDb();
    const q = query(
      collection(d, COLLECTION_NAME),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...(doc.data() as any)
    } as HistoryItem));
  } catch (error) {
    console.error("Fetch History Error", error);
    return [];
  }
};

/**
 * Deletes an item from Firestore and Storage.
 */
export const deleteHistoryItemFromDb = async (itemId: string, storagePath?: string) => {
  const d = ensureDb();
  // 1. Delete from Firestore
  await deleteDoc(doc(d, COLLECTION_NAME, itemId));

  // 2. Delete from Storage if path exists
  if (storagePath) {
    try {
      const s = ensureStorage();
      const storageRef = ref(s, storagePath);
      await deleteObject(storageRef);
    } catch (e) {
      console.warn("Could not delete file from storage (might already be gone)", e);
    }
  }
};

/**
 * Fetches the global system configuration.
 */
export const getSystemConfig = async (): Promise<SystemConfig | null> => {
  try {
    const d = ensureDb();
    const docRef = doc(d, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as SystemConfig;
    }
    return null;
  } catch (e) {
    console.error("Failed to fetch system config", e);
    return null;
  }
};

/**
 * Saves the global system configuration.
 */
export const saveSystemConfig = async (config: SystemConfig) => {
  const d = ensureDb();
  const docRef = doc(d, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC);
  await setDoc(docRef, config, { merge: true });
};



