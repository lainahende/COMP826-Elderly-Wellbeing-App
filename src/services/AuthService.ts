import { signInWithEmailAndPassword, signOut } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../config/firebase";

export class AuthService {
  async login(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    const firebaseUser = credential.user;

    const userDocument = await getDoc(doc(db, "users", firebaseUser.uid));

    console.log("Logged in UID:", firebaseUser.uid);
    if (!userDocument.exists()) {
      throw new Error("User profile could not be found.");
    }

    const userData = userDocument.data();

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email ?? "",
      name: userData.name,
      role: userData.role,
    };
  }

  async logout() {
    await signOut(auth);
  }
}
