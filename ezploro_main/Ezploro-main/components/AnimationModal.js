import React from 'react';
import { Modal, View, StyleSheet, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import alarm from '../assets/alarm.json';

const { width, height } = Dimensions.get('window');

const AnimationModal = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LottieView
            source={alarm}
            autoPlay
            loop
            style={styles.animation}
          />
          <Text style={styles.modalText}>¡Evento creado exitosamente!</Text>
          <Button
            mode="contained"
            onPress={onClose}
            style={styles.okButton}
            labelStyle={styles.okButtonLabel}
            contentStyle={{ paddingVertical: 4 }}
            uppercase={false}
          >
            OK
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width * 0.8,
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: height * 0.03,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  animation: {
    width: width * 0.6,
    height: width * 0.6,
  },
  modalText: {
    fontSize: width * 0.045,
    color: '#1F2937',
    textAlign: 'center',
    marginVertical: height * 0.02,
  },
  okButton: {
    marginTop: height * 0.02,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    width: width * 0.4,
    alignSelf: 'center',
  },
  okButtonLabel: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: width * 0.045,
    letterSpacing: 1,
  },
});

export default AnimationModal;