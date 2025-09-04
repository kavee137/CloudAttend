import { useAuth } from "@/context/AuthContext"
import { useRouter } from "expo-router"
import React, { useEffect } from "react"
import { ActivityIndicator, View } from "react-native"

const Index = () => {
  const router = useRouter()
  const { user, loading } = useAuth()
  console.log("User data : ", user)

  useEffect(() => {
    if (!loading) {
      if (user) router.replace("/home")
      else router.replace("/login")
    }
  }, [user, loading])

  if (loading) {
    return (
      <View className="flex-1 w-full justify-center align-items-center">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return null
}

export default Index

// ඊයෙ වැඩ කරලා අද ලැප් එක ඔන් කරද්දී ප්‍රොජෙක්ට් එක වැඩ නෑ...app folder eka athule thiyena index file eka detect kr gnn bari seen ekak kiyanne. kata hari mehema wela hdpu kenek innwad