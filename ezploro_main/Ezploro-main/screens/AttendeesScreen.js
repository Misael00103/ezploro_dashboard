import React from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'

export default function AttendeesScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Attendees</Text>
        <Text style={styles.text}>Aquí verás la lista de asistentes a tus eventos.</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#4F8EF7', marginBottom: 16 },
  text: { fontSize: 16, color: '#666', textAlign: 'center' },
})
