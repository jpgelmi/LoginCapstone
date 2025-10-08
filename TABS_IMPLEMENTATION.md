# Sistema de Pestañas - Dashboard

## Resumen de Cambios

Se ha implementado un sistema de pestañas en el Dashboard principal que reemplaza la vista única anterior. El sistema incluye:

### Estructura de Pestañas

1. **Pestaña Inicio (🏠)**
   - Contenido específico según el rol del usuario
   - **Para Atletas**: Botón destacado de "Wellness" con diseño atractivo
   - **Para Equipo Médico**: Panel vacío con mensaje informativo
   - **Para Entrenadores**: Panel vacío con mensaje informativo

2. **Pestaña Perfil (👤)**
   - Información completa del usuario
   - Datos específicos según el tipo de usuario
   - Botón de cerrar sesión

### Archivos Nuevos Creados

#### `src/screens/HomeScreen.tsx`
- Pantalla principal con contenido específico por rol
- **Funcionalidad destacada para atletas**: Botón Wellness prominente
- Diseño card-based con información rápida
- Estados vacíos elegantes para médicos y entrenadores

#### `src/screens/ProfileScreen.tsx`
- Vista completa del perfil del usuario
- Información personal y profesional
- Datos específicos según el rol (atleta, médico, entrenador)
- Funcionalidad de logout integrada

#### `src/components/TabBar.tsx`
- Componente reutilizable para navegación por pestañas
- Diseño moderno con íconos y texto
- Indicadores visuales para pestaña activa

### Modificaciones

#### `src/screens/DashboardScreen.tsx`
- **COMPLETAMENTE REESCRITO** para usar sistema de pestañas
- Ahora actúa como contenedor de navegación
- Gestiona el estado de pestaña activa
- Renderiza el contenido correcto según la pestaña seleccionada

## Características Específicas por Rol

### Atletas
- **Pantalla Inicio**: Botón "Wellness" prominente con diseño atractivo
- **Información rápida**: Disciplina deportiva y establecimiento
- **Perfil**: Datos deportivos completos incluyendo información PUC si aplica

### Equipo Médico
- **Pantalla Inicio**: Panel vacío con mensaje "próximamente"
- **Perfil**: Información médica (disciplina, estatus de estudiante, rotación)

### Entrenadores
- **Pantalla Inicio**: Panel vacío con mensaje "próximamente"
- **Perfil**: Información de entrenamiento (establecimiento, disciplina, categoría)

## Navegación

- **Navegación por pestañas**: Toca los íconos en la parte inferior
- **Estado persistente**: La pestaña activa se mantiene durante la sesión
- **Logging**: Cada cambio de pestaña se registra en console.log

## Diseño

- **Colores**: Esquema moderno con azul (#2563eb) para elementos activos
- **Tipografía**: Jerarquía clara con diferentes pesos de fuente
- **Espaciado**: Diseño consistente con márgenes y padding uniformes
- **Sombras**: Cards con sombras sutiles para profundidad visual
- **Safe Area**: Compatible con dispositivos modernos (notch, etc.)

## Funcionalidad del Botón Wellness

El botón Wellness en la pantalla de inicio para atletas:
- **Diseño prominente**: Card grande con ícono, título y descripción
- **Estado actual**: Solo muestra console.log cuando se toca
- **Preparado para**: Navegación futura a pantalla de wellness dedicada

## Próximos Pasos Recomendados

1. **Implementar pantalla de Wellness** específica para atletas
2. **Agregar contenido real** para médicos y entrenadores
3. **Implementar navegación** desde el botón Wellness
4. **Agregar más pestañas** si es necesario (ej: Notificaciones, Configuración)

## Testing

La aplicación ha sido compilada y desplegada exitosamente en Android (dispositivo R5CW71L32ZB).