"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, setDoc, doc, where } from "firebase/firestore";
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
const ClassPage = ({ onBack }: { onBack: () => void }) => {
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
    </div>
  );
};

// -- หน้าที่ 3: ViewClassDetailPage (เข้ามาดูคลาส)
const ViewClassDetailPage = ({ classData, onBack }: { classData: any; onBack: () => void }) => {
  const [students, setStudents] = useState<any[]>([]);


  // ดึงข้อมูลสมาชิกของคลาสนี้
  useEffect(() => {
    const studentsRef = collection(db, "classes", classData.id, "students");
    const q = query(studentsRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentsList: any[] = [];
      querySnapshot.forEach((doc) => {
        studentsList.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studentsList);
    });

    return () => unsubscribe();
  }, [classData.id]);

  const handleUploadCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      console.log("CSV content:", text);
      // คุณสามารถ parse CSV แล้วส่งข้อมูลไป firebase ได้ที่นี่
    };
    reader.readAsText(file);
  };
  
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
        <p className="text-right text-purple-800">จำนวนสมาชิกที่เช็คชื่อ {students.length}</p>
      </div>

      {/* รายชื่อสมาชิก */}
      <div className="space-y-4 mt-6 ">
        {students.length > 0 ? (
          students.map((student) => (
            <div
              key={student.id}
              className="flex justify-between items-center bg-purple-100 hover:bg-purple-200 p-4 rounded-lg"
            >
              <span className="text-lg font-semibold text-purple-900">{student.name}</span>
              <span className="text-sm text-purple-700">
                {student.attended ? "เช็คชื่อแล้ว" : "ยังไม่เช็คชื่อ"}
              </span>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400"></p>
        )}
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
      {page === "class" && <ClassPage onBack={handleBack} />}
      {page === "view" && selectedClass && <ViewClassDetailPage classData={selectedClass} onBack={handleBack} />}
    </>
  );
};
export default ClassSection;
