import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { UserProfile } from '../services/AuthService';

export interface AuthContextType {
  // Estado de autenticación
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
  
  // Métodos de autenticación
  login: () => Promise<void>;
  register: () => Promise<void>;
  logout: () => Promise<void>;
  completeProfile: (profileData: any) => Promise<{ success: boolean; error?: string }>;
  
  // Utilidades
  checkSession: () => Promise<void>;
  clearAuthState: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Crear contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider del contexto
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar sesión al inicializar la app
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🚀 AuthContext: Iniciando verificación de autenticación...');
      setLoading(true);
      
      // Limpiar sesión inicial para evitar errores de cookies corruptas
      await authService.clearSession();
      
      const sessionCheck = await authService.checkSession();
      
      if (sessionCheck.isValid && sessionCheck.user) {
        console.log('✅ AuthContext: Usuario autenticado correctamente:', sessionCheck.user.email);
        setIsAuthenticated(true);
        setUser(sessionCheck.user);
      } else {
        console.log('❌ AuthContext: No se encontró sesión válida');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('💥 AuthContext: Error initializing auth:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      console.log('🏁 AuthContext: Verificación de autenticación completada');
      setLoading(false);
    }
  };

  // Método para iniciar login (retorna Promise para manejar navegación)
  const login = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Este método será manejado por el componente que muestre el WebView
      // La resolución ocurre cuando el WebView complete exitosamente
      reject(new Error('Login debe ser manejado por AuthWebView'));
    });
  };

  // Método para iniciar registro (retorna Promise para manejar navegación)
  const register = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Este método será manejado por el componente que muestre el WebView
      reject(new Error('Register debe ser manejado por AuthWebView'));
    });
  };

  // Manejar éxito de autenticación (llamado por AuthWebView)
  const handleAuthSuccess = async (action: 'login' | 'register') => {
    try {
      setLoading(true);
      
      // Verificar sesión después de autenticación exitosa
      const sessionCheck = await authService.checkSession();
      
      if (sessionCheck.isValid && sessionCheck.user) {
        setIsAuthenticated(true);
        setUser(sessionCheck.user);
        console.log(`${action} successful for user:`, sessionCheck.user.email);
      } else {
        throw new Error('No se pudo verificar la sesión después de la autenticación');
      }
    } catch (error) {
      console.error(`Error after ${action}:`, error);
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Completar perfil de deportista
  const completeProfile = async (profileData: any): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      const result = await authService.completeAthleteProfile(profileData);
      
      if (result.success && result.user) {
        setUser(result.user);
        console.log('Profile completed successfully');
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.error || 'Error completando el perfil' 
        };
      }
    } catch (error: any) {
      console.error('Error completing profile:', error);
      return { 
        success: false, 
        error: error.message || 'Error inesperado completando el perfil' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const success = await authService.logout();
      
      // Limpiar estado local independientemente del resultado del backend
      clearAuthState();
      
      if (success) {
        console.log('Logout successful');
      } else {
        console.warn('Logout completed with warnings');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Aún así limpiar estado local
      clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  // Verificar sesión manualmente
  const checkSession = async (): Promise<void> => {
    await initializeAuth();
  };

  // Limpiar estado de autenticación
  const clearAuthState = (): void => {
    setIsAuthenticated(false);
    setUser(null);
  };

  // Valor del contexto
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    loading,
    login,
    register,
    logout,
    completeProfile,
    checkSession,
    clearAuthState,
  };

  // Agregar método para uso interno del AuthWebView
  (contextValue as any).handleAuthSuccess = handleAuthSuccess;

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook especializado para AuthWebView
export const useAuthInternal = () => {
  const context = useContext(AuthContext) as any;
  if (!context) {
    throw new Error('useAuthInternal must be used within an AuthProvider');
  }
  return {
    ...context,
    handleAuthSuccess: context.handleAuthSuccess,
  };
};

export default AuthContext;