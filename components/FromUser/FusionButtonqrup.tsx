// src/components/CreateQRCodeAndUpload.tsx
import { db } from '@/lib/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import React, { ChangeEvent, useState } from 'react';
import QRCode from 'react-qr-code';

// กำหนด props สำหรับ component
interface CreateQRCodeAndUploadProps {
    classId: string; // ID ของคลาสเรียน
}

const CreateQRCodeAndUpload: React.FC<CreateQRCodeAndUploadProps> = ({ classId }) => {
    // state สำหรับเก็บค่า QR code และสถานะการแสดง modal
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);

    // ฟังก์ชันสำหรับสร้าง QR Code
    const handleCreateQR = () => {
        // สร้าง link สำหรับ QR code โดยใช้ classId
        const qrLink = `https://your-app-url/class/${classId}`;
        setQrCode(qrLink);
        setShowQRModal(true); // แสดง modal QR code
    };

    // ฟังก์ชันสำหรับปิด modal QR code
    const handleCloseQR = () => {
        setShowQRModal(false);
    };

    // ฟังก์ชันสำหรับอัปโหลดไฟล์ CSV และบันทึกข้อมูลนักเรียนลง Firebase
    const handleUploadCSV = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return; // ถ้าไม่มีไฟล์ให้หยุดทำงาน

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result;
            if (typeof text !== 'string') return; // ตรวจสอบว่าข้อมูลเป็น string

            // แยกข้อมูลแต่ละบรรทัด
            const lines = text.split('\n');
            
            // วนลูปผ่านแต่ละบรรทัดเพื่อดึงข้อมูลนักเรียน
            for (const line of lines) {
                const [name, studentId, major] = line.trim().split(',');

                // ตรวจสอบว่ามีข้อมูลครบถ้วน
                if (name && studentId && major) {
                    // บันทึกข้อมูลนักเรียนลง Firestore
                    await addDoc(collection(db, 'students'), {
                        name,        // ชื่อนักเรียน
                        studentId,   // รหัสนักเรียน
                        major,       // สาขาวิชา
                        classId,     // ID ของคลาสเรียน
                        createdAt: Timestamp.now(), // เวลาที่สร้างข้อมูล
                    });
                }
            }
            alert('อัปโหลดข้อมูลนักเรียนสำเร็จ!');
        };

        reader.readAsText(file); // อ่านไฟล์เป็น text
    };

    return (
        <div className="">
            {/* ปุ่มสร้าง QR Code */}
            <div className="h-0 md:flex md:flex-col md:-mx-34 md:-mt-60 max-md:mx-5 max-md:flex max-md:flex-row max-md:justify-center max-md:items-center max-md:gap-2 max-md:-mt-70 max-md:mb-26 max-md:h-0">
                <button
                   className="w-20 h-auto border-purple-600 text-purple-600 py-1 rounded-2xl hover:bg-purple-100 md:mb-2 border md:ml-2"
                    onClick={handleCreateQR}
                >
                    Create QR
                </button>

                   {/* ปุ่มอัปโหลด CSV */}
                   <button
                        onClick={() => document.getElementById('csv-upload')?.click()}
                        className="w-25 h-auto border border-purple-600 text-purple-600 py-1 rounded-2xl hover:bg-purple-100 "
                    >
                        Upload CSV
                    </button>
            </div>

            {/* Modal สำหรับแสดง QR Code */}
            {showQRModal && qrCode && (
                <div className="fixed inset-0 flex items-center justify-center ">
                    {/* พื้นหลังสีเทาโปร่งใส */}
                    <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}></div>
                    
                    {/* กล่อง modal */}
                    <div className="relative bg-white rounded-4xl p-12 w-250 h-150 mx-4 shadow-lg overflow-hidden">
                        {/* วงกลมสีม่วงที่มุมขวาบน */}
                        <div className="absolute -top-16 -right-16 w-40 h-40 bg-purple-500 rounded-full"></div>
                        
                        {/* ปุ่มปิด modal - วางไว้บนวงกลมสีม่วง */}
                        <button
                            onClick={handleCloseQR}
                            className="absolute top-2 right-2 z-10 text-white hover:text-gray-200 transition-colors"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                        
                        {/* ส่วนแสดง QR Code */}
                        <div className="flex items-center justify-center p-25">
                            <QRCode value={qrCode} size={280} />
                        </div>
                    </div>
                </div>
            )}

            {/* ส่วนอัปโหลดไฟล์ CSV */}
            <div>
                <div className="h-0 w-0">
                 
                </div>
                {/* input file ที่ซ่อนไว้ */}
                <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleUploadCSV}
                    className="hidden"
                />
            </div>
        </div>
    );
};

export default CreateQRCodeAndUpload;