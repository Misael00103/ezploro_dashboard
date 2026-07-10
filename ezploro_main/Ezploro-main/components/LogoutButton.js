import React, { useState } from 'react';
import { TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const LogoutButton = ({ navigation, style, textStyle, showIcon = true, title = "Cerrar Sesión" }) => {
  const { logout, logoutNow } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Cerrar Sesión",
          style: "destructive",
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              console.log("🚪 Iniciando proceso de logout...");
              
              // Intentar logout normal primero
              let result = await logout();
              
              // Si falla (por ejemplo, token expirado), usar logout inmediato
              if (!result.success) {
                console.warn("⚠️ Logout normal falló, usando logout inmediato...");
                result = await logoutNow();
              }
              
              if (result.success) {
                console.log("✅ Logout exitoso");
                if (navigation) {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Welcome" }],
                  });
                }
              } else {
                throw new Error(result.error || "Error desconocido en logout");
              }
            } catch (error) {
              console.error("❌ Error en logout:", error.message);
              
              // Como último recurso, forzar logout inmediato
              try {
                console.log("🔄 Forzando logout inmediato como último recurso...");
                await logoutNow();
                if (navigation) {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Welcome" }],
                  });
                }
              } catch (finalError) {
                console.error("❌ Error crítico en logout:", finalError.message);
                Alert.alert(
                  "Error",
                  "Hubo un problema al cerrar sesión. Por favor, cierra y abre la aplicación."
                );
              }
            } finally {
              setIsLoggingOut(false);
            }
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
          backgroundColor: '#FF4757',
          borderRadius: 8,
          opacity: isLoggingOut ? 0.7 : 1,
        },
        style
      ]}
      onPress={handleLogout}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          {showIcon && (
            <Ionicons 
              name="log-out-outline" 
              size={20} 
              color="#fff" 
              style={{ marginRight: 8 }} 
            />
          )}
          <Text
            style={[
              {
                color: '#fff',
                fontSize: 16,
                fontWeight: '600',
              },
              textStyle
            ]}
          >
            {isLoggingOut ? "Cerrando..." : title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default LogoutButton;