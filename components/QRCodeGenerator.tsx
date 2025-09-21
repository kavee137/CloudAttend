import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { refreshQRCode } from '@/services/attendanceService';

interface QRCodeGeneratorProps {
  sessionId: string;
  classId: string;
  onExpired?: () => void;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  sessionId,
  classId,
  onExpired
}) => {
  const [qrData, setQrData] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes in seconds
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Generate initial QR data
    generateQRData();
  }, [sessionId, classId]);

  useEffect(() => {
    // Countdown timer
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      // QR code expired
      if (onExpired) {
        onExpired();
      }
      Alert.alert(
        'QR Code Expired',
        'The QR code has expired. Please generate a new one.',
        [{ text: 'OK' }]
      );
    }
  }, [timeLeft, onExpired]);

  const generateQRData = () => {
    const timestamp = Date.now();
    const data = JSON.stringify({
      sessionId,
      classId,
      timestamp,
      type: 'attendance'
    });
    setQrData(data);
    setTimeLeft(600); // Reset to 10 minutes
  };

  const handleRefreshQR = async () => {
    try {
      setRefreshing(true);
      const newQRData = await refreshQRCode(sessionId);
      setQrData(newQRData);
      setTimeLeft(600); // Reset timer
    } catch (error) {
      console.error('Error refreshing QR code:', error);
      Alert.alert('Error', 'Failed to refresh QR code. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    if (timeLeft > 300) return 'text-green-600'; // > 5 minutes
    if (timeLeft > 120) return 'text-yellow-600'; // > 2 minutes
    return 'text-red-600'; // < 2 minutes
  };

  if (!qrData) {
    return (
      <View className="items-center py-8">
        <Text className="text-gray-600">Generating QR code...</Text>
      </View>
    );
  }

  return (
    <View className="items-center">
      {/* QR Code */}
      <View className="bg-white p-6 rounded-2xl shadow-sm mb-6">
        <QRCode
          value={qrData}
          size={200}
          color="#000000"
          backgroundColor="#FFFFFF"
          logoSize={30}
          logoMargin={2}
          logoBorderRadius={15}
        />
      </View>

      {/* Timer */}
      <View className="bg-gray-100 rounded-xl px-4 py-3 mb-4">
        <View className="flex-row items-center justify-center">
          <MaterialIcons name="timer" size={20} color="#6B7280" />
          <Text className="text-gray-700 font-medium ml-2 mr-3">
            Expires in:
          </Text>
          <Text className={`text-lg font-bold ${getTimerColor()}`}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      {/* Status indicators */}
      <View className="flex-row items-center mb-6">
        <View className="flex-row items-center mr-6">
          <View className={`w-3 h-3 rounded-full mr-2 ${
            timeLeft > 120 ? 'bg-green-400' : 'bg-red-400'
          }`} />
          <Text className={`text-sm font-medium ${
            timeLeft > 120 ? 'text-green-700' : 'text-red-700'
          }`}>
            {timeLeft > 120 ? 'Active' : 'Expiring Soon'}
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <MaterialIcons name="qr-code" size={16} color="#6B7280" />
          <Text className="text-gray-600 text-sm ml-1">
            Session QR
          </Text>
        </View>
      </View>

      {/* Refresh button */}
      <TouchableOpacity
        onPress={handleRefreshQR}
        disabled={refreshing}
        className="bg-blue-500 rounded-xl px-6 py-3 flex-row items-center"
      >
        <MaterialIcons 
          name={refreshing ? "hourglass-empty" : "refresh"} 
          size={20} 
          color="white" 
        />
        <Text className="text-white font-semibold ml-2">
          {refreshing ? 'Refreshing...' : 'Generate New QR'}
        </Text>
      </TouchableOpacity>

      {/* Instructions */}
      <View className="mt-6 px-4">
        <Text className="text-center text-gray-600 text-sm leading-5">
          Students should scan this QR code to mark their attendance. 
          The QR code refreshes every 10 minutes for security.
        </Text>
      </View>

      {/* Warning for low time */}
      {timeLeft < 120 && (
        <View className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <View className="flex-row items-center">
            <MaterialIcons name="warning" size={20} color="#DC2626" />
            <Text className="text-red-700 font-medium ml-2">
              QR code expiring soon!
            </Text>
          </View>
          <Text className="text-red-600 text-sm mt-1">
            Generate a new QR code to continue accepting attendance.
          </Text>
        </View>
      )}
    </View>
  );
};

export default QRCodeGenerator;