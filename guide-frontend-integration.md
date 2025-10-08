# Guía de Integración Frontend - Flujo de Registro y Login

## 📋 Resumen del Flujo

El backend maneja la autenticación con **AWS Cognito** y el registro de usuarios con **AWS SES**. El frontend debe integrarse con estos endpoints para completar el flujo de registro y login.

## 🔄 Flujo Completo

### 1. **Registro de Usuario Deportista**
```
Frontend → Cognito Hosted UI → Verificación Email → Frontend → Backend
```

### 2. **Login de Usuario**
```
Frontend → Cognito Hosted UI → Backend (validación cookie) → Frontend
```

## 🚀 Endpoints del Backend

### **Registro Deportista**

#### 1. Iniciar Registro
```http
GET /registration/signup-url
```
**Respuesta**: Redirección automática a Cognito Hosted UI para registro

#### 2. Completar Perfil (Después de verificar email en Cognito) (necesita que mandes cookie de sesión que se recibe al terminar el registro en Cognito)
```http
POST /registration/complete-profile
Content-Type: application/json
Cookie: connect.sid=<SESSION_COOKIE>

{
  "email": "usuario@ejemplo.com",
  "firstName": "Juan",
  "lastName": "Pérez",
  "secondLastName": "González",
  "rut": "12345678-9",
  "phone": "+56912345678",
  "role": "athlete",
  "athleteData": {
    "birthDate": "1995-01-01",
    "biologicalSex": "masculino",
    "insurance": { "type": "FONASA" },
    "establishment": "PUC",
    "sportDiscipline": "futbol",
    "professionalAspiration": true,
    "otherSports": [],
    "pucData": {
      "career": "Ingeniería",
      "competitiveLevel": "seleccionado_uc",
      "universityEntryYear": 2020,
      "projectedGraduationYear": 2025
    }
  }
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Perfil completado exitosamente",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "usuario@ejemplo.com",
    "role": "athlete",
    "cognitoUserId": "usuario"
  }
}
```

**Validaciones importantes:**
- ✅ **Solo deportistas**: `role` debe ser `"athlete"`
- ✅ **Email coincidente**: El email debe coincidir con el usuario autenticado
- ✅ **Asignación automática**: Se agrega automáticamente al grupo `athlete` de Cognito
- ✅ **Email de bienvenida**: Se envía automáticamente al completar el perfil

**Posibles errores:**
- **403 Forbidden**: Si el rol no es `"athlete"` o el email no coincide
- **409 Conflict**: Si el usuario ya existe en el sistema
- **400 Bad Request**: Si faltan campos obligatorios o datos inválidos
- **401 Unauthorized**: Si no hay cookie de sesión válida

### **Login**

#### 1. Iniciar Login
```http
GET /auth/login
```
**Respuesta**: Redirección automática a Cognito Hosted UI para login, al completar login se guarda la cookie de sesión

### **Logout**

#### 2. Cerrar sesión
```http
GET /auth/logout
```
**Respuesta**: Se borra la cookie de sesión


### **MFA (Autenticación Multifactor)**

#### **Autenticación Requerida**
- ✅ **Cookie de sesión**

#### 1. Activar MFA por Email
```http
POST /mfa/enable-email

```

#### 2. Desactivar MFA
```http
POST /mfa/disable

```

#### 3. Verificar Estado del MFA
```http
GET /mfa/status

```

**Respuesta de ejemplo:**
```json
{
  "success": true,
  "mfaStatus": {
    "enabled": true,
    "type": "email",
    "email": "usuario@ejemplo.com"
  }
}
```



### **2. Flujo de Registro**
```javascript
// 1. Redirigir a registro
window.location.href = 'http://e0as.me/registration/signup-url';

// 2. Después de verificar email en Cognito, el usuario regresa con cookie de sesión
// 3. Mostrar formulario de completar perfil
// 4. Enviar datos al backend mediante registration/complete-profile (la cookie se envía automáticamente)
```

### **3. Flujo de Login**
```javascript
// 1. Redirigir a login
window.location.href = 'http://e0as.me/auth/login';

// 2. Después del login exitoso, el usuario regresa con cookie de sesión
// 3. Hacer requests autenticados (la cookie se envía automáticamente)
```



## 📧 Correos Automáticos

El backend envía automáticamente:
- ✅ **Correo de verificación** (Cognito + SES)
- ✅ **Correo de bienvenida** (SES) - Al completar perfil
- ✅ **Correo de recuperación** (SES) - Para reset de contraseña


## 🔐 Rutas de Administración

### **Flujo de Registro por Admin**

El sistema permite que un administrador registre usuarios de tipo `HEALTH_TEAM`, `TEMP_HEALTH_TEAM` y `TRAINER` sin que estos pasen por el flujo de auto-registro.

