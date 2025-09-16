import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { markAttendanceByQR } from '@/services/attendanceService';
import Header from '@/components/header';
import * as Location from 'expo-location';

const QRScannerScreen = () => {
    const router = useRouter();
    const { user } = useAuth();

    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const [locationPermission, setLocationPermission] = useState<boolean>(false);

    useEffect(() => {
        getCameraPermissions();
        getLocationPermissions();
    }, []);

    const getCameraPermissions = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
    };

    const getLocationPermissions = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(status === 'granted');
        } catch (error) {
            console.error('Error getting location permission:', error);
        }
    };

    const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | undefined> => {
        if (!locationPermission) return undefined;

        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 5000,
            });
            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
        } catch (error) {
            console.error('Error getting location:', error);
            return undefined;
        }
    };

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (scanned || loading) return;

        setScanned(true);
        setLoading(true);

        try {
            // Validate QR data format
            let qrData;
            try {
                qrData = JSON.parse(data);
            } catch (error) {
                throw new Error('Invalid QR code format');
            }

            // Check if it's an attendance QR code
            if (!qrData.sessionId || !qrData.classId || qrData.type !== 'attendance') {
                throw new Error('This is not a valid attendance QR code');
            }

            // Get current location if permission granted
            const location = await getCurrentLocation();

            // Mark attendance
            if (!user?.uid) {
                throw new Error('User not authenticated');
            }

            await markAttendanceByQR(data, user.uid, location);

            Alert.alert(
                'Success! ✅',
                'Your attendance has been marked successfully.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error: any) {
            console.error('QR Scan Error:', error);

            let errorMessage = 'Failed to mark attendance. Please try again.';

            if (error.message.includes('expired')) {
                errorMessage = 'QR code has expired. Please ask your teacher for a new one.';
            } else if (error.message.includes('already marked')) {
                errorMessage = 'You have already marked attendance for this session.';
            } else if (error.message.includes('not enrolled')) {
                errorMessage = 'You are not enrolled in this class.';
            } else if (error.message.includes('not active')) {
                errorMessage = 'This attendance session is no longer active.';
            } else if (error.message.includes('Invalid QR')) {
                errorMessage = 'Invalid QR code. Please scan the correct attendance QR code.';
            }

            Alert.alert(
                'Error ❌',
                errorMessage,
                [
                    {
                        text: 'Try Again',
                        onPress: () => {
                            setScanned(false);
                            setLoading(false);
                        },
                    },
                    {
                        text: 'Go Back',
                        style: 'cancel',
                        onPress: () => router.back(),
                    },
                ]
            );
        }

        setLoading(false);
    };

    const toggleTorch = () => {
        setTorchOn(!torchOn);
    };

    const resetScanner = () => {
        setScanned(false);
        setLoading(false);
    };

    if (hasPermission === null) {
        return (
            <View className="flex-1 bg-gray-50 justify-center items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-4 text-gray-600">Requesting camera permission...</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View className="flex-1 bg-gray-50">
                <Header title="QR Scanner" />
                <View className="flex-1 justify-center items-center px-6">
                    <View className="bg-red-100 rounded-full p-6 mb-6">
                        <MaterialIcons name="camera-alt" size={48} color="#EF4444" />
                    </View>
                    <Text className="text-xl font-bold text-gray-900 mb-4 text-center">
                        Camera Permission Required
                    </Text>
                    <Text className="text-gray-600 text-center mb-8">
                        We need access to your camera to scan QR codes for attendance marking.
                    </Text>
                    <TouchableOpacity
                        onPress={getCameraPermissions}
                        className="bg-blue-500 rounded-xl px-8 py-4"
                    >
                        <Text className="text-white font-semibold">Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <Header
                title="Scan QR Code"
            />

            <View className="flex-1">
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    enableTorch={torchOn}
                >
                    {/* Scanning overlay */}
                    <View className="flex-1 relative">
                        {/* Dark overlay */}
                        <View className="absolute inset-0 bg-black/50" />

                        {/* Center scanning area */}
                        <View className="flex-1 justify-center items-center">
                            <View className="relative">
                                {/* Scanning frame */}
                                <View className="w-64 h-64 border-2 border-white rounded-2xl bg-transparent">
                                    {/* Corner indicators */}
                                    <View className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-blue-400 rounded-tl-lg" />
                                    <View className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-blue-400 rounded-tr-lg" />
                                    <View className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-blue-400 rounded-bl-lg" />
                                    <View className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-blue-400 rounded-br-lg" />

                                    {/* Scanning line animation could go here */}
                                    {!scanned && !loading && (
                                        <View className="absolute inset-0 justify-center items-center">
                                            <View className="w-full h-1 bg-blue-400 opacity-80" />
                                        </View>
                                    )}
                                </View>

                                {/* Loading indicator */}
                                {loading && (
                                    <View className="absolute inset-0 justify-center items-center bg-black/50 rounded-2xl">
                                        <ActivityIndicator size="large" color="#3B82F6" />
                                        <Text className="text-white mt-4 font-medium">Processing...</Text>
                                    </View>
                                )}
                            </View>

                            {/* Instructions */}
                            <View className="mt-8 px-6">
                                <Text className="text-white text-lg font-semibold text-center mb-2">
                                    {loading ? 'Processing QR Code...' : 'Position the QR code within the frame'}
                                </Text>
                                <Text className="text-gray-300 text-center">
                                    Make sure the QR code is clearly visible and well-lit
                                </Text>
                            </View>
                        </View>

                        {/* Control buttons */}
                        <View className="absolute bottom-12 left-0 right-0 flex-row justify-center items-center space-x-8">
                            {/* Torch toggle */}
                            <TouchableOpacity
                                onPress={toggleTorch}
                                disabled={loading}
                                className={`w-16 h-16 rounded-full justify-center items-center ${torchOn ? 'bg-yellow-500' : 'bg-white/20'
                                    }`}
                            >
                                <MaterialIcons
                                    name={torchOn ? "flash-on" : "flash-off"}
                                    size={28}
                                    color="white"
                                />
                            </TouchableOpacity>

                            {/* Reset button (only show if scanned but failed) */}
                            {scanned && !loading && (
                                <TouchableOpacity
                                    onPress={resetScanner}
                                    className="w-16 h-16 bg-white/20 rounded-full justify-center items-center"
                                >
                                    <MaterialIcons name="refresh" size={28} color="white" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </CameraView>
            </View>

            {/* Status bar */}
            <View className="absolute top-20 left-4 right-4">
                <View className="bg-black/50 rounded-xl px-4 py-3">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <View className={`w-3 h-3 rounded-full mr-3 ${scanned ? 'bg-yellow-400' : 'bg-green-400'
                                }`} />
                            <Text className="text-white font-medium">
                                {loading ? 'Processing...' : scanned ? 'Scanned' : 'Ready to scan'}
                            </Text>
                        </View>

                        {!locationPermission && (
                            <View className="flex-row items-center">
                                <MaterialIcons name="location-off" size={16} color="#FEF3C7" />
                                <Text className="text-yellow-200 text-xs ml-1">No location</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
};

export default QRScannerScreen;