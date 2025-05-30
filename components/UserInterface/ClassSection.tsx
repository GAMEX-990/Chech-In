"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, setDoc, doc, where, getDoc } from "firebase/firestore";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import CreateQRCodeAndUpload from "../FromUser/FusionButtonqrup";
import AddClassPopup from "../FromUser/ButtonCreate";

const SyncUserToFirebase = () => {
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
};// -- หน้าที่ 1: MyClassPage
const MyClassPage = ({
  onNext,
  onSelectClass,
}: {
  onNext: () => void;
  onSelectClass: (classData: any) => void;
}) => {
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
              <div className="bg-purple-500 text-white text-4xl font-bold w-12 h-12 flex  justify-center rounded-full ">
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

// -- หน้าที่ 2: ClassPage
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
      <div className="overflow-y-auto mt-4">
        {joinedClasses.map((cls) => (
          <div
            key={cls.id}
            className="flex justify-between mx-4 mt-4 items-center bg-purple-100 hover:bg-purple-200 p-4 rounded-lg cursor-pointer"
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

// -- หน้าที่ 3: ViewClassDetailPage (เข้ามาดูคลาส)
const ViewClassDetailPage = ({ classData, onBack }: { classData: any; onBack: () => void }) => {
  const [checkedInUsers, setCheckedInUsers] = useState<any[]>([]);

  // เพิ่มฟังก์ชันดึงข้อมูลผู้เข้าเรียน
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


  // const handleUploadCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   const reader = new FileReader();
  //   reader.onload = (e) => {
  //     const text = e.target?.result;
  //     console.log("CSV content:", text);
  //     // คุณสามารถ parse CSV แล้วส่งข้อมูลไป firebase ได้ที่นี่
  //   };
  //   reader.readAsText(file);
  // };
  
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
      <div className=" text-purple-800 flex justify-between mx-10">
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
        <div key={user.id} className="flex justify-between items-center bg-purple-100 hover:bg-purple-200 p-4 rounded-lg">
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
     <CreateQRCodeAndUpload
  classId={classData.id}
/>
    </div>
  );
};
// -- Controller หลัก
const ClassSection = () => {
  const [page, setPage] = useState<"myclass" | "class" | "view">("myclass");
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const handleNext = () => {
    setPage("class");
  };

  const handleBack = () => {
    setPage("myclass");
  };

  const handleSelectClass = (classData: any) => {
    setSelectedClass(classData);
    setPage("view");
  };

  return (
    <>
      {/* ✅ ใส่ไว้ให้ sync user ไป Firebase หลัง login */}
      <SyncUserToFirebase />

      {page === "myclass" && <MyClassPage onNext={handleNext} onSelectClass={handleSelectClass} />}
      {page === "class" && <ClassPage onBack={handleBack} onSelectClass={handleSelectClass} />}
      {page === "view" && selectedClass && <ViewClassDetailPage classData={selectedClass} onBack={handleBack} />}
    </>
  );
};
export default ClassSection;
