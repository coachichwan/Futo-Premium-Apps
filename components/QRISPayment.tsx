import React, { useState, useEffect } from 'react';
import { QRISPayment as QRISPaymentType, PaymentStatus } from '../types';

interface QRISPaymentProps {
  orderId: string;
  amount: number;
  customerName: string;
  onComplete: (payment: QRISPaymentType) => void;
  onCancel: () => void;
}

const QRISPayment: React.FC<QRISPaymentProps> = ({
  orderId,
  amount,
  customerName,
  onComplete,
  onCancel,
}) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [timeLeft, setTimeLeft] = useState(300);
  const [qrCodeData, setQrCodeData] = useState<string>('');

  useEffect(() => {
    generateQRCode();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      setPaymentStatus(PaymentStatus.EXPIRED);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const generateQRCode = () => {
    const qrData = `00020101021226670016ID.CO.QRIS.WWW0118${orderId}020352045303360540${amount}5802ID5915FUTO DIGITAL6007JAKARTA61051234062070703A0163044C3F`;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300;
    const blockSize = 10;
    const blocks = size / blockSize;
    
    canvas.width = size;
    canvas.height = size;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = '#000000';
    for (let i = 0; i < blocks; i++) {
      for (let j = 0; j < blocks; j++) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i * blockSize, j * blockSize, blockSize, blockSize);
        }
      }
    }
    
    const padding = 3;
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === padding || j === padding || i === 0 || j === 0 || i === 6 || j === 6) {
          ctx.fillRect(i * blockSize, j * blockSize, blockSize, blockSize);
          ctx.fillRect((blocks - 7 + i) * blockSize, j * blockSize, blockSize, blockSize);
          ctx.fillRect(i * blockSize, (blocks - 7 + j) * blockSize, blockSize, blockSize);
        }
      }
    }
    
    setQrCodeData(canvas.toDataURL());
  };

  const handleConfirmPayment = () => {
    const payment: QRISPaymentType = {
      id: `QRIS-${Date.now()}`,
      orderId,
      amount,
      status: PaymentStatus.PAID,
      qrCode: qrCodeData,
      merchantName: 'FUTO DIGITAL',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      paidAt: new Date().toISOString(),
    };
    
    setPaymentStatus(PaymentStatus.PAID);
    setTimeout(() => {
      onComplete(payment);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Pembayaran QRIS</h2>
          <p className="text-gray-600">Scan QR Code untuk melanjutkan pembayaran</p>
        </div>

        {paymentStatus === PaymentStatus.EXPIRED ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">⏰</div>
            <h3 className="text-xl font-bold text-red-600 mb-2">Pembayaran Kadaluarsa</h3>
            <p className="text-gray-600 mb-6">Waktu pembayaran telah habis. Silakan buat pesanan baru.</p>
            <button
              onClick={onCancel}
              className="w-full py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              Kembali
            </button>
          </div>
        ) : paymentStatus === PaymentStatus.PAID ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-green-600 mb-2">Pembayaran Berhasil!</h3>
            <p className="text-gray-600">Terima kasih atas pembayaran Anda</p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 mb-6 text-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Total Pembayaran</p>
                  <p className="text-3xl font-bold">Rp {amount.toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm mb-1">Waktu Tersisa</p>
                  <p className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-300' : ''}`}>
                    {formatTime(timeLeft)}
                  </p>
                </div>
              </div>
              <div className="border-t border-blue-400 pt-3">
                <p className="text-blue-100 text-sm">Order ID</p>
                <p className="font-mono text-sm">{orderId}</p>
              </div>
            </div>

            <div className="bg-white border-4 border-gray-200 rounded-2xl p-6 mb-6">
              {qrCodeData ? (
                <img src={qrCodeData} alt="QR Code" className="w-full h-auto" />
              ) : (
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Generating QR Code...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">📱 Cara Pembayaran:</h4>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold">1.</span>
                  <span>Buka aplikasi mobile banking atau e-wallet Anda</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">2.</span>
                  <span>Pilih menu Scan QR atau QRIS</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">3.</span>
                  <span>Scan QR Code di atas</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">4.</span>
                  <span>Konfirmasi pembayaran di aplikasi Anda</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">5.</span>
                  <span>Klik tombol "Konfirmasi Pembayaran" di bawah</span>
                </li>
              </ol>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Pelanggan: <span className="font-semibold">{customerName}</span></p>
              <p className="text-xs text-gray-500">QRIS mendukung semua bank dan e-wallet di Indonesia</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleConfirmPayment}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg"
              >
                ✓ Konfirmasi Pembayaran
              </button>
              
              <button
                onClick={onCancel}
                className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Batalkan
              </button>
            </div>

            <p className="text-xs text-center text-gray-500 mt-4">
              ⚠️ Jangan refresh halaman ini selama proses pembayaran
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default QRISPayment;
