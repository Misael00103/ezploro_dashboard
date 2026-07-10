import React from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'

const ChatLoadingState = ({ 
  message = "Loading messages...", 
  darkMode = false 
}) => {
  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text style={[styles.message, darkMode && styles.messageDark]}>
        {message}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  messageDark: {
    color: '#9CA3AF',
  },
})

export default ChatLoadingState