import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, View } from "react-native"
import { scaleDimension } from "../../utils/responsive"

const DEFAULT_BACKGROUND = "#fff"
const DEFAULT_STATUS_BAR_STYLE = "dark-content"

const keyboardOffsetDefault = Platform.OS === "ios" ? scaleDimension(40) : 0
const androidStatusBarHeight = Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0

export default function AuthScreenLayout({
  children,
  backgroundColor = DEFAULT_BACKGROUND,
  statusBarStyle = DEFAULT_STATUS_BAR_STYLE,
  keyboardOffset = keyboardOffsetDefault,
  safeAreaStyle,
  containerStyle,
  scrollContentStyle,
  contentStyle,
  scrollViewProps,
  loading = false,
  loadingContent = null,
}) {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }, safeAreaStyle]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      {loading ? (
        <View style={[styles.loadingContainer, containerStyle]}>{loadingContent}</View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.container, containerStyle]}
          keyboardVerticalOffset={keyboardOffset}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            {...scrollViewProps}
          >
            <View style={[styles.content, contentStyle]}>{children}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: androidStatusBarHeight,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: scaleDimension(20),
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleDimension(24),
    paddingTop: scaleDimension(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})

