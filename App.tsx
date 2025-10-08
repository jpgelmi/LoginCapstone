/**
 * LoginCapstone - Sistema de Gestión Deportiva UC
 * App principal con autenticación mediante AWS Cognito
 * 
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importar nuestro componente App personalizado
import AuthApp from './src/App';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="#F8F9FA"
      />
      <AuthApp />
    </SafeAreaProvider>
  );
}

export default App;
