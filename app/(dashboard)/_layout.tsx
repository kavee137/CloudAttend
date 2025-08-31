import { View, Text } from "react-native"
import React from "react"
import { Tabs } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"

const tabs = [
  { label: "Home", name: "home", icon: "home-filled" },
  { label: "Teachers", name: "teacher", icon: "school" },
  { label: "Classes", name: "class", icon: "local-library" },
  { label: "Students", name: "student", icon: "people" },
  { label: "Attendance", name: "attendance", icon: "view-list" }
] as const

const DashboardLayout = () => {
  return (
    
<Tabs
  screenOptions={{
    tabBarActiveTintColor: "#6E62FF",
    tabBarInactiveTintColor: "#8E8E93",
    headerShown: false,
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: "600",
      marginTop: -2,
      marginBottom: 2
    },
    tabBarIconStyle: {
      marginTop: 2
    },
    tabBarStyle: {
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderRadius: 25,
      height: 70,
      paddingBottom: 8,
      paddingTop: 8,
      paddingHorizontal: 20,
      position: "absolute",
      margin: 16,
      left: 0,
      right: 0,
      bottom: 10,
      borderTopWidth: 0,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
      // Glassmorphism effect
      backdropFilter: "blur(20px)",
      // Modern iOS style border
      borderWidth: 0.5,
      borderColor: "rgba(255, 255, 255, 0.2)"
    },
    tabBarBackground: () => (
      <View 
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: 25,
          flex: 1,
          // Additional glassmorphism layers
          backdropFilter: "blur(20px)",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.18)"
        }} 
      />
    )
  }}
>
      {/* (obj.name) ===  ({name}) */}
      {tabs.map(({ name, icon, label }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: label,
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name={icon} color={color} size={size} />
            )
          }}
        />
      ))}
    </Tabs>
  )
}

// tasks/index

export default DashboardLayout
