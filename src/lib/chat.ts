import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  setDoc,
  deleteDoc,
  getDocs,
  query,
  limit,
  where
} from "firebase/firestore";
import { db } from "./firebase";

export interface ChatMessage {
  id: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file';
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderPhoto?: string;
  senderPhotoBaseId?: string;
  createdAt: any;
  edited: boolean;
  deleted: boolean;
  deletedBy?: "self" | "admin";
  role: 'admin' | 'user' | 'mentor';
}

export interface TypingStatus {
  userId: string;
  name: string;
  isTyping: boolean;
  lastTyped: any;
}

const MESSAGES_COLLECTION = "messages";
const USERS_COLLECTION = "users";
const TYPING_COLLECTION = "typing";

/**
 * Send a new message to the global chat.
 */
export async function sendMessage(
  sender: { uid: string; name: string; photoURL: string; photoBaseId?: string; role: 'admin' | 'user' | 'mentor' },
  content: { text: string; mediaUrl?: string | null; mediaType?: 'image' | 'video' | 'file' | null }
) {
  return await addDoc(collection(db, MESSAGES_COLLECTION), {
    text: content.text,
    mediaUrl: content.mediaUrl || null,
    mediaType: content.mediaType || null,
    senderId: sender.uid,
    senderName: sender.name,
    senderAvatar: sender.photoURL,
    senderPhotoBaseId: sender.photoBaseId || null,
    role: sender.role,
    createdAt: serverTimestamp(),
    edited: false,
    deleted: false,
  });
}

/**
 * Edit an existing message.
 */
export async function editMessage(messageId: string, newText: string) {
  const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
  return await updateDoc(messageRef, {
    text: newText,
    edited: true,
  });
}

/**
 * Soft delete a message.
 */
export async function deleteMessage(messageId: string, deletedBy: "self" | "admin") {
  const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
  return await updateDoc(messageRef, {
    deleted: true,
    deletedBy: deletedBy,
  });
}

/**
 * Update typing status for a user.
 */
export async function setTypingStatus(userId: string, name: string, isTyping: boolean) {
  const typingRef = doc(db, TYPING_COLLECTION, userId);
  if (isTyping) {
    return await setDoc(typingRef, {
      userId,
      name,
      isTyping: true,
      lastTyped: serverTimestamp(),
    });
  } else {
    return await deleteDoc(typingRef);
  }
}

/**
 * Mute or unmute a user (Admin only).
 */
export async function toggleMuteUser(userId: string, isMuted: boolean) {
  const userRef = doc(db, USERS_COLLECTION, userId);
  return await updateDoc(userRef, { isMuted });
}

/**
 * Kick a user (Admin only).
 */
export async function kickUser(userId: string) {
  const userRef = doc(db, USERS_COLLECTION, userId);
  return await updateDoc(userRef, { isBanned: true });
}

/**
 * Toggle mentor access to chat (Admin only).
 */
export async function toggleMentorAccess(userId: string, canJoinChat: boolean) {
  const userRef = doc(db, USERS_COLLECTION, userId);
  return await updateDoc(userRef, { canJoinChat });
}

/**
 * Search users for tagging.
 */
export async function searchUsers(queryText: string) {
  // To handle case-insensitivity and ensure "all" people are searchable,
  // we fetch a large batch and filter on the client side.
  const q = query(
    collection(db, USERS_COLLECTION),
    limit(1000)
  );
  
  const snapshot = await getDocs(q);
  const allUsers = snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name || doc.data().displayName || 'Anonymous',
    photoURL: doc.data().photoURL || ''
  }));

  if (!queryText) return allUsers;

  const lowerQuery = queryText.toLowerCase();
  return allUsers.filter(u => 
    u.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Update the user's last read chat timestamp.
 */
export async function updateLastReadChat(userId: string) {
  const userRef = doc(db, USERS_COLLECTION, userId);
  return await updateDoc(userRef, {
    lastReadChatTimestamp: serverTimestamp()
  });
}
