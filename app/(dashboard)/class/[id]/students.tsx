import Header from '@/components/header';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase';
import { getClassById } from '@/services/classService';
import {
  bulkAssignStudentsToClass,
  getClassStudentStats,
  getUnassignedStudentsForClass,
  removeStudentFromClass
} from '@/services/classStudentService';
import { getTeacher } from '@/services/teacherService';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, doc as firestoreDoc, getDoc, onSnapshot, query, where } from '@firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
}

interface Class {
  id: string;
  name: string;
  teacherId: string;
  instituteId: string;
  status: string;
}

interface Teacher {
  id: string;
  name: string;
  email?: string;
}

interface ClassStudent {
  id: string;
  classId: string;
  studentId: string;
  status: 'active' | 'inactive';
  assignedAt: Date;
}

const ClassStudentsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  // State management
  const [classData, setClassData] = useState<Class | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [assignedStudents, setAssignedStudents] = useState<Student[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [classStats, setClassStats] = useState({ activeStudents: 0, removedStudents: 0, totalAssignments: 0 });
  
  const [loading, setLoading] = useState(true);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [unassignedLoading, setUnassignedLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation(); // Add this line

   useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Load class data and teacher info
  useEffect(() => {
    if (id) {
      loadClassData();
    }
  }, [id]);

  // Real-time updates for assigned students
  useEffect(() => {
    if (!id) return;

    setAssignedLoading(true);
    const q = query(
      collection(db, "classStudents"),
      where("classId", "==", id),
      where("status", "==", "active")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const classStudents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ClassStudent[];

          // Get student details for each assignment
          const studentPromises = classStudents.map(async (cs) => {
            const studentDoc = await getDoc(firestoreDoc(db, "students", cs.studentId));
            if (studentDoc.exists()) {
              return {
                id: studentDoc.id,
                ...studentDoc.data()
              } as Student;
            }
            return null;
          });

          const students = (await Promise.all(studentPromises)).filter(Boolean) as Student[];
          setAssignedStudents(students);
          
          // Update stats
          const stats = await getClassStudentStats(id);
          setClassStats(stats);
        } catch (error) {
          console.error("Error loading assigned students:", error);
        } finally {
          setAssignedLoading(false);
        }
      },
      (error) => {
        console.error("Error in real-time assigned students:", error);
        setAssignedLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  const loadClassData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [classInfo] = await Promise.all([
        getClassById(id)
      ]);

      if (classInfo) {
        setClassData(classInfo as Class);
        
        // Load teacher info
        if (classInfo.teacherId) {
          const teacherInfo = await getTeacher(classInfo.teacherId);
          if (teacherInfo) {
            setTeacher(teacherInfo as Teacher);
          }
        }
      }
    } catch (error) {
      console.error("Error loading class data:", error);
      Alert.alert('Error', 'Failed to load class information');
    } finally {
      setLoading(false);
    }
  };

  const loadUnassignedStudents = async () => {
    if (!id || !user?.uid) return;

    try {
      setUnassignedLoading(true);
      const students = await getUnassignedStudentsForClass(id, user.uid);
      setUnassignedStudents(students as Student[]);
    } catch (error) {
      console.error("Error loading unassigned students:", error);
      Alert.alert('Error', 'Failed to load unassigned students');
    } finally {
      setUnassignedLoading(false);
    }
  };

  const handleAssignModalOpen = () => {
    setIsAssignModalVisible(true);
    loadUnassignedStudents();
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleBulkAssign = async () => {
    if (!id || !user?.uid || selectedStudents.length === 0) return;

    try {
      const result = await bulkAssignStudentsToClass(
        id,
        selectedStudents,
        user.uid,
        user.uid
      );

      if (result.success) {
        Alert.alert('Success', `${result.count} students assigned successfully`);
        setSelectedStudents([]);
        setIsAssignModalVisible(false);
        loadUnassignedStudents(); // Refresh the list
      } else {
        Alert.alert('Error', result.error || 'Failed to assign students');
      }
    } catch (error) {
      console.error("Error assigning students:", error);
      Alert.alert('Error', 'Failed to assign students');
    }
  };

  const handleRemoveStudent = async (student: Student) => {
    if (!id) return;

    Alert.alert(
      'Remove Student',
      `Are you sure you want to remove "${student.name}" from this class?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeStudentFromClass(id, student.id);
              if (result.success) {
                Alert.alert('Success', 'Student removed successfully');
              } else {
                Alert.alert('Error', result.error || 'Failed to remove student');
              }
            } catch (error) {
              console.error("Error removing student:", error);
              Alert.alert('Error', 'Failed to remove student');
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClassData();
    setRefreshing(false);
  };

  const filteredUnassignedStudents = unassignedStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderAssignedStudentItem = ({ item }: { item: Student }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center">
          <View className="bg-green-100 rounded-full p-3 mr-3">
            <MaterialIcons name="person" size={20} color="#10B981" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900 mb-1">{item.name}</Text>
            {item.email && (
              <Text className="text-sm text-gray-600">{item.email}</Text>
            )}
            {item.phone && (
              <Text className="text-sm text-gray-500">{item.phone}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleRemoveStudent(item)}
          className="bg-red-500 rounded-lg p-2 ml-3"
        >
          <MaterialIcons name="remove" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUnassignedStudentItem = ({ item }: { item: Student }) => {
    const isSelected = selectedStudents.includes(item.id);
    
    return (
      <TouchableOpacity
        className={`flex-row items-center p-4 border-b border-gray-100 ${
          isSelected ? 'bg-blue-50' : 'bg-white'
        }`}
        onPress={() => handleStudentSelect(item.id)}
      >
        <View className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
          isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
        }`}>
          {isSelected && <MaterialIcons name="check" size={16} color="white" />}
        </View>
        
        <View className="bg-gray-100 rounded-full p-2 mr-3">
          <MaterialIcons name="person" size={18} color="#6B7280" />
        </View>
        
        <View className="flex-1">
          <Text className={`text-base font-medium ${
            isSelected ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {item.name}
          </Text>
          {item.email && (
            <Text className={`text-sm ${
              isSelected ? 'text-blue-700' : 'text-gray-600'
            }`}>
              {item.email}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading class information...</Text>
      </View>
    );
  }

  if (!classData) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <MaterialIcons name="error" size={48} color="#EF4444" />
        <Text className="text-red-600 mt-4 text-lg font-semibold">Class not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-blue-500 rounded-xl px-6 py-3"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Class Students" />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-4 py-6">
          {/* Class Info Card */}
          <View className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="bg-blue-100 rounded-full p-3 mr-3">
                <MaterialIcons name="school" size={24} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">{classData.name}</Text>
                <Text className="text-sm text-gray-600">
                  Teacher: {teacher?.name || 'Loading...'}
                </Text>
              </View>
            </View>

            {/* Stats Row */}
            <View className="flex-row justify-between bg-gray-50 rounded-xl p-4">
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-600">{classStats.activeStudents}</Text>
                <Text className="text-xs text-gray-600">Active Students</Text>
              </View>
              <View className="w-px bg-gray-300" />
              <View className="items-center">
                <Text className="text-2xl font-bold text-orange-600">{classStats.removedStudents}</Text>
                <Text className="text-xs text-gray-600">Removed</Text>
              </View>
              <View className="w-px bg-gray-300" />
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-600">{classStats.totalAssignments}</Text>
                <Text className="text-xs text-gray-600">Total Assigned</Text>
              </View>
            </View>
          </View>

          {/* Assigned Students Section */}
          <View className="bg-white rounded-2xl shadow-sm p-6">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-xl font-bold text-gray-900">Assigned Students</Text>
                <Text className="text-sm text-gray-600">
                  {assignedStudents.length} student{assignedStudents.length !== 1 ? 's' : ''} in this class
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleAssignModalOpen}
                className="bg-blue-500 rounded-xl px-4 py-2 flex-row items-center"
              >
                <MaterialIcons name="person-add" size={20} color="white" />
                <Text className="text-white font-semibold ml-1">Assign</Text>
              </TouchableOpacity>
            </View>

            {assignedLoading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-600 mt-3">Loading students...</Text>
              </View>
            ) : assignedStudents.length === 0 ? (
              <View className="py-12 items-center">
                <View className="bg-gray-100 rounded-full p-6 mb-4">
                  <MaterialIcons name="people-outline" size={48} color="#9CA3AF" />
                </View>
                <Text className="text-gray-600 text-center mb-2">No students assigned</Text>
                <Text className="text-gray-500 text-center text-sm mb-4">
                  Start by assigning students to this class
                </Text>
                <TouchableOpacity
                  onPress={handleAssignModalOpen}
                  className="bg-blue-500 rounded-xl px-6 py-3 flex-row items-center"
                >
                  <MaterialIcons name="person-add" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Assign Students</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={assignedStudents}
                renderItem={renderAssignedStudentItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Assign Students Modal */}
      <Modal
        visible={isAssignModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAssignModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[85%] overflow-hidden">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-900">Assign Students</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsAssignModalVisible(false);
                  setSelectedStudents([]);
                  setSearchQuery('');
                }}
                className="bg-gray-100 rounded-full p-2"
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="px-6 py-4 border-b border-gray-200">
              <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
                <MaterialIcons name="search" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-2 text-gray-800"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Selected Count and Action Button */}
            {selectedStudents.length > 0 && (
              <View className="px-6 py-3 bg-blue-50 border-b border-blue-200">
                <View className="flex-row items-center justify-between">
                  <Text className="text-blue-800 font-medium">
                    {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                  </Text>
                  <TouchableOpacity
                    onPress={handleBulkAssign}
                    className="bg-blue-500 rounded-lg px-4 py-2"
                  >
                    <Text className="text-white font-semibold">Assign Selected</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Students List */}
            {unassignedLoading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-600 mt-3">Loading available students...</Text>
              </View>
            ) : filteredUnassignedStudents.length === 0 ? (
              <View className="py-12 items-center">
                <MaterialIcons name="people-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-600 mt-4 text-lg font-medium">
                  {searchQuery ? 'No students found' : 'All students assigned'}
                </Text>
                <Text className="text-gray-500 text-center mt-2">
                  {searchQuery 
                    ? 'Try adjusting your search query' 
                    : 'All available students are already assigned to this class'
                  }
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredUnassignedStudents}
                renderItem={renderUnassignedStudentItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ClassStudentsPage;