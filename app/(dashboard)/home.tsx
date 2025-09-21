import { useAuth } from "@/context/AuthContext"
import { useInstitute } from "@/context/InstituteContext"
import { auth, db } from "@/firebase"
import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { doc, getDoc } from "firebase/firestore"
import React, { useEffect, useState } from "react"
import { Alert, Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native"



const Home = () => {
  const { user, loading } = useAuth()
  const [institutee, setInstitute] = useState<{ instituteName?: string; email?: string } | null>(null)
  const router = useRouter()
  const { institute } = useInstitute()


  useEffect(() => {
    const fetchInstitute = async () => {
      if (user?.uid) {
        const docRef = doc(db, "institutes", user.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setInstitute(docSnap.data() as any)

        } else {
          console.log("No such document!")
        }
      }
    }

    fetchInstitute()
  }, [user])

  const handleLogout = async () => {
    try {
      auth.signOut();
      router.replace("/login");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not log out.");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg">Loading...</Text>
      </View>
    )
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg">No user found. Please log in.</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header Section */}
      <View className="p-4 border-b border-gray-100 flex-row justify-between items-center">
        {/* Profile Info */}
        <TouchableOpacity className="flex-row items-center flex-1 mr-2" onPress={() => router.push("/screens/profile")}>
          <View className="flex-row items-center flex-1">
            <Image
              className="w-14 h-14 rounded-full mr-3"
              source={{
                uri: user?.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }}
              resizeMode="cover"
            />
            <View className="flex-1">
              <View className="flex-row items-center flex-shrink">
                <Text className="text-base font-semibold mr-1 flex-shrink" numberOfLines={1}>
                  {institute?.instituteName || "Institute Name"}
                </Text>
                <MaterialIcons name="verified" color="#6E62FF" size={18} />
              </View>
              <Text className="text-xs text-primary" style={{ color: "#6E62FF" }} numberOfLines={1}>
                {institute?.email || user?.email}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View className="flex-row">
          <TouchableOpacity
            className="p-3 mx-1 rounded-full bg-gray-200 justify-center items-center"
            accessibilityLabel="Chat"
          >
            <MaterialIcons name="chat" color="#666666" size={22} />
          </TouchableOpacity>
          <TouchableOpacity
            className="p-3 rounded-full bg-gray-200 justify-center items-center"
            accessibilityLabel="Notifications"
          >
            <MaterialIcons name="circle-notifications" color="#666666" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView className="bg-[#F1F3F8]">
        {/* Work Summary Card */}
        <View className="flex-row rounded-3xl justify-between mt-5 mx-4 py-6 px-4" style={{ backgroundColor: "#6E62FF" }}>
          <View className="justify-center pl-2 flex-1">
            <Text className="text-white font-semibold text-2xl" numberOfLines={1}>
              My Work Summary
            </Text>
            <Text className="font-medium text-[#EDEAFF]" numberOfLines={1}>
              Today's task & presence activity
            </Text>
          </View>
          <View className="justify-center items-center">
            <View className="w-20 h-20 bg-white/20 rounded-full justify-center items-center">
              <MaterialIcons name="analytics" color="white" size={40} />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mx-4 mt-6 mb-8">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity
              className="bg-white rounded-2xl p-4 shadow-sm mb-4"
              style={{ width: '48%' }}
              onPress={() => router.push("/(dashboard)/student/add-student")}
            >
              <View className="items-center">
                <View className="w-12 h-12 bg-purple-100 rounded-full justify-center items-center mb-3">
                  <MaterialIcons name="person-add-alt" color="#8B5CF6" size={24} />
                </View>
                <Text className="text-sm font-medium text-gray-800 text-center">Add Student</Text>
                <Text className="text-xs text-gray-500 text-center mt-1">Add New Student</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white rounded-2xl p-4 shadow-sm mb-4"
              style={{ width: '48%' }}
              onPress={() => router.push("/")}
            >
              <View className="items-center">
                <View className="w-12 h-12 bg-indigo-100 rounded-full justify-center items-center mb-3">
                  <MaterialIcons name="local-library" color="#6366F1" size={24} />
                </View>
                <Text className="text-sm font-medium text-gray-800 text-center">Add Class</Text>
                <Text className="text-xs text-gray-500 text-center mt-1">Add New Class</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white rounded-2xl p-4 shadow-sm"
              style={{ width: '48%' }}
              onPress={() => router.push("/")}
            >
              <View className="items-center">
                <View className="w-12 h-12 bg-teal-100 rounded-full justify-center items-center mb-3">
                  <MaterialIcons name="school" color="#14B8A6" size={24} />
                </View>
                <Text className="text-sm font-medium text-gray-800 text-center">Add Teacher</Text>
                <Text className="text-xs text-gray-500 text-center mt-1">Add New Teacher</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white rounded-2xl p-4 shadow-sm"
              style={{ width: '48%' }}
              onPress={() => router.push("/")}
            >
              <View className="items-center">
                <View className="w-12 h-12 bg-gray-100 rounded-full justify-center items-center mb-3">
                  <MaterialIcons name="settings" color="#6B7280" size={24} />
                </View>
                <Text className="text-sm font-medium text-gray-800 text-center">Settings</Text>
                <Text className="text-xs text-gray-500 text-center mt-1">App Settings</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Overview Stats */}
        <View className="mx-4 mt-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Overview</Text>
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-medium text-gray-800">Institute Statistics</Text>
              <TouchableOpacity onPress={() => router.push("/")}>
                <Text className="text-sm text-[#6E62FF] font-medium">View All</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-green-600">85</Text>
                <Text className="text-xs text-gray-500 text-center">Students</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-green-600">12</Text>
                <Text className="text-xs text-gray-500 text-center">Teachers</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-green-600">3</Text>
                <Text className="text-xs text-gray-500 text-center">Classes</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View className="mx-4 mt-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</Text>
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            {[
              { name: "John Doe", time: "09:15 AM", status: "present", class: "Computer Science" },
              { name: "Jane Smith", time: "09:12 AM", status: "present", class: "Mathematics" },
              { name: "Mike Johnson", time: "09:30 AM", status: "late", class: "Physics" },
            ].map((activity, index) => (
              <View key={index} className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0">
                <View className={`w-10 h-10 rounded-full justify-center items-center mr-3 ${activity.status === 'present' ? 'bg-green-100' : activity.status === 'late' ? 'bg-orange-100' : 'bg-red-100'
                  }`}>
                  <MaterialIcons
                    name={activity.status === 'present' ? 'check' : activity.status === 'late' ? 'schedule' : 'close'}
                    color={activity.status === 'present' ? '#10B981' : activity.status === 'late' ? '#F59E0B' : '#EF4444'}
                    size={20}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-800">{activity.name}</Text>
                  <Text className="text-xs text-gray-500">{activity.class}</Text>
                </View>
                <Text className="text-xs text-gray-500">{activity.time}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  )
}

export default Home