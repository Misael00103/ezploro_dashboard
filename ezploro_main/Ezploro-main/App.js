import { useEffect } from "react"
import ErrorBoundary from "./components/ErrorBoundary"
import NetworkStatusMonitor from "./components/NetworkStatusMonitor"
import { AuthProvider } from "./context/AuthContext"
import { ChatProvider } from "./context/ChatContext"
import { EventProvider } from "./context/EventContext"
import { NotificationsProvider } from "./context/NotificationsContext"
import { SocketProvider } from "./context/SocketContext"
import { ThemeProvider } from "./context/ThemeContext"
import "./i18n"
import AppNavigator from "./navigation/AppNavigator"
import { GuestRestrictionProvider } from "./context/GuestRestrictionContext"
import { LocationProvider } from "./context/LocationContext"
import googleSignInService from "./services/googleSignInService"

export default function App() {
  useEffect(() => {
    // Inicializar Google Sign-In al arrancar la app
    try {
      googleSignInService.configure()
      console.log('✅ Google Sign-In inicializado correctamente')
    } catch (error) {
      console.error('❌ Error inicializando Google Sign-In:', error)
    }
  }, [])

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NetworkStatusMonitor>
          <AuthProvider>
            <NotificationsProvider>
              <EventProvider>
                <LocationProvider>
                  <ChatProvider>
                    <SocketProvider>
                      <GuestRestrictionProvider>
                        <AppNavigator />
                      </GuestRestrictionProvider>
                    </SocketProvider>
                  </ChatProvider>
                </LocationProvider>
              </EventProvider>
            </NotificationsProvider>
          </AuthProvider>
        </NetworkStatusMonitor>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
