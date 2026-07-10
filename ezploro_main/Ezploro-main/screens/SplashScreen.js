import { View, StyleSheet, ActivityIndicator, SafeAreaView, Platform, StatusBar } from "react-native"
import { SCREEN_HEIGHT as windowHeight } from "../constants/layout"
import { Text } from "react-native-paper"

// Using SCREEN_HEIGHT from layout constants

export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Events App</Text>
        <ActivityIndicator size="large" color="#4F8EF7" style={styles.loader} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
})
