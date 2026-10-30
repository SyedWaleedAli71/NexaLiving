import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AuthShell, { AuthCard, ScreenHeader } from '../components/AuthShell';
import { AnimatedField } from '../components/Field';
import { PrimaryButton, TextButton } from '../components/Buttons';
import { AnimatedIn } from '../components/Motion';
import { Notice } from '../components/Feedback';
import {
  ArrowRightIcon,
  IdCardIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  UserIcon,
} from '../components/Icons';
import {
  firstNameOf,
  formatCnic,
  formatPhone,
  validateAddress,
  validateCnic,
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
} from '../utils/validation';
import { colors, font, spacing } from '../theme/theme';

const INITIAL_VALUES = {
  fullName: '',
  phone: '',
  cnic: '',
  address: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const SignUp = ({ onLogin, onNext }) => {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  const setValue = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setNotice(null);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const runValidation = () => {
    const nextErrors = {
      fullName: validateFullName(values.fullName),
      phone: validatePhone(values.phone),
      cnic: validateCnic(values.cnic),
      address: validateAddress(values.address),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
      confirmPassword: validateConfirmPassword(values.confirmPassword, values.password),
    };
    setErrors(nextErrors);
    return nextErrors;
  };

  const handleNext = () => {
    const nextErrors = runValidation();
    const failing = Object.keys(nextErrors).filter(key => Boolean(nextErrors[key]));

    if (failing.length) {
      setNotice({
        tone: 'error',
        title: `${failing.length} field${failing.length > 1 ? 's need' : ' needs'} attention`,
        message: nextErrors[failing[0]],
      });
      return;
    }

    setLoading(true);
    setNotice(null);
    // Form completion only — account creation requires an auth backend.
    setTimeout(() => {
      setLoading(false);
      onNext &&
        onNext({
          firstName: firstNameOf(values.fullName),
          email: values.email.trim(),
        });
    }, 900);
  };

  return (
    <AuthShell
      header={
        <ScreenHeader
          title="Create Your NexaLiving Account"
          subtitle="Join your community and experience smarter living."
          delay={60}
        />
      }>
      <AuthCard delay={160}>
        <AnimatedField
          label="Full Name"
          placeholder="e.g. Waleed Ahmed"
          value={values.fullName}
          onChangeText={text => setValue('fullName', text)}
          icon={<UserIcon size={18} color={colors.primary} />}
          autoCapitalize="words"
          autoComplete="name"
          error={errors.fullName}
        />

        <AnimatedField
          label="Phone Number"
          placeholder="03XXXXXXXXX"
          value={values.phone}
          onChangeText={text => setValue('phone', text)}
          icon={<PhoneIcon size={18} color={colors.primary} />}
          keyboardType="phone-pad"
          formatter={formatPhone}
          maxLength={13}
          error={errors.phone}
        />

        <AnimatedField
          label="CNIC Number"
          placeholder="00000-0000000-0"
          value={values.cnic}
          onChangeText={text => setValue('cnic', text)}
          icon={<IdCardIcon size={18} color={colors.secondary} />}
          keyboardType="number-pad"
          formatter={formatCnic}
          maxLength={13}
          error={errors.cnic}
          hint="Formatted automatically as 00000-0000000-0"
        />

        <AnimatedField
          label="Complete Address"
          placeholder="House, street, sector, city"
          value={values.address}
          onChangeText={text => setValue('address', text)}
          icon={<PinIcon size={18} color={colors.primary} />}
          autoCapitalize="words"
          error={errors.address}
        />

        <AnimatedField
          label="Email Address"
          placeholder="name@example.com"
          value={values.email}
          onChangeText={text => setValue('email', text)}
          icon={<MailIcon size={18} color={colors.primary} />}
          keyboardType="email-address"
          autoComplete="email"
          error={errors.email}
        />

        <AnimatedField
          label="Password"
          placeholder="Min. 8 characters, letters + numbers"
          value={values.password}
          onChangeText={text => setValue('password', text)}
          icon={<LockIcon size={18} color={colors.primary} />}
          isPassword
          error={errors.password}
        />

        <AnimatedField
          label="Confirm Password"
          placeholder="Re-enter your password"
          value={values.confirmPassword}
          onChangeText={text => setValue('confirmPassword', text)}
          icon={<LockIcon size={18} color={colors.secondary} />}
          isPassword
          error={errors.confirmPassword}
          returnKeyType="done"
        />

        {notice ? (
          <Notice tone={notice.tone} title={notice.title} message={notice.message} />
        ) : null}

        <PrimaryButton
          label="Next"
          icon={<ArrowRightIcon size={18} color={colors.white} />}
          onPress={handleNext}
          loading={loading}
          disabled={loading}
        />

        <Text style={styles.privacyNote}>
          Your password and CNIC are validated on this device only. Nothing is
          persisted or transmitted, because no backend is connected yet.
        </Text>

        <AnimatedIn delay={380} distance={14}>
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already registered?</Text>
            <TextButton label=" Login" onPress={onLogin} />
          </View>
        </AnimatedIn>
      </AuthCard>
    </AuthShell>
  );
};

const styles = StyleSheet.create({
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  loginText: {
    ...font.caption,
    fontSize: 14,
  },
  privacyNote: {
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default SignUp;
