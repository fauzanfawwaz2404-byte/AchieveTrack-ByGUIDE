import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';

export const logActivity = async (user: User | null, userName: string, action: string, menuId?: string, details?: string) => {
  if (!user) return;

  try {
    await addDoc(collection(db, 'activity_logs'), {
      userId: user.uid,
      userEmail: user.email,
      userName: userName,
      action: action,
      menuId: menuId || null,
      details: details || null,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

export const clearOldLogs = async () => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(collection(db, 'activity_logs'), where('timestamp', '<', dayAgo));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    
    await batch.commit();
  } catch (error) {
    console.error("Failed to clear old logs:", error);
  }
};

export const clearAllLogs = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'activity_logs'));
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error("Failed to clear all logs:", error);
  }
};
