"use client";

import { useState } from "react";
import { SyncUserToFirebase } from "@/utils/userSync";
import MyClassPage from "../FromUser/MyClassPage";
import ClassPage from "../FromUser/ClassPage";
import { ViewClassDetailPage } from "../FromUser/ViewClassDetailPage";

//ส่วนเอาไว้เลื่อนคลาสต่างๆ
const ClassSection = () => {
  const [page, setPage] = useState<"myclass" | "class" | "view">("myclass");
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const handleNext = () => setPage("class");
  const handleBack = () => setPage("myclass");
  const handleSelectClass = (classData: any) => {
    setSelectedClass(classData);
    setPage("view");
  };

//ส่วนนี้คือหน้าที่ User เห็น
  return (
    <>
      <SyncUserToFirebase />
      {page === "myclass" && <MyClassPage onNext={handleNext} onSelectClass={handleSelectClass} />}
      {page === "class" && <ClassPage onBack={handleBack} onSelectClass={handleSelectClass} />}
      {page === "view" && selectedClass && <ViewClassDetailPage classData={selectedClass} onBack={handleBack} />}
    </>
  );
};

export default ClassSection;