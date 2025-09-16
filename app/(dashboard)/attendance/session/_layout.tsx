import { View, Text, Platform } from "react-native"
import React from "react"
import { Stack } from "expo-router"

const SessionLayout = () => {
  return <Stack screenOptions={{ animation: "slide_from_right" }}>
    {/* <Stack.Screen name="index" options={{ headerShown: false}}/> */}
    <Stack.Screen name="[classId]" options={{ headerShown: false}}/>
  </Stack>
}

export default SessionLayout
