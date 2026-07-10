import React, { useState, useEffect } from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useUserBlock } from '../hooks/useUserBlock';

/**
 * Componente reutilizable para bloquear/desbloquear usuarios
 * Puede ser usado en cualquier pantalla
 */
const UserBlockButton = ({ 
  targetUser, 
  style = {}, 
  textStyle = {}, 
  iconSize = 16,
  showIcon = true,
  onBlockSuccess = null,
  onUnblockSuccess = null,
  variant = 'default' // 'default', 'danger', 'minimal'
}) => {
  const { loading, checkIfBlocked, confirmBlockUser, confirmUnblockUser } = useUserBlock();
  const [isBlocked, setIsBlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  // Verificar estado de bloqueo al montar el componente
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!targetUser?.user_id && !targetUser?.id) return;
      
      setChecking(true);
      try {
        const blocked = await checkIfBlocked(targetUser.user_id || targetUser.id);
        setIsBlocked(blocked);
      } catch (error) {
        console.error('Error checking block status:', error);
      } finally {
        setChecking(false);
      }
    };

    checkBlockStatus();
  }, [targetUser, checkIfBlocked]);

  const handlePress = () => {
    const onSuccess = (result) => {
      setIsBlocked(!isBlocked);
      if (isBlocked && onUnblockSuccess) {
        onUnblockSuccess(result);
      } else if (!isBlocked && onBlockSuccess) {
        onBlockSuccess(result);
      }
    };

    if (isBlocked) {
      confirmUnblockUser(targetUser, onSuccess);
    } else {
      confirmBlockUser(targetUser, onSuccess);
    }
  };

  // Estilos según la variante
  const getButtonStyle = () => {
    const baseStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      ...style
    };

    switch (variant) {
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: isBlocked ? '#30D158' : '#FF3B30',
        };
      case 'minimal':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isBlocked ? '#30D158' : '#FF3B30',
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: isBlocked ? '#f0f0f0' : '#FF3B30',
        };
    }
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: showIcon ? 6 : 0,
      ...textStyle
    };

    switch (variant) {
      case 'danger':
        return {
          ...baseTextStyle,
          color: '#fff',
        };
      case 'minimal':
        return {
          ...baseTextStyle,
          color: isBlocked ? '#30D158' : '#FF3B30',
        };
      default:
        return {
          ...baseTextStyle,
          color: isBlocked ? '#333' : '#fff',
        };
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'danger':
        return '#fff';
      case 'minimal':
        return isBlocked ? '#30D158' : '#FF3B30';
      default:
        return isBlocked ? '#333' : '#fff';
    }
  };

  if (checking) {
    return (
      <TouchableOpacity style={getButtonStyle()} disabled>
        <ActivityIndicator size="small" color="#999" />
        {showIcon && <Text style={getTextStyle()}>Loading...</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={getButtonStyle()} 
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getIconColor()} />
      ) : (
        showIcon && (
          <Ionicons 
            name={isBlocked ? "checkmark-circle" : "ban"} 
            size={iconSize} 
            color={getIconColor()} 
          />
        )
      )}
      <Text style={getTextStyle()}>
        {isBlocked ? 'Unblock' : 'Block'}
      </Text>
    </TouchableOpacity>
  );
};

export default UserBlockButton;