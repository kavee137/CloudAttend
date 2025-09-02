import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { getAllStudents, getStudentsByInstitute, studentsRef,  } from '@/services/studentService'
import { Student } from '@/types/student'
import { useAuth } from '@/context/AuthContext' // assuming you have AuthContext for logged-in user
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/firebase'

const StudentPage = () => {
  const router = useRouter()
  const {user} = useAuth() // get logged-in user
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (!user?.uid) return

    const q = query(
      collection(db, "students"),
      where("instituteId", "==", user.uid)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allStudents = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Student
        )
        setStudents(allStudents)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching students:", err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.uid])


  // Fetch students for the logged-in institute
  const fetchStudents = async () => {
    if (!user?.uid) return
    setLoading(true)
    try {
      const data = await getStudentsByInstitute(user.uid) // fetch by instituteId

      setStudents(data)
    } catch (err) {
      console.error('Error fetching students:', err)
      Alert.alert('Error', 'Failed to fetch students. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [user?.uid])

  // Filter students based on search query
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    // student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-6 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" color="#333" size={24} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800 flex-1 ml-4">Students</Text>
          <View className="bg-[#6E62FF] px-3 py-1 rounded-full">
            <Text className="text-white text-sm font-medium">{students.length}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-3">
          <MaterialIcons name="search" color="#6B7280" size={20} />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-800"
            placeholder="Search students..."
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

      {/* Add Student Button */}
      <View className="px-4 py-4">
        <TouchableOpacity 
          onPress={() => router.push("/(dashboard)/student/add-student")}
          className="bg-[#6E62FF] rounded-lg py-4 flex-row items-center justify-center shadow-sm"
        >
          <MaterialIcons name="add" color="white" size={24} />
          <Text className="text-white font-semibold text-base ml-2">Add New Student</Text>
        </TouchableOpacity>
      </View>

      {/* Students List */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#6E62FF" />
          </View>
        ) : filteredStudents.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <MaterialIcons name="school" color="#D1D5DB" size={64} />
            <Text className="text-gray-500 text-lg font-medium mt-4">
              {searchQuery ? 'No students found' : 'No students added yet'}
            </Text>
            <Text className="text-gray-400 text-sm mt-2 text-center px-8">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Start by adding your first student to the system'
              }
            </Text>
          </View>
        ) : (
          <View className="pb-6">
            {filteredStudents.map((student) => (
              <View key={student.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                <View className="flex-row items-center">
                  {/* Student Avatar */}
                  <Image
                    source={{ uri: 'https://via.placeholder.com/150' }} // Placeholder image
                    className="w-16 h-16 rounded-full"
                    resizeMode="cover"
                  />

                  {/* Student Info */}
                  <View className="flex-1 ml-4">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-lg font-semibold text-gray-800 flex-1" numberOfLines={1}>
                        {student.name}
                      </Text>
                      <View className={`px-2 py-1 rounded-full ${
                        student.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Text className={`text-xs font-medium ${
                          student.status === 'active' ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {student.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    
                    <Text className="text-sm text-gray-600 mb-1">ID: {student.id}</Text>
                    
                    <View className="flex-row items-center">
                      <MaterialIcons name="email" color="#9CA3AF" size={14} />
                      <Text className="text-xs text-gray-500 ml-1 flex-1" numberOfLines={1}>
                        {student.email}
                      </Text>
                    </View>
                    
                    <View className="flex-row items-center mt-1">
                      <MaterialIcons name="phone" color="#9CA3AF" size={14} />
                      <Text className="text-xs text-gray-500 ml-1">
                        {student.phone}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row justify-end mt-4 pt-3 border-t border-gray-100">
                  <TouchableOpacity
                    onPress={() => router.push(`/(dashboard)/student/edit-student?id=${student.id}`)}
                    className="flex-row items-center bg-blue-50 px-4 py-2 rounded-lg mr-2"
                  >
                    <MaterialIcons name="edit" color="#3B82F6" size={16} />
                    <Text className="text-blue-600 font-medium ml-1 text-sm">Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => Alert.alert('Delete', 'Delete student functionality')}
                    className="flex-row items-center bg-red-50 px-4 py-2 rounded-lg"
                  >
                    <MaterialIcons name="delete" color="#EF4444" size={16} />
                    <Text className="text-red-600 font-medium ml-1 text-sm">Delete</Text>
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

export default StudentPage
