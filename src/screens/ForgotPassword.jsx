import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AuthShell, { AuthCard, ScreenHeader } from '../components/AuthShell';
import { AnimatedField } from '../components/Field';
import { PrimaryButton, IconButton, TextButton } from '../components/Buttons';
import { Notice } from '../components/Feedback';
import { ChevronLeftIcon, LockIcon, MailIcon } from '../components/Icons';
import { validateEmail } from '../utils/validation';
import { colors, spacing } from '../theme/theme';

/**
 * Password recovery placeholder flow. It validates the e-mail address but
 * cannot send anything: no e-mail/auth service is configured in this project.
 */
const ForgotPassword = ({ onBack, initialEmail }) => {
  const [email, setEmail] = useState(initialEmail || '');
  const [error, setError] = useState(undefined);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    const message = validateEmail(email);
    setError(message);
    if (message) {
      setNotice({ tone: 'error', title: 'Invalid email', message });
      return;
    }

    setLoading(true);
    setNotice(null);
    setTimeout(() => {
      setLoading(false);
      setNotice({
        tone: 'info',
        title: 'Recovery service not connected',
        message:
          'The address passed validation, but NexaLiving has no email or authentication service configured, so no reset link was sent. Connect Firebase Auth (or your API) to complete this flow.',
      });
    }, 800);
  };

  return (
    <AuthShell
      header={
        <ScreenHeader
          title="Reset Your Password"
          subtitle="Enter the email linked to your NexaLiving account and we'll guide you through recovery."
          badge={false}
          delay={60}
        />
      }>
      <View style={styles.backRow}>
        <IconButton onPress={onBack} accessibilityLabel="Back to login">
          <ChevronLeftIcon size={20} color={colors.textMain} />
        </IconButton>
      </View>

      <AuthCard delay={160}>
        <View style={styles.iconBanner}>
          <View style={styles.iconCircle}>
            <LockIcon size={24} color={colors.primary} />
          </View>
        </View>

        <AnimatedField
          label="Email Address"
          placeholder="name@example.com"
          value={email}
          onChangeText={text => {
            setEmail(text);
            setError(undefined);
            setNotice(null);
          }}
          icon={<MailIcon size={18} color={colors.primary} />}
          keyboardType="email-address"
          error={error}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        {notice ? <Notice tone={notice.tone} title={notice.title} message={notice.message} /> : null}

        <PrimaryButton
          label="Send Recovery Instructions"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          height={56}
        />

        <View style={styles.loginRow}>
          <TextButton label="Remembered it? Back to Login" onPress={onBack} />
        </View>
      </AuthCard>
    </AuthShell>
  );
};

const styles = StyleSheet.create({
  backRow: {
    marginBottom: spacing.sm,
  },
  iconBanner: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginRow: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});

export default ForgotPassword;
