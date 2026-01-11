
import { db, storage, auth } from './firebase';
// @ts-ignore
import { collection, addDoc, query, where, orderBy, getDocs, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
// @ts-ignore
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { HistoryItem, SystemConfig, ShopBundle, AppUser } from '../types';

const COLLECTION_NAME = 'infographics';
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_DOC = 'global';
const SHOP_COLLECTION = 'shop_bundles';
const USERS_COLLECTION = 'users';

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
export const uploadImageToStorage = async (userId: string, base64Image: string, folder = 'users'): Promise<{ url: string, path: string }> => {
  if (!userId) throw new Error("User ID is missing.");
  const s = ensureStorage();
  try {
    // Create a unique path: users/{userId}/{timestamp}.png
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const path = `${folder}/${userId}/${timestamp}_${randomId}.png`;
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
 * STRICTLY filters out heavy derivative assets to prevent size limit errors.
 */
export const saveHistoryItemToDb = async (userId: string, item: Omit<HistoryItem, 'id' | 'userId'>, base64Image?: string): Promise<HistoryItem> => {
  if (!userId) throw new Error("User ID is required to save history.");
  
  let imageUrl = item.imageUrl;
  let storagePath = item.storagePath;

  // 1. Upload Image if Base64
  if (base64Image && base64Image.startsWith('data:')) {
    try {
      const upload = await uploadImageToStorage(userId, base64Image);
      imageUrl = upload.url;
      storagePath = upload.path;
    } catch (e) {
      console.warn("Image upload failed, falling back to base64 storage in document (not recommended for large files)", e);
      // Fallback: We proceed, but the document might be large.
      // If upload fails, imageUrl remains the base64 string.
      if (!imageUrl) imageUrl = base64Image; 
    }
  }

  // 2. Strip Heavy Assets (Safety Filter)
  // Even if App.tsx passes them, we do NOT save them to DB to ensure stability.
  const { 
    presentationData, 
    shortsData, 
    quizData, 
    articleData, 
    transcript, 
    ...coreItem 
  } = item as any;

  const rawItem = {
    ...coreItem,
    userId,
    imageUrl, 
    storagePath: storagePath || null,
    timestamp: Date.now()
  };

  // 3. Sanitize
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
 * Updates an existing item.
 * NOTE: We restrict what can be updated to prevent accidentally adding heavy objects back.
 */
export const updateHistoryItemInDb = async (itemId: string, updates: Partial<HistoryItem>) => {
  const d = ensureDb();
  const docRef = doc(d, COLLECTION_NAME, itemId);
  
  // Filter out heavy assets again, just in case
  const { 
    presentationData, 
    shortsData, 
    quizData, 
    articleData, 
    transcript, 
    ...safeUpdates 
  } = updates as any;

  const cleanUpdates = sanitizeForFirestore(safeUpdates);
  if (Object.keys(cleanUpdates).length > 0) {
      await updateDoc(docRef, cleanUpdates);
  }
};

/**
 * Fetches user's history from Firestore.
 * SORTS CLIENT-SIDE to avoid "Missing Index" errors which cause empty results.
 */
export const getUserHistory = async (userId: string): Promise<HistoryItem[]> => {
  if (!userId) return [];
  try {
    const d = ensureDb();
    // REMOVED 'orderBy' to prevent index requirements failure
    const q = query(
      collection(d, COLLECTION_NAME),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...(doc.data() as any)
    } as HistoryItem));

    // Sort descending by timestamp in memory
    return items.sort((a: HistoryItem, b: HistoryItem) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Fetch History Error", error);
    // Return empty array on error to prevent crashing, but log it
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

// --- USER MANAGEMENT ---

export const syncUserToDb = async (user: AppUser) => {
  if (!user || !user.uid) return;
  try {
    const d = ensureDb();
    const userRef = doc(d, USERS_COLLECTION, user.uid);
    // Set user data, merge = true ensures we don't overwrite custom admin fields like 'role' or 'status'
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastActive: Date.now(),
      // Default fields if not exists
      status: 'Active',
      role: 'User' 
    }, { merge: true });
  } catch (e) {
    console.error("Failed to sync user", e);
  }
};

export const getAllUsers = async () => {
  try {
    const d = ensureDb();
    // Sort by last active desc
    const q = query(collection(d, USERS_COLLECTION), orderBy("lastActive", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Fetch users failed", e);
    return [];
  }
};

export const toggleUserBan = async (uid: string, currentStatus: string) => {
  const d = ensureDb();
  const newStatus = currentStatus === 'Banned' ? 'Active' : 'Banned';
  await updateDoc(doc(d, USERS_COLLECTION, uid), { status: newStatus });
  return newStatus;
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

// --- SHOP CLOUD SYNC ---

export const saveShopBundleToDb = async (bundle: ShopBundle): Promise<void> => {
  const d = ensureDb();
  
  // 1. Upload Thumbnail if Base64
  let finalThumbnail = bundle.thumbnailUrl;
  if (finalThumbnail.startsWith('data:')) {
     const res = await uploadImageToStorage('admin_shop', finalThumbnail, 'shop');
     finalThumbnail = res.url;
  }

  // 2. Upload Gallery Images
  const finalGallery = [];
  for (const img of bundle.gallery) {
     if (img.startsWith('data:')) {
        const res = await uploadImageToStorage('admin_shop', img, 'shop');
        finalGallery.push(res.url);
     } else {
        finalGallery.push(img);
     }
  }

  const cleanBundle = sanitizeForFirestore({
     ...bundle,
     thumbnailUrl: finalThumbnail,
     gallery: finalGallery,
     timestamp: Date.now()
  });

  await addDoc(collection(d, SHOP_COLLECTION), cleanBundle);
};

export const updateShopBundleInDb = async (bundle: ShopBundle): Promise<void> => {
  const d = ensureDb();
  const docRef = doc(d, SHOP_COLLECTION, bundle.id);
  const cleanBundle = sanitizeForFirestore(bundle);
  await updateDoc(docRef, cleanBundle);
};

export const deleteShopBundleFromDb = async (id: string): Promise<void> => {
  const d = ensureDb();
  await deleteDoc(doc(d, SHOP_COLLECTION, id));
};

export const getShopBundlesFromDb = async (): Promise<ShopBundle[]> => {
  try {
    const d = ensureDb();
    // Order by newest first
    const q = query(collection(d, SHOP_COLLECTION), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    } as ShopBundle));
  } catch (e) {
    console.error("Failed to load shop bundles from Cloud", e);
    return [];
  }
};








