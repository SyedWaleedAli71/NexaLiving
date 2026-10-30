
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

const ResetPassword = ({email, onBack, onSuccess}) => {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!code || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Enter the 6-digit code from your email.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Error', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await authApi.resetPassword({email, code, newPassword});
      Alert.alert('Success', 'Your password has been reset. Please log in.', [
        {text: 'OK', onPress: () => onSuccess?.()},
      ]);
    } catch (err) {
      Alert.alert('Reset Failed', err.message);
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

            <Text style={styles.title}>Reset Password</Text>

            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to {email || 'your email'} and choose
              a new password.
            </Text>
          </View>

          {/* Code */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={t => setCode(t.replace(/[^0-9]/g, ''))}
            />
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={styles.resetButton}
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.resetText}>Reset Password</Text>
            )}
          </TouchableOpacity>

          {/* Back */}
          <View style={styles.backContainer}>
            <TouchableOpacity activeOpacity={0.7} onPress={onBack}>
              <Text style={styles.backLink}>Back to Login</Text>
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

  resetButton: {
    height: 55,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,

    shadowColor: '#2563EB',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },

  resetText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  backContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },

  backLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '700',
  },
});

export default ResetPassword;
