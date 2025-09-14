import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useInstitute } from '@/context/InstituteContext'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { getTeacher, registerTeacherInFirestore, updateTeacher } from '@/services/teacherService'
import { Teacher } from '@/types/teacher'
import { MaterialIcons } from '@expo/vector-icons'

const AddUpdateTeacher = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { institute } = useInstitute();
  const { id } = useLocalSearchParams<{ id?: string }>()
  let isNew = !id || id === "new"
  console.log("isNew:", isNew, "id:", id);

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string>("active");

  const [loading, setLoading] = useState(false);



  useEffect(() => {
    if (isNew || !id) return;

    const loadTeacher = async () => {
      console.log("Loading teacher with ID:", id);
      setLoading(true);
      try {
        const teacher = await getTeacher(id as string);
        if (teacher) {
          setName(teacher.name ?? "");
          setEmail(teacher.email ?? "");
          setPhone(teacher.phone ?? "");
          setStatus(teacher.status ?? "");
        }
      } catch (err) {
        console.error("Error loading teacher", err);
      } finally {
        setLoading(false);
      }
    };

    loadTeacher();
  }, [id]);




  const handleSubmit = async () => {
    if (!user?.uid) {
      Alert.alert("Error", "No institute found for this user");
      return;
    }

    const teacherData: Teacher = { name, email, phone, status, instituteId: user.uid };

    // const errors = validateStudent(teacherData);
    // if (errors.length > 0) {
    //   Alert.alert("Validation Error", errors.join("\n"));
    //   return;
    // }

    try {
      setLoading(true);

      if (isNew) {
        await registerTeacherInFirestore(teacherData, institute?.instituteName || '');
        Alert.alert("Success", "Teacher added successfully");
      } else {
        await updateTeacher(id as string, teacherData);
        Alert.alert("Success", "Teacher updated successfully");
      }

      router.back();
    } catch (err) {
      console.error("Error saving teacher", err);
      Alert.alert("Error", `Failed to ${isNew ? "add" : "update"} teacher`);
    } finally {
      setLoading(false);
    }
  };



  const handleReset = () => {
    setName(""); setEmail(""); setPhone(""); setStatus("active");
  };



  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#6E62FF" />
        <Text className="text-gray-600 mt-4">Loading teacher data...</Text>
      </View>
    );
  }


  
return (
  <View className="flex-1 bg-gray-100 p-5">
    
    <Text className="text-2xl font-bold text-gray-800 text-center mb-8 mt-5">
      Add Teacher
    </Text>

    <View className="bg-white rounded-lg p-5 shadow-md">
      <View className="mb-5">
        <Text className="text-base font-semibold text-gray-800 mb-2">
          Teacher Name
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-base bg-gray-50 text-gray-800"
          placeholder="Enter teacher name"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View className="mb-5">
        <Text className="text-base font-semibold text-gray-800 mb-2">
          Email
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-base bg-gray-50 text-gray-800"
          placeholder="Enter email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View className="mb-5">
        <Text className="text-base font-semibold text-gray-800 mb-2">
          Phone Number
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-base bg-gray-50 text-gray-800"
          placeholder="Enter phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <TouchableOpacity className="bg-blue-600 rounded-lg p-4 items-center mt-3"
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="white" size="small" /> : (
          <>
            <MaterialIcons name={isNew ? "system-update-alt" : "add"} color="white" size={20} />
            <Text className="text-white font-semibold ml-2">{!isNew ? "Update Teacher" : "Add Teacher"}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  </View>
)
};

export default AddUpdateTeacher