import { View, Text } from "react-native"
import React from "react"
import { Tabs } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"

const tabs = [
  { label: "Home", name: "home", icon: "home-filled" },
  { label: "Teachers", name: "teacher", icon: "check-circle" },
  { label: "Classes", name: "class", icon: "local-library" },
  { label: "Students", name: "student", icon: "person" },
  { label: "Attendance", name: "attendance", icon: "view-list" }
] as const

const DashboardLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#999",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#000",
          borderRadius: 30,
          height: 65,
          paddingBottom: 5,
          paddingTop: 5,
          position: "absolute",
          margin: 10,
          left: 10,
          right: 10,
          bottom: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 5
        }
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
