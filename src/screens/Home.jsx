
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import {authApi} from '../services/authService';

const {width} = Dimensions.get('window');

const Home = ({token, user, onLogout}) => {
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(false);

  // Fetch the latest profile from the protected endpoint using the token.
  useEffect(() => {
    let active = true;
    async function load() {
      if (!token) {
        return;
      }
      try {
        setLoading(true);
        const data = await authApi.me(token);
        if (active) {
          setProfile(data.user);
        }
      } catch (err) {
        // Non-fatal: fall back to the user object passed in.
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Image
            source={require('../../images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            You are signed in{profile ? `, ${profile.fullName}` : ''}. Your
            email is verified.
          </Text>

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{profile?.fullName || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile?.email || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={[styles.infoValue, styles.verifiedText]}>
                {loading ? 'Checking…' : 'Verified ✓'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={onLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    alignItems: 'center',
    padding: 20,
  },

  card: {
    width: width > 600 ? 500 : '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: width > 600 ? 35 : 24,
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },

  logoImage: {
    width: 90,
    height: 90,
    marginBottom: 18,
  },

  title: {
    fontSize: width > 600 ? 30 : 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 21,
  },

  infoBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },

  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
    marginLeft: 12,
    textAlign: 'right',
  },

  verifiedText: {
    color: '#16A34A',
  },

  logoutButton: {
    height: 55,
    width: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#2563EB',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },

  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default Home;
