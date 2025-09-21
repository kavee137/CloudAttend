import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { 
  getAttendanceHistory, 
  getAttendanceStatistics,
  getAttendanceRecords 
} from '@/services/attendanceService';
import { getClassById } from '@/services/classService';
import Header from '@/components/header';
import { AttendanceSession, SessionSummary, AttendanceStatistics } from '@/types/attendance';
import { Class } from '@/types/class';

const AttendanceHistoryScreen = () => {
  const router = useRouter();
  const { classId } = useLocalSearchParams();

  // State
  const [classData, setClassData] = useState<Class | null>(null);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [statistics, setStatistics] = useState<AttendanceStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<{start?: string; end?: string}>({});
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    if (classId) {
      loadData();
    }
  }, [classId, dateFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load class info
      if (classId && typeof classId === 'string') {
        const classInfo = await getClassById(classId);
        setClassData(classInfo);

        // Load attendance history
        const history = await getAttendanceHistory(
          classId,
          dateFilter.start,
          dateFilter.end
        );
        setSessions(history);

        // Load statistics
        const stats = await getAttendanceStatistics(classId, dateFilter);
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Error loading attendance history:', error);
      Alert.alert('Error', 'Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDateSelect = (day: any) => {
    const date = day.dateString;
    setSelectedDate(date);
    
    // Filter sessions for selected date
    const filtered = sessions.filter(session => 
      session.date === date
    );
    
    if (filtered.length > 0) {
      // Show sessions for this date
      setExpandedSession(filtered[0].id);
    }
    
    setShowCalendar(false);
  };

  const toggleSessionDetails = async (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
      // Load attendance records for this session if needed
    }
  };

  const getSessionStatusColor = (session: AttendanceSession) => {
    switch (session.status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDuration = (startTime: any, endTime?: any) => {
    const start = startTime.toDate();
    const end = endTime ? endTime.toDate() : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    
    if (duration < 60) {
      return `${duration}m`;
    } else {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  // Create calendar marked dates
  const getMarkedDates = () => {
    const marked: any = {};
    
    sessions.forEach(session => {
      if (session.date) {
        marked[session.date] = {
          marked: true,
          dotColor: session.status === 'completed' ? '#10B981' : '#3B82F6',
          selectedColor: '#3B82F6',
        };
      }
    });

    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#3B82F6',
      };
    }

    return marked;
  };

  const renderSessionItem = (session: AttendanceSession) => {
    const isExpanded = expandedSession === session.id;
    
    return (
      <TouchableOpacity
        key={session.id}
        className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
        onPress={() => toggleSessionDetails(session.id)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="event" size={20} color="#3B82F6" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">
                {new Date(session.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <MaterialIcons name="schedule" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-2">
                {session.startTime.toDate().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                {session.endTime && (
                  ` - ${session.endTime.toDate().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}`
                )}
              </Text>
              <Text className="text-sm text-gray-500 ml-2">
                ({formatDuration(session.startTime, session.endTime)})
              </Text>
            </View>
          </View>

          <View className="items-end">
            <View className={`px-3 py-1 rounded-full ${getSessionStatusColor(session)}`}>
              <Text className="text-xs font-medium capitalize">
                {session.status}
              </Text>
            </View>
            
            <MaterialIcons 
              name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
              size={24} 
              color="#9CA3AF" 
            />
          </View>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View className="border-t border-gray-100 pt-3">
            <View className="bg-gray-50 rounded-lg p-3">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Session Details
              </Text>
              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">Session ID:</Text>
                  <Text className="text-sm font-mono text-gray-800">
                    {session.id.substring(0, 8)}...
                  </Text>
                </View>
                
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">Duration:</Text>
                  <Text className="text-sm text-gray-800">
                    {formatDuration(session.startTime, session.endTime)}
                  </Text>
                </View>
                
                {session.endTime && (
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-600">Ended:</Text>
                    <Text className="text-sm text-gray-800">
                      {session.endTime.toDate().toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-2 mt-3">
              <TouchableOpacity
                className="flex-1 bg-blue-500 rounded-lg py-2 flex-row items-center justify-center"
                onPress={() => router.push(`../attendance/details/${session.id}`)}
              >
                <MaterialIcons name="visibility" size={18} color="white" />
                <Text className="text-white font-medium ml-2">View Details</Text>
              </TouchableOpacity>
              
              {session.status === 'completed' && (
                <TouchableOpacity
                  className="flex-1 bg-green-500 rounded-lg py-2 flex-row items-center justify-center"
                  onPress={() => {
                    // Export or share functionality
                    Alert.alert('Export', 'Export functionality coming soon');
                  }}
                >
                  <MaterialIcons name="download" size={18} color="white" />
                  <Text className="text-white font-medium ml-2">Export</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!classData) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Attendance History" />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-4 py-6">
          {/* Statistics Card */}
          {statistics && (
            <View className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-900">
                  Overall Statistics
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCalendar(true)}
                  className="bg-blue-100 rounded-full p-2"
                >
                  <MaterialIcons name="calendar-today" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>

              <View className="grid grid-cols-2 gap-4">
                <View className="bg-blue-50 rounded-xl p-4">
                  <Text className="text-2xl font-bold text-blue-600">
                    {statistics.totalSessions}
                  </Text>
                  <Text className="text-sm text-gray-600">Total Sessions</Text>
                </View>

                <View className="bg-green-50 rounded-xl p-4">
                  <Text className="text-2xl font-bold text-green-600">
                    {statistics.averageAttendance}%
                  </Text>
                  <Text className="text-sm text-gray-600">Avg Attendance</Text>
                </View>

                <View className="bg-purple-50 rounded-xl p-4">
                  <Text className="text-2xl font-bold text-purple-600">
                    {statistics.totalStudents}
                  </Text>
                  <Text className="text-sm text-gray-600">Total Students</Text>
                </View>

                <View className="bg-yellow-50 rounded-xl p-4">
                  <Text className="text-2xl font-bold text-yellow-600">
                    {statistics.presentCount + statistics.lateCount}
                  </Text>
                  <Text className="text-sm text-gray-600">Total Present</Text>
                </View>
              </View>
            </View>
          )}

          {/* Filter Options */}
          <View className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">Filters</Text>
            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => setShowCalendar(true)}
                className="flex-1 border border-gray-200 rounded-lg py-3 flex-row items-center justify-center"
              >
                <MaterialIcons name="date-range" size={18} color="#6B7280" />
                <Text className="text-gray-700 ml-2">Select Date</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  setDateFilter({});
                  setSelectedDate('');
                }}
                className="flex-1 bg-blue-500 rounded-lg py-3 flex-row items-center justify-center"
              >
                <MaterialIcons name="clear" size={18} color="white" />
                <Text className="text-white ml-2">Clear Filter</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sessions List */}
          <View className="bg-white rounded-2xl shadow-sm p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">
                Attendance Sessions
              </Text>
              <Text className="text-sm text-gray-600">
                {sessions.length} sessions
              </Text>
            </View>

            {loading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-4 text-gray-600">Loading sessions...</Text>
              </View>
            ) : sessions.length === 0 ? (
              <View className="py-12 items-center">
                <View className="bg-gray-100 rounded-full p-6 mb-4">
                  <MaterialIcons name="event-note" size={48} color="#9CA3AF" />
                </View>
                <Text className="text-lg font-semibold text-gray-600 mb-2">
                  No Sessions Found
                </Text>
                <Text className="text-gray-500 text-center">
                  No attendance sessions found for the selected period
                </Text>
              </View>
            ) : (
              <View>
                {sessions.map(session => renderSessionItem(session))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[80%] overflow-hidden">
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-900">Select Date</Text>
              <TouchableOpacity
                onPress={() => setShowCalendar(false)}
                className="bg-gray-100 rounded-full p-2"
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Calendar
              onDayPress={handleDateSelect}
              markedDates={getMarkedDates()}
              theme={{
                selectedDayBackgroundColor: '#3B82F6',
                todayTextColor: '#3B82F6',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#00adf5',
                selectedDotColor: '#ffffff',
                arrowColor: '#3B82F6',
                monthTextColor: '#2d4150',
                indicatorColor: '#3B82F6',
              }}
            />

            <View className="p-4">
              <View className="flex-row items-center mb-4">
                <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                <Text className="text-sm text-gray-600 mr-4">Completed Sessions</Text>
                <View className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
                <Text className="text-sm text-gray-600">Active/Other Sessions</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AttendanceHistoryScreen;