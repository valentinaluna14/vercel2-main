/**
 * Módulo API - Manejo de comunicación con el backend
 *
 * Este módulo encapsula todas las operaciones CRUD con la API REST
 * Implementa el patrón de diseño Singleton para la configuración
 * y utiliza async/await para manejo asíncrono de promesas
 *
 * @module api
 * @author Sistema de Gestión de Usuarios
 * @version 1.0.0
 *
 * @example
 * // Importar el módulo API
 * import { API, ApiError } from './api.js';
 *
 * // Obtener todos los usuarios
 * const usuarios = await API.obtenerUsuarios();
 *
 * // Crear un nuevo usuario
 * const nuevoUsuario = await API.crearUsuario({
 *   nombre: 'Juan Pérez',
 *   email: 'juan@example.com',
 *   password: 'password123'
 * });
 */

/**
 * Configuración global de la API
 * @constant {Object} API_CONFIG
 * @property {string} BASE_URL - URL base de la API REST en Render
 * @property {Object} HEADERS - Cabeceras HTTP por defecto para todas las peticiones
 * @property {number} TIMEOUT - Tiempo máximo de espera en milisegundos (10 segundos)
 * @property {boolean} DEBUG_MODE - Modo debug (true en desarrollo, false en producción)
 */
const API_CONFIG = {
    BASE_URL: 'https://usuarios-mvgv.onrender.com/api/usuarios',
    HEADERS: {
        'Content-Type': 'application/json'
    },
    TIMEOUT: 10000, // 10 segundos
    // ✅ CONFIGURACIÓN: Cambiar a false en producción
    DEBUG_MODE: true  // true = desarrollo, false = producción
};

/**
 * Sistema de logging configurable
 *
 * Proporciona métodos de logging que se activan/desactivan según DEBUG_MODE.
 * En producción (DEBUG_MODE = false), los logs no se muestran en consola.
 *
 * IMPORTANTE: Cambiar API_CONFIG.DEBUG_MODE a false antes de desplegar.
 *
 * @namespace Logger
 * @type {Object}
 *
 * @example
 * // En desarrollo: muestra en consola
 * Logger.log('Usuario cargado', usuario);  // ✅ Se muestra
 *
 * @example
 * // En producción (DEBUG_MODE = false): no muestra nada
 * Logger.log('Usuario cargado', usuario);  // ❌ No se muestra
 */
const Logger = {
    /**
     * Log informativo (solo en modo debug)
     * @param {...any} args - Argumentos a loguear
     */
    log(...args) {
        if (API_CONFIG.DEBUG_MODE) {
            console.log('[INFO]', ...args);
        }
    },

    /**
     * Log de error (siempre se muestra, en producción se enviaría a servicio externo)
     * @param {...any} args - Argumentos a loguear
     */
    error(...args) {
        if (API_CONFIG.DEBUG_MODE) {
            console.error('[ERROR]', ...args);
        } else {
            // TODO: En producción, enviar a servicio de monitoreo (Sentry, LogRocket, etc.)
            // Ejemplo: Sentry.captureException(args[0]);
        }
    },

    /**
     * Log de advertencia (solo en modo debug)
     * @param {...any} args - Argumentos a loguear
     */
    warn(...args) {
        if (API_CONFIG.DEBUG_MODE) {
            console.warn('[WARN]', ...args);
        }
    }
};

/**
 * Clase para manejar errores de API de forma estructurada
 *
 * Extiende la clase Error nativa de JavaScript para proporcionar
 * información adicional sobre errores HTTP de la API
 *
 * @class ApiError
 * @extends Error
 *
 * @property {string} name - Nombre del error ('ApiError')
 * @property {string} message - Mensaje descriptivo del error
 * @property {number} status - Código de estado HTTP (400, 404, 500, etc.)
 * @property {Object|null} details - Detalles adicionales del error desde el backend
 *
 * @example
 * // El backend retorna un error 409 (Conflict)
 * throw new ApiError('El email ya está registrado', 409, {
 *   detalles: ['Email duplicado'],
 *   timestamp: '2024-01-15T10:30:00Z'
 * });
 */
