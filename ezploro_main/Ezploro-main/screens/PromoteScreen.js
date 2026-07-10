import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL_PAYMENTS_PROMOCION_PRICES } from '../config.js';

export default function PromoteScreen({ navigation }) {

  const toolsOptions = [
    {
      id: "1",
      title: "Promote your event",
      onPress: () => navigation.navigate("PricingModal"),
    },
  ]


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.title}>Promote your event</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.promoBox}>
          <Text style={styles.promoTitle}>Promociona tu evento</Text>
          <Text style={styles.promoText}>Llega a más personas con nuestras herramientas de promoción. ¡Haz que tu evento sea un éxito!</Text>
          <TouchableOpacity style={styles.promoBtn} onPress={() => navigation.navigate("PricingModal")}>
            <Text style={styles.promoBtnText} >Ver opciones de promoción</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.commentsBox}>
          <Text style={styles.commentsTitle}>Comentarios</Text>
          <View style={styles.commentRow}>
            <Ionicons name="person-circle" size={32} color="#4F8EF7" style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.commentUser}>Usuario 1</Text>
              <Text style={styles.commentText}>¡Me ayudó mucho a llenar mi evento!</Text>
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
  promoBox: { backgroundColor: '#f4f8ff', borderRadius: 16, padding: 18, marginBottom: 24, alignItems: 'center' },
  promoTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 8 },
  promoText: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 14 },
  promoBtn: { backgroundColor: '#4F8EF7', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24 },
  promoBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  commentsBox: { marginTop: 10 },
  commentsTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 10 },
  commentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  commentUser: { fontWeight: 'bold', color: '#222', fontSize: 14 },
  commentText: { color: '#444', fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: { flex: 1, backgroundColor: '#f0f4ff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, color: '#222' },
  sendBtn: { backgroundColor: '#4F8EF7', borderRadius: 12, padding: 10 },
}); 