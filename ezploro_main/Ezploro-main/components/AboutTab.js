import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"

export const AboutTab = ({ event, isOnlineEvent }) => {
  const [expandedFaq, setExpandedFaq] = useState(null)
  
  // Ensure faqs is always an array
  const faqs = Array.isArray(event?.faqs) ? event.faqs : []
  
  console.log("🔍 AboutTab faqs:", {
    eventFaqs: event?.faqs,
    processedFaqs: faqs,
    isArray: Array.isArray(faqs),
    length: faqs.length,
    willShowFaqs: faqs.length > 0,
    sampleFaq: faqs[0]
  })

  // Log para depurar el valor de event.faqs
  console.log('AboutTab: event.faqs =', event?.faqs, 'Type:', typeof event?.faqs)

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.tabTitle}>About Event</Text>
      <Text style={styles.tabDescription}>{event?.description || "No description available."}</Text>

      {event?.resume && (
        <>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.tabDescription}>{event.resume}</Text>
        </>
      )}

      <Text style={styles.sectionTitle}>Event Details</Text>
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="pricetag" size={20} color="#8B5CF6" />
          <Text style={styles.detailText}>Price: {event?.price === 0 ? "Free" : `$${event?.price || "N/A"}`}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="albums" size={20} color="#8B5CF6" />
          <Text style={styles.detailText}>
            Category: {event?.category?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "N/A"}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name={isOnlineEvent(event) ? "laptop" : "location"} size={20} color="#8B5CF6" />
          <Text style={styles.detailText}>Type: {isOnlineEvent(event) ? "Online Event" : "In-Person Event"}</Text>
        </View>
        {!isOnlineEvent(event) && event?.address && (
          <View style={styles.detailRow}>
            <Ionicons name="home" size={20} color="#8B5CF6" />
            <Text style={styles.detailText}>Address: {event.address}</Text>
          </View>
        )}
        {!isOnlineEvent(event) && event?.city && (
          <View style={styles.detailRow}>
            <Ionicons name="business" size={20} color="#8B5CF6" />
            <Text style={styles.detailText}>City: {event.city}</Text>
          </View>
        )}
        {!isOnlineEvent(event) && event?.state && (
          <View style={styles.detailRow}>
            <Ionicons name="map" size={20} color="#8B5CF6" />
            <Text style={styles.detailText}>State: {event.state}</Text>
          </View>
        )}
        {!isOnlineEvent(event) && event?.country && (
          <View style={styles.detailRow}>
            <Ionicons name="earth" size={20} color="#8B5CF6" />
            <Text style={styles.detailText}>Country: {event.country}</Text>
          </View>
        )}
      </View>

      {Array.isArray(event?.faqs) && event.faqs.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {event.faqs.map((faq, index) => (
            <TouchableOpacity
              key={`faq_${index}`}
              style={styles.faqItem}
              onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
              activeOpacity={0.8}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons name={expandedFaq === index ? "chevron-up" : "chevron-down"} size={22} color="#8B5CF6" />
              </View>
              {expandedFaq === index && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F0F23",
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
    color: "#0F0F23",
    marginTop: 24,
    marginBottom: 12,
  },
  detailsContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
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
  faqItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F0F23",
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: "#666",
    marginTop: 12,
    lineHeight: 20,
  },
})
