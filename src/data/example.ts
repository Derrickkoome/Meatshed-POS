import { db } from "../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export async function addItem(data: any) {
  return addDoc(collection(db, "items"), data);
}

export async function listItems() {
  const snap = await getDocs(collection(db, "items"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}