import React from 'react';
import { GymProvider } from './contexts/GymContext';
import { GymTracker } from './components/GymTracker';

function App() {
  return (
    <GymProvider>
      <GymTracker />
    </GymProvider>
  );
}

export default App;
