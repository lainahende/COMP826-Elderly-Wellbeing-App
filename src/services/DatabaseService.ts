import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
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
  async saveReminderSchedule(elderlyUserId: string, times: string[]) {
    const reminderQuery = query(
      collection(db, "reminders"),
      where("elderlyUserId", "==", elderlyUserId),
    );

    const snapshot = await getDocs(reminderQuery);

    // If a reminder document already exists,
    // update it.
    if (!snapshot.empty) {
      const reminderDocument = snapshot.docs[0];

      await updateDoc(doc(db, "reminders", reminderDocument.id), {
        times,
      });

      return reminderDocument.id;
    }

    // Otherwise create a new one.
    const document = await addDoc(collection(db, "reminders"), {
      elderlyUserId,
      times,
    });

    return document.id;
  }
  subscribeToCheckIns(
    elderlyUserId: string,
    callback: (checkIns: any[]) => void,
  ) {
    const checkInQuery = query(
      collection(db, "checkIns"),
      where("elderlyUserId", "==", elderlyUserId),
    );

    const unsubscribe = onSnapshot(checkInQuery, (snapshot) => {
      const checkIns = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      callback(checkIns);
    });

    return unsubscribe;
  }
  async createMissedCheckIn(
    elderlyUserId: string,
    scheduledTime: string,
    scheduledDate: string,
  ) {
    const existingQuery = query(
      collection(db, "checkIns"),
      where("elderlyUserId", "==", elderlyUserId),
      where("status", "==", "missed"),
      where("scheduledTime", "==", scheduledTime),
      where("scheduledDate", "==", scheduledDate),
    );

    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      return existingSnapshot.docs[0].id;
    }

    const document = await addDoc(collection(db, "checkIns"), {
      elderlyUserId,
      status: "missed",
      scheduledTime,
      scheduledDate,
      timestamp: serverTimestamp(),
    });

    return document.id;
  }
}
