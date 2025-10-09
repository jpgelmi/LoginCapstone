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
        console.log('✅ LoginScreen: Registro exitoso');
      } else {
        console.log('✅ LoginScreen: Login exitoso');
      }
    } catch (error: any) {
      console.error('💥 LoginScreen: Error in auth success:', error);
      
      // Crear mensaje de error detallado
      let errorTitle = 'Error de Autenticación';
      let errorMessage = 'Error desconocido procesando la autenticación';
      
      if (error.message) {
        errorMessage = error.message;
        
        // Personalizar mensaje según el tipo de error
        if (error.message.includes('Network')) {
          errorTitle = 'Error de Conexión';
          errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet e inténtalo nuevamente.';
        } else if (error.message.includes('timeout')) {
          errorTitle = 'Tiempo de Espera Agotado';
          errorMessage = 'La conexión tardó demasiado tiempo. Por favor, inténtalo nuevamente.';
        } else if (error.message.includes('500')) {
          errorTitle = 'Error del Servidor';
          errorMessage = 'Hay un problema temporal con el servidor. Por favor, inténtalo más tarde.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorTitle = 'Error de Autenticación';
          errorMessage = 'Las credenciales no son válidas. Por favor, verifica tus datos de acceso.';
        }
      }
      
      Alert.alert(
        errorTitle,
        `${errorMessage}\n\n🔍 Detalles técnicos:\n${error.message || 'Sin detalles disponibles'}\n\n📱 Compilación: Release APK`,
        [
          {
            text: 'Copiar Error',
            onPress: () => {
              // Aquí podrías implementar copiar al clipboard si tienes la librería
              console.log('Error copiado:', error.message);
            },
            style: 'default'
          },
          {
            text: 'Cerrar',
            style: 'cancel'
          }
        ]
      );
    }
  };

  // Manejar error de autenticación
  const handleAuthWebViewError = (error: string) => {
    setShowWebView(false);
    
    let errorTitle = 'Error de Autenticación';
    let errorMessage = error;
    
    // Personalizar mensaje según el tipo de error
    if (error.includes('net::ERR_INTERNET_DISCONNECTED')) {
      errorTitle = 'Sin Conexión a Internet';
      errorMessage = 'No tienes conexión a internet. Por favor, verifica tu conexión e inténtalo nuevamente.';
    } else if (error.includes('net::ERR_NAME_NOT_RESOLVED')) {
      errorTitle = 'Error de DNS';
      errorMessage = 'No se pudo resolver el nombre del servidor. Verifica tu conexión a internet.';
    } else if (error.includes('net::ERR_CONNECTION_REFUSED')) {
      errorTitle = 'Conexión Rechazada';
      errorMessage = 'El servidor rechazó la conexión. Puede estar temporalmente fuera de servicio.';
    } else if (error.includes('net::ERR_SSL')) {
      errorTitle = 'Error de Certificado SSL';
      errorMessage = 'Hay un problema con el certificado de seguridad del servidor.';
    }
    
    Alert.alert(
      errorTitle,
      `${errorMessage}\n\n🔍 Detalles técnicos:\n${error}\n\n📱 Compilación: Release APK\n🌐 URL: https://e0as.me`,
      [
        {
          text: 'Ver Configuración',
          onPress: () => {
            Alert.alert(
              'Información de Red',
              '🔧 Configuración actual:\n\n' +
              '• HTTPS habilitado: ✅\n' +
              '• Cleartext traffic: ✅\n' +
              '• Certificados del sistema: ✅\n' +
              '• Timeout: 10 segundos\n\n' +
              'Si el problema persiste, verifica:\n' +
              '• Tu conexión Wi-Fi o datos móviles\n' +
              '• Que no tengas un firewall bloqueando la app\n' +
              '• Que el servidor esté funcionando'
            );
          },
          style: 'default'
        },
        {
          text: 'Reintentar',
          onPress: () => {
            setShowWebView(true);
          },
          style: 'default'
        },
        {
          text: 'Cerrar',
          style: 'cancel'
        }
      ]
    );
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
          <Text style={styles.title}>Registro Medicina Deportiva</Text>
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
            style={[styles.button, styles.registerButton, styles.disabledButton]}
            disabled={true}
          >
            <Text style={[styles.registerButtonText, styles.disabledButtonText]}>
              🔒 Registrarse como Deportista - Próximamente
            </Text>
          </TouchableOpacity>
        </View>

        {/* Información adicional */}
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
    textAlign: 'center',
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
  // Estilos para botón deshabilitado
  disabledButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    opacity: 0.7,
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
});

export default LoginScreen;