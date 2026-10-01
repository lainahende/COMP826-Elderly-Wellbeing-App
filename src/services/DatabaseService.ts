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
  async createCheckIn(elderlyUserId: string) {
    const document = await addDoc(collection(db, "checkIns"), {
      elderlyUserId,
      status: "completed",
      timestamp: serverTimestamp(),
    });

    return document.id;
  }

  async getCheckIns(elderlyUserId: string) {
    const checkInQuery = query(
      collection(db, "checkIns"),
      where("elderlyUserId", "==", elderlyUserId),
    );

    const snapshot = await getDocs(checkInQuery);

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
  }

  async getReminderSchedule(elderlyUserId: string) {
    const reminderQuery = query(
      collection(db, "reminders"),
      where("elderlyUserId", "==", elderlyUserId),
    );

    const snapshot = await getDocs(reminderQuery);

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
  }
}