#### **Autenticación Requerida**
- ✅ **Cookie de sesión** válida del admin
- ✅ **Rol 'admin'** en Cognito
- ✅ **Middleware de protección**: `checkAuth` + `requireAnyRole('admin')`

#### **Endpoints de Registro por Admin**

##### 1. **Registrar Equipo de Salud Permanente**
```http
POST /admin/register/health-team
Content-Type: application/json

{
  "firstName": "Dr. María",
  "lastName": "González",
  "secondLastName": "López",
  "rut": "12345678-9",
  "email": "maria.gonzalez@uc.cl",
  "phone": "+56912345678",
  "healthTeamData": {
    "discipline": "medicina",
    "isStudent": false
  }
}
```

##### 2. **Registrar Equipo de Salud Temporal (Estudiante)**
```http
POST /admin/register/temp-health-team
Content-Type: application/json

{
  "firstName": "Ana",
  "lastName": "Estudiante",
  "secondLastName": "Pérez",
  "rut": "87654321-0",
  "email": "ana.estudiante@uc.cl",
  "phone": "+56987654321",
  "healthTeamData": {
    "discipline": "kinesiologia",
    "isStudent": true,
    "rotationEndDate": "2025-12-31"
  }
}
```

##### 3. **Registrar Entrenador**
```http
POST /admin/register/trainer
Content-Type: application/json

{
  "firstName": "Carlos",
  "lastName": "Entrenador",
  "secondLastName": "Martínez",
  "rut": "11223344-5",
  "email": "carlos.entrenador@uc.cl",
  "phone": "+56911223344",
  "trainerData": {
    "establishment": "PUC",
    "sportDiscipline": "Fútbol",
    "category": "Profesional"
  }
}
```

#### **Endpoints de Gestión de Usuarios**

##### 4. **Listar Todos los Usuarios**
```http
GET /admin/users
```

### **Flujo Técnico del Registro por Admin**

### **Características del Sistema**

#### **🔐 Seguridad**
- **Solo admin puede registrar**: Middleware `requireAnyRole('admin')`
- **Contraseñas temporales**: Generadas automáticamente (12 caracteres seguros)
- **Username único**: Parte antes del `@` del email
- **Grupos de Cognito**: Asignación automática según rol

#### **📧 Notificaciones**
- **Email automático** con credenciales temporales
- **Formato del email**: "Usuario: test" (no "Email: test@example.com")
- **Contraseña temporal**: Se debe cambiar en primer login


### **Respuestas de Ejemplo**

#### **Registro Exitoso (201)**
```json
{
  "success": true,
  "message": "Usuario HEALTH_TEAM registrado exitosamente.",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "maria.gonzalez@uc.cl",
    "role": "HEALTH_TEAM",
    "cognitoUserId": "maria.gonzalez"
  }
}
```

#### **Error de Validación (400)**
```json
{
  "error": "Faltan campos obligatorios para el Equipo de Salud"
}
```

#### **Error de Permisos (403)**
```json
{
  "error": "Acceso denegado. Se requiere rol de administrador."
}
```




## 📄 Endpoint: Obtener Mi Perfil (Autenticado)

```http
GET /users/my-profile
Cookie: connect.sid=<SESSION_COOKIE>
```

- Requiere sesión válida (cookie).
- Usa el `userId` de la sesión para obtener el usuario desde la base de datos.
- Si no existe el usuario en BD, retorna 401/404 según corresponda.

### Respuesta exitosa (200)

Campos base presentes para todos los usuarios:
- firstName, lastName, secondLastName, rut, email, phone, role

Dependiendo del `role` se incluyen datos adicionales:

- role = `athlete`: `athleteData`
  - birthDate, biologicalSex, insurance, establishment, sportDiscipline, professionalAspiration, otherSports, pucData?, cducData?

- role = `health_team`: `healthTeamData`
  - discipline

- role = `temp_health_team`: `healthTeamData`
  - discipline, isStudent, rotationEndDate

- role = `trainer`: `trainerData`
  - establishment, sportDiscipline, category

- role = `admin`: `adminData` (placeholder)

#### Ejemplo (athlete)
```json
{
  "success": true,
  "user": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "secondLastName": "González",
    "rut": "12345678-9",
    "email": "juan@uc.cl",
    "phone": "+56912345678",
    "role": "athlete",
    "athleteData": {
      "birthDate": "2000-05-15T00:00:00.000Z",
      "biologicalSex": "masculino",
      "insurance": { "type": "FONASA" },
      "establishment": "PUC",
      "sportDiscipline": "futbol",
      "professionalAspiration": true,
      "otherSports": [],
      "pucData": {
        "career": "Ingeniería",
        "competitiveLevel": "elite",
        "universityEntryYear": 2019,
        "projectedGraduationYear": 2024
      }
    }
  }
}
```

### Posibles errores
- 401: Usuario autenticado no registrado en la base de datos
- 404: Usuario no encontrado en la base de datos
- 500: Error obteniendo perfil
