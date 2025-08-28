import React from "react"
import "./../global.css"
import { Slot } from "expo-router"
import { AuthProvider } from "@/context/AuthContext"

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"

const RootLayout = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-transparent" edges={["top"]}>
        <AuthProvider>
          <Slot />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

export default RootLayout
