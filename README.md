# 🍷 Santo Pecado

![Santo Pecado Banner](https://picsum.photos/seed/santopecado/1200/400?blur=2)

**Santo Pecado** es una plataforma modular y escalable de grado empresarial diseñada para la gestión de medios y mensajería segura. Construida con un enfoque en la privacidad, el rendimiento y una experiencia de usuario inmersiva.

## ✨ Características

- 🛡️ **Seguridad de Grado Empresarial:** Integración robusta con Supabase para autenticación y base de datos.
- 📱 **Mensajería en Tiempo Real:** Chat fluido con soporte para medios.
- 🖼️ **Gestión de Medios:** Feed dinámico con carga y visualización optimizada.
- 🔔 **Notificaciones Push:** Mantente al día con notificaciones nativas del navegador.
- 🎨 **Diseño Glassmorphism:** Interfaz moderna, oscura y elegante inspirada en la estética de lujo.
- ⚡ **Rendimiento:** Carga diferida (lazy loading) y optimización de consultas con TanStack Query.

## 🚀 Tecnologías

- **Frontend:** React 19, Vite, TypeScript.
- **Estilos:** Tailwind CSS 4.
- **Backend:** Supabase (Auth, Database, Storage).
- **Estado:** Zustand & TanStack Query.
- **Animaciones:** Motion (Framer Motion).
- **Iconos:** Lucide React.

## 🛠️ Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/santo-pecado.git
   cd santo-pecado
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Copia el archivo `.env.example` a `.env` y completa tus credenciales de Supabase:
   ```bash
   cp .env.example .env
   ```

4. **Configurar la base de datos:**
   Ejecuta el contenido de `supabase_schema.sql` en el SQL Editor de tu proyecto en Supabase.

5. **Iniciar en desarrollo:**
   ```bash
   npm run dev
   ```

## 📦 Despliegue

Para generar la versión de producción:
```bash
npm run build
```
El contenido de la carpeta `dist` está listo para ser servido en cualquier hosting estático (Vercel, Netlify, GitHub Pages).

## 🤝 Contribuir

Las contribuciones son lo que hacen a la comunidad de código abierto un lugar increíble para aprender, inspirar y crear. Cualquier contribución que hagas será **muy apreciada**.

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para más detalles.

## 📄 Licencia

Distribuido bajo la Licencia MIT. Consulta [LICENSE](LICENSE) para más información.

---
Desarrollado con ❤️ por el equipo de Santo Pecado.
