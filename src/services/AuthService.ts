import axios from 'axios';
import CookieManager from '@react-native-cookies/cookies';

// Configuración del backend
const BACKEND_URL = 'http://e0as.me';
const SESSION_COOKIE_NAME = '__Host-sid'; // El backend usa __Host-sid como cookie de sesión

// Configurar axios con withCredentials
axios.defaults.withCredentials = true;
axios.defaults.timeout = 10000;

export interface UserProfile {
  firstName: string;
  lastName: string;
  secondLastName?: string;
  rut: string;
  email: string;
  phone: string;
  role: 'athlete' | 'health_team' | 'temp_health_team' | 'trainer' | 'admin';
  athleteData?: {
    birthDate: string;
    biologicalSex: string;
    insurance: { type: string };
    establishment: string;
    sportDiscipline: string;
    professionalAspiration: boolean;
    otherSports: string[];
    pucData?: {
      career: string;
      competitiveLevel: string;
      universityEntryYear: number;
      projectedGraduationYear: number;
    };
  };
  healthTeamData?: {
    discipline: string;
    isStudent?: boolean;
    rotationEndDate?: string;
  };
  trainerData?: {
    establishment: string;
    sportDiscipline: string;
    category: string;
  };
}

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  message?: string;
  error?: string;
}

class AuthService {
  private sessionCookie: string | null = null;

  /**
   * Obtener URL de login
   */
  getLoginUrl(): string {
    return `${BACKEND_URL}/auth/login`;
  }

  /**
   * Obtener URL de registro
   */
  getRegisterUrl(): string {
    return `${BACKEND_URL}/registration/signup-url`;
  }

  /**
   * Obtener URL de logout
   */
  getLogoutUrl(): string {
    return `${BACKEND_URL}/auth/logout`;
  }

  /**
   * Extraer cookies del WebView después de autenticación
   */
  async extractSessionCookie(): Promise<string | null> {
    try {
      // Lista de dominios/URLs donde buscar la cookie
      const domainsToCheck = [
        BACKEND_URL,
        'https://e0as.me',
        'http://e0as.me',
        'https://us-east-2rlcyf2wsk.auth.us-east-2.amazoncognito.com'
      ];
      
      for (const domain of domainsToCheck) {
        try {
          console.log('🍪 AuthService: Extrayendo cookies del dominio:', domain);
          const cookies = await CookieManager.get(domain);
          console.log('🍪 AuthService: Cookies encontradas:', Object.keys(cookies));
          console.log('🍪 AuthService: Valores de cookies:', JSON.stringify(cookies, null, 2));
          
          // Buscar cookie por varios nombres posibles (el backend usa __Host-sid)
          const possibleNames = ['__Host-sid', SESSION_COOKIE_NAME, 'session', 'sessionId', 'auth_token', 'connect.sid'];
          
          for (const cookieName of possibleNames) {
            if (cookies[cookieName]) {
              this.sessionCookie = cookies[cookieName].value;
              console.log('✅ AuthService: Cookie de sesión encontrada:', cookieName, 'en dominio:', domain);
              return this.sessionCookie;
            }
          }
          
          // Si no se encontró por nombre, mostrar todas las cookies disponibles para debug
          if (Object.keys(cookies).length > 0) {
            console.log('🔍 AuthService: Cookies disponibles en', domain, ':', cookies);
          }
        } catch (domainError) {
          console.log('⚠️ AuthService: No se pudieron obtener cookies de:', domain);
        }
      }
      
      console.log('❌ AuthService: No se encontró cookie de sesión en ningún dominio');
      return null;
    } catch (error) {
      console.error('💥 AuthService: Error extracting session cookie:', error);
      return null;
    }
  }

