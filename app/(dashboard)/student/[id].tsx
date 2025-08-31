import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native"
import React, { useState, useEffect } from "react"
import { useRouter, useLocalSearchParams } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import { useAuth } from "@/context/AuthContext"
import { addStudent, getStudent, updateStudent } from "@/services/studentService"
import Header from "@/components/header"
import { Student } from "@/types/student"
import { validateStudent } from "@/util/validation"

const AddUpdateStudent = ({ isUpdate = false }) => {
  const router = useRouter()
  const { user } = useAuth()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const isNew = !isUpdate || !id || id === "new"

  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [status, setStatus] = useState<"active" | "inactive">("active")

  // load student details when updating
  useEffect(() => {
    if (!isUpdate || !id || !user?.uid) return

    let isMounted = true // to avoid setting state after unmount
    const loadStudent = async () => {
      setLoading(true)
      try {
        const student: Student | null = await getStudent(id)
        if (student && isMounted) {
          setName(student.name ?? "")
          setEmail(student.email ?? "")
          setPhone(student.phone ?? "")
          setAddress(student.address ?? "")
          // setStatus(student.status ?? "active")
        }
      } catch (err) {
        console.error("Error loading student", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadStudent()

    return () => {
      isMounted = false // cleanup to prevent state update on unmounted component
    }
  }, [id, isUpdate, user?.uid])



  const handleSubmit = async () => {
    if (!user?.uid) {
      Alert.alert("Error", "No institute found for this user")
      return
    }

    const studentData: Student = {
      name,
      email,
      phone,
      address,
      status
    }

    // Validate using util
    const errors = validateStudent(studentData)
    if (errors.length > 0) {
      Alert.alert("Validation Error", errors.join("\n"))
      return
    }

    try {
      setLoading(true)

      if (isNew) {
        await addStudent({
          ...studentData,
          name: studentData.name.trim(),
          email: studentData.email.trim(),
          phone: studentData.phone.trim(),
          address: studentData.address.trim(),
          status: studentData.status.toLowerCase(),
          instituteId: user.uid
        } as any)

        Alert.alert("Success", "Student added successfully")
      } else {
        await updateStudent(id as string, {
          ...studentData,
          name: studentData.name.trim(),
          email: studentData.email.trim(),
          phone: studentData.phone.trim(),
          address: studentData.address.trim(),
          status: studentData.status.toLowerCase()
        })

        Alert.alert("Success", "Student updated successfully")
      }

      router.back()
    } catch (err) {
      console.error("Error saving student", err)
      Alert.alert("Error", `Failed to ${isNew ? "add" : "update"} student`)
    } finally {
      setLoading(false)
    }
  }


  const handleReset = () => {
    setName("")
    setEmail("")
    setPhone("")
    setAddress("")
    setStatus("active")
  }

  if (loading && isUpdate) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#6E62FF" />
        <Text className="text-gray-600 mt-4">Loading student data...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header title={isUpdate ? "Update Student" : "Add Student"} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Form Card */}
          <View className="bg-white mx-4 mt-6 rounded-2xl shadow-sm">
            <View className="p-6">
              {/* Form Header */}
              <View className="flex-row items-center mb-6">
                <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-4">
                  <MaterialIcons name="person-add" color="#6E62FF" size={24} />
                </View>
                <View>
                  <Text className="text-xl font-bold text-gray-800">
                    {isUpdate ? "Update Student Information" : "Student Information"}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {isUpdate
                      ? "Update the student details below"
                      : "Fill in the student details below"}
                  </Text>
                </View>
              </View>

              {/* Name Field */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Full Name <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3">
                  <MaterialIcons name="person" color="#9CA3AF" size={20} />
                  <TextInput
                    className="flex-1 ml-3 text-base text-gray-800"
                    placeholder="Enter full name"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Email Field */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Email Address <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3">
                  <MaterialIcons name="email" color="#9CA3AF" size={20} />
                  <TextInput
                    className="flex-1 ml-3 text-base text-gray-800"
                    placeholder="Enter email address"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              {/* Phone Field */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3">
                  <MaterialIcons name="phone" color="#9CA3AF" size={20} />
                  <TextInput
                    className="flex-1 ml-3 text-base text-gray-800"
                    placeholder="Enter phone number"
                    placeholderTextColor="#9CA3AF"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Address Field */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Address <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row items-start border border-gray-300 rounded-xl px-4 py-3">
                  <MaterialIcons name="location-on" color="#9CA3AF" size={20} />
                  <TextInput
                    className="flex-1 ml-3 text-base text-gray-800"
                    placeholder="Enter full address"
                    placeholderTextColor="#9CA3AF"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row space-x-3 mt-8">
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
                  disabled={loading}
                  className={`flex-1 rounded-xl py-4 flex-row items-center justify-center ${loading ? "bg-gray-400" : "bg-[#6E62FF]"
                    }`}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <MaterialIcons
                        name={isUpdate ? "update" : "add"}
                        color="white"
                        size={20}
                      />
                      <Text className="text-white font-semibold ml-2">
                        {isUpdate ? "Update Student" : "Add Student"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Info Card */}
          <View className="bg-blue-50 mx-4 mt-4 rounded-2xl p-4">
            <View className="flex-row items-center">
              <MaterialIcons name="info" color="#3B82F6" size={20} />
              <Text className="text-blue-800 font-medium ml-2">Information</Text>
            </View>
            <Text className="text-blue-700 text-sm mt-2 leading-5">
              All fields marked with <Text className="text-red-500">*</Text> are
              required. Student ID will be automatically generated upon
              successful submission.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

// Export both modes
export const AddStudent = () => <AddUpdateStudent isUpdate={false} />
export const UpdateStudent = () => <AddUpdateStudent isUpdate={true} />
export default AddStudent
