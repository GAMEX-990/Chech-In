import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { ArrowRight } from "lucide-react";
import AddClassPopup from "../FromUser/ButtonCreate";

interface MyClassPageProps {
    onNext: () => void;
    onSelectClass: (classData: any) => void;
  }

  // -- หน้าที่ 1: MyClassPage
  const MyClassPage = ({ onNext, onSelectClass }: MyClassPageProps) => {
    const { isLoaded, isSignedIn, user } = useUser();
    const [classes, setClasses] = useState<any[]>([]);
  
    useEffect(() => {
      if (!isLoaded || !isSignedIn || !user) return;
  
      const classesRef = collection(db, "classes");
      const q = query(classesRef, where("owner_email", "==", user.primaryEmailAddress?.emailAddress));
  
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const classList: any[] = [];
        querySnapshot.forEach((doc) => {
          classList.push({ id: doc.id, ...doc.data() });
        });
        setClasses(classList);
      });
  
      return () => unsubscribe();
    }, [isLoaded, isSignedIn, user]);
  
    return (
      <div className="border-2 border-purple-500 rounded-2xl p-4 h-95 md:w-150 md:h-150 md:ml-160 md:-mt-101 md:flex md:flex-col">
        {/* Header */}
  
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-purple-800 text-center flex-grow">My Class</h2>
          <button className="text-2xl text-purple-600" onClick={onNext}>
            <ArrowRight size={28} />
          </button>
        </div>
        <AddClassPopup />
        {/* Class List */}
        <div className="overflow-scroll max-md:h-75">
          {classes.length > 0 ? (
            classes.map((cls) => (
  
              <div
                key={cls.id}
                className="flex justify-between mx-15 mt-4 items-center bg-purple-200 hover:bg-purple-300 p-4 rounded-4xl cursor-pointer "
                onClick={() => onSelectClass(cls)}
              >
                <span className="text-lg font-semibold text-purple-800 ">{cls.name}</span>
                <div className="flex-1 border-b border-purple-300" />
                <div className="bg-purple-500 text-white text-4xl font-bold w-12 h-12 flex  justify-center rounded-full">
                  {cls.name.charAt(0)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400">ยังไม่มีคลาสใด ๆ</p>
          )}
        </div>
      </div>
    );
  };
  export default MyClassPage;