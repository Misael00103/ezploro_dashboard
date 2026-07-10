
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"
import { Text, Button, Card, Title, Paragraph } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import { useState, useEffect } from "react"
import { 
  API_URL_PAYMENTS_PROMOCION_CHECKOUT, 
  API_URL_PAYMENTS_PROMOCION_PRICES 
} from '../config.js';

const windowHeight = Dimensions.get("window").height

export default function PricingModal({ navigation }) {
  const { setPremium, setIsNewUser, user } = useAuth() || {}
  const [prices, setPrices] = useState({ 
    basico: { '1': 5.00, '3': 13.00, '7': 23.00 },
    estandar: { '1': 10.00, '3': 23.00, '7': 43.00 },
    vip: { '1': 20.00, '3': 50.00, '7': 92.00 }
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchPrices()
  }, [])

  const fetchPrices = async () => {
    try {
      console.log('🔗 Fetching prices from:', `${API_URL_PAYMENTS_PROMOCION_PRICES}?moneda=USD`)
      const response = await fetch(`${API_URL_PAYMENTS_PROMOCION_PRICES}?moneda=USD`)
      const data = await response.json()
      
      console.log('📦 Prices response:', data)
      
      if (data.precios) {
        // Mapear todos los precios según tu controlador
        const mappedPrices = {
          basico: {
            '1': data.precios['1_basico']?.precio || 5.00,
            '3': data.precios['3_basico']?.precio || 13.00,
            '7': data.precios['7_basico']?.precio || 23.00
          },
          estandar: {
            '1': data.precios['1_estandar']?.precio || 10.00,
            '3': data.precios['3_estandar']?.precio || 23.00,
            '7': data.precios['7_estandar']?.precio || 43.00
          },
          vip: {
            '1': data.precios['1_vip']?.precio || 20.00,
            '3': data.precios['3_vip']?.precio || 50.00,
            '7': data.precios['7_vip']?.precio || 92.00
          }
        }
        setPrices(mappedPrices)
      }
    } catch (error) {
      console.error('Error fetching prices:', error)
    }
  }

  const handleSubscribe = async (planType, duracion) => {
    console.log(`🚀 Selected plan: ${planType}, duration: ${duracion}`)
    setIsLoading(true)

    const paymentData = {
      duracion: duracion, // '1', '3', o '7' días
      plan: planType, // 'basico', 'estandar', o 'vip'
      eventoId: user?.id || 'app_premium',
      eventoNombre: `Premium App Subscription - ${planType.toUpperCase()}`,
      moneda: 'USD',
      metodo_pago: 'stripe'
    }

    try {
      console.log('🔗 Posting to:', API_URL_PAYMENTS_PROMOCION_CHECKOUT)
      console.log('📦 Payment data:', paymentData)
      
      // Parámetros exactos según tu controlador
      const response = await fetch(API_URL_PAYMENTS_PROMOCION_CHECKOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      })

      const data = await response.json()
      
      if (data.url) {
        console.log('Checkout URL:', data.url)
        console.log('Session ID:', data.sessionId)
        
        // Por ahora simular éxito hasta que implementes WebView
        if (setPremium) {
          setPremium(true)
        }
        if (setIsNewUser) {
          setIsNewUser(false)
        }
        navigation.reset({
          index: 0,
          routes: [{ name: "MainApp" }],
        })
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    if (setIsNewUser) {
      setIsNewUser(false) // Marcar que ya no es usuario nuevo
    }
    navigation.reset({
      index: 0,
      routes: [{ name: "MainApp" }],
    })
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Processing subscription...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Get Premium</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>Unlock the full potential of your experience</Text>

          {/* Feature Cards */}
          <Card style={styles.featureCard}>
            <Card.Content style={styles.featureContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="infinite" size={40} color="#8B5CF6" />
              </View>
              <Title style={styles.featureTitle}>Unlimited Access</Title>
              <Paragraph style={styles.featureDescription}>
                Create unlimited events and join as many as you want
              </Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.featureCard}>
            <Card.Content style={styles.featureContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="megaphone" size={40} color="#8B5CF6" />
              </View>
              <Title style={styles.featureTitle}>Promote Your Events</Title>
              <Paragraph style={styles.featureDescription}>Get featured placement and reach more people</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.featureCard}>
            <Card.Content style={styles.featureContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark" size={40} color="#8B5CF6" />
              </View>
              <Title style={styles.featureTitle}>Ad-Free Experience</Title>
              <Paragraph style={styles.featureDescription}>Enjoy the app without any interruptions</Paragraph>
            </Card.Content>
          </Card>

          {/* Pricing Section */}
          <View style={styles.pricingContainer}>
            {/* Plan Básico */}
            <View style={styles.pricingCard}>
              <Text style={styles.pricingTitle}>Plan Básico</Text>
              <Text style={styles.planDescription}>Evento destacado en su categoría</Text>
              <View style={styles.priceOptions}>
                <TouchableOpacity 
                  style={styles.priceOption} 
                  onPress={() => handleSubscribe("basico", "1")}
                >
                  <Text style={styles.priceText}>${prices.basico['1']}</Text>
                  <Text style={styles.periodText}>1 día</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.priceOption} 
                  onPress={() => handleSubscribe("basico", "3")}
                >
                  <Text style={styles.priceText}>${prices.basico['3']}</Text>
                  <Text style={styles.periodText}>3 días</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.priceOption} 
                  onPress={() => handleSubscribe("basico", "7")}
                >
                  <Text style={styles.priceText}>${prices.basico['7']}</Text>
                  <Text style={styles.periodText}>7 días</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Plan Estándar */}
            <View style={styles.pricingCard}>
              <Text style={styles.pricingTitle}>Plan Estándar</Text>
              <Text style={styles.planDescription}>Destacado en categoría + Página principal</Text>
              <View style={styles.priceOptions}>
                <TouchableOpacity 
                  style={styles.priceOption} 
                  onPress={() => handleSubscribe("estandar", "1")}
                >
                  <Text style={styles.priceText}>${prices.estandar['1']}</Text>
                  <Text style={styles.periodText}>1 día</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.priceOption} 
                  onPress={() => handleSubscribe("estandar", "3")}
                >
                  <Text style={styles.priceText}>${prices.estandar['3']}</Text>
                  <Text style={styles.periodText}>3 días</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.priceOption} 
                  onPress={() => handleSubscribe("estandar", "7")}
                >
                  <Text style={styles.priceText}>${prices.estandar['7']}</Text>
                  <Text style={styles.periodText}>7 días</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Plan VIP - Recomendado */}
            <View style={[styles.pricingCard, styles.recommendedCard]}>
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>RECOMMENDED</Text>
              </View>
              <Text style={styles.pricingTitle}>Plan VIP</Text>
              <Text style={styles.planDescription}>Destacado + Página principal + Notificaciones push</Text>
              <View style={styles.priceOptions}>
                <TouchableOpacity 
                  style={styles.priceOption} 
                  onPress={() => handleSubscribe("vip", "1")}
                >
                  <Text style={styles.priceText}>${prices.vip['1']}</Text>
                  <Text style={styles.periodText}>1 día</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.priceOption} 
                  onPress={() => handleSubscribe("vip", "3")}
                >
                  <Text style={styles.priceText}>${prices.vip['3']}</Text>
                  <Text style={styles.periodText}>3 días</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.priceOption, styles.bestValue]} 
                  onPress={() => handleSubscribe("vip", "7")}
                >
                  <Text style={styles.savingTag}>BEST VALUE</Text>
                  <Text style={styles.priceText}>${prices.vip['7']}</Text>
                  <Text style={styles.periodText}>7 días</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.termsText}>
            Payment will be charged to your account. Subscription automatically renews unless canceled at least 24 hours
            before the end of the current period.
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: "#8B5CF6",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 24,
    textAlign: "center",
    color: "#6B7280",
  },
  featureCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 0,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  featureContent: {
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  featureDescription: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
  },
  pricingContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  pricingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  recommendedCard: {
    borderColor: "#8B5CF6",
    borderWidth: 2,
  },
  recommendedBadge: {
    position: "absolute",
    top: -10,
    left: 20,
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  pricingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  savingTag: {
    backgroundColor: "#10B981",
    color: "white",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "600",
  },
  price: {
    fontSize: 32,
    fontWeight: "bold",
    marginVertical: 8,
    color: "#1F2937",
  },
  period: {
    fontSize: 18,
    fontWeight: "normal",
    color: "#6B7280",
  },
  pricingDescription: {
    color: "#6B7280",
    fontSize: 14,
    marginBottom: 16,
  },
  subscribeButton: {
    borderRadius: 12,
    backgroundColor: "#8B5CF6",
    paddingVertical: 4,
  },
  subscribeButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  monthlyButton: {
    borderRadius: 12,
    borderColor: "#8B5CF6",
    paddingVertical: 4,
  },
  monthlyButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  planDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    textAlign: "center",
  },
  priceOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  priceOption: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  bestValue: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  periodText: {
    fontSize: 12,
    color: "#6B7280",
  },
  termsText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
})
