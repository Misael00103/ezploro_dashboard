import { useEffect, useRef } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import { Animated, TouchableOpacity, View, StyleSheet, Dimensions } from "react-native"
import { useAuth } from "../context/AuthContext"
import { useEvents } from "../context/EventContext"
import GlobalLoading from "../components/GlobalLoading"
import { pushNotifications } from "../utils/pushNotifications"
import HomeScreen from "../screens/HomeScreen"
import EventsScreen from "../screens/EventsScreen"
import EventsListScreen from "../screens/EventsListScreen"
import EventDetailsScreen from "../screens/EventDetailsScreen"
import CreateEventScreen from "../screens/CreateEventScreen"
import EditEventScreen from "../screens/EditEventScreen"
import DraftsScreen from "../screens/DraftsScreen"
import SettingsScreen from "../screens/SettingsScreen"
import ProfileScreen from "../screens/ProfileScreen"
import WelcomeScreen from "../screens/WelcomeScreen"
import LoginScreen from "../screens/LoginScreen"
import SignUpScreen from "../screens/SignUpScreen"
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen"
import ConfirmResetPinScreen from "../screens/ConfirmResetPinScreen"
import ResetPasswordScreen from "../screens/ResetPasswordScreen"
import PasswordChangedConfirmationScreen from "../screens/PasswordChangedConfirmationScreen"
import MapScreen from "../screens/MapScreen"
import RankingScreen from "../screens/RankingScreen"
import NotificationInvitation from "../screens/NotificationInvitation"
import NotificationJoin from "../screens/NotificationJoin"
import NotificationReminder from "../screens/NotificationReminder"
import NotificationLike from "../screens/NotificationLike"
import NotificationComment from "../screens/NotificationComment"
import PromoteScreen from "../screens/PromoteScreen"
import AttendeesScreen from "../screens/AttendeesScreen"
import HelpCenterScreen from "../screens/HelpCenterScreen"
import InsightsScreen from "../screens/InsightsScreen"
import PricingModal from "../screens/PricingModal"
import ChatScreen from "../screens/ChatScreen"
import PersonalChatScreen from "../screens/PersonalChatScreen"
import PersonalChatsListScreen from "../screens/PersonalChatsListScreen"
import OnboardingScreen from "../screens/OnboardingScreen"
import ChatMainScreen from "../screens/ChatMainScreen"
import GroupChatListScreen from "../screens/GroupChatListScreen"
import AddPersonScreen from "../screens/AddPersonScreen"
import OffersListScreen from "../screens/OffersListScreen"
import OfferDetailsScreen from "../screens/OfferDetailsScreen"
import CreateGroupScreen from "../screens/CreateGroupScreen"
import OtherProfileScreen from '../screens/OtherProfileScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import BookmarksListScreen from "../screens/BookmarksListScreen"
import BlockedUsersScreen from '../screens/BlockedUsersScreen'
import ContactUsScreen from '../screens/ContactUsScreen'
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen'
import EventsYoureHostingScreen from '../screens/EventsYoureHostingScreen'
import AvailableGroupsScreen from "../screens/AvailableGroupsScreen"
import ChangePasswordScreen from "../screens/ChangePasswordScreen"
import EmailNotificationsScreen from "../screens/EmailNotificationsScreen"
import TermsOfServiceScreen from "../screens/TermsOfServiceScreen"
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen"

// Consistent color palette
const PRIMARY_COLOR = '#4A90E2'
const ACCENT_COLOR = '#8B5CF6'
const BACKGROUND_DARK = '#0F0F23'
const CARD_BACKGROUND_DARK = '#1F222A'
const TEXT_PRIMARY_DARK = '#fff'
const TEXT_SECONDARY_DARK = '#B8B8D9'
const DIVIDER_COLOR_DARK = '#3A3F47'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()
const { width: SCREEN_WIDTH } = Dimensions.get('window')

