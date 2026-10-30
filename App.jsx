import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Welcome from './src/screens/Welcome';
import LoginScreen from './src/screens/Login';
import SignUp from './src/screens/SignUp';
import ForgotPassword from './src/screens/ForgotPassword';
import WelcomeUser from './src/screens/WelcomeUser';

/**
 * Lightweight state router.
 *
 * react-navigation is not installed in this project, so the authentication
 * flow is driven by a small screen state machine. Every route change plays a
 * shared enter transition so the flow still feels like native navigation.
 */
const ScreenTransition = ({ route, children }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    const animation = Animated.timing(anim, {
      toValue: 1,
      duration: 360,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    });
    animation.start();
    return () => animation.stop();
  }, [anim, route]);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
        ],
      }}>
      {children}
    </Animated.View>
  );
};

// Where the Android hardware back button should land from each screen.
const BACK_ROUTES = {
  login: 'welcome',
  signup: 'login',
  forgot: 'login',
  success: 'login',
};

const App = () => {
  const [route, setRoute] = useState('welcome');
  const [registration, setRegistration] = useState({ firstName: '', email: '' });
  const [prefillEmail, setPrefillEmail] = useState('');

  const go = useCallback(next => setRoute(next), []);

  // react-navigation is not installed, so hardware back is mapped by hand.
  const routeRef = useRef(route);
  routeRef.current = route;

  useEffect(() => {
    const onBack = () => {
      const previous = BACK_ROUTES[routeRef.current];
      if (previous) {
        setRoute(previous);
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider style={styles.root}>
      <ScreenTransition route={route}>
        {route === 'welcome' ? <Welcome onNext={() => go('login')} /> : null}

        {route === 'login' ? (
          <LoginScreen
            onSignUp={() => go('signup')}
            onForgot={email => {
              setPrefillEmail(email || '');
              go('forgot');
            }}
          />
        ) : null}

        {route === 'signup' ? (
          <SignUp
            onLogin={() => go('login')}
            onNext={({ firstName, email }) => {
              setRegistration({ firstName, email });
              go('success');
            }}
          />
        ) : null}

        {route === 'forgot' ? (
          <ForgotPassword initialEmail={prefillEmail} onBack={() => go('login')} />
        ) : null}

        {route === 'success' ? (
          <WelcomeUser
            firstName={registration.firstName}
            email={registration.email}
            onContinue={() => go('login')}
            onLogin={() => go('login')}
          />
        ) : null}
      </ScreenTransition>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});

export default App;
