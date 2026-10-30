
import React, {useState, useRef, useEffect} from 'react';
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
const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

const OtpVerification = ({email, onBack, onVerified}) => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }
    const timer = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const handleChange = (text, index) => {
    const value = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      Alert.alert(
        'Incomplete Code',
        'Please enter the full 6-digit verification code.',
      );
      return;
    }
    if (!email) {
      Alert.alert('Missing Email', 'No email to verify. Please sign up again.');
      return;
    }

    try {
      setLoading(true);
      const data = await authApi.verifyOtp({email, code});
      onVerified?.(data.token, data.user);
    } catch (err) {
      Alert.alert('Verification Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      return;
    }
    try {
      const data = await authApi.resendOtp({email});
      setOtp(Array(OTP_LENGTH).fill(''));
      setSeconds(RESEND_SECONDS);
      inputs.current[0]?.focus();
      Alert.alert('Sent', data.message || 'A new code has been sent.');
    } catch (err) {
      Alert.alert('Resend Failed', err.message);
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

            <Text style={styles.title}>Verify Your Account</Text>

            <Text style={styles.subtitle}>
              Enter the 6-digit code we sent to {email || 'your email'}
            </Text>
          </View>

          {/* OTP Inputs */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => {
                  inputs.current[index] = ref;
                }}
                style={[styles.otpInput, !!digit && styles.otpInputActive]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={text => handleChange(text, index)}
                onKeyPress={event => handleKeyPress(event, index)}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={styles.verifyButton}
            activeOpacity={0.8}
            onPress={handleVerify}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyText}>Verify</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendContainer}>
            {seconds > 0 ? (
              <Text style={styles.resendText}>
                Resend code in 0:{String(seconds).padStart(2, '0')}
              </Text>
            ) : (
              <TouchableOpacity activeOpacity={0.7} onPress={handleResend}>
                <Text style={styles.resendLink}>Resend Code</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Back */}
          <View style={styles.backContainer}>
            <Text style={styles.backText}>Wrong email?</Text>

            <TouchableOpacity activeOpacity={0.7} onPress={onBack}>
              <Text style={styles.backLink}> Go Back</Text>
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

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },

  otpInput: {
    width: width > 600 ? 58 : 44,
    height: width > 600 ? 64 : 56,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },

  otpInputActive: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },

  verifyButton: {
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

  verifyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  resendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },

  resendText: {
    fontSize: 14,
    color: '#64748B',
  },

  resendLink: {
    fontSize: 14,
    color: '#2563EB',
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

export default OtpVerification;
