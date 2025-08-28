import { useAuth } from "@/context/AuthContext"
import { auth, db } from "@/firebase"; // your Firestore config
import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { doc, getDoc } from "firebase/firestore"
import React, { useEffect, useState } from "react"
import { Alert, Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native"

const Home = () => {
  const { user, loading } = useAuth()
  const [institute, setInstitute] = useState<{ instituteName?: string; email?: string } | null>(null)
  const router = useRouter()

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
      // Remove stored token or user data
      // await AsyncStorage.removeItem("authToken");

      // Redirect to Login
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
      <StatusBar barStyle="dark-content" backgroundColor="red" />

      {/* Header Section */}
      <View className="p-4 border-b border-gray-100 flex-row justify-between items-center">

        {/* Profile Info */}
        <TouchableOpacity className="flex-row items-center flex-1 mr-2" onPress={() => router.push("/screens/profile")}>
          <View className="flex-row items-center flex-1">

            <Image
              className="w-14 h-14 rounded-full mr-3"
              source={{
                uri:
                  user?.photoURL ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }}
              resizeMode="cover"
            />

            <View className="flex-1">
              <View className="flex-row items-center flex-shrink">
                <Text
                  className="text-base font-semibold mr-1 flex-shrink"
                  numberOfLines={1}
                >
                  {institute?.instituteName || "Institute Name"}
                </Text>
                <MaterialIcons name="verified" color="#fffff" size={18} />
              </View>
              <Text
                className="text-xs text-primary"
                style={{ color: "#6E62FF" }}
                numberOfLines={1}
              >
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
            <MaterialIcons name="chat" color="#fffff" size={22} />
          </TouchableOpacity>

          <TouchableOpacity
            className="p-3 rounded-full bg-gray-200 justify-center items-center"
            accessibilityLabel="Notifications"
          >
            <MaterialIcons name="circle-notifications" color="#fffff" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView className="bg-[#F1F3F8]">


        {/* Purple Square */}
        <View className="flex-row rounded-3xl justify-between mt-5 mx-4 py-3 bg-gray-500">

          {/* Left Content */}
          <View className="justify-center pl-6 flex-1">
            <Text className="text-white font-semibold text-2xl" numberOfLines={1}>
              My Work Summary
            </Text>
            <Text className="font-medium text-[#EDEAFF]" numberOfLines={1}>
              Today task & presence activity
            </Text>
          </View>

          {/* Right Image */}
          <View className="justify-center items-center">
            <Image
              // source={require("/Users/rukshan/intelliJ idea projects/3rdSem/AMD/task-manager-app-69-main/assets/images/home-summery-image.png")}
              style={{ width: 100, height: 100 }}
              accessibilityLabel="Work summary illustration"
              resizeMode="contain"
            />
          </View>
        </View>




        <View className=" m-4 rounded-lg bg-gray-200 flex-row justify-evenly flex-wrap">
          <TouchableOpacity className=" border rounded-lg bg-white shadow-slate-600  border-gray-300 py-6 px-6 items-center m-4">
            <MaterialIcons name="person-add-alt" color="black" size={20} />
            <Text className="text-gray-500 text-xs">Add</Text>
            <Text className="text-gray-500 text-xs">Student</Text>
          </TouchableOpacity>
          <TouchableOpacity className=" border rounded-lg bg-white shadow-slate-600  border-gray-300 py-6 px-6 items-center m-4">
            <MaterialIcons name="person-add-alt" color="black" size={20} />
            <Text className="text-gray-500 text-xs">Add</Text>
            <Text className="text-gray-500 text-xs">Student</Text>
          </TouchableOpacity>
          <TouchableOpacity className=" border rounded-lg bg-white shadow-slate-600  border-gray-300 py-6 px-6 items-center m-4">
            <MaterialIcons name="person-add-alt" color="black" size={20} />
            <Text className="text-gray-500 text-xs">Add</Text>
            <Text className="text-gray-500 text-xs">Student</Text>
          </TouchableOpacity>
          <TouchableOpacity className=" border rounded-lg bg-white shadow-slate-600  border-gray-300 py-6 px-6 items-center m-4">
            <MaterialIcons name="person-add-alt" color="black" size={20} />
            <Text className="text-gray-500 text-xs">Add</Text>
            <Text className="text-gray-500 text-xs">Student</Text>
          </TouchableOpacity>
          <TouchableOpacity className=" border rounded-lg bg-white shadow-slate-600  border-gray-300 py-6 px-6 items-center m-4">
            <MaterialIcons name="person-add-alt" color="black" size={20} />
            <Text className="text-gray-500 text-xs">Add</Text>
            <Text className="text-gray-500 text-xs">Student</Text>
          </TouchableOpacity>
          <TouchableOpacity className=" border rounded-lg bg-white shadow-slate-600  border-gray-300 py-6 px-6 items-center m-4">
            <MaterialIcons name="person-add-alt" color="black" size={20} />
            <Text className="text-gray-500 text-xs">Add</Text>
            <Text className="text-gray-500 text-xs">Student</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="m-4 p-4 bg-red-700 rounded-lg shadow" onPress={() => {
          // handle logout

          handleLogout();
        }}>
          <Text className="text-lg font-semibold mb-2 text-white text-center">Logout</Text>
        </TouchableOpacity>


      </ScrollView>
    </View>
  )
}

export default Home