class ApiError extends Error {
    /**
     * Crea una instancia de ApiError
     * @param {string} message - Mensaje descriptivo del error
     * @param {number} status - Código de estado HTTP
     * @param {Object|null} [details=null] - Información adicional del error
     */
    constructor(message, status, details = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }
}

/**
 * Maneja las respuestas HTTP y errores de la API
 *
 * Procesa la respuesta HTTP, parseando el contenido según el content-type
 * y lanzando errores estructurados cuando la respuesta no es exitosa
 *
 * @async
 * @function handleResponse
 * @param {Response} response - Objeto Response de la API Fetch
 * @returns {Promise<Object|{success: boolean}>} - Datos parseados o confirmación de éxito
 * @throws {ApiError} - Error estructurado con status y detalles del backend
 *
 * @example
 * const response = await fetch('/api/usuarios');
 * const data = await handleResponse(response);
 * // data = [{id: 1, nombre: 'Juan', email: 'juan@example.com'}, ...]
 */
async function handleResponse(response) {
    // Si la respuesta es 204 NO CONTENT (DELETE exitoso)
    if (response.status === 204) {
        return { success: true };
    }

    const contentType = response.headers.get('content-type');
    let data;

    // Parsear respuesta según el content-type
    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    // Si la respuesta no es exitosa (status >= 400)
    if (!response.ok) {
        const errorMessage = data.detalles
            ? data.detalles.join(', ')
            : data.error || 'Error desconocido';

        throw new ApiError(
            errorMessage,
            response.status,
            data
        );
    }

    return data;
}

/**
 * Realiza una petición HTTP con timeout automático
 *
 * Utiliza AbortController para cancelar peticiones que exceden el tiempo límite.
 * Previene que peticiones lentas bloqueen la interfaz de usuario.
 *
 * @async
 * @function fetchWithTimeout
 * @param {string} url - URL completa de la petición HTTP
 * @param {Object} [options={}] - Opciones de configuración para fetch (method, headers, body, etc.)
 * @returns {Promise<Response>} - Promesa que resuelve con la respuesta HTTP
 * @throws {ApiError} - Error 408 (Request Timeout) si excede API_CONFIG.TIMEOUT
 * @throws {Error} - Otros errores de red o fetch
 *
 * @example
 * const response = await fetchWithTimeout('https://api.example.com/users', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ nombre: 'Ana' })
 * });
 */
async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new ApiError('La petición excedió el tiempo de espera', 408);
        }
        throw error;
    }
}

/**
 * API - Objeto Singleton con todos los métodos para interactuar con el backend
 *
 * Proporciona una interfaz unificada para todas las operaciones CRUD de usuarios.
 * Todos los métodos son asíncronos y retornan Promesas.
 *
 * @namespace API
 * @type {Object}
 */
