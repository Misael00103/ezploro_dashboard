import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import tokenService from '../services/tokenService';

const TokenStatus = ({ showDetails = false }) => {
  const { token } = useAuth();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (!token) {
      setTokenInfo(null);
      setTimeRemaining(null);
      return;
    }

    const info = tokenService.getTokenInfo(token);
    setTokenInfo(info);

    // Actualizar tiempo restante cada minuto
    const updateTime = () => {
      const remaining = tokenService.getTimeUntilExpiry(token);
      setTimeRemaining(remaining);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Cada minuto

    return () => clearInterval(interval);
  }, [token]);

  if (!token || !tokenInfo) {
    return null;
  }

  const isExpired = tokenService.isTokenExpired(token);
  const willExpireSoon = tokenService.willExpireSoon(token, 30); // 30 minutos

  const getStatusColor = () => {
    if (isExpired) return '#FF4757';
    if (willExpireSoon) return '#FFA502';
    return '#2ED573';
  };

  const getStatusText = () => {
    if (isExpired) return 'Expirado';
    if (willExpireSoon) return 'Expira pronto';
    return 'Activo';
  };

  const formatTime = (minutes) => {
    if (!minutes || minutes < 0) return 'Expirado';
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    
    return `${mins}m`;
  };

  if (!showDetails) {
    return (
      <View style={styles.simpleContainer}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.simpleText}>{getStatusText()}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.title}>Estado del Token</Text>
      </View>
      
      <View style={styles.info}>
        <Text style={styles.label}>Estado:</Text>
        <Text style={[styles.value, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>

      {timeRemaining !== null && (
        <View style={styles.info}>
          <Text style={styles.label}>Tiempo restante:</Text>
          <Text style={styles.value}>{formatTime(timeRemaining)}</Text>
        </View>
      )}

      {tokenInfo.exp && (
        <View style={styles.info}>
          <Text style={styles.label}>Expira:</Text>
          <Text style={styles.value}>
            {new Date(tokenInfo.exp * 1000).toLocaleString()}
          </Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.label}>Usuario ID:</Text>
        <Text style={styles.value}>{tokenInfo.user_id}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  simpleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    margin: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
  },
  simpleText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});

export default TokenStatus;