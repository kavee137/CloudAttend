import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import {
    createAttendanceSession,
    getActiveSession,
    endAttendanceSession,
    getStudentsByClass,
    markAttendanceManually,
    getAttendanceRecords
} from '@/services/attendanceService';
import { getClassById } from '@/services/classService';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import StudentAttendanceList from '@/components/StudentAttendanceList';
import Header from '@/components/header';
import { AttendanceSession, AttendanceRecord, Student } from '@/types/attendance';
import { Class } from '@/types/class';

const AttendanceSessionScreen = () => {
    const router = useRouter();
    const { user } = useAuth();
    const { classId } = useLocalSearchParams();

    // State
    const [classData, setClassData] = useState<Class | null>(null);
    const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [sessionTimer, setSessionTimer] = useState<string>('00:00');

    useEffect(() => {
        if (classId) {
            loadClassData();
            checkActiveSession();
            loadStudents();
        }
    }, [classId]);

    // Timer effect
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (activeSession && activeSession.status === 'active') {
            interval = setInterval(() => {
                const now = new Date();
                const start = activeSession.startTime.toDate();
                const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
                const minutes = Math.floor(diff / 60);
                const seconds = diff % 60;
                setSessionTimer(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeSession]);

    const loadClassData = async () => {
        try {
            if (classId && typeof classId === 'string') {
                const classInfo = await getClassById(classId);
                setClassData(classInfo);
            }
        } catch (error) {
            console.error('Error loading class:', error);
            Alert.alert('Error', 'Failed to load class information');
        }
    };

    const checkActiveSession = async () => {
        try {
            if (classId && typeof classId === 'string') {
                const session = await getActiveSession(classId);
                setActiveSession(session);
            }
        } catch (error) {
            console.error('Error checking active session:', error);
        }
    };

    const loadStudents = async () => {
        try {
            if (classId && typeof classId === 'string') {
                const studentList = await getStudentsByClass(classId);
                setStudents(studentList);
            }
        } catch (error) {
            console.error('Error loading students:', error);
            Alert.alert('Error', 'Failed to load students');
        }
    };

    const handleStartSession = async () => {
        if (!classId || !user?.uid) return;

        try {
            setLoading(true);
            const session = await createAttendanceSession(
                classId as string,
                user.uid
            );
            setActiveSession(session);
            Alert.alert('Success', 'Attendance session started!');
        } catch (error) {
            console.error('Error starting session:', error);
            Alert.alert('Error', 'Failed to start attendance session');
        } finally {
            setLoading(false);
        }
    };

    const handleEndSession = async () => {
        if (!activeSession) return;

        Alert.alert(
            'End Session',
            'Are you sure you want to end this attendance session?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End Session',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await endAttendanceSession(activeSession.id);
                            setActiveSession(null);
                            Alert.alert('Success', 'Attendance session ended');
                        } catch (error) {
                            console.error('Error ending session:', error);
                            Alert.alert('Error', 'Failed to end session');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
        if (!activeSession) return;

        try {
            await markAttendanceManually(activeSession.id, studentId, status);
            // Refresh attendance records
            loadAttendanceRecords();
        } catch (error) {
            console.error('Error marking attendance:', error);
            Alert.alert('Error', 'Failed to mark attendance');
        }
    };

    const loadAttendanceRecords = async () => {
        if (!activeSession) return;

        try {
            // This would be implemented in the service
            const records = await getAttendanceRecords(activeSession.id);
            setAttendanceRecords(records);
        } catch (error) {
            console.error('Error loading attendance records:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            loadClassData(),
            checkActiveSession(),
            loadStudents()
        ]);
        setRefreshing(false);
    };

    const handleViewHistory = () => {
        // router.push({
        //     pathname: "/(dashboard)/attendance/history/[classId]",
        //     params: { classId: classId },
        // })
    }

    if (!classData) {
        return (
            <View className="flex-1 bg-gray-50 justify-center items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-4 text-gray-600">Loading class information...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50 pb-32">
            <Header
                title="Attendance Session"
            />

            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View className="px-4 py-6">
                    {/* Session Status Card */}
                    <View className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                        <View className="flex-row items-center justify-between mb-4">
                            <View>
                                <Text className="text-xl font-bold text-gray-900">Session Status</Text>
                                <Text className="text-sm text-gray-600">
                                    {new Date().toLocaleDateString()}
                                </Text>
                            </View>

                            {activeSession ? (
                                <View className="bg-green-100 rounded-full px-4 py-2">
                                    <Text className="text-green-700 font-semibold">Active</Text>
                                </View>
                            ) : (
                                <View className="bg-gray-100 rounded-full px-4 py-2">
                                    <Text className="text-gray-700 font-semibold">Inactive</Text>
                                </View>
                            )}
                        </View>

                        {activeSession && (
                            <View className="bg-blue-50 rounded-xl p-4 mb-4">
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-blue-700 font-medium">Session Duration</Text>
                                    <Text className="text-blue-900 font-bold text-lg">{sessionTimer}</Text>
                                </View>
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View className="flex-row gap-3">
                            {!activeSession ? (
                                <TouchableOpacity
                                    onPress={handleStartSession}
                                    disabled={loading}
                                    className="flex-1 bg-blue-500 rounded-xl py-4 flex-row items-center justify-center"
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <>
                                            <MaterialIcons name="play-arrow" size={20} color="white" />
                                            <Text className="text-white font-semibold ml-2">Start Session</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        onPress={handleEndSession}
                                        disabled={loading}
                                        className="flex-1 bg-red-500 rounded-xl py-4 flex-row items-center justify-center"
                                    >
                                        {loading ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <>
                                                <MaterialIcons name="stop" size={20} color="white" />
                                                <Text className="text-white font-semibold ml-2">End Session</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <View className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Quick Actions</Text>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={handleViewHistory}
                                className="flex-1 border border-gray-200 rounded-xl py-4 flex-row items-center justify-center"
                            >
                                <MaterialIcons name="history" size={20} color="#6B7280" />
                                <Text className="text-gray-700 font-medium ml-2">View History</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push({
                                    pathname: "/(dashboard)/attendance/session/scanner",
                                    params: { classId: classId, sessionId: activeSession?.id },
                                })}
                                disabled={!activeSession}
                                className={`flex-1 rounded-xl py-4 flex-row items-center justify-center ${activeSession
                                    ? 'bg-purple-500'
                                    : 'bg-gray-200'
                                    }`}
                            >
                                <MaterialIcons
                                    name="camera-alt"
                                    size={20}
                                    color={activeSession ? "white" : "#9CA3AF"}
                                />
                                <Text className={`font-medium ml-2 ${activeSession ? 'text-white' : 'text-gray-500'
                                    }`}>
                                    Scan QR
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Student List */}
                    <View className="bg-white rounded-2xl shadow-sm p-6">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-lg font-bold text-gray-900">Students</Text>
                            <Text className="text-sm text-gray-600">
                                {students.length} enrolled
                            </Text>
                        </View>

                        <StudentAttendanceList
                            students={students}
                            attendanceRecords={attendanceRecords}
                            onMarkAttendance={handleMarkAttendance}
                            sessionActive={!!activeSession}
                        />
                    </View>
                </View>
            </ScrollView>


        </View>
    );
};

export default AttendanceSessionScreen;