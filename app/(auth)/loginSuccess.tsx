import React, { useEffect } from "react"
import { View, Text, Image, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"

const LoginSuccess = () => {
  const router = useRouter()

  // Auto-redirect to home after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/home")
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <View className="flex-1 bg-white justify-center items-center p-6">
      <Image
        source={{
          uri: "https://img.freepik.com/free-vector/confirmed-concept-illustration_114360-545.jpg",
        }}
        className="w-64 h-64 mb-8"
        resizeMode="contain"
      />

      <Text className="text-3xl font-bold text-primary mb-4 text-center">
        Login Successful 🎉
      </Text>
      <Text className="text-lg text-gray-600 text-center mb-6">
        Welcome back! Redirecting you to your dashboard...
      </Text>

      <ActivityIndicator size="large" color="#795FFC" />
    </View>
  )
}

export default LoginSuccess
