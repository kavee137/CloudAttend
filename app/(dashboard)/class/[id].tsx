import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { registerClassInFirestore, updateClass, getClassById } from '@/services/classService';
import { getTeacher } from '@/services/teacherService';
import Header from '@/components/header';
import { useInstitute } from '@/context/InstituteContext';
import { Class } from '@/types/class';
import { Teacher } from '@/types/teacher';


const AddEditClass = () => {
    const router = useRouter();
    const { user } = useAuth();
    const { institute } = useInstitute();
    const { id, teacherId } = useLocalSearchParams<{ id?: string; teacherId?: string }>();

    const isNew = !id || id === 'new';
    const currentTeacherId = teacherId || '';

    // State management
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [teacherLoading, setTeacherLoading] = useState(false);

    // Load teacher info
    useEffect(() => {
        if (currentTeacherId) {
            loadTeacher(currentTeacherId);
        }
    }, [currentTeacherId]);

    // Load class data if editing
    useEffect(() => {
        if (!isNew && id) {
            loadClass();
        }
    }, [id, isNew]);

    const loadTeacher = async (teacherId: string) => {
        try {
            setTeacherLoading(true);
            const teacherData = await getTeacher(teacherId); // Teacher | null
            setTeacher(teacherData as Teacher);
        } catch (error) {
            console.error("Error loading teacher:", error);
            Alert.alert("Error", "Failed to load teacher information");
        } finally {
            setTeacherLoading(false);
        }
    };


    const loadClass = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const classData = await getClassById(id as string);
            if (classData) {
                setName(classData.name || '');
                if (classData.teacherId && !teacher) {
                    await loadTeacher(classData.teacherId);
                }
            }
        } catch (error) {
            console.error('Error loading class:', error);
            Alert.alert('Error', 'Failed to load class data');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        if (!name.trim()) {
            Alert.alert('Validation Error', 'Please enter a class name');
            return false;
        }
        if (!currentTeacherId && !teacher?.id) {
            Alert.alert('Validation Error', 'Teacher information is missing');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        if (!user?.uid) {
            Alert.alert('Error', 'No institute found for this user');
            return;
        }

        const finalTeacherId = currentTeacherId || teacher?.id || '';
        const classData: Class = {
            name: name.trim(),
            teacherId: finalTeacherId,
            instituteId: user.uid,
            status: 'active'
        };

        try {
            setLoading(true);

            if (isNew) {
                const result = await registerClassInFirestore(classData);
                if (result.success) {
                    Alert.alert('Success', 'Class added successfully', [
                        { text: 'OK', onPress: () => router.back() }
                    ]);
                } else {
                    throw new Error(result.error);
                }
            } else {
                await updateClass(id as string, classData);
                Alert.alert('Success', 'Class updated successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (error) {
            console.error('Error saving class:', error);
            Alert.alert('Error', `Failed to ${isNew ? 'add' : 'update'} class`);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        Alert.alert(
            'Reset Form',
            'Are you sure you want to clear all fields?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', onPress: () => setName('') }
            ]
        );
    };

    if (loading && !isNew) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-600 mt-4">Loading class data...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Header title={isNew ? 'Add New Class' : 'Edit Class'} />

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="px-4 py-6">
                        {/* Teacher Info Card */}
                        <View className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                            <View className="flex-row items-center mb-4">
                                <View className="bg-blue-100 rounded-full p-3 mr-3">
                                    <MaterialIcons name="person" size={24} color="#3B82F6" />
                                </View>
                                <View>
                                    <Text className="text-lg font-bold text-gray-900">Teacher Information</Text>
                                    <Text className="text-sm text-gray-600">Class will be assigned to this teacher</Text>
                                </View>
                            </View>

                            {teacherLoading ? (
                                <View className="py-4 items-center">
                                    <ActivityIndicator size="small" color="#3B82F6" />
                                    <Text className="text-gray-600 mt-2">Loading teacher info...</Text>
                                </View>
                            ) : teacher ? (
                                <View className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                    <Text className="text-base font-semibold text-blue-900 mb-1">{teacher.name}</Text>
                                    
                                    {teacher.email && (
                                        <Text className="text-sm text-blue-600">Email: {teacher.email}</Text>
                                    )}
                                </View>
                            ) : (
                                <View className="bg-red-50 rounded-xl p-4 border border-red-200">
                                    <Text className="text-red-700 font-medium">Teacher information not available</Text>
                                </View>
                            )}
                        </View>

                        {/* Class Form Card */}
                        <View className="bg-white rounded-2xl shadow-sm p-6">
                            <View className="flex-row items-center mb-6">
                                <View className="bg-green-100 rounded-full p-3 mr-3">
                                    <MaterialIcons name="school" size={24} color="#10B981" />
                                </View>
                                <View>
                                    <Text className="text-lg font-bold text-gray-900">Class Details</Text>
                                    <Text className="text-sm text-gray-600">Enter the class information</Text>
                                </View>
                            </View>

                            {/* Class Name Field */}
                            <View className="mb-6">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">
                                    Class Name <Text className="text-red-500">*</Text>
                                </Text>
                                <View className="relative">
                                    <View className="absolute left-4 top-4 z-10">
                                        <MaterialIcons name="class" size={20} color="#9CA3AF" />
                                    </View>
                                    <TextInput
                                        className="bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-gray-800 text-base"
                                        placeholder="Enter class name (e.g., Grade 10A, Math Advanced)"
                                        placeholderTextColor="#9CA3AF"
                                        value={name}
                                        onChangeText={setName}
                                        autoCapitalize="words"
                                        maxLength={50}
                                    />
                                </View>
                                <Text className="text-xs text-gray-500 mt-1">
                                    Choose a descriptive name for your class
                                </Text>
                            </View>

                            {/* Character Counter */}
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-sm text-gray-600">Character count:</Text>
                                <Text className={`text-sm font-medium ${name.length > 40 ? 'text-orange-600' : 'text-gray-600'
                                    }`}>
                                    {name.length}/50
                                </Text>
                            </View>

                            {/* Action Buttons */}
                            <View className="flex-row space-x-3">
                                <TouchableOpacity
                                    onPress={handleReset}
                                    className="flex-1 bg-gray-100 rounded-xl py-4 flex-row items-center justify-center"
                                    disabled={loading}
                                >
                                    <MaterialIcons name="refresh" color="#6B7280" size={20} />
                                    <Text className="text-gray-600 font-semibold ml-2">Reset</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    disabled={loading || !name.trim()}
                                    className={`flex-1 rounded-xl py-4 flex-row items-center justify-center ${loading || !name.trim()
                                        ? 'bg-gray-400'
                                        : 'bg-blue-500'
                                        }`}
                                >
                                    {loading ? (
                                        <>
                                            <ActivityIndicator color="white" size="small" />
                                            <Text className="text-white font-semibold ml-2">
                                                {isNew ? 'Adding...' : 'Updating...'}
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            <MaterialIcons
                                                name={isNew ? 'add' : 'check'}
                                                color="white"
                                                size={20}
                                            />
                                            <Text className="text-white font-semibold ml-2">
                                                {isNew ? 'Add Class' : 'Update Class'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Tips Card */}
                        <View className="bg-amber-50 rounded-2xl p-4 mt-6 border border-amber-200">
                            <View className="flex-row items-start">
                                <MaterialIcons name="lightbulb" size={20} color="#F59E0B" />
                                <View className="flex-1 ml-3">
                                    <Text className="text-amber-800 font-semibold text-sm mb-1">Tips</Text>
                                    <Text className="text-amber-700 text-sm leading-5">
                                        • Use clear, descriptive names like "Grade 10A" or "Advanced Mathematics"{'\n'}
                                        • Keep names concise but informative{'\n'}
                                        • Consider including the subject or level if relevant
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default AddEditClass;