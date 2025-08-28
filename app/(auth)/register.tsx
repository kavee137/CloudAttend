import CustomAlert from "@/components/alert"
import { register } from "@/services/authService"
import { useRouter } from "expo-router"
import React, { useState } from "react"
import {
  ActivityIndicator,
  Image,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native"

const Register = () => {
  const router = useRouter()
  const [instituteName, setInstituteName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [alertVisible, setAlertVisible] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")

  const showAlert = (message: string) => {
    setAlertMessage(message)
    setAlertVisible(true)
  }

  const handleRegister = async () => {
    if (!instituteName || !email || !password) {
      showAlert("Please fill all fields!")
      return
    }
    if (!email.includes("@") || !email.includes(".")) {
      showAlert("Please enter a valid email address!")
      return
    }
    if (password.length < 6) {
      showAlert("Password must be at least 6 characters!")
      return
    }
    if (password !== confirmPassword) {
      showAlert("Passwords do not match.")
      return
    }

    if (isLoading) return
    setIsLoading(true)

    try {
      const user = await register(email, password)
      showAlert("Verification email sent. Please check your inbox!")

      // Navigate to OTP (email verification) screen
      setTimeout(() => {
        router.push({ pathname: "/verify", params: { email, instituteName } })
      }, 1500)
    } catch (err: any) {
      if (err.message.includes("auth/email-already-in-use")) {
        showAlert("Email already registered!")
      } else {
        showAlert("Registration failed. Try again later.")
        console.error(err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View className="flex-1 h-full items-center p-4">
        <Text className="text-2xl font-bold mb-6 text-primary text-center">
          Register Your Institute
        </Text>

        <Image
          source={{
            uri: "https://img.freepik.com/premium-vector/register-access-login-password-internet-online-website-concept-flat-illustration_385073-108.jpg"
          }}
          className="w-full h-64"
          resizeMode="contain"
        />

        <TextInput
          placeholder="Institute Name"
          className="bg-surface border border-gray-300 w-full rounded-full px-4 py-3 mb-4 text-gray-900"
          value={instituteName}
          onChangeText={setInstituteName}
        />
        <TextInput
          placeholder="Institute Email"
          className="bg-surface border border-gray-300 w-full rounded-full px-4 py-3 mb-4 text-gray-900"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          secureTextEntry
          className="bg-surface border border-gray-300 w-full rounded-full px-4 py-3 mb-4 text-gray-900"
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          placeholder="Confirm Password"
          secureTextEntry
          className="bg-surface border border-gray-300 w-full rounded-full px-4 py-3 mb-4 text-gray-900"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity
          className="bg-primary p-4 rounded-full w-3/4 mt-2"
          onPress={handleRegister}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Text className="text-center text-2xl text-white">Next</Text>
          )}
        </TouchableOpacity>

        <Pressable onPress={() => router.back()}>
          <Text className="text-center mt-4 text-gray-500">
            Already have an account? <Text className="text-primary">Login</Text>
          </Text>
        </Pressable>

        <CustomAlert
          visible={alertVisible}
          message={alertMessage}
          onClose={() => setAlertVisible(false)}
        />
      </View>
    </View>
  )
}

export default Register
