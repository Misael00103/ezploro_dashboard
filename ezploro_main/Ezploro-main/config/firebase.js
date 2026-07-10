import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDKD2qezHOBDW6Bsvrn5FA-M3q38VP-8PA",
  authDomain: "ezploro.firebaseapp.com",
  projectId: "ezploro",
  storageBucket: "ezploro.firebasestorage.app",
  messagingSenderId: "271449598855",
  appId: "1:271449598855:web:205124d78139173fc90122",
  measurementId: "G-M7C449ZSM7"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export default app;