export const API = {
    /**
     * Obtiene la lista completa de usuarios del backend
     *
     * Realiza una petición GET a la API y retorna todos los usuarios registrados.
     * Útil para poblar la tabla principal de usuarios.
     *
     * @async
     * @memberof API
     * @returns {Promise<Array<Object>>} Array de objetos usuario
     * @returns {number} return[].id - ID único del usuario
     * @returns {string} return[].nombre - Nombre completo del usuario
     * @returns {string} return[].email - Correo electrónico del usuario
     * @throws {ApiError} Error de red, timeout o respuesta no exitosa del servidor
     *
     * @example
     * try {
     *   const usuarios = await API.obtenerUsuarios();
     *   console.log(`Se obtuvieron ${usuarios.length} usuarios`);
     *   // usuarios = [{id: 1, nombre: 'Juan', email: 'juan@example.com'}, ...]
     * } catch (error) {
     *   console.error('Error:', error.message);
     * }
     */
    async obtenerUsuarios() {
        try {
            const response = await fetchWithTimeout(API_CONFIG.BASE_URL, {
                method: 'GET',
                headers: API_CONFIG.HEADERS
            });
            return await handleResponse(response);
        } catch (error) {
            Logger.error('Error al obtener usuarios:', error);
            throw error;
        }
    },

    /**
     * Obtiene un usuario específico por su ID
     *
     * Realiza una petición GET a la API para obtener los detalles de un usuario.
     * Útil cuando se necesita información actualizada de un usuario específico.
     *
     * @async
     * @memberof API
     * @param {number} id - ID único del usuario a buscar
     * @returns {Promise<Object>} Objeto con los datos del usuario
     * @returns {number} return.id - ID del usuario
     * @returns {string} return.nombre - Nombre del usuario
     * @returns {string} return.email - Email del usuario
     * @throws {TypeError} Si el ID no es un número entero positivo
     * @throws {ApiError} Error 404 si el usuario no existe, u otros errores de API
     *
     * @example
     * const usuario = await API.obtenerUsuarioPorId(5);
     * console.log(usuario.nombre); // "María García"
     */
    async obtenerUsuarioPorId(id) {
        // ✅ VALIDACIÓN DE TIPOS: Verificar que ID sea un número válido
        if (!Number.isInteger(id) || id <= 0) {
            throw new TypeError(`El ID debe ser un número entero positivo. Recibido: ${typeof id} (${id})`);
        }

        try {
            const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/${id}`, {
                method: 'GET',
                headers: API_CONFIG.HEADERS
            });
            return await handleResponse(response);
        } catch (error) {
            Logger.error(`Error al obtener usuario ${id}:`, error);
            throw error;
        }
    },

    /**
     * Crea un nuevo usuario en el sistema
     *
     * Realiza validación client-side antes de enviar los datos al backend.
     * Envía una petición POST con los datos del nuevo usuario.
     *
     * @async
     * @memberof API
     * @param {Object} usuario - Datos del nuevo usuario
     * @param {string} usuario.nombre - Nombre completo (mín. 2 caracteres, máx. 100)
     * @param {string} usuario.email - Email válido y único en el sistema
     * @param {string} usuario.password - Contraseña (mín. 6 caracteres)
     * @returns {Promise<Object>} Usuario creado con ID asignado por el backend
     * @returns {number} return.id - ID del nuevo usuario
     * @returns {string} return.nombre - Nombre del usuario
     * @returns {string} return.email - Email del usuario
     * @throws {Error} Error de validación client-side
     * @throws {ApiError} Error 409 si el email ya existe, u otros errores de API
     *
     * @example
     * const nuevoUsuario = await API.crearUsuario({
     *   nombre: 'Ana López',
     *   email: 'ana.lopez@example.com',
     *   password: 'securePass123'
     * });
     * console.log(`Usuario creado con ID: ${nuevoUsuario.id}`);
     */
    async crearUsuario(usuario) {
        try {
            // Validar datos antes de enviar (modo creación: password obligatorio)
            this.validarDatosUsuario(usuario, false);

            const response = await fetchWithTimeout(API_CONFIG.BASE_URL, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(usuario)
            });
            return await handleResponse(response);
        } catch (error) {
            Logger.error('Error al crear usuario:', error);
            throw error;
        }
    },

    /**
     * Actualiza los datos de un usuario existente
     *
     * Realiza validación client-side antes de enviar los datos actualizados.
     * Envía una petición PUT con todos los datos del usuario (incluyendo password).
     *
     * @async
     * @memberof API
     * @param {number} id - ID del usuario a actualizar
     * @param {Object} usuario - Datos actualizados del usuario
     * @param {string} usuario.nombre - Nombre completo actualizado
     * @param {string} usuario.email - Email actualizado (debe ser único)
     * @param {string|null} usuario.password - Nueva contraseña o null para mantener actual
     * @returns {Promise<Object>} Usuario con los datos actualizados
     * @throws {TypeError} Si el ID no es un número entero positivo
     * @throws {Error} Error de validación client-side
     * @throws {ApiError} Error 404 si el usuario no existe, 409 si el email está duplicado
     *
     * @example
     * const usuarioActualizado = await API.actualizarUsuario(3, {
     *   nombre: 'Juan Pérez Actualizado',
     *   email: 'juan.nuevo@example.com',
     *   password: null  // Mantener la actual
     * });
     */
    async actualizarUsuario(id, usuario) {
        // ✅ VALIDACIÓN DE TIPOS: Verificar que ID sea un número válido
        if (!Number.isInteger(id) || id <= 0) {
            throw new TypeError(`El ID debe ser un número entero positivo. Recibido: ${typeof id} (${id})`);
        }

        try {
            // Validar datos antes de enviar (modo edición: password opcional)
            this.validarDatosUsuario(usuario, true);

            const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/${id}`, {
                method: 'PUT',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(usuario)
            });
            return await handleResponse(response);
        } catch (error) {
            Logger.error(`Error al actualizar usuario ${id}:`, error);
            throw error;
        }
    },

    /**
     * Elimina un usuario del sistema de forma permanente
     *
     * Envía una petición DELETE al backend. Esta acción no se puede deshacer.
     * El backend debe retornar status 204 No Content si tiene éxito.
     *
     * @async
     * @memberof API
     * @param {number} id - ID del usuario a eliminar
     * @returns {Promise<{success: boolean}>} Objeto confirmando la eliminación exitosa
     * @throws {TypeError} Si el ID no es un número entero positivo
     * @throws {ApiError} Error 404 si el usuario no existe, u otros errores de API
     *
     * @example
     * try {
     *   const result = await API.eliminarUsuario(7);
     *   if (result.success) {
     *     console.log('Usuario eliminado correctamente');
     *   }
     * } catch (error) {
     *   console.error('No se pudo eliminar:', error.message);
     * }
     */
    async eliminarUsuario(id) {
        // ✅ VALIDACIÓN DE TIPOS: Verificar que ID sea un número válido
        if (!Number.isInteger(id) || id <= 0) {
            throw new TypeError(`El ID debe ser un número entero positivo. Recibido: ${typeof id} (${id})`);
        }

        try {
            const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/${id}`, {
                method: 'DELETE',
                headers: API_CONFIG.HEADERS
            });
            return await handleResponse(response);
        } catch (error) {
            Logger.error(`Error al eliminar usuario ${id}:`, error);
            throw error;
        }
    },

    /**
     * Valida los datos del usuario antes de enviarlos al backend
     *
     * Realiza validación client-side para detectar errores antes de hacer
     * la petición HTTP. Complementa la validación HTML5 del formulario.
     *
     * IMPORTANTE: Password puede ser null en modo edición (no cambiar password).
     * Si password tiene valor, debe tener al menos 6 caracteres.
     *
     * @memberof API
     * @param {Object} usuario - Objeto con los datos a validar
     * @param {string} usuario.nombre - Nombre del usuario
     * @param {string} usuario.email - Email del usuario
     * @param {string|null} usuario.password - Contraseña (null = no cambiar en edición)
     * @param {boolean} [esEdicion=false] - True si es edición, false si es creación
     * @throws {Error} Error descriptivo si los datos no cumplen los requisitos
     *
     * @example
     * // Crear nuevo usuario - password obligatorio
     * API.validarDatosUsuario({
     *   nombre: 'Juan',
     *   email: 'juan@example.com',
     *   password: 'mipass123'
     * }, false);
     *
     * @example
     * // Editar usuario sin cambiar password
     * API.validarDatosUsuario({
     *   nombre: 'Juan Pérez',
     *   email: 'juan@example.com',
     *   password: null  // ✅ Válido en edición
     * }, true);
     */
    validarDatosUsuario(usuario, esEdicion = false) {
        // Validar nombre
        if (!usuario.nombre || usuario.nombre.trim().length < 2) {
            throw new Error('El nombre debe tener al menos 2 caracteres');
        }

        // Validar email
        if (!usuario.email || !this.esEmailValido(usuario.email)) {
            throw new Error('El email no es válido');
        }

        // Validar password
        if (esEdicion) {
            // En edición: password puede ser null (no cambiar) o string válido
            if (usuario.password !== null && usuario.password.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres (o déjela vacía para no cambiarla)');
            }
        } else {
            // En creación: password es obligatorio
            if (!usuario.password || usuario.password.length < 6) {
                throw new Error('La contraseña es obligatoria y debe tener al menos 6 caracteres');
            }
        }
    },

    /**
     * Valida el formato de un email usando expresión regular robusta
     *
     * Utiliza un patrón regex basado en RFC 5322 (simplificado pero robusto).
     * Valida estructura, caracteres permitidos y formato de dominio.
     *
     * Validaciones realizadas:
     * - Parte local (antes del @): letras, números y caracteres especiales permitidos
     * - Dominio: debe ser válido con subdominios opcionales
     * - TLD (extensión): debe tener al menos 2 caracteres
     * - Longitud: máximo 254 caracteres (estándar RFC 5321)
     *
     * @memberof API
     * @param {string} email - Dirección de email a validar
     * @returns {boolean} true si el email tiene un formato válido, false en caso contrario
     *
     * @example
     * API.esEmailValido('juan@example.com'); // true
     * API.esEmailValido('juan.perez@subdomain.example.com'); // true
     * API.esEmailValido('user+tag@example.co.uk'); // true
     * API.esEmailValido('invalido.com'); // false
     * API.esEmailValido('sin@dominio'); // false
     * API.esEmailValido('test@@example.com'); // false
     * API.esEmailValido('user@.com'); // false
     *
     * @see {@link https://tools.ietf.org/html/rfc5322 RFC 5322}
     */
    esEmailValido(email) {
        // Validación de longitud según RFC 5321
        if (!email || email.length > 254) {
            return false;
        }

        // Regex basado en RFC 5322 (simplificado)
        // Permite: letras, números, puntos, guiones, guiones bajos, más, etc.
        const regex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

        if (!regex.test(email)) {
            return false;
        }

        // Validaciones adicionales
        const parts = email.split('@');
        if (parts.length !== 2) return false;

        const [localPart, domain] = parts;

        // Parte local: máximo 64 caracteres (RFC 5321)
        if (localPart.length > 64) return false;

        // Dominio: debe tener al menos un punto y un TLD válido
        const domainParts = domain.split('.');
        if (domainParts.length < 2) return false;

        // TLD debe tener al menos 2 caracteres
        const tld = domainParts[domainParts.length - 1];
        if (tld.length < 2) return false;

        // No permitir puntos consecutivos
        if (email.includes('..')) return false;

        // No permitir punto al inicio o final de la parte local
        if (localPart.startsWith('.') || localPart.endsWith('.')) return false;

        return true;
    },

    /**
     * Verifica si la API del backend está disponible y responde
     *
     * Realiza una petición GET simple para verificar conectividad.
     * Útil para mostrar alertas al usuario si el backend no está disponible.
     *
     * @async
     * @memberof API
     * @returns {Promise<boolean>} true si la API responde correctamente, false en caso contrario
     *
     * @example
     * const disponible = await API.verificarConexion();
     * if (!disponible) {
     *   alert('El servidor no está disponible en este momento');
     * }
     */
    async verificarConexion() {
        try {
            const response = await fetchWithTimeout(API_CONFIG.BASE_URL, {
                method: 'GET',
                headers: API_CONFIG.HEADERS
            });
            return response.ok;
        } catch (error) {
            Logger.error('Error de conexión con la API:', error);
            return false;
        }
    }
};

/**
 * Exportar el Logger para uso en otros módulos
 * @exports Logger
 */
export { Logger };

/**
 * Exportar la clase ApiError para uso en otros módulos
 *
 * Permite que app.js y otros módulos puedan capturar y manejar
 * errores específicos de la API usando instanceof ApiError
 *
 * @exports ApiError
 */
export { ApiError };