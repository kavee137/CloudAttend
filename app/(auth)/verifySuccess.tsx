import React from "react"
import { View, Text, Image, TouchableOpacity } from "react-native"
import { useRouter } from "expo-router"

const Congratulations = () => {
  const router = useRouter()

  return (
    <View className="flex-1 bg-white justify-center items-center p-6">
      <Image
        source={{ uri: "https://img.freepik.com/free-vector/celebration-concept-illustration_114360-172.jpg" }}
        className="w-64 h-64 mb-8"
        resizeMode="contain"
      />

      <Text className="text-3xl font-bold text-center text-primary mb-4">
        Congratulations 🎉
      </Text>
      <Text className="text-lg text-gray-600 text-center mb-8">
        Your email has been successfully verified.  
        You can now access your institute dashboard!
      </Text>

      <TouchableOpacity
        className="bg-primary px-6 py-3 rounded-full"
        onPress={() => router.replace("/home")}
      >
        <Text className="text-white text-lg font-semibold">Go to Dashboard</Text>
      </TouchableOpacity>
    </View>
  )
}

export default Congratulations
