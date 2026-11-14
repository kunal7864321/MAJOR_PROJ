import React, { useState } from 'react';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import PairingScreen from './src/screens/PairingScreen';
import { configureApi } from './src/services/api';

export default function App() {
  const [screen, setScreen] = useState('auth');

  const authenticate = (token, serverUrl) => {
    configureApi(token, serverUrl);
    setScreen('home');
  };

  if (screen === 'home') {
    return <HomeScreen />;
  }

  if (screen === 'pairing') {
    return (
      <PairingScreen
        onPaired={authenticate}
        onCancel={() => setScreen('auth')}
      />
    );
  }

  return (
    <AuthScreen
      onLoginSuccess={authenticate}
      onPairDevice={() => setScreen('pairing')}
    />
  );
}
