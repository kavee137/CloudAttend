import { useAuth } from "@/context/AuthContext"
import { auth, db } from "@/firebase"
import { getStorage } from "firebase/storage"
const storage = getStorage()
import { MaterialIcons } from "@expo/vector-icons"
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from "expo-router"
import { updatePassword, updateProfile } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import React, { useEffect, useState } from "react"
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native"

const Profile = () => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [institute, setInstitute] = useState({ instituteName: '', email: '', photoURL: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswordSection, setShowPasswordSection] = useState(false)

  useEffect(() => {
    const fetchInstituteData = async () => {
      if (user?.uid) {
        try {
          const docRef = doc(db, "institutes", user.uid)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const data = docSnap.data()
            setInstitute({
              instituteName: data.instituteName || '',
              email: data.email || user.email || '',
              photoURL: data.photoURL || user.photoURL || ''
            })
          }
        } catch (error) {
          console.error("Error fetching institute data:", error)
        }
      }
    }

    fetchInstituteData()
  }, [user])

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to change your profile picture.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      })

      if (!result.canceled && result.assets[0]) {
        setIsLoading(true)
        await uploadImage(result.assets[0].uri)
        setIsLoading(false)
      }
    } catch (error) {
      setIsLoading(false)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
      console.error('Image picker error:', error)
    }
  }

  const uploadImage = async (uri: string | Request) => {
    if (!user || !user.uid) {
      Alert.alert('Error', 'User not found. Please log in again.')
      return
    }
    try {
      const response = await fetch(uri)
      const blob = await response.blob()
      
      const imageRef = ref(storage, `institutes/${user.uid}/profile.jpg`)
      await uploadBytes(imageRef, blob)
      
      const downloadURL = await getDownloadURL(imageRef)
      
      // Update Firebase Auth profile
      await updateProfile(user, { photoURL: downloadURL })
      
      // Update Firestore document
      const docRef = doc(db, "institutes", user.uid)
      await updateDoc(docRef, { photoURL: downloadURL })
      
      setInstitute(prev => ({ ...prev, photoURL: downloadURL }))
      
      Alert.alert('Success', 'Profile picture updated successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      Alert.alert('Error', 'Failed to upload image. Please try again.')
    }
  }

  const handleSaveProfile = async () => {
    if (!institute.instituteName.trim()) {
      Alert.alert('Error', 'Institute name cannot be empty')
      return
    }

    setIsLoading(true)
    try {
      // Update Firestore document
      const docRef = doc(db, "institutes", user.uid)
      await updateDoc(docRef, {
        instituteName: institute.instituteName,
        email: institute.email
      })

      // Update Firebase Auth profile
      await updateProfile(user, { displayName: institute.instituteName })

      setIsEditing(false)
      Alert.alert('Success', 'Profile updated successfully!')
    } catch (error) {
      console.error('Update error:', error)
      Alert.alert('Error', 'Failed to update profile. Please try again.')
    }
    setIsLoading(false)
  }

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'Please fill all password fields')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long')
      return
    }

    setIsLoading(true)
    try {
      if (!user) {
        Alert.alert('Error', 'User not found. Please log in again.')
        setIsLoading(false)
        return
      }
      await updatePassword(user, passwordData.newPassword)
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordSection(false)
      Alert.alert('Success', 'Password updated successfully!')
    } catch (error) {
      console.error('Password update error:', error)
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'auth/requires-recent-login'
      ) {
        Alert.alert('Error', 'Please log out and log back in before changing your password.')
      } else {
        Alert.alert('Error', 'Failed to update password. Please try again.')
      }
    }
    setIsLoading(false)
  }

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth.signOut()
              router.replace('/login')
            } catch (error) {
              console.error('Logout error:', error)
              Alert.alert('Error', 'Failed to logout. Please try again.')
            }
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#6E62FF" />
        <Text className="text-lg mt-4">Loading...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View className="p-4 border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <MaterialIcons name="arrow-back" color="#333" size={24} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-800 flex-1">Profile Settings</Text>
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <MaterialIcons name="edit" color="#6E62FF" size={24} />
          </TouchableOpacity>
        ) : (
          <View className="flex-row">
            <TouchableOpacity onPress={() => setIsEditing(false)} className="mr-4">
              <MaterialIcons name="close" color="#666" size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveProfile} disabled={isLoading}>
              <MaterialIcons name="check" color="#10B981" size={24} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View className="items-center py-8 bg-gray-50">
          <TouchableOpacity onPress={pickImage} disabled={isLoading}>
            <View className="relative">
              <Image
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                source={{
                  uri: institute.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
                }}
                resizeMode="cover"
              />
              {isLoading ? (
                <View className="absolute inset-0 bg-black/50 rounded-full justify-center items-center">
                  <ActivityIndicator color="white" />
                </View>
              ) : (
                <View className="absolute bottom-0 right-0 bg-[#6E62FF] rounded-full p-2 border-2 border-white">
                  <MaterialIcons name="camera-alt" color="white" size={20} />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text className="text-sm text-gray-500 mt-3">Tap to change profile picture</Text>
        </View>

        {/* Profile Information */}
        <View className="px-4 py-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Institute Information</Text>
          
          {/* Institute Name */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-600 mb-2">Institute Name</Text>
            {isEditing ? (
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base"
                value={institute.instituteName}
                onChangeText={(text) => setInstitute(prev => ({ ...prev, instituteName: text }))}
                placeholder="Enter institute name"
                placeholderTextColor="#9CA3AF"
              />
            ) : (
              <View className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <Text className="text-base text-gray-800">
                  {institute.instituteName || 'Not set'}
                </Text>
              </View>
            )}
          </View>

          {/* Email */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-600 mb-2">Email Address</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <Text className="text-base text-gray-600">{institute.email}</Text>
            </View>
            <Text className="text-xs text-gray-500 mt-1">Email cannot be changed</Text>
          </View>

          {/* Password Section */}
          <View className="mb-6">
            <TouchableOpacity 
              className="flex-row items-center justify-between mb-4"
              onPress={() => setShowPasswordSection(!showPasswordSection)}
            >
              <Text className="text-lg font-semibold text-gray-800">Password Settings</Text>
              <MaterialIcons 
                name={showPasswordSection ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                color="#6E62FF" 
                size={24} 
              />
            </TouchableOpacity>

            {showPasswordSection && (
              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-medium text-gray-600 mb-2">Current Password</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base"
                    value={passwordData.currentPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                    placeholder="Enter current password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-600 mb-2">New Password</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base"
                    value={passwordData.newPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                    placeholder="Enter new password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-600 mb-2">Confirm New Password</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base"
                    value={passwordData.confirmPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                    placeholder="Confirm new password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  className="bg-[#6E62FF] rounded-lg py-3 flex-row items-center justify-center"
                  onPress={handleChangePassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <MaterialIcons name="lock" color="white" size={20} />
                      <Text className="text-white font-semibold ml-2">Update Password</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <TouchableOpacity
              className="bg-red-500 rounded-lg py-4 flex-row items-center justify-center"
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" color="white" size={20} />
              <Text className="text-white font-semibold ml-2">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default Profile