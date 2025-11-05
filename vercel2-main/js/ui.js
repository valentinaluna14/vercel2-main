/**
 * Módulo UI - Manejo de la interfaz de usuario (Vista en patrón MVC)
 *
 * Este módulo se encarga de todas las operaciones de manipulación del DOM.
 * Implementa el patrón de diseño Module para encapsular funcionalidades.
 * Separa la lógica de presentación de la lógica de negocio.
 *
 * @module ui
 * @author Sistema de Gestión de Usuarios
 * @version 1.0.0
 *
 * @requires Bootstrap 5.3.2 - Para modales y componentes UI
 *
 * @example
 * // Importar el módulo UI
 * import { UI, DOM } from './ui.js';
 *
 * // Renderizar lista de usuarios
 * UI.renderizarUsuarios(usuarios);
 *
 * // Mostrar alerta
 * UI.mostrarAlerta('Usuario creado exitosamente', 'success');
 */

/**
 * Objeto DOM - Caché de referencias a elementos del DOM
 *
 * Almacena referencias a elementos HTML para evitar búsquedas repetitivas
 * con document.getElementById(), mejorando significativamente el rendimiento.
 * Todos los elementos se obtienen una sola vez al cargar el módulo.
 *
 * @namespace DOM
 * @type {Object}
 * @property {HTMLTableElement} tablaUsuarios - Elemento <table> principal
 * @property {HTMLTableSectionElement} usuariosTableBody - <tbody> de la tabla
 * @property {HTMLButtonElement} btnNuevoUsuario - Botón "Alta de Usuario"
 * @property {HTMLButtonElement} btnRecargar - Botón "Recargar"
 * @property {HTMLButtonElement} btnGuardarUsuario - Botón "Guardar" en modal
 * @property {HTMLButtonElement} btnConfirmarEliminar - Botón "Eliminar Usuario" en modal confirmación
 * @property {HTMLFormElement} formUsuario - Formulario de crear/editar usuario
 * @property {HTMLInputElement} usuarioId - Input oculto para ID del usuario en edición
 * @property {HTMLInputElement} nombre - Input de nombre
 * @property {HTMLInputElement} email - Input de email
 * @property {HTMLInputElement} password - Input de contraseña
 * @property {bootstrap.Modal} modalUsuario - Instancia de Modal de Bootstrap para crear/editar
 * @property {bootstrap.Modal} modalConfirmarEliminar - Instancia de Modal de Bootstrap para confirmar eliminación
 * @property {HTMLElement} modalTitulo - Título del modal (cambia entre "Nuevo" y "Editar")
 * @property {HTMLElement} passwordHint - Texto de ayuda del campo password
 * @property {HTMLDivElement} alertContainer - Contenedor de alertas
 * @property {HTMLDivElement} loadingSpinner - Spinner de carga
 * @property {HTMLDivElement} emptyState - Estado vacío (sin usuarios)
 * @property {HTMLSpanElement} totalUsuarios - Badge con contador de usuarios
 * @property {HTMLSpanElement} nombreUsuarioEliminar - Nombre en modal de confirmación
 * @property {HTMLSpanElement} emailUsuarioEliminar - Email en modal de confirmación
 * @property {HTMLButtonElement} togglePassword - Botón para mostrar/ocultar contraseña
 * @property {HTMLElement} togglePasswordIcon - Ícono del botón toggle password
 */
const DOM = {
    // Tabla y cuerpo de tabla
    tablaUsuarios: document.getElementById('tablaUsuarios'),
    usuariosTableBody: document.getElementById('usuariosTableBody'),

    // Botones principales
    btnNuevoUsuario: document.getElementById('btnNuevoUsuario'),
    btnRecargar: document.getElementById('btnRecargar'),
    btnGuardarUsuario: document.getElementById('btnGuardarUsuario'),
    btnConfirmarEliminar: document.getElementById('btnConfirmarEliminar'),

    // Formulario
    formUsuario: document.getElementById('formUsuario'),
    usuarioId: document.getElementById('usuarioId'),
    nombre: document.getElementById('nombre'),
    email: document.getElementById('email'),
    password: document.getElementById('password'),

    // Modales
    modalUsuario: new bootstrap.Modal(document.getElementById('modalUsuario')),
    modalConfirmarEliminar: new bootstrap.Modal(document.getElementById('modalConfirmarEliminar')),

    // Elementos de modal
    modalTitulo: document.getElementById('modalTitulo'),
    passwordHint: document.getElementById('passwordHint'),

    // Alertas y estados
    alertContainer: document.getElementById('alertContainer'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    emptyState: document.getElementById('emptyState'),
    totalUsuarios: document.getElementById('totalUsuarios'),

    // Elementos de modal de eliminar
    nombreUsuarioEliminar: document.getElementById('nombreUsuarioEliminar'),
    emailUsuarioEliminar: document.getElementById('emailUsuarioEliminar'),

    // Toggle password
    togglePassword: document.getElementById('togglePassword'),
    togglePasswordIcon: document.getElementById('togglePasswordIcon')
};

/**
 * UI - Objeto Singleton con todos los métodos para manipular la interfaz de usuario
 *
 * Proporciona métodos para renderizar, actualizar y manipular elementos del DOM.
 * Implementa el patrón Module para encapsular la lógica de la vista.
 *
 * @namespace UI
 * @type {Object}
 */
export const UI = {
    /**
     * Renderiza la tabla de usuarios en el DOM
     *
     * Limpia el contenido actual de la tabla y renderiza todos los usuarios.
     * Muestra el estado vacío si no hay usuarios. Actualiza el contador.
     *
     * @memberof UI
     * @param {Array<Object>} usuarios - Array de objetos usuario desde la API
     * @param {number} usuarios[].id - ID del usuario
     * @param {string} usuarios[].nombre - Nombre del usuario
     * @param {string} usuarios[].email - Email del usuario
     *
     * @example
     * const usuarios = [
     *   {id: 1, nombre: 'Juan Pérez', email: 'juan@example.com'},
     *   {id: 2, nombre: 'Ana López', email: 'ana@example.com'}
     * ];
     * UI.renderizarUsuarios(usuarios);
     */
    renderizarUsuarios(usuarios) {
        // Limpiar tabla actual
        DOM.usuariosTableBody.innerHTML = '';

        // Si no hay usuarios, mostrar estado vacío
        if (!usuarios || usuarios.length === 0) {
            this.mostrarEstadoVacio();
            this.actualizarContador(0);
            return;
        }

        // Ocultar estado vacío
        this.ocultarEstadoVacio();

        // Renderizar cada usuario
        usuarios.forEach(usuario => {
            const fila = this.crearFilaUsuario(usuario);
            DOM.usuariosTableBody.appendChild(fila);
        });

        // Actualizar contador
        this.actualizarContador(usuarios.length);
    },

    /**
     * Crea un elemento <tr> para un usuario con botones de acción
     *
     * Genera dinámicamente una fila de tabla con los datos del usuario.
     * Incluye botones para editar y eliminar con data attributes.
     * Todo el contenido se escapa para prevenir XSS.
     *
     * @memberof UI
     * @param {Object} usuario - Objeto usuario con los datos
     * @param {number} usuario.id - ID del usuario
     * @param {string} usuario.nombre - Nombre del usuario
     * @param {string} usuario.email - Email del usuario
     * @returns {HTMLTableRowElement} Fila <tr> lista para insertar en la tabla
     *
     * @example
     * const fila = UI.crearFilaUsuario({id: 1, nombre: 'Juan', email: 'juan@example.com'});
     * DOM.usuariosTableBody.appendChild(fila);
     */
    crearFilaUsuario(usuario) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-usuario-id', usuario.id);
        tr.innerHTML = `
            <td class="text-center fw-bold">${this.escaparHTML(usuario.id)}</td>
            <td>
                <i class="bi bi-person-circle text-primary me-2"></i>
                ${this.escaparHTML(usuario.nombre)}
            </td>
            <td>
                <i class="bi bi-envelope text-secondary me-2"></i>
                ${this.escaparHTML(usuario.email)}
            </td>
            <td class="text-center">
                <button
                    class="btn btn-sm btn-warning btn-action btn-editar"
                    data-id="${usuario.id}"
                    data-nombre="${this.escaparHTML(usuario.nombre)}"
                    data-email="${this.escaparHTML(usuario.email)}"
                    title="Editar usuario">
                    <i class="bi bi-pencil-square"></i>
                    Editar
                </button>
                <button
                    class="btn btn-sm btn-danger btn-action btn-eliminar"
                    data-id="${usuario.id}"
                    data-nombre="${this.escaparHTML(usuario.nombre)}"
                    data-email="${this.escaparHTML(usuario.email)}"
                    title="Eliminar usuario">
                    <i class="bi bi-trash"></i>
                    Eliminar
                </button>
            </td>
        `;
        return tr;
    },

    /**
     * Abre el modal para crear un nuevo usuario
     *
     * Resetea el formulario, configura el título y muestra el modal de Bootstrap.
     *
     * @memberof UI
     * @example
     * UI.mostrarModalNuevoUsuario();
     */
    mostrarModalNuevoUsuario() {
        this.resetearFormulario();
        DOM.modalTitulo.innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>Nuevo Usuario';
        DOM.passwordHint.textContent = 'Mínimo 6 caracteres';
        DOM.password.required = true;
        DOM.modalUsuario.show();
    },

    /**
     * Abre el modal para editar un usuario existente
     *
     * Precarga los datos del usuario en el formulario y muestra el modal.
     * El campo password se deja vacío y se marca como OPCIONAL en modo edición.
     *
     * @memberof UI
     * @param {Object} usuario - Datos del usuario a editar
     * @param {number} usuario.id - ID del usuario
     * @param {string} usuario.nombre - Nombre actual
     * @param {string} usuario.email - Email actual
     */
    mostrarModalEditarUsuario(usuario) {
        this.resetearFormulario();
        DOM.modalTitulo.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Usuario';
        DOM.usuarioId.value = usuario.id;
        DOM.nombre.value = usuario.nombre;
        DOM.email.value = usuario.email;
        DOM.password.value = '';
        DOM.passwordHint.textContent = 'Dejar vacío para mantener la contraseña actual';
        // ✅ CORRECCIÓN: Password es OPCIONAL en modo edición
        DOM.password.required = false;
        // Actualizar minlength solo si se ingresa algo
        DOM.password.removeAttribute('minlength');
        DOM.modalUsuario.show();
    },

    /**
     * Muestra el modal de confirmación de eliminación
     * @param {Object} usuario - Datos del usuario a eliminar
     */
    mostrarModalConfirmarEliminar(usuario) {
        DOM.nombreUsuarioEliminar.textContent = usuario.nombre;
        DOM.emailUsuarioEliminar.textContent = usuario.email;
        DOM.btnConfirmarEliminar.setAttribute('data-id', usuario.id);
        DOM.modalConfirmarEliminar.show();
    },

    /**
     * Obtiene los datos del formulario
     *
     * IMPORTANTE: En modo edición, si el password está vacío, retorna null
     * para indicar que NO se debe cambiar el password actual.
     * El backend debe manejar password=null manteniendo el password existente.
     *
     * @memberof UI
     * @returns {Object} Datos del usuario {nombre, email, password}
     * @returns {string} return.nombre - Nombre del usuario (trimmed)
     * @returns {string} return.email - Email del usuario (trimmed)
     * @returns {string|null} return.password - Password nuevo o null si no se cambia
     *
     * @example
     * // Al crear nuevo usuario
     * const datos = UI.obtenerDatosFormulario();
     * // {nombre: "Juan", email: "juan@example.com", password: "mipassword123"}
     *
     * @example
     * // Al editar usuario SIN cambiar password (campo vacío)
     * const datos = UI.obtenerDatosFormulario();
     * // {nombre: "Juan", email: "juan@example.com", password: null}
     */
    obtenerDatosFormulario() {
        const passwordValue = DOM.password.value.trim();

        return {
            nombre: DOM.nombre.value.trim(),
            email: DOM.email.value.trim(),
            // Si está vacío, retornar null (no cambiar password en edición)
            password: passwordValue || null
        };
    },

    /**
     * Obtiene el ID del usuario en edición
     * @returns {number|null} - ID del usuario o null si es nuevo
     */
    obtenerIdUsuario() {
        const id = DOM.usuarioId.value;
        return id ? parseInt(id) : null;
    },

    /**
     * Valida el formulario usando HTML5 Validation API
     * @returns {boolean} - True si el formulario es válido
     */
    validarFormulario() {
        if (!DOM.formUsuario.checkValidity()) {
            DOM.formUsuario.classList.add('was-validated');
            return false;
        }
        return true;
    },

    /**
     * Resetea el formulario y quita las validaciones
     */
    resetearFormulario() {
        DOM.formUsuario.reset();
        DOM.formUsuario.classList.remove('was-validated');
        DOM.usuarioId.value = '';
    },

    /**
     * Cierra el modal de usuario
     */
    cerrarModalUsuario() {
        DOM.modalUsuario.hide();
        this.resetearFormulario();
    },

    /**
     * Cierra el modal de confirmación
     */
    cerrarModalConfirmar() {
        DOM.modalConfirmarEliminar.hide();
    },

    /**
     * Muestra una alerta en la interfaz con mensaje escapado
     *
     * SEGURIDAD: El mensaje se escapa para prevenir XSS, incluso si viene del código.
     * Esto es una buena práctica defensiva que evita vulnerabilidades futuras.
     *
     * @memberof UI
     * @param {string} mensaje - Mensaje a mostrar (será escapado automáticamente)
     * @param {string} tipo - Tipo de alerta (success, danger, warning, info)
     *
     * @example
     * UI.mostrarAlerta('Usuario creado correctamente', 'success');
     * UI.mostrarAlerta('Error al conectar con el servidor', 'danger');
     */
    mostrarAlerta(mensaje, tipo = 'info') {
        const iconos = {
            success: 'check-circle-fill',
            danger: 'exclamation-triangle-fill',
            warning: 'exclamation-circle-fill',
            info: 'info-circle-fill'
        };

        const alerta = document.createElement('div');
        alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
        alerta.setAttribute('role', 'alert');
        // ✅ SEGURIDAD: Escapar mensaje para prevenir XSS
        alerta.innerHTML = `
            <i class="bi bi-${iconos[tipo]} me-2"></i>
            <strong>${this.escaparHTML(mensaje)}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        DOM.alertContainer.innerHTML = '';
        DOM.alertContainer.appendChild(alerta);

        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            alerta.classList.remove('show');
            setTimeout(() => alerta.remove(), 150);
        }, 5000);

        // Scroll hacia la alerta
        alerta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    /**
     * Muestra el spinner de carga
     */
    mostrarCargando() {
        DOM.loadingSpinner.classList.remove('d-none');
        DOM.tablaUsuarios.style.opacity = '0.5';
    },

    /**
     * Oculta el spinner de carga
     */
    ocultarCargando() {
        DOM.loadingSpinner.classList.add('d-none');
        DOM.tablaUsuarios.style.opacity = '1';
    },

    /**
     * Muestra el estado vacío (sin usuarios)
     */
    mostrarEstadoVacio() {
        DOM.emptyState.classList.remove('d-none');
        DOM.tablaUsuarios.classList.add('d-none');
    },

    /**
     * Oculta el estado vacío
     */
    ocultarEstadoVacio() {
        DOM.emptyState.classList.add('d-none');
        DOM.tablaUsuarios.classList.remove('d-none');
    },

    /**
     * Actualiza el contador de usuarios
     * @param {number} total - Total de usuarios
     */
    actualizarContador(total) {
        DOM.totalUsuarios.textContent = `Total: ${total} usuario${total !== 1 ? 's' : ''}`;
    },

    /**
     * Deshabilita un botón y muestra estado de carga
     * @param {HTMLElement} boton - Botón a deshabilitar
     * @param {string} textoOriginal - Texto original del botón
     */
    deshabilitarBoton(boton, textoOriginal) {
        boton.disabled = true;
        boton.setAttribute('data-texto-original', textoOriginal);
        boton.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
            Procesando...
        `;
    },

    /**
     * Habilita un botón y restaura su texto
     * @param {HTMLElement} boton - Botón a habilitar
     */
    habilitarBoton(boton) {
        boton.disabled = false;
        const textoOriginal = boton.getAttribute('data-texto-original');
        if (textoOriginal) {
            boton.innerHTML = textoOriginal;
        }
    },

    /**
     * Escapa caracteres HTML para prevenir ataques XSS (Cross-Site Scripting)
     *
     * CRÍTICO PARA SEGURIDAD: Convierte caracteres especiales HTML en entidades.
     * Debe ser usado SIEMPRE antes de insertar contenido de usuario en el DOM.
     *
     * Conversiones:
     * - < se convierte en &lt;
     * - > se convierte en &gt;
     * - & se convierte en &amp;
     * - " se convierte en &quot;
     * - ' se convierte en &#39;
     *
     * @memberof UI
     * @param {string|number} texto - Texto a escapar (puede ser string o número)
     * @returns {string} Texto con caracteres HTML escapados
     *
     * @example
     * UI.escaparHTML('<script>alert("XSS")</script>');
     * // Retorna: "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
     *
     * @example
     * // USO CORRECTO - Protegido contra XSS
     * const nombre = UI.escaparHTML(usuario.nombre);
     * element.innerHTML = `<p>${nombre}</p>`;
     *
     * // USO INCORRECTO - Vulnerable a XSS
     * element.innerHTML = `<p>${usuario.nombre}</p>`; // ¡PELIGRO!
     */
    escaparHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    },

    /**
     * Inicializa el botón para mostrar/ocultar contraseña
     *
     * Configura el evento click en el botón del ícono de ojo que permite
     * alternar entre mostrar el password en texto plano o como puntos.
     *
     * @memberof UI
     * @example
     * // Llamar una vez al inicializar la aplicación
     * UI.inicializarTogglePassword();
     */
    inicializarTogglePassword() {
        DOM.togglePassword.addEventListener('click', () => {
            const tipo = DOM.password.type === 'password' ? 'text' : 'password';
            DOM.password.type = tipo;
            DOM.togglePasswordIcon.classList.toggle('bi-eye');
            DOM.togglePasswordIcon.classList.toggle('bi-eye-slash');
        });
    }
};

/**
 * Exportar el objeto DOM para acceso directo desde otros módulos
 *
 * Permite que app.js y otros módulos accedan directamente a las
 * referencias de elementos DOM si es necesario.
 *
 * @exports DOM
 */
export { DOM };