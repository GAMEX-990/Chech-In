"use client";
import { increment } from 'firebase/firestore';  // เพิ่มบรรทัดนี้ที่ด้านบน
import { useState, useEffect, useRef, ChangeEvent } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp, updateDoc, arrayUnion, doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { FaTimes } from "react-icons/fa";
import { openCamera, scanQRCode, stopCamera } from "@/utils/camera";



export default function AddClassPopup() {
  // State variables สำหรับจัดการสถานะต่างๆ
  //------------------------------------------------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement>(null);
  //------------------------------------------------------------------------------------------------
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [showPopup, setShowPopup] = useState(false); // สถานะการแสดง popup
  const [className, setClassName] = useState(""); // ชื่อคลาสที่กรอก
  const [loading, setLoading] = useState(false); // สถานะการโหลด
  const [error, setError] = useState<string | null>(null); // ข้อความแสดงข้อผิดพลาด
  const [classId, setClassId] = useState<string | null>(null); // ID ของคลาสที่สร้าง
  const { user, isSignedIn } = useUser(); // ข้อมูลผู้ใช้จาก Clerk



  // เพิ่มฟังก์ชันสำหรับจัดการเมื่อสแกน QR Code สำเร็จ
  const handleQRDetected = async (result: { data: string }) => {
    try {
      const url = new URL(result.data);
      const classId = url.pathname.split('/').pop();
      
      if (!classId || !user) {
        alert('ไม่สามารถเช็คชื่อได้ กรุณาลองใหม่');
        return;
      }
  
      setLoading(true);
      
      const classRef = doc(db, "classes", classId);
      const classDoc = await getDoc(classRef);
      
      if (classDoc.exists()) {
        const classData = classDoc.data();
        const checkedInMembers = classData.checkedInMembers || [];
        
        // ตรวจสอบว่าเคยเช็คชื่อแล้วหรือไม่
        if (checkedInMembers.includes(user.id)) {
          alert('คุณได้เช็คชื่อไปแล้ว!');
          return;
        }
  
        // อัพเดทเฉพาะเมื่อยังไม่เคยเช็คชื่อ
        await updateDoc(classRef, {
          checkedInMembers: arrayUnion(user.id),
          checkedInCount: checkedInMembers.length + 1, // ใช้จำนวนจริงจาก array
          lastCheckedIn: Timestamp.now()
        });
  
        alert('เช็คชื่อสำเร็จ!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('เกิดข้อผิดพลาดในการเช็คชื่อ');
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };


  useEffect(() => {
    let currentStream: MediaStream | null = null;

    if (scanning && videoRef.current && canvasRef.current) {
      // เปิดกล้อง
      openCamera(videoRef.current).then((stream) => {
        // เริ่มการสแกน QR Code
        const scanner = scanQRCode(
          videoRef.current!,
          canvasRef.current!,
          handleQRDetected,
          (error: any) => {
            console.error("เกิดข้อผิดพลาดในการสแกน:", error);
            alert(error);
          }
        );

        // Cleanup เมื่อปิดการสแกน
        return () => {
          if (scanner) {
            scanner.stop();
          }
          if (currentStream) {
            stopCamera(currentStream);
            currentStream = null;
          }
        };
      }).catch((error) => {
        console.error("ไม่สามารถเปิดกล้องได้:", error);
        alert("ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบการอนุญาตการใช้งานกล้อง");
        setScanning(false);
      });
      return () => {
        if (currentStream) {
          stopCamera(currentStream);
          currentStream = null;
        }
      };
    }
  }, [scanning]); // เพิ่ม scanning เป็น dependency
  // ฟังก์ชันสำหรับสร้างคลาสใหม่
  const handleCreateClass = async () => {
    // ตรวจสอบว่ากรอกชื่อคลาสหรือไม่
    if (!className.trim()) {
      setError("กรุณากรอกชื่อคลาสก่อน");
      return;
    }

    // ตรวจสอบว่าผู้ใช้ล็อกอินแล้วหรือไม่
    if (!isSignedIn || !user) {
      setError("คุณยังไม่ได้ล็อกอิน");
      return;
    }

    try {
      setLoading(true); // เริ่มโหลด
      setError(null); // ล้างข้อผิดพลาดก่อนหน้า

      // ดึงข้อมูลผู้ใช้
      const userId = user.id;
      const userEmail = user.primaryEmailAddress?.emailAddress || "";

      // สร้างคลาสใหม่ใน Firebase Firestore
      const docRef = await addDoc(collection(db, "classes"), {
        name: className.trim(), // ชื่อคลาส
        created_by: userId, // ผู้สร้าง
        created_at: Timestamp.fromDate(new Date()), // วันที่สร้าง
        members: [userId], // สมาชิกในคลาส
        memberCount: 1, // จำนวนสมาชิก
        checkedInCount: 0,  // เพิ่มฟิลด์นี้
        checkedInMembers: [], // เพิ่มฟิลด์นี้
        owner_email: userEmail, // อีเมลของเจ้าของคลาส
        last_updated: Timestamp.fromDate(new Date()), // วันที่อัปเดตล่าสุด
      });

      // setSuccess(true); // แสดงสถานะความสำเร็จ
      setClassName(""); // ล้างชื่อคลาส

    } catch (error) {
      console.error("Error details:", error);
      setError(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false); // จบการโหลด
    }
  };

  // // ฟังก์ชันสำหรับอัปโหลดไฟล์ CSV ข้อมูลนักเรียน
  // const handleUploadCSV = async (event: ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return; // ถ้าไม่มีไฟล์ให้หยุด

  //   // ตรวจสอบว่ามี classId หรือไม่
  //   if (!classId) {
  //     alert("กรุณาสร้างคลาสก่อนอัปโหลดนักเรียน");
  //     return;
  //   }

  //   const reader = new FileReader();
  //   reader.onload = async (e) => {
  //     const text = e.target?.result;
  //     if (typeof text !== "string") return;

  //     // แยกข้อมูลแต่ละบรรทัดใน CSV
  //     const lines = text.split("\n");
  //     for (const line of lines) {
  //       const [name, studentId, major] = line.trim().split(",");

  //       // ถ้ามีข้อมูลครบถ้วนให้บันทึกลง Firebase
  //       if (name && studentId && major) {
  //         await addDoc(collection(db, "students"), {
  //           name, // ชื่อนักเรียน
  //           studentId, // รหัสนักเรียน
  //           major, // สาขาวิชา
  //           classId, // ID ของคลาส
  //           createdAt: Timestamp.now(), // วันที่สร้าง
  //         });
  //       }
  //     }
  //     alert("อัปโหลดข้อมูลนักเรียนสำเร็จ!");
  //   };

  //   reader.readAsText(file); // อ่านไฟล์เป็นข้อความ
  // };

  // ฟังก์ชันสำหรับปิด popup สร้างคลาส
  const closePopup = () => {
    setShowPopup(false);
    setClassName("");
    setError(null);
    setScanning(false);
    // setSuccess(false);
  };



  return (
    <div className="">
      {/* ปุ่มต่างๆ ด้านบน */}
      <div className="h-0 md:flex md:flex-col md:-mx-34 md:-mt-15 max-md:mx-5 max-md:flex max-md:flex-row max-md:justify-center max-md:items-center max-md:gap-2 max-md:-mt-26 max-md:mb-26 max-md:h-0">
        {/* ปุ่มสแกน QR code */}
        <button
          className="w-20 h-auto border-purple-600 text-purple-600 py-1 rounded-2xl hover:bg-purple-100 md:mb-2 border md:ml-2"
          onClick={() => setScanning(true)}
        >
          Scan QR
        </button>
        {/* ปุ่มเพิ่มคลาส */}
        <button
          className="w-25 h-auto border border-purple-600 text-purple-600 py-1 rounded-2xl hover:bg-purple-100 "
          onClick={() => setShowPopup(true)}
        >
          Add a class
        </button>
      </div>

      {/* Popup สำหรับสร้างคลาสใหม่ */}
      {showPopup && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-lg p-6 relative max-w-2xl w-full  overflow-hidden">
            {/* วงกลมสีม่วงที่มุมขวาบน */}
            <div className="absolute -top-16 -right-16 w-35 h-35 bg-purple-500 rounded-full"></div>
            {/* ปุ่มปิด modal - วางไว้บนวงกลมสีม่วง */}
            <button
              onClick={closePopup}
              className="absolute top-2 right-2 z-10 text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            <div className="flex">
              {/* พื้นหลังสีม่วงโค้งมน */}
              <div className="absolute -bottom-50 right-120 w-100 h-100 bg-purple-500 rounded-full "></div>
              <div className="absolute -bottom-2">
                <Image
                  src="/assets/images/person.png"
                  width={150}
                  height={150}
                  alt="Student thinking"
                  className="object-contain relative z-10"
                />
              </div>
              {/* ส่วนขวา - ฟอร์มสำหรับกรอกข้อมูล */}
              <div className="w-1/2 p-8 flex flex-col justify-center ml-70">
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                  <h2 className="text-purple-700 font-bold text-xl mb-6 flex items-center gap-2">
                    <span>🏠</span> ชื่อคลาส
                  </h2>
                  {/* ป้ายกำกับ */}
                  <label className="block text-purple-600 text-sm mb-2">
                    ชื่อคลาส
                  </label>
                  {/* ช่องกรอกชื่อคลาส */}
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => {
                      setClassName(e.target.value);
                      setError(null); // ล้างข้อผิดพลาดเมื่อกรอกข้อมูลใหม่
                    }}
                    placeholder="ชื่อคลาส"
                    className="w-full border-2 border-purple-200 rounded-4xl px-4 py-3 mb-6 focus:outline-none focus:border-purple-400"
                  />
                  {/* แสดงข้อความแสดงข้อผิดพลาด */}
                  {error && (
                    <div className="text-red-500 mb-4 text-sm">{error}</div>
                  )}
                  {/* ปุ่มสร้างคลาส */}
                  <div className="p-5">
                    <button
                      onClick={handleCreateClass}
                      disabled={loading}
                      className="w-full bg-purple-500 text-white py-3 rounded-xl font-medium hover:bg-purple-600 transition-colors"
                    >
                      {loading ? "กำลังสร้าง..." : "สร้าง"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {scanning && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', maxWidth: '640px' }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            />
          </div>
          <button
            className="absolute top-2 right-1 text-purple-500 hover:text-purple-700"
            onClick={() => {
              setScanning(false);
              // ถ้ามี video stream อยู่ให้หยุดการทำงาน
              if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stopCamera(stream);
                videoRef.current.srcObject = null;
              }
            }}
          >
            <FaTimes size={40} />
          </button>
        </div>
      )}
    </div>
  )
}