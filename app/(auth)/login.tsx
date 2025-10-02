import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useRouter } from "expo-router";
import { login } from "@/services/authService";
import CustomAlert from "@/components/alert"; // import your custom alert

const Login = () => {
    const router = useRouter();
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // State for custom alert
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const showAlert = (message: string) => {
        setAlertMessage(message);
        setAlertVisible(true);
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showAlert("Please enter both email and password!");
            return;
        }
        if (!email.includes("@") || !email.includes(".")) {
            showAlert("Please enter a valid email address!");
            return;
        }
        if (password.length < 6) {
            showAlert("Password must be at least 6 characters!");
            return;
        }

        if (isLoading) return;
        setIsLoading(true);

        try {
            const res = await login(email, password);
            console.log(res);

            router.push("/loginSuccess");

        } catch (err) {
            showAlert("Please check your email and password!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View className="flex-1 h-full items-center p-4">
                <Text className="text-2xl font-bold mb-6 text-textPrimary text-center">
                    Login to Your Institute
                </Text>

                <Image
                    source={{
                        uri: "https://img.freepik.com/free-vector/access-control-system-abstract-concept-vector-illustration-security-system-authorize-entry-login-credentials-electronic-access-password-passphrase-pin-verification-abstract-metaphor_335657-5746.jpg",
                    }}
                    className="w-full h-80 mb-6"
                    resizeMode="contain"
                />

                <TextInput
                    placeholder="Email"
                    className="bg-surface border border-gray-300 w-full rounded-full px-4 py-3 mb-4 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                />

                <TextInput
                    placeholder="Password"
                    className="bg-surface border border-gray-300 w-full rounded-full px-4 py-3 mb-4 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity
                    className="bg-primary p-4 rounded-full w-3/4 mt-2"
                    onPress={handleLogin}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" size="large" />
                    ) : (
                        <Text className="text-center text-2xl text-white">Login</Text>
                    )}
                </TouchableOpacity>

                <Pressable onPress={() => router.push("/register")}>
                    <Text className="text-center mt-4 text-gray-500">
                        Don't have an account?{" "}
                        <Text className="text-primary">Register</Text>
                    </Text>
                </Pressable>

                {/* Custom Alert */}
                <CustomAlert
                    visible={alertVisible}

                    message={alertMessage}
                    onClose={() => setAlertVisible(false)}
                />
            </View>
        </View>
    );
};

export default Login;
