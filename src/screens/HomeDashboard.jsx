import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

const HomeDashboard = ({onCreateNeed, onFindMatch, onLogout}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CampusConnect</Text>
        <Text style={styles.subtitle}>
          Find what you need. Help someone succeed.
        </Text>
      </View>

      <Text style={styles.heading}>Welcome Back! 👋</Text>
      <Text style={styles.description}>
        What would you like to do today?
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onCreateNeed}>
        <Text style={styles.buttonTitle}>+ Create a Need</Text>
        <Text style={styles.buttonSubtitle}>
          Tell others what help you need
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={onFindMatch}>
        <Text style={styles.buttonTitle}>Find a Match</Text>
        <Text style={styles.buttonSubtitle}>
          Discover people who can help you
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
    padding: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3157D5',
  },
  subtitle: {
    fontSize: 14,
    color: '#68738A',
    marginTop: 8,
  },
  heading: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#202A44',
  },
  description: {
    fontSize: 15,
    color: '#68738A',
    marginTop: 8,
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: '#3157D5',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE3F0',
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buttonSubtitle: {
    fontSize: 13,
    color: '#E5EAFF',
    marginTop: 8,
  },
  logoutButton: {
    alignSelf: 'center',
    marginTop: 35,
    padding: 12,
  },
  logoutText: {
    color: '#D14343',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default HomeDashboard;