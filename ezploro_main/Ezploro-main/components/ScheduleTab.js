import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export const ScheduleTab = ({ event, formatTime }) => {
  const { user, isGuest } = useAuth();
  
  // Verificar si es usuario guest
  const isGuestUser = isGuest || user?.role === 'guest' || user?.is_guest || user?.user_id?.toString().startsWith('guest_');
  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { 
      weekday: "long",
      day: "numeric", 
      month: "long", 
      year: "numeric" 
    })
  }

  const getEventDuration = () => {
    if (!event?.date_time) return "Duration not specified"
    
    // Si hay end_time, calcular duración
    if (event.end_time) {
      const start = new Date(event.date_time)
      const end = new Date(event.end_time)
      const diffMs = end - start
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      
      if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes > 0 ? diffMinutes + 'm' : ''}`
      } else {
        return `${diffMinutes}m`
      }
    }
    
    // Duración por defecto
    return "2-3 hours (estimated)"
  }

  // Si es usuario guest, mostrar información limitada
  if (isGuestUser) {
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.tabTitle}>Event Schedule</Text>
        <View style={styles.guestRestrictionContainer}>
          <Ionicons name="time" size={48} color="#8B5CF6" />
          <Text style={styles.guestRestrictionTitle}>Horario Restringido</Text>
          <Text style={styles.guestRestrictionDescription}>
            Para ver la fecha y hora exacta del evento, necesitas crear una cuenta.
          </Text>
          <TouchableOpacity style={styles.createAccountButton}>
            <Text style={styles.createAccountButtonText}>Crear Cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.tabTitle}>Event Schedule</Text>
      
      <View style={styles.scheduleContainer}>
        <View style={styles.scheduleItem}>
          <View style={styles.iconContainer}>
            <Ionicons name="calendar" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleLabel}>Date</Text>
            <Text style={styles.scheduleValue}>
              {formatDate(event?.date_time)}
            </Text>
          </View>
        </View>

        <View style={styles.scheduleItem}>
          <View style={styles.iconContainer}>
            <Ionicons name="time" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleLabel}>Start Time</Text>
            <Text style={styles.scheduleValue}>
              {formatTime ? formatTime(event?.date_time) : "Time not specified"}
            </Text>
          </View>
        </View>

        {event?.end_time && (
          <View style={styles.scheduleItem}>
            <View style={styles.iconContainer}>
              <Ionicons name="time-outline" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleLabel}>End Time</Text>
              <Text style={styles.scheduleValue}>
                {formatTime ? formatTime(event.end_time) : "End time not specified"}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.scheduleItem}>
          <View style={styles.iconContainer}>
            <Ionicons name="hourglass" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleLabel}>Duration</Text>
            <Text style={styles.scheduleValue}>
              {getEventDuration()}
            </Text>
          </View>
        </View>

        {event?.timezone && (
          <View style={styles.scheduleItem}>
            <View style={styles.iconContainer}>
              <Ionicons name="globe" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleLabel}>Timezone</Text>
              <Text style={styles.scheduleValue}>
                {event.timezone}
              </Text>
            </View>
          </View>
        )}
      </View>

      {event?.agenda && event.agenda.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Event Agenda</Text>
          <View style={styles.agendaContainer}>
            {event.agenda.map((item, index) => (
              <View key={`agenda_${index}`} style={styles.agendaItem}>
                <View style={styles.agendaTime}>
                  <Text style={styles.agendaTimeText}>
                    {item.time || `${index + 1}.`}
                  </Text>
                </View>
                <View style={styles.agendaContent}>
                  <Text style={styles.agendaTitle}>
                    {item.title || item.activity || "Activity"}
                  </Text>
                  {item.description && (
                    <Text style={styles.agendaDescription}>
                      {item.description}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {(!event?.agenda || event.agenda.length === 0) && (
        <View style={styles.noAgendaContainer}>
          <Ionicons name="list-outline" size={48} color="#666" />
          <Text style={styles.noAgendaText}>No detailed agenda available</Text>
          <Text style={styles.noAgendaSubtext}>
            Check back later for event schedule details
          </Text>
        </View>
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
  scheduleContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  scheduleValue: {
    fontSize: 16,
    color: "#0F0F23",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0F0F23",
    marginBottom: 16,
  },
  agendaContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
  },
  agendaItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  agendaTime: {
    width: 60,
    alignItems: "center",
    marginRight: 16,
  },
  agendaTimeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5CF6",
    backgroundColor: "#F3F0FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textAlign: "center",
    minWidth: 50,
  },
  agendaContent: {
    flex: 1,
  },
  agendaTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F0F23",
    marginBottom: 4,
  },
  agendaDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  noAgendaContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noAgendaText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  noAgendaSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  guestRestrictionContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    marginTop: 20,
  },
  guestRestrictionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8B5CF6",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  guestRestrictionDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  createAccountButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  createAccountButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})