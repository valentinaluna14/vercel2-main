# Frontend - Sistema de Gestión de Usuarios

Aplicación web frontend moderna para consumir la API REST de gestión de usuarios.

## 🚀 Tecnologías Utilizadas

- **HTML5**: Estructura semántica y accesible
- **CSS3**: Estilos personalizados con variables CSS
- **JavaScript ES6+**: Módulos, async/await, clases
- **Bootstrap 5.3.2**: Framework CSS responsive
- **Bootstrap Icons**: Iconografía moderna

## 📁 Estructura del Proyecto

```
frontend/
├── index.html              # Página principal
├── css/
│   └── styles.css         # Estilos personalizados
├── js/
│   ├── api.js            # Módulo de comunicación con API
│   ├── ui.js             # Módulo de interfaz de usuario
│   └── app.js            # Módulo principal (controlador)
└── README.md             # Este archivo
```

## 🏗️ Arquitectura

La aplicación sigue el patrón **MVC (Model-View-Controller)**:

### Módulos

1. **api.js (Model)**
   - Comunicación con el backend
   - Operaciones CRUD (Create, Read, Update, Delete)
   - Manejo de errores de API
   - Validación de datos
   - Timeout y manejo de promesas

2. **ui.js (View)**
   - Manipulación del DOM
   - Renderizado de usuarios en tabla
   - Gestión de modales
   - Alertas y notificaciones
   - Estados de carga
   - Validación de formularios

3. **app.js (Controller)**
   - Coordinación entre API y UI
   - Event listeners
   - Lógica de negocio
   - Manejo centralizado de errores

## ✨ Características

### Funcionalidades Principales

- ✅ **Listar Usuarios**: Tabla responsive con todos los usuarios
- ✅ **Crear Usuario**: Modal con validación en tiempo real
- ✅ **Editar Usuario**: Modificación de datos existentes
- ✅ **Eliminar Usuario**: Confirmación antes de eliminar
- ✅ **Validación**: HTML5 + validación personalizada
- ✅ **Feedback Visual**: Alertas, spinners, estados vacíos
- ✅ **Responsive**: Diseño adaptable a móviles y tablets

### Características Técnicas

- **Modularidad**: Código organizado en módulos ES6
- **Separación de responsabilidades**: Patrón MVC
- **Manejo de errores**: Try-catch con mensajes descriptivos
- **Escapado de HTML**: Prevención de XSS
- **Accesibilidad**: ARIA labels y navegación por teclado
- **Performance**: Cacheo de elementos DOM
- **UX**: Transiciones suaves y estados de carga

## 🔧 Configuración

### Requisitos Previos

1. **Backend corriendo**: La API debe estar ejecutándose en `http://localhost:8080`
2. **Navegador moderno**: Chrome, Firefox, Edge, Safari (con soporte para ES6 modules)

### Configuración de la API

Si necesitas cambiar la URL de la API, edita el archivo `js/api.js`:

```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api/usuarios',  // Cambiar aquí
    HEADERS: {
        'Content-Type': 'application/json'
    },
    TIMEOUT: 10000
};
```

## 🚀 Cómo Usar

### Opción 1: Abrir directamente en el navegador

```bash
# Navegar a la carpeta frontend
cd frontend

# Abrir index.html en el navegador
# Windows
start index.html

# Linux
xdg-open index.html

# macOS
open index.html
```

### Opción 2: Usar un servidor HTTP local

```bash
# Con Python 3
python -m http.server 3000

# Con Node.js (npx)
npx http-server -p 3000

# Con PHP
php -S localhost:3000
```

Luego abrir: `http://localhost:3000`

### Opción 3: Usar Live Server (VS Code)

1. Instalar extensión "Live Server" en VS Code
2. Click derecho en `index.html`
3. Seleccionar "Open with Live Server"

## 📝 Operaciones Disponibles

### Crear Usuario

1. Click en botón **"Alta de Usuario"**
2. Llenar formulario:
   - Nombre: Mínimo 2 caracteres
   - Email: Formato válido
   - Password: Mínimo 6 caracteres
3. Click en **"Guardar"**

