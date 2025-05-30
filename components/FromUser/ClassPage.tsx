import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";
import AddClassPopup from "../FromUser/ButtonCreate";

interface ClassPageProps {
    onBack: () => void;
    onSelectClass: (classData: any) => void;
  }

 
const ClassPage = ({ onBack, onSelectClass }: { onBack: () => void; onSelectClass: (classData: any) => void }) => {
  const { user } = useUser();
  const [joinedClasses, setJoinedClasses] = useState<any[]>([]);

  // ดึงข้อมูลคลาสที่ผู้ใช้เข้าร่วม
  useEffect(() => {
    if (!user) return;

    const classesRef = collection(db, "classes");
    // เปลี่ยนการ query ให้แสดงเฉพาะคลาสที่เราเป็นสมาชิกแต่ไม่ใช่เจ้าของ
    const q = query(
      classesRef,
      where("created_by", "!=", user.id) // เพิ่มเงื่อนไขนี้
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const classes: any[] = [];
      querySnapshot.forEach((doc) => {
        classes.push({ id: doc.id, ...doc.data() });
      });
      setJoinedClasses(classes);
    });

    return () => unsubscribe();
  }, [user]);

  return (
 <div className="border-2 border-purple-500 rounded-2xl p-4 h-95 md:w-150 md:h-150 md:ml-160 md:-mt-101 md:flex md:flex-col">
      {/* Header */}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-800 text-center flex-grow">Class</h2>
        <button onClick={onBack} className="text-purple-700 hover:text-purple-900">
          <ArrowLeft size={28} />
        </button>
      </div>
        <AddClassPopup />
        {/* แสดงรายการคลาสที่เข้าร่วม */}
      <div className="overflow-scroll max-md:h-75">
        {joinedClasses.map((cls) => (
          <div
            key={cls.id}
            className="flex justify-between mx-4 mt-4 items-center bg-purple-200 hover:bg-purple-300 p-4 rounded-4xl cursor-pointer"
            onClick={() => onSelectClass(cls)}
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-500 text-white text-2xl w-12 h-12 flex items-center justify-center rounded-full">
                {cls.name.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-semibold text-purple-800">{cls.name}</p>
                <p className="text-sm text-purple-600">สร้างโดย: {cls.owner_email}</p>
              </div>
            </div>
            {cls.checkedInMembers?.includes(user?.id) && (
              <span className="text-green-600">✓ เช็คชื่อแล้ว</span>
            )}
          </div>
        ))}
        {joinedClasses.length === 0 && (
          <p className="text-center text-gray-500 mt-4">ยังไม่ได้เข้าร่วมคลาสใดๆ</p>
        )}
      </div>
    </div>
  );
};
export default ClassPage;