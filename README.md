# Sistema de Escrutinio Electoral — Rumiñahui (ADN Lista 7)

Aplicación móvil multiplataforma desarrollada con Expo y React Native para el registro, validación y monitoreo en tiempo real del escrutinio electoral de **Alcaldía** y **Prefectura** en el cantón **Rumiñahui** (provincia de Pichincha, Ecuador).

---

## Roles y alcance funcional

| Rol | Responsabilidades principales |
| --- | --- |
| **Coordinador Provincial** | Visualiza el avance del escrutinio (Exit Poll) en tiempo real por dignidad y recinto, consulta evidencia fotográfica y geolocalización de actas, gestiona recintos asignando coordinadores y supervisa el monitor de errores (Sentry). |
| **Coordinador de Recinto** | Registra veedores con validación de cédula y correo, asigna o reemplaza veedores en las Juntas Receptoras del Voto (JRV) de su recinto y puede revisar o corregir actas ya ingresadas. |
| **Veedor** | Registra y actualiza actas de sus JRV asignadas (Alcaldía y Prefectura) con cuadratura aritmética, fotografía verificada por nitidez y coordenadas GPS, operando tanto en línea como sin conexión. |

---

## Arquitectura

El proyecto implementa **Clean Architecture** combinada con **Vertical Slicing** por dominio funcional:

```text
src/
├── app/                     # Rutas y pantallas (Expo Router) + _layout.tsx (Composition Root)
├── features/
│   ├── auth/                # Autenticación, primer ingreso, OTP y validación de identidad
│   ├── scrutiny/            # Registro de actas, cuadratura, evidencia y cola offline
│   ├── territory/           # Recintos electorales, JRVs y asignación de personal
│   └── tracking/            # Exit Poll en tiempo real, avance por recinto y monitor de errores
│       ├── domain/          # Entidades, reglas de negocio y puertos (TypeScript puro)
│       ├── application/     # Casos de uso (solo dependen de contratos en domain)
│       ├── infrastructure/  # Repositorios Supabase, AsyncStorage, APIs externas y hardware
│       └── presentation/    # Hooks de estado y componentes visuales del feature
└── shared/
    ├── domain/              # Errores de dominio e interfaces transversales (INetworkStatusService)
    ├── infrastructure/      # Cliente Supabase, Sentry, NetInfo, QueryClient persistente y GPS
    └── ui/                  # Tema ADN, componentes reutilizables (AdnHero, AnimatedModal, FeedbackModal)
```

### Reglas de dependencia automatizadas

En `eslint.config.js` se aplican reglas `no-restricted-imports` para hacer cumplir la arquitectura en cada revisión:

- `domain/` es 100% TypeScript puro (sin imports de `application`, `infrastructure`, UI, React, Expo ni SDKs).
- `application/` solo depende de contratos en `domain/` y `@shared/domain/`.
- Las pantallas en `src/app/` (excepto `_layout.tsx`) y los componentes visuales no pueden importar directamente de `infrastructure/`.
- Cada feature está aislado y no puede importar módulos internos de otro feature.

---

## Stack tecnológico

- **Framework:** Expo SDK 57, React Native 0.86, React 19, TypeScript, Expo Router.
- **Backend y datos:** Supabase (PostgreSQL, Auth, Storage, Realtime y Row Level Security).
- **Estado y caché:** TanStack React Query con persistencia local (`AsyncStorage`) y Zustand.
- **Formularios y validación:** React Hook Form y Zod.
- **Animaciones y gráficos:** React Native Reanimated, Lottie y `react-native-gifted-charts`.
- **Evidencia y hardware:** `expo-image-picker`, `expo-image-manipulator`, `jpeg-js` (análisis de nitidez), `expo-location` y `expo-secure-store`.
- **Observabilidad:** Sentry (`@sentry/react-native`) con `ErrorBoundary` global, captura de contexto (dispositivo, SO, pantalla, usuario, GPS) y soporte de crash nativo en APK.

---

## Características técnicas destacadas

- **Operación Offline-First:** las actas capturadas sin red se encolan localmente en `AsyncStorage` y se sincronizan automáticamente al recuperar conectividad, con control de concurrencia optimista (`version`).
- **Validación de identidad y acceso:** verificación de cédula ecuatoriana y correo real al registrar usuarios subordinados, generación de contraseña temporal enviada por correo, cambio obligatorio en primer ingreso y recuperación mediante código OTP de 8 dígitos.
- **Integridad electoral:** validación de cuadratura (`Total sufragantes = Votos válidos + Blancos + Nulos`), control de nitidez sobre la fotografía del acta y georreferenciación obligatoria.

---

## Configuración y ejecución

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes claves:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_SENTRY_AUTH_TOKEN=
EXPO_PUBLIC_CEDULA_API_URL=
EXPO_PUBLIC_CEDULA_API_KEY=
EXPO_PUBLIC_EMAIL_API_URL=
EXPO_PUBLIC_EMAIL_API_KEY=
```

### 3. Comandos principales

```bash
npx expo start        # Iniciar servidor de desarrollo
npx tsc --noEmit      # Verificar tipos TypeScript
npx expo lint         # Ejecutar ESLint y reglas de arquitectura
```

### 4. Generación de APK (Android)

```bash
npx eas-cli@latest build -p android --profile preview
```
