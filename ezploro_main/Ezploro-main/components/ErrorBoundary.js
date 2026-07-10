import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.resetError = this.resetError.bind(this);
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para que el siguiente renderizado muestre la interfaz de repuesto.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // También puedes registrar el error en un servicio de reporte de errores
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  resetError() {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      // Determinar si es un error de red
      const isNetworkError = 
        this.state.error && 
        (this.state.error.message.includes('Network request failed') ||
         this.state.error.message.includes('network') ||
         this.state.error.message.includes('connection') ||
         this.state.error.message.includes('ECONNREFUSED') ||
         this.state.error.message.includes('timeout'));

      return (
        <View style={styles.container}>
          <Ionicons 
            name={isNetworkError ? "wifi-outline" : "alert-circle-outline"} 
            size={60} 
            color={isNetworkError ? "#FF9800" : "#F44336"} 
            style={styles.icon}
          />
          <Text style={styles.title}>
            {isNetworkError ? "Error de conexión" : "Algo salió mal"}
          </Text>
          <Text style={styles.message}>
            {isNetworkError 
              ? "No se pudo conectar al servidor. Por favor, verifica tu conexión a internet y que el servidor esté funcionando correctamente."
              : "Hemos registrado el error y estamos trabajando para solucionarlo."}
          </Text>
          
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Detalles del error:</Text>
            <ScrollView style={styles.errorStack}>
              <Text style={styles.errorText}>{this.state.error && this.state.error.toString()}</Text>
              {this.state.errorInfo && (
                <Text style={styles.errorText}>
                  {this.state.errorInfo.componentStack}
                </Text>
              )}
            </ScrollView>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={this.resetError}>
              <Text style={styles.buttonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1F222A', // Fondo oscuro para coincidir con el tema de la app
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#fff',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 20,
  },
  errorContainer: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 15,
    marginVertical: 20,
    maxHeight: 200,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#ccc',
    fontFamily: 'monospace',
  },
  errorStack: {
    maxHeight: 150,
  },
  buttonContainer: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#6200EE', // Color primario de la app
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ErrorBoundary;
