import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Student, AttendanceRecord } from '@/types/attendance';

interface StudentAttendanceListProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onMarkAttendance: (studentId: string, status: 'present' | 'absent' | 'late') => Promise<void>;
  sessionActive: boolean;
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'unmarked';

const StudentAttendanceList: React.FC<StudentAttendanceListProps> = ({
  students,
  attendanceRecords,
  onMarkAttendance,
  sessionActive
}) => {
  const [loadingStudents, setLoadingStudents] = useState<Set<string>>(new Set());

  // Get attendance status for a student
  const getStudentStatus = (studentId: string): AttendanceStatus => {
    const record = attendanceRecords.find(r => r.studentId === studentId);
    return record ? record.status : 'unmarked';
  };

  // Get attendance record for a student
  const getStudentRecord = (studentId: string): AttendanceRecord | undefined => {
    return attendanceRecords.find(r => r.studentId === studentId);
  };

  // Handle attendance marking with loading state
  const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (!sessionActive) {
      Alert.alert('Error', 'No active attendance session');
      return;
    }

    try {
      setLoadingStudents(prev => new Set(prev).add(studentId));
      await onMarkAttendance(studentId, status);
    } catch (error) {
      console.error('Error marking attendance:', error);
      Alert.alert('Error', 'Failed to mark attendance. Please try again.');
    } finally {
      setLoadingStudents(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }
  };

  // Get status icon and color
  const getStatusDisplay = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return { icon: 'check-circle', color: '#10B981', bgColor: '#D1FAE5', textColor: '#065F46' };
      case 'late':
        return { icon: 'schedule', color: '#F59E0B', bgColor: '#FEF3C7', textColor: '#92400E' };
      case 'absent':
        return { icon: 'cancel', color: '#EF4444', bgColor: '#FEE2E2', textColor: '#991B1B' };
      default:
        return { icon: 'radio-button-unchecked', color: '#9CA3AF', bgColor: '#F3F4F6', textColor: '#4B5563' };
    }
  };

  const renderStudentItem = ({ item: student }: { item: Student }) => {
    const status = getStudentStatus(student.id);
    const record = getStudentRecord(student.id);
    const statusDisplay = getStatusDisplay(status);
    const isLoading = loadingStudents.has(student.id);

    return (
      <View className="bg-gray-50 rounded-xl p-4 mb-3">
        {/* Student Info */}
        <View className="flex-row items-center mb-3">
          <View className="bg-blue-100 rounded-full p-3 mr-4">
            <MaterialIcons name="person" size={20} color="#3B82F6" />
          </View>
          
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900 mb-1">
              {student.name}
            </Text>
            <Text className="text-sm text-gray-600">
              ID: {student.studentId}
            </Text>
            {student.email && (
              <Text className="text-xs text-gray-500 mt-1">
                {student.email}
              </Text>
            )}
          </View>

          {/* Current Status */}
          <View 
            className="rounded-full px-3 py-2"
            style={{ backgroundColor: statusDisplay.bgColor }}
          >
            <View className="flex-row items-center">
              <MaterialIcons 
                name={statusDisplay.icon as any} 
                size={16} 
                color={statusDisplay.color} 
              />
              <Text 
                className="text-xs font-semibold ml-1 capitalize"
                style={{ color: statusDisplay.textColor }}
              >
                {status === 'unmarked' ? 'Not Marked' : status}
              </Text>
            </View>
          </View>
        </View>

        {/* Attendance Record Info */}
        {record && record.markedAt && (
          <View className="bg-white rounded-lg p-3 mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <MaterialIcons name="access-time" size={16} color="#6B7280" />
                <Text className="text-sm text-gray-600 ml-2">
                  Marked at: {record.markedAt.toDate().toLocaleTimeString()}
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <MaterialIcons 
                  name={record.markedBy === 'qr' ? 'qr-code' : 'edit'} 
                  size={16} 
                  color="#6B7280" 
                />
                <Text className="text-sm text-gray-600 ml-1 capitalize">
                  {record.markedBy}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {sessionActive && (
          <View className="flex-row space-x-2">
            {/* Present Button */}
            <TouchableOpacity
              onPress={() => handleMarkAttendance(student.id, 'present')}
              disabled={isLoading}
              className={`flex-1 rounded-lg py-3 flex-row items-center justify-center ${
                status === 'present' ? 'bg-green-500' : 'bg-green-100'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={status === 'present' ? 'white' : '#10B981'} />
              ) : (
                <>
                  <MaterialIcons 
                    name="check" 
                    size={18} 
                    color={status === 'present' ? 'white' : '#10B981'} 
                  />
                  <Text className={`font-medium ml-2 ${
                    status === 'present' ? 'text-white' : 'text-green-700'
                  }`}>
                    Present
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Late Button */}
            <TouchableOpacity
              onPress={() => handleMarkAttendance(student.id, 'late')}
              disabled={isLoading}
              className={`flex-1 rounded-lg py-3 flex-row items-center justify-center ${
                status === 'late' ? 'bg-yellow-500' : 'bg-yellow-100'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={status === 'late' ? 'white' : '#F59E0B'} />
              ) : (
                <>
                  <MaterialIcons 
                    name="schedule" 
                    size={18} 
                    color={status === 'late' ? 'white' : '#F59E0B'} 
                  />
                  <Text className={`font-medium ml-2 ${
                    status === 'late' ? 'text-white' : 'text-yellow-700'
                  }`}>
                    Late
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Absent Button */}
            <TouchableOpacity
              onPress={() => handleMarkAttendance(student.id, 'absent')}
              disabled={isLoading}
              className={`flex-1 rounded-lg py-3 flex-row items-center justify-center ${
                status === 'absent' ? 'bg-red-500' : 'bg-red-100'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={status === 'absent' ? 'white' : '#EF4444'} />
              ) : (
                <>
                  <MaterialIcons 
                    name="close" 
                    size={18} 
                    color={status === 'absent' ? 'white' : '#EF4444'} 
                  />
                  <Text className={`font-medium ml-2 ${
                    status === 'absent' ? 'text-white' : 'text-red-700'
                  }`}>
                    Absent
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Session Inactive Message */}
        {!sessionActive && (
          <View className="bg-gray-100 rounded-lg p-3 flex-row items-center justify-center">
            <MaterialIcons name="info" size={18} color="#6B7280" />
            <Text className="text-gray-600 ml-2 font-medium">
              Start a session to mark attendance
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Calculate statistics
  const totalStudents = students.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const unmarkedCount = totalStudents - attendanceRecords.length;

  if (students.length === 0) {
    return (
      <View className="py-12 items-center">
        <View className="bg-gray-100 rounded-full p-6 mb-4">
          <MaterialIcons name="people" size={48} color="#9CA3AF" />
        </View>
        <Text className="text-lg font-semibold text-gray-600 mb-2">
          No Students Enrolled
        </Text>
        <Text className="text-gray-500 text-center">
          Add students to this class to manage attendance
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Statistics Summary */}
      {sessionActive && attendanceRecords.length > 0 && (
        <View className="bg-blue-50 rounded-xl p-4 mb-4">
          <Text className="text-lg font-semibold text-blue-900 mb-3">
            Attendance Summary
          </Text>
          
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600">
                {presentCount}
              </Text>
              <Text className="text-sm text-gray-600">Present</Text>
            </View>
            
            <View className="items-center">
              <Text className="text-2xl font-bold text-yellow-600">
                {lateCount}
              </Text>
              <Text className="text-sm text-gray-600">Late</Text>
            </View>
            
            <View className="items-center">
              <Text className="text-2xl font-bold text-red-600">
                {absentCount}
              </Text>
              <Text className="text-sm text-gray-600">Absent</Text>
            </View>
            
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-600">
                {unmarkedCount}
              </Text>
              <Text className="text-sm text-gray-600">Unmarked</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="mt-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm text-gray-600">Attendance Progress</Text>
              <Text className="text-sm font-semibold text-blue-700">
                {Math.round(((presentCount + lateCount) / totalStudents) * 100)}%
              </Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View className="flex-row h-full">
                <View 
                  className="bg-green-500 h-full"
                  style={{ width: `${(presentCount / totalStudents) * 100}%` }}
                />
                <View 
                  className="bg-yellow-500 h-full"
                  style={{ width: `${(lateCount / totalStudents) * 100}%` }}
                />
                <View 
                  className="bg-red-500 h-full"
                  style={{ width: `${(absentCount / totalStudents) * 100}%` }}
                />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Students List */}
      <FlatList
        data={students}
        renderItem={renderStudentItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        ListHeaderComponent={
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">
              Students ({totalStudents})
            </Text>
            {sessionActive && (
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                <Text className="text-sm text-gray-600">Session Active</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="py-8 items-center">
            <MaterialIcons name="people-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2">No students found</Text>
          </View>
        }
      />
    </View>
  );
};

export default StudentAttendanceList;