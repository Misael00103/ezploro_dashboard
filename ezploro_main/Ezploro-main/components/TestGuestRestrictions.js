import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGuestRestrictions } from '../hooks/useGuestRestrictions';

const TestGuestRestrictions = () => {
  const navigation = useNavigation();
  const { restrictedActions, isGuestUser } = useGuestRestrictions();

  const testRestriction = () => {
    console.log('🧪 Probando restricción de guest...');
    restrictedActions.changeLocation(navigation);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Guest Restrictions</Text>
      <Text style={styles.status}>
        Usuario guest: {isGuestUser ? 'Sí' : 'No'}
      </Text>
      <TouchableOpacity style={styles.button} onPress={testRestriction}>
        <Text style={styles.buttonText}>Probar Restricción</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#1F222A',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    color: '#B8B8D9',
    fontSize: 14,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#8B5CF6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TestGuestRestrictions;