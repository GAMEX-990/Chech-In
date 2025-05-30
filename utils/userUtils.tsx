import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export const fetchCheckedInUsers = async (checkedInMembers: string[]) => {
  if (!checkedInMembers) return [];
  
  const usersList = [];
  for (const userId of checkedInMembers) {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      usersList.push({
        id: userId,
        name: userDoc.data().name || 'ไม่ระบุชื่อ',
        email: userDoc.data().email
      });
    }
  }
  return usersList;
};