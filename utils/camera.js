// ติดตั้ง dependencies ก่อน:
// npm install jsqr

import jsQR from 'jsqr';

export async function openCamera(videoElement) {
  try {
    // ตรวจสอบว่า mediaDevices สามารถใช้งานได้
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('เบราว์เซอร์ของคุณไม่รองรับการใช้งานกล้อง');
    }

    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'environment' // ใช้กล้องหลังสำหรับมือถือ
      }
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    if (videoElement) {
      videoElement.srcObject = stream;
      try {
        await videoElement.play();
      } catch (playError) {
        console.error("ไม่สามารถเล่นวิดีโอได้:", playError);
        throw playError;
      }
    }
    return stream;
  } catch (err) {
    console.error("ไม่สามารถเปิดกล้องได้:", err);
    if (err.name === 'NotAllowedError') {
      throw new Error('กรุณาอนุญาตการใช้งานกล้อง');
    } else if (err.name === 'NotFoundError') {
      throw new Error('ไม่พบกล้องในอุปกรณ์ของคุณ');
    } else {
      throw new Error(`เกิดข้อผิดพลาดในการเปิดกล้อง: ${err.message}`);
    }
  }
}

export function scanQRCode(videoElement, canvasElement, onQRDetected, onError) {
  if (!videoElement || !canvasElement) {
    onError('ไม่พบ video หรือ canvas element');
    return null;
  }

  const canvas = canvasElement;
  const context = canvas.getContext('2d');
  let scanning = true;
  let animationId = null;

  function tick() {
    if (!scanning) return;

    if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
      // ตั้งค่าขนาด canvas ให้ตรงกับ video
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // วาด video frame ลงบน canvas
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // ดึงข้อมูล image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // สแกน QR Code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        // วาดกรอบรอบ QR Code
        drawQRBorder(context, code.location);
        
        // เรียก callback เมื่อพบ QR Code
        onQRDetected({
          data: code.data,
          location: code.location
        });
      }
    }

    animationId = requestAnimationFrame(tick);
  }

  // เริ่มสแกน
  tick();

  // ฟังชั่นหยุดการสแกน
  return {
    stop: () => {
      scanning = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    }
  };
}

function drawQRBorder(context, location) {
  const { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner } = location;
  
  context.beginPath();
  context.moveTo(topLeftCorner.x, topLeftCorner.y);
  context.lineTo(topRightCorner.x, topRightCorner.y);
  context.lineTo(bottomRightCorner.x, bottomRightCorner.y);
  context.lineTo(bottomLeftCorner.x, bottomLeftCorner.y);
  context.lineTo(topLeftCorner.x, topLeftCorner.y);
  context.closePath();
  
  context.lineWidth = 4;
  context.strokeStyle = '#00ff00';
  context.stroke();
}

export function stopCamera(stream) {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }
}

// Hook สำหรับใช้ใน React Component
export function useQRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const streamRef = useRef(null);

  const startScanning = async (videoElement, canvasElement) => {
    try {
      setError(null);
      setIsScanning(true);
      
      // เปิดกล้อง
      const stream = await openCamera(videoElement);
      streamRef.current = stream;

      // เริ่มสแกน QR Code
      scannerRef.current = scanQRCode(
        videoElement, 
        canvasElement,
        (result) => {
          setQrData(result);
        },
        (err) => {
          setError(err);
        }
      );
    } catch (err) {
      setError(err.message);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current = null;
    }
    
    if (streamRef.current) {
      stopCamera(streamRef.current);
      streamRef.current = null;
    }
    
    setIsScanning(false);
  };

  return {
    isScanning,
    qrData,
    error,
    startScanning,
    stopScanning
  };
}