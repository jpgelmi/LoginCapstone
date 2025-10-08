import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import CompleteProfileScreen from './screens/CompleteProfileScreen';

// Componente interno que usa el contexto
const AppNavigator: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();

  console.log('🧭 AppNavigator: Estado actual - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user?.email || 'null');

  // Mostrar loading mientras se verifica la sesión
  if (loading) {
    console.log('⏳ AppNavigator: Mostrando pantalla de carga');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    console.log('🔑 AppNavigator: Mostrando pantalla de login');
    return <LoginScreen />;
  }

  // Si está autenticado pero es deportista sin datos completos, mostrar formulario
  if (user && user.role === 'athlete' && !user.athleteData) {
    console.log('📋 AppNavigator: Mostrando pantalla de completar perfil');
    return <CompleteProfileScreen />;
  }

  // Si está autenticado y tiene datos completos, mostrar dashboard
  console.log('🏠 AppNavigator: Mostrando dashboard');
  return <DashboardScreen />;
};

// Componente principal de la app
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});

export default App;