### Editar Usuario

1. Click en botón **"Editar"** en la fila del usuario
2. Modificar datos en el modal
3. Click en **"Guardar"**

### Eliminar Usuario

1. Click en botón **"Eliminar"** en la fila del usuario
2. Confirmar en el modal de confirmación
3. Click en **"Eliminar Usuario"**

### Recargar Lista

- Click en botón **"Recargar"** para actualizar la tabla

## 🎨 Personalización

### Cambiar Colores

Editar variables CSS en `css/styles.css`:

```css
:root {
    --primary-color: #0d6efd;
    --secondary-color: #6c757d;
    --success-color: #198754;
    --danger-color: #dc3545;
    /* ... más variables */
}
```

### Modificar Timeouts

Editar en `js/api.js`:

```javascript
const API_CONFIG = {
    TIMEOUT: 10000  // Milisegundos (10 segundos)
};
```

## 🔒 Seguridad

- **Escapado de HTML**: Prevención de ataques XSS
- **Validación de entrada**: Cliente y servidor
- **HTTPS recomendado**: Para producción
- **CORS configurado**: En el backend

## 🐛 Solución de Problemas

### Error de conexión

```
No se pudo conectar con el servidor
```

**Solución**: Verificar que el backend esté corriendo en `http://localhost:8080`

```bash
# Iniciar el backend
cd ../
./gradlew bootRun
```

### CORS Error

```
Access to fetch at 'http://localhost:8080' has been blocked by CORS policy
```

**Solución**: El backend ya tiene CORS configurado para `http://localhost:3000`. Si usas otro puerto, agrégalo en `WebConfig.java` del backend.

### Módulos no cargan

```
Failed to load module script
```

**Solución**: Usar un servidor HTTP (no abrir el archivo directamente con `file://`)

## 📊 Validaciones

### Nombre
- ✅ Obligatorio
- ✅ Mínimo 2 caracteres
- ✅ Máximo 100 caracteres

### Email
- ✅ Obligatorio
- ✅ Formato válido
- ✅ Único en el sistema

### Password
- ✅ Obligatorio
- ✅ Mínimo 6 caracteres

## 🎯 Mejores Prácticas Implementadas

1. **Modularidad**: Código organizado en módulos
2. **Separación de responsabilidades**: MVC pattern
3. **DRY**: No repetir código
4. **Nombres descriptivos**: Variables y funciones claras
5. **Comentarios**: JSDoc en funciones importantes
6. **Manejo de errores**: Try-catch consistente
7. **Async/await**: Código asíncrono legible
8. **Arrow functions**: Sintaxis moderna
9. **Template literals**: Strings dinámicos
10. **Destructuring**: Código más limpio

## 📱 Responsive Design

- **Desktop**: Tabla completa con todas las columnas
- **Tablet**: Botones adaptados
- **Mobile**: Tabla scrolleable horizontalmente

## 🔄 Flujo de Datos

```
Usuario interactúa → app.js (Controller)
                         ↓
                    api.js (Model) → Backend API
                         ↓
                    Respuesta JSON
                         ↓
                    ui.js (View) → Renderiza en DOM
```

## 📚 Recursos Adicionales

- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [MDN JavaScript Modules](https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Modules)
- [Fetch API](https://developer.mozilla.org/es/docs/Web/API/Fetch_API)

## 👨‍💻 Desarrollo

```bash
# Estructura de desarrollo recomendada
frontend/
├── index.html       # Página principal
├── css/
│   └── styles.css  # Estilos
└── js/
    ├── api.js      # Capa de datos
    ├── ui.js       # Capa de presentación
    └── app.js      # Capa de control
```

## 🚀 Próximas Mejoras

- [ ] Paginación de usuarios
- [ ] Búsqueda y filtrado
- [ ] Ordenamiento por columnas
- [ ] Exportar a CSV/Excel
- [ ] Modo oscuro
- [ ] PWA (Progressive Web App)
- [ ] Tests unitarios (Jest)
- [ ] CI/CD pipeline

---

**Desarrollado con ❤️ usando HTML5, CSS3 y JavaScript ES6+**