import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    Animated,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { markAttendanceByQR, getActiveSession } from '@/services/attendanceService';
import Header from '@/components/header';

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

const QRScannerScreen = () => {
    const router = useRouter();
    const { classId } = useLocalSearchParams();
    const { sessionId } = useLocalSearchParams();
    const { user } = useAuth();

    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    
    // Animation for scanning line
    const scanLineAnimation = useState(new Animated.Value(0))[0];

    useEffect(() => {
        getCameraPermissions();
        startScanLineAnimation();
        console.log("Class ID: ", classId);
        console.log("Session ID: ", sessionId);
    }, []);

    const startScanLineAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnimation, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: false,
                }),
                Animated.timing(scanLineAnimation, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: false,
                }),
            ])
        ).start();
    };

    const getCameraPermissions = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
    };

    const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
        if (scanned || loading) return;

        setScanned(true);
        setLoading(true);

        try {
            if (!data.startsWith("STUDENT_ID:")) {
                throw new Error("Invalid QR code format.");
            }

            const studentId = data.replace("STUDENT_ID:", "").trim();
            if (!studentId) throw new Error("Invalid student ID in QR.");
            if (!classId || typeof classId !== "string") {
                throw new Error("Class not provided.");
            }

            await markAttendanceByQR(studentId, classId, sessionId as string);

            Alert.alert("Success ✅", "Attendance marked successfully.", [
                {
                    text: "OK",
                    onPress: () => {
                        setScanned(false);
                    },
                },
            ]);
        } catch (error: any) {
            let errorMessage = "Failed to mark attendance.";
            if (error instanceof Error) errorMessage = error.message;

            Alert.alert("Error ❌", errorMessage, [
                {
                    text: "Try Again",
                    onPress: () => {
                        setScanned(false);
                        setLoading(false);
                    },
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const toggleTorch = () => setTorchOn(!torchOn);
    const resetScanner = () => {
        setScanned(false);
        setLoading(false);
    };

    if (hasPermission === null) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-900">
                <View className="items-center">
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text className="text-white text-lg mt-4 font-medium">
                        Requesting camera permission...
                    </Text>
                </View>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-900">
                <View className="items-center px-6">
                    <MaterialIcons name="camera-alt" size={80} color="#6B7280" />
                    <Text className="text-white text-xl font-semibold mt-4">
                        Camera Access Required
                    </Text>
                    <Text className="text-gray-400 text-center mt-2">
                        Please enable camera permissions to scan QR codes
                    </Text>
                    <TouchableOpacity 
                        className="bg-blue-600 px-6 py-3 rounded-lg mt-6"
                        onPress={getCameraPermissions}
                    >
                        <Text className="text-white font-semibold">Enable Camera</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const scanLineTop = scanLineAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, SCAN_AREA_SIZE - 2],
    });

    return (
        <View className="flex-1 bg-black">
            <Header title="Scan QR Code" />
            
            {/* Camera View */}
            <View className="flex-1 relative">
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    enableTorch={torchOn}
                />

                {/* Overlay with scan area */}
                <View className="absolute inset-0 justify-center items-center">
                    {/* Top overlay */}
                    <View className="absolute top-0 left-0 right-0 bg-black/40" style={{ height: (height - SCAN_AREA_SIZE) / 2 }} />
                    
                    {/* Left overlay */}
                    <View className="absolute left-0 bg-black/40" style={{ 
                        top: (height - SCAN_AREA_SIZE) / 2,
                        width: (width - SCAN_AREA_SIZE) / 2,
                        height: SCAN_AREA_SIZE 
                    }} />
                    
                    {/* Right overlay */}
                    <View className="absolute right-0 bg-black/40" style={{ 
                        top: (height - SCAN_AREA_SIZE) / 2,
                        width: (width - SCAN_AREA_SIZE) / 2,
                        height: SCAN_AREA_SIZE 
                    }} />
                    
                    {/* Bottom overlay */}
                    <View className="absolute bottom-0 left-0 right-0 bg-black/40" style={{ height: (height - SCAN_AREA_SIZE) / 2 }} />
                    
                    {/* Scan Area - Centered */}
                    <View 
                        className="relative border-2 border-white/30 rounded-2xl"
                        style={{ width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE }}
                    >
                        {/* Corner indicators */}
                        <View className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-lg" />
                        <View className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-lg" />
                        <View className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-lg" />
                        <View className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-lg" />
                        
                        {/* Animated scan line */}
                        {!scanned && (
                            <Animated.View
                                className="absolute left-0 right-0 h-0.5 bg-blue-400 shadow-lg"
                                style={{ 
                                    top: scanLineTop,
                                    shadowColor: '#60A5FA',
                                    shadowOpacity: 0.8,
                                    shadowRadius: 4,
                                    elevation: 5
                                }}
                            />
                        )}
                    </View>
                </View>

                {/* Instructions */}
                <View className="absolute top-20 left-0 right-0 items-center px-6 z-10">
                    <View className="bg-white/90 px-6 py-3 rounded-full shadow-lg">
                        <Text className="text-gray-800 text-center font-medium">
                            📱 Position QR code within the frame
                        </Text>
                    </View>
                </View>

                {/* Status indicator */}
                {scanned && !loading && (
                    <View className="absolute top-32 left-0 right-0 items-center z-10">
                        <View className="bg-green-500 px-4 py-2 rounded-full flex-row items-center shadow-lg">
                            <MaterialIcons name="check-circle" size={20} color="white" />
                            <Text className="text-white ml-2 font-semibold">✅ QR Code Detected</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Loading overlay */}
            {loading && (
                <View className="absolute inset-0 bg-black/50 justify-center items-center z-20">
                    <View className="bg-white px-8 py-6 rounded-3xl items-center shadow-2xl">
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text className="text-gray-800 text-lg font-semibold mt-4">
                            ⏳ Marking attendance...
                        </Text>
                    </View>
                </View>
            )}

            {/* Bottom controls */}
            <View className="absolute bottom-0 left-0 right-0 z-10">
                <View className="bg-gradient-to-t from-white/95 to-transparent pt-8 pb-10">
                    <View className="flex-row justify-center items-center space-x-8 px-6">
                        {/* Reset button - only show when scanned */}
                        {scanned && (
                            <TouchableOpacity
                                className="w-16 h-16 bg-red-500 rounded-full justify-center items-center shadow-lg active:scale-95"
                                onPress={resetScanner}
                            >
                                <MaterialIcons name="refresh" size={32} color="white" />
                            </TouchableOpacity>
                        )}

                        {/* Torch button */}
                        <TouchableOpacity
                            className={`w-16 h-16 rounded-full justify-center items-center shadow-lg active:scale-95 ${
                                torchOn ? 'bg-yellow-500' : 'bg-gray-700'
                            }`}
                            onPress={toggleTorch}
                        >
                            <MaterialIcons
                                name={torchOn ? "flash-on" : "flash-off"}
                                size={32}
                                color="white"
                            />
                        </TouchableOpacity>

                        {/* Gallery button */}
                        <TouchableOpacity
                            className="w-16 h-16 bg-blue-500 rounded-full justify-center items-center shadow-lg active:scale-95"
                            onPress={() => {
                                Alert.alert("📷 Coming Soon", "Gallery QR selection will be available soon!");
                            }}
                        >
                            <MaterialIcons name="photo-library" size={32} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // Keep only the camera style that can't be replaced with Tailwind
});

export default QRScannerScreen;