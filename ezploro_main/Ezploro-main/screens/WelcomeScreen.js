
import { useTranslation } from "react-i18next";
import {
  ImageBackground,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import WelcomeButtons from "../components/welcome/WelcomeButtons";
import { useAuth } from "../context/AuthContext";

// Using SCREEN_WIDTH and SCREEN_HEIGHT from layout constants

export default function WelcomeScreen({ navigation }) {
  const { t } = useTranslation()
  const { loginWithFacebook, loginAsInvited, loading } = useAuth()

  const handleEmailLogin = () => {
    navigation.navigate("Login")
  }

  const handleFacebookLogin = async () => {
    try {
      const result = await loginWithFacebook()
      if (result && !result.success) {
        console.error("Facebook login failed:", result.error)
      }
    } catch (error) {
      console.error("Facebook login error:", error)
    }
  }

  const handleGuestLogin = async () => {
    try {
      const result = await loginAsInvited()
      if (result && !result.success) {
        console.error("Guest login failed:", result.error)
      }
    } catch (error) {
      console.error("Guest login error:", error)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.textContainer}>
            
              <Text style={styles.title}>Let get started</Text>
              <Text style={styles.subtitle}>Sign up or log in to see what's happening near you</Text>
            </View>

            <WelcomeButtons
              onEmailLogin={handleEmailLogin}
              onFacebookLogin={handleFacebookLogin}
              onGuestLogin={handleGuestLogin}
              loading={loading}
            />

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By signing up or logging in, I accept the Eventie <Text style={styles.linkText}>Terms of Service</Text>{" "}
                and <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  content: {
    paddingHorizontal: 24,
            paddingBottom: Platform.OS === "ios" ? 50 : 30,
  },
  textContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  termsContainer: {
    alignItems: "center",
  },
  termsText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 18,
  },
  linkText: {
    color: "#8B5CF6",
    fontWeight: "500",
  },
})