function CustomTabBar({ state, descriptors, navigation }) {
  const animationValue = useRef(new Animated.Value(state.index)).current
  const numberOfTabs = state.routes.length

  // Cálculo más preciso del ancho
  const tabBarPadding = 12 // padding interno total (6px cada lado)
  const tabBarMargin = 30 // margin total (15px cada lado)
  const availableWidth = SCREEN_WIDTH - tabBarMargin - tabBarPadding
  const tabWidth = availableWidth / numberOfTabs

  useEffect(() => {
    Animated.spring(animationValue, {
      toValue: state.index,
      friction: 9,
      tension: 60,
      useNativeDriver: true,
    }).start()
  }, [state.index])

  // El activeTab debe cubrir completamente cada tab
  const activeTabWidth = tabWidth
  const activeTabHeight = 46

  const translateX = animationValue.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => {
      // Posición exacta: índice del tab * ancho del tab
      return i * tabWidth
    }),
  })

  return (
    <View style={styles.tabBar}>
      <Animated.View
        style={[
          styles.activeTab,
          {
            width: activeTabWidth,
            height: activeTabHeight,
            transform: [{ translateX }],
          },
        ]}
      />
      {state.routes.map((route, index) => {
        const isFocused = state.index === index
        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          })
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name)
          }
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[styles.tabButton, { width: tabWidth }]}
            activeOpacity={0.7}
          >
            <Ionicons
              name={getIcon(route.name, isFocused)}
              size={28}
              color={isFocused ? "#fff" : "#888"}
            />
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: CARD_BACKGROUND_DARK,
    borderRadius: 30,
    height: 75,
    paddingVertical: 12,
    paddingHorizontal: 6,
    position: "absolute",
    bottom: 25,
    left: 15,
    right: 15,
    flexDirection: "row",
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  tabButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    zIndex: 2,
    minHeight: 50,
  },
  activeTab: {
    position: "absolute",
    top: 14.5,
    left: 6, // Alineado con el padding del tabBar
    backgroundColor: ACCENT_COLOR,
    borderRadius: 23,
    zIndex: 1,
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
})

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="MapScreen" component={MapScreen} />
      <Tab.Screen name="Chat" component={ChatMainScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const getIcon = (routeName, focused) => {
  switch (routeName) {
    case "Home":
      return focused ? "home" : "home-outline"
    case "Notifications":
      return focused ? "notifications" : "notifications-outline"
    case "Events":
      return focused ? "calendar" : "calendar-outline"
    case "MapScreen":
      return focused ? "map" : "map-outline"
    case "Chat":
      return focused ? "chatbubbles" : "chatbubbles-outline"
    case "Profile":
      return focused ? "person" : "person-outline"
    case "Discover":
      return focused ? "globe" : "globe-outline"
    default:
      return "home-outline"
  }
}

export default function AppNavigator() {
  const { user, loading: authLoading, hasPremium, isNewUser } = useAuth()
  const { loading: eventsLoading } = useEvents()

  // Inicializar notificaciones cuando el usuario esté autenticado
  useEffect(() => {
    if (user && !authLoading) {
      pushNotifications.registerForPushNotifications()
    }
  }, [user, authLoading])

  if (authLoading || (user && eventsLoading)) {
    return <GlobalLoading />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Lógica de navegación para usuarios autenticados
          // 1. Si es usuario nuevo SIN bio -> Onboarding
          // 2. Si es usuario nuevo CON bio -> Pricing (si no tiene premium)
          // 3. Si es usuario existente -> App principal
          (isNewUser && (user.bio === null || user.bio === undefined)) ? (
            <>
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen name="MainApp" component={MainTabs} />
              <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
              <Stack.Screen name="EventsList" component={EventsListScreen} />
              <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
              <Stack.Screen name="EditEvent" component={EditEventScreen} />
              <Stack.Screen name="DraftsScreen" component={DraftsScreen} />
              <Stack.Screen name="EventsYoureHosting" component={EventsYoureHostingScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="BookmarksList" component={BookmarksListScreen} />
              <Stack.Screen name="MapScreen" component={MapScreen} />
              <Stack.Screen name="RankingScreen" component={RankingScreen} />
              <Stack.Screen name="PromoteScreen" component={PromoteScreen} />
              <Stack.Screen name="AttendeesScreen" component={AttendeesScreen} />
              <Stack.Screen name="HelpCenterScreen" component={HelpCenterScreen} />
              <Stack.Screen name="InsightsScreen" component={InsightsScreen} />
              <Stack.Screen name="NotificationInvitation" component={NotificationInvitation} />
              <Stack.Screen name="NotificationJoin" component={NotificationJoin} />
              <Stack.Screen name="NotificationReminder" component={NotificationReminder} />
              <Stack.Screen name="NotificationLike" component={NotificationLike} />
              <Stack.Screen name="NotificationComment" component={NotificationComment} />
              <Stack.Screen name="ChatScreen" component={ChatScreen} />
              <Stack.Screen name="PersonalChatScreen" component={PersonalChatScreen} />
              <Stack.Screen name="PersonalChatsListScreen" component={PersonalChatsListScreen} />
              <Stack.Screen name="GroupChatListScreen" component={GroupChatListScreen} />
              <Stack.Screen name="AddPersonScreen" component={AddPersonScreen} />
              <Stack.Screen name="CreateGroupScreen" component={CreateGroupScreen} />
              <Stack.Screen name="OtherProfile" component={OtherProfileScreen} />
              <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
              <Stack.Screen name="ContactUs" component={ContactUsScreen} />
              <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
              <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
              <Stack.Screen name="OffersList" component={OffersListScreen} />
              <Stack.Screen name="OfferDetails" component={OfferDetailsScreen} />
              <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
              <Stack.Screen name="EmailNotifications" component={EmailNotificationsScreen} />
              <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
              <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
              <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
            </>
          ) : (
            (!hasPremium && isNewUser) ? (
              <>
                <Stack.Screen name="PricingModal" component={PricingModal} />
                <Stack.Screen name="MainApp" component={MainTabs} />
                <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
                <Stack.Screen name="EventsList" component={EventsListScreen} />
                <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
                <Stack.Screen name="DraftsScreen" component={DraftsScreen} />
                <Stack.Screen name="EventsYoureHosting" component={EventsYoureHostingScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="BookmarksList" component={BookmarksListScreen} />
                <Stack.Screen name="MapScreen" component={MapScreen} />
                <Stack.Screen name="RankingScreen" component={RankingScreen} />
                <Stack.Screen name="PromoteScreen" component={PromoteScreen} />
                <Stack.Screen name="AttendeesScreen" component={AttendeesScreen} />
                <Stack.Screen name="HelpCenterScreen" component={HelpCenterScreen} />
                <Stack.Screen name="InsightsScreen" component={InsightsScreen} />
                <Stack.Screen name="NotificationInvitation" component={NotificationInvitation} />
                <Stack.Screen name="NotificationJoin" component={NotificationJoin} />
                <Stack.Screen name="NotificationReminder" component={NotificationReminder} />
                <Stack.Screen name="NotificationLike" component={NotificationLike} />
                <Stack.Screen name="NotificationComment" component={NotificationComment} />
                <Stack.Screen name="ChatScreen" component={ChatScreen} />
                <Stack.Screen name="PersonalChatScreen" component={PersonalChatScreen} />
                <Stack.Screen name="PersonalChatsListScreen" component={PersonalChatsListScreen} />
                <Stack.Screen name="GroupChatListScreen" component={GroupChatListScreen} />
                <Stack.Screen name="AddPersonScreen" component={AddPersonScreen} />
                <Stack.Screen name="CreateGroupScreen" component={CreateGroupScreen} />
                <Stack.Screen name="OtherProfile" component={OtherProfileScreen} />
                <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
                <Stack.Screen name="ContactUs" component={ContactUsScreen} />
                <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
                <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
                <Stack.Screen name="OffersList" component={OffersListScreen} />
                <Stack.Screen name="OfferDetails" component={OfferDetailsScreen} />
                <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                <Stack.Screen name="EmailNotifications" component={EmailNotificationsScreen} />
                <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
                <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="MainApp" component={MainTabs} />
                <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
                <Stack.Screen name="EventsList" component={EventsListScreen} />
                <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
                <Stack.Screen name="EventsYoureHosting" component={EventsYoureHostingScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="BookmarksList" component={BookmarksListScreen} />
                <Stack.Screen name="MapScreen" component={MapScreen} />
                <Stack.Screen name="RankingScreen" component={RankingScreen} />
                <Stack.Screen name="PromoteScreen" component={PromoteScreen} />
                <Stack.Screen name="AttendeesScreen" component={AttendeesScreen} />
                <Stack.Screen name="HelpCenterScreen" component={HelpCenterScreen} />
                <Stack.Screen name="InsightsScreen" component={InsightsScreen} />
                <Stack.Screen
                  name="PricingModal"
                  component={PricingModal}
                  options={{ presentation: "modal", animationTypeForReplace: "push" }}
                />
                <Stack.Screen name="NotificationInvitation" component={NotificationInvitation} />
                <Stack.Screen name="NotificationJoin" component={NotificationJoin} />
                <Stack.Screen name="NotificationReminder" component={NotificationReminder} />
                <Stack.Screen name="NotificationLike" component={NotificationLike} />
                <Stack.Screen name="NotificationComment" component={NotificationComment} />
                <Stack.Screen name="ChatScreen" component={ChatScreen} />
                <Stack.Screen name="PersonalChatScreen" component={PersonalChatScreen} />
                <Stack.Screen name="PersonalChatsListScreen" component={PersonalChatsListScreen} />
                <Stack.Screen name="GroupChatListScreen" component={GroupChatListScreen} />
                <Stack.Screen name="AddPersonScreen" component={AddPersonScreen} />
                <Stack.Screen name="CreateGroupScreen" component={CreateGroupScreen} />
                <Stack.Screen name="OtherProfile" component={OtherProfileScreen} />
                <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
                <Stack.Screen name="ContactUs" component={ContactUsScreen} />
                <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
                <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
                <Stack.Screen name="OffersList" component={OffersListScreen} />
                <Stack.Screen name="OfferDetails" component={OfferDetailsScreen} />
                <Stack.Screen name="AvailableGroupsScreen" component={AvailableGroupsScreen} />
                <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                <Stack.Screen name="EmailNotifications" component={EmailNotificationsScreen} />
                <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
                <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                <Stack.Screen name="EditEvent" component={EditEventScreen} />
                <Stack.Screen name="DraftsScreen" component={DraftsScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />

              </>
            )
          )
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ConfirmResetPin" component={ConfirmResetPinScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="PasswordChangedConfirmation" component={PasswordChangedConfirmationScreen} />
            <Stack.Screen name="OffersList" component={OffersListScreen} />
            <Stack.Screen name="OfferDetails" component={OfferDetailsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}