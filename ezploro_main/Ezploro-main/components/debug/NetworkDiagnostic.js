import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BASE_URL, SOCKET_URL } from '../../config'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function NetworkDiagnostic({ visible, onClose }) {
  const [results, setResults] = useState({})
  const [testing, setTesting] = useState(false)

  const runDiagnostics = async () => {
    setTesting(true)
    const diagnostics = {}

    try {
      // Test 1: Ping básico al servidor
      console.log('🔍 Testing basic server connectivity...')
      const startTime = Date.now()
      const response = await fetch(`${BASE_URL}/health`, {
        method: 'GET',
        timeout: 10000
      })
      const endTime = Date.now()
      
      diagnostics.serverPing = {
        success: response.ok,
        status: response.status,
        time: endTime - startTime,
        message: response.ok ? 'Servidor accesible' : `Error ${response.status}`
      }
    } catch (error) {
      diagnostics.serverPing = {
        success: false,
        message: `Error de conexión: ${error.message}`,
        time: 0
      }
    }

    try {
      // Test 2: Autenticación
      console.log('🔍 Testing authentication...')
      const token = await AsyncStorage.getItem('token')
      if (token) {
        const authResponse = await fetch(`${BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        })
        
        diagnostics.auth = {
          success: authResponse.ok,
          status: authResponse.status,
          message: authResponse.ok ? 'Token válido' : 'Token inválido o expirado'
        }
      } else {
        diagnostics.auth = {
          success: false,
          message: 'No hay token de autenticación'
        }
      }
    } catch (error) {
      diagnostics.auth = {
        success: false,
        message: `Error de autenticación: ${error.message}`
      }
    }

    try {
      // Test 3: Endpoint de mensajes
      console.log('🔍 Testing messages endpoint...')
      const token = await AsyncStorage.getItem('token')
      const messagesResponse = await fetch(`${BASE_URL}/private-messages/user/1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })
      
      diagnostics.messages = {
        success: messagesResponse.ok || messagesResponse.status === 404, // 404 es OK para mensajes vacíos
        status: messagesResponse.status,
        message: messagesResponse.ok ? 'Endpoint de mensajes accesible' : 
                messagesResponse.status === 404 ? 'Endpoint accesible (sin mensajes)' :
                `Error ${messagesResponse.status}`
      }
    } catch (error) {
      diagnostics.messages = {
        success: false,
        message: `Error en endpoint de mensajes: ${error.message}`
      }
    }

    try {
      // Test 4: Socket.IO connectivity
      console.log('🔍 Testing Socket.IO connectivity...')
      const socketTestResponse = await fetch(`${SOCKET_URL}/socket.io/?EIO=4&transport=polling`, {
        timeout: 10000
      })
      
      diagnostics.socket = {
        success: socketTestResponse.ok,
        status: socketTestResponse.status,
        message: socketTestResponse.ok ? 'Socket.IO accesible' : `Error Socket.IO ${socketTestResponse.status}`
      }
    } catch (error) {
      diagnostics.socket = {
        success: false,
        message: `Error Socket.IO: ${error.message}`
      }
    }

    setResults(diagnostics)
    setTesting(false)
  }

  useEffect(() => {
    if (visible) {
      runDiagnostics()
    }
  }, [visible])

  if (!visible) return null

  const getStatusIcon = (success) => {
    return success ? 'checkmark-circle' : 'close-circle'
  }

  const getStatusColor = (success) => {
    return success ? '#30D158' : '#FF453A'
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Diagnóstico de Red</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {testing ? (
            <View style={styles.loading}>
              <Text style={styles.loadingText}>Ejecutando diagnósticos...</Text>
            </View>
          ) : (
            Object.entries(results).map(([key, result]) => (
              <View key={key} style={styles.resultItem}>
                <Ionicons 
                  name={getStatusIcon(result.success)} 
                  size={24} 
                  color={getStatusColor(result.success)} 
                />
                <View style={styles.resultContent}>
                  <Text style={styles.resultTitle}>
                    {key === 'serverPing' && 'Conectividad del Servidor'}
                    {key === 'auth' && 'Autenticación'}
                    {key === 'messages' && 'Endpoint de Mensajes'}
                    {key === 'socket' && 'Socket.IO'}
                  </Text>
                  <Text style={styles.resultMessage}>{result.message}</Text>
                  {result.time && (
                    <Text style={styles.resultTime}>{result.time}ms</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={runDiagnostics}
            disabled={testing}
          >
            <Text style={styles.retryButtonText}>Volver a probar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  loading: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultContent: {
    marginLeft: 12,
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 14,
    color: '#8E8E93',
  },
  resultTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  actions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
})