import { View, Text, Platform } from "react-native"
import React from "react"
import { Stack } from "expo-router"

const TaskLayout = () => {
  return <Stack screenOptions={{ animation: "slide_from_right" }}>
    <Stack.Screen name="index" options={{ headerShown: false}}/>
    <Stack.Screen name="[id]" options={{ headerShown: false}}/>
  </Stack>
}

export default TaskLayout
