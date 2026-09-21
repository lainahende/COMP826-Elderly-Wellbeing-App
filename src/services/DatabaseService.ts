import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";

import { db } from "../config/firebase";

export class DatabaseService {
  async createTestCheckIn(userId: string) {
    const document = await addDoc(collection(db, "checkIns"), {
      elderlyUserId: userId,
      status: "completed",
      timestamp: serverTimestamp(),
    });

    return document.id;
  }

  async getCheckIns(userId: string) {
    const checkInQuery = query(
      collection(db, "checkIns"),
      where("elderlyUserId", "==", userId),
    );

    const snapshot = await getDocs(checkInQuery);

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
  }
}
