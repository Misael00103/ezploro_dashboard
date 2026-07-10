import React from 'react';
import { View, Text } from 'react-native';

const PRIMARY_COLOR = '#6366F1';
const SECONDARY_COLOR = '#8B5CF6';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#9CA3AF';

const StepIndicator = ({ currentStep, totalSteps }) => {
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 20,
    }}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep >= stepNumber;
        const isCompleted = currentStep > stepNumber;
        
        return (
          <View key={stepNumber} style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Step Circle */}
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isActive ? PRIMARY_COLOR : 'rgba(255, 255, 255, 0.1)',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: isActive ? PRIMARY_COLOR : 'rgba(255, 255, 255, 0.2)',
              shadowColor: isActive ? PRIMARY_COLOR : 'transparent',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isActive ? 0.3 : 0,
              shadowRadius: 8,
              elevation: isActive ? 8 : 0,
            }}>
              {isCompleted ? (
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>✓</Text>
              ) : (
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: isActive ? '#FFFFFF' : TEXT_SECONDARY,
                }}>
                  {stepNumber}
                </Text>
              )}
            </View>
            
            {/* Connector Line */}
            {index < totalSteps - 1 && (
              <View style={{
                width: 40,
                height: 2,
                backgroundColor: currentStep > stepNumber ? PRIMARY_COLOR : 'rgba(255, 255, 255, 0.2)',
                marginHorizontal: 8,
              }} />
            )}
          </View>
        );
      })}
    </View>
  );
};

export default StepIndicator;