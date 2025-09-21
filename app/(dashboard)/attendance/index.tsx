import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getTeachersByInstitute } from '@/services/teacherService';
import { deleteClass } from '@/services/classService';
import Header from '@/components/header';
import { collection, onSnapshot, query, where } from '@firebase/firestore';
import { db } from '@/firebase';
import { Class } from '@/types/class';
import { Teacher } from '@/types/teacher';

const AttendanceManagement = () => {
  const router = useRouter();
  const { user } = useAuth();

  // State management
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Real time update classes when teacher is selected
  useEffect(() => {
    if (!selectedTeacher?.id) {
      setClasses([]);
      return;
    }

    setClassesLoading(true);
    const q = query(
      collection(db, "classes"),
      where("teacherId", "==", selectedTeacher.id),
      where("status", "==", "active")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allClasses = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Class
        );
        setClasses(allClasses);
        setClassesLoading(false);
      },
      (err) => {
        console.error("Error fetching classes:", err);
        setClassesLoading(false);
        Alert.alert('Error', 'Failed to load classes in real-time');
      }
    );

    return () => unsubscribe();
  }, [selectedTeacher?.id]);

  // Load teachers when component mounts
  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    if (!user?.uid) return;

    try {
      setTeachersLoading(true);
      const teachersList = await getTeachersByInstitute(user.uid);
      setTeachers(teachersList.filter(teacher => teacher.status?.toLowerCase() === 'active'));
    } catch (error) {
      console.error('Error fetching teachers:', error);
      Alert.alert('Error', 'Failed to load teachers. Please try again.');
    } finally {
      setTeachersLoading(false);
    }
  };

  const handleTeacherSelect = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDropdownVisible(false);
  };

  const handleAddClass = () => {
    if (!selectedTeacher) {
      Alert.alert('Error', 'Please select a teacher first');
      return;
    }
    router.push(`/class/new?teacherId=${selectedTeacher.id}`);
  };



  const handleEditClass = (classItem: Class, event: any) => {
    event.stopPropagation(); // Prevent card press event
    router.push(`/class/${classItem.id}`);
  };

  const handleDeleteClass = async (classItem: Class, event: any) => {
    event.stopPropagation(); // Prevent card press event
    Alert.alert(
      'Delete Class',
      `Are you sure you want to delete "${classItem.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClass(classItem.id!);
              Alert.alert('Success', 'Class deleted successfully');
            } catch (error) {
              console.error('Error deleting class:', error);
              Alert.alert('Error', 'Failed to delete class');
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeachers();
    setRefreshing(false);
  };

  const renderTeacherItem = ({ item }: { item: Teacher }) => (
    <TouchableOpacity
      className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100"
      onPress={() => handleTeacherSelect(item)}
    >
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900 mb-1">{item.name}</Text>
        {item.email && (
          <Text className="text-xs text-gray-500">{item.email}</Text>
        )}
      </View>
      <View className="bg-blue-100 rounded-full p-2">
        <MaterialIcons name="person" size={20} color="#3B82F6" />
      </View>
    </TouchableOpacity>
  );


  const renderClassItem = ({ item }: { item: Class }) => (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100 active:bg-gray-50"
      onPress={() => handleClassPress(item)} // Add this line
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <View className="bg-blue-100 rounded-full p-2 mr-3">
              <MaterialIcons name="school" size={18} color="#3B82F6" />
            </View>
            <Text className="text-lg font-semibold text-gray-900">{item.name}</Text>
          </View>

          <View className="flex-row items-center mb-2">
            <View className={`px-2 py-1 rounded-full ${item.status === 'active' ? 'bg-green-100' : 'bg-red-100'
              }`}>
              <Text className={`text-xs font-medium ${item.status === 'active' ? 'text-green-700' : 'text-red-700'
                }`}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <MaterialIcons name="people" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-1">Tap to manage attendance</Text>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={(event) => handleEditClass(item, event)}
            className="bg-blue-100 rounded-full p-2"
          >
            <MaterialIcons name="edit" size={16} color="#3B82F6" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(event) => handleDeleteClass(item, event)}
            className="bg-red-100 rounded-full p-2"
          >
            <MaterialIcons name="delete" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleClassPress = (classItem: Class) => {
    router.push({
      pathname: "../attendance/session",
      params: { classId: classItem.id }
    })
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Attendance Management" />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-4 py-6">
          {/* Teacher Selection Card */}
          <View className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">Select Teacher</Text>

            <TouchableOpacity
              className="flex-row items-center justify-between border-2 border-dashed border-gray-300 rounded-xl px-4 py-4 bg-gray-50"
              onPress={() => setIsDropdownVisible(true)}
              disabled={teachersLoading}
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-blue-100 rounded-full p-3 mr-3">
                  <MaterialIcons name="person" size={24} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className={`text-base font-medium ${selectedTeacher ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                    {selectedTeacher ? selectedTeacher.name : 'Choose a teacher'}
                  </Text>
                </View>
              </View>
              <View className="ml-2">
                {teachersLoading ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <MaterialIcons
                    name={isDropdownVisible ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                    size={24}
                    color="#9CA3AF"
                  />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Classes Section */}
          {selectedTeacher && (
            <View className="bg-white rounded-2xl shadow-sm p-6">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-xl font-bold text-gray-900">Classes</Text>
                  <Text className="text-sm text-gray-600">
                    Teacher: {selectedTeacher.name}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleAddClass}
                  className="bg-blue-500 rounded-xl px-4 py-2 flex-row items-center"
                >
                  <MaterialIcons name="add" size={20} color="white" />
                  <Text className="text-white font-semibold ml-1">Add Class</Text>
                </TouchableOpacity>
              </View>

              {classesLoading ? (
                <View className="py-12 items-center">
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text className="text-gray-600 mt-3">Loading classes...</Text>
                </View>
              ) : classes.length === 0 ? (
                <View className="py-12 items-center">
                  <View className="bg-gray-100 rounded-full p-6 mb-4">
                    <MaterialIcons name="school" size={48} color="#9CA3AF" />
                  </View>
                  <Text className="text-gray-600 text-center mb-2">No classes found</Text>
                  <Text className="text-gray-500 text-center text-sm mb-4">
                    Create your first class for {selectedTeacher.name}
                  </Text>
                  <TouchableOpacity
                    onPress={handleAddClass}
                    className="bg-blue-500 rounded-xl px-6 py-3 flex-row items-center"
                  >
                    <MaterialIcons name="add" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Create First Class</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={classes}
                  renderItem={renderClassItem}
                  keyExtractor={(item) => item.id!}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          )}

          {/* No Teacher Selected State */}
          {!selectedTeacher && (
            <View className="bg-white rounded-2xl shadow-sm p-12 items-center">
              <View className="bg-blue-100 rounded-full p-6 mb-4">
                <MaterialIcons name="school" size={48} color="#3B82F6" />
              </View>
              <Text className="text-xl font-semibold text-gray-900 mb-2">Welcome to Attendance Management</Text>
              <Text className="text-gray-600 text-center">
                Select a teacher above to view and manage their class attendance
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Teacher Selection Modal */}
      <Modal
        visible={isDropdownVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[80%] overflow-hidden">
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-900">Select Teacher</Text>
              <TouchableOpacity
                onPress={() => setIsDropdownVisible(false)}
                className="bg-gray-100 rounded-full p-2"
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {teachers.length === 0 && !teachersLoading ? (
              <View className="py-12 px-6 items-center">
                <MaterialIcons name="person-off" size={48} color="#9CA3AF" />
                <Text className="text-lg font-medium text-gray-600 mt-4 mb-2">No Teachers Found</Text>
                <Text className="text-gray-500 text-center mb-6">
                  Add teachers to your institute first
                </Text>
                <TouchableOpacity
                  onPress={loadTeachers}
                  className="bg-blue-500 rounded-xl px-6 py-3"
                >
                  <Text className="text-white font-semibold">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={teachers}
                renderItem={renderTeacherItem}
                keyExtractor={(item, index) => item.id ?? index.toString()}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  teachersLoading ? (
                    <View className="py-12 items-center">
                      <ActivityIndicator size="large" color="#3B82F6" />
                      <Text className="mt-4 text-gray-600">Loading teachers...</Text>
                    </View>
                  ) : null
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AttendanceManagement;