import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import CreateQRCodeAndUpload from "./FusionButtonqrup";

interface ViewClassDetailPageProps {
  classData: any;
  onBack: () => void;
}

export const ViewClassDetailPage = ({ classData, onBack }: ViewClassDetailPageProps) => {
  const [checkedInUsers, setCheckedInUsers] = useState<any[]>([]);

  // ดึงข้อมูลผู้เข้าเรียน
  useEffect(() => {
    const fetchCheckedInUsers = async () => {
      try {
        if (!classData.checkedInMembers) return;
        
        const usersList = [];
        for (const userId of classData.checkedInMembers) {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            usersList.push({
              id: userId,
              name: userDoc.data().name || 'ไม่ระบุชื่อ',
              email: userDoc.data().email
            });
          }
        }
        setCheckedInUsers(usersList);
      } catch (error) {
        console.error('Error fetching checked-in users:', error);
      }
    };

    fetchCheckedInUsers();
  }, [classData.checkedInMembers]);

  return (
    <div className="border-2 border-purple-500 rounded-2xl p-4 h-95 md:w-150 md:h-150 md:ml-160 md:-mt-101 md:flex md:flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="text-purple-700 hover:text-purple-900">
          <ArrowLeft size={28} />
        </button>
        <h2 className="text-2xl font-bold text-purple-800 text-center flex-grow">{classData.name}</h2>
      </div>

      {/* ดูสรุปการเข้าเรียน */}
      <div className="text-purple-800 flex justify-between mx-10">
        <p className="">ชื่อ-สกุล</p>
        <button className="border border-purple-700 py-1 px-2 rounded-4xl">
          ดูสรุปการเข้าเรียน
        </button>
        <p className="">รหัส นศ.</p>
      </div>

      <div className="">
        <p className="text-right text-purple-800">
          จำนวนสมาชิกที่เช็คชื่อ: {classData?.checkedInCount || 0}
        </p>
      </div>

      {/* รายชื่อสมาชิก */}
      <div className="space-y-4 mt-6 overflow-y-auto">
        {checkedInUsers.map((user) => (
          <div key={user.id} className="flex justify-between items-center bg-purple-200 hover:bg-purple-300 p-4 rounded-4xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-semibold text-purple-900">{user.name}</p>
                <p className="text-sm text-purple-600">{user.email}</p>
              </div>
            </div>
            <span className="text-green-600">✓ เช็คชื่อแล้ว</span>
          </div>
        ))}
      </div>
      <CreateQRCodeAndUpload classId={classData.id} />
    </div>
  );
};
export default ViewClassDetailPage;