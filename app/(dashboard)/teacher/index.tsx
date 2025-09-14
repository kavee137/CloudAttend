import { 
  View, Text, TouchableOpacity, ScrollView, TextInput, Image, Alert, ActivityIndicator 
} from 'react-native'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { deleteTeacher, getTeachersByInstitute } from '@/services/teacherService'
import { Teacher } from '@/types/teacher'
import { useAuth } from '@/context/AuthContext'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/firebase'

const TeacherPage = () => {
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)

  // Real-time subscription
  useEffect(() => {
    if (!user?.uid) return

    const q = query(
      collection(db, "teachers"),
      where("instituteId", "==", user.uid)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allTeachers = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Teacher
        )
        setTeachers(allTeachers)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching teachers:", err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.uid])

  // One-time fetch fallback
  const fetchTeachers = async () => {
    if (!user?.uid) return
    setLoading(true)
    try {
      const data = await getTeachersByInstitute(user.uid)
      setTeachers(data)
    } catch (err) {
      console.error('Error fetching teachers:', err)
      Alert.alert('Error', 'Failed to fetch teachers. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Handle delete
  const handleDelete = (teacherId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to deactivate this teacher?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true)
              await deleteTeacher(teacherId)
              Alert.alert("Done", "Teacher has been deactivated.")
            } catch (err) {
              console.error("Error deleting teacher:", err)
              Alert.alert("Error", "Failed to deactivate teacher.")
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  useEffect(() => {
    fetchTeachers()
  }, [user?.uid])

  // Search filter
  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-6 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" color="#333" size={24} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800 flex-1 ml-4">Teachers</Text>
          <View className="bg-[#6E62FF] px-3 py-1 rounded-full">
            <Text className="text-white text-sm font-medium">{teachers.length}</Text>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-3">
          <MaterialIcons name="search" color="#6B7280" size={20} />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-800"
            placeholder="Search teachers..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" color="#6B7280" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Add Teacher Button */}
      <View className="px-4 py-4">
        <TouchableOpacity 
          onPress={() => router.push("/(dashboard)/teacher/new")}
          className="bg-[#6E62FF] rounded-lg py-4 flex-row items-center justify-center shadow-sm"
        >
          <MaterialIcons name="add" color="white" size={24} />
          <Text className="text-white font-semibold text-base ml-2">Add New Teacher</Text>
        </TouchableOpacity>
      </View>

      {/* Teacher List */}
      <ScrollView className="flex-1 px-4 mb-20" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#6E62FF" />
          </View>
        ) : filteredTeachers.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <MaterialIcons name="person" color="#D1D5DB" size={64} />
            <Text className="text-gray-500 text-lg font-medium mt-4">
              {searchQuery ? 'No teachers found' : 'No teachers added yet'}
            </Text>
            <Text className="text-gray-400 text-sm mt-2 text-center px-8">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Start by adding your first teacher to the system'
              }
            </Text>
          </View>
        ) : (
          <View className="pb-6">
            {filteredTeachers.map((teacher) => (
              <View key={teacher.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                <View className="flex-row items-center">
                  <Image
                    source={{ uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
                    className="w-16 h-16 rounded-full"
                    resizeMode="cover"
                  />

                  {/* Teacher Info */}
                  <View className="flex-1 ml-4">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-lg font-semibold text-gray-800 flex-1" numberOfLines={1}>
                        {teacher.name}
                      </Text>
                      <View className={`px-2 py-1 rounded-full ${
                        teacher.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Text className={`text-xs font-medium ${
                          teacher.status === 'active' ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {teacher.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    
                    <Text className="text-sm text-gray-600 mb-1">ID: {teacher.id}</Text>
                    
                    <View className="flex-row items-center">
                      <MaterialIcons name="email" color="#9CA3AF" size={14} />
                      <Text className="text-xs text-gray-500 ml-1 flex-1" numberOfLines={1}>
                        {teacher.email}
                      </Text>
                    </View>
                    
                    {teacher.phone && (
                      <View className="flex-row items-center mt-1">
                        <MaterialIcons name="phone" color="#9CA3AF" size={14} />
                        <Text className="text-xs text-gray-500 ml-1">
                          {teacher.phone}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row justify-end mt-4 pt-3 border-t border-gray-100">
                  <TouchableOpacity
                    onPress={() => router.push(`/(dashboard)/teacher/${teacher.id}`)}
                    className="flex-row items-center bg-blue-50 px-4 py-2 rounded-lg mr-2"
                  >
                    <MaterialIcons name="edit" color="#3B82F6" size={16} />
                    <Text className="text-blue-600 font-medium ml-1 text-sm">Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => { handleDelete(teacher.id!) }}
                    className="flex-row items-center bg-red-50 px-4 py-2 rounded-lg"
                  >
                    <MaterialIcons name="delete" color="#EF4444" size={16} />
                    <Text className="text-red-600 font-medium ml-1 text-sm">Deactivate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default TeacherPage
