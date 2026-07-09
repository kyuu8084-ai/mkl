import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
console.log("Firestore registered:", !!getFirestore);
console.log("Storage registered:", !!getStorage);
const app = initializeApp({ projectId: "studywithme-a89e3", storageBucket: "studywithme-a89e3.firebasestorage.app" });
try {
  console.log("Firestore:", !!getFirestore(app));
  console.log("Storage:", !!getStorage(app));
} catch (e) {
  console.error("Error:", e);
}
