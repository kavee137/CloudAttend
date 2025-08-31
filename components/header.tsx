import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'

interface HeaderProps {
  title?: string
}

const Header: React.FC<HeaderProps> = ({ title }) => {

    const router = useRouter();

  return (
    <View className='w-full h-16 bg-white justify-center items-center'>
      <TouchableOpacity onPress={() => router.back()} className='absolute left-4 top-4'>
        <MaterialIcons name="arrow-back-ios" color="#fffff" size={29} />
      </TouchableOpacity>
      <Text className='text-xl'>{title}</Text>
    </View>
  )
}

export default Header