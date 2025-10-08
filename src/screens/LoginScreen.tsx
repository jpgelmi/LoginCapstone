import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useAuthInternal } from '../contexts/AuthContext';
import AuthWebView from '../components/AuthWebView';

const LoginScreen: React.FC = () => {
  const [showWebView, setShowWebView] = useState(false);
  const [webViewMode, setWebViewMode] = useState<'login' | 'register'>('login');
  const { loading } = useAuth();
  const { handleAuthSuccess } = useAuthInternal();

  // Manejar inicio de login
  const handleLogin = () => {
    console.log('🔑 LoginScreen: Usuario tocó botón de Login');
    setWebViewMode('login');
    setShowWebView(true);
  };

  // Manejar inicio de registro
  const handleRegister = () => {
    console.log('📝 LoginScreen: Usuario tocó botón de Registro');
    setWebViewMode('register');
    setShowWebView(true);
  };

  // Manejar éxito de autenticación
  const handleAuthWebViewSuccess = async (action: 'login' | 'register') => {
    try {
      console.log('🎉 LoginScreen: Autenticación exitosa, acción:', action);
      await handleAuthSuccess(action);
      setShowWebView(false);
      
      if (action === 'register') {
        console.log('✅ LoginScreen: Mostrando alerta de registro exitoso');
        Alert.alert(
          'Registro Exitoso',
          'Tu cuenta ha sido creada. Ahora puedes completar tu perfil.',
          [{ text: 'OK' }]
        );
      } else {
        console.log('✅ LoginScreen: Mostrando alerta de login exitoso');
        Alert.alert(
          'Login Exitoso',
          'Has iniciado sesión correctamente.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('💥 LoginScreen: Error in auth success:', error);
      Alert.alert(
        'Error',
        error.message || 'Error procesando la autenticación'
      );
    }
  };

  // Manejar error de autenticación
  const handleAuthWebViewError = (error: string) => {
    setShowWebView(false);
    Alert.alert('Error de Autenticación', error);
  };

  // Manejar cancelación
  const handleCancel = () => {
    setShowWebView(false);
  };

  // Si está mostrando WebView
  if (showWebView) {
    return (
      <AuthWebView
        mode={webViewMode}
        onSuccess={handleAuthWebViewSuccess}
        onError={handleAuthWebViewError}
        onCancel={handleCancel}
      />
    );
  }

  // Pantalla principal de login
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🏃‍♂️</Text>
          </View>
          <Text style={styles.title}>LoginCapstone</Text>
          <Text style={styles.subtitle}>Sistema de Gestión Deportiva UC</Text>
        </View>

        {/* Botones de acción */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.registerButton]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>
              Registrarse como Deportista
            </Text>
          </TouchableOpacity>
        </View>

        {/* Información adicional */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            • Solo deportistas pueden auto-registrarse
          </Text>
          <Text style={styles.infoText}>
            • El equipo de salud y entrenadores son registrados por un administrador
          </Text>
          <Text style={styles.infoText}>
            • Utiliza tu email institucional UC
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2025 Pontificia Universidad Católica de Chile
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#0066CC',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#24292E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#586069',
    textAlign: 'center',
  },
  buttonsContainer: {
    marginBottom: 32,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#0066CC',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    marginBottom: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#586069',
    textAlign: 'center',
  },
});

export default LoginScreen;