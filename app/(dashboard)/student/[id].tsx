import React, { useState, useEffect } from "react";
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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import  {Student} from "@/types/student";
import { registerStudentInFirestore, updateStudent, getStudent } from "@/services/studentService";
import Header from "@/components/header";
import SendStudentEmailWebView from "@/components/SendStudentEmailWebView";
import { validateStudent } from "@/util/validation";
import { useInstitute } from "@/context/InstituteContext";


const AddUpdateStudent = ({ isUpdate = false }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { institute } = useInstitute();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isNew = !isUpdate || !id || id === "new";

  const [loading, setLoading] = useState(false);
  const [studentRegistered, setStudentRegistered] = useState<Student | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  // Load student data if updating
  useEffect(() => {
    if (!isUpdate || !id) return;
    let isMounted = true;

    const loadStudent = async () => {
      setLoading(true);
      try {
        const student = await getStudent(id);
        if (student && isMounted) {
          setName(student.name ?? "");
          setEmail(student.email ?? "");
          setPhone(student.phone ?? "");
          setAddress(student.address ?? "");
          // setStatus(student.status ?? "active");
        }
      } catch (err) {
        console.error("Error loading student", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadStudent();
    return () => { isMounted = false; };
  }, [id, isUpdate]);

  const handleSubmit = async () => {
    if (!user?.uid) {
      Alert.alert("Error", "No institute found for this user");
      return;
    }

    const studentData: Student = { name, email, phone, address, status, instituteId: user.uid };

    const errors = validateStudent(studentData);
    if (errors.length > 0) {
      Alert.alert("Validation Error", errors.join("\n"));
      return;
    }

    try {
      setLoading(true);

      if (isNew) {
        const savedStudent = await registerStudentInFirestore(studentData, institute?.instituteName || '');
        // await setStudentRegistered(savedStudent); // triggers EmailJS WebView
        Alert.alert("Success", "Student added successfully");
      } else {
        await updateStudent(id as string, studentData);
        Alert.alert("Success", "Student updated successfully");
      }

      router.back();
    } catch (err) {
      console.error("Error saving student", err);
      Alert.alert("Error", `Failed to ${isNew ? "add" : "update"} student`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName(""); setEmail(""); setPhone(""); setAddress(""); setStatus("active");
  };

  if (loading && isUpdate) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#6E62FF" />
        <Text className="text-gray-600 mt-4">Loading student data...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header title={isUpdate ? "Update Student" : "Add Student"} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Form Card */}
          <View className="bg-white mx-4 mt-6 rounded-2xl shadow-sm p-6">
            {/* Name Field */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-1">
                Full Name <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-2">
                <MaterialIcons name="person" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-2 text-gray-800"
                  placeholder="Enter full name"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Email Field */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-1">
                Email Address <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-2">
                <MaterialIcons name="email" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-2 text-gray-800"
                  placeholder="Enter email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Phone Field */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-1">
                Phone Number <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-2">
                <MaterialIcons name="phone" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-2 text-gray-800"
                  placeholder="Enter phone number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Address Field */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-1">
                Address <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-start border border-gray-300 rounded-xl px-4 py-2">
                <MaterialIcons name="location-on" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-2 text-gray-800"
                  placeholder="Enter full address"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3 mt-6">
              <TouchableOpacity
                onPress={handleReset}
                className="flex-1 bg-gray-100 rounded-xl py-3 flex-row items-center justify-center"
                disabled={loading}
              >
                <MaterialIcons name="refresh" color="#6B7280" size={20} />
                <Text className="text-gray-600 font-semibold ml-2">Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                className={`flex-1 rounded-xl py-3 flex-row items-center justify-center ${loading ? "bg-gray-400" : "bg-[#6E62FF]"}`}
              >
                {loading ? <ActivityIndicator color="white" size="small" /> : (
                  <>
                    <MaterialIcons name={isUpdate ? "update" : "add"} color="white" size={20} />
                    <Text className="text-white font-semibold ml-2">{isUpdate ? "Update Student" : "Add Student"}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Trigger EmailJS WebView */}
      {studentRegistered && (
        <SendStudentEmailWebView
          email={studentRegistered.email}
          studentId={studentRegistered.id ?? ""}
          studentName={studentRegistered.name}
          instituteName={user?.displayName || "Your Institute"}
          onSuccess={() => console.log("Email sent successfully")}
          onError={(err) => console.error("Email failed:", err)}
        />
      )}
    </View>
  );
};

export const AddStudent = () => <AddUpdateStudent isUpdate={false} />;
export const UpdateStudent = () => <AddUpdateStudent isUpdate={true} />;
export default AddStudent;
