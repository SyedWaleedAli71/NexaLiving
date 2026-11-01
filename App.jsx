import React, {useState} from 'react';

import LoginScreen from './src/screens/LoginScreen';
import SignUp from './src/screens/SignUp';
import HomeDashboard from './src/screens/HomeDashboard';
import CreateNeed from './src/screens/CreateNeed';
import FindMatch from './src/screens/FindMatch';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('login');

  // Store needs created by the current user
  const [needs, setNeeds] = useState([]);

  // Store requests sent to listing owners
  const [requests, setRequests] = useState([]);

  // Create a new need
  const handleCreateNeed = need => {
    setNeeds(previousNeeds => [...previousNeeds, need]);
    setCurrentScreen('dashboard');
  };

  // Send a request for a listing
  const handleCreateRequest = listing => {
    const existingRequest = requests.find(
      request => request.listingId === listing.id,
    );

    if (existingRequest) {
      return false;
    }

    const newRequest = {
      id: Date.now().toString(),
      listingId: listing.id,
      itemTitle: listing.title,
      owner: listing.owner,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    setRequests(previousRequests => [
      ...previousRequests,
      newRequest,
    ]);

    return true;
  };

  // Sign Up screen
  if (currentScreen === 'signup') {
    return (
      <SignUp
        onLogin={() => setCurrentScreen('login')}
      />
    );
  }

  // Find Match screen
  if (currentScreen === 'findMatch') {
    return (
      <FindMatch
        needs={needs}
        requests={requests}
        onCreateRequest={handleCreateRequest}
        onBack={() => setCurrentScreen('dashboard')}
      />
    );
  }

  // Create Need screen
  if (currentScreen === 'createNeed') {
    return (
      <CreateNeed
        onBack={() => setCurrentScreen('dashboard')}
        onSubmitNeed={handleCreateNeed}
      />
    );
  }

  // Dashboard screen
  if (currentScreen === 'dashboard') {
    return (
      <HomeDashboard
        onCreateNeed={() => setCurrentScreen('createNeed')}
        onFindMatch={() => setCurrentScreen('findMatch')}
        onLogout={() => setCurrentScreen('login')}
      />
    );
  }

  // Login screen
  return (
    <LoginScreen
      onSignUp={() => setCurrentScreen('signup')}
      onLoginSuccess={() => setCurrentScreen('dashboard')}
    />
  );
};

export default App;