import React, { useEffect, useState } from "react"
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Text,
  Dimensions,
  StatusBar,
  FlatList,
  ImageBackground,
  Modal,
  Alert,
  Share,
  Linking,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { normalizeImageUrl } from "../utils/image"
import { LinearGradient } from "expo-linear-gradient"
import { useAuth } from "../context/AuthContext"
import offerService from "../services/offerService"

const windowWidth = Dimensions.get("window").width
const windowHeight = Dimensions.get("window").height

export default function OfferDetailsScreen({ route, navigation }) {
  const { user } = useAuth()
  
  let { offer } = route.params || {}

  // Validate offer
  if (!offer || !offer.id) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <Text style={{ color: "#FF4757", fontSize: 18, textAlign: "center", margin: 20 }}>
          Error: La oferta no tiene un ID válido. No se puede mostrar la información.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20, padding: 12, backgroundColor: "#6200EE", borderRadius: 10 }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Volver</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const [modalText, setModalText] = useState("")
  const [fullOffer, setFullOffer] = useState(offer || {})
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("About")
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claimedCount, setClaimedCount] = useState(offer?.claimedCount || 0)
  const [isClaimed, setIsClaimed] = useState(false)

  const handleClaim = async () => {
    if (!user?.user_id) {
      Alert.alert("Error", "Debes iniciar sesión para reclamar esta oferta")
      return
    }
    
    try {
      setLoading(true)
      
      // Si la oferta tiene código promocional, usarlo
      if (offer.promoCode) {
        const response = await offerService.usePromoCode(offer.promoCode, user.user_id)
        setModalText(`¡Código ${offer.promoCode} aplicado exitosamente!`)
      } else {
        // Simular reclamación de oferta sin código
        await new Promise(resolve => setTimeout(resolve, 1000))
        setModalText("¡Oferta reclamada exitosamente!")
      }
      
      setClaimedCount(prev => prev + 1)
      setIsClaimed(true)
      setShowClaimModal(true)
      setTimeout(() => setShowClaimModal(false), 2000)
      
      console.log("✅ Oferta reclamada exitosamente")
    } catch (error) {
      const errorMessage = error.message || "Ocurrió un error al reclamar la oferta"
      Alert.alert("Error", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      const offerUrl = `https://yourapp.com/offers/${offer.id}`
      const message = `Check out this offer: ${fullOffer.title}\n${offerUrl}`
      await Share.share({ message, url: offerUrl, title: fullOffer.title })
    } catch (error) {
      Alert.alert("Error", "No se pudo compartir la oferta")
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "Details":
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.tabTitle}>Offer Details</Text>
            <Text style={styles.tabDescription}>{fullOffer?.description || "No description available."}</Text>
            
            <Text style={styles.sectionTitle}>Offer Information</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Ionicons name="pricetag" size={20} color="#8B5CF6" />
                <Text style={styles.detailText}>
                  Points Required: {fullOffer?.points || "N/A"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="business" size={20} color="#8B5CF6" />
                <Text style={styles.detailText}>
                  Company: {fullOffer?.company || "N/A"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={20} color="#8B5CF6" />
                <Text style={styles.detailText}>
                  Valid Until: {fullOffer?.validUntil ? formatDate(fullOffer.validUntil) : "No expiration"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="people" size={20} color="#8B5CF6" />
                <Text style={styles.detailText}>
                  Claimed by: {claimedCount} people
                </Text>
              </View>
            </View>

            {fullOffer?.terms && (
              <>
                <Text style={styles.sectionTitle}>Terms & Conditions</Text>
                <Text style={styles.tabDescription}>{fullOffer.terms}</Text>
              </>
            )}
          </ScrollView>
        )
      case "About":
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.tabTitle}>About This Offer</Text>
            <Text style={styles.tabDescription}>{fullOffer?.description || "No description available."}</Text>
            
            {fullOffer?.company && (
              <>
                <Text style={styles.sectionTitle}>About {fullOffer.company}</Text>
                <Text style={styles.tabDescription}>
                  {fullOffer?.companyDescription || "Learn more about this company and their amazing offers."}
                </Text>
              </>
            )}

            <Text style={styles.sectionTitle}>How to Claim</Text>
            <View style={styles.stepsContainer}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>Tap the "Claim Offer" button below</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>Complete the required actions</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>Enjoy your reward!</Text>
              </View>
            </View>
          </ScrollView>
        )
      case "Reviews":
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.tabTitle}>Reviews ({fullOffer?.reviews?.length || 0})</Text>
            {fullOffer?.reviews && fullOffer.reviews.length > 0 ? (
              fullOffer.reviews.map((review, index) => (
                <View key={index} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.userName || "Anonymous"}</Text>
                    <View style={styles.ratingContainer}>
                      {[...Array(5)].map((_, i) => (
                        <Ionicons
                          key={i}
                          name={i < review.rating ? "star" : "star-outline"}
                          size={16}
                          color="#FFD700"
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{review.comment}</Text>
                  <Text style={styles.reviewDate}>{formatDate(review.date)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="star-outline" size={48} color="#666" />
                <Text style={styles.emptyText}>No reviews yet</Text>
                <Text style={styles.emptySubtext}>Be the first to review this offer!</Text>
              </View>
            )}
          </ScrollView>
        )
      default:
        return null
    }
  }

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.gradientContainer}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <ImageBackground
          source={{ uri: normalizeImageUrl(fullOffer?.image || "https://via.placeholder.com/400x600") }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <LinearGradient colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]} style={styles.overlay}>
            <SafeAreaView style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                  <Ionicons name="share-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
            <View style={styles.offerContent}>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>{fullOffer?.points}</Text>
                <Text style={styles.pointsLabel}>POINTS</Text>
              </View>
              <Text style={styles.offerTitle}>{fullOffer?.title || "Offer Title"}</Text>
              <Text style={styles.offerDescription} numberOfLines={3}>
                {fullOffer?.description || "Offer description will appear here..."}
              </Text>
              
              <View style={styles.offerInfo}>
                <View style={styles.infoItem}>
                  <Ionicons name="business-outline" size={16} color="#fff" />
                  <Text style={styles.infoText}>{fullOffer?.company || "Company"}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="people-outline" size={16} color="#fff" />
                  <Text style={styles.infoText}>{claimedCount} claimed</Text>
                </View>
                {fullOffer?.validUntil && (
                  <View style={styles.infoItem}>
                    <Ionicons name="time-outline" size={16} color="#fff" />
                    <Text style={styles.infoText}>Expires {formatDate(fullOffer.validUntil)}</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.bottomSheet}>
          <View style={styles.tabNavigation}>
            {["About", "Details", "Reviews"].map((tab, index) => (
              <TouchableOpacity
                key={`nav_tab_${tab}_${index}_${Date.now()}`}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.tabContentContainer}>
            {renderTabContent()}
          </View>
          <View style={styles.claimButtonContainer}>
            <TouchableOpacity
              style={[styles.claimButton, isClaimed && styles.claimedButton]}
              onPress={handleClaim}
              disabled={loading || isClaimed}
            >
              <LinearGradient
                colors={isClaimed ? ["#4CAF50", "#45A049"] : ["#8B5CF6", "#7C3AED"]}
                style={styles.claimButtonGradient}
              >
                <Ionicons
                  name={isClaimed ? "checkmark-circle" : "gift"}
                  size={20}
                  color="#fff"
                  style={styles.claimButtonIcon}
                />
                <Text style={styles.claimButtonText}>
                  {loading ? "Processing..." : isClaimed ? "Claimed!" : "Claim Offer"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={showClaimModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.successModal}>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
              <Text style={styles.modalText}>{modalText}</Text>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundImage: {
    width: windowWidth,
    height: windowHeight * 0.65,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 60,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  offerContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  pointsBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  pointsText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  pointsLabel: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    opacity: 0.8,
  },
  offerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    lineHeight: 38,
  },
  offerDescription: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
    lineHeight: 24,
    marginBottom: 24,
  },
  offerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "500",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flex: 1,
    marginTop: -30,
  },
  tabNavigation: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#8B5CF6",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "600",
  },
  tabContentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
  },
  tabDescription: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginTop: 24,
    marginBottom: 12,
  },
  detailsContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
    flex: 1,
  },
  stepsContainer: {
    marginTop: 16,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  stepNumberText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  stepText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  reviewItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  ratingContainer: {
    flexDirection: "row",
  },
  reviewText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: "#999",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  claimButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  claimButton: {
    borderRadius: 25,
    overflow: "hidden",
  },
  claimedButton: {
    opacity: 0.7,
  },
  claimButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  claimButtonIcon: {
    marginRight: 8,
  },
  claimButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginHorizontal: 40,
  },
  modalText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 16,
    color: "#333",
  },
})
