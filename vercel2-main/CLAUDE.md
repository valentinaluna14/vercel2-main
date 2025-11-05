# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a vanilla JavaScript frontend application for user management (CRUD operations). It communicates with a REST API backend hosted at `https://usuarios-mvgv.onrender.com`.

**Tech Stack:**
- HTML5, CSS3, JavaScript ES6+ (modules, async/await)
- Bootstrap 5.3.2 for UI components
- No build tools or package manager - runs directly in browser

## Development Setup

### Running the Application

The application requires a local HTTP server (cannot run via `file://` due to ES6 modules). No build process, dependencies, or compilation required - this is pure vanilla JavaScript.

**Option 1 - Python:**
```bash
python -m http.server 3000
```

**Option 2 - Node.js:**
```bash
npx http-server -p 3000
```

**Option 3 - PHP:**
```bash
php -S localhost:3000
```

Then open: `http://localhost:3000`

### Backend Dependency

The backend API is hosted at `https://usuarios-mvgv.onrender.com/api/usuarios`. To change the API URL, edit `API_CONFIG.BASE_URL` in `js/api.js:11`.

## Architecture

The application follows **MVC (Model-View-Controller)** pattern with ES6 modules:

### Module Structure

1. **`js/api.js`** (Model)
   - All API communication and CRUD operations
   - Exports `API` object with methods: `obtenerUsuarios()`, `obtenerUsuarioPorId()`, `crearUsuario()`, `actualizarUsuario()`, `eliminarUsuario()`
   - Custom `ApiError` class for structured error handling
   - Implements fetch with timeout (10s default) using AbortController
   - Client-side validation before API calls

2. **`js/ui.js`** (View)
   - DOM manipulation and rendering
   - Exports `UI` object with rendering methods and `DOM` object with cached element references
   - All HTML is escaped via `escaparHTML()` method to prevent XSS
   - Bootstrap Modal instances are initialized in DOM object
   - Loading states, alerts, and form validation UI
   - Password visibility toggle feature (ui.js:337-344)

3. **`js/app.js`** (Controller)
   - Entry point that coordinates Model and View
   - `App` class handles event delegation and business logic
   - Imports `API` from api.js and `UI`/`DOM` from ui.js
   - Initializes on DOMContentLoaded

### Key Patterns

- **Event Delegation**: Table button clicks handled via delegation on `DOM.usuariosTableBody` (app.js:91-103)
- **DOM Caching**: All DOM elements cached in `DOM` object (ui.js:12-51) for performance
- **Error Handling**: Try-catch blocks with centralized error handling in `app.manejarError()` (app.js:259-286)
- **Loading States**: All async operations show loading spinners and disable buttons to prevent double-submission
- **Data Flow**: User interaction → Controller (app.js) → Model (api.js) → Backend API → Model processes response → Controller updates View (ui.js) → DOM update

## Common Modifications

### Adding New API Endpoints

1. Add method to `API` object in `js/api.js`
2. Use `fetchWithTimeout()` helper and `handleResponse()` for consistency
3. Add error handling in the controller (`app.js`)

### Adding UI Components

1. Add HTML structure to `index.html`
2. Cache DOM elements in `DOM` object (`ui.js:12-51`)
3. Create rendering/manipulation methods in `UI` object
4. Wire up event listeners in `App.configurarEventListeners()` (`app.js:69-124`)

### Changing Validation Rules

- HTML5 validation attributes in `index.html` (lines 143-200)
- Client-side validation in `API.validarDatosUsuario()` (`api.js:200-212`)
- Backend validation errors handled via `ApiError` status codes

## Important Notes

### Security

- **XSS Prevention**: All user content must pass through `UI.escaparHTML()` before rendering
- **CORS**: Backend must have CORS configured for the frontend's origin
- **Password Handling**: Password is required for both create and update operations. On edit, if left empty, defaults to 'password123' (see ui.js:173)

### Bootstrap Modals

Modal instances are created in the DOM object initialization:
```javascript
modalUsuario: new bootstrap.Modal(document.getElementById('modalUsuario'))
```

Use `DOM.modalUsuario.show()` / `DOM.modalUsuario.hide()` - never use jQuery methods.

### ES6 Modules

All JavaScript files use ES6 module syntax (`import`/`export`). The main script tag has `type="module"` attribute (index.html:271).

### API Response Handling

- Success responses return JSON data
- DELETE returns 204 No Content (handled in api.js:37-39)
- Errors include `detalles` array or `error` string (api.js:53-55)
- Network errors and timeouts throw custom `ApiError`

## File Structure

```
frontend/
├── index.html          # Main HTML page with Bootstrap UI
├── css/
│   └── styles.css     # Custom CSS (variables in :root)
└── js/
    ├── api.js         # API communication layer (Model)
    ├── ui.js          # DOM manipulation layer (View)
    └── app.js         # Main controller (entry point)
```

## Configuration

### API Settings
- URL: `api.js:11` - `API_CONFIG.BASE_URL` (currently: `https://usuarios-mvgv.onrender.com/api/usuarios`)
- Timeout: `api.js:15` - `API_CONFIG.TIMEOUT` (10000ms / 10 seconds)

### CSS Variables
Custom colors defined in `:root` selector in `css/styles.css` (lines 6-16).

### Form Validation Rules
- **Nombre**: Required, 2-100 characters (index.html:150-151)
- **Email**: Required, valid email format (index.html:169)
- **Password**: Required, minimum 6 characters (index.html:188-189)

## Troubleshooting

### "Failed to load module script"
Use an HTTP server - ES6 modules don't work with `file://` protocol.

### "No se pudo conectar con el servidor"
Backend API at `https://usuarios-mvgv.onrender.com` is not accessible. Verify the backend service is running and accessible.

### CORS Errors
Backend needs CORS configured to allow requests from your frontend origin. If testing locally, the backend should allow `http://localhost:3000` or your specific origin.

## Testing the Application

Since this is a vanilla JavaScript application with no test framework configured:
1. Manual testing via browser console
2. Check browser DevTools Console for errors
3. Use Network tab to inspect API requests/responses
4. Test all CRUD operations: Create user, Read (list), Update user, Delete user
