DOCUMENTACIÓN TÉCNICA Y EJECUTIVA - SISTEMA INPASS BIENESTAR

---

1. EJECUTIVO Y VISIÓN GENERAL
   INPASS Bienestar es una plataforma web progresiva (adaptada visualmente como app móvil) diseñada para la gestión clínica, seguimiento nutricional y control de evolución de pacientes. Permite a los administradores y personal de salud gestionar datos de pacientes e información clínica, mientras que brinda a los pacientes un entorno privado para el registro diario de su peso, visualización de su evolución, acceso a un plan alimentario interactivo (Genially) y módulos de ejercicios.

2. ARQUITECTURA TECNOLÓGICA
   - Lenguaje: TypeScript
   - Framework Frontend: React 18+ (con Vite como bundler)
   - Estilos: Tailwind CSS (Configurado mediante importación global) aplicados con un enfoque mobile-first (max-width: 480px).
   - Backend/Base de Datos: Supabase (PostgreSQL para almacenamiento, Auth para identidades, RLS activado para seguridad granular por roles).
   - Iconografía y Gráficos: Lucide React para íconos, Recharts para visualización de la curva de peso.
   - Utilidades: React Hot Toast para feedback de notificaciones.

3. ESTRUCTURA DE ROLES Y SEGURIDAD (Supabase RLS)
   El sistema maneja controles de acceso basados en tablas de permisos (`acceso`), diferenciando los siguientes niveles (`nivel`):
   - SUPER-ADMIN (SADMIN): Acceso total, incluyendo el alta, baja, modificación de administradores del sistema, pacientes y visualización global.
   - ADMIN: Perfil para nutricionistas/personal clínico con acceso para gestionar la nómina de pacientes, cargar información diferida, visualizar la evolución con métricas completas de sus pacientes y administrar altas.
   - PACIENTE: Perfil con acceso limitado exclusivamente a su propia información de seguimiento. Reglas estrictas mediante Row Level Security (RLS) impiden el acceso a información de terceros.

4. MÓDULOS DEL SISTEMA

   A) PANEL DEL PACIENTE (HOME PACIENTE)
      - Registrar Peso (`PESO`): Interfaz simple e intuitiva de registro diario para el control del peso, con validaciones para evitar subidas erróneas.
      - Mi Evolución (`EVOLUCION`): Gráfica interactiva histórica construida con Recharts que traza la curva de peso a lo largo del tiempo basándose en registros asíncronos y ordenados.
      - Nutrición (`NUTRITION`): Integración a pantalla completa de la presentación "Plan Alimentario Semana 1 y 2" alojada en Genially mediante un iframe inmersivo y responsivo.
      - Ejercicio (`EXERCISE`): Módulo en vía de desarrollo.

   B) PANEL DE ADMINISTRACIÓN (ADMIN/SADMIN)
      - Dashboard Principal (`HOME`): Accesos directos y estadísticas resumidas.
      - Alta Paciente (`ALTAS`) y Modificación (`MODIF`): Formularios para la gestión del ciclo de vida del paciente en el sistema (Supabase Authentication + tabla perfiles).
      - Evolución de Pacientes (`ADMIN_EVOLUCION`): Visualizador clínico para consultar la curva de peso de cualquier paciente activo en el sistema.
      - Carga Diferida (`CARGA_DIFERIDA`): Soporte para ingresar de forma manual o diferida pesos históricos, ideal para consultas presenciales.
      - Sincronización Massiva (`SYNC`): Carga inicial vía archivos Excel.
      - Administradores (`ADMINS`): Configuración interna reservada para SADMINs.

5. DETALLES DE UI/UX Y FLUJOS
   - Interfaz principal restringida a un encuadre máximo de 480px centrado en pantalla, logrando una experiencia emulada de App Móvil nativa idónea tanto en PC como celular.
   - El módulo "Nutrición" elimina la barra de navegación lateral y superior, creando una experiencia inmersiva full screen para el contenido Genially con el botón de salida flotante (X/Home).
   - Identidad visual consolidada mediante paleta de colores institucional: "azul", "verde", "suave", "gris-bg", aportando calidez y profesionalismo médico.

6. ESTRUCTURA DE COMPONENTES CLAVE Y DIRECTORIOS
   - src/App.tsx: Orquestador absoluto, enrutador basado en estado y contenedor principal responsive.
   - src/components/Login.tsx: Integrado de Supabase Auth con manejo inteligente de errores (Email no confirmado, Credenciales inválidas).
   - src/components/AdminPanel.tsx y sus submódulos lógicos.
   - src/components/PatientPanel.tsx: Botonera Home dinámica del paciente e interfaces de Recharts (Evolution).
   - src/components/Sidebar.tsx: Navegación drawer off-canvas compartida entre roles.

7. DESARROLLO Y BACKUP
   - Ejecución local: `npm install` -> `npm run dev`
   - Producción y compresión: `npm run build`
   - Nota Backup: Los scripts auxiliares `.js` e integraciones en raíz facilitaron pruebas para corrección de RLS/Supabase.

---
Última Actualización Ejecutiva: Mayo de 2026