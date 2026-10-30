
import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {authApi} from '../../services/authService';

const {width} = Dimensions.get('window');

const ForgotPassword = ({onBack, onCodeSent}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email) {
      Alert.alert('Missing Email', 'Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      const data = await authApi.forgotPassword({email});
      Alert.alert(
        'Check Your Inbox',
        data.message || `We've sent reset instructions to ${email}.`,
        [{text: 'OK', onPress: () => onCodeSent?.(email)}],
      );
    } catch (err) {
      Alert.alert('Request Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../../images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />

            <Text style={styles.title}>Forgot Password?</Text>

            <Text style={styles.subtitle}>
              Enter your email and we'll send you instructions to reset your
              password.
            </Text>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={styles.sendButton}
            activeOpacity={0.8}
            onPress={handleSend}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.sendText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <View style={styles.backContainer}>
            <Text style={styles.backText}>Remember your password?</Text>

            <TouchableOpacity activeOpacity={0.7} onPress={onBack}>
              <Text style={styles.backLink}> Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  container: {
    flex: 1,
    justifyContent: 'center',
  },

  card: {
    width: width > 600 ? 500 : '100%',
    maxWidth: 500,
    backgroundColor: 'transparent',
    borderRadius: 24,
    padding: width > 600 ? 35 : 24,
    alignSelf: 'center',
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: 30,
  },

  logoImage: {
    width: 90,
    height: 90,
    marginBottom: 18,
  },

  title: {
    fontSize: width > 600 ? 32 : 28,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },

  inputContainer: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },

  input: {
    width: '100%',
    height: 54,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },

  sendButton: {
    height: 55,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,

    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,

    elevation: 4,
  },

  sendText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },

  backText: {
    fontSize: 14,
    color: '#64748B',
  },

  backLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '700',
  },
});

export default ForgotPassword;
