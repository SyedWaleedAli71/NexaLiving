import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';

const isValidDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

const isValidTime = value => {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
};

const CreateNeed = ({onBack, onSubmitNeed}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');

  const handleSubmit = () => {
  if (
    !title.trim() ||
    !category.trim() ||
    !description.trim() ||
    !date.trim() ||
    !time.trim() ||
    !duration.trim()
  ) {
    Alert.alert(
      'Missing Information',
      'Please complete all fields before submitting.',
    );
    return;
  }

  if (!isValidDate(date.trim())) {
    Alert.alert(
      'Invalid Date',
      'Please enter a valid date in YYYY-MM-DD format.',
    );
    return;
  }

  if (!isValidTime(time.trim())) {
    Alert.alert(
      'Invalid Time',
      'Please enter time in 24-hour format, for example 18:30.',
    );
    return;
  }

  const newNeed = {
    id: Date.now().toString(),
    title: title.trim(),
    category: category.trim(),
    description: description.trim(),
    date: date.trim(),
    time: time.trim(),
    duration: duration.trim(),
    status: 'Open',
  };

  onSubmitNeed(newNeed);
};

  const renderField = (
    label,
    placeholder,
    value,
    onChangeText,
    extraProps = {},
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          extraProps.multiline && styles.multiline,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChangeText}
        {...extraProps}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">

        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹  Back to Dashboard</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>NEXALIVING COMMUNITY</Text>
          <Text style={styles.heading}>Create a Need</Text>
          <Text style={styles.subtitle}>
            Tell your neighbours what you need. Someone nearby
            might be able to help.
          </Text>
        </View>

        <View style={styles.card}>
          {renderField(
            'What do you need?',
            'e.g. Drill machine',
            title,
            setTitle,
          )}

          {renderField(
            'Category',
            'e.g. Tools, Home, Electronics',
            category,
            setCategory,
          )}

          {renderField(
            'Description',
            'Explain what you need and any important details...',
            description,
            setDescription,
            {
              multiline: true,
              numberOfLines: 4,
              textAlignVertical: 'top',
            },
          )}

          {renderField(
            'Required Date',
            'YYYY-MM-DD (e.g. 2026-11-05)',
            date,
            setDate,
            {
  keyboardType: 'numeric',
  maxLength: 10,
}
          )}

          {renderField(
            'Required Time',
            '24-hour format (e.g. 18:30)',
            time,
            setTime,
            {
  keyboardType: 'numeric',
  maxLength: 5,
}
          )}

          {renderField(
            'Duration',
            'e.g. 2 hours',
            duration,
            setDuration,
          )}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.85}>
            <Text style={styles.submitText}>Post My Need  →</Text>
          </TouchableOpacity>

          <Text style={styles.privacyNote}>
            Your request will be available for matching within
            your community once community listings are connected.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 18,
  },
  backText: {
    color: '#6D28D9',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
  },
  eyebrow: {
    color: '#6D28D9',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  heading: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 9,
  },
  input: {
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  multiline: {
    minHeight: 110,
  },
  submitButton: {
    backgroundColor: '#6D28D9',
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  privacyNote: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 14,
  },
});

export default CreateNeed;