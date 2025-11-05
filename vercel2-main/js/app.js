/**
 * Módulo Principal - App (Controlador en patrón MVC)
 *
 * Este es el módulo principal que coordina la aplicación.
 * Implementa el patrón MVC (Model-View-Controller):
 * - Model: api.js - Comunicación con backend y datos
 * - View: ui.js - Manipulación del DOM y presentación
 * - Controller: app.js (este archivo) - Lógica de negocio y coordinación
 *
 * @module app
 * @author Sistema de Gestión de Usuarios
 * @version 1.0.0
 *
 * @requires ./api.js - Módulo de comunicación con API
 * @requires ./ui.js - Módulo de interfaz de usuario
 */

import { API, ApiError, Logger } from './api.js';
import { UI, DOM } from './ui.js';

/**
 * Utilidad: Debounce
 *
 * Retrasa la ejecución de una función hasta que haya pasado un tiempo
 * determinado sin que se vuelva a llamar. Útil para optimizar eventos
 * que se disparan frecuentemente (input, scroll, resize).
 *
 * @function debounce
 * @param {Function} func - Función a ejecutar después del delay
 * @param {number} wait - Tiempo de espera en milisegundos
 * @returns {Function} Función debounced
 *
 * @example
 * // Validar formulario solo después de 300ms sin teclear
 * const validarConDebounce = debounce(() => {
 *   formulario.checkValidity();
 * }, 300);
 *
 * input.addEventListener('input', validarConDebounce);
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Clase principal de la aplicación (Controlador)
 *
 * Coordina las interacciones entre el Modelo (API) y la Vista (UI).
 * Maneja la lógica de negocio, eventos de usuario y flujo de la aplicación.
 * Implementa el patrón Singleton - solo existe una instancia de App.
 *
 * @class App
 *
 * @property {Object|null} usuarioEnEdicion - Usuario actualmente siendo editado
 * @property {Object|null} usuarioAEliminar - Usuario pendiente de eliminación
 *
 * @example
 * const app = new App();
 * await app.init();
 */
class App {
    /**
     * Constructor de la aplicación
     *
     * Inicializa las propiedades de estado para rastrear usuarios
     * en edición y pendientes de eliminación.
     */
    constructor() {
        /** @type {Object|null} Usuario en proceso de edición */
        this.usuarioEnEdicion = null;
        /** @type {Object|null} Usuario pendiente de confirmación para eliminar */
        this.usuarioAEliminar = null;
    }

    /**
     * Inicializa la aplicación completa
     *
     * Punto de entrada principal. Ejecuta en orden:
     * 1. Verifica conexión con el backend
     * 2. Configura todos los event listeners
     * 3. Carga la lista inicial de usuarios
     * 4. Inicializa funcionalidades UI (toggle password)
     *
     * @async
     * @memberof App
     * @returns {Promise<void>}
     *
     * @example
     * const app = new App();
     * await app.init(); // Aplicación lista para usar
     */
    async init() {
        Logger.log('🚀 Iniciando aplicación...');

        // Verificar conexión con la API
        await this.verificarConexion();

        // Configurar event listeners
        this.configurarEventListeners();

        // Cargar usuarios iniciales
        await this.cargarUsuarios();

        // Inicializar toggle de password
        UI.inicializarTogglePassword();

        Logger.log('✅ Aplicación iniciada correctamente');
    }

    /**
     * Verifica si el backend está disponible
     *
     * Intenta conectarse al backend y muestra una alerta si no está disponible.
     * No bloquea la aplicación, solo informa al usuario.
     *
     * @async
     * @memberof App
     * @returns {Promise<void>}
     */
    async verificarConexion() {
        try {
            const conectado = await API.verificarConexion();
            if (!conectado) {
                UI.mostrarAlerta(
                    'No se pudo conectar con el servidor. Verifique que la API esté disponible en https://usuarios-mvgv.onrender.com',
                    'warning'
                );
            }
        } catch (error) {
            Logger.error('Error al verificar conexión:', error);
            UI.mostrarAlerta(
                'Error de conexión con el servidor',
                'danger'
            );
        }
    }

    /**
     * Configura todos los event listeners de la aplicación
     *
     * Vincula eventos de botones y formularios con sus manejadores.
     * Usa event delegation para botones de la tabla (mejor rendimiento).
     *
     * Event listeners configurados:
     * - btnNuevoUsuario: Abre modal para crear usuario
     * - btnRecargar: Recarga la lista de usuarios
     * - btnGuardarUsuario: Guarda usuario (crear o editar)
     * - btnConfirmarEliminar: Confirma eliminación de usuario
     * - usuariosTableBody: Delegation para botones editar/eliminar
     * - formUsuario: Validación en tiempo real y submit con Enter
     *
     * @memberof App
     */
    configurarEventListeners() {
        // Botón nuevo usuario
        DOM.btnNuevoUsuario.addEventListener('click', () => {
            this.handleNuevoUsuario();
        });

        // Botón recargar
        DOM.btnRecargar.addEventListener('click', () => {
            this.cargarUsuarios();
        });

        // Botón guardar usuario (crear o actualizar)
        DOM.btnGuardarUsuario.addEventListener('click', () => {
            this.handleGuardarUsuario();
        });

        // Botón confirmar eliminación
        DOM.btnConfirmarEliminar.addEventListener('click', () => {
            this.handleConfirmarEliminar();
        });

        // Delegación de eventos para botones de la tabla
        DOM.usuariosTableBody.addEventListener('click', (e) => {
            // Botón editar
            if (e.target.closest('.btn-editar')) {
                const btn = e.target.closest('.btn-editar');
                this.handleEditarUsuario(btn);
            }

            // Botón eliminar
            if (e.target.closest('.btn-eliminar')) {
                const btn = e.target.closest('.btn-eliminar');
                this.handleEliminarUsuario(btn);
            }
        });

        // Validación en tiempo real del formulario CON DEBOUNCE
        // ✅ OPTIMIZACIÓN: Espera 300ms sin teclear antes de validar
        // Mejora UX: No muestra errores mientras el usuario está escribiendo
        const validarFormularioDebounced = debounce(() => {
            if (DOM.formUsuario.classList.contains('was-validated')) {
                DOM.formUsuario.checkValidity();
            }
        }, 300);

        DOM.formUsuario.addEventListener('input', validarFormularioDebounced);

        // Enter en el formulario
        DOM.formUsuario.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleGuardarUsuario();
            }
        });

        // Limpiar validación al cerrar modal
        document.getElementById('modalUsuario').addEventListener('hidden.bs.modal', () => {
            UI.resetearFormulario();
        });
    }

    /**
     * Carga todos los usuarios desde la API
     */
    async cargarUsuarios() {
        try {
            UI.mostrarCargando();

            const usuarios = await API.obtenerUsuarios();
            UI.renderizarUsuarios(usuarios);

            Logger.log(`✅ ${usuarios.length} usuarios cargados`);
        } catch (error) {
            Logger.error('Error al cargar usuarios:', error);
            this.manejarError(error, 'Error al cargar los usuarios');
        } finally {
            UI.ocultarCargando();
        }
    }

    /**
     * Maneja el evento de nuevo usuario
     */
    handleNuevoUsuario() {
        this.usuarioEnEdicion = null;
        UI.mostrarModalNuevoUsuario();
    }

    /**
     * Maneja el evento de editar usuario
     * @param {HTMLElement} boton - Botón que disparó el evento
     */
    async handleEditarUsuario(boton) {
        const id = parseInt(boton.getAttribute('data-id'));
        const nombre = boton.getAttribute('data-nombre');
        const email = boton.getAttribute('data-email');

        this.usuarioEnEdicion = { id, nombre, email };
        UI.mostrarModalEditarUsuario(this.usuarioEnEdicion);
    }

    /**
     * Maneja el evento de guardar usuario (crear o actualizar)
     */
    async handleGuardarUsuario() {
        // Validar formulario
        if (!UI.validarFormulario()) {
            UI.mostrarAlerta('Por favor, complete todos los campos correctamente', 'warning');
            return;
        }

        const datosUsuario = UI.obtenerDatosFormulario();
        const usuarioId = UI.obtenerIdUsuario();

        try {
            // Deshabilitar botón
            const textoBoton = DOM.btnGuardarUsuario.innerHTML;
            UI.deshabilitarBoton(DOM.btnGuardarUsuario, textoBoton);

            let resultado;

            if (usuarioId) {
                // Actualizar usuario existente
                resultado = await API.actualizarUsuario(usuarioId, datosUsuario);
                UI.mostrarAlerta(`Usuario "${resultado.nombre}" actualizado correctamente`, 'success');
            } else {
                // Crear nuevo usuario
                resultado = await API.crearUsuario(datosUsuario);
                UI.mostrarAlerta(`Usuario "${resultado.nombre}" creado correctamente`, 'success');
            }

            // Cerrar modal y recargar tabla
            UI.cerrarModalUsuario();
            await this.cargarUsuarios();

        } catch (error) {
            Logger.error('Error al guardar usuario:', error);
            this.manejarError(error, 'Error al guardar el usuario');
        } finally {
            // Habilitar botón
            UI.habilitarBoton(DOM.btnGuardarUsuario);
        }
    }

    /**
     * Maneja el evento de eliminar usuario
     * @param {HTMLElement} boton - Botón que disparó el evento
     */
    handleEliminarUsuario(boton) {
        const id = parseInt(boton.getAttribute('data-id'));
        const nombre = boton.getAttribute('data-nombre');
        const email = boton.getAttribute('data-email');

        this.usuarioAEliminar = { id, nombre, email };
        UI.mostrarModalConfirmarEliminar(this.usuarioAEliminar);
    }

    /**
     * Maneja la confirmación de eliminación
     */
    async handleConfirmarEliminar() {
        if (!this.usuarioAEliminar) return;

        const id = this.usuarioAEliminar.id;

        try {
            // Deshabilitar botón
            const textoBoton = DOM.btnConfirmarEliminar.innerHTML;
            UI.deshabilitarBoton(DOM.btnConfirmarEliminar, textoBoton);

            await API.eliminarUsuario(id);

            UI.mostrarAlerta(`Usuario "${this.usuarioAEliminar.nombre}" eliminado correctamente`, 'success');

            // Cerrar modal y recargar tabla
            UI.cerrarModalConfirmar();
            await this.cargarUsuarios();

            this.usuarioAEliminar = null;

        } catch (error) {
            Logger.error('Error al eliminar usuario:', error);
            this.manejarError(error, 'Error al eliminar el usuario');
        } finally {
            // Habilitar botón
            UI.habilitarBoton(DOM.btnConfirmarEliminar);
        }
    }

    /**
     * Maneja errores de forma centralizada
     *
     * Procesa errores de API y errores genéricos, mostrando mensajes
     * apropiados al usuario según el tipo y código de estado HTTP.
     *
     * Códigos HTTP manejados:
     * - 400: Error de validación
     * - 404: Usuario no encontrado
     * - 409: Conflicto (email duplicado)
     * - 500: Error interno del servidor
     *
     * @memberof App
     * @param {Error|ApiError} error - Error capturado en try-catch
     * @param {string} mensajeGenerico - Mensaje fallback si no se puede determinar el error
     *
     * @example
     * try {
     *   await API.crearUsuario(datos);
     * } catch (error) {
     *   this.manejarError(error, 'Error al crear usuario');
     * }
     */
    manejarError(error, mensajeGenerico) {
        let mensaje = mensajeGenerico;

        if (error instanceof ApiError) {
            // Error de la API con detalles
            mensaje = error.message;

            // Errores específicos por código de estado
            switch (error.status) {
                case 400:
                    mensaje = `Error de validación: ${error.message}`;
                    break;
                case 404:
                    mensaje = 'Usuario no encontrado';
                    break;
                case 409:
                    mensaje = error.message; // "El email ya está registrado"
                    break;
                case 500:
                    mensaje = 'Error interno del servidor. Intente nuevamente.';
                    break;
            }
        } else if (error.message) {
            mensaje = error.message;
        }

        UI.mostrarAlerta(mensaje, 'danger');
    }
}

/**
 * Event Listener: Inicialización de la aplicación
 *
 * Se ejecuta cuando el DOM está completamente cargado.
 * Crea la instancia única de App e inicializa la aplicación.
 *
 * @event DOMContentLoaded
 * @listens document#DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});

/**
 * Event Listener: Manejo de promesas rechazadas no capturadas
 *
 * Captura errores asíncronos que no fueron manejados con try-catch.
 * Previene que la aplicación se rompa completamente por errores no anticipados.
 * Muestra un mensaje genérico al usuario y loguea el error en consola.
 *
 * @event unhandledrejection
 * @listens window#unhandledrejection
 *
 * @example
 * // Este error será capturado por el listener
 * async function foo() {
 *   throw new Error('Error no capturado');
 * }
 * foo(); // Sin await ni try-catch
 */
window.addEventListener('unhandledrejection', (event) => {
    Logger.error('Error no manejado:', event.reason);
    UI.mostrarAlerta('Ha ocurrido un error inesperado', 'danger');
});

/**
 * Exportar la clase App
 *
 * Permite debugging en consola del navegador y testing.
 *
 * @exports App
 *
 * @example
 * // En la consola del navegador
 * import { App } from './js/app.js';
 * const app = new App();
 */
export { App };