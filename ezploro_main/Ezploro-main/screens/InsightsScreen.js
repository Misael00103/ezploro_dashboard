import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function InsightsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.title}>Insights</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statsBox}>
          <Text style={styles.statsTitle}>Estadísticas de tus eventos</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Eventos creados</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>1.2k</Text>
              <Text style={styles.statLabel}>Asistentes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>Satisfacción</Text>
            </View>
          </View>
          <View style={styles.graphDummy}>
            <Text style={styles.graphText}>[Gráfico de ejemplo]</Text>
          </View>
        </View>
        <View style={styles.commentsBox}>
          <Text style={styles.commentsTitle}>Comentarios recientes</Text>
          <View style={styles.commentRow}>
            <Ionicons name="person-circle" size={32} color="#4F8EF7" style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.commentUser}>Maria Victoria</Text>
              <Text style={styles.commentText}>¡Excelente evento y organización!</Text>
            </View>
          </View>
          <View style={styles.commentRow}>
            <Ionicons name="person-circle" size={32} color="#4F8EF7" style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.commentUser}>Misael Matos</Text>
              <Text style={styles.commentText}>Muy buena experiencia, repetiría.</Text>
            </View>
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputRow}>
            <TextInput style={styles.input} placeholder="Escribe un comentario..." placeholderTextColor="#999" />
            <TouchableOpacity style={styles.sendBtn}>
              <Ionicons name="send" size={22} color="#fff" />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 18, paddingBottom: 0 },
  backBtn: { marginRight: 10, padding: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#4F8EF7', flex: 1 },
  scrollContent: { padding: 20, paddingTop: 10 },
  statsBox: { backgroundColor: '#f4f8ff', borderRadius: 16, padding: 18, marginBottom: 24 },
  statsTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  statCard: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#4F8EF7' },
  statLabel: { fontSize: 13, color: '#666', marginTop: 2 },
  graphDummy: { backgroundColor: '#e6edff', borderRadius: 12, height: 120, alignItems: 'center', justifyContent: 'center' },
  graphText: { color: '#4F8EF7', fontWeight: 'bold' },
  commentsBox: { marginTop: 10 },
  commentsTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 10 },
  commentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  commentUser: { fontWeight: 'bold', color: '#222', fontSize: 14 },
  commentText: { color: '#444', fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: { flex: 1, backgroundColor: '#f0f4ff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, color: '#222' },
  sendBtn: { backgroundColor: '#4F8EF7', borderRadius: 12, padding: 10 },
}); 