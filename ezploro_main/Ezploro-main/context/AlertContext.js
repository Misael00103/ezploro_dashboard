import { createContext, useCallback, useContext, useState } from 'react';
import SafeAlert from '../components/SafeAlert';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    // Fallback si no hay contexto disponible
    return {
      showAlert: (title, message, buttons = []) => {
        console.log(`ALERTA: ${title} - ${message}`);
        // Intentar usar Alert nativo como fallback
        try {
          const { Alert } = require('react-native');
          setTimeout(() => {
            Alert.alert(title, message, buttons, { cancelable: true });
          }, 100);
        } catch (error) {
          console.warn('⚠️ Alert nativo también falló:', error);
        }
      },
      hideAlert: () => console.log('Ocultando alerta'),
    };
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = useCallback((title, message, buttons = []) => {
    try {
      console.log(`📢 Mostrando alerta: ${title} - ${message}`);
      setAlertConfig({
        visible: true,
        title: title || 'Información',
        message: message || '',
        buttons: buttons || [],
      });
    } catch (error) {
      console.warn('⚠️ Error en showAlert del contexto:', error);
      // Fallback a console
      console.log(`ALERTA FALLBACK: ${title} - ${message}`);
    }
  }, []);

  const hideAlert = useCallback(() => {
    try {
      setAlertConfig(prev => ({ ...prev, visible: false }));
    } catch (error) {
      console.warn('⚠️ Error en hideAlert del contexto:', error);
    }
  }, []);

  const value = {
    showAlert,
    hideAlert,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      <SafeAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
    </AlertContext.Provider>
  );
};

export default AlertContext;