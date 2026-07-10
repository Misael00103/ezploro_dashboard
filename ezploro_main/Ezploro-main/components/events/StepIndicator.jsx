import React from 'react';
import { View, Text } from 'react-native';

const StepIndicator = ({ currentStep, totalSteps = 4 }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 12 }}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep >= stepNumber;
        
        return (
          <View
            key={stepNumber}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              backgroundColor: isActive ? '#6366f1' : 'rgba(255, 255, 255, 0.1)',
              borderColor: isActive ? 'transparent' : 'rgba(255, 255, 255, 0.3)',
              transform: isActive ? [{ scale: 1.1 }] : [{ scale: 1 }]
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: isActive ? '#fff' : '#9ca3af'
            }}>
              {stepNumber}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export default StepIndicator;