  /**
   * Configurar interceptor de axios para incluir cookies
   */
  setupAxiosInterceptor() {
    // Request interceptor para añadir cookies
    axios.interceptors.request.use(
      async (config) => {
        // Si tenemos cookie en memoria, usarla
        if (this.sessionCookie) {
          config.headers.Cookie = `${SESSION_COOKIE_NAME}=${this.sessionCookie}`;
        } else {
          // Intentar obtener cookie del store nativo
          const cookie = await this.extractSessionCookie();
          if (cookie) {
            config.headers.Cookie = `${SESSION_COOKIE_NAME}=${cookie}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor para manejar errores de autenticación
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Sesión expirada, limpiar estado
          await this.clearSession();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Verificar si hay una sesión válida
   */
  async checkSession(): Promise<{ isValid: boolean; user?: UserProfile }> {
    try {
      console.log('🔍 AuthService: Verificando sesión...');
      
      // Primero intentar extraer cookie
      await this.extractSessionCookie();
      console.log('🍪 AuthService: Cookie extraída, haciendo petición al backend...');
      
      const response = await axios.get<AuthResponse>(`${BACKEND_URL}/users/my-profile`);
      console.log('📡 AuthService: Respuesta del backend recibida:', response.status);
      
      if (response.data.success && response.data.user) {
        console.log('✅ AuthService: Sesión válida encontrada para:', response.data.user.email);
        return {
          isValid: true,
          user: response.data.user
        };
      }
      
      console.log('❌ AuthService: Sesión no válida');
      return { isValid: false };
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('🔓 AuthService: No hay sesión activa (401 - normal para usuarios no autenticados)');
      } else {
        console.error('💥 AuthService: Error checking session:', error);
      }
      return { isValid: false };
    }
  }

  /**
   * Completar perfil de deportista después del registro
   */
  async completeAthleteProfile(profileData: {
    email: string;
    firstName: string;
    lastName: string;
    secondLastName?: string;
    rut: string;
    phone: string;
    role: 'athlete';
    athleteData: {
      birthDate: string;
      biologicalSex: string;
      insurance: { type: string };
      establishment: string;
      sportDiscipline: string;
      professionalAspiration: boolean;
      otherSports: string[];
      pucData?: {
        career: string;
        competitiveLevel: string;
        universityEntryYear: number;
        projectedGraduationYear: number;
      };
    };
  }): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        `${BACKEND_URL}/registration/complete-profile`,
        profileData
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error completing profile:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error completando el perfil'
      };
    }
  }

  /**
   * Limpiar sesión y cookies
   */
  async clearSession(): Promise<void> {
    try {
      console.log('🧹 AuthService: Limpiando sesión...');
      this.sessionCookie = null;
      
      // En Android, usar clearAll() en lugar de clearByName() que no funciona
      try {
        await CookieManager.clearAll();
        console.log('✅ AuthService: Cookies limpiadas exitosamente');
      } catch (cookieError: any) {
        console.log('⚠️ AuthService: Error limpiando cookies (no crítico):', cookieError?.message || cookieError);
        // No crítico, continuamos
      }
      
      await CookieManager.flush();
      console.log('✅ AuthService: Sesión limpiada exitosamente');
    } catch (error: any) {
      console.log('⚠️ AuthService: Error clearing session (no crítico):', error?.message || error);
    }
  }

  /**
   * Logout completo
   */
  async logout(): Promise<boolean> {
    try {
      // Llamar al endpoint de logout del backend
      await axios.get(`${BACKEND_URL}/auth/logout`);
      
      // Limpiar sesión local
      await this.clearSession();
      
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      
      // Aunque falle el backend, limpiar sesión local
      await this.clearSession();
      return false;
    }
  }

  /**
   * Obtener estado actual de la sesión
   */
  hasSessionCookie(): boolean {
    return !!this.sessionCookie;
  }

  /**
   * Obtener el ID del usuario actual para llamadas a la API
   */
  async getCurrentUserId(): Promise<string | null> {
    try {
      console.log('🔍 AuthService: Obteniendo ID del usuario actual...');
      
      const sessionResult = await this.checkSession();
      if (!sessionResult.isValid || !sessionResult.user) {
        console.log('❌ AuthService: No hay sesión válida para obtener ID');
        return null;
      }

      // Hacer una llamada al endpoint que devuelve la información del usuario
      // incluyendo su ID interno (no el cognitoUserId)
      const response = await axios.get(`${BACKEND_URL}/users/my-profile`);
      
      if (response.data.success && response.data.userId) {
        console.log('✅ AuthService: ID de usuario obtenido:', response.data.userId);
        return response.data.userId;
      }
      
      // Como fallback, usar el email del usuario (si la API lo acepta)
      if (sessionResult.user.email) {
        console.log('⚠️ AuthService: Usando email como fallback ID:', sessionResult.user.email);
        return sessionResult.user.email;
      }
      
      console.log('❌ AuthService: No se pudo obtener ID de usuario');
      return null;
    } catch (error) {
      console.error('💥 AuthService: Error obteniendo ID de usuario:', error);
      return null;
    }
  }

  /**
   * Verificar si una URL es de redirección exitosa
   */
  isSuccessRedirect(url: string): boolean {
    // URLs específicas que indican éxito en la autenticación
    const successPatterns = [
      // Backend callback después del login exitoso - ESTAS son las importantes
      /^https:\/\/e0as\.me\/auth\/callback/,
      /^https:\/\/e0as\.me\/auth\/success/,
      /^https:\/\/e0as\.me\/dashboard/,
      /^https:\/\/e0as\.me\/profile/,
      /^https:\/\/e0as\.me\/complete-profile/,
      // También HTTP por si acaso
      /^http:\/\/e0as\.me\/auth\/callback/,
      /^http:\/\/e0as\.me\/auth\/success/,
      /^http:\/\/e0as\.me\/dashboard/,
      /^http:\/\/e0as\.me\/profile/,
      /^http:\/\/e0as\.me\/complete-profile/
    ];
    
    // Patrones que definitivamente indican error
    const errorPatterns = [
      /[?&]error=/,        // URLs con parámetro error
      /access_denied/,     // Acceso denegado
      /[?&]error_code=/,   // URLs con código de error
    ];
    
    // Patrones que son parte normal del flujo (NO son errores)
    const normalFlowPatterns = [
      /cognito.*\/login/,   // Página de login de Cognito
      /cognito.*\/oauth2/,  // OAuth flow de Cognito
      /cognito.*\/signup/   // Página de signup de Cognito
    ];
    
    // Si es parte del flujo normal, no es ni éxito ni error
    if (normalFlowPatterns.some(pattern => pattern.test(url))) {
      console.log('🔄 AuthService: URL de flujo normal detectada:', url);
      return false;
    }
    
    // Si hay error explícito, definitivamente no es éxito
    if (errorPatterns.some(pattern => pattern.test(url))) {
      console.log('❌ AuthService: URL de error detectada:', url);
      return false;
    }
    
    // Si coincide con patrones de éxito, es válido
    const isSuccess = successPatterns.some(pattern => pattern.test(url));
    if (isSuccess) {
      console.log('✅ AuthService: URL de éxito detectada:', url);
    }
    return isSuccess;
  }

  /**
   * Manejar deep link de retorno
   */
  handleAuthReturn(url: string): { success: boolean; action: 'login' | 'register' | 'error' | 'continue' } {
    // Verificar si es una URL de éxito real
    if (this.isSuccessRedirect(url)) {
      // Determinar si fue login o registro basado en la URL
      if (url.includes('registration') || url.includes('signup')) {
        return { success: true, action: 'register' };
      }
      return { success: true, action: 'login' };
    }
    
    // Verificar si es parte del flujo normal (no hacer nada, continuar)
    const normalFlowPatterns = [
      /cognito.*\/login/,   // Página de login de Cognito
      /cognito.*\/oauth2/,  // OAuth flow de Cognito
      /cognito.*\/signup/   // Página de signup de Cognito
    ];
    
    if (normalFlowPatterns.some(pattern => pattern.test(url))) {
      return { success: false, action: 'continue' }; // No es éxito, pero tampoco error
    }
    
    // Verificar si hay error explícito
    const errorPatterns = [
      /[?&]error=/,        // URLs con parámetro error
      /access_denied/,     // Acceso denegado
      /[?&]error_code=/,   // URLs con código de error
    ];
    
    if (errorPatterns.some(pattern => pattern.test(url))) {
      return { success: false, action: 'error' };
    }
    
    // Por defecto, continuar (podría ser cualquier otra página intermedia)
    return { success: false, action: 'continue' };
  }
}

// Instancia singleton
const authService = new AuthService();

// Configurar interceptor al importar el servicio
authService.setupAxiosInterceptor();

export default authService;