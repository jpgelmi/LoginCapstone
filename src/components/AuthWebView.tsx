import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import authService from '../services/AuthService';

export interface AuthWebViewProps {
  mode: 'login' | 'register';
  onSuccess: (action: 'login' | 'register') => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const AuthWebView: React.FC<AuthWebViewProps> = ({
  mode,
  onSuccess,
  onError,
  onCancel
}) => {
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Obtener URL inicial según el modo
  const getInitialUrl = () => {
    return mode === 'login' 
      ? authService.getLoginUrl()
      : authService.getRegisterUrl();
  };

  // Manejar cambios de navegación
  const handleNavigationStateChange = async (navState: any) => {
    const { url, loading, title, canGoBack, canGoForward } = navState;
    setCanGoBack(canGoBack);
    
    console.log('🌐 AuthWebView: Navegación detectada:', {
      url,
      loading,
      title,
      canGoBack,
      canGoForward
    });

    // Verificar si es una redirección de éxito
    const authResult = authService.handleAuthReturn(url);
    console.log('🔍 AuthWebView: Resultado de análisis de URL:', authResult);
    
    if (authResult.success) {
      console.log('🎯 AuthWebView: Redirección de éxito detectada');
      setLoading(true);
      
      try {
        console.log('🍪 AuthWebView: Extrayendo cookie de sesión...');
        // Extraer cookie de sesión
        const sessionCookie = await authService.extractSessionCookie();
        
        if (sessionCookie) {
          console.log('✅ AuthWebView: Cookie de sesión extraída exitosamente');
          
          // Verificar que la sesión sea válida
          const sessionCheck = await authService.checkSession();
          
          if (sessionCheck.isValid) {
            console.log('✅ AuthWebView: Sesión verificada, notificando éxito');
            // Solo pasar acciones válidas (login o register)
            if (authResult.action === 'login' || authResult.action === 'register') {
              onSuccess(authResult.action);
            } else {
              console.log('❌ AuthWebView: Error en el tipo de autenticación');
              onError('Error en el tipo de autenticación');
            }
          } else {
            console.log('❌ AuthWebView: No se pudo verificar la sesión');
            onError('No se pudo verificar la sesión');
          }
        } else {
          console.log('❌ AuthWebView: No se pudo obtener la cookie de sesión');
          onError('No se pudo obtener la cookie de sesión');
        }
      } catch (error) {
        console.error('💥 AuthWebView: Error handling auth success:', error);
        onError('Error procesando la autenticación');
      } finally {
        setLoading(false);
      }
    } else if (authResult.action === 'error') {
      console.log('❌ AuthWebView: Error detectado en URL:', url);
      onError('Error en la autenticación o acceso denegado');
    } else if (authResult.action === 'continue') {
      console.log('🔄 AuthWebView: Flujo normal continúa, no se requiere acción');
      // No hacer nada, es parte normal del flujo
    } else {
      console.log('🤔 AuthWebView: URL no categorizada:', url);
      // Para URLs no categorizadas, tampoco hacemos nada
    }
  };

  // Manejar errores de carga
  const handleError = async (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('🚨 WebView error:', nativeEvent);
    
    // Solo intentar extraer cookies si el error sugiere que la autenticación 
    // fue exitosa pero la redirección falló (error de conexión después del login)
    const isCallbackError = nativeEvent.url?.includes('e0as.me/auth/callback') || 
                           nativeEvent.url?.includes('e0as.me/auth/success') ||
                           nativeEvent.url?.includes('e0as.me/dashboard');
    
    const isConnectionError = nativeEvent.description?.includes('CONNECTION_REFUSED') ||
                             nativeEvent.description?.includes('ERR_CONNECTION_REFUSED');
    
    // También intentar extraer cookies si hay un error de conexión después del flujo de Cognito
    // (podría ser una redirección mal configurada)
    const isPotentialCallbackError = isConnectionError && 
                                   (isCallbackError || 
                                    nativeEvent.url?.includes('localhost') ||
                                    nativeEvent.url?.includes('127.0.0.1'));
    
    if (isPotentialCallbackError) {
      console.log('🔄 AuthWebView: Error de conexión tras autenticación detectado, intentando extraer cookie...');
      setLoading(true);
      
      try {
        console.log('🍪 AuthWebView: Extrayendo cookie de sesión tras error de redirección...');
        // Extraer cookie de sesión
        const sessionCookie = await authService.extractSessionCookie();
        
        if (sessionCookie) {
          console.log('✅ AuthWebView: Cookie de sesión extraída exitosamente tras error');
          
          // Verificar que la sesión sea válida
          const sessionCheck = await authService.checkSession();
          
          if (sessionCheck.isValid) {
            console.log('✅ AuthWebView: Sesión verificada tras manejo de error de redirección');
            onSuccess('login');
            return;
          } else {
            console.log('❌ AuthWebView: No se pudo verificar la sesión tras error');
          }
        } else {
          console.log('❌ AuthWebView: No se pudo obtener la cookie tras error');
        }
      } catch (error) {
        console.error('💥 AuthWebView: Error extrayendo cookie tras error de redirección:', error);
      } finally {
        setLoading(false);
      }
    }
    
    // Para otros errores, reportar el error directamente
    console.log('❌ AuthWebView: Error de carga:', nativeEvent.url, nativeEvent.description);
    onError('Error cargando la página de autenticación');
  };

  // Manejar carga completada
  const handleLoad = () => {
    setLoading(false);
  };

  // Manejar botón atrás
  const handleGoBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      onCancel();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Text style={styles.backButtonText}>
            {canGoBack ? '← Atrás' : '✕ Cancelar'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
        </Text>
        
        <View style={styles.placeholder} />
      </View>

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: getInitialUrl() }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        onLoad={handleLoad}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        originWhitelist={['*']}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Configuraciones de seguridad
        mixedContentMode="compatibility"
        allowsProtectedMedia={true}
        // Configuraciones de cookies
        incognito={false}
        cacheEnabled={true}
        // User Agent para evitar problemas de compatibilidad
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E4E8',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#24292E',
    textAlign: 'center',
  },
  placeholder: {
    width: 60, // Para balancear el botón atrás
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#586069',
  },
  webview: {
    flex: 1,
  },
});

export default AuthWebView;