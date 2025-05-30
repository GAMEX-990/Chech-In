import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export const SyncUserToFirebase = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const userData = {
        id: user.id,
        name: user.fullName,
        email: user.primaryEmailAddress?.emailAddress,
      };

      const docRef = doc(db, "users", user.id);
      setDoc(docRef, userData, { merge: true });
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
};