# LoginCapstone - Implementación de Autenticación React Native

## 📋 Resumen

Esta implementación proporciona un sistema completo de autenticación para React Native que se integra con el backend de AWS Cognito siguiendo el enfoque descrito en `guide-frontend-integration.md`.

## 🏗️ Arquitectura

### Componentes principales:

1. **AuthService** (`src/services/AuthService.ts`)
   - Manejo de cookies de sesión
   - Interceptor de Axios para autenticación automática
   - Métodos para login, logout y verificación de sesión
   - Integración con `@react-native-cookies/cookies`

2. **AuthWebView** (`src/components/AuthWebView.tsx`)
   - WebView para manejar Cognito Hosted UI
   - Detección de redirecciones exitosas
   - Extracción automática de cookies de sesión
   - Manejo de errores y cancelación

3. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Estado global de autenticación
   - Verificación automática de sesión al inicio
   - Métodos para completar perfil de deportistas

4. **Pantallas**:
   - `LoginScreen`: Pantalla principal con opciones de login/registro
   - `CompleteProfileScreen`: Formulario para deportistas
   - `DashboardScreen`: Panel principal post-autenticación

## 🚀 Flujo de Autenticación

### 1. Login
```
Usuario toca "Iniciar Sesión" → AuthWebView abre Cognito → 
Usuario completa auth → Redirección detectada → 
Cookie extraída → Sesión verificada → Dashboard
```

### 2. Registro de Deportista
```
Usuario toca "Registrarse" → AuthWebView abre signup → 
Usuario registra en Cognito → Email verificado → 
Cookie extraída → CompleteProfileScreen → Dashboard
```

### 3. Verificación de Sesión
```
App inicia → AuthContext verifica cookie → 
GET /users/my-profile → Establece estado de auth
```

## 📦 Dependencias Instaladas

```json
{
  "react-native-webview": "^13.x",
  "@react-native-cookies/cookies": "^6.x",
  "axios": "^1.x",
  "@react-native-picker/picker": "^2.x"
}
```

## 🔧 Configuración

### 1. Backend URL
El URL del backend está configurado en `AuthService.ts`:
```typescript
const BACKEND_URL = 'http://e0as.me';
```

### 2. Cookie de Sesión
El nombre de la cookie está configurado como:
```typescript
const SESSION_COOKIE_NAME = 'connect.sid';
```

## 📱 Uso

### Inicialización
```tsx
import App from './App';
// El AuthProvider ya está configurado en App.tsx
```

### Hook de Autenticación
```tsx
import { useAuth } from './src/contexts/AuthContext';

function MyComponent() {
  const { isAuthenticated, user, logout } = useAuth();
  
  // usar estado de autenticación
}
```

### Completar Perfil
```tsx
const { completeProfile } = useAuth();

const result = await completeProfile({
  email: "usuario@uc.cl",
  firstName: "Juan",
  lastName: "Pérez",
  // ... otros campos
});
```

## 🛡️ Características de Seguridad

- ✅ **Cookies HTTPOnly**: Manejadas automáticamente por el WebView
- ✅ **Verificación de sesión**: Automática al iniciar la app
- ✅ **Interceptor de Axios**: Añade cookies a todas las peticiones
- ✅ **Manejo de errores 401**: Limpia sesión automáticamente
- ✅ **Validación de redirecciones**: Detecta URLs exitosas vs errores

## 🔄 Estados de la Aplicación

1. **Loading**: Verificando sesión inicial
2. **No Autenticado**: Muestra LoginScreen
3. **Autenticado sin perfil**: Muestra CompleteProfileScreen (solo deportistas)
4. **Autenticado con perfil**: Muestra DashboardScreen

## 📧 Integración con Backend

### Endpoints utilizados:
- `GET /auth/login` - Inicio de login
- `GET /registration/signup-url` - Inicio de registro
- `GET /auth/logout` - Cerrar sesión
- `POST /registration/complete-profile` - Completar perfil deportista
- `GET /users/my-profile` - Verificar sesión y obtener datos

### Manejo de cookies:
- Extracción automática después de autenticación
- Inclusión en headers de todas las peticiones HTTP
- Limpieza al hacer logout o en errores 401

## 🐛 Debugging

### Logs importantes:
```javascript
// En AuthService
console.log('Session cookie extracted successfully');
console.log('User authenticated:', email);

// En AuthWebView
console.log('Navigation to:', url);

// En AuthContext
console.log('Login successful for user:', email);
```

### Verificar cookies:
```javascript
import CookieManager from '@react-native-cookies/cookies';

const cookies = await CookieManager.get('http://e0as.me');
console.log('Current cookies:', cookies);
```

## 🚨 Posibles Problemas

1. **WebView no carga**: Verificar conectividad y URL del backend
2. **Cookie no se extrae**: Verificar que `sharedCookiesEnabled={true}` en WebView
3. **Error 401 en peticiones**: Verificar que el interceptor esté funcionando
4. **Redirección no detectada**: Ajustar patrones en `isSuccessRedirect()`

## 📋 TODO / Mejoras Futuras

- [ ] Implementar refresh automático de tokens
- [ ] Añadir deep linking para URLs externas
- [ ] Implementar MFA (Multi-Factor Authentication)
- [ ] Añadir persistencia offline del estado
- [ ] Implementar recuperación de contraseña
- [ ] Tests unitarios y de integración

## 🤝 Contribución

Para modificar la implementación:

1. **AuthService**: Cambios en lógica de autenticación/cookies
2. **AuthWebView**: Modificar detección de redirecciones
3. **AuthContext**: Añadir nuevo estado global
4. **Pantallas**: Cambios en UI/UX

---

Esta implementación sigue las mejores prácticas de React Native y se integra perfectamente con el backend AWS Cognito existente.