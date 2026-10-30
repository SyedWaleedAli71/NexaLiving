import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AuthShell, { AuthCard, Divider, ScreenHeader } from '../components/AuthShell';
import { AnimatedField, Checkbox } from '../components/Field';
import { PrimaryButton, SocialButton, TextButton } from '../components/Buttons';
import { AnimatedIn } from '../components/Motion';
import { Notice } from '../components/Feedback';
import {
  AppleIcon,
  GoogleIcon,
  LockIcon,
  MailIcon,
} from '../components/Icons';
import {
  validateEmail,
  validatePassword,
  firstErrorMessage,
} from '../utils/validation';
import { colors, font, spacing } from '../theme/theme';

/**
 * No authentication provider (Firebase, Auth API, …) is configured in this
 * project, so a validated form is reported as "ready to submit" instead of a
 * fake successful login.
 */
const AUTH_PENDING_MESSAGE =
  'Your details passed validation. NexaLiving has no authentication provider configured yet, so no account was accessed and nothing was sent to a server.';

const LoginScreen = ({ onSignUp, onForgot }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  const clearError = field => {
    setNotice(null);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLogin = () => {
    const nextErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(nextErrors);

    const firstError = firstErrorMessage(nextErrors);
    if (firstError) {
      setNotice({ tone: 'error', title: 'Please review your details', message: firstError });
      return;
    }

    setLoading(true);
    setNotice(null);
    // Front-end validation only — there is no auth backend to call yet.
    setTimeout(() => {
      setLoading(false);
      setNotice({ tone: 'warning', title: 'Authentication setup pending', message: AUTH_PENDING_MESSAGE });
    }, 900);
  };

  const handleSocial = provider => {
    setNotice({
      tone: 'info',
      title: `${provider} sign-in unavailable`,
      message: `Google and Apple authentication require a configured provider. No ${provider} SDK is installed in this project yet.`,
    });
  };

  return (
    <AuthShell
      header={
        <ScreenHeader
          title="Welcome Back!"
          subtitle="Sign in to continue your NexaLiving experience."
          delay={80}
        />
      }>
        <AuthCard delay={200}>
          <AnimatedField
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChangeText={text => {
              setEmail(text);
              clearError('email');
            }}
            icon={<MailIcon size={18} color={colors.primary} />}
            keyboardType="email-address"
            error={errors.email}
            returnKeyType="next"
          />

          <AnimatedField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={text => {
              setPassword(text);
              clearError('password');
            }}
            icon={<LockIcon size={18} color={colors.primary} />}
            isPassword
            error={errors.password}
            returnKeyType="done"
          />

          <View style={styles.optionsRow}>
            <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
            <TextButton label="Forgot Password?" onPress={() => onForgot && onForgot(email)} color={colors.secondary} />
          </View>

          {notice ? (
            <Notice
              tone={notice.tone}
              title={notice.title}
              message={notice.message}
              visible={Boolean(notice)}
            />
          ) : null}

          <PrimaryButton
            label="Login"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.submit}
          />

          <Divider label="or continue with" />

          <View style={styles.socialRow}>
            <SocialButton
              label="Google"
              icon={<GoogleIcon size={20} />}
              onPress={() => handleSocial('Google')}
              disabled={loading}
            />
            <SocialButton
              label="Apple"
              icon={<AppleIcon size={20} />}
              onPress={() => handleSocial('Apple')}
              disabled={loading}
            />
          </View>

          <AnimatedIn delay={420} distance={14}>
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don&apos;t have an account?</Text>
              <TextButton label=" Sign Up" onPress={onSignUp} />
            </View>
          </AnimatedIn>
        </AuthCard>

        <Text style={styles.footer}>NexaLiving · Secure community living</Text>
    </AuthShell>
  );
};

const styles = StyleSheet.create({
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  submit: {
    marginTop: spacing.xs,
  },
  socialRow: {
    flexDirection: 'row',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  signupText: {
    ...font.caption,
    fontSize: 14,
  },
  footer: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

export default LoginScreen;
