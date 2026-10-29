
import React, {useState} from 'react';
import LoginScreen from './src/screens/LoginScreen';
import SignUp from './src/screens/SignUp';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('login');

  if (currentScreen === 'signup') {
    return (
      <SignUp
        onLogin={() => setCurrentScreen('login')}
      />
    );
  }

  return (
    <LoginScreen
      onSignUp={() => setCurrentScreen('signup')}
    />
  );
};

export default App;
