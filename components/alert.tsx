import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";

type CustomAlertProps = {
  visible: boolean;
  message: string;
  onClose: () => void;
};

const CustomAlert: React.FC<CustomAlertProps> = ({ visible, onClose, message }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white w-80 rounded-2xl p-6">
          <Text className="text-lg font-bold mb-4">Alert</Text>
          <Text className="mb-4">{message}</Text>
          <TouchableOpacity
            className="bg-primary rounded-lg p-3"
            onPress={onClose}
          >
            <Text className="text-white text-center">OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;
