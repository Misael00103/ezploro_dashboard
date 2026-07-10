import React from 'react';
import { View, Text, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY_COLOR = '#6366F1';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#9CA3AF';

const PageHeader = ({ title, subtitle, onBack, rightComponent }) => {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
      backgroundColor: 'transparent',
    }}>
      {/* Back Button */}
      <TouchableOpacity 
        onPress={onBack}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Header Content */}
      <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 16 }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '700',
          color: TEXT_PRIMARY,
          textAlign: 'center',
        }}>
          {title}
        </Text>
        {subtitle && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <View style={{
              height: 4,
              backgroundColor: PRIMARY_COLOR,
              borderRadius: 2,
              flex: 1,
              maxWidth: 60,
            }} />
            <Text style={{
              fontSize: 14,
              color: TEXT_SECONDARY,
              marginHorizontal: 12,
            }}>
              {subtitle}
            </Text>
            <View style={{
              height: 4,
              backgroundColor: PRIMARY_COLOR,
              borderRadius: 2,
              flex: 1,
              maxWidth: 60,
            }} />
          </View>
        )}
      </View>

      {/* Right Component or Spacer */}
      <View style={{ width: 44 }}>
        {rightComponent}
      </View>
    </View>
  );
};

export default PageHeader;