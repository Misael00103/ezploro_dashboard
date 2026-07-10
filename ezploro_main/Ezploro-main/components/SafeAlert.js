import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Componente de alerta personalizado más seguro
const SafeAlert = ({ visible, title, message, buttons = [], onClose }) => {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 100);
    }
  };

  const handleButtonPress = (button) => {
    try {
      if (button.onPress) {
        button.onPress();
      }
      handleClose();
    } catch (error) {
      console.warn('⚠️ Error en botón de alerta:', error);
      handleClose();
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <View style={styles.header}>
            <Ionicons name="information-circle" size={24} color="#8B5CF6" />
            <Text style={styles.title}>{title}</Text>
          </View>
          
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            {buttons.length === 0 ? (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleClose}
              >
                <Text style={styles.primaryButtonText}>OK</Text>
              </TouchableOpacity>
            ) : (
              buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'cancel' ? styles.cancelButton : styles.primaryButton,
                    buttons.length === 2 && index === 0 ? styles.leftButton : null,
                    buttons.length === 2 && index === 1 ? styles.rightButton : null,
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text
                    style={
                      button.style === 'cancel'
                        ? styles.cancelButtonText
                        : styles.primaryButtonText
                    }
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: '#1F222A',
    borderRadius: 20,
    padding: 20,
    width: Math.min(SCREEN_WIDTH - 40, 350),
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 10,
    flex: 1,
  },
  message: {
    fontSize: 16,
    color: '#B8B8D9',
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  leftButton: {
    marginRight: 10,
    flex: 1,
  },
  rightButton: {
    marginLeft: 10,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#B8B8D9',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SafeAlert;