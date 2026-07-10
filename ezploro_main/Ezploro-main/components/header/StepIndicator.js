import { View, Text, StyleSheet } from "react-native"

const PRIMARY_COLOR = "#4A90E2"
const TEXT_SECONDARY = "#B8B8D9"

export default function StepIndicator({ currentStep = 1, totalSteps = 3 }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <View key={step} style={[styles.step, currentStep >= step && styles.activeStep]}>
          <Text style={[styles.stepText, currentStep >= step && styles.activeStepText]}>{step}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  step: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeStep: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stepText: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_SECONDARY,
  },
  activeStepText: {
    color: "#fff",
  },
})
