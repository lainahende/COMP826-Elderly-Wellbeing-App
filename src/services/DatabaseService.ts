import {
  addDoc,
  collection,
  doc,
  getDoc,
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

  async getLinkedElderlyUserId(
    caregiverUserId: string,
  ): Promise<string | null> {
    const caregiverDocument = await getDoc(doc(db, "users", caregiverUserId));

    if (!caregiverDocument.exists()) {
      return null;
    }

    const caregiverData = caregiverDocument.data();

    return caregiverData.elderlyUserId ?? null;
  }
  async getUserProfile(userId: string) {
    const userDocument = await getDoc(doc(db, "users", userId));

    if (!userDocument.exists()) {
      return null;
    }

    return {
      id: userDocument.id,
      ...userDocument.data(),
    };
  }
}
