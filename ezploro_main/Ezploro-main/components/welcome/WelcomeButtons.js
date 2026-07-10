import { StyleSheet, View } from 'react-native';
import EmailLoginButton from './EmailLoginButton';
import FacebookLoginButton from './FacebookLoginButton';
import GoogleLoginButton from './GoogleLoginButton';
import GuestLoginButton from './GuestLoginButton';

const WelcomeButtons = ({ 
  onEmailLogin, 
  onFacebookLogin, 
  onGuestLogin, 
  loading = false 
}) => {
  return (
    <View style={styles.buttonContainer}>
      <EmailLoginButton 
        onPress={onEmailLogin}
        disabled={loading}
        loading={loading}
      />
      
      <FacebookLoginButton 
        onPress={onFacebookLogin}
        disabled={loading}
        loading={loading}
      />
      
      <GoogleLoginButton 
        disabled={loading}
        loading={loading}
      />
      
      <GuestLoginButton 
        onPress={onGuestLogin}
        disabled={loading}
        loading={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    gap: 12,
    marginBottom: 30,
  },
});

export default WelcomeButtons;