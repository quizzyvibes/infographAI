
import { db, storage } from './firebase';
import { collection, addDoc, query, where, orderBy, getDocs, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { HistoryItem, SystemConfig } from '../types';

const COLLECTION_NAME = 'infographics';
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_DOC = 'global';

/**
 * Uploads a Base64 image to Firebase Storage and returns the download URL and path.
 */
export const uploadImageToStorage = async (userId: string, base64Image: string): Promise<{ url: string, path: string }> => {
  // Create a unique path: users/{userId}/{timestamp}.png
  const timestamp = Date.now();
  const path = `users/${userId}/${timestamp}.png`;
  const storageRef = ref(storage, path);

  await uploadString(storageRef, base64Image, 'data_url');
  const url = await getDownloadURL(storageRef);
  
  return { url, path };
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
    const upload = await uploadImageToStorage(userId, base64Image);
    imageUrl = upload.url;
    storagePath = upload.path;
  }

  const newItem = {
    ...item,
    userId,
    imageUrl, // This is now a generic URL (firebase storage or otherwise)
    storagePath: storagePath || null,
    timestamp: Date.now()
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), newItem);
  return { ...newItem, id: docRef.id, storagePath: storagePath || undefined };
};

/**
 * Updates an existing item (e.g., adding article data)
 */
export const updateHistoryItemInDb = async (itemId: string, updates: Partial<HistoryItem>) => {
  const docRef = doc(db, COLLECTION_NAME, itemId);
  await updateDoc(docRef, updates);
};

/**
 * Fetches user's history from Firestore.
 */
export const getUserHistory = async (userId: string): Promise<HistoryItem[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId),
    orderBy("timestamp", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as HistoryItem));
};

/**
 * Deletes an item from Firestore and Storage.
 */
export const deleteHistoryItemFromDb = async (itemId: string, storagePath?: string) => {
  // 1. Delete from Firestore
  await deleteDoc(doc(db, COLLECTION_NAME, itemId));

  // 2. Delete from Storage if path exists
  if (storagePath) {
    try {
      const storageRef = ref(storage, storagePath);
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
    const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC);
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
  const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC);
  await setDoc(docRef, config, { merge: true });
};

