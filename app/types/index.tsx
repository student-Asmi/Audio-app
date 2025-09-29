import React from 'react';
import { StatusBar ,Text} from 'react-native';
import { AuthProvider } from '../contexts/AuthContext';
import AppNavigator from '../navigation/AppNavigator';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />  {/* No NavigationContainer here */}
    </AuthProvider>
  );
};

export default App;
