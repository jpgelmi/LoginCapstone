# 🔐 Guía de Autenticación - Sistema de Medicina Deportiva

## 📋 Tabla de Contenidos
1. [Arquitectura General](#arquitectura-general)
2. [Flujo de Login](#flujo-de-login)
3. [Manejo de Tokens y Sesiones](#manejo-de-tokens-y-sesiones)
4. [Navegación Post-Login](#navegación-post-login)
5. [Roles y Permisos](#roles-y-permisos)
6. [Componentes Clave](#componentes-clave)
7. [Servicios de Autenticación](#servicios-de-autenticación)
8. [Manejo de Errores](#manejo-de-errores)

---

## 🏗️ Arquitectura General

### Stack Tecnológico
- **Frontend**: React Native con TypeScript
- **Backend**: Node.js en `https://e0as.me`
- **Autenticación**: AWS Cognito
- **Gestión de Cookies**: `@react-native-cookies/cookies`
- **HTTP Client**: Axios con interceptores

### Flujo de Alto Nivel
```
Usuario → LoginScreen → AuthWebView → Cognito → Backend → Cookie de Sesión → Dashboard
```

---

## 🔑 Flujo de Login

### 1. **Pantalla Inicial (LoginScreen)**
**Ubicación**: `src/screens/LoginScreen.tsx`

El usuario ve dos opciones:
- **Iniciar Sesión**: Para usuarios existentes
- **Registrarse**: Deshabilitado temporalmente (muestra "Próximamente")

```typescript
const handleLogin = () => {
  setWebViewMode('login');
  setShowWebView(true);
};
```

### 2. **WebView de Autenticación (AuthWebView)**
**Ubicación**: `src/components/AuthWebView.tsx`

#### Funcionamiento:
1. **Carga la URL de autenticación**:
   - Login: `https://e0as.me/auth/login`
   - Registro: `https://e0as.me/registration/signup-url`

2. **Monitorea cambios de navegación**:
```typescript
const handleNavigationStateChange = async (navState: any) => {
  const authResult = authService.handleAuthReturn(navState.url);
  
  if (authResult.success) {
    // Autenticación exitosa detectada
    const sessionCookie = await authService.extractSessionCookie();
    const sessionCheck = await authService.checkSession();
    
    if (sessionCheck.isValid) {
      onSuccess(authResult.action);
    }
  }
};
```

3. **Patrones de URL que detecta**:
   - **Éxito**: URLs que contienen `/auth/callback`, `/dashboard`, `/profile`
   - **Error**: URLs con parámetros `error=` o `access_denied`
   - **Flujo normal**: URLs de Cognito con `/login`, `/oauth2`, `/signup`

### 3. **Proceso de AWS Cognito**
1. Usuario ingresa credenciales en la página de Cognito
2. Cognito valida las credenciales
3. Cognito redirige a: `https://e0as.me/auth/callback`
4. Backend crea una sesión y establece una cookie `__Host-sid`
5. Backend redirige al dashboard

### 4. **Detección de Éxito y Extracción de Cookie**
**Ubicación**: `src/services/AuthService.ts`

```typescript
async extractSessionCookie(): Promise<string | null> {
  // Busca en múltiples dominios
  const domainsToCheck = [
    'https://e0as.me',
    'e0as.me',
    '.e0as.me'
  ];
  
  // Busca cookies con diferentes nombres posibles
  const possibleNames = [
    '__Host-sid',    // Cookie principal del backend
    'session',
    'sessionId',
    'auth_token'
  ];
  
  // Retorna: "nombre=valor" (ej: "__Host-sid=abc123xyz")
}
```

---

## 🍪 Manejo de Tokens y Sesiones

### Cookie de Sesión
- **Nombre**: `__Host-sid`
- **Tipo**: Cookie HTTP-only, Secure, SameSite
- **Dominio**: `e0as.me`
- **Duración**: Gestionada por el backend

### Almacenamiento y Persistencia

#### 1. **Almacenamiento en Memoria**
```typescript
class AuthService {
  private sessionCookie: string | null = null;
  
  async extractSessionCookie(): Promise<string | null> {
    const cookies = await CookieManager.get('https://e0as.me');
    this.sessionCookie = cookies['__Host-sid']?.value;
    return `__Host-sid=${this.sessionCookie}`;
  }
}
```

#### 2. **Almacenamiento Nativo (Persistente)**
La librería `@react-native-cookies/cookies` almacena las cookies de forma nativa:
- **Android**: WebView CookieManager
- **iOS**: HTTPCookieStorage

Las cookies persisten entre sesiones de la app.

### Flujo de Verificación de Sesión

#### Al Iniciar la App
**Ubicación**: `src/contexts/AuthContext.tsx`

```typescript
useEffect(() => {
  initializeAuth();
}, []);

const initializeAuth = async () => {
  setLoading(true);
  
  // 1. Limpiar cookies corruptas si existen
  await authService.clearSession();
  
  // 2. Verificar si hay sesión válida
  const sessionCheck = await authService.checkSession();
  
  // 3. Actualizar estado
  if (sessionCheck.isValid && sessionCheck.user) {
    setIsAuthenticated(true);
    setUser(sessionCheck.user);
  }
  
  setLoading(false);
};
```

### Interceptor de Axios

**Ubicación**: `src/services/AuthService.ts`

Todas las peticiones HTTP incluyen automáticamente la cookie de sesión:

```typescript
setupAxiosInterceptor() {
  axios.interceptors.request.use(async (config) => {
    if (this.sessionCookie) {
      config.headers.Cookie = `__Host-sid=${this.sessionCookie}`;
    } else {
      const fullCookie = await this.extractSessionCookie();
      if (fullCookie) {
        config.headers.Cookie = fullCookie;
      }
    }
    return config;
  });
  
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
```

### Verificación de Sesión Activa

```typescript
async checkSession(): Promise<{ isValid: boolean; user?: UserProfile }> {
  try {
    // Extrae cookie del almacenamiento nativo
    await this.extractSessionCookie();
    
    // Hace petición al backend para validar
    const response = await axios.get(`${BACKEND_URL}/users/my-profile`);
    
    if (response.data.success && response.data.user) {
      return { isValid: true, user: response.data.user };
    }
    
    return { isValid: false };
  } catch (error) {
    if (error.response?.status === 401) {
      // Sin sesión activa
    }
    return { isValid: false };
  }
}
```

---

## 🧭 Navegación Post-Login

### Estructura de Navegación

```
App (AuthProvider)
 └── AppNavigator
      ├── loading: true → LoadingScreen
      ├── !isAuthenticated → LoginScreen
      ├── isAuthenticated && !athleteData → CompleteProfileScreen
      └── isAuthenticated && complete → DashboardScreen
           └── TabBar
                ├── HomeScreen (🏠 Inicio)
                └── ProfileScreen (👤 Perfil)
```

### AppNavigator

**Ubicación**: `src/App.tsx`

```typescript
const AppNavigator: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  
  if (!isAuthenticated) return <LoginScreen />;
  
  // Deportistas sin datos completos
  if (user?.role === 'athlete' && !user.athleteData) {
    return <CompleteProfileScreen />;
  }
  
  return <DashboardScreen />;
};
```

### DashboardScreen

**Ubicación**: `src/screens/DashboardScreen.tsx`

Sistema de pestañas (tabs) implementado manualmente:

```typescript
const DashboardScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  
  const tabs: Tab[] = [
    { id: 'home', title: 'Inicio', icon: '🏠' },
    { id: 'profile', title: 'Perfil', icon: '👤' }
  ];
  
  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen />;
      case 'profile': return <ProfileScreen />;
    }
  };
  
  return (
    <View>
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
      <TabBar tabs={tabs} activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
};
```

### HomeScreen - Vista según Rol

**Ubicación**: `src/screens/HomeScreen.tsx`

#### Para Deportistas (athlete)
```typescript
// Funcionalidades disponibles:
- 💪 Wellness: Registrar estado físico y mental
- 📊 Mis Registros: Ver historial de wellness
- 📝 Formularios: Completar formularios asignados

// Información mostrada:
- Nombre del usuario
- Disciplina deportiva
- Establecimiento
```

#### Para Equipo Médico (health_team, temp_health_team)
```typescript
// Funcionalidades disponibles:
- 👥 Ver Deportistas: Acceder a perfiles y datos de wellness
- Ver historial médico de deportistas
- Asignar formularios

// Información mostrada:
- Nombre del doctor
- Especialidad médica
- Estado de rotación (si aplica)
```

#### Para Entrenadores (trainer)
```typescript
// Funcionalidades disponibles:
- 👥 Ver Deportistas: Acceder a perfiles
- Seguimiento de rendimiento

// Información mostrada:
- Nombre del entrenador
- Establecimiento
- Disciplina deportiva
- Categoría
```

---

## 👥 Roles y Permisos

### Tipos de Usuario

```typescript
type UserRole = 'athlete' | 'health_team' | 'temp_health_team' | 'trainer' | 'admin';
```

### Estructura de Perfil de Usuario

```typescript
interface UserProfile {
  firstName: string;
  lastName: string;
  secondLastName?: string;
  rut: string;
  email: string;
  phone: string;
  role: UserRole;
  
  // Datos específicos por rol
  athleteData?: AthleteData;
  healthTeamData?: HealthTeamData;
  trainerData?: TrainerData;
}
```

#### AthleteData
```typescript
interface AthleteData {
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
}
```

#### HealthTeamData
```typescript
interface HealthTeamData {
  discipline: string;
  isStudent?: boolean;
  rotationEndDate?: string;
}
```

#### TrainerData
```typescript
interface TrainerData {
  establishment: string;
  sportDiscipline: string;
  category: string;
}
```

---

## 🧩 Componentes Clave

### 1. AuthContext

**Ubicación**: `src/contexts/AuthContext.tsx`

Proveedor de contexto global para autenticación:

```typescript
interface AuthContextType {
  // Estado
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
  
  // Métodos
  login: () => Promise<void>;
  register: () => Promise<void>;
  logout: () => Promise<void>;
  completeProfile: (data: any) => Promise<{success: boolean; error?: string}>;
  checkSession: () => Promise<void>;
  clearAuthState: () => void;
}
```

#### Uso en componentes:
```typescript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { isAuthenticated, user, logout } = useAuth();
  
  if (!isAuthenticated) return <LoginScreen />;
  
  return <Text>Hola {user.firstName}</Text>;
};
```

### 2. AuthWebView

**Ubicación**: `src/components/AuthWebView.tsx`

Componente que muestra el WebView para autenticación:

```typescript
interface AuthWebViewProps {
  mode: 'login' | 'register';
  onSuccess: (action: 'login' | 'register') => void;
  onError: (error: string) => void;
  onCancel: () => void;
}
```

**Características**:
- Monitorea cambios de URL en tiempo real
- Detecta redirecciones de éxito/error
- Extrae cookies automáticamente
- Muestra loading indicator
- Maneja botón de retroceso

### 3. TabBar

**Ubicación**: `src/components/TabBar.tsx`

Barra de navegación inferior personalizada:

```typescript
interface Tab {
  id: string;
  title: string;
  icon: string;
}

<TabBar
  tabs={[
    { id: 'home', title: 'Inicio', icon: '🏠' },
    { id: 'profile', title: 'Perfil', icon: '👤' }
  ]}
  activeTab="home"
  onTabPress={(tabId) => setActiveTab(tabId)}
/>
```

---

## 🛠️ Servicios de Autenticación

### AuthService

**Ubicación**: `src/services/AuthService.ts`

Clase singleton que maneja toda la lógica de autenticación:

#### Métodos Principales

##### 1. URLs de Autenticación
```typescript
getLoginUrl(): string
  // → 'https://e0as.me/auth/login'

getRegisterUrl(): string
  // → 'https://e0as.me/registration/signup-url'

getLogoutUrl(): string
  // → 'https://e0as.me/auth/logout'
```

##### 2. Gestión de Cookies
```typescript
async extractSessionCookie(): Promise<string | null>
  // Busca y extrae la cookie de sesión del WebView
  // Retorna: "__Host-sid=valor" o null

async clearSession(): Promise<void>
  // Limpia todas las cookies y la sesión en memoria
  // Usa CookieManager.clearAll() para Android
```

##### 3. Verificación de Sesión
```typescript
async checkSession(): Promise<{ isValid: boolean; user?: UserProfile }>
  // Verifica si hay una sesión válida activa
  // Hace petición a /users/my-profile
  // Retorna información del usuario si está autenticado
```

##### 4. Logout
```typescript
async logout(): Promise<boolean>
  // 1. Llama a /auth/logout en el backend
  // 2. Limpia cookies locales
  // 3. Retorna true si fue exitoso
```

##### 5. Completar Perfil
```typescript
async completeAthleteProfile(profileData): Promise<AuthResponse>
  // POST /registration/complete-profile
  // Solo para deportistas después del registro
```

##### 6. Análisis de URLs
```typescript
isSuccessRedirect(url: string): boolean
  // Verifica si una URL indica autenticación exitosa
  // Patrones: /auth/callback, /dashboard, /profile

handleAuthReturn(url: string): AuthResult
  // Analiza URL y determina el estado
  // Retorna: { success: boolean, action: 'login'|'register'|'error'|'continue' }
```

#### Configuración de Axios

```typescript
// Backend URL
const BACKEND_URL = 'https://e0as.me';

// Configuración global
axios.defaults.withCredentials = true;
axios.defaults.timeout = 10000;

// Cookie de sesión
const SESSION_COOKIE_NAME = '__Host-sid';
```

---

## 🚨 Manejo de Errores

### Tipos de Errores

#### 1. Errores de Red
```typescript
// Códigos detectados:
- NETWORK_ERROR: No hay conexión
- ENOTFOUND: Error DNS
- ECONNREFUSED: Servidor no disponible
- ETIMEDOUT: Timeout
```

**Manejo**:
```typescript
if (error.code === 'ENOTFOUND') {
  Alert.alert(
    'Error DNS',
    'No se pudo resolver el nombre del servidor. Verifica tu conexión.'
  );
}
```

#### 2. Errores HTTP

```typescript
// Status codes:
- 401: Sesión expirada → Limpia cookies y redirige a login
- 403: Acceso denegado → Muestra mensaje de permisos
- 500: Error del servidor → Muestra mensaje de reintentar
```

**Interceptor de respuesta**:
```typescript
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await this.clearSession();
      // El AuthContext detectará el cambio y mostrará login
    }
    return Promise.reject(error);
  }
);
```

#### 3. Errores de WebView

```typescript
// Errores nativos del WebView:
- net::ERR_INTERNET_DISCONNECTED
- net::ERR_NAME_NOT_RESOLVED
- net::ERR_CONNECTION_REFUSED
- net::ERR_SSL_*
```

**Manejo en AuthWebView**:
```typescript
const handleError = async (syntheticEvent) => {
  const { nativeEvent } = syntheticEvent;
  
  // Error de conexión después de autenticación exitosa
  if (isCallbackError && isConnectionError) {
    // Intenta extraer cookie de todos modos
    const sessionCookie = await authService.extractSessionCookie();
    if (sessionCookie) {
      const sessionCheck = await authService.checkSession();
      if (sessionCheck.isValid) {
        onSuccess('login');
        return;
      }
    }
  }
  
  onError('Error cargando la página de autenticación');
};
```

### Mensajes de Error Mejorados

El sistema proporciona mensajes de error claros y accionables:

```typescript
let errorTitle = 'Error de Autenticación';
let errorMessage = error.message;

// Personalización según tipo
if (error.message.includes('Network')) {
  errorTitle = 'Error de Conexión';
  errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
} else if (error.message.includes('timeout')) {
  errorTitle = 'Tiempo de Espera Agotado';
  errorMessage = 'La conexión tardó demasiado tiempo. Por favor, inténtalo nuevamente.';
}

Alert.alert(errorTitle, errorMessage);
```

---

## 🔄 Flujo Completo de Autenticación

### Diagrama de Secuencia

```
Usuario                LoginScreen              AuthWebView              AuthService              Backend              Cognito
  |                         |                         |                         |                        |                    |
  |--[Tap "Login"]--------->|                         |                         |                        |                    |
  |                         |--[setShowWebView]------>|                         |                        |                    |
  |                         |                         |--[getLoginUrl()]------->|                        |                    |
  |                         |                         |                         |--[GET /auth/login]---->|                    |
  |                         |                         |                         |                        |--[Redirect]------->|
  |<--------------------------|--------------------------|-------------------------|-----------------------|<--[Login Page]-----|
  |                         |                         |                         |                        |                    |
  |--[Enter Credentials]----|------------------------>|------------------------>|------------------------|---[Submit]-------->|
  |                         |                         |                         |                        |                    |
  |                         |                         |                         |                        |<--[Auth Token]-----|
  |                         |                         |                         |<--[Callback + Token]---|                    |
  |                         |                         |                         |                        |                    |
  |                         |                         |                         |--[Create Session]----->|                    |
  |                         |                         |                         |<--[Set __Host-sid]-----|                    |
  |                         |                         |<--[Redirect /dashboard]-|                        |                    |
  |                         |                         |                         |                        |                    |
  |                         |                         |--[detectSuccess()]----->|                        |                    |
  |                         |                         |--[extractCookie()]----->|                        |                    |
  |                         |                         |                         |--[getCookies()]------->|                    |
  |                         |                         |<--[Cookie: __Host-sid]--|                        |                    |
  |                         |                         |                         |                        |                    |
  |                         |                         |--[checkSession()]------>|                        |                    |
  |                         |                         |                         |--[GET /my-profile]---->|                    |
  |                         |                         |                         |  (with cookie)         |                    |
  |                         |                         |                         |<--[User Data]----------|                    |
  |                         |                         |<--[Valid Session]-------|                        |                    |
  |                         |                         |                         |                        |                    |
  |                         |<--[onSuccess('login')]--|                         |                        |                    |
  |                         |                         |                         |                        |                    |
  |                         |--[handleAuthSuccess()]->|                         |                        |                    |
  |                         |--[setIsAuthenticated]-->|                         |                        |                    |
  |                         |--[setUser]------------->|                         |                        |                    |
  |                         |                         |                        |                        |                    |
  |<--[Navigate to Dashboard]-------------------------|                        |                        |                    |
```

### Paso a Paso Detallado

1. **Usuario toca "Iniciar Sesión"**
   - LoginScreen muestra AuthWebView
   - mode = 'login'

2. **AuthWebView carga URL de login**
   - URL: `https://e0as.me/auth/login`
   - Backend redirige a Cognito

3. **Usuario ingresa credenciales en Cognito**
   - Página de login de AWS Cognito
   - Usuario ingresa email/password

4. **Cognito valida y redirige**
   - Cognito verifica credenciales
   - Genera token de autenticación
   - Redirige a: `https://e0as.me/auth/callback?code=...`

5. **Backend procesa callback**
   - Intercambia code por tokens
   - Crea sesión en base de datos
   - Establece cookie `__Host-sid`
   - Redirige a: `https://e0as.me/dashboard`

6. **AuthWebView detecta éxito**
   - `handleNavigationStateChange` detecta URL `/dashboard`
   - `isSuccessRedirect()` retorna true

7. **Extracción de cookie**
   - `extractSessionCookie()` busca en dominios
   - Encuentra `__Host-sid` en `https://e0as.me`
   - Almacena en memoria: `this.sessionCookie`

8. **Verificación de sesión**
   - `checkSession()` hace GET a `/users/my-profile`
   - Incluye cookie en headers via interceptor
   - Backend valida cookie y retorna usuario

9. **Actualización de estado**
   - AuthContext recibe `handleAuthSuccess('login')`
   - Actualiza: `isAuthenticated = true`, `user = {...}`
   - AuthWebView se cierra

10. **Navegación automática**
    - AppNavigator detecta `isAuthenticated = true`
    - Renderiza DashboardScreen
    - Usuario ve HomeScreen con sus datos

---

## 🔐 Seguridad

### Cookies Seguras

```typescript
// Cookie configurada por el backend:
__Host-sid
├── HttpOnly: true      // No accesible desde JavaScript
├── Secure: true        // Solo HTTPS
├── SameSite: Strict    // Protección CSRF
└── Domain: e0as.me     // Específico del dominio
```

### HTTPS Obligatorio

```typescript
const BACKEND_URL = 'https://e0as.me';
// Todas las comunicaciones son cifradas
```

### Validación de Sesión

```typescript
// Cada petición incluye la cookie
// El backend valida en cada request:
1. Cookie existe
2. Sesión no expirada
3. Usuario activo
4. Permisos correctos
```

### Limpieza de Sesión

```typescript
// Al cerrar sesión:
async logout() {
  await axios.get('/auth/logout');     // Backend invalida sesión
  await CookieManager.clearAll();      // Limpia cookies locales
  this.sessionCookie = null;           // Limpia memoria
  // AuthContext limpia estado
}
```

---

## 📱 Persistencia entre Sesiones

### Cómo Funciona

1. **Primera vez que usuario inicia sesión**:
   - Cookie se guarda en WebView nativo
   - Almacenamiento persistente del OS

2. **Usuario cierra la app**:
   - Cookie permanece en almacenamiento nativo

3. **Usuario abre la app nuevamente**:
   ```typescript
   useEffect(() => {
     initializeAuth();
   }, []);
   
   // 1. Busca cookie en almacenamiento nativo
   const cookie = await authService.extractSessionCookie();
   
   // 2. Verifica si sigue siendo válida
   const session = await authService.checkSession();
   
   // 3. Si es válida, auto-login
   if (session.isValid) {
     setIsAuthenticated(true);
     setUser(session.user);
   }
   ```

4. **Resultado**:
   - Usuario ve Dashboard directamente
   - No necesita ingresar credenciales nuevamente

### Duración de Sesión

- Controlada por el backend
- Cookie expira según configuración del servidor
- Al expirar, la app detecta 401 y redirige a login

---

## 🧪 Testing y Debug

### Logs del Sistema

El sistema incluye logs detallados en consola:

```typescript
// AuthService
console.log('🔍 AuthService: Verificando sesión...');
console.log('🍪 AuthService: Cookie extraída exitosamente');
console.log('✅ AuthService: Sesión válida encontrada');

// AuthWebView
console.log('🌐 AuthWebView: Navegación detectada:', url);
console.log('🎯 AuthWebView: Redirección de éxito detectada');

// AuthContext
console.log('🚀 AuthContext: Iniciando verificación...');
console.log('✅ AuthContext: Usuario autenticado:', user.email);
```

### Emojis de Log

- 🔍 Verificación/Búsqueda
- 🍪 Operaciones con cookies
- ✅ Operación exitosa
- ❌ Error
- 🌐 Navegación/Red
- 🎯 Detección de evento
- 🚀 Inicio de proceso
- 💥 Error crítico
- ⚠️ Advertencia
- 🔓 Sesión/Autenticación

### Verificar Estado de Sesión

```typescript
// En cualquier componente:
import { useAuth } from '../contexts/AuthContext';

const { isAuthenticated, user, loading } = useAuth();

console.log('Estado:', {
  isAuthenticated,
  user,
  loading
});
```

### Limpiar Sesión Manualmente

```typescript
// Para testing:
import authService from '../services/AuthService';

await authService.clearSession();
```

---

## 📚 Resumen de URLs

| Propósito | URL | Método |
|-----------|-----|--------|
| Iniciar login | `https://e0as.me/auth/login` | GET |
| Callback de auth | `https://e0as.me/auth/callback` | GET |
| Registro | `https://e0as.me/registration/signup-url` | GET |
| Perfil de usuario | `https://e0as.me/users/my-profile` | GET |
| Completar perfil | `https://e0as.me/registration/complete-profile` | POST |
| Logout | `https://e0as.me/auth/logout` | GET |

---

## 🎯 Próximos Pasos

Para implementar nuevas funcionalidades de autenticación:

1. **Agregar nuevo rol**: Actualizar `UserRole` type y agregar datos específicos
2. **Nuevo flujo de auth**: Modificar `AuthWebView` para detectar nuevas URLs
3. **Persistencia adicional**: Extender `AuthService` con nuevos métodos
4. **Nueva pantalla post-login**: Agregar caso en `AppNavigator`

---

## 📞 Soporte

Para problemas de autenticación:
1. Revisar logs en consola (buscar emojis específicos)
2. Verificar conectividad de red
3. Confirmar que backend esté disponible
4. Limpiar cookies y reintentar

---

**Última actualización**: Octubre 2025  
**Versión**: 1.0.0
