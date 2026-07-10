import React from 'react';
import { ActivityIndicator } from 'react-native';

const LoadingSpinner = ({ size = 'large', color = '#6366F1' }) => {
  return <ActivityIndicator size={size} color={color} />;
};

export default LoadingSpinner;