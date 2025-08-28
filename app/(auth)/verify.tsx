import React, { useState } from "react"
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { auth } from "@/firebase"
import { checkEmailVerified, createInstitute } from "@/services/authService"

const Verify = () => {
  const router = useRouter()
  const { email, instituteName } = useLocalSearchParams<{ email: string; instituteName: string }>()
  const [isChecking, setIsChecking] = useState(false)
  const [verified, setVerified] = useState(false)

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return
    setIsChecking(true)
    try {
      const isVerified = await checkEmailVerified(auth.currentUser)
      if (isVerified) {
        setVerified(true)
        await createInstitute(auth.currentUser.uid, instituteName, email)
        router.push("/verifySuccess")
      } else {
        alert("Email not verified yet. Please check your inbox.")
      }
    } catch (err) {
      console.error(err)
      alert("Error checking verification")
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <View className="flex-1 justify-center items-center p-6">
      <Text className="text-xl font-bold mb-4">Verify Your Email</Text>
      <Text className="mb-6 text-center">
        A verification link has been sent to {email}. Please verify your email and then press the button below.
      </Text>

      <TouchableOpacity
        className="bg-primary p-4 rounded-full w-3/4"
        onPress={handleCheckVerification}
      >
        {isChecking ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <Text className="text-center text-2xl text-white">I Verified My Email</Text>
        )}
      </TouchableOpacity>

      {verified && <Text className="mt-4 text-green-600">Email Verified ✅</Text>}
    </View>
  )
}

export default Verify
