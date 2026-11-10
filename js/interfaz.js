/* ============================================================
   SICOP-VE — Capa de Interfaz de Usuario y Eventos (js/interfaz.js)
   Proyecto Final: Lógica y Programación I
   
   Responsabilidad:
   - Manipulación del DOM, eventos de click, change e input reactivo.
   - Orquestación del Asistente de Cotización de 4 pasos con cálculo en vivo.
   - Aplicación de plantillas de obra, duplicación de cotizaciones y recuperación de borradores.
   - Notificaciones emergentes (toasts), modales accesibles y formato monetario venezolano.
   - Enlace limpio entre datos.js, logica.js y el DOM sin romper ninguna regla de negocio.
   ============================================================ */

// ============================================================
// 1. ESTADO GLOBAL EN MEMORIA DE LA INTERFAZ
// ============================================================
var sesionUsuario = null;                // Usuario autenticado actualmente
var cotizacionEnEdicion = null;          // Objeto de cotización calculado o en revisión
var materialEnEdicionId = null;          // ID de material al editar en catálogo (Gobernación)
var pasoCotizadorActual = 1;             // Paso actual del asistente (1: Obra, 2: Materiales, 3: Revisión, 4: Envío)
var estimacionActualCalculadora = null;  // Último cálculo de la calculadora de obra
var accionConfirmacionModal = null;      // Callback a ejecutar al confirmar en el modal propio
var documentoActual = null;              // Cotización activa en vista de documento oficial
var _timerBorrador = null;               // Temporizador para guardado con debounce de borrador
var _cotizacionIdRechazo = null;         // ID de cotización pendiente de rechazo formal

/**
 * Programa el guardado del borrador con debounce de 800ms para evitar escrituras excesivas.
 */
function programarGuardadoBorrador() {
    if (_timerBorrador) clearTimeout(_timerBorrador);
    _timerBorrador = setTimeout(function () {
        guardarBorradorActualEnStorage();
    }, 800);
}

/**
 * Enfoca el primer elemento interactivo dentro de un modal para cumplir WCAG 2.1.
 */
function enfocarPrimerElementoModal(modal) {
    if (!modal) return;
    setTimeout(function () {
        var primero = modal.querySelector('input:not([type="hidden"]), select, textarea, button');
        if (primero) primero.focus();
    }, 60);
}

/**
 * Cierra todos los modales abiertos en la plataforma.
 */
function cerrarTodosLosModales() {
    var modales = document.querySelectorAll('.modal-fondo:not(.oculto)');
    for (var i = 0; i < modales.length; i++) {
        modales[i].classList.add('oculto');
    }
    ocultarVistaImprimible();
    _cotizacionIdRechazo = null;
    accionConfirmacionModal = null;
}

// ============================================================
// 2. SISTEMA DE NOTIFICACIONES TOASTS Y MODALES PROPIOS
// ============================================================

/**
 * Muestra una notificación emergente (Toast) flotante sin bloquear la ejecución.
 * @param {string} mensaje - Texto descriptivo para el usuario.
 * @param {string} tipo - 'exito', 'error', 'advertencia' o 'info'.
 * @param {number} [duracionMs=3500] - Tiempo de visualización en milisegundos.
 */
function mostrarNotificacion(mensaje, tipo, duracionMs, opciones) {
    var contenedor = document.getElementById('contenedorToasts');
    if (!contenedor) return;

    var duracion = duracionMs || 3500;
    var tipoClase = tipo || 'info';

    var iconoHtml = '';
    if (typeof icono === 'function') {
        if (tipoClase === 'exito') iconoHtml = icono('check', 16);
        else if (tipoClase === 'error') iconoHtml = icono('cerrar', 16);
        else if (tipoClase === 'advertencia') iconoHtml = icono('alerta', 16);
        else iconoHtml = icono('info', 16);
    }

    var toast = document.createElement('div');
    toast.className = 'toast toast--' + tipoClase;

    var mensajeSeguro = (typeof escaparHtml === 'function') ? escaparHtml(mensaje) : mensaje;
    var htmlInterno = '<span class="toast__icono">' + iconoHtml + '</span>' +
                      '<span class="toast__mensaje">' + mensajeSeguro + '</span>';

    if (opciones && opciones.textoAccion && typeof opciones.onAccion === 'function') {
        htmlInterno += '<button type="button" class="toast__accion" ' +
            'style="background:transparent;border:none;color:var(--color-acento);' +
            'font-weight:700;cursor:pointer;font-size:0.8rem;padding:0.25rem 0.5rem;' +
            'text-decoration:underline;margin-left:0.5rem;">' +
            escaparHtml(opciones.textoAccion) + '</button>';
    }

    toast.innerHTML = htmlInterno;
    contenedor.appendChild(toast);

    if (opciones && opciones.textoAccion && typeof opciones.onAccion === 'function') {
        var btnAccion = toast.querySelector('.toast__accion');
        if (btnAccion) {
            btnAccion.addEventListener('click', function () {
                if (typeof opciones.onAccion === 'function') opciones.onAccion();
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            });
        }
    }

    setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(function () {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duracion);
}

/**
 * Muestra el diálogo modal de confirmación propio de la aplicación (sustituye a window.confirm).
 * @param {string} titulo - Título del diálogo.
 * @param {string} mensaje - Pregunta o advertencia detallada.
 * @param {Function} onConfirmar - Función a ejecutar si el usuario pulsa "Confirmar".
 * @param {string} [textoConfirmar='Confirmar'] - Etiqueta del botón afirmativo.
 * @param {string} [textoCancelar='Cancelar'] - Etiqueta del botón de cancelación.
 */
function mostrarModalConfirmacion(titulo, mensaje, onConfirmar, textoConfirmar, textoCancelar, permitirHtml) {
    var modal = document.getElementById('modalConfirmacion');
    var titElem = document.getElementById('modalConfirmacionTitulo');
    var msgElem = document.getElementById('modalConfirmacionMensaje');
    var btnOk = document.getElementById('btnAceptarModalConfirmacion');
    var btnCancel = document.getElementById('btnCancelarModalConfirmacion');

    if (!modal) return;

    if (titElem) titElem.textContent = titulo || 'Confirmación Requerida';
    if (msgElem) {
        if (permitirHtml) {
            msgElem.innerHTML = mensaje;
        } else {
            var texto = mensaje || '¿Está seguro de continuar?';
            msgElem.innerHTML = escaparHtml(texto).replace(/\n/g, '<br>');
        }
    }
    if (btnOk) btnOk.textContent = textoConfirmar || 'Confirmar';
    if (btnCancel) btnCancel.textContent = textoCancelar || 'Cancelar';

    accionConfirmacionModal = onConfirmar;
    modal.classList.remove('oculto');
    enfocarPrimerElementoModal(modal);
}

/**
 * Cierra el modal de confirmación y limpia la acción pendiente.
 */
function cerrarModalConfirmacion() {
    var modal = document.getElementById('modalConfirmacion');
    if (modal) modal.classList.add('oculto');
    accionConfirmacionModal = null;
}

// ============================================================
// 3. GESTIÓN DE ERRORES CLAROS Y ACCIONABLES EN CAMPOS
// ============================================================

/**
 * Resalta un campo en rojo y coloca un mensaje pedagógico debajo explicando qué hacer.
 * @param {string} idCampo - ID del elemento input o select en el DOM.
 * @param {string} mensaje - Instrucción clara y sugerencia de solución.
 */
function mostrarErrorCampo(idCampo, mensaje) {
    var campo = document.getElementById(idCampo);
    if (!campo) return;

    campo.classList.add('input-error');

    // Buscar si ya tiene un contenedor de mensaje de error asignado
    var idError = 'error_' + idCampo;
    var elemError = document.getElementById(idError);

    if (!elemError) {
        elemError = document.createElement('div');
        elemError.id = idError;
        elemError.className = 'mensaje-error-campo';
        // Insertar después del campo o de su contenedor padre inmediato si es tabla
        if (campo.parentNode) {
            campo.parentNode.appendChild(elemError);
        }
    }

    elemError.textContent = mensaje;
    elemError.classList.remove('oculto');
    elemError.style.display = 'block';
}

/**
 * Limpia el estado de error de un campo específico.
 * @param {string} idCampo - ID del elemento input.
 */
function limpiarErrorCampo(idCampo) {
    var campo = document.getElementById(idCampo);
    if (campo) {
        campo.classList.remove('input-error');
    }
    var idError = 'error_' + idCampo;
    var elemError = document.getElementById(idError);
    if (elemError) {
        elemError.classList.add('oculto');
        elemError.style.display = 'none';
        elemError.textContent = '';
    }
}

/**
 * Limpia todos los errores visuales dentro de un contenedor o de toda la pantalla.
 * @param {HTMLElement|string} [contenedor] - Elemento o ID del contenedor.
 */
function limpiarErrores(contenedor) {
    var raiz = typeof contenedor === 'string' ? document.getElementById(contenedor) : (contenedor || document);
    if (!raiz) return;

    var inputsError = raiz.querySelectorAll('.input-error');
    for (var i = 0; i < inputsError.length; i++) {
        inputsError[i].classList.remove('input-error');
    }

    var msgsError = raiz.querySelectorAll('.mensaje-error-campo');
    for (var j = 0; j < msgsError.length; j++) {
        msgsError[j].classList.add('oculto');
        msgsError[j].style.display = 'none';
        msgsError[j].textContent = '';
    }
}

// ============================================================
// 4. GESTIÓN DE MONEDA GLOBAL (USD / Bs) Y TEMA CLARO / OSCURO
// ============================================================

/**
 * Inicializa el tema visual (claro u oscuro) respetando la preferencia guardada o del sistema.
 */
function inicializarTema() {
    var temaGuardado = localStorage.getItem('sicop_tema');
    var temaPref = temaGuardado;
    if (!temaPref) {
        temaPref = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'oscuro' : 'claro';
    }
    aplicarTema(temaPref);
}

/**
 * Aplica el tema visual en el elemento raíz y actualiza el icono del botón.
 * @param {string} tema - 'claro' u 'oscuro'.
 */
function aplicarTema(tema) {
    document.documentElement.setAttribute('data-tema', tema);
    var spanIcono = document.getElementById('iconoTemaActual');
    if (spanIcono && typeof icono === 'function') {
        var nomIcono = (tema === 'oscuro') ? 'sol' : 'luna';
        spanIcono.setAttribute('data-icono', nomIcono);
        spanIcono.innerHTML = icono(nomIcono, 17);
    }
    var logoSide = document.getElementById('logoSidebar');
    if (logoSide) {
        logoSide.src = (tema === 'oscuro') ? 'img/logo-blanco.png' : 'img/logo-negro.png';
    }
}

/**
 * Alterna manualmente entre modo claro y oscuro.
 */
function alternarTema() {
    var temaActual = document.documentElement.getAttribute('data-tema') || 'claro';
    var nuevoTema = (temaActual === 'oscuro') ? 'claro' : 'oscuro';
    localStorage.setItem('sicop_tema', nuevoTema);
    aplicarTema(nuevoTema);
    mostrarNotificacion('Tema cambiado a modo ' + nuevoTema, 'info', 2000);
}

/**
 * Cambia la moneda activa en el sistema y refresca la visualización de datos de manera reactiva y universal.
 * @param {string} nuevaMoneda - 'USD' o 'Bs'.
 */
function cambiarMonedaGlobal(nuevaMoneda) {
    var mon = (nuevaMoneda === 'Bs' || nuevaMoneda === 'VES') ? 'Bs' : 'USD';
    document.body.style.cursor = 'progress';
    guardarMonedaActiva(mon);
    actualizarCabeceraUsuario();
    sincronizarSelectorMonedaUI();
    actualizarTotalEnVivo();

    // Determinar módulo activo
    var modulo = 'dashboard';
    var pestanaActiva = document.querySelector('.nav-btn.activa');
    if (pestanaActiva) {
        modulo = pestanaActiva.getAttribute('data-modulo') || 'dashboard';
    } else {
        var secActiva = document.querySelector('.seccion-modulo.activa');
        if (secActiva && secActiva.id) {
            modulo = secActiva.id.replace('modulo-', '');
        }
    }

    try {
        switch (modulo) {
            case 'dashboard':
                if (typeof renderizarDashboard === 'function') renderizarDashboard();
                if (typeof renderizarAnalisisABC === 'function') renderizarAnalisisABC();
                break;
            case 'cotizador':
                if (typeof renderizarCatalogoEnCotizador === 'function') renderizarCatalogoEnCotizador(true);
                if (typeof actualizarTotalEnVivo === 'function') actualizarTotalEnVivo();
                if (typeof pasoCotizadorActual !== 'undefined') {
                    if (pasoCotizadorActual === 3 && typeof renderizarPaso3Revision === 'function') renderizarPaso3Revision();
                    if (pasoCotizadorActual === 4 && typeof renderizarPaso4Confirmacion === 'function') renderizarPaso4Confirmacion();
                }
                break;
            case 'catalogo':
                if (typeof renderizarModuloCatalogo === 'function') renderizarModuloCatalogo();
                break;
            case 'aprobaciones':
                if (typeof renderizarModuloAprobaciones === 'function') renderizarModuloAprobaciones();
                break;
            case 'cartera':
                if (typeof renderizarModuloCartera === 'function') renderizarModuloCartera();
                break;
            case 'historial':
                if (typeof renderizarModuloHistorial === 'function') renderizarModuloHistorial();
                break;
            case 'financiamiento':
                if (typeof renderizarModuloFinanciamiento === 'function') renderizarModuloFinanciamiento();
                break;
            case 'supervision':
                if (typeof renderizarModuloSupervision === 'function') renderizarModuloSupervision();
                break;
            case 'bitacora':
                if (typeof renderizarModuloBitacora === 'function') renderizarModuloBitacora();
                break;
            case 'calculadora':
                if (typeof inicializarModuloCalculadora === 'function') inicializarModuloCalculadora();
                break;
            case 'ciudades':
                if (typeof renderizarModuloCiudades === 'function') renderizarModuloCiudades();
                break;
            case 'control-financiero':
                if (typeof renderizarModuloControlFinanciero === 'function') renderizarModuloControlFinanciero();
                break;
            case 'conciliacion-pagos':
                if (typeof renderizarModuloConciliacionPagos === 'function') renderizarModuloConciliacionPagos();
                break;
            case 'proyecciones':
                if (typeof renderizarModuloProyecciones === 'function') renderizarModuloProyecciones();
                break;
            case 'presupuestos':
                if (typeof renderizarModuloPresupuestos === 'function') renderizarModuloPresupuestos();
                break;
            case 'proyectos':
                if (typeof renderizarModuloProyectos === 'function') renderizarModuloProyectos();
                break;
            case 'instituciones':
                if (typeof renderizarModuloInstituciones === 'function') renderizarModuloInstituciones();
                break;
            case 'inventario':
                if (typeof renderizarModuloInventario === 'function') renderizarModuloInventario();
                break;
            case 'proveedores':
                if (typeof renderizarModuloProveedores === 'function') renderizarModuloProveedores();
                break;
            case 'documentos':
                if (typeof renderizarModuloDocumentos === 'function') renderizarModuloDocumentos();
                break;
            case 'inteligencia':
                if (typeof renderizarModuloInteligencia === 'function') renderizarModuloInteligencia();
                break;
            case 'monitor-sistema':
                if (typeof renderizarModuloMonitorSistema === 'function') renderizarModuloMonitorSistema();
                break;
        }
    } catch (eRefresco) {
        console.warn('Error refrescando módulo activo tras cambio de moneda:', eRefresco);
    }

    // Refrescar documento imprimible si está abierto
    var vistaDoc = document.getElementById('vistaDocumentoImprimible');
    if (vistaDoc && !vistaDoc.classList.contains('oculto') && typeof documentoActual !== 'undefined' && documentoActual) {
        if (typeof renderizarDocumentoImprimible === 'function') {
            renderizarDocumentoImprimible(documentoActual);
        }
    }

    document.body.style.cursor = '';
    mostrarNotificacion('Moneda activa: ' + (mon === 'Bs' ? 'Bolívares (Bs. BCV)' : 'Dólares (USD $)'), 'info', 1800);
}

/**
 * Sincroniza el selector de moneda del encabezado con el valor almacenado y la tasa BCV.
 */
function sincronizarSelectorMonedaUI() {
    var selectMoneda = document.getElementById('selectorMonedaGlobal');
    if (!selectMoneda) return;
    selectMoneda.value = obtenerMonedaActiva();
    var tasa = obtenerTasaBCV();
    if (isNaN(tasa) || tasa <= 100 || tasa === 0.18 || tasa === 36.50) {
        tasa = 900.00;
        guardarTasaBCV(900.00);
    }
    var optUsd = selectMoneda.querySelector('option[value="USD"]');
    var optBs = selectMoneda.querySelector('option[value="Bs"]');
    if (optUsd) optUsd.textContent = 'USD ($)';
    if (optBs) optBs.textContent = 'Bs. (BCV · ' + formatearMoneda(tasa) + ')';
}

// ============================================================
// 5. INICIALIZACIÓN Y GESTIÓN DE SESIÓN
// ============================================================

function garantizarModalesFinanciamiento() {
    // Modal de selección de plan de financiamiento al aprobar
    if (!document.getElementById('modalPlanFinanciamiento')) {
        var mpf = document.createElement('div');
        mpf.id = 'modalPlanFinanciamiento';
        mpf.className = 'modal-fondo oculto';
        mpf.setAttribute('role', 'dialog');
        mpf.setAttribute('aria-modal', 'true');
        mpf.innerHTML =
            '<div class="modal-caja" style="max-width:720px;">' +
            '<h2 class="tarjeta__titulo">Seleccionar Plan de Financiamiento</h2>' +
            '<p class="tarjeta__descripcion">Monto Total de la Cotización: <strong id="modalPlanMonto">$0,00</strong></p>' +
            '<div id="contenedorOpcionesPlanModal" class="sv-mb-md"></div>' +
            '<div class="formulario__acciones sv-flex-end sv-gap-sm sv-mt-md">' +
            '  <button type="button" class="boton boton--secundario" id="btnCancelarPlan" onclick="cerrarTodosLosModales()">Cancelar</button>' +
            '  <button type="button" class="boton boton--primario" id="btnConfirmarPlan" disabled>Confirmar y Aprobar</button>' +
            '</div></div>';
        document.body.appendChild(mpf);
    }
}

/**
 * Arranca la interfaz al cargar el DOM.
 */
function inicializarInterfaz() {
    try { garantizarModalesFinanciamiento(); } catch (eGM) {
        console.warn('No se pudieron garantizar modales financieros:', eGM);
    }
    inicializarTema();
    try { verificarAlertasVencimientosAutomaticas(); } catch (eVA) {}
    sesionUsuario = obtenerSesionActual();
    var tasaVerif = obtenerTasaBCV();
    if (isNaN(tasaVerif) || tasaVerif <= 100 || tasaVerif === 0.18 || tasaVerif === 36.50) {
        guardarTasaBCV(900.00, formatearFechaHoy());
    }
    sincronizarSelectorMonedaUI();
    conectarEventosGenerales();

    // Sincronización reactiva entre pestañas del navegador (Cross-tab sync)
    window.addEventListener('storage', function (e) {
        if (!e || !e.key) return;
        if (typeof CLAVES_STORAGE !== 'undefined') {
            if (e.key === CLAVES_STORAGE.SESION) {
                sesionUsuario = obtenerSesionActual();
                if (sesionUsuario) {
                    mostrarAplicacion();
                } else {
                    mostrarPantallaLogin();
                }
            } else if (e.key === CLAVES_STORAGE.MONEDA || e.key === CLAVES_STORAGE.TASA) {
                sincronizarSelectorMonedaUI();
                var modActivo = document.querySelector('.seccion-modulo.activa');
                if (modActivo) {
                    var mId = modActivo.id.replace('modulo-', '');
                    cambiarPestana(mId);
                }
            }
        }
    });

    // Actualizar año dinámico en el pie de página
    var elAnio = document.getElementById('anioFooter');
    if (elAnio) {
        elAnio.textContent = new Date().getFullYear();
    }

    if (sesionUsuario) {
        mostrarAplicacion();
    } else {
        mostrarPantallaLogin();
    }

    if (typeof hidratarIconos === 'function') {
        hidratarIconos();
    }
}

/**
 * Muestra la vista de autenticación.
 */
function mostrarPantallaLogin() {
    cerrarTodosLosModales();

    var elementosGobernacion = document.querySelectorAll('.solo-gobernacion');
    for (var g = 0; g < elementosGobernacion.length; g++) {
        elementosGobernacion[g].classList.add('oculto');
    }

    var formLogin = document.getElementById('formLogin');
    if (formLogin) {
        try { formLogin.reset(); } catch (eF) {}
    }

    cotizacionEnEdicion = null;

    var contLogin = document.getElementById('pantallaLogin');
    var contApp = document.getElementById('aplicacionPrincipal');
    if (contLogin) contLogin.classList.remove('oculto');
    if (contApp) contApp.classList.add('oculto');

    poblarSelectorUsuariosLogin();
    if (typeof hidratarIconos === 'function') {
        hidratarIconos();
    }
}

/**
 * Llena el selector rápido de usuarios en la pantalla de login para facilitar la exposición.
 */
function poblarSelectorUsuariosLogin() {
    var select = document.getElementById('selectorUsuarioRapido');
    if (!select) return;

    var usuarios = [];
    try { usuarios = obtenerUsuarios(); } catch (e) {
        console.error('Error obteniendo usuarios para login:', e);
        return;
    }

    select.innerHTML = '<option value="">-- Seleccionar usuario de demostración --</option>';

    for (var i = 0; i < usuarios.length; i++) {
        var u = usuarios[i];
        if (!u || !u.usuario) continue;
        var opt = document.createElement('option');
        opt.value = u.usuario;
        opt.textContent = u.nombre + ' (' + u.perfil + ' - ' + u.estado + ')';
        select.appendChild(opt);
    }
}

/**
 * Rellena automáticamente las credenciales al seleccionar un usuario demo.
 * @param {string} nombreUsuario - Identificador del usuario (ej: 'alcaldia_libertador').
 */
function seleccionarUsuarioDemo(nombreUsuario) {
    var select = document.getElementById('selectorUsuarioRapido');
    if (select) select.value = nombreUsuario;

    var usuarios = [];
    try { usuarios = obtenerUsuarios(); } catch (e) { usuarios = []; }

    var encontrado = null;
    for (var i = 0; i < usuarios.length; i++) {
        if (usuarios[i].usuario === nombreUsuario) {
            encontrado = usuarios[i];
            break;
        }
    }

    var inputU = document.getElementById('inputUsuarioLogin');
    var inputC = document.getElementById('inputClaveLogin');

    if (encontrado) {
        if (inputU) inputU.value = encontrado.usuario;
        if (inputC) inputC.value = encontrado.clave;
        mostrarNotificacion('Usuario: ' + encontrado.nombre + ' (' + encontrado.perfil + ')', 'info', 1800);
    } else {
        // Fallback: intentar con datos del seed
        for (var j = 0; j < USUARIOS_INICIALES.length; j++) {
            if (USUARIOS_INICIALES[j].usuario === nombreUsuario) {
                if (inputU) inputU.value = USUARIOS_INICIALES[j].usuario;
                if (inputC) inputC.value = USUARIOS_INICIALES[j].clave;
                mostrarNotificacion('Usuario del seed (no persistido): ' +
                    USUARIOS_INICIALES[j].nombre, 'advertencia', 2200);
                return;
            }
        }
        mostrarNotificacion('Usuario no encontrado: ' + nombreUsuario +
            '. Revisa el localStorage o usa "Reparar usuarios demo".', 'error', 4000);
    }
}

/**
 * Muestra la aplicación principal luego de iniciar sesión.
 */
function mostrarAplicacion() {
    var contLogin = document.getElementById('pantallaLogin');
    var contApp = document.getElementById('aplicacionPrincipal');
    if (contLogin) contLogin.classList.add('oculto');
    if (contApp) contApp.classList.remove('oculto');

    actualizarCabeceraUsuario();
    ajustarVisibilidadMenuPorRol();

    // Módulo inicial: Dashboard
    cambiarPestana('dashboard');

    if (typeof hidratarIconos === 'function') {
        hidratarIconos();
    }
}

/**
 * Actualiza la información del usuario en la barra superior.
 */
function actualizarCabeceraUsuario() {
    if (!sesionUsuario) return;

    // Recargar datos frescos del usuario desde storage
    var usuarios = obtenerUsuarios();
    for (var i = 0; i < usuarios.length; i++) {
        if (usuarios[i].id === sesionUsuario.id) {
            sesionUsuario = usuarios[i];
            guardarSesionActual(sesionUsuario);
            break;
        }
    }

    var estPto = calcularEstadoPresupuestoUsuario(sesionUsuario);
    var moneda = obtenerMonedaActiva();
    var tasa = obtenerTasaBCV();

    var nombreElem = document.getElementById('usuarioNombreHeader');
    var rolElem = document.getElementById('usuarioRolHeader');
    var semaforoElem = document.getElementById('usuarioSemaforoHeader');
    var avatarElem = document.getElementById('avatarInicialesHeader');

    if (nombreElem) nombreElem.textContent = sesionUsuario.nombre;
    if (rolElem) rolElem.textContent = sesionUsuario.perfil + ' | ' + sesionUsuario.estado;

    // Generar iniciales limpias para el avatar (ej: María González -> MG, Ing. Ana Pérez -> AP)
    if (avatarElem) {
        var limpio = sesionUsuario.nombre.replace(/^(Ing\.|Lic\.|Dr\.|Dra\.|Arq\.)\s*/i, '').trim();
        var partes = limpio.split(/\s+/);
        var iniciales = 'US';
        if (partes.length >= 2) {
            iniciales = (partes[0][0] + partes[1][0]).toUpperCase();
        } else if (partes.length === 1 && partes[0].length > 0) {
            iniciales = partes[0].substring(0, 2).toUpperCase();
        }
        avatarElem.textContent = iniciales;
    }

    if (semaforoElem) {
        semaforoElem.className = 'badge-semaforo badge-semaforo--' + estPto.colorSemaforo;
        var textoDisp = formatearMoneda(estPto.saldoDisponible, moneda, tasa);
        semaforoElem.textContent = estPto.textoSemaforo + ' (Disp: ' + textoDisp + ')';
    }

    sincronizarSelectorMonedaUI();
    try {
        ajustarVisibilidadMenuPorRol();
    } catch (eVis0) {
        console.warn('Error inicial ajustando visibilidad de menú:', eVis0);
    }
    actualizarBandejaNotificaciones();
    try {
        ajustarVisibilidadMenuPorRol();
    } catch (eVis) {
        console.warn('Error ajustando visibilidad de menú:', eVis);
    }
}

/**
 * Actualiza el contador y contenido de la bandeja desplegable de notificaciones.
 */
function actualizarBandejaNotificaciones() {
    if (!sesionUsuario) return;
    var badge = document.getElementById('badgeNotifContador');
    var listaContenedor = document.getElementById('listaNotificacionesUsuario');
    var noLeidas = contarNotificacionesNoLeidas(sesionUsuario.id);

    if (badge) {
        if (noLeidas > 0) {
            badge.textContent = noLeidas > 9 ? '9+' : String(noLeidas);
            badge.classList.remove('oculto');
        } else {
            badge.textContent = '0';
            badge.classList.add('oculto');
        }
    }

    if (!listaContenedor) return;
    var notifs = obtenerNotificaciones(sesionUsuario.id);

    if (notifs.length === 0) {
        listaContenedor.innerHTML = 
            '<div class="dropdown-notificaciones__vacio">' +
            '  <span data-icono="check" data-tamano="22" style="color:var(--color-texto-terciario); margin-bottom:0.35rem;"></span>' +
            '  <div>No tienes notificaciones pendientes.</div>' +
            '</div>';
        if (typeof hidratarIconos === 'function') {
            hidratarIconos(listaContenedor);
        }
        return;
    }

    var html = '';
    for (var i = 0; i < notifs.length; i++) {
        var n = notifs[i];
        var iconoTipo = 'info';
        if (n.tipo === 'exito') iconoTipo = 'check';
        else if (n.tipo === 'peligro') iconoTipo = 'alerta';
        else if (n.tipo === 'advertencia') iconoTipo = 'alerta';

        var claseLeida = n.leida ? ' dropdown-notif-item--leida' : ' dropdown-notif-item--nueva';

        html += '<div class="dropdown-notif-item' + claseLeida + '">' +
            '  <div class="dropdown-notif-item__icono dropdown-notif-item__icono--' + (n.tipo || 'info') + '">' +
            '    <span data-icono="' + iconoTipo + '" data-tamano="14"></span>' +
            '  </div>' +
            '  <div class="dropdown-notif-item__cuerpo">' +
            '    <div class="dropdown-notif-item__texto">' + escaparHTML(n.texto) + '</div>' +
            '    <div class="dropdown-notif-item__fecha">' + escaparHTML(n.fecha) + '</div>' +
            '  </div>' +
            '</div>';
    }
    listaContenedor.innerHTML = html;
    if (typeof hidratarIconos === 'function') {
        hidratarIconos(listaContenedor);
    }
}

/**
 * Muestra u oculta módulos en la barra de navegación según el rol del usuario conectado.
 */
function ajustarVisibilidadMenuPorRol() {
    if (!sesionUsuario || !sesionUsuario.perfil) return;

    var esGobernacion = (typeof esRolGobernacion === 'function')
        ? esRolGobernacion(sesionUsuario)
        : (String(sesionUsuario.perfil).toLowerCase().indexOf('gobernacion') !== -1);

    var itemsGobernacion = document.querySelectorAll('.solo-gobernacion');
    for (var i = 0; i < itemsGobernacion.length; i++) {
        if (esGobernacion) {
            itemsGobernacion[i].classList.remove('oculto');
        } else {
            itemsGobernacion[i].classList.add('oculto');
        }
    }
}

// ============================================================
// 6. NAVEGACIÓN POR PESTAÑAS / MÓDULOS
// ============================================================

/**
 * Diccionario de títulos formales para la barra superior SaaS.
 */
var TITULOS_MODULOS_SAAS = {
    dashboard: 'Dashboard',
    calculadora: 'Calculadora de Materiales',
    cotizador: 'Asistente de Cotización',
    ciudades: 'Dónde Conviene Comprar',
    historial: 'Historial de Cotizaciones',
    financiamiento: 'Mis Cuotas y Financiamiento',
    cartera: 'Cartera Global y Cobranzas',
    catalogo: 'Catálogo Maestro de Precios',
    aprobaciones: 'Aprobaciones y Control de Fondos',
    supervision: 'Supervisión Global de Inversión',
    bitacora: 'Bitácora de Auditoría y Alertas',
    'estado-usuarios': 'Estado Integral de Usuarios y Control Institucional',
    'control-financiero': 'Centro de Control Financiero',
    'conciliacion-pagos': 'Conciliación de Pagos y Comprobantes',
    proyecciones: 'Proyecciones Financieras',
    presupuestos: 'Gestión Presupuestaria Institucional',
    proyectos: 'Proyectos y Obras Públicas',
    instituciones: 'Gestión Multiinstitucional',
    inventario: 'Inventario y Almacenes Regionales',
    proveedores: 'Proveedores y Precios Históricos',
    documentos: 'Gestor Documental y Certificación',
    inteligencia: 'Inteligencia Administrativa y Alertas',
    'monitor-sistema': 'Monitor del Sistema y Salud',
    respaldo: 'Exportar / Importar y Demostración'
};

/**
 * Alias de compatibilidad global.
 */
var cambiarModulo = function(moduloId) { return cambiarPestana(moduloId); };
if (typeof window !== 'undefined') window.cambiarModulo = cambiarModulo;

/**
 * Cambia la pestaña activa y ejecuta el renderizado correspondiente con guardas de acceso centralizadas.
 * @param {string} moduloId - Nombre clave del módulo.
 */
function cambiarPestana(moduloId) {
    // 0. GUARDIA DE NAVEGACIÓN Y PERMISOS (ROUTE GUARD)
    var sesionAct = (typeof obtenerSesion === 'function') ? obtenerSesion() : null;
    if (typeof tienePermiso === 'function' && sesionAct) {
        if (!tienePermiso(sesionAct, moduloId)) {
            mostrarNotificacion('Acceso restringido: Su perfil institucional no tiene permisos para acceder al módulo "' + moduloId + '".', 'advertencia');
            moduloId = 'dashboard';
        }
    }

    // 1. Forzar guardado de borrador ANTES de cualquier cambio
    try {
        if (typeof guardarBorradorActualEnStorage === 'function' &&
            typeof cotizacionEnEdicion !== 'undefined') {
            guardarBorradorActualEnStorage();
        }
    } catch (eGuardado) {
        console.warn('No se pudo guardar borrador al cambiar pestaña:', eGuardado);
    }

    // 2. Cerrar vista imprimible si estaba abierta
    try { ocultarVistaImprimible(); } catch (eOcultar) {}

    // 3. Actualizar título de topbar
    try {
        var titElem = document.getElementById('topbarTituloModulo');
        if (titElem && typeof TITULOS_MODULOS_SAAS !== 'undefined') {
            titElem.textContent = TITULOS_MODULOS_SAAS[moduloId] || 'Plataforma SICOP-VE';
        }
    } catch (eTit) {}

    // 4. Actualizar nav lateral
    try {
        var botonesNav = document.querySelectorAll('.nav-btn');
        for (var i = 0; i < botonesNav.length; i++) {
            botonesNav[i].classList.remove('activa');
            if (botonesNav[i].getAttribute('data-modulo') === moduloId) {
                botonesNav[i].classList.add('activa');
            }
        }
        var bottomItems = document.querySelectorAll('.bottom-nav__item');
        for (var b = 0; b < bottomItems.length; b++) {
            bottomItems[b].classList.remove('activa');
            if (bottomItems[b].getAttribute('data-bottom-modulo') === moduloId) {
                bottomItems[b].classList.add('activa');
            }
        }
    } catch (eNav) {}

    // 5. Cerrar sidebar móvil
    try {
        var sidebar = document.getElementById('sidebarApp');
        var overlay = document.getElementById('sidebarOverlay');
        if (sidebar && sidebar.classList.contains('abierta')) sidebar.classList.remove('abierta');
        if (overlay && overlay.classList.contains('activa')) overlay.classList.remove('activa');
    } catch (eSide) {}

    // 6. Mostrar sección destino
    try {
        var secciones = document.querySelectorAll('.seccion-modulo');
        for (var j = 0; j < secciones.length; j++) secciones[j].classList.remove('activa');
        var seccionDestino = document.getElementById('modulo-' + moduloId);
        if (seccionDestino) {
            seccionDestino.classList.remove('oculto');
            seccionDestino.classList.add('activa');
        }
    } catch (eSec) {}

    // 7. Ejecutar renderizador del módulo (CADA UNO EN SU PROPIO TRY)
    try {
        switch (moduloId) {
            case 'dashboard':
                if (typeof renderizarDashboard === 'function') renderizarDashboard();
                try {
                    if (window.SICOPMovimiento && typeof window.SICOPMovimiento.animarBarrasGraficos === 'function') {
                        window.SICOPMovimiento.animarBarrasGraficos();
                    }
                } catch (eAnimar) {}
                try {
                    if (window.SICOPAnalisisABC && typeof window.SICOPAnalisisABC.renderizar === 'function') {
                        window.SICOPAnalisisABC.renderizar();
                    }
                } catch (eABC) {}
                break;
            case 'calculadora':
                if (typeof inicializarModuloCalculadora === 'function') inicializarModuloCalculadora();
                break;
            case 'cotizador':
                if (typeof renderizarModuloCotizador === 'function') renderizarModuloCotizador();
                break;
            case 'ciudades':
                if (typeof renderizarModuloCiudades === 'function') renderizarModuloCiudades();
                break;
            case 'control-financiero':
                if (typeof renderizarModuloControlFinanciero === 'function') renderizarModuloControlFinanciero();
                break;
            case 'conciliacion-pagos':
                if (typeof renderizarModuloConciliacionPagos === 'function') renderizarModuloConciliacionPagos();
                break;
            case 'proyecciones':
                if (typeof renderizarModuloProyecciones === 'function') renderizarModuloProyecciones();
                break;
            case 'presupuestos':
                if (typeof renderizarModuloPresupuestos === 'function') renderizarModuloPresupuestos();
                break;
            case 'proyectos':
                if (typeof renderizarModuloProyectos === 'function') renderizarModuloProyectos();
                break;
            case 'instituciones':
                if (typeof renderizarModuloInstituciones === 'function') renderizarModuloInstituciones();
                break;
            case 'inventario':
                if (typeof renderizarModuloInventario === 'function') renderizarModuloInventario();
                break;
            case 'proveedores':
                if (typeof renderizarModuloProveedores === 'function') renderizarModuloProveedores();
                break;
            case 'documentos':
                if (typeof renderizarModuloDocumentos === 'function') renderizarModuloDocumentos();
                break;
            case 'inteligencia':
                if (typeof renderizarModuloInteligencia === 'function') renderizarModuloInteligencia();
                break;
            case 'monitor-sistema':
                if (typeof renderizarModuloMonitorSistema === 'function') renderizarModuloMonitorSistema();
                break;
            case 'catalogo':
                if (typeof renderizarModuloCatalogo === 'function') renderizarModuloCatalogo();
                break;
            case 'aprobaciones':
                if (typeof renderizarModuloAprobaciones === 'function') renderizarModuloAprobaciones();
                break;
            case 'historial':
                if (typeof renderizarModuloHistorial === 'function') renderizarModuloHistorial();
                break;
            case 'supervision':
                if (typeof renderizarModuloSupervision === 'function') renderizarModuloSupervision();
                break;
            case 'bitacora':
                if (typeof renderizarModuloBitacora === 'function') renderizarModuloBitacora();
                break;
            case 'estado-usuarios':
                if (typeof renderizarModuloEstadoUsuarios === 'function') renderizarModuloEstadoUsuarios();
                break;
            case 'financiamiento':
                if (typeof renderizarModuloFinanciamiento === 'function') renderizarModuloFinanciamiento();
                break;
            case 'cartera':
                if (typeof renderizarModuloCartera === 'function') renderizarModuloCartera();
                break;
            case 'control-financiero':
                if (typeof renderizarModuloControlFinanciero === 'function') renderizarModuloControlFinanciero();
                break;
            case 'conciliacion-pagos':
                if (typeof renderizarModuloConciliacionPagos === 'function') renderizarModuloConciliacionPagos();
                break;
            case 'proyecciones':
                if (typeof renderizarModuloProyecciones === 'function') renderizarModuloProyecciones();
                break;
            case 'presupuestos':
                if (typeof renderizarModuloPresupuestos === 'function') renderizarModuloPresupuestos();
                break;
            case 'proyectos':
                if (typeof renderizarModuloProyectos === 'function') renderizarModuloProyectos();
                break;
            case 'instituciones':
                if (typeof renderizarModuloInstituciones === 'function') renderizarModuloInstituciones();
                break;
            case 'inventario':
                if (typeof renderizarModuloInventario === 'function') renderizarModuloInventario();
                break;
            case 'proveedores':
                if (typeof renderizarModuloProveedores === 'function') renderizarModuloProveedores();
                break;
            case 'documentos':
                if (typeof renderizarModuloDocumentos === 'function') renderizarModuloDocumentos();
                break;
            case 'inteligencia':
                if (typeof renderizarModuloInteligencia === 'function') renderizarModuloInteligencia();
                break;
            case 'monitor-sistema':
                if (typeof renderizarModuloMonitorSistema === 'function') renderizarModuloMonitorSistema();
                break;
        }
    } catch (eRender) {
        console.error('Error al renderizar módulo "' + moduloId + '":', eRender);
    }

    // 8. SIEMPRE hidratar iconos al final (incluso si hubo error arriba)
    try {
        if (typeof hidratarIconos === 'function') hidratarIconos();
    } catch (eIconos) {
        console.error('Error al hidratar iconos:', eIconos);
    }
}

// ============================================================
// 7. MÓDULO: CALCULADORA DE MATERIALES POR UNIDAD DE OBRA
// ============================================================

function inicializarModuloCalculadora() {
    var selectTipo = document.getElementById('calcTipoObra');
    if (selectTipo) {
        cambiarCamposCalculadora(selectTipo.value);
    }
}

function cambiarCamposCalculadora(tipo) {
    var ids = ['camposCalcPared', 'camposCalcLosa', 'camposCalcTuberia',
               'camposCalcContrapiso', 'camposCalcColumna', 'camposCalcViga',
               'camposCalcCeramica', 'camposCalcPintura', 'camposCalcCerca',
               'camposCalcMuroContencion', 'camposCalcTanque',
               'camposCalcElectrico', 'camposCalcImpermeabilizacion',
               'camposCalcPozoSeptico'];
    for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]);
        if (el) el.classList.add('oculto');
    }
    var mapa = {
        'pared': 'camposCalcPared', 'losa': 'camposCalcLosa',
        'tuberia': 'camposCalcTuberia', 'contrapiso': 'camposCalcContrapiso',
        'columna': 'camposCalcColumna', 'viga': 'camposCalcViga',
        'ceramica': 'camposCalcCeramica', 'pintura': 'camposCalcPintura',
        'cerca': 'camposCalcCerca', 'muro_contencion': 'camposCalcMuroContencion',
        'tanque': 'camposCalcTanque', 'electrico': 'camposCalcElectrico',
        'impermeabilizacion': 'camposCalcImpermeabilizacion',
        'pozo_septico': 'camposCalcPozoSeptico'
    };
    var id = mapa[tipo];
    if (id) {
        var el2 = document.getElementById(id);
        if (el2) el2.classList.remove('oculto');
    }
    var contenedorRes = document.getElementById('resultadoCalculadora');
    if (contenedorRes) contenedorRes.classList.add('oculto');
}

function ejecutarCalculoObra() {
    var tipo = document.getElementById('calcTipoObra').value;
    var desperdicio = parseFloat(document.getElementById('calcDesperdicio').value) || 10;
    var resultado = null;

    try {
        if (tipo === 'pared') {
            resultado = calcularMaterialesPared(
                parseFloat(document.getElementById('calcParedLargo').value),
                parseFloat(document.getElementById('calcParedAlto').value), desperdicio);
        } else if (tipo === 'losa') {
            resultado = calcularMaterialesLosa(
                parseFloat(document.getElementById('calcLosaLargo').value),
                parseFloat(document.getElementById('calcLosaAncho').value),
                parseFloat(document.getElementById('calcLosaEspesor').value),
                parseFloat(document.getElementById('calcLosaCabillasM2').value), desperdicio);
        } else if (tipo === 'tuberia') {
            resultado = calcularMaterialesTuberia(
                parseFloat(document.getElementById('calcTuberiaMetros').value), desperdicio);
        } else if (tipo === 'contrapiso') {
            resultado = calcularMaterialesContrapiso(
                parseFloat(document.getElementById('calcContrapisoArea').value),
                parseFloat(document.getElementById('calcContrapisoEspesor').value), desperdicio);
        } else if (tipo === 'columna') {
            resultado = calcularMaterialesColumna(
                parseInt(document.getElementById('calcColumnaCantidad').value, 10),
                parseFloat(document.getElementById('calcColumnaAlto').value),
                parseFloat(document.getElementById('calcColumnaSeccion').value), desperdicio);
        } else if (tipo === 'viga') {
            resultado = calcularMaterialesViga(
                parseFloat(document.getElementById('calcVigaLongitud').value),
                parseFloat(document.getElementById('calcVigaAncho').value),
                parseFloat(document.getElementById('calcVigaAlto').value), desperdicio);
        } else if (tipo === 'ceramica') {
            resultado = calcularMaterialesCeramica(
                parseFloat(document.getElementById('calcCeramicaArea').value),
                parseFloat(document.getElementById('calcCeramicaTamano').value), desperdicio);
        } else if (tipo === 'pintura') {
            resultado = calcularMaterialesPintura(
                parseFloat(document.getElementById('calcPinturaArea').value),
                parseInt(document.getElementById('calcPinturaManos').value, 10), desperdicio);
        } else if (tipo === 'cerca') {
            resultado = calcularMaterialesCerca(
                parseFloat(document.getElementById('calcCercaLongitud').value),
                parseFloat(document.getElementById('calcCercaAlto').value), desperdicio);
        } else if (tipo === 'muro_contencion') {
            resultado = calcularMaterialesMuroContencion(
                parseFloat(document.getElementById('calcMuroLongitud').value),
                parseFloat(document.getElementById('calcMuroAlto').value),
                parseFloat(document.getElementById('calcMuroEspesor').value), desperdicio);
        } else if (tipo === 'tanque') {
            resultado = calcularMaterialesTanque(
                parseFloat(document.getElementById('calcTanqueLitros').value), desperdicio);
        } else if (tipo === 'electrico') {
            resultado = calcularMaterialesElectrico(
                parseFloat(document.getElementById('calcElectricoArea').value), desperdicio);
        } else if (tipo === 'impermeabilizacion') {
            resultado = calcularMaterialesImpermeabilizacion(
                parseFloat(document.getElementById('calcImpermeArea').value), desperdicio);
        } else if (tipo === 'pozo_septico') {
            resultado = calcularMaterialesPozoSeptico(
                parseInt(document.getElementById('calcPozoPersonas').value, 10), desperdicio);
        }
    } catch (e) {
        resultado = { valido: false, error: 'Error al calcular: ' + e.message };
    }

    if (!resultado || !resultado.valido) {
        mostrarNotificacion(resultado ? resultado.error : 'Verifique las medidas ingresadas.', 'error');
        return;
    }
    estimacionActualCalculadora = resultado;
    renderizarResultadoCalculadora(resultado);
}

function renderizarResultadoCalculadora(est) {
    var contenedor = document.getElementById('resultadoCalculadora');
    var cuerpoTabla = document.getElementById('cuerpoResCalculadora');
    var tituloElem = document.getElementById('tituloResCalculadora');

    if (!contenedor || !cuerpoTabla) return;

    if (tituloElem) {
        tituloElem.textContent = 'Estimación de ' + est.tipo + ' (Desperdicio: ' + est.desperdicioPct + '%)';
    }

    cuerpoTabla.innerHTML = '';
    for (var i = 0; i < est.resultados.length; i++) {
        var item = est.resultados[i];
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td><strong>' + escaparHtml(item.nombreBusqueda) + '</strong></td>' +
            '<td>' + item.cantidad + '</td>' +
            '<td>' + escaparHtml(item.unidad) + '</td>' +
            '<td><span class="texto-secundario">' + escaparHtml(item.detalle) + '</span></td>';
        cuerpoTabla.appendChild(tr);
    }

    contenedor.classList.remove('oculto');
}

/**
 * Pasa las cantidades estimadas directamente al Asistente de Cotización (Paso 2).
 */
function transferirEstimacionACotizador() {
    if (!estimacionActualCalculadora) return;

    cambiarPestana('cotizador');
    irAPasoCotizador(2);

    var materiales = obtenerMateriales();
    for (var i = 0; i < estimacionActualCalculadora.resultados.length; i++) {
        var est = estimacionActualCalculadora.resultados[i];
        for (var j = 0; j < materiales.length; j++) {
            var m = materiales[j];
            if (m.nombre.toLowerCase().indexOf(est.nombreBusqueda.toLowerCase()) !== -1) {
                var input = document.getElementById('cant_mat_' + m.id);
                if (input && !input.disabled) {
                    var cantExistente = parseFloat(input.value) || 0;
                    input.value = cantExistente + est.cantidad;
                }
            }
        }
    }

    actualizarTotalEnVivo();
    mostrarNotificacion('Cantidades agregadas al Asistente de Cotización con éxito.', 'exito');
}

// ============================================================
// 8. MÓDULO: ASISTENTE DE COTIZACIÓN POR PASOS (WIZARD)
// ============================================================

/**
 * Renderiza el módulo de cotización y evalúa bloqueos o borradores guardados.
 */
function renderizarModuloCotizador() {
    try {
        if (typeof actualizarCabeceraUsuario === 'function') actualizarCabeceraUsuario();
    } catch (eCab) {}

    var avisoBloqueo = document.getElementById('avisoCotizacionBloqueada');
    var navPasos = document.querySelector('.asistente-pasos-nav');
    var layout = document.querySelector('.cotizador-layout');

    var disp = { puede: true, motivoMora: false };
    try {
        var cotizaciones = obtenerCotizaciones();
        disp = verificarDisponibilidadNuevaCotizacion(sesionUsuario.id, cotizaciones);
    } catch (eDisp) {
        console.warn('Error al verificar disponibilidad:', eDisp);
        disp = { puede: true, motivoMora: false };
    }

    // CASO 1: Bloqueo por mora
    if (!disp.puede && disp.motivoMora === true) {
        if (avisoBloqueo) {
            avisoBloqueo.innerHTML = '<div class="sv-flex-center sv-gap-sm">' +
                '<span class="sv-text-danger">' + icono('alerta', 20) + '</span>' +
                '<div><strong class="sv-text-danger">Bloqueado por mora</strong>' +
                '<p style="margin:0.35rem 0;">' + escaparHtml(disp.mensajeMora || 'Tiene planes con cuotas vencidas.') + '</p>' +
                '<button type="button" class="boton boton--primario boton--sm" onclick="cambiarPestana(\'financiamiento\')">Ir a Mis Cuotas</button>' +
                '</div></div>';
            avisoBloqueo.classList.remove('oculto');
        }
        if (layout) layout.style.opacity = '0.45';
        if (navPasos) navPasos.style.pointerEvents = 'none';
        try { bloquearControlesCotizador(true); } catch (e) {}
        try { if (typeof hidratarIconos === 'function') hidratarIconos(); } catch (e2) {}
        return;
    }

    // CASO 2: Bloqueo por cotización abierta
    if (!disp.puede && disp.cotizacionBloqueante) {
        var cotBloq = disp.cotizacionBloqueante;
        if (avisoBloqueo) {
            avisoBloqueo.innerHTML =
                '<div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem;">' +
                '  <div>' +
                '    <div style="display:flex; align-items:center; gap:0.5rem; font-weight:700; font-size:1rem; color:var(--color-peligro);">' +
                '      ' + icono('alerta', 18) + ' Cotización Abierta en Curso' +
                '    </div>' +
                '    <p style="margin:0.35rem 0 0 0; line-height:1.4;">Posee la cotización <strong>' +
                escaparHtml(cotBloq.correlativo || '') + '</strong> en estado <strong>' +
                escaparHtml(cotBloq.estado || '') + '</strong> por <strong>' +
                monedaActiva(cotBloq.total) + '</strong>.<br>' +
                '    Debe culminar o anular el trámite antes de crear uno nuevo.</p>' +
                '  </div>' +
                '  <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">' +
                '    <button type="button" class="boton boton--primario boton--sm" id="btnIrACotBloqueante">' + icono('ojo', 14) + ' Ver cotización</button>' +
                '    <button type="button" class="boton boton--peligro boton--sm" id="btnDescartarCotBloqueante">' + icono('eliminar', 14) + ' Descartar e iniciar</button>' +
                '  </div>' +
                '</div>';
            avisoBloqueo.classList.remove('oculto');

            var btnIr = document.getElementById('btnIrACotBloqueante');
            if (btnIr) {
                btnIr.onclick = function () { verDocumentoCotizacion(cotBloq.id); };
            }
            var btnDesc = document.getElementById('btnDescartarCotBloqueante');
            if (btnDesc) {
                btnDesc.onclick = function () {
                    mostrarModalConfirmacion('Descartar Cotización Abierta',
                        '¿Descartar la cotización ' + (cotBloq.correlativo || '') + '?',
                        function () { cancelarCotizacionDirecta(cotBloq.id); },
                        'Sí, descartar', 'Volver');
                };
            }
        }
        if (layout) layout.style.opacity = '0.45';
        if (navPasos) navPasos.style.pointerEvents = 'none';
        try { bloquearControlesCotizador(true); } catch (e) {}
        try { if (typeof hidratarIconos === 'function') hidratarIconos(); } catch (e2) {}
        return;
    }

    // CASO 3: Puede cotizar normalmente
    if (avisoBloqueo) avisoBloqueo.classList.add('oculto');
    if (layout) layout.style.opacity = '1';
    if (navPasos) navPasos.style.pointerEvents = 'auto';
    try { bloquearControlesCotizador(false); } catch (e) {}

    // PASO 3.1: Borrador recuperable
    try { verificarBorradorAsistenteGuardado(); } catch (eBorr) {
        console.warn('Error verificando borrador:', eBorr);
    }

    // PASO 3.2: Restaurar cantidades del borrador automáticamente
    try {
        if (sesionUsuario && typeof obtenerBorradorAsistente === 'function') {
            var borr = obtenerBorradorAsistente(sesionUsuario.id);
            if (borr && borr.cantidades && !cotizacionEnEdicion) {
                // Se aplicará DESPUÉS de renderizar el catálogo
            }
        }
    } catch (eBorr2) {}

    // PASO 3.3: Renderizar catálogo (crítico — NUNCA debe romper)
    try {
        renderizarCatalogoEnCotizador(true);
    } catch (eCat) {
        console.error('Error renderizando catálogo:', eCat);
        var cuerpoTabla = document.getElementById('cuerpoTablaCotizador');
        if (cuerpoTabla) {
            cuerpoTabla.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1rem;color:var(--color-peligro);">Error al cargar materiales. Abra la consola (F12) para detalles.</td></tr>';
        }
    }

    // PASO 3.4: Poblar ciudades (crítico)
    try { poblarCiudadesCotizador(); } catch (eCiud) {
        console.error('Error poblando ciudades:', eCiud);
    }

    // PASO 3.5: Poblar tasa BCV
    try { actualizarTasaEnCotizador(); } catch (eTasa) {
        console.error('Error actualizando tasa:', eTasa);
    }

    // PASO 3.6: Restaurar cantidades del borrador en los inputs
    try {
        if (sesionUsuario && typeof obtenerBorradorAsistente === 'function') {
            var borrR = obtenerBorradorAsistente(sesionUsuario.id);
            if (borrR && borrR.cantidades && !cotizacionEnEdicion) {
                for (var matId in borrR.cantidades) {
                    var inpR = document.getElementById('cant_mat_' + matId);
                    if (inpR) inpR.value = borrR.cantidades[matId];
                }
                if (borrR.nombreObra) {
                    var inpNR = document.getElementById('inputNombreObra');
                    if (inpNR && !inpNR.value) inpNR.value = borrR.nombreObra;
                }
                if (borrR.estadoObra) {
                    var selER = document.getElementById('selectEstadoObraCotizador');
                    if (selER && !selER.value) selER.value = borrR.estadoObra;
                }
            }
        }
    } catch (eRest) {}

    // PASO 3.7: Renderizar paso actual
    try { renderizarPasoCotizador(pasoCotizadorActual); } catch (ePaso) {
        console.error('Error renderizando paso:', ePaso);
    }

    // PASO 3.8: Actualizar total en vivo
    try { actualizarTotalEnVivo(); } catch (eTotal) {}

    // PASO 3.9: Hidratar iconos
    try { if (typeof hidratarIconos === 'function') hidratarIconos(); } catch (e3) {}
}

/**
 * Bloquea o desbloquea los campos del formulario del cotizador.
 */
function bloquearControlesCotizador(bloquear) {
    var inputs = document.querySelectorAll('#modulo-cotizador input, #modulo-cotizador select, #modulo-cotizador button');
    for (var i = 0; i < inputs.length; i++) {
        // No bloquear los botones dentro del aviso de bloqueo
        if (inputs[i].closest('#avisoCotizacionBloqueada')) continue;
        inputs[i].disabled = bloquear;
    }
}

/**
 * Cancela directamente una cotización abierta para desbloquear al usuario.
 */
function cancelarCotizacionDirecta(id) {
    var cotizaciones = obtenerCotizaciones();
    for (var i = 0; i < cotizaciones.length; i++) {
        if (cotizaciones[i].id === id) {
            cotizaciones[i].estado = 'CANCELADA';
            registrarEnBitacora(sesionUsuario.nombre, 'COTIZACION_CANCELADA', 'Cancelación para iniciar nueva: ' + cotizaciones[i].correlativo);
            break;
        }
    }
    guardarCotizaciones(cotizaciones);
    limpiarBorradorAsistente(sesionUsuario.id);
    limpiarFormularioCotizador();
    pasoCotizadorActual = 1;
    mostrarNotificacion('Cotización anterior descartada. El asistente está disponible.', 'exito');
    renderizarModuloCotizador();
}

/**
 * Comprueba si existe un borrador guardado en localStorage y muestra el banner para restaurarlo.
 */
function verificarBorradorAsistenteGuardado() {
    var banner = document.getElementById('bannerBorradorGuardado');
    var spanNombre = document.getElementById('nombreBorradorRecuperado');
    if (!banner || !sesionUsuario) return;

    var borrador = obtenerBorradorAsistente(sesionUsuario.id);
    if (borrador && borrador.nombreObra && !cotizacionEnEdicion) {
        if (spanNombre) spanNombre.textContent = borrador.nombreObra;
        banner.classList.remove('oculto');
    } else {
        banner.classList.add('oculto');
    }
}

/**
 * Restaura los datos del borrador automático en el formulario del asistente.
 */
function continuarBorradorGuardado() {
    var borrador = obtenerBorradorAsistente(sesionUsuario.id);
    if (!borrador) return;

    var inputNombre = document.getElementById('inputNombreObra');
    var selectEstado = document.getElementById('selectEstadoObraCotizador');
    var inputNotas = document.getElementById('inputNotasObra');
    var selectCiudad = document.getElementById('selectCiudadCotizador');
    var inputTasa = document.getElementById('inputTasaBCVCotizador');

    if (inputNombre && borrador.nombreObra) inputNombre.value = borrador.nombreObra;
    if (selectEstado && borrador.estadoObra) selectEstado.value = borrador.estadoObra;
    if (inputNotas && borrador.notas) inputNotas.value = borrador.notas;
    if (selectCiudad && borrador.ciudadCompra) selectCiudad.value = borrador.ciudadCompra;
    if (inputTasa && borrador.tasaBCV) inputTasa.value = borrador.tasaBCV;

    if (borrador.cantidades) {
        for (var matId in borrador.cantidades) {
            var inp = document.getElementById('cant_mat_' + matId);
            if (inp) inp.value = borrador.cantidades[matId];
        }
    }

    var banner = document.getElementById('bannerBorradorGuardado');
    if (banner) banner.classList.add('oculto');

    pasoCotizadorActual = borrador.pasoActual || 2;
    renderizarPasoCotizador(pasoCotizadorActual);
    actualizarTotalEnVivo();
    mostrarNotificacion('Borrador restaurado con éxito.', 'exito');
}

/**
 * Descarta el borrador guardado y reinicia los campos.
 */
function descartarBorradorGuardado() {
    limpiarBorradorAsistente(sesionUsuario.id);
    var banner = document.getElementById('bannerBorradorGuardado');
    if (banner) banner.classList.add('oculto');
    limpiarFormularioCotizador();
    pasoCotizadorActual = 1;
    renderizarPasoCotizador(1);
    actualizarTotalEnVivo();
    mostrarNotificacion('Borrador descartado. Formulario reiniciado.', 'info');
}

/**
 * Guarda el progreso actual del asistente en localStorage.
 */
function guardarBorradorActualEnStorage() {
    if (!sesionUsuario) return;

    var nombreObra = document.getElementById('inputNombreObra') ? document.getElementById('inputNombreObra').value.trim() : '';
    var estadoObra = document.getElementById('selectEstadoObraCotizador') ? document.getElementById('selectEstadoObraCotizador').value : sesionUsuario.estado;
    var notas = document.getElementById('inputNotasObra') ? document.getElementById('inputNotasObra').value.trim() : '';
    var ciudadCompra = document.getElementById('selectCiudadCotizador') ? document.getElementById('selectCiudadCotizador').value : '';
    var tasaBCV = parseFloat(document.getElementById('inputTasaBCVCotizador') ? document.getElementById('inputTasaBCVCotizador').value : obtenerTasaBCV()) || obtenerTasaBCV();
    if (isNaN(tasaBCV) || tasaBCV <= 100 || tasaBCV === 0.18 || tasaBCV === 36.50) {
        tasaBCV = 900.00;
    }

    var mapaCant = {};
    var inputs = document.querySelectorAll('#cuerpoTablaCotizador input.input-cantidad');
    var hayCantidades = false;
    for (var i = 0; i < inputs.length; i++) {
        var idMat = inputs[i].id.replace('cant_mat_', '');
        var val = inputs[i].value;
        if (val !== '' && parseFloat(val) > 0) {
            mapaCant[idMat] = val;
            hayCantidades = true;
        }
    }

    // Solo guardar si hay algún dato escrito
    if (nombreObra || hayCantidades) {
        var paqueteBorrador = {
            pasoActual: pasoCotizadorActual,
            nombreObra: nombreObra,
            estadoObra: estadoObra,
            notas: notas,
            ciudadCompra: ciudadCompra,
            tasaBCV: tasaBCV,
            cantidades: mapaCant,
            fechaGuardado: obtenerFechaActual()
        };
        guardarBorradorAsistente(sesionUsuario.id, paqueteBorrador);

        var indicator = document.getElementById('indicadorGuardadoBorrador');
        if (indicator) {
            indicator.textContent = '✓ Guardado';
            indicator.style.opacity = '1';
            setTimeout(function () { indicator.style.opacity = '0'; }, 2000);
        }
    }
}

/**
 * Renderiza la vista de un paso específico del asistente (1 a 4).
 * @param {number} paso - Número del paso a mostrar.
 */
function renderizarPasoCotizador(paso) {
    pasoCotizadorActual = paso;

    // Actualizar barra de progreso superior
    for (var i = 1; i <= 4; i++) {
        var navItem = document.getElementById('pasoNav' + i);
        var separador = document.getElementById('pasoSep' + i);
        var pantalla = document.getElementById('pasoCotizador' + i);

        if (navItem) {
            navItem.classList.remove('paso-item--activo', 'paso-item--completado');
            if (i === paso) {
                navItem.classList.add('paso-item--activo');
            } else if (i < paso) {
                navItem.classList.add('paso-item--completado');
            }
        }

        if (separador) {
            if (i < paso) {
                separador.classList.add('paso-separador--completado');
            } else {
                separador.classList.remove('paso-separador--completado');
            }
        }

        if (pantalla) {
            if (i === paso) {
                pantalla.classList.remove('oculto');
            } else {
                pantalla.classList.add('oculto');
            }
        }
    }

    // Botones de navegación inferior
    var btnAtras = document.getElementById('btnAtrasAsistente');
    var btnSiguiente = document.getElementById('btnSiguienteAsistente');

    if (btnAtras) {
        btnAtras.disabled = (paso === 1);
    }

    if (btnSiguiente) {
        if (paso === 4) {
            btnSiguiente.classList.add('oculto');
        } else {
            btnSiguiente.classList.remove('oculto');
            btnSiguiente.textContent = (paso === 3) ? 'Ir al Paso 4: Emitir ➡' : 'Siguiente ➡';
        }
    }

    // Acciones de renderizado específicas del paso
    if (paso === 3) {
        renderizarPaso3Revision();
    } else if (paso === 4) {
        renderizarPaso4Confirmacion();
    }

    try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
        window.scrollTo(0, 0);
    }
}

/**
 * Avanza al siguiente paso del asistente validando las reglas del paso actual.
 */
function avanzarPasoCotizador() {
    limpiarErrores('modulo-cotizador');

    if (pasoCotizadorActual === 1) {
        // Validar Paso 1: Nombre de la obra y estado
        var nombreObra = document.getElementById('inputNombreObra').value.trim();
        var estadoObra = document.getElementById('selectEstadoObraCotizador').value;
        var valPaso1 = validarPasoObra(nombreObra, estadoObra);

        if (!valPaso1.valido) {
            mostrarErrorCampo('inputNombreObra', valPaso1.error);
            mostrarNotificacion('Por favor complete el nombre de la obra antes de continuar.', 'advertencia');
            var campoError = document.getElementById('inputNombreObra');
            if (campoError) campoError.focus();
            return;
        }

        guardarBorradorActualEnStorage();
        renderizarPasoCotizador(2);

    } else if (pasoCotizadorActual === 2) {
        // Validar Paso 2: Materiales y cantidades
        var materiales = obtenerMateriales();
        var mapaCant = {};
        for (var i = 0; i < materiales.length; i++) {
            var m = materiales[i];
            var input = document.getElementById('cant_mat_' + m.id);
            if (input) {
                mapaCant[m.id] = input.value;
            }
        }

        var valCant = validarCantidadesCotizacion(materiales, mapaCant);
        if (!valCant.valido) {
            if (valCant.materialId) {
                mostrarErrorCampo('cant_mat_' + valCant.materialId, valCant.error);
                var inpErr = document.getElementById('cant_mat_' + valCant.materialId);
                if (inpErr) inpErr.focus();
            } else {
                mostrarNotificacion(valCant.error, 'error');
            }
            return;
        }

        // Construir el cálculo oficial con la lógica matemática pura
        var nombreCiudad = document.getElementById('selectCiudadCotizador').value;
        var ciudadSel = null;
        for (var j = 0; j < CIUDADES_BASE.length; j++) {
            if (CIUDADES_BASE[j].nombre === nombreCiudad) {
                ciudadSel = CIUDADES_BASE[j];
                break;
            }
        }
        if (!ciudadSel) ciudadSel = obtenerCiudadMasBarata(CIUDADES_BASE);

        var tasa = parseFloat(document.getElementById('inputTasaBCVCotizador').value) || obtenerTasaBCV();
        guardarTasaBCV(tasa);

        // Crear objeto de usuario simulado con el estado de obra elegido en el paso 1
        var estadoDestino = document.getElementById('selectEstadoObraCotizador').value || sesionUsuario.estado;
        var usuarioCotizacion = {
            id: sesionUsuario.id,
            nombre: sesionUsuario.nombre,
            perfil: sesionUsuario.perfil,
            estado: estadoDestino,
            limiteGasto: sesionUsuario.limiteGasto,
            gastado: sesionUsuario.gastado,
            comprometido: sesionUsuario.comprometido
        };

        var calculo = calcularPresupuestoCotizacion(valCant.items, ciudadSel, usuarioCotizacion, tasa);

        cotizacionEnEdicion = {
            id: Date.now(),
            correlativo: '(por asignar)',
            usuarioId: sesionUsuario.id,
            nombreCliente: sesionUsuario.nombre,
            perfil: sesionUsuario.perfil,
            nombreObra: document.getElementById('inputNombreObra').value.trim(),
            estadoObra: estadoDestino,
            notas: document.getElementById('inputNotasObra').value.trim(),
            ciudadCompra: calculo.ciudadCompra,
            factorCiudad: calculo.factorCiudad,
            factorFlete: calculo.factorFlete,
            descuentoPct: calculo.descuentoPct,
            fechaCreacion: obtenerFechaActual(),
            validezDias: DIAS_VIGENCIA_COTIZACION,
            estado: 'BORRADOR',
            items: calculo.items,
            subtotal: calculo.subtotal,
            flete: calculo.flete,
            descuento: calculo.descuento,
            neto: calculo.neto,
            contingencia: calculo.contingencia,
            iva: calculo.iva,
            total: calculo.total,
            tasaBCV: calculo.tasaBCV,
            totalBs: calculo.totalBs,
            motivoRechazo: ''
        };

        guardarBorradorActualEnStorage();
        renderizarPasoCotizador(3);

    } else if (pasoCotizadorActual === 3) {
        guardarBorradorActualEnStorage();
        renderizarPasoCotizador(4);
    }
}

/**
 * Retrocede al paso anterior conservando todos los datos ingresados.
 */
function retrocederPasoCotizador() {
    if (pasoCotizadorActual > 1) {
        limpiarErrores('modulo-cotizador');
        renderizarPasoCotizador(pasoCotizadorActual - 1);
    }
}

/**
 * Salto directo a un paso haciendo clic en la barra superior.
 * @param {number} pasoDestino - Paso al que desea ir (1 a 4).
 */
function irAPasoCotizador(pasoDestino) {
    if (pasoDestino < pasoCotizadorActual) {
        // Hacia atrás siempre se permite
        renderizarPasoCotizador(pasoDestino);
    } else if (pasoDestino === pasoCotizadorActual + 1) {
        // Hacia adelante se valida
        avanzarPasoCotizador();
    }
}

/**
 * Renderiza el contenido del catálogo en la tabla del Paso 2.
 */
function renderizarCatalogoEnCotizador(habilitado) {
    var cuerpo = document.getElementById('cuerpoTablaCotizador');
    if (!cuerpo) return;

    var thP = document.getElementById('thPrecioCotizador');
    if (thP) {
        thP.textContent = 'Precio Base (' + (typeof etiquetaMonedaActiva === 'function' ? etiquetaMonedaActiva() : 'USD') + ')';
    }

    var materiales = [];
    try { materiales = obtenerMateriales(); } catch (e) { materiales = []; }
    if (!Array.isArray(materiales) || materiales.length === 0) {
        cuerpo.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1rem;color:var(--color-peligro);">No hay materiales disponibles en el catálogo.</td></tr>';
        return;
    }

    cuerpo.innerHTML = '';
    for (var i = 0; i < materiales.length; i++) {
        var m = materiales[i];
        if (!m || !m.activo) continue;
        // Normalización defensiva de campos
        var nombreSeguro = typeof m.nombre === 'string' ? m.nombre : 'Material sin nombre';
        var sectorSeguro = typeof m.sector === 'string' ? m.sector : 'Construcción';
        var unidadSeguro = typeof m.unidad === 'string' ? m.unidad : 'Unidad';
        var precioSeguro = Number(m.precioBase) || 0;
        var sectorClase = sectorSeguro.toLowerCase()
            .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
            .replace(/ó/g, 'o').replace(/ú/g, 'u');

        var precioFormateado = (typeof monedaActiva === 'function')
            ? monedaActiva(precioSeguro)
            : ('$' + formatearMoneda(precioSeguro));

        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td><strong>' + escaparHtml(nombreSeguro) + '</strong></td>' +
            '<td><span class="badge-sector badge-sector--' + sectorClase + '">' + escaparHtml(sectorSeguro) + '</span></td>' +
            '<td>' + escaparHtml(unidadSeguro) + '</td>' +
            '<td>' + precioFormateado + '</td>' +
            '<td>' +
            '  <input type="number" id="cant_mat_' + m.id + '" min="0" step="1" placeholder="0" class="control-formulario input-cantidad" ' +
            (!habilitado ? 'disabled' : '') + '>' +
            '</td>';
        cuerpo.appendChild(tr);

        var inp = tr.querySelector('input');
        if (inp) {
            inp.addEventListener('input', function () {
                limpiarErrorCampo(this.id);
                actualizarTotalEnVivo();
                if (typeof programarGuardadoBorrador === 'function') {
                    programarGuardadoBorrador();
                }
            });
        }
    }

    if (typeof filtrarTablaCotizadorEnVivo === 'function') {
        filtrarTablaCotizadorEnVivo();
    }
}

/**
 * Filtra en vivo los materiales del Paso 2 del cotizador por término y sector.
 * Preserva las cantidades ingresadas modificando exclusivamente display.
 */
function filtrarTablaCotizadorEnVivo() {
    var buscador = document.getElementById('buscadorMaterialesCotizador');
    var selector = document.getElementById('filtroSectorCotizador');
    var termino = buscador ? buscador.value.toLowerCase().trim() : '';
    var sectorFiltro = selector ? selector.value : 'TODOS';

    var cuerpo = document.getElementById('cuerpoTablaCotizador');
    if (!cuerpo) return;
    var filas = cuerpo.querySelectorAll('tr');
    for (var i = 0; i < filas.length; i++) {
        var fila = filas[i];
        var colNombre = fila.querySelector('td:first-child');
        var colSector = fila.querySelector('td:nth-child(2)');
        var nombreTexto = colNombre ? colNombre.textContent.toLowerCase() : '';
        var sectorTexto = colSector ? colSector.textContent.trim() : '';

        var coincideTexto = !termino || nombreTexto.indexOf(termino) !== -1;
        var coincideSector = (sectorFiltro === 'TODOS') || (sectorTexto.indexOf(sectorFiltro) !== -1);

        if (coincideTexto && coincideSector) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    }
}
window.filtrarTablaCotizadorEnVivo = filtrarTablaCotizadorEnVivo;

/**
 * Llena el selector de ciudades de compra destacando la más económica.
 */
function poblarCiudadesCotizador() {
    var select = document.getElementById('selectCiudadCotizador');
    if (!select) return;

    var ciudades = CIUDADES_BASE;
    var ciudadMasBarata = obtenerCiudadMasBarata(ciudades);

    select.innerHTML = '';
    for (var i = 0; i < ciudades.length; i++) {
        var c = ciudades[i];
        var opt = document.createElement('option');
        opt.value = c.nombre;
        opt.textContent = c.nombre + ' (Factor ' + c.factor.toFixed(2) + ')' + (c.nombre === ciudadMasBarata.nombre ? ' ⭐ Recomendada' : '');
        if (c.nombre === ciudadMasBarata.nombre) {
            opt.selected = true;
        }
        select.appendChild(opt);
    }
}

/**
 * Pone la tasa oficial BCV actual en el cotizador.
 */
function actualizarTasaEnCotizador() {
    var input = document.getElementById('inputTasaBCVCotizador');
    var badgeFecha = document.getElementById('badgeFechaTasaBCV');
    var avisoDesact = document.getElementById('avisoTasaBCVDesactualizada');
    var info = obtenerInfoTasaBCV();
    if (!info.valor || info.valor <= 100 || info.valor === 0.18 || info.valor === 36.50) {
        info.valor = 900.00;
        guardarTasaBCV(900.00, info.fecha);
    }
    if (input) {
        input.value = info.valor.toFixed(2);
    }
    if (badgeFecha) {
        badgeFecha.textContent = 'Fijada: ' + info.fecha + ' (editable)';
    }
    if (avisoDesact) {
        var dias = calcularDiasTranscurridos(info.fecha);
        if (dias > 30) {
            avisoDesact.innerHTML = '🛑 <strong>Alerta Crítica:</strong> Tasa oficial BCV fijada hace ' + dias + ' días. Debe actualizar la tasa antes de formalizar.';
            avisoDesact.className = 'texto-advertencia-pequeno sv-font-sm sv-text-danger sv-mt-xs';
            avisoDesact.classList.remove('oculto');
        } else if (dias > 7) {
            avisoDesact.innerHTML = '⚠️ <strong>Aviso:</strong> Tasa fijada hace ' + dias + ' días. Revise la vigencia oficial antes de emitir.';
            avisoDesact.className = 'texto-advertencia-pequeno sv-font-sm sv-text-warning sv-mt-xs';
            avisoDesact.classList.remove('oculto');
        } else {
            avisoDesact.classList.add('oculto');
        }
    }
}

/**
 * Total en Vivo: Calcula y actualiza el panel lateral en tiempo real ante cualquier cambio de entrada.
 */
function actualizarTotalEnVivo() {
    var panel = document.getElementById('asistentePanelEnVivo');
    if (!panel) return;

    var materiales = obtenerMateriales();
    var mapaCant = {};
    var totalItems = 0;

    for (var i = 0; i < materiales.length; i++) {
        var m = materiales[i];
        var inp = document.getElementById('cant_mat_' + m.id);
        if (inp && inp.value !== '') {
            var valCheck = validarCampoCantidad(inp.value, m.nombre, m.permiteDecimales);
            if (valCheck.valido && valCheck.cantidad > 0) {
                mapaCant[m.id] = valCheck.cantidad;
                totalItems += valCheck.cantidad;
            }
        }
    }

    var badgeItems = document.getElementById('badgeItemsEnVivo');
    if (badgeItems) {
        badgeItems.textContent = totalItems + (totalItems === 1 ? ' unidad' : ' unidades');
    }

    // Ciudad seleccionada
    var selectCiudad = document.getElementById('selectCiudadCotizador');
    var nombreCiudad = selectCiudad ? selectCiudad.value : 'Puerto Ordaz';
    var ciudadSel = null;
    for (var j = 0; j < CIUDADES_BASE.length; j++) {
        if (CIUDADES_BASE[j].nombre === nombreCiudad) {
            ciudadSel = CIUDADES_BASE[j];
            break;
        }
    }
    if (!ciudadSel) ciudadSel = obtenerCiudadMasBarata(CIUDADES_BASE);

    // Estado seleccionado
    var selectEstado = document.getElementById('selectEstadoObraCotizador');
    var estadoDestino = selectEstado ? selectEstado.value : (sesionUsuario ? sesionUsuario.estado : 'Distrito Capital');

    // Tasa BCV
    var inputTasa = document.getElementById('inputTasaBCVCotizador');
    var tasa = inputTasa ? (parseFloat(inputTasa.value) || obtenerTasaBCV()) : obtenerTasaBCV();
    if (isNaN(tasa) || tasa <= 100 || tasa === 0.18 || tasa === 36.50) {
        tasa = 900.00;
        if (inputTasa) inputTasa.value = '900.00';
    }

    var usuarioSim = {
        perfil: sesionUsuario ? sesionUsuario.perfil : 'Constructor',
        estado: estadoDestino
    };

    var itemsValidados = [];
    for (var matId in mapaCant) {
        for (var k = 0; k < materiales.length; k++) {
            if (materiales[k].id === parseInt(matId)) {
                itemsValidados.push({
                    materialId: materiales[k].id,
                    nombre: materiales[k].nombre,
                    sector: materiales[k].sector,
                    unidad: materiales[k].unidad,
                    precioBase: materiales[k].precioBase,
                    cantidad: mapaCant[matId]
                });
                break;
            }
        }
    }

    var calc = calcularPresupuestoCotizacion(itemsValidados, ciudadSel, usuarioSim, tasa);

    var elSubtotal = document.getElementById('vivoSubtotal');
    var elFlete = document.getElementById('vivoFlete');
    var elDescuento = document.getElementById('vivoDescuento');
    var elContingencia = document.getElementById('vivoContingencia');
    var elIVA = document.getElementById('vivoIVA');
    var elTotalUSD = document.getElementById('vivoTotalUSD');
    var elTotalBs = document.getElementById('vivoTotalBs');

    if (elSubtotal) elSubtotal.textContent = usd(calc.subtotal);
    if (elFlete) elFlete.textContent = usd(calc.flete);
    if (elDescuento) elDescuento.textContent = usd(-calc.descuento);
    if (elContingencia) elContingencia.textContent = usd(calc.contingencia);
    if (elIVA) elIVA.textContent = usd(calc.iva);
    if (elTotalUSD) elTotalUSD.textContent = usd(calc.total);
    if (elTotalBs) elTotalBs.textContent = bs(calc.totalBs);
}

/**
 * Aplica una plantilla de obra precargada al formulario de materiales.
 * @param {string} clavePlantilla - Clave en PLANTILLAS_OBRA (ej: 'casa_pequena').
 */
function aplicarPlantillaObra(clavePlantilla) {
    var plantilla = null;
    try {
        plantilla = PLANTILLAS_OBRA[clavePlantilla];
    } catch (e) {}
    if (!plantilla || !plantilla.cantidades) {
        mostrarNotificacion('Plantilla no disponible: ' + (clavePlantilla || 'desconocida'), 'error');
        return;
    }

    // Verificar cantidades existentes
    var yaTieneCantidades = false;
    var inputs = document.querySelectorAll('#cuerpoTablaCotizador input.input-cantidad');
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].value !== '' && parseFloat(inputs[i].value) > 0) {
            yaTieneCantidades = true;
            break;
        }
    }

    function cargarValores(sumar) {
        var cargados = 0;
        var faltantes = 0;
        for (var matId in plantilla.cantidades) {
            if (!plantilla.cantidades.hasOwnProperty(matId)) continue;
            var inp = document.getElementById('cant_mat_' + matId);
            if (inp) {
                var cant = sumar ? (parseFloat(inp.value) || 0) : 0;
                inp.value = cant + plantilla.cantidades[matId];
                cargados++;
            } else {
                faltantes++;
            }
        }
        var inpNombre = document.getElementById('inputNombreObra');
        if (inpNombre && !inpNombre.value.trim()) {
            inpNombre.value = (plantilla.nombre || 'Obra') + ' - ' + (sesionUsuario ? sesionUsuario.estado : '');
        }
        try { actualizarTotalEnVivo(); } catch (e) {}
        try { if (typeof guardarBorradorActualEnStorage === 'function') guardarBorradorActualEnStorage(); } catch (e) {}

        if (cargados === 0) {
            mostrarNotificacion('No se pudo cargar la plantilla (IDs no coinciden). Contacte al administrador.', 'error');
        } else {
            var msg = 'Plantilla cargada: ' + (plantilla.nombre || clavePlantilla);
            if (faltantes > 0) msg += ' (' + faltantes + ' material(es) no disponibles)';
            mostrarNotificacion(msg, 'exito');
        }
    }

    if (yaTieneCantidades) {
        var detalleMsg = 'Ya existen cantidades cargadas.\n\n' +
            'Supuestos técnicos: ' + (plantilla.supuestos || plantilla.descripcion || '') + '\n\n' +
            '¿Reemplazar o sumar cantidades?';
        mostrarModalConfirmacion('Plantilla: ' + (plantilla.nombre || clavePlantilla), detalleMsg,
            function () { cargarValores(false); }, 'Reemplazar', 'Cancelar');
    } else {
        cargarValores(false);
    }
}

/**
 * Renderiza la pantalla del Paso 3 (Revisión Detallada).
 */
function renderizarPaso3Revision() {
    if (!cotizacionEnEdicion) return;

    var resumenObra = document.getElementById('resumenObraPaso3');
    var cuerpoTabla = document.getElementById('cuerpoTablaPaso3');
    var contenedorDesglose = document.getElementById('contenedorDesgloseCotizacionPaso3');

    // 1. Cabecera con datos de la obra
    if (resumenObra) {
        resumenObra.innerHTML =
            '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.75rem;">' +
            '  <div><strong>Proyecto:</strong> ' + escaparHtml(cotizacionEnEdicion.nombreObra) + '</div>' +
            '  <div><strong>Destino:</strong> Estado ' + escaparHtml(cotizacionEnEdicion.estadoObra) + '</div>' +
            '  <div><strong>Ciudad Proveedora:</strong> ' + escaparHtml(cotizacionEnEdicion.ciudadCompra) + ' (Factor ' + cotizacionEnEdicion.factorCiudad.toFixed(2) + ')</div>' +
            '  <div><strong>Solicitante:</strong> ' + escaparHtml(cotizacionEnEdicion.nombreCliente) + ' (' + escaparHtml(cotizacionEnEdicion.perfil) + ')</div>' +
            (cotizacionEnEdicion.notas ? '  <div style="grid-column:1/-1;"><strong>Notas:</strong> ' + escaparHtml(cotizacionEnEdicion.notas) + '</div>' : '') +
            '</div>';
    }

    // 2. Tabla de materiales calculados
    if (cuerpoTabla) {
        cuerpoTabla.innerHTML = '';
        for (var i = 0; i < cotizacionEnEdicion.items.length; i++) {
            var it = cotizacionEnEdicion.items[i];
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td><strong>' + escaparHtml(it.nombre) + '</strong></td>' +
                '<td>' + it.cantidad + '</td>' +
                '<td>' + escaparHtml(it.unidad) + '</td>' +
                '<td>' + usd(it.precioUnitario) + '</td>' +
                '<td>' + usd(it.total) + '</td>';
            cuerpoTabla.appendChild(tr);
        }
    }

    // 3. Desglose financiero
    if (contenedorDesglose) {
        var html = '<div class="desglose">';
        html += '<div class="desglose__linea desglose__linea--subtotal">' +
            '<span>Subtotal Materiales (Factor ' + cotizacionEnEdicion.factorCiudad.toFixed(2) + ')</span>' +
            '<span>' + usd(cotizacionEnEdicion.subtotal) + '</span>' +
            '</div>';

        html += '<div class="desglose__linea">' +
            '<span>Flete Terrestre (Factor Estado ' + cotizacionEnEdicion.factorFlete.toFixed(2) + ')</span>' +
            '<span>' + usd(cotizacionEnEdicion.flete) + '</span>' +
            '</div>';

        if (cotizacionEnEdicion.descuento > 0) {
            html += '<div class="desglose__linea">' +
                '<span>Descuento Perfil ' + escaparHtml(cotizacionEnEdicion.perfil) + ' (' + (cotizacionEnEdicion.descuentoPct * 100).toFixed(0) + '%)</span>' +
                '<span style="color:var(--color-exito);">' + usd(-cotizacionEnEdicion.descuento) + '</span>' +
                '</div>';
        }

        html += '<div class="desglose__linea desglose__linea--subtotal">' +
            '<span>Monto Neto Imponible</span>' +
            '<span>' + usd(cotizacionEnEdicion.neto) + '</span>' +
            '</div>';

        html += '<div class="desglose__linea">' +
            '<span>Fondo de Contingencia de Obra (5%)</span>' +
            '<span>' + usd(cotizacionEnEdicion.contingencia) + '</span>' +
            '</div>';

        html += '<div class="desglose__linea">' +
            '<span>I.V.A. Ley 16% sobre (Neto + Contingencia)</span>' +
            '<span>' + usd(cotizacionEnEdicion.iva) + '</span>' +
            '</div>';

        html += '<div class="desglose__linea desglose__linea--total">' +
            '<span>TOTAL GENERAL (USD)</span>' +
            '<span>' + usd(cotizacionEnEdicion.total) + '</span>' +
            '</div>';

        html += '<div class="desglose__linea desglose__linea--total" style="color:var(--color-exito); border-top:1px dashed var(--color-borde);">' +
            '<span>EQUIVALENTE EN BOLÍVARES (Tasa ' + cotizacionEnEdicion.tasaBCV.toFixed(2) + ')</span>' +
            '<span>' + bs(cotizacionEnEdicion.totalBs) + '</span>' +
            '</div>';

        html += '</div>';
        contenedorDesglose.innerHTML = html;
    }
}

/**
 * Renderiza la pantalla del Paso 4 (Envío y Acciones).
 */
function renderizarPaso4Confirmacion() {
    if (!cotizacionEnEdicion) return;

    var tarjeta = document.getElementById('tarjetaResumenEnvio');
    if (!tarjeta) return;

    var numMostrar = cotizacionEnEdicion.correlativo === '(por asignar)'
        ? 'COT-XXX (se asignará al guardar)'
        : cotizacionEnEdicion.correlativo;

    tarjeta.innerHTML =
        '<div style="background:var(--color-fondo); border:1px solid var(--color-borde); border-radius:var(--radio-md); padding:1.25rem; margin-bottom:1.5rem; text-align:left;">' +
        '  <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--color-borde); padding-bottom:0.75rem; margin-bottom:0.75rem;">' +
        '    <span style="font-size:1.1rem; font-weight:700;">' + escaparHtml(numMostrar) + '</span>' +
        '    <span class="badge-semaforo badge-semaforo--verde">Lista para emitir</span>' +
        '  </div>' +
        '  <div><strong>Obra:</strong> ' + escaparHtml(cotizacionEnEdicion.nombreObra) + ' (' + escaparHtml(cotizacionEnEdicion.estadoObra) + ')</div>' +
        '  <div><strong>Partidas:</strong> ' + cotizacionEnEdicion.items.length + ' materiales requeridos</div>' +
        '  <div style="font-size:1.3rem; font-weight:800; color:var(--color-acento); margin-top:0.75rem;">Total: ' + usd(cotizacionEnEdicion.total) + '</div>' +
        '  <div style="font-size:1.1rem; font-weight:700; color:var(--color-exito);">' + bs(cotizacionEnEdicion.totalBs) + ' (Tasa ' + cotizacionEnEdicion.tasaBCV.toFixed(2) + ')</div>' +
        '</div>';
}

/**
 * Guarda formalmente la cotización como BORRADOR o ENVIADA y limpia el borrador automático.
 * @param {string} estadoDestino - 'BORRADOR' o 'ENVIADA'.
 */
function guardarCotizacionComo(estadoDestino) {
    if (!cotizacionEnEdicion) return;

    if (cotizacionEnEdicion.correlativo === '(por asignar)') {
        cotizacionEnEdicion.correlativo = generarSiguienteCorrelativo();
    }
    cotizacionEnEdicion.estado = estadoDestino;

    var cotizaciones = obtenerCotizaciones();
    cotizaciones.unshift(cotizacionEnEdicion);
    guardarCotizaciones(cotizaciones);

    // Limpiar el borrador temporal guardado en localStorage
    limpiarBorradorAsistente(sesionUsuario.id);

    registrarEnBitacora(
        sesionUsuario.nombre,
        estadoDestino === 'BORRADOR' ? 'COTIZACION_BORRADOR' : 'COTIZACION_ENVIADA',
        'Cotización ' + cotizacionEnEdicion.correlativo + ' guardada como ' + estadoDestino + ' por ' + usd(cotizacionEnEdicion.total)
    );

    mostrarNotificacion('Cotización ' + cotizacionEnEdicion.correlativo + ' registrada con estado "' + estadoDestino + '".', 'exito');

    limpiarFormularioCotizador();
    pasoCotizadorActual = 1;
    renderizarModuloCotizador();
}

/**
 * Descarta la cotización en curso con confirmación.
 */
function cancelarCotizacionEnEdicion() {
    mostrarModalConfirmacion(
        'Descartar Cotización',
        '¿Desea descartar la cotización actual? Se perderán las cantidades y datos ingresados.',
        function () {
            limpiarBorradorAsistente(sesionUsuario.id);
            cotizacionEnEdicion = null;
            limpiarFormularioCotizador();
            pasoCotizadorActual = 1;
            renderizarModuloCotizador();
            mostrarNotificacion('Cotización descartada.', 'info');
        },
        'Sí, descartar',
        'Volver'
    );
}

/**
 * Limpia los campos del formulario de cotizador.
 */
function limpiarFormularioCotizador() {
    var inputs = document.querySelectorAll('#cuerpoTablaCotizador input.input-cantidad');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].value = '';
    }
    var inpNombre = document.getElementById('inputNombreObra');
    var inpNotas = document.getElementById('inputNotasObra');
    if (inpNombre) inpNombre.value = '';
    if (inpNotas) inpNotas.value = '';

    cotizacionEnEdicion = null;
    actualizarTotalEnVivo();
}

// ============================================================
// 9. MODAL PEDAGÓGICO: ¿CÓMO SE CALCULÓ ESTO?
// ============================================================

/**
 * Abre el modal pedagógico explicando cada paso matemático con números reales.
 * @param {Object} [cot] - Objeto de cotización a explicar (por defecto la cotización en edición).
 */
function abrirModalComoSeCalculo(cot) {
    var objetivo = cot || cotizacionEnEdicion;
    if (!objetivo) return;

    var modal = document.getElementById('modalComoSeCalculo');
    var contenedor = document.getElementById('contenedorPasosPedagogicos');
    if (!modal || !contenedor) return;

    var pasos = desglosarPasosCalculoPedagogico(objetivo);
    if (!pasos || !pasos.length) return;

    var html = '';
    for (var i = 0; i < pasos.length; i++) {
        var p = pasos[i];
        html += '<div class="tarjeta-paso-pedagogico">' +
            '<div class="tarjeta-paso-pedagogico__encabezado">' +
                '<span class="tarjeta-paso-pedagogico__numero">' + p.paso + '</span>' +
                '<strong class="tarjeta-paso-pedagogico__titulo">' + escaparHtml(p.titulo) + '</strong>' +
            '</div>' +
            '<div class="tarjeta-paso-pedagogico__formula"><code>' + escaparHtml(p.formula) + '</code></div>' +
            '<div class="tarjeta-paso-pedagogico__detalle">' + escaparHtml(p.detalle) + '</div>' +
            '<div class="tarjeta-paso-pedagogico__resultado"><strong>Resultado:</strong> ' + escaparHtml(p.resultado) + '</div>' +
        '</div>';
    }

    contenedor.innerHTML = html;
    modal.classList.remove('oculto');
    enfocarPrimerElementoModal(modal);
}

/**
 * Cierra el modal pedagógico.
 */
function cerrarModalComoSeCalculo() {
    var modal = document.getElementById('modalComoSeCalculo');
    if (modal) modal.classList.add('oculto');
}

// ============================================================
// 10. MÓDULO: DÓNDE CONVIENE COMPRAR (ALGORITMO BURBUJA MANUAL)
// ============================================================

function renderizarModuloCiudades() {
    var cuerpo = document.getElementById('cuerpoTablaCiudades');
    if (!cuerpo) return;

    // Ordenar con algoritmo burbuja manual (sin usar sort)
    var ciudadesOrdenadas = ordenarBurbuja(CIUDADES_BASE, 'factor', true);

    cuerpo.innerHTML = '';
    for (var i = 0; i < ciudadesOrdenadas.length; i++) {
        var c = ciudadesOrdenadas[i];
        var esMejor = (i === 0);

        var tr = document.createElement('tr');
        if (esMejor) {
            tr.className = 'fila-mejor';
        }

        tr.innerHTML =
            '<td><strong>#' + (i + 1) + '</strong></td>' +
            '<td>' + c.nombre + '</td>' +
            '<td>' + c.factor.toFixed(2) + '</td>' +
            '<td>' + (esMejor ? '<span class="badge-exito">⭐ Más Económica (Opción recomendada)</span>' : 'Estándar') + '</td>';
        cuerpo.appendChild(tr);
    }
}

// ============================================================
// 11. MÓDULO: CATÁLOGO EDITABLE (SOLO GOBERNACIÓN)
// ============================================================

function renderizarModuloCatalogo() {
    var cuerpo = document.getElementById('cuerpoTablaCatalogo');
    if (!cuerpo) return;

    var inputBusqueda = document.getElementById('buscadorCatalogo');
    var termino = inputBusqueda ? inputBusqueda.value.toLowerCase().trim() : '';

    var materiales = obtenerMateriales();
    cuerpo.innerHTML = '';

    for (var i = 0; i < materiales.length; i++) {
        var m = materiales[i];
        if (termino && m.nombre.toLowerCase().indexOf(termino) === -1 && m.sector.toLowerCase().indexOf(termino) === -1) {
            continue;
        }
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + m.id + '</td>' +
            '<td><strong>' + escaparHtml(m.nombre) + '</strong></td>' +
            '<td><span class="badge-sector badge-sector--' + m.sector.toLowerCase() + '">' + escaparHtml(m.sector) + '</span></td>' +
            '<td>' + escaparHtml(m.unidad) + '</td>' +
            '<td>' + usd(m.precioBase) + '</td>' +
            '<td>' + (m.activo ? '<span class="badge-exito">Activo</span>' : '<span class="badge-peligro">Inactivo</span>') + '</td>' +
            '<td>' +
            '<button class="boton boton--secundario boton--sm" onclick="abrirModalEditarMaterial(' + m.id + ')">' + icono('editar', 14) + ' Editar</button> ' +
            '<button class="boton boton--secundario boton--sm" onclick="verHistorialPreciosMaterial(' + m.id + ')">' + icono('historial', 14) + ' Historial</button> ' +
            '<button class="boton ' + (m.activo ? 'boton--peligro' : 'boton--exito') + ' boton--sm" onclick="alternarActivoMaterial(' + m.id + ')">' +
            (m.activo ? 'Desactivar' : 'Activar') + '</button>' +
            '</td>';
        cuerpo.appendChild(tr);
    }
}

function abrirModalNuevoMaterial() {
    materialEnEdicionId = null;
    limpiarErrores('modalMaterial');
    document.getElementById('modalMaterialTitulo').textContent = 'Registrar Nuevo Material';
    document.getElementById('matNombre').value = '';
    document.getElementById('matSector').value = 'Construcción';
    document.getElementById('matUnidad').value = '';
    document.getElementById('matPrecio').value = '';
    document.getElementById('matPeso').value = '';

    var modal = document.getElementById('modalMaterial');
    modal.classList.remove('oculto');
    enfocarPrimerElementoModal(modal);
}

function abrirModalEditarMaterial(id) {
    var materiales = obtenerMateriales();
    var mat = null;
    for (var i = 0; i < materiales.length; i++) {
        if (materiales[i].id === id) {
            mat = materiales[i];
            break;
        }
    }
    if (!mat) return;

    materialEnEdicionId = id;
    limpiarErrores('modalMaterial');
    document.getElementById('modalMaterialTitulo').textContent = 'Editar Material: ' + mat.nombre;
    document.getElementById('matNombre').value = mat.nombre;
    document.getElementById('matSector').value = mat.sector;
    document.getElementById('matUnidad').value = mat.unidad;
    document.getElementById('matPrecio').value = mat.precioBase;
    document.getElementById('matPeso').value = mat.pesoKg || '';

    var modal = document.getElementById('modalMaterial');
    modal.classList.remove('oculto');
    enfocarPrimerElementoModal(modal);
}

function cerrarModalMaterial() {
    document.getElementById('modalMaterial').classList.add('oculto');
}

function guardarMaterialDesdeModal() {
    limpiarErrores('modalMaterial');
    var nombre = document.getElementById('matNombre').value.trim();
    var sector = document.getElementById('matSector').value;
    var unidad = document.getElementById('matUnidad').value.trim();
    var precio = parseFloat(document.getElementById('matPrecio').value);
    var peso = parseFloat(document.getElementById('matPeso').value) || 0;

    var matObj = {
        nombre: nombre,
        sector: sector,
        unidad: unidad,
        precioBase: precio,
        pesoKg: peso
    };

    var materiales = obtenerMateriales();
    var validacion = validarMaterialCatalogo(matObj, materiales, materialEnEdicionId);
    if (!validacion.valido) {
        if (!nombre || nombre.length < 3 || validacion.error.indexOf('nombre') !== -1) {
            mostrarErrorCampo('matNombre', validacion.error);
        } else if (isNaN(precio) || precio <= 0 || validacion.error.indexOf('precio') !== -1) {
            mostrarErrorCampo('matPrecio', validacion.error);
        } else if (!unidad || validacion.error.indexOf('unidad') !== -1) {
            mostrarErrorCampo('matUnidad', validacion.error);
        }
        mostrarNotificacion(validacion.error, 'error');
        return;
    }

    if (materialEnEdicionId === null) {
        var nuevoId = 1;
        for (var i = 0; i < materiales.length; i++) {
            if (materiales[i].id >= nuevoId) nuevoId = materiales[i].id + 1;
        }
        matObj.id = nuevoId;
        matObj.activo = true;
        matObj.historialPrecios = [
            { fecha: obtenerFechaActual(), precioAnterior: 0, precioNuevo: precio, usuario: sesionUsuario.nombre }
        ];
        materiales.push(matObj);
        registrarEnBitacora(sesionUsuario.nombre, 'MATERIAL_CREADO', 'Nuevo material "' + nombre + '" a $' + formatearMoneda(precio));
    } else {
        for (var j = 0; j < materiales.length; j++) {
            if (materiales[j].id === materialEnEdicionId) {
                var precioViejo = materiales[j].precioBase;
                materiales[j].nombre = nombre;
                materiales[j].sector = sector;
                materiales[j].unidad = unidad;
                materiales[j].pesoKg = peso;

                if (precioViejo !== precio) {
                    if (!Array.isArray(materiales[j].historialPrecios)) {
                        materiales[j].historialPrecios = [];
                    }
                    materiales[j].historialPrecios.unshift({
                        fecha: obtenerFechaActual(),
                        precioAnterior: precioViejo,
                        precioNuevo: precio,
                        usuario: sesionUsuario.nombre
                    });
                    materiales[j].precioBase = precio;
                    registrarEnBitacora(sesionUsuario.nombre, 'PRECIO_MODIFICADO', 'Cambio de precio en "' + nombre + '" de $' + formatearMoneda(precioViejo) + ' a $' + formatearMoneda(precio));
                }
                break;
            }
        }
    }

    guardarMateriales(materiales);
    cerrarModalMaterial();
    renderizarModuloCatalogo();
    mostrarNotificacion('Material guardado con éxito.', 'exito');
}

function alternarActivoMaterial(id) {
    var materiales = obtenerMateriales();
    for (var i = 0; i < materiales.length; i++) {
        if (materiales[i].id === id) {
            materiales[i].activo = !materiales[i].activo;
            registrarEnBitacora(
                sesionUsuario.nombre,
                materiales[i].activo ? 'MATERIAL_ACTIVADO' : 'MATERIAL_DESACTIVADO',
                'Material "' + materiales[i].nombre + '" marcado como ' + (materiales[i].activo ? 'activo' : 'inactivo')
            );
            break;
        }
    }
    guardarMateriales(materiales);
    renderizarModuloCatalogo();
}

function verHistorialPreciosMaterial(id) {
    var materiales = obtenerMateriales();
    var mat = null;
    for (var i = 0; i < materiales.length; i++) {
        if (materiales[i].id === id) {
            mat = materiales[i];
            break;
        }
    }
    if (!mat) return;

    var html = '<div class="tabla-contenedor" style="margin-top:0.5rem;">';
    if (!mat.historialPrecios || mat.historialPrecios.length === 0) {
        html += '<p style="color:var(--color-texto-secundario); padding:1rem;">No existen cambios de precio registrados para este material.</p>';
    } else {
        html += '<table class="tabla-datos" style="width:100%;">' +
            '<thead>' +
                '<tr>' +
                    '<th>Fecha</th>' +
                    '<th>Precio Ant.</th>' +
                    '<th>Precio Nuevo</th>' +
                    '<th>Registrado Por</th>' +
                    '<th>Motivo</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody>';
        for (var j = 0; j < mat.historialPrecios.length; j++) {
            var h = mat.historialPrecios[j];
            html += '<tr>' +
                '<td>' + escaparHtml(h.fecha || '-') + '</td>' +
                '<td>$' + formatearMoneda(h.precioAnterior || 0) + '</td>' +
                '<td><strong>$' + formatearMoneda(h.precioNuevo || 0) + '</strong></td>' +
                '<td>' + escaparHtml(h.usuario || '-') + '</td>' +
                '<td>' + escaparHtml(h.motivo || 'Ajuste de catálogo') + '</td>' +
            '</tr>';
        }
        html += '</tbody></table>';
    }
    html += '</div>';

    mostrarModalConfirmacion('Historial de Precios — ' + escaparHtml(mat.nombre), html, null, 'Cerrar', '', true);
}

// ============================================================
// 12. MÓDULO: APROBACIONES Y CONTROL DE FONDOS
// ============================================================

function renderizarModuloAprobaciones() {
    try {
        var cuerpoEnviadas = document.getElementById('cuerpoTablaAprobaciones');
        var cuerpoAprobadas = document.getElementById('cuerpoTablaParaEntrega');
        if (!cuerpoEnviadas) return;

        var cotizaciones = obtenerCotizaciones();
        var usuarios = obtenerUsuarios();
        var tasa = (typeof obtenerTasaBCV === 'function') ? obtenerTasaBCV() : 900;

        cuerpoEnviadas.innerHTML = '';
        var contadorEnviadas = 0;

        for (var i = 0; i < cotizaciones.length; i++) {
            var c = cotizaciones[i];
            if (c.estado === 'ENVIADA') {
                contadorEnviadas++;
                var uSol = null;
                for (var u = 0; u < usuarios.length; u++) {
                    if (usuarios[u].id === c.usuarioId) { uSol = usuarios[u]; break; }
                }
                var evaluacion = uSol ? evaluarAprobacionCotizacion(c, uSol)
                    : { aprobable: false, faltante: 0 };
                var moraSol = (typeof evaluarMoraUsuario === 'function' && uSol) ?
                    evaluarMoraUsuario(uSol.id) : { tieneMora: false };

                var dispBadge = '';
                if (moraSol && moraSol.tieneMora) {
                    dispBadge = '<span class="badge-peligro" title="Solicitante en mora activa">Bloqueado por Mora</span>';
                } else if (!evaluacion.aprobable) {
                    dispBadge = '<span class="badge-peligro">Déficit: ' + monedaActiva(evaluacion.faltante) + '</span>';
                } else {
                    dispBadge = '<span class="badge-exito">Fondos Suficientes</span>';
                }

                // Generar selector de plan de financiamiento
                var planAct = c.tipoPlanFinanciamiento || c.planFinanciamientoId || 'cashea_3';
                var selectPlanHtml = '<select id="selectPlanAprob_' + c.id + '" class="control-formulario" style="font-size:0.78rem; padding:0.25rem 0.4rem; min-width:140px;">';
                if (typeof PLANES_FINANCIAMIENTO !== 'undefined') {
                    for (var pKey in PLANES_FINANCIAMIENTO) {
                        if (PLANES_FINANCIAMIENTO.hasOwnProperty(pKey)) {
                            var selAttr = (pKey === planAct) ? ' selected' : '';
                            selectPlanHtml += '<option value="' + pKey + '"' + selAttr + '>' + escaparHtml(PLANES_FINANCIAMIENTO[pKey].nombre) + '</option>';
                        }
                    }
                } else {
                    selectPlanHtml += '<option value="contado">Contado</option><option value="cashea_3" selected>Cashea 3 Cuotas</option><option value="cashea_6">Cashea 6 Cuotas</option>';
                }
                selectPlanHtml += '</select>';

                var esAutoAprobacion = (sesionUsuario && c.usuarioId === sesionUsuario.id);
                var puedeAprobar = evaluacion.aprobable && (!moraSol || !moraSol.tieneMora) && !esAutoAprobacion;
                var tooltipAprob = esAutoAprobacion ? 'No puede auto-aprobarse' :
                    ((moraSol && moraSol.tieneMora) ? 'Solicitante con cuotas en mora activa' :
                    (!evaluacion.aprobable ? 'Fondos presupuestarios insuficientes' : 'Aprobar cotización'));

                var tr = document.createElement('tr');
                tr.innerHTML =
                    '<td><strong>' + escaparHtml(c.correlativo) + '</strong>' +
                    (c.nombreObra ? '<br><small class="texto-secundario">' + escaparHtml(c.nombreObra) + '</small>' : '') + '</td>' +
                    '<td>' + escaparHtml(c.fechaCreacion) + '</td>' +
                    '<td><strong>' + escaparHtml(c.nombreCliente) + '</strong> <span class="badge-sector" style="font-size:0.7rem;">' + escaparHtml(c.perfil || '') + '</span></td>' +
                    '<td><strong>' + monedaActiva(c.totalUSD || c.total) + '</strong></td>' +
                    '<td>' + dispBadge + '</td>' +
                    '<td>' + selectPlanHtml + '</td>' +
                    '<td>' +
                    '<button type="button" class="boton boton--exito boton--sm" ' +
                    (!puedeAprobar ? 'disabled title="' + escaparHtml(tooltipAprob) + '" ' : 'title="' + escaparHtml(tooltipAprob) + '" ') +
                    'onclick="procesarAprobacionFila(' + c.id + ')">' +
                    icono('check', 14) + ' Aprobar</button> ' +
                    '<button type="button" class="boton boton--peligro boton--sm" onclick="procesarAprobacion(' + c.id + ', false)">' +
                    icono('cerrar', 14) + ' Rechazar</button> ' +
                    '<button type="button" class="boton boton--secundario boton--sm" onclick="verDocumentoCotizacion(' + c.id + ')">' +
                    icono('ojo', 14) + ' Ver</button>' +
                    '</td>';
                cuerpoEnviadas.appendChild(tr);
            }
        }
        if (contadorEnviadas === 0) {
            cuerpoEnviadas.innerHTML = '<tr><td colspan="7"><div class="estado-vacio">' +
                '<div class="estado-vacio__icono">' + icono('correo', 36) + '</div>' +
                '<div class="estado-vacio__titulo">No hay cotizaciones pendientes</div>' +
                '<div class="estado-vacio__descripcion">Todas las solicitudes han sido procesadas.</div>' +
                '</div></td></tr>';
        }

        if (cuerpoAprobadas) {
            cuerpoAprobadas.innerHTML = '';
            var contA = 0;
            for (var j = 0; j < cotizaciones.length; j++) {
                var ca = cotizaciones[j];
                if (ca.estado === 'APROBADA') {
                    contA++;
                    var tra = document.createElement('tr');
                    tra.innerHTML =
                        '<td><strong>' + escaparHtml(ca.correlativo) + '</strong>' +
                        (ca.nombreObra ? '<br><small class="texto-secundario">' + escaparHtml(ca.nombreObra) + '</small>' : '') + '</td>' +
                        '<td>' + escaparHtml(ca.nombreCliente) + ' (' + escaparHtml(ca.perfil) + ')</td>' +
                        '<td><strong>' + monedaActiva(ca.totalUSD || ca.total) + '</strong></td>' +
                        '<td><span class="badge-exito">FONDOS COMPROMETIDOS</span></td>' +
                        '<td>' +
                        '<button type="button" class="boton boton--primario boton--sm" onclick="marcarComoEntregada(' + ca.id + ')">' +
                        icono('camion', 14) + ' Marcar Entregada</button> ' +
                        '<button type="button" class="boton boton--secundario boton--sm" onclick="verDocumentoCotizacion(' + ca.id + ')">' +
                        icono('ojo', 14) + ' Ver</button>' +
                        '</td>';
                    cuerpoAprobadas.appendChild(tra);
                }
            }
            if (contA === 0) {
                cuerpoAprobadas.innerHTML = '<tr><td colspan="5"><div class="estado-vacio">' +
                    '<div class="estado-vacio__icono">' + icono('camion', 36) + '</div>' +
                    '<div class="estado-vacio__titulo">No hay obras para entrega</div>' +
                    '<div class="estado-vacio__descripcion">Las aprobadas pendientes aparecerán aquí.</div>' +
                    '</div></td></tr>';
            }
        }
    } catch (e) {
        console.error('Error en renderizarModuloAprobaciones:', e);
        var cuerpo2 = document.getElementById('cuerpoTablaAprobaciones');
        if (cuerpo2) {
            cuerpo2.innerHTML = '<tr><td colspan="7" style="color:var(--color-peligro);padding:1rem;">' +
                'Error al cargar aprobaciones: ' + escaparHtml(e.message) +
                '. Revise la consola (F12).</td></tr>';
        }
    }
}

var _elementoPrevioRechazo = null;
var _callbackConfirmarPlan = null;
var _planSeleccionadoModal = null;

function procesarAprobacionFila(cotizacionId) {
    var selectPlan = document.getElementById('selectPlanAprob_' + cotizacionId);
    var planElegido = selectPlan ? selectPlan.value : null;
    if (planElegido) {
        aprobarConPlanSeleccionado(cotizacionId, planElegido);
    } else {
        procesarAprobacionConPlan(cotizacionId);
    }
}

function abrirModalPlanFinanciamiento(cotizacionId, callback) {
    var modal = document.getElementById('modalPlanFinanciamiento');
    var contOpciones = document.getElementById('contenedorOpcionesPlanModal');
    var montoElem = document.getElementById('modalPlanMonto');
    var btnConf = document.getElementById('btnConfirmarPlan');
    if (!modal || !contOpciones) {
        if (typeof callback === 'function') callback('cashea_3');
        return;
    }

    var cotizaciones = (typeof obtenerCotizaciones === 'function') ? obtenerCotizaciones() : [];
    var cot = null;
    for (var i = 0; i < cotizaciones.length; i++) {
        if (Number(cotizaciones[i].id) === Number(cotizacionId)) {
            cot = cotizaciones[i];
            break;
        }
    }
    if (!cot) return;

    _callbackConfirmarPlan = callback;
    _planSeleccionadoModal = cot.tipoPlanFinanciamiento || cot.planFinanciamientoId || 'cashea_3';

    if (montoElem) montoElem.textContent = usd(cot.total);
    if (btnConf) {
        btnConf.disabled = false;
        btnConf.onclick = function () {
            if (_planSeleccionadoModal && typeof _callbackConfirmarPlan === 'function') {
                var cb = _callbackConfirmarPlan;
                _callbackConfirmarPlan = null;
                cerrarTodosLosModales();
                cb(_planSeleccionadoModal);
            }
        };
    }

    var html = '<div style="display:flex; flex-direction:column; gap:0.75rem; max-height:360px; overflow-y:auto; padding:0.25rem;">';
    if (typeof PLANES_FINANCIAMIENTO !== 'undefined') {
        for (var pk in PLANES_FINANCIAMIENTO) {
            if (PLANES_FINANCIAMIENTO.hasOwnProperty(pk)) {
                var p = PLANES_FINANCIAMIENTO[pk];
                var esCheck = (pk === _planSeleccionadoModal) ? ' checked' : '';
                var sim = (typeof simularPlanFinanciamiento === 'function') ? simularPlanFinanciamiento(cot.total, pk) : null;
                var detalleSim = sim ? ('Inicial: ' + usd(sim.montoInicialUSD) + ' · ' + sim.numeroCuotas + ' cuotas de ' + usd(sim.montoPorCuotaUSD)) : (p.cuotas + ' cuotas');

                html += '<label style="display:flex; align-items:flex-start; gap:0.75rem; padding:0.75rem; border:1px solid var(--color-borde); border-radius:var(--radio-md); cursor:pointer; background:var(--color-superficie);">' +
                    '  <input type="radio" name="opcionPlanModal" value="' + pk + '"' + esCheck + ' onchange="_planSeleccionadoModal=this.value" style="margin-top:0.25rem;">' +
                    '  <div style="flex:1;">' +
                    '    <div style="font-weight:600; font-size:0.9rem; color:var(--color-texto);">' + escaparHtml(p.nombre) + '</div>' +
                    '    <div style="font-size:0.78rem; color:var(--color-texto-secundario); margin-top:0.15rem;">' + escaparHtml(p.descripcion || '') + '</div>' +
                    '    <div style="font-size:0.75rem; color:var(--color-exito); font-weight:600; margin-top:0.25rem;">' + detalleSim + '</div>' +
                    '  </div>' +
                    '</label>';
            }
        }
    }
    html += '</div>';
    contOpciones.innerHTML = html;

    modal.classList.remove('oculto');
}

function procesarAprobacionConPlan(cotizacionId) {
    // Verificar que la función del modal exista
    var modalDisponible = (typeof abrirModalPlanFinanciamiento === 'function')
        && document.getElementById('modalPlanFinanciamiento');

    if (!modalDisponible) {
        // Fallback: aprobar con plan contado directamente
        console.warn('Modal de plan no disponible, usando plan contado.');
        aprobarConPlanContado(cotizacionId);
        return;
    }

    try {
        abrirModalPlanFinanciamiento(cotizacionId, function (planId) {
            aprobarConPlanSeleccionado(cotizacionId, planId);
        });
    } catch (e) {
        console.error('Error abriendo modal de plan:', e);
        aprobarConPlanContado(cotizacionId);
    }
}

function aprobarConPlanSeleccionado(cotizacionId, planId) {
    try {
        var res = cambiarEstadoCotizacion(cotizacionId, 'APROBADA',
            sesionUsuario, { planFinanciamientoId: planId });
        if (!res.ok) {
            mostrarNotificacion(res.error || 'No se pudo aprobar.', 'error');
            return;
        }
        var nombrePlan = 'contado';
        try {
            if (typeof PLANES_FINANCIAMIENTO !== 'undefined' &&
                PLANES_FINANCIAMIENTO[planId]) {
                nombrePlan = PLANES_FINANCIAMIENTO[planId].nombre;
            }
        } catch (ePlan) {}
        if (res.cotizacion && res.cotizacion.usuarioId &&
            typeof guardarNotificacion === 'function') {
            guardarNotificacion(res.cotizacion.usuarioId,
                '¡Cotización ' + res.cotizacion.correlativo +
                ' APROBADA con plan ' + nombrePlan, 'exito');
        }
        mostrarNotificacion('Cotización ' + res.cotizacion.correlativo +
            ' aprobada con plan ' + nombrePlan + '.', 'exito');
        try { renderizarModuloAprobaciones(); } catch (e) {}
        try { actualizarCabeceraUsuario(); } catch (e) {}
    } catch (e) {
        console.error('Error aprobando con plan:', e);
        mostrarNotificacion('Error al aprobar: ' + e.message, 'error');
    }
}

function aprobarConPlanContado(cotizacionId) {
    var res = cambiarEstadoCotizacion(cotizacionId, 'APROBADA',
        sesionUsuario, { planFinanciamientoId: 'contado' });
    if (!res.ok) {
        mostrarNotificacion(res.error || 'No se pudo aprobar.', 'error');
        return;
    }
    mostrarNotificacion('Cotización ' + res.cotizacion.correlativo +
        ' aprobada (plan contado por defecto).', 'exito');
    try { renderizarModuloAprobaciones(); } catch (e) {}
    try { actualizarCabeceraUsuario(); } catch (e) {}
}

function procesarAprobacion(cotizacionId, esAprobada) {
    if (esAprobada) {
        procesarAprobacionConPlan(cotizacionId);
        return;
    }

    // Flujo de rechazo con fallback
    var modalRechazoDisponible = (typeof abrirModalRechazo === 'function')
        && document.getElementById('modalRechazo')
        && document.getElementById('inputMotivoRechazo');

    if (modalRechazoDisponible) {
        try {
            abrirModalRechazo(cotizacionId);
            return;
        } catch (e) {
            console.warn('Error abriendo modal de rechazo, usando fallback:', e);
        }
    }

    // Fallback: confirmación simple con motivo genérico
    mostrarModalConfirmacion(
        'Rechazar Cotización',
        '¿Confirma el rechazo? Se registrará como "Rechazo institucional sin motivo detallado". ' +
        'Puede editarlo después en la bitácora.',
        function () {
            rechazarCotizacionDirecto(cotizacionId, 'Rechazo institucional');
        },
        'Sí, rechazar',
        'Cancelar'
    );
}

function rechazarCotizacionDirecto(cotizacionId, motivo) {
    try {
        var res = cambiarEstadoCotizacion(cotizacionId, 'RECHAZADA',
            sesionUsuario, { motivoRechazo: motivo || 'Rechazo institucional' });
        if (!res.ok) {
            mostrarNotificacion(res.error || 'No se pudo rechazar.', 'error');
            return;
        }
        if (res.cotizacion && res.cotizacion.usuarioId &&
            typeof guardarNotificacion === 'function') {
            guardarNotificacion(res.cotizacion.usuarioId,
                'Su cotización ' + res.cotizacion.correlativo +
                ' fue RECHAZADA. Motivo: ' + (motivo || 'Rechazo institucional'),
                'peligro');
        }
        mostrarNotificacion('Cotización ' + res.cotizacion.correlativo +
            ' rechazada.', 'info');
        try { renderizarModuloAprobaciones(); } catch (e) {}
        try { actualizarCabeceraUsuario(); } catch (e) {}
    } catch (e) {
        console.error('Error rechazando:', e);
        mostrarNotificacion('Error al rechazar: ' + e.message, 'error');
    }
}

/**
 * Abre el modal formal para indicar el motivo justificado de rechazo.
 * @param {number} cotizacionId - Identificador de la cotización.
 */
function abrirModalRechazo(cotizacionId) {
    _cotizacionIdRechazo = cotizacionId;
    _elementoPrevioRechazo = document.activeElement;
    var modal = document.getElementById('modalRechazo');
    var input = document.getElementById('inputMotivoRechazo') || document.getElementById('motivoRechazoInput');
    var err = document.getElementById('error_motivoRechazo');
    if (!modal || !input) return;
    input.value = '';
    if (err) {
        err.textContent = '';
        err.classList.add('oculto');
    }
    modal.classList.remove('oculto');
    input.focus();
}

/**
 * Procesa y asienta el rechazo formal desde el modal sin usar prompt().
 */
function confirmarRechazoDesdeModal() {
    if (!_cotizacionIdRechazo) return;
    var input = document.getElementById('inputMotivoRechazo') || document.getElementById('motivoRechazoInput');
    var err = document.getElementById('error_motivoRechazo');
    var motivo = input ? input.value.trim() : '';

    if (!motivo) {
        if (err) {
            err.textContent = 'El rechazo requiere un motivo justificado obligatorio.';
            err.classList.remove('oculto');
        }
        if (input) input.focus();
        mostrarNotificacion('El rechazo requiere un motivo justificado.', 'advertencia');
        return;
    }
    if (motivo.length < 10) {
        if (err) {
            err.textContent = 'El motivo debe contener al menos 10 caracteres explicativos (actual: ' + motivo.length + ').';
            err.classList.remove('oculto');
        }
        if (input) input.focus();
        mostrarNotificacion('El motivo de rechazo debe contener al menos 10 caracteres explicativos.', 'advertencia');
        return;
    }

    var resultado = cambiarEstadoCotizacion(_cotizacionIdRechazo, 'RECHAZADA', sesionUsuario, { motivoRechazo: motivo });
    if (!resultado.ok) {
        if (err) {
            err.textContent = resultado.error;
            err.classList.remove('oculto');
        }
        mostrarNotificacion(resultado.error, 'error');
        return;
    }

    if (resultado.cotizacion && resultado.cotizacion.usuarioId) {
        guardarNotificacion(resultado.cotizacion.usuarioId, 'Su cotización ' + resultado.cotizacion.correlativo + ' fue RECHAZADA. Motivo: ' + motivo, 'peligro');
    }

    cerrarTodosLosModales();
    if (_elementoPrevioRechazo && typeof _elementoPrevioRechazo.focus === 'function') {
        _elementoPrevioRechazo.focus();
    }
    mostrarNotificacion('Cotización ' + resultado.cotizacion.correlativo + ' rechazada formalmente.', 'info');
    renderizarModuloAprobaciones();
    actualizarCabeceraUsuario();
}

function marcarComoEntregada(cotizacionId) {
    mostrarModalConfirmacion(
        'Confirmar Entrega de Obra',
        '¿Confirma que los materiales fueron despachados y recibidos en obra? Esta acción pasará los fondos de comprometidos a gastados definitivos.',
        function () {
            var resultado = cambiarEstadoCotizacion(cotizacionId, 'ENTREGADA', sesionUsuario);
            if (!resultado.ok) {
                mostrarNotificacion(resultado.error, 'error');
                return;
            }
            if (resultado.cotizacion && resultado.cotizacion.usuarioId) {
                guardarNotificacion(resultado.cotizacion.usuarioId, 'La orden ' + resultado.cotizacion.correlativo + ' fue recibida y marcada como ENTREGADA en obra.', 'info');
            }
            mostrarNotificacion('Cotización ' + resultado.cotizacion.correlativo + ' marcada como ENTREGADA.', 'exito');
            renderizarModuloAprobaciones();
            actualizarCabeceraUsuario();
        },
        'Confirmar Entrega',
        'Cancelar'
    );
}

// ============================================================
// 13. MÓDULO: DOCUMENTO IMPRIMIBLE CON LOGO
// ============================================================

function verDocumentoCotizacion(id) {
    var cotizaciones = obtenerCotizaciones();
    var cot = null;
    for (var i = 0; i < cotizaciones.length; i++) {
        if (cotizaciones[i].id === id) {
            cot = cotizaciones[i];
            break;
        }
    }
    if (!cot) return;

    documentoActual = cot;
    renderizarDocumentoImprimible(documentoActual);
}

function renderizarDocumentoImprimible(c) {
    var contDoc = document.getElementById('vistaDocumentoImprimible');
    var contenido = document.getElementById('contenidoDocumentoImprimible');
    if (!contDoc || !contenido) return;

    var html = '';
    html += '<div class="doc-encabezado">' +
        '<div>' +
        '<img src="img/logo-negro.png" alt="Logo SICOP" class="logo-impresion">' +
        '<h2>REPÚBLICA BOLIVARIANA DE VENEZUELA</h2>' +
        '<h3>SISTEMA INTEGRADO DE COTIZACIÓN DE OBRAS PÚBLICAS (SICOP-VE)</h3>' +
        '<p class="texto-secundario">Control Presupuestario y Suministro de Materiales</p>' +
        '</div>' +
        '<div style="text-align:right;">' +
        '<div class="doc-numero">' + escaparHtml(c.correlativo) + '</div>' +
        '<div><strong>Fecha Emisión:</strong> ' + escaparHtml(c.fechaCreacion) + '</div>' +
        '<div><strong>Validez:</strong> ' + (c.validezDias || 15) + ' días calendario</div>' +
        '<div><strong>Vence:</strong> ' + ((typeof calcularFechaVencimiento === 'function') ? calcularFechaVencimiento(c.fechaCreacion, c.validezDias) : '') + '</div>' +
        '<div><strong>Estado:</strong> <span class="badge-semaforo badge-semaforo--verde">' + escaparHtml(c.estado) + '</span></div>' +
        '</div>' +
        '</div>';

    if (c.estado === 'RECHAZADA' && c.motivoRechazo) {
        html += '<div class="alerta alerta--peligro" style="margin: 1rem 0; padding: 0.75rem 1rem; border-left: 4px solid var(--color-peligro); background: rgba(239, 68, 68, 0.08); border-radius: var(--radio-sm);">' +
            '<strong>Dictamen de Rechazo Institucional:</strong> ' + escaparHtml(c.motivoRechazo) +
            '</div>';
    }

    html += '<div class="doc-datos-cliente">' +
        '<p><strong>Cliente / Solicitante:</strong> ' + escaparHtml(c.nombreCliente) + ' (' + escaparHtml(c.perfil) + ')</p>' +
        '<p><strong>Proyecto / Obra:</strong> ' + escaparHtml(c.nombreObra || 'Construcción y Mantenimiento') + '</p>' +
        '<p><strong>Destino de la Obra:</strong> Estado ' + escaparHtml(c.estadoObra) + ' (Flete: ' + c.factorFlete.toFixed(2) + ')</p>' +
        '<p><strong>Punto de Compra:</strong> ' + escaparHtml(c.ciudadCompra) + ' (Factor: ' + c.factorCiudad.toFixed(2) + ')</p>' +
        '</div>';

    html += '<table class="tabla" style="margin: 1.5rem 0;">' +
        '<thead>' +
        '<tr><th>Item</th><th>Descripción</th><th>Sector</th><th>Cantidad</th><th>Unidad</th><th>P. Unit ($)</th><th>Total ($)</th></tr>' +
        '</thead><tbody>';

    for (var i = 0; i < c.items.length; i++) {
        var it = c.items[i];
        html += '<tr>' +
            '<td>' + (i + 1) + '</td>' +
            '<td>' + escaparHtml(it.nombre) + '</td>' +
            '<td>' + escaparHtml(it.sector) + '</td>' +
            '<td>' + it.cantidad + '</td>' +
            '<td>' + escaparHtml(it.unidad) + '</td>' +
            '<td>' + usd(it.precioUnitario) + '</td>' +
            '<td>' + usd(it.total) + '</td>' +
            '</tr>';
    }
    html += '</tbody></table>';

    html += '<div class="doc-totales">' +
        '<div class="doc-linea-total"><span>Subtotal:</span><span>' + usd(c.subtotal) + '</span></div>' +
        '<div class="doc-linea-total"><span>Flete:</span><span>' + usd(c.flete) + '</span></div>' +
        '<div class="doc-linea-total"><span>Descuento (' + (c.descuentoPct * 100).toFixed(0) + '%):</span><span>' + usd(-c.descuento) + '</span></div>' +
        '<div class="doc-linea-total"><span>Monto Neto:</span><span>' + usd(c.neto) + '</span></div>' +
        '<div class="doc-linea-total"><span>Contingencia (5%):</span><span>' + usd(c.contingencia) + '</span></div>' +
        '<div class="doc-linea-total"><span>I.V.A. (16%):</span><span>' + usd(c.iva) + '</span></div>' +
        '<div class="doc-linea-total" style="font-weight:700; font-size:1.2rem; color:var(--color-acento); border-top:2px solid var(--color-acento);">' +
        '<span>TOTAL GENERAL (USD):</span><span>' + usd(c.total) + '</span>' +
        '</div>' +
        '<div class="doc-linea-total" style="font-weight:700; color:var(--color-exito);">' +
        '<span>TOTAL EN BOLÍVARES (Tasa ' + c.tasaBCV.toFixed(2) + '):</span><span>' + bs(c.totalBs) + '</span>' +
        '</div>' +
        '</div>';

    html += '<div class="doc-firmas">' +
        '<div class="doc-firma-bloque">' +
        '<div class="doc-firma-linea"></div>' +
        '<strong>' + escaparHtml(c.nombreCliente) + '</strong><br>' + escaparHtml(c.perfil) + ' (Solicitante)' +
        '</div>' +
        '<div class="doc-firma-bloque">' +
        '<div class="doc-firma-linea"></div>' +
        '<strong>Visto Bueno / Autorización</strong><br>Gobernación del Estado (Aprobador)' +
        '</div>' +
        '</div>';

    // Timeline de 4 pasos
    var pasosTimeline = ['BORRADOR', 'ENVIADA', 'APROBADA', 'ENTREGADA'];
    var idxEstado = pasosTimeline.indexOf(c.estado);
    if (c.estado === 'RECHAZADA') idxEstado = 1;

    html += '<div class="sv-timeline" style="display:flex; justify-content:space-between; margin:1.5rem 0 1rem; border-top:1px solid var(--color-borde); padding-top:1.25rem;">';
    for (var t = 0; t < pasosTimeline.length; t++) {
        var activo = (idxEstado >= t);
        var esActual = (pasosTimeline[t] === c.estado);
        var color = activo ? 'var(--color-exito)' : 'var(--color-borde)';
        var bg = activo ? 'var(--color-exito-suave)' : 'var(--color-superficie-subtil)';
        var txtColor = activo ? '#166534' : 'var(--color-texto-terciario)';
        if (c.estado === 'RECHAZADA' && t === 1) {
            color = 'var(--color-peligro)';
            bg = 'var(--color-peligro-suave)';
            txtColor = '#991b1b';
        }
        html += '<div class="sv-timeline-step" style="flex:1; text-align:center;">' +
            '<div style="width:26px; height:26px; border-radius:50%; background:' + bg + '; border:2px solid ' + color + '; margin:0 auto 0.35rem; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; color:' + txtColor + ';">' + (t + 1) + '</div>' +
            '<div style="font-size:0.75rem; font-weight:' + (esActual ? '700' : '500') + '; color:' + txtColor + ';">' + pasosTimeline[t] + (c.estado === 'RECHAZADA' && t === 1 ? ' (RECHAZADA)' : '') + '</div>' +
            '</div>';
    }
    html += '</div>';

    // Firma Digital de Integridad Criptográfica
    var firmaDigital = (typeof generarFirmaDigital === 'function') ? generarFirmaDigital(c) : 'SICOP-SIG-DEMO';
    html += '<div class="doc-firma-digital" style="margin-top:1rem; padding:0.75rem 1rem; border:1px dashed var(--color-borde); border-radius:var(--radio-md); font-size:0.75rem; color:var(--color-texto-secundario); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">' +
        '<div>' +
        '<strong>Sello e Integridad Documental:</strong><br>' +
        '<code>' + escaparHtml(firmaDigital) + '</code>' +
        '</div>' +
        '<div style="text-align:right;">' +
        '<span>Validación: <strong style="color:var(--color-exito);">CONFORME (Original)</strong></span><br>' +
        '<span class="texto-secundario">SICOP-VE v7.0 · Plataforma Gubernamental</span>' +
        '</div>' +
        '</div>';

    contenido.innerHTML = html;
    contDoc.classList.remove('oculto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function ocultarVistaImprimible() {
    var contDoc = document.getElementById('vistaDocumentoImprimible');
    if (contDoc) contDoc.classList.add('oculto');
}

function imprimirDocumentoActual() {
    window.print();
}

function compartirDocumentoWhatsApp() {
    var objetivo = documentoActual || cotizacionEnEdicion;
    if (!objetivo) return;
    var url = generarEnlaceWhatsApp(objetivo);
    window.open(url, '_blank');
}

// ============================================================
// 14. MÓDULO: DASHBOARD CON MÉTRICAS Y GRÁFICOS
// ============================================================

function renderizarDashboard() {
    actualizarCabeceraUsuario();

    var cotizaciones = obtenerCotizaciones();
    var usuarios = obtenerUsuarios();
    var esGobernacion = (sesionUsuario && sesionUsuario.perfil === 'Gobernación');

    var cotizacionesVisibles = [];
    for (var i = 0; i < cotizaciones.length; i++) {
        if (esGobernacion || cotizaciones[i].usuarioId === sesionUsuario.id) {
            cotizacionesVisibles.push(cotizaciones[i]);
        }
    }

    var totalMes = cotizacionesVisibles.length;
    var montoAprobado = 0;
    var montoEntregado = 0;

    for (var j = 0; j < cotizacionesVisibles.length; j++) {
        var c = cotizacionesVisibles[j];
        if (c.estado === 'APROBADA' || c.estado === 'ENTREGADA') {
            montoAprobado += c.total;
        }
        if (c.estado === 'ENTREGADA') {
            montoEntregado += c.total;
        }
    }

    var kpiTotal = document.getElementById('kpiCotizacionesMes');
    var kpiAprobado = document.getElementById('kpiMontoAprobado');
    var kpiEntregado = document.getElementById('kpiMontoEntregado');
    var kpiAlertas = document.getElementById('kpiUsuariosAlerta');
    var kpiTituloAlerta = document.getElementById('kpiTituloAlerta');
    var kpiDetalleAlerta = document.getElementById('kpiUsuariosAlertaDetalle');

    if (window.SICOPMovimiento && typeof window.SICOPMovimiento.contadorAnimado === 'function') {
        if (kpiTotal) window.SICOPMovimiento.contadorAnimado(kpiTotal, totalMes, false);
        if (kpiAprobado) window.SICOPMovimiento.contadorAnimado(kpiAprobado, montoAprobado, true);
        if (kpiEntregado) window.SICOPMovimiento.contadorAnimado(kpiEntregado, montoEntregado, true);
    } else {
        if (kpiTotal) kpiTotal.textContent = totalMes;
        if (kpiAprobado) kpiAprobado.textContent = '$' + formatearMoneda(montoAprobado);
        if (kpiEntregado) kpiEntregado.textContent = '$' + formatearMoneda(montoEntregado);
    }

    if (esGobernacion) {
        var alertas = detectarAlertasSistema(usuarios, cotizaciones);
        var usuariosEnAlerta = 0;
        var nombreEnAlerta = '';
        for (var a = 0; a < alertas.length; a++) {
            if (alertas[a].tipo === 'PRESUPUESTO_CRITICO') {
                usuariosEnAlerta++;
                if (!nombreEnAlerta && alertas[a].usuario) {
                    nombreEnAlerta = alertas[a].usuario.nombre;
                }
            }
        }
        if (kpiTituloAlerta) kpiTituloAlerta.textContent = 'Entidades en Alerta (≥90%)';
        if (kpiAlertas) kpiAlertas.textContent = usuariosEnAlerta;
        if (kpiDetalleAlerta) {
            kpiDetalleAlerta.textContent = usuariosEnAlerta > 0
                ? (nombreEnAlerta ? nombreEnAlerta + ' en límite' : usuariosEnAlerta + ' entidad en riesgo')
                : 'Todas las entidades en rango';
        }
    } else {
        var estadoPropio = calcularEstadoPresupuestoUsuario(sesionUsuario);
        if (kpiTituloAlerta) kpiTituloAlerta.textContent = 'Consumo de Límite';
        if (kpiAlertas) kpiAlertas.textContent = estadoPropio.porcentajeUso.toFixed(1) + '%';
        if (kpiDetalleAlerta) {
            if (estadoPropio.porcentajeUso >= 90) {
                kpiDetalleAlerta.textContent = 'Nivel crítico de gasto';
                kpiDetalleAlerta.style.color = 'var(--color-peligro)';
            } else if (estadoPropio.porcentajeUso >= 75) {
                kpiDetalleAlerta.textContent = 'Atención: consumo elevado';
                kpiDetalleAlerta.style.color = 'var(--color-advertencia)';
            } else {
                kpiDetalleAlerta.textContent = 'Dentro del rango operativo';
                kpiDetalleAlerta.style.color = '';
            }
        }
    }

    renderizarGraficoSectores(cotizacionesVisibles);
    renderizarBarrasPresupuestoDashboard(usuarios, esGobernacion);
    renderizarFeedActividadDashboard();
    if (typeof renderizarAnalisisABC === 'function') {
        renderizarAnalisisABC();
    }
    if (typeof hidratarIconos === 'function') {
        var modDash = document.getElementById('modulo-dashboard');
        if (modDash) hidratarIconos(modDash);
    }
}

function renderizarFeedActividadDashboard() {
    var cont = document.getElementById('feedActividadUsuario');
    if (!cont) return;
    var bitacora = (typeof obtenerBitacora === 'function') ? obtenerBitacora() : [];
    if (!bitacora || bitacora.length === 0) {
        cont.innerHTML = '<p class="texto-secundario" style="padding:0.75rem 0;">No hay movimientos recientes registrados.</p>';
        return;
    }
    var inicio = Math.max(0, bitacora.length - 5);
    var ultimos = [];
    for (var i = bitacora.length - 1; i >= inicio; i--) {
        ultimos.push(bitacora[i]);
    }
    var html = '<div class="sv-feed-lista" style="display:flex; flex-direction:column; gap:0.65rem;">';
    for (var j = 0; j < ultimos.length; j++) {
        var b = ultimos[j];
        html += '<div class="sv-feed-item" style="display:flex; align-items:center; justify-content:space-between; padding:0.65rem 0.85rem; background:var(--color-superficie-subtil); border:1px solid var(--color-borde); border-radius:var(--radio-md); font-size:0.82rem;">' +
            '<div>' +
            '<strong>' + escaparHtml(b.usuario || 'Sistema') + '</strong> · ' +
            '<span class="badge-sector badge-sector--vialidad" style="font-size:0.7rem;">' + escaparHtml(b.accion || 'ACCION') + '</span> ' +
            '<span style="color:var(--color-texto);">' + escaparHtml(b.detalle || '') + '</span>' +
            '</div>' +
            '<span class="texto-secundario" style="font-size:0.75rem; white-space:nowrap; margin-left:0.5rem;">' + escaparHtml(b.fecha || '') + '</span>' +
            '</div>';
    }
    html += '</div>';
    cont.innerHTML = html;
}

function renderizarGraficoSectores(cotizaciones) {
    var contenedor = document.getElementById('graficoSectoresDashboard');
    if (!contenedor) return;

    var totales = calcularTotalesSupervision(cotizaciones);
    var sectores = SECTORES_CATALOGO;
    var maxMonto = 1;

    for (var s = 0; s < sectores.length; s++) {
        var val = totales.porSector[sectores[s]] || 0;
        if (val > maxMonto) maxMonto = val;
    }

    var html = '<div class="grafico-barras">';
    for (var i = 0; i < sectores.length; i++) {
        var sec = sectores[i];
        var monto = totales.porSector[sec] || 0;
        var pct = maxMonto > 0 ? (monto / maxMonto) * 100 : 0;

        html += '<div class="barra-fila">' +
            '<div class="barra-fila__etiqueta">' + sec + '</div>' +
            '<div class="barra-fila__pista">' +
            '<div class="barra-fila__relleno barra-fila__relleno--' + sec.toLowerCase() + ' sv-barra-animada" style="width:' + (monto > 0 ? Math.max(3, pct) : 0) + '%;"></div>' +
            '</div>' +
            '<div class="barra-fila__valor">$' + formatearMoneda(monto) + '</div>' +
            '</div>';
    }
    html += '</div>';

    contenedor.innerHTML = html;
}

function renderizarBarrasPresupuestoDashboard(usuarios, esGobernacion) {
    var contenedor = document.getElementById('semaforosPresupuestoDashboard');
    if (!contenedor) return;

    var html = '';

    if (!esGobernacion) {
        // Vista Ejecutiva Individual: Desglose balanceado de 4 cuadrantes para evitar espacios vacíos
        var st = calcularEstadoPresupuestoUsuario(sesionUsuario);
        var colorClase = st.colorSemaforo; // 'verde', 'amarillo', 'rojo'
        var estadoTexto = colorClase === 'rojo' ? 'Límite Crítico' : (colorClase === 'amarillo' ? 'Precaución' : 'Operativo Óptimo');

        html += '<div class="bloque-semaforo-individual">' +
            '<div class="semaforo-header">' +
            '  <div>' +
            '    <div class="semaforo-header__nombre">' + escaparHtml(sesionUsuario.nombre) + '</div>' +
            '    <span class="badge-sector badge-sector--construcción" style="font-size:0.72rem;">' + escaparHtml(sesionUsuario.perfil) + ' · ' + escaparHtml(sesionUsuario.estado) + '</span>' +
            '  </div>' +
            '  <span class="badge-semaforo badge-semaforo--' + colorClase + '">' + estadoTexto + ' (' + st.porcentajeUso.toFixed(1) + '%)</span>' +
            '</div>' +
            '<div class="barra-progreso" style="margin-top:0.6rem;">' +
            '  <div class="barra-progreso__relleno barra-progreso__relleno--' + colorClase + '" style="width:' + Math.min(100, st.porcentajeUso) + '%;"></div>' +
            '</div>' +
            '<div class="semaforo-metricas-grid" style="margin-top:0.75rem;">' +
            '  <div class="semaforo-metrica-caja">' +
            '    <div class="semaforo-metrica-caja__label">Límite Autorizado</div>' +
            '    <div class="semaforo-metrica-caja__monto">' + usd(st.limite) + '</div>' +
            '  </div>' +
            '  <div class="semaforo-metrica-caja">' +
            '    <div class="semaforo-metrica-caja__label">Gastado Definitivo</div>' +
            '    <div class="semaforo-metrica-caja__monto">' + usd(st.gastado) + '</div>' +
            '  </div>' +
            '  <div class="semaforo-metrica-caja">' +
            '    <div class="semaforo-metrica-caja__label">Comprometido</div>' +
            '    <div class="semaforo-metrica-caja__monto">' + usd(st.comprometido) + '</div>' +
            '  </div>' +
            '  <div class="semaforo-metrica-caja" style="background-color:var(--color-exito-suave);">' +
            '    <div class="semaforo-metrica-caja__label" style="color:var(--color-exito);">Saldo Disponible</div>' +
            '    <div class="semaforo-metrica-caja__monto" style="color:var(--color-exito);">' + usd(st.saldoDisponible) + '</div>' +
            '  </div>' +
            '</div>' +
            '<div class="texto-secundario" style="font-size:0.78rem; margin-top:0.85rem; padding-top:0.5rem; border-top:1px solid var(--color-borde-subtil); display:flex; justify-content:space-between;">' +
            '  <span>Margen de maniobra restante:</span>' +
            '  <strong style="color:var(--color-texto); font-variant-numeric:tabular-nums;">' + (100 - Math.min(100, st.porcentajeUso)).toFixed(1) + '% disponible</strong>' +
            '</div>' +
            '</div>';
    } else {
        // Vista Supervisor Gobernación: lista de todas las entidades con semáforos y estado de deuda
        html += '<div class="lista-semaforos-gobernacion">';
        var todosFins = (typeof obtenerFinanciamientos === 'function') ? obtenerFinanciamientos() : [];
        for (var i = 0; i < usuarios.length; i++) {
            var u = usuarios[i];
            var pNorm = String(u.perfil || '').toLowerCase();
            if (pNorm.indexOf('gobernacion') !== -1) continue;
            var stu = calcularEstadoPresupuestoUsuario(u);

            // Evaluar estado financiero / cuotas / mora
            var evalMora = (typeof evaluarMoraUsuario === 'function') ? evaluarMoraUsuario(u.id, todosFins) : { tieneMora: false };
            var cuotasActivas = 0;
            for (var f = 0; f < todosFins.length; f++) {
                var pf = todosFins[f];
                if (pf && pf.usuarioId === u.id && pf.estado !== 'PAGADO' && pf.estado !== 'CANCELADO') {
                    if (Array.isArray(pf.cuotas)) {
                        for (var qc = 0; qc < pf.cuotas.length; qc++) {
                            if (pf.cuotas[qc].estado !== 'PAGADA') {
                                cuotasActivas++;
                            }
                        }
                    }
                }
            }
            var badgeDeudaHtml = '';
            if (evalMora && evalMora.tieneMora) {
                badgeDeudaHtml = '<span class="badge-semaforo badge-semaforo--rojo">⚠️ EN MORA (' + (evalMora.cuotasEnMora || 1) + ' cuotas)</span>';
            } else if (cuotasActivas > 0) {
                badgeDeudaHtml = '<span class="badge-semaforo badge-semaforo--amarillo">Cuotas activas: ' + cuotasActivas + '</span>';
            } else {
                badgeDeudaHtml = '<span class="badge-semaforo badge-semaforo--verde">Sin deudas / Al día</span>';
            }

            html += '<div class="bloque-semaforo-usuario">' +
                '<div class="semaforo-header">' +
                '  <span><strong>' + escaparHtml(u.nombre) + '</strong> <small class="texto-secundario">(' + escaparHtml(u.estado) + ' · ' + escaparHtml(u.perfil) + ')</small></span>' +
                '  <div style="display:flex; align-items:center; gap:0.5rem;">' +
                badgeDeudaHtml +
                '    <span class="badge-semaforo badge-semaforo--' + stu.colorSemaforo + '">' + stu.porcentajeUso.toFixed(1) + '%</span>' +
                '  </div>' +
                '</div>' +
                '<div class="barra-progreso">' +
                '  <div class="barra-progreso__relleno barra-progreso__relleno--' + stu.colorSemaforo + '" style="width:' + Math.min(100, stu.porcentajeUso) + '%;"></div>' +
                '</div>' +
                '<div class="semaforo-metricas-grid">' +
                '  <div class="semaforo-metrica-caja">' +
                '    <div class="semaforo-metrica-caja__label">Límite</div>' +
                '    <div class="semaforo-metrica-caja__monto">' + usd(stu.limite) + '</div>' +
                '  </div>' +
                '  <div class="semaforo-metrica-caja">' +
                '    <div class="semaforo-metrica-caja__label">Gastado</div>' +
                '    <div class="semaforo-metrica-caja__monto">' + usd(stu.gastado) + '</div>' +
                '  </div>' +
                '  <div class="semaforo-metrica-caja">' +
                '    <div class="semaforo-metrica-caja__label">Comprom.</div>' +
                '    <div class="semaforo-metrica-caja__monto">' + usd(stu.comprometido) + '</div>' +
                '  </div>' +
                '  <div class="semaforo-metrica-caja">' +
                '    <div class="semaforo-metrica-caja__label">Disponible</div>' +
                '    <div class="semaforo-metrica-caja__monto">' + usd(stu.saldoDisponible) + '</div>' +
                '  </div>' +
                '</div>' +
                '</div>';
        }
        html += '</div>';
    }

    contenedor.innerHTML = html;
}

// ============================================================
// 15. MÓDULO: HISTORIAL DE COTIZACIONES Y DUPLICACIÓN
// ============================================================

function renderizarModuloHistorial() {
    var cuerpo = document.getElementById('cuerpoTablaHistorial');
    var selectFiltro = document.getElementById('filtroEstadoHistorial');
    if (!cuerpo) return;

    var filtroEstado = selectFiltro ? selectFiltro.value : 'TODAS';
    var cotizaciones = obtenerCotizaciones();
    var esGobernacion = (sesionUsuario.perfil === 'Gobernación');

    cuerpo.innerHTML = '';
    var contador = 0;

    for (var i = 0; i < cotizaciones.length; i++) {
        var c = cotizaciones[i];

        if (!esGobernacion && c.usuarioId !== sesionUsuario.id) {
            continue;
        }

        if (filtroEstado !== 'TODAS' && c.estado !== filtroEstado) {
            continue;
        }

        contador++;
        var tr = document.createElement('tr');
        var claseEstado = 'estado estado--' + c.estado.toLowerCase();
        var notaRechazoHtml = '';
        if (c.estado === 'RECHAZADA' && c.motivoRechazo) {
            notaRechazoHtml = '<div style="margin-top:0.35rem; font-size:0.75rem; color:var(--color-peligro); background:rgba(239,68,68,0.08); padding:0.25rem 0.45rem; border-radius:4px; border-left:2px solid var(--color-peligro); max-width:280px; text-align:left;"><strong>Motivo:</strong> ' + escaparHtml(c.motivoRechazo) + '</div>';
        }

        tr.innerHTML =
            '<td style="text-align: center;"><input type="checkbox" class="chk-comparar-cot" data-id="' + c.id + '" onchange="if(typeof alternarSeleccionCotizacion===\'function\') alternarSeleccionCotizacion(' + c.id + ')"></td>' +
            '<td><strong>' + escaparHtml(c.correlativo) + '</strong></td>' +
            '<td>' + escaparHtml(c.fechaCreacion) + '</td>' +
            '<td>' + escaparHtml(c.nombreCliente) + '</td>' +
            '<td>' + escaparHtml(c.ciudadCompra) + '</td>' +
            '<td>' + usd(c.total) + '</td>' +
            '<td><span class="' + claseEstado + '">' + escaparHtml(c.estado) + '</span>' + notaRechazoHtml + '</td>' +
            '<td>' +
            '<button class="boton boton--secundario boton--sm" onclick="verDocumentoCotizacion(' + c.id + ')">' + icono('ojo', 14) + ' Ver</button> ' +
            '<button class="boton boton--primario boton--sm" onclick="duplicarCotizacionDesdeHistorial(' + c.id + ')" title="Crear una nueva cotización con estos mismos materiales">' + icono('duplicar', 14) + ' Duplicar</button> ' +
            (c.estado === 'BORRADOR' || c.estado === 'ENVIADA' ?
                '<button class="boton boton--peligro boton--sm" onclick="cancelarCotizacionHistorial(' + c.id + ')">' + icono('cerrar', 14) + ' Cancelar</button>' : '') +
            '</td>';
        cuerpo.appendChild(tr);
    }

    if (contador === 0) {
        cuerpo.innerHTML =
            '<tr><td colspan="8">' +
            '  <div class="estado-vacio">' +
            '    <div class="estado-vacio__icono">' + icono('carpeta', 36) + '</div>' +
            '    <div class="estado-vacio__titulo">No se encontraron cotizaciones</div>' +
            '    <div class="estado-vacio__descripcion">No hay registros con los filtros seleccionados o aún no has creado tu primer presupuesto.</div>' +
            '    <button type="button" class="boton boton--primario" onclick="cambiarPestana(\'cotizador\')" style="margin-top:1rem;">' + icono('plus', 14) + ' Iniciar Nueva Cotización</button>' +
            '  </div>' +
            '</td></tr>';
    }
}

/**
 * Duplica los datos de una cotización previa y los abre en el Asistente de Cotización.
 * Respeta rigurosamente la regla de que el usuario no puede cotizar si tiene una abierta.
 * @param {number} id - ID de la cotización a duplicar.
 */
function duplicarCotizacionDesdeHistorial(id) {
    var cotizaciones = obtenerCotizaciones();

    // 1. Verificar si el usuario tiene una cotización abierta
    var disp = verificarDisponibilidadNuevaCotizacion(sesionUsuario.id, cotizaciones);
    if (!disp.puede) {
        mostrarNotificacion('No puede duplicar: ya tiene la cotización ' + disp.cotizacionBloqueante.correlativo + ' en estado ' + disp.cotizacionBloqueante.estado + '.', 'advertencia');
        return;
    }

    // 2. Buscar la cotización objetivo
    var cot = null;
    for (var i = 0; i < cotizaciones.length; i++) {
        if (cotizaciones[i].id === id) {
            cot = cotizaciones[i];
            break;
        }
    }
    if (!cot) return;

    // 3. Cambiar a la pestaña de cotizador
    cambiarPestana('cotizador');

    // 4. Limpiar formulario previo para evitar mezcla de datos
    limpiarFormularioCotizador();
    cotizacionEnEdicion = null;

    // 5. Cargar datos en Paso 1
    var inpNombre = document.getElementById('inputNombreObra');
    var selectEstado = document.getElementById('selectEstadoObraCotizador');
    var inpNotas = document.getElementById('inputNotasObra');
    var selectCiudad = document.getElementById('selectCiudadCotizador');

    if (inpNombre) inpNombre.value = 'Copia de ' + (cot.nombreObra || cot.correlativo);
    if (selectEstado) selectEstado.value = cot.estadoObra;
    if (inpNotas) inpNotas.value = 'Duplicada a partir de ' + cot.correlativo;
    if (selectCiudad) selectCiudad.value = cot.ciudadCompra;

    // 6. Cargar cantidades en Paso 2
    for (var j = 0; j < cot.items.length; j++) {
        var it = cot.items[j];
        var inp = document.getElementById('cant_mat_' + it.materialId);
        if (inp) {
            inp.value = it.cantidad;
        }
    }

    // 7. Posicionar en Paso 2 para que el usuario pueda ajustar cantidades si lo desea
    pasoCotizadorActual = 2;
    renderizarPasoCotizador(2);
    actualizarTotalEnVivo();
    guardarBorradorActualEnStorage();

    mostrarNotificacion('Cotización ' + cot.correlativo + ' duplicada exitosamente en el Asistente.', 'exito');
}

function cancelarCotizacionHistorial(id) {
    var cotizaciones = obtenerCotizaciones();
    var estadoPrevio = 'BORRADOR';
    for (var i = 0; i < cotizaciones.length; i++) {
        if (cotizaciones[i].id === id) { estadoPrevio = cotizaciones[i].estado; break; }
    }
    mostrarModalConfirmacion(
        'Cancelar Cotización',
        '¿Seguro que desea cancelar esta cotización? Esta acción no se puede deshacer.',
        function () {
            var res = cambiarEstadoCotizacion(id, 'CANCELADA', sesionUsuario);
            if (!res.ok) {
                mostrarNotificacion(res.error, 'error');
                return;
            }
            renderizarModuloHistorial();
            actualizarCabeceraUsuario();
            mostrarNotificacion('Cotización ' + res.cotizacion.correlativo + ' cancelada.', 'info', 6000, {
                textoAccion: 'Deshacer',
                onAccion: function () {
                    var cts = obtenerCotizaciones();
                    for (var j = 0; j < cts.length; j++) {
                        if (cts[j].id === id) {
                            cts[j].estado = estadoPrevio;
                            guardarCotizaciones(cts);
                            renderizarModuloHistorial();
                            renderizarModuloAprobaciones();
                            actualizarCabeceraUsuario();
                            mostrarNotificacion('Cancelación deshecha.', 'exito');
                            break;
                        }
                    }
                }
            });
        },
        'Sí, cancelar',
        'Volver'
    );
}

// ============================================================
// MÓDULO: MIS CUOTAS Y FINANCIAMIENTO (CASHEA / PLAZOS)
// ============================================================

function renderizarModuloFinanciamiento() {
    var contenedor = document.getElementById('contenedorPlanesFinanciamiento');
    var kpiTotal = document.getElementById('kpiTotalFinanciado');
    var kpiPagado = document.getElementById('kpiTotalPagado');
    var kpiPendiente = document.getElementById('kpiSaldoPendiente');
    var kpiMora = document.getElementById('kpiMoraAcumulada');
    var alertaMora = document.getElementById('alertaMoraUsuarioFinanciamiento');
    if (!contenedor) return;

    var todos = obtenerFinanciamientos();
    var misPlanes = [];
    var esGob = (sesionUsuario && sesionUsuario.perfil === 'Gobernación');

    for (var i = 0; i < todos.length; i++) {
        var p = todos[i];
        if (p.usuarioId === sesionUsuario.id || esGob) {
            recalcularEstadoPlan(p);
            misPlanes.push(p);
        }
    }

    var evalMora = evaluarMoraUsuario(sesionUsuario.id, misPlanes);
    if (alertaMora) {
        if (evalMora.tieneMora) {
            alertaMora.classList.remove('oculto');
        } else {
            alertaMora.classList.add('oculto');
        }
    }

    var totalFinanciado = 0;
    var totalPagado = 0;
    var totalPendiente = 0;
    var totalMora = 0;

    for (var j = 0; j < misPlanes.length; j++) {
        var plan = misPlanes[j];
        totalFinanciado += Number(plan.totalFinanciado || plan.montoTotalUSD) || 0;
        totalPagado += Number(plan.totalPagado) || 0;
        totalPendiente += Number(plan.saldoPendiente) || 0;
        if (plan.cuotas) {
            for (var c = 0; c < plan.cuotas.length; c++) {
                if (plan.cuotas[c].mora) {
                    totalMora += Number(plan.cuotas[c].mora) || 0;
                }
            }
        }
    }

    if (kpiTotal) kpiTotal.textContent = usd(totalFinanciado);
    if (kpiPagado) kpiPagado.textContent = usd(totalPagado);
    if (kpiPendiente) kpiPendiente.textContent = usd(totalPendiente);
    if (kpiMora) kpiMora.textContent = usd(totalMora);

    contenedor.innerHTML = '';

    if (misPlanes.length === 0) {
        contenedor.innerHTML =
            '<div class="tarjeta sv-text-center sv-py-xl">' +
            '  <div class="estado-vacio__icono">' + (typeof icono === 'function' ? icono('dinero', 36) : '💳') + '</div>' +
            '  <h3 class="tarjeta__titulo sv-mt-sm">No tiene planes de financiamiento activos</h3>' +
            '  <p class="tarjeta__descripcion">Al aprobar cotizaciones bajo la modalidad Cashea o créditos institucionales, su cronograma de cuotas aparecerá aquí.</p>' +
            '</div>';
        return;
    }

    for (var k = 0; k < misPlanes.length; k++) {
        var pl = misPlanes[k];
        var tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-plan-fin';

        var badgeEstado = '<span class="badge-exito">AL DÍA</span>';
        if (pl.estado === 'PAGADO') {
            badgeEstado = '<span class="badge-exito">TOTALMENTE PAGADO</span>';
        } else if (pl.estado === 'EN_MORA') {
            badgeEstado = '<span class="badge-peligro">EN MORA ACTIVA</span>';
        }

        var pctProgreso = pl.totalFinanciado > 0 ? Math.min(100, Math.round((pl.totalPagado / pl.totalFinanciado) * 100)) : 100;

        var htmlCabecera =
            '<div class="tarjeta-plan-fin__cabecera">' +
            '  <div>' +
            '    <h3 class="tarjeta__titulo sv-mb-0">' + escaparHtml(pl.nombrePlan || pl.tipoPlan) + ' — ' + escaparHtml(pl.correlativoCotizacion || '') + '</h3>' +
            '    <span class="sv-font-xs sv-text-muted">Obra: ' + escaparHtml(pl.nombreObra || 'Construcción') + ' | Beneficiario: ' + escaparHtml(pl.nombreCliente) + '</span>' +
            '  </div>' +
            '  <div class="sv-flex-center sv-gap-sm">' +
            '    ' + badgeEstado +
            '    <span class="sv-font-sm sv-font-bold">' + usd(pl.totalPagado) + ' / ' + usd(pl.totalFinanciado) + '</span>' +
            '  </div>' +
            '</div>' +
            '<div class="barra-progreso-fin">' +
            '  <div class="barra-progreso-fin__fill" style="width: ' + pctProgreso + '%;"></div>' +
            '</div>';

        var htmlCuotas = '<div class="sv-grid-cuotas">';
        if (pl.cuotas && pl.cuotas.length > 0) {
            for (var m = 0; m < pl.cuotas.length; m++) {
                var cu = pl.cuotas[m];
                var esPagada = (cu.estado === 'PAGADA');
                var esVencida = (cu.estado === 'VENCIDA');
                var claseCuota = 'cuota-card';
                if (esPagada) claseCuota += ' cuota-card--pagada';
                if (esVencida) claseCuota += ' cuota-card--vencida';

                var fVencStr = cu.fechaVencimientoISO ? cu.fechaVencimientoISO.substring(0, 10) : 'Sin fecha';

                htmlCuotas +=
                    '<div class="' + claseCuota + '">' +
                    '  <div class="sv-flex-between">' +
                    '    <strong>Cuota #' + cu.numero + '</strong>' +
                    '    <span class="badge-resultado ' + (esPagada ? 'badge-exito' : (esVencida ? 'badge-peligro' : 'badge-secundario')) + '">' + cu.estado + '</span>' +
                    '  </div>' +
                    '  <div>Monto: <strong>' + usd(cu.montoUSD) + '</strong></div>' +
                    '  <div class="sv-font-xs sv-text-muted">Vence: ' + fVencStr + '</div>' +
                    (cu.mora > 0 ? '<div class="sv-font-xs sv-text-peligro">Mora: +' + usd(cu.mora) + ' (' + cu.diasAtraso + 'd)</div>' : '') +
                    (esPagada && cu.referencia ? '<div class="sv-font-xs sv-text-muted">Ref: ' + escaparHtml(cu.referencia) + '</div>' : '') +
                    (!esPagada ?
                        '<button type="button" class="boton boton--primario boton--sm sv-mt-xs" onclick="abrirModalPagoCuota(' + pl.id + ', ' + cu.numero + ')">' +
                        (typeof icono === 'function' ? icono('dinero', 12) : '') + ' Pagar Cuota</button>' :
                        '<div class="sv-font-xs sv-text-exito sv-mt-xs">✓ Amortizada</div>') +
                    '</div>';
            }
        }
        htmlCuotas += '</div>';

        tarjeta.innerHTML = htmlCabecera + htmlCuotas;
        contenedor.appendChild(tarjeta);
    }
}

// ============================================================
// MÓDULO: CARTERA GLOBAL Y COBRANZAS (SOLO GOBERNACIÓN)
// ============================================================

function renderizarModuloCartera() {
    var cuerpo = document.getElementById('cuerpoTablaCarteraGlobal');
    var kpiTotal = document.getElementById('kpiCarteraTotal');
    var kpiRecaudado = document.getElementById('kpiCarteraRecaudada');
    var kpiPendiente = document.getElementById('kpiCarteraPendiente');
    var kpiMora = document.getElementById('kpiCarteraMora');
    var filtroUsr = document.getElementById('filtroUsuarioCartera');
    var filtroEst = document.getElementById('filtroEstadoCartera');
    if (!cuerpo) return;

    var planes = obtenerFinanciamientos();
    var usuarios = (typeof obtenerUsuarios === 'function') ? obtenerUsuarios() : [];
    var tasa = (typeof obtenerTasaBCV === 'function') ? obtenerTasaBCV() : 900;

    // Poblar selector de usuarios si aún no tiene las opciones
    if (filtroUsr && filtroUsr.options.length <= 1) {
        var valorPrevio = filtroUsr.value;
        for (var u = 0; u < usuarios.length; u++) {
            var usr = usuarios[u];
            if (usr.perfil === 'Gobernación') continue;
            var opt = document.createElement('option');
            opt.value = String(usr.id);
            opt.textContent = usr.nombre + ' (' + usr.perfil + ')';
            filtroUsr.appendChild(opt);
        }
        if (valorPrevio) filtroUsr.value = valorPrevio;
    }

    var valFiltroUsr = filtroUsr ? filtroUsr.value : 'TODOS';
    var valFiltroEst = filtroEst ? filtroEst.value : 'TODOS';

    cuerpo.innerHTML = '';

    var carteraTotal = 0;
    var recaudada = 0;
    var pendiente = 0;
    var moraTotal = 0;
    var contadorFiltrados = 0;

    for (var i = 0; i < planes.length; i++) {
        var p = planes[i];
        recalcularEstadoPlan(p);

        carteraTotal += Number(p.totalFinanciado || p.montoTotalUSD) || 0;
        recaudada += Number(p.totalPagado) || 0;
        pendiente += Number(p.saldoPendiente) || 0;

        if (p.cuotas) {
            for (var c = 0; c < p.cuotas.length; c++) {
                if (p.cuotas[c].mora) {
                    moraTotal += Number(p.cuotas[c].mora) || 0;
                }
            }
        }

        // Aplicar filtros
        if (valFiltroUsr !== 'TODOS' && String(p.usuarioId) !== String(valFiltroUsr)) {
            continue;
        }
        if (valFiltroEst !== 'TODOS' && p.estado !== valFiltroEst) {
            continue;
        }

        contadorFiltrados++;

        // Calcular progreso de cuotas
        var cuotasPagadas = 0;
        var cuotasTotal = (p.cuotas && p.cuotas.length) ? p.cuotas.length : 0;
        if (p.cuotas) {
            for (var cq = 0; cq < p.cuotas.length; cq++) {
                if (p.cuotas[cq].estado === 'PAGADA') cuotasPagadas++;
            }
        }
        var pctProgreso = cuotasTotal > 0 ? Math.round((cuotasPagadas / cuotasTotal) * 100) : 0;
        var colorBarra = (p.estado === 'EN_MORA') ? 'rojo' : ((p.estado === 'PAGADO') ? 'verde' : 'amarillo');

        var badge = '<span class="badge-exito">ACTIVO</span>';
        if (p.estado === 'PAGADO') badge = '<span class="badge-exito">PAGADO</span>';
        if (p.estado === 'EN_MORA') badge = '<span class="badge-peligro">EN MORA</span>';

        var totalUSD = Number(p.totalFinanciado || p.montoTotalUSD) || 0;
        var totalBs = totalUSD * tasa;

        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td><strong>#' + p.id + '</strong></td>' +
            '<td><strong>' + escaparHtml(p.correlativoCotizacion || '') + '</strong>' +
            (p.nombreObra ? '<br><small class="texto-secundario">' + escaparHtml(p.nombreObra) + '</small>' : '') + '</td>' +
            '<td><strong>' + escaparHtml(p.nombreCliente || '') + '</strong> <span class="badge-sector" style="font-size:0.7rem;">' + escaparHtml(p.perfil || '') + '</span></td>' +
            '<td>' + escaparHtml(p.nombrePlan || p.tipoPlan) + '</td>' +
            '<td><strong>' + usd(totalUSD) + '</strong><br><small class="texto-secundario">' + bs(totalBs) + '</small></td>' +
            '<td><span style="color:var(--color-exito); font-weight:600;">' + usd(p.totalPagado) + '</span></td>' +
            '<td><strong style="color:var(--color-alerta);">' + usd(p.saldoPendiente) + '</strong></td>' +
            '<td>' +
            '  <div style="min-width:110px;">' +
            '    <div style="font-size:0.75rem; font-weight:600; margin-bottom:0.2rem;">' + cuotasPagadas + '/' + cuotasTotal + ' (' + pctProgreso + '%)</div>' +
            '    <div class="barra-progreso" style="height:6px; margin:0;">' +
            '      <div class="barra-progreso__relleno barra-progreso__relleno--' + colorBarra + '" style="width:' + pctProgreso + '%;"></div>' +
            '    </div>' +
            '  </div>' +
            '</td>' +
            '<td>' + badge + '</td>' +
            '<td>' +
            '  <button type="button" class="boton boton--primario boton--sm" onclick="abrirDetalleCuotasAdmin(' + p.id + ')">' +
            (typeof icono === 'function' ? icono('ojo', 12) : '') + ' Supervisar</button> ' +
            '  <button type="button" class="boton boton--secundario boton--sm" onclick="verDocumentoCotizacion(' + p.cotizacionId + ')">' +
            (typeof icono === 'function' ? icono('documento', 12) : '') + ' Doc</button>' +
            '</td>';
        cuerpo.appendChild(tr);
    }

    if (kpiTotal) kpiTotal.textContent = usd(carteraTotal);
    if (kpiRecaudado) kpiRecaudado.textContent = usd(recaudada);
    if (kpiPendiente) kpiPendiente.textContent = usd(pendiente);
    if (kpiMora) kpiMora.textContent = usd(moraTotal);

    if (contadorFiltrados === 0) {
        cuerpo.innerHTML = '<tr><td colspan="10" class="sv-text-center sv-py-md sv-text-muted">No hay operaciones de cartera que coincidan con los filtros seleccionados.</td></tr>';
    }
}

/**
 * Abre una ventana modal de supervisión ejecutiva para auditar o conciliar cuotas de un plan.
 * @param {number} planId
 */
function abrirDetalleCuotasAdmin(planId) {
    var planes = obtenerFinanciamientos();
    var p = null;
    for (var i = 0; i < planes.length; i++) {
        if (Number(planes[i].id) === Number(planId)) {
            p = planes[i];
            break;
        }
    }
    if (!p) {
        mostrarNotificacion('Plan no encontrado.', 'error');
        return;
    }
    recalcularEstadoPlan(p);

    var html = '<div style="max-height:480px; overflow-y:auto; padding-right:0.25rem;">' +
        '<div style="background:var(--color-superficie-subtil); padding:0.75rem 1rem; border-radius:var(--radio-md); margin-bottom:1rem; font-size:0.83rem;">' +
        '  <div><strong>Solicitante:</strong> ' + escaparHtml(p.nombreCliente || '') + ' (' + escaparHtml(p.perfil || '') + ')</div>' +
        '  <div><strong>Cotización:</strong> ' + escaparHtml(p.correlativoCotizacion || '') + ' · <strong>Obra:</strong> ' + escaparHtml(p.nombreObra || '') + '</div>' +
        '  <div><strong>Modalidad:</strong> ' + escaparHtml(p.nombrePlan || p.tipoPlan) + ' · <strong>Monto Financiado:</strong> ' + usd(p.totalFinanciado || p.montoTotalUSD) + '</div>' +
        '  <div style="margin-top:0.35rem;"><strong>Cobrado:</strong> ' + usd(p.totalPagado) + ' · <strong style="color:var(--color-alerta);">Saldo Pendiente:</strong> ' + usd(p.saldoPendiente) + '</div>' +
        '</div>' +
        '<table class="tabla" style="font-size:0.8rem; width:100%;">' +
        '<thead><tr><th>#</th><th>Vencimiento</th><th>Monto</th><th>Mora</th><th>Estado</th><th>Referencia / Pago</th><th>Acción</th></tr></thead>' +
        '<tbody>';

    if (Array.isArray(p.cuotas)) {
        for (var c = 0; c < p.cuotas.length; c++) {
            var cu = p.cuotas[c];
            var fVenc = cu.fechaVencimientoISO ? cu.fechaVencimientoISO.substring(0, 10) : (cu.fechaVencimiento || '-');
            var esPagada = (cu.estado === 'PAGADA');
            var esVencida = (cu.estado === 'VENCIDA');
            var badgeCuota = esPagada ? '<span class="badge-exito">PAGADA</span>' : (esVencida ? '<span class="badge-peligro">VENCIDA</span>' : '<span class="badge-semaforo badge-semaforo--amarillo">PENDIENTE</span>');
            var infoPago = esPagada ? (escaparHtml(cu.referencia || '-') + '<br><small class="texto-secundario">' + (cu.fechaPago || '') + '</small>') : '-';

            html += '<tr>' +
                '<td><strong>#' + cu.numero + '</strong></td>' +
                '<td>' + escaparHtml(fVenc) + '</td>' +
                '<td><strong>' + usd(cu.montoUSD) + '</strong></td>' +
                '<td>' + (cu.mora > 0 ? ('<span style="color:var(--color-peligro); font-weight:600;">+' + usd(cu.mora) + '</span>') : '$0,00') + '</td>' +
                '<td>' + badgeCuota + '</td>' +
                '<td>' + infoPago + '</td>' +
                '<td>' +
                (!esPagada ?
                    '<button type="button" class="boton boton--exito boton--sm" onclick="cerrarTodosLosModales(); abrirModalPagoCuota(' + p.id + ', ' + cu.numero + ')">Conciliar Pago</button>' :
                    '<span class="texto-secundario" style="font-size:0.75rem;">Conciliado</span>') +
                '</td>' +
                '</tr>';
        }
    }
    html += '</tbody></table></div>';

    mostrarModalConfirmacion(
        'Supervisión de Cuotas — Plan #' + p.id + ' (' + escaparHtml(p.correlativoCotizacion || '') + ')',
        html,
        null,
        'Cerrar',
        '',
        true
    );
}

// ============================================================
// MODAL DE REGISTRO DE PAGO DE CUOTAS
// ============================================================

function abrirModalPagoCuota(financiamientoId, numeroCuota) {
    var modal = document.getElementById('modalPagoCuota');
    var inpId = document.getElementById('pagoFinanciamientoId');
    var inpNum = document.getElementById('pagoNumeroCuota');
    var inpMonto = document.getElementById('pagoMontoInput');
    var inpRef = document.getElementById('pagoReferenciaInput');
    var inpFecha = document.getElementById('pagoFechaInput');
    var errRef = document.getElementById('error_pagoReferencia');
    var detalle = document.getElementById('modalPagoCuotaDetalle');
    if (!modal) return;

    var planes = obtenerFinanciamientos();
    var plan = null;
    for (var i = 0; i < planes.length; i++) {
        if (planes[i].id === Number(financiamientoId)) {
            plan = planes[i];
            break;
        }
    }
    if (!plan) return;

    var cuota = null;
    for (var c = 0; c < plan.cuotas.length; c++) {
        if (plan.cuotas[c].numero === Number(numeroCuota)) {
            cuota = plan.cuotas[c];
            break;
        }
    }
    if (!cuota) return;

    var totalAPagar = Number(cuota.montoUSD) + (Number(cuota.mora) || 0);

    if (inpId) inpId.value = plan.id;
    if (inpNum) inpNum.value = cuota.numero;
    if (inpMonto) inpMonto.value = totalAPagar.toFixed(2);
    if (inpRef) inpRef.value = '';
    if (inpFecha) inpFecha.value = (new Date()).toISOString().substring(0, 10);
    if (errRef) {
        errRef.textContent = '';
        errRef.classList.add('oculto');
    }
    if (detalle) {
        detalle.textContent = 'Amortización de Cuota #' + cuota.numero + ' — Plan: ' + (plan.nombrePlan || plan.tipoPlan) + ' (' + plan.correlativoCotizacion + ')';
    }

    modal.classList.remove('oculto');
    if (inpRef) inpRef.focus();
}

function cerrarModalPagoCuota() {
    var modal = document.getElementById('modalPagoCuota');
    if (modal) modal.classList.add('oculto');
}

function confirmarPagoCuotaDesdeModal() {
    var inpId = document.getElementById('pagoFinanciamientoId');
    var inpNum = document.getElementById('pagoNumeroCuota');
    var inpMonto = document.getElementById('pagoMontoInput');
    var inpRef = document.getElementById('pagoReferenciaInput');
    var inpFecha = document.getElementById('pagoFechaInput');
    var errRef = document.getElementById('error_pagoReferencia');

    if (!inpRef || !inpRef.value.trim() || inpRef.value.trim().length < 3) {
        if (errRef) {
            errRef.textContent = 'Ingrese un número o código de referencia bancaria válido (mínimo 3 caracteres).';
            errRef.classList.remove('oculto');
        }
        if (inpRef) inpRef.focus();
        return;
    }

    var financiamientoId = Number(inpId.value);
    var numeroCuota = Number(inpNum.value);
    var monto = Number(inpMonto.value);
    var referencia = inpRef.value.trim();
    var fecha = inpFecha ? inpFecha.value : null;

    var res = registrarPagoCuota(financiamientoId, numeroCuota, {
        monto: monto,
        referencia: referencia,
        fechaISO: fecha ? new Date(fecha).toISOString() : new Date().toISOString()
    });

    if (!res.ok) {
        mostrarNotificacion(res.error, 'error');
        return;
    }

    cerrarModalPagoCuota();
    mostrarNotificacion('¡Pago de cuota #' + numeroCuota + ' registrado con éxito! Referencia: ' + referencia, 'exito');
    renderizarModuloFinanciamiento();
    renderizarModuloCartera();
    actualizarCabeceraUsuario();
}

// ============================================================
// 16. MÓDULO: SUPERVISIÓN GLOBAL (SOLO GOBERNACIÓN)
// ============================================================

function renderizarModuloSupervision() {
    var cuerpoRanking = document.getElementById('cuerpoTablaSupervisionRanking');
    var cuerpoPerfiles = document.getElementById('cuerpoTotalesPerfilSupervision');
    var cuerpoEstados = document.getElementById('cuerpoTotalesEstadoSupervision');
    if (!cuerpoRanking) return;

    var usuarios = obtenerUsuarios();
    var cotizaciones = obtenerCotizaciones();

    var ranking = calcularRankingSupervision(usuarios, cotizaciones);

    cuerpoRanking.innerHTML = '';
    for (var i = 0; i < ranking.length; i++) {
        var r = ranking[i];
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td><strong>#' + (i + 1) + '</strong></td>' +
            '<td>' + escaparHtml(r.nombre) + '</td>' +
            '<td>' + escaparHtml(r.perfil) + '</td>' +
            '<td>' + escaparHtml(r.estado) + '</td>' +
            '<td>' + r.cantCotizaciones + '</td>' +
            '<td>' + usd(r.montoAprobado) + '</td>' +
            '<td>' + usd(r.montoEntregado) + '</td>';
        cuerpoRanking.appendChild(tr);
    }

    var totales = calcularTotalesSupervision(cotizaciones);

    if (cuerpoPerfiles) {
        cuerpoPerfiles.innerHTML = '';
        var perfiles = ['Alcaldía', 'Empresa', 'Constructor', 'Gobernación'];
        for (var p = 0; p < perfiles.length; p++) {
            var perf = perfiles[p];
            var trP = document.createElement('tr');
            trP.innerHTML =
                '<td>' + escaparHtml(perf) + '</td>' +
                '<td><strong>' + usd(totales.porPerfil[perf] || 0) + '</strong></td>';
            cuerpoPerfiles.appendChild(trP);
        }
    }

    if (cuerpoEstados) {
        cuerpoEstados.innerHTML = '';
        for (var estado in totales.porEstado) {
            var trE = document.createElement('tr');
            trE.innerHTML =
                '<td>' + escaparHtml(estado) + '</td>' +
                '<td><strong>' + usd(totales.porEstado[estado]) + '</strong></td>';
            cuerpoEstados.appendChild(trE);
        }
    }
}

// ============================================================
// 17. MÓDULO: EXPORTAR, IMPORTAR Y MODO DEMOSTRACIÓN
// ============================================================

function exportarDatosJSON() {
    var rawUsuarios = obtenerUsuarios();
    var usuariosSeguros = [];
    for (var u = 0; u < rawUsuarios.length; u++) {
        var usr = {};
        for (var p in rawUsuarios[u]) {
            if (rawUsuarios[u].hasOwnProperty(p) && p !== 'clave') {
                usr[p] = rawUsuarios[u][p];
            }
        }
        usuariosSeguros.push(usr);
    }

    var paquete = {
        sistema: 'SICOP-VE',
        version: '2.1',
        fechaExportacion: obtenerFechaActual(),
        usuarios: usuariosSeguros,
        materiales: obtenerMateriales(),
        cotizaciones: obtenerCotizaciones(),
        financiamientos: (typeof obtenerFinanciamientos === 'function') ? obtenerFinanciamientos() : [],
        bitacora: obtenerBitacora(),
        tasaBCV: obtenerTasaBCV()
    };

    var contenido = JSON.stringify(paquete, null, 2);
    descargarArchivoBlob(contenido, 'SICOP_VE_RESPALDO_' + Date.now() + '.json', 'application/json');

    registrarEnBitacora(sesionUsuario.nombre, 'RESPALDO_EXPORTADO', 'Descarga de respaldo completo del sistema en JSON.');
    mostrarNotificacion('Respaldo exportado exitosamente en JSON.', 'exito');
}

function exportarCotizacionesCSV() {
    var cotizaciones = obtenerCotizaciones();
    var csv = exportarCotizacionesACSV(cotizaciones);
    descargarArchivoBlob(csv, 'SICOP_VE_COTIZACIONES_' + Date.now() + '.csv', 'text/csv;charset=utf-8;');

    registrarEnBitacora(sesionUsuario.nombre, 'CSV_EXPORTADO', 'Exportación de historial de cotizaciones en formato CSV.');
    mostrarNotificacion('Cotizaciones exportadas exitosamente en CSV.', 'exito');
}

function descargarArchivoBlob(contenido, nombreArchivo, mimeType) {
    var blob = new Blob([contenido], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importarDatosJSON(evento) {
    var archivo = evento.target.files[0];
    if (!archivo) return;

    var lector = new FileReader();
    lector.onload = function (e) {
        var texto = e.target.result;
        var validacion = validarRespaldoJSON(texto);

        if (!validacion.valido) {
            mostrarNotificacion('Archivo de respaldo no válido: ' + validacion.error, 'error');
            return;
        }

        mostrarModalConfirmacion(
            'Restaurar Respaldo',
            '¿Está seguro de restaurar este respaldo? Se sobrescribirán los datos actuales.',
            function () {
                var datos = validacion.datos;
                // Preservar las contraseñas de los usuarios existentes al restaurar un respaldo
                var usuariosExistentes = obtenerUsuarios();
                var usuariosImportados = datos.usuarios || [];
                for (var i = 0; i < usuariosImportados.length; i++) {
                    var uImp = usuariosImportados[i];
                    var claveExistente = '1234';
                    for (var k = 0; k < usuariosExistentes.length; k++) {
                        if (usuariosExistentes[k].id === uImp.id || usuariosExistentes[k].usuario === uImp.usuario) {
                            if (usuariosExistentes[k].clave) {
                                claveExistente = usuariosExistentes[k].clave;
                            }
                            break;
                        }
                    }
                    uImp.clave = claveExistente;
                }
                guardarUsuarios(usuariosImportados);
                guardarMateriales(datos.materiales);
                guardarCotizaciones(datos.cotizaciones);
                if (Array.isArray(datos.financiamientos) && typeof guardarFinanciamientos === 'function') {
                    guardarFinanciamientos(datos.financiamientos);
                }
                if (Array.isArray(datos.bitacora)) {
                    escribirStorage(CLAVES_STORAGE.BITACORA, datos.bitacora);
                }
                if (datos.tasaBCV) {
                    guardarTasaBCV(datos.tasaBCV);
                }

                registrarEnBitacora(sesionUsuario ? sesionUsuario.nombre : 'Sistema', 'RESPALDO_IMPORTADO', 'Restauración exitosa de respaldo JSON.');
                location.reload();
            },
            'Sí, restaurar',
            'Cancelar'
        );
    };
    lector.readAsText(archivo);
}

function restablecerFabricaConConfirmacion() {
    mostrarModalConfirmacion(
        'Valores Iniciales de Fábrica',
        '¿ATENCIÓN: Desea borrar todos los cambios y restablecer la demostración de fábrica original?',
        function () {
            restablecerDatosFabrica();
            location.reload();
        },
        'Restablecer',
        'Cancelar'
    );
}

/**
 * Modo Demostración: Carga el conjunto completo de datos de ejemplo para clase.
 */
function ejecutarCargaDatosDemo() {
    var btn = document.getElementById('btnCargarDatosDemo');
    var textoOriginal = btn ? btn.textContent : '';
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Procesando...';
    }
    cargarDatosDemostracionCompletos();
    mostrarNotificacion('Datos de demostración para exposición cargados exitosamente.', 'exito');
    setTimeout(function () {
        if (btn) {
            btn.disabled = false;
            btn.textContent = textoOriginal;
        }
        location.reload();
    }, 600);
}

/**
 * Modo Demostración: Vacía todo el sistema para empezar desde cero una prueba en vivo.
 */
function ejecutarVaciadoTodoDemo() {
    mostrarModalConfirmacion(
        'Reiniciar Todo el Sistema',
        '¿Desea borrar todas las cotizaciones, materiales y bitácora para empezar una demostración en blanco?',
        function () {
            var btn = document.getElementById('btnVaciarTodoDemo');
            var textoOriginal = btn ? btn.textContent : '';
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Procesando...';
            }
            vaciarDatosSistema();
            mostrarNotificacion('Sistema reiniciado desde cero.', 'info');
            setTimeout(function () {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = textoOriginal;
                }
                location.reload();
            }, 600);
        },
        'Sí, borrar todo',
        'Cancelar'
    );
}

// ============================================================
// 18. MÓDULO: BITÁCORA Y ALERTAS TEMPRANAS
// ============================================================

function renderizarModuloBitacora() {
    var cuerpoBitacora = document.getElementById('cuerpoTablaBitacora');
    var contenedorAlertas = document.getElementById('contenedorTarjetasAlertas');

    var usuarios = obtenerUsuarios();
    var cotizaciones = obtenerCotizaciones();
    var bitacora = obtenerBitacora();

    if (contenedorAlertas) {
        var alertas = detectarAlertasSistema(usuarios, cotizaciones);
        contenedorAlertas.innerHTML = '';

        if (alertas.length === 0) {
            contenedorAlertas.innerHTML = '<div class="aviso aviso--exito">No se detectan anomalías ni alertas críticas en el sistema.</div>';
        } else {
            for (var a = 0; a < alertas.length; a++) {
                var al = alertas[a];
                var div = document.createElement('div');
                div.className = 'aviso ' + (al.nivel === 'critico' ? 'aviso--error' : 'aviso--advertencia');
                div.innerHTML = '<strong>' + escaparHtml(al.titulo) + '</strong>: ' + escaparHtml(al.mensaje) + ' <span class="texto-secundario" style="float:right;">' + escaparHtml(al.fecha) + '</span>';
                contenedorAlertas.appendChild(div);
            }
        }
    }

    if (cuerpoBitacora) {
        cuerpoBitacora.innerHTML = '';
        for (var b = 0; b < bitacora.length; b++) {
            var reg = bitacora[b];
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td>' + escaparHtml(reg.fecha) + '</td>' +
                '<td><strong>' + escaparHtml(reg.usuario) + '</strong></td>' +
                '<td><code>' + escaparHtml(reg.accion) + '</code></td>' +
                '<td>' + escaparHtml(reg.detalle) + '</td>';
            cuerpoBitacora.appendChild(tr);
        }

        if (bitacora.length === 0) {
            cuerpoBitacora.innerHTML =
                '<tr><td colspan="4">' +
                '  <div class="estado-vacio">' +
                '    <div class="estado-vacio__icono">' + icono('escudo', 36) + '</div>' +
                '    <div class="estado-vacio__titulo">Bitácora limpia</div>' +
                '    <div class="estado-vacio__descripcion">No se registran eventos auditados aún.</div>' +
                '  </div>' +
                '</td></tr>';
        }
    }
}

// ============================================================
// 18.1 MÓDULO: ESTADO INTEGRAL DE USUARIOS Y EXPEDIENTES (SOLO GOBERNACIÓN)
// ============================================================

var _usuarioExpedienteActualId = null;

/**
 * Renderiza el módulo de Estado Integral de Usuarios con KPIs y filtros combinados.
 */
function renderizarModuloEstadoUsuarios() {
    var cuerpoTabla = document.getElementById('cuerpoTablaEstadoUsuarios');
    if (!cuerpoTabla) return;

    var usuarios = obtenerUsuarios();
    var cotizaciones = obtenerCotizaciones();
    var financiamientos = (typeof obtenerFinanciamientos === 'function') ? obtenerFinanciamientos() : [];

    // Calcular métricas para KPIs
    var totalUsuarios = usuarios.length;
    var totalActivos = 0;
    var totalSolventes = 0;
    var totalEnMora = 0;
    var montoTotalMoraUSD = 0;
    var cupoComprometidoGlobalUSD = 0;

    for (var u = 0; u < usuarios.length; u++) {
        var usr = usuarios[u];
        if (usr.activo !== false) totalActivos++;

        var evaMora = (typeof evaluarMoraUsuario === 'function') ? evaluarMoraUsuario(usr.id, financiamientos) : { tieneMora: false, totalMoraUSD: 0 };
        if (evaMora.tieneMora) {
            totalEnMora++;
            montoTotalMoraUSD += (Number(evaMora.totalMoraUSD) || 0);
        } else {
            totalSolventes++;
        }

        cupoComprometidoGlobalUSD += (Number(usr.comprometido) || 0);
    }

    // Actualizar elementos de KPIs en el DOM
    var elemTotal = document.getElementById('kpiTotalUsuariosRegistrados');
    if (elemTotal) elemTotal.textContent = totalUsuarios;

    var elemSubActivos = document.getElementById('kpiSubtextoUsuariosActivos');
    if (elemSubActivos) elemSubActivos.textContent = totalActivos + ' activos / ' + (totalUsuarios - totalActivos) + ' suspendidos';

    var elemSolventes = document.getElementById('kpiUsuariosSolventes');
    if (elemSolventes) elemSolventes.textContent = totalSolventes;

    var elemEnMora = document.getElementById('kpiUsuariosEnMora');
    if (elemEnMora) elemEnMora.textContent = totalEnMora;

    var elemMontoMora = document.getElementById('kpiMontoMoraUsuariosTotal');
    if (elemMontoMora) elemMontoMora.textContent = monedaActiva(montoTotalMoraUSD) + ' en mora acumulada';

    var elemComprometido = document.getElementById('kpiCupoComprometidoGlobal');
    if (elemComprometido) elemComprometido.textContent = monedaActiva(cupoComprometidoGlobalUSD);

    // Obtener valores de filtros
    var inputBusqueda = document.getElementById('buscarUsuarioAdmin');
    var selectPerfil = document.getElementById('filtroPerfilAdmin');
    var selectEstadoCuenta = document.getElementById('filtroEstadoCuentaAdmin');
    var selectSolvencia = document.getElementById('filtroEstadoFinancieroAdmin');

    var textoBusqueda = inputBusqueda ? inputBusqueda.value.toLowerCase().trim() : '';
    var filtroPerfil = selectPerfil ? selectPerfil.value : 'TODOS';
    var filtroCuenta = selectEstadoCuenta ? selectEstadoCuenta.value : 'TODOS';
    var filtroSolvencia = selectSolvencia ? selectSolvencia.value : 'TODOS';

    // Filtrar usuarios
    var usuariosFiltrados = [];
    for (var i = 0; i < usuarios.length; i++) {
        var user = usuarios[i];
        var eva = (typeof evaluarMoraUsuario === 'function') ? evaluarMoraUsuario(user.id, financiamientos) : { tieneMora: false, totalMoraUSD: 0 };
        var esActivo = (user.activo !== false);

        // Filtro texto libre
        if (textoBusqueda) {
            var coincideNombre = (user.nombre || '').toLowerCase().indexOf(textoBusqueda) !== -1;
            var coincideLogin = (user.usuario || '').toLowerCase().indexOf(textoBusqueda) !== -1;
            var coincideEstado = (user.estado || '').toLowerCase().indexOf(textoBusqueda) !== -1;
            if (!coincideNombre && !coincideLogin && !coincideEstado) {
                continue;
            }
        }

        // Filtro de perfil
        if (filtroPerfil !== 'TODOS') {
            if ((user.perfil || '') !== filtroPerfil) {
                continue;
            }
        }

        // Filtro de estado de cuenta
        if (filtroCuenta === 'ACTIVO' && !esActivo) continue;
        if (filtroCuenta === 'INACTIVO' && esActivo) continue;

        // Filtro de solvencia financiera
        var limite = Number(user.limiteGasto) || 0;
        var consumoTotal = (Number(user.gastado) || 0) + (Number(user.comprometido) || 0);
        var esSobregirado = (limite > 0 && (consumoTotal / limite) >= 0.90);

        if (filtroSolvencia === 'SOLVENTE' && (eva.tieneMora || esSobregirado)) continue;
        if (filtroSolvencia === 'EN_MORA' && !eva.tieneMora) continue;
        if (filtroSolvencia === 'SOBREGIRADO' && !esSobregirado) continue;

        usuariosFiltrados.push(user);
    }

    // Actualizar contador de resultados
    var elemConteo = document.getElementById('conteoFiltradosUsuarios');
    if (elemConteo) {
        elemConteo.textContent = usuariosFiltrados.length + ' de ' + totalUsuarios + ' usuarios';
    }

    // Renderizar filas de la tabla
    cuerpoTabla.innerHTML = '';
    if (usuariosFiltrados.length === 0) {
        cuerpoTabla.innerHTML =
            '<tr><td colspan="10">' +
            '  <div class="estado-vacio">' +
            '    <div class="estado-vacio__icono">' + icono('usuario', 32) + '</div>' +
            '    <div class="estado-vacio__titulo">No se encontraron usuarios</div>' +
            '    <div class="estado-vacio__descripcion">Ajuste los filtros o el texto de búsqueda para visualizar resultados.</div>' +
            '  </div>' +
            '</td></tr>';
        return;
    }

    for (var f = 0; f < usuariosFiltrados.length; f++) {
        var uItem = usuariosFiltrados[f];
        var eMora = (typeof evaluarMoraUsuario === 'function') ? evaluarMoraUsuario(uItem.id, financiamientos) : { tieneMora: false, totalMoraUSD: 0 };
        var limGasto = Number(uItem.limiteGasto) || 0;
        var gast = Number(uItem.gastado) || 0;
        var comp = Number(uItem.comprometido) || 0;
        var disp = Math.max(0, limGasto - (gast + comp));
        var activo = (uItem.activo !== false);

        var badgeSolvencia = '';
        if (eMora.tieneMora) {
            badgeSolvencia = '<span class="badge-peligro" style="font-size:0.75rem;">MORA (' + monedaActiva(eMora.totalMoraUSD) + ')</span>';
        } else if (limGasto > 0 && ((gast + comp) / limGasto) >= 0.90) {
            badgeSolvencia = '<span class="badge-alerta" style="font-size:0.75rem;">SOBREGIRADO</span>';
        } else {
            badgeSolvencia = '<span class="badge-exito" style="font-size:0.75rem;">SOLVENTE</span>';
        }

        var badgeAcceso = activo
            ? '<span class="badge-exito" style="font-size:0.75rem;">ACTIVO</span>'
            : '<span class="badge-peligro" style="font-size:0.75rem;">SUSPENDIDO</span>';

        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td><strong>' + escaparHtml(uItem.nombre) + '</strong><br><small class="texto-secundario">@' + escaparHtml(uItem.usuario) + '</small></td>' +
            '<td><span class="badge-sector" style="font-size:0.72rem;">' + escaparHtml(uItem.perfil || 'Usuario') + '</span></td>' +
            '<td>' + escaparHtml(uItem.estado || 'N/A') + '</td>' +
            '<td><strong>' + monedaActiva(limGasto) + '</strong></td>' +
            '<td>' + monedaActiva(gast) + '</td>' +
            '<td>' + monedaActiva(comp) + '</td>' +
            '<td><strong class="sv-text-accent">' + monedaActiva(disp) + '</strong></td>' +
            '<td>' + badgeSolvencia + '</td>' +
            '<td>' + badgeAcceso + '</td>' +
            '<td>' +
            '  <button type="button" class="boton boton--secundario boton--sm" onclick="abrirExpedienteUsuario(' + uItem.id + ')" title="Ver expediente integral">' +
            '    ' + icono('ojo', 14) + ' Expediente' +
            '  </button> ' +
            '  <button type="button" class="boton ' + (activo ? 'boton--peligro' : 'boton--exito') + ' boton--sm" onclick="alternarEstadoActivoUsuario(' + uItem.id + ')" title="' + (activo ? 'Suspender acceso' : 'Reactivar acceso') + '">' +
            '    ' + (activo ? icono('cerrar', 14) + ' Suspender' : icono('check', 14) + ' Reactivar') +
            '  </button>' +
            '</td>';

        cuerpoTabla.appendChild(tr);
    }
}

/**
 * Abre el expediente integral de un usuario específico en un modal interactivo.
 * @param {number} usuarioId - ID del usuario.
 */
function abrirExpedienteUsuario(usuarioId) {
    _usuarioExpedienteActualId = Number(usuarioId);
    var usuarios = obtenerUsuarios();
    var usuario = null;
    for (var u = 0; u < usuarios.length; u++) {
        if (usuarios[u].id === _usuarioExpedienteActualId) {
            usuario = usuarios[u];
            break;
        }
    }
    if (!usuario) {
        mostrarNotificacion('Usuario no encontrado.', 'error');
        return;
    }

    var modal = document.getElementById('modalExpedienteUsuario');
    var tit = document.getElementById('modalExpedienteTitulo');
    var sub = document.getElementById('modalExpedienteSubtitulo');
    var ficha = document.getElementById('modalExpedienteFicha');

    if (tit) tit.textContent = 'Expediente Institucional: ' + usuario.nombre;
    if (sub) sub.textContent = (usuario.perfil || 'Usuario') + ' | ' + (usuario.estado || 'Venezuela') + ' | Cuenta: @' + usuario.usuario;

    var cotizaciones = obtenerCotizaciones();
    var financiamientos = (typeof obtenerFinanciamientos === 'function') ? obtenerFinanciamientos() : [];
    var evaMora = (typeof evaluarMoraUsuario === 'function') ? evaluarMoraUsuario(usuario.id, financiamientos) : { tieneMora: false, totalMoraUSD: 0 };

    var lim = Number(usuario.limiteGasto) || 0;
    var gast = Number(usuario.gastado) || 0;
    var comp = Number(usuario.comprometido) || 0;
    var disp = Math.max(0, lim - (gast + comp));
    var pctUso = lim > 0 ? Math.min(100, Math.round(((gast + comp) / lim) * 100)) : 0;
    var activo = (usuario.activo !== false);

    if (ficha) {
        ficha.innerHTML =
            '<div class="grid-cuatro-columnas sv-mb-sm">' +
            '  <div class="tarjeta-kpi" style="padding: 0.6rem 0.8rem;">' +
            '    <div class="tarjeta-kpi__etiqueta">Cupo Asignado</div>' +
            '    <div class="tarjeta-kpi__valor sv-font-md">' + monedaActiva(lim) + '</div>' +
            '  </div>' +
            '  <div class="tarjeta-kpi" style="padding: 0.6rem 0.8rem;">' +
            '    <div class="tarjeta-kpi__etiqueta">Gastado Definitivo</div>' +
            '    <div class="tarjeta-kpi__valor sv-font-md sv-text-peligro">' + monedaActiva(gast) + '</div>' +
            '  </div>' +
            '  <div class="tarjeta-kpi" style="padding: 0.6rem 0.8rem;">' +
            '    <div class="tarjeta-kpi__etiqueta">Comprometido</div>' +
            '    <div class="tarjeta-kpi__valor sv-font-md sv-text-alerta">' + monedaActiva(comp) + '</div>' +
            '  </div>' +
            '  <div class="tarjeta-kpi" style="padding: 0.6rem 0.8rem;">' +
            '    <div class="tarjeta-kpi__etiqueta">Saldo Disponible</div>' +
            '    <div class="tarjeta-kpi__valor sv-font-md sv-text-exito">' + monedaActiva(disp) + '</div>' +
            '  </div>' +
            '</div>' +
            '<div class="sv-p-sm sv-bg-superficie sv-rounded sv-mb-sm">' +
            '  <div class="sv-flex-between sv-text-xs sv-mb-xs">' +
            '    <span>Consumo del cupo: <strong>' + pctUso + '%</strong></span>' +
            '    <span>Estado de Solvencia: <strong>' + (evaMora.tieneMora ? 'EN MORA (' + monedaActiva(evaMora.totalMoraUSD) + ')' : 'SOLVENTE AL DÍA') + '</strong></span>' +
            '  </div>' +
            '  <div class="barra-progreso-fin" style="height: 8px;">' +
            '    <div class="barra-progreso-fin__fill" style="width: ' + pctUso + '%; background-color: ' + (pctUso >= 90 ? 'var(--color-peligro)' : (pctUso >= 70 ? 'var(--color-advertencia)' : 'var(--color-exito)')) + ';"></div>' +
            '  </div>' +
            '</div>';
    }

    // Pestaña Balance y Cupo
    var contBalance = document.getElementById('contenidoExpedienteBalance');
    if (contBalance) {
        contBalance.innerHTML =
            '<div class="sv-grid-dos-columnas sv-gap-md">' +
            '  <div>' +
            '    <h4 class="sv-font-bold sv-mb-xs">Datos Institucionales</h4>' +
            '    <p class="sv-text-xs sv-mb-xs"><strong>Ingreso Mensual Declarado:</strong> ' + monedaActiva(usuario.ingresoMensual || 0) + '</p>' +
            '    <p class="sv-text-xs sv-mb-xs"><strong>Nivel Institucional:</strong> Nivel ' + (usuario.nivel || 1) + '</p>' +
            '    <p class="sv-text-xs sv-mb-xs"><strong>Factor de Cupo:</strong> ' + ((lim / (usuario.ingresoMensual || 1)).toFixed(1)) + 'x ingresos</p>' +
            '    <p class="sv-text-xs sv-mb-xs"><strong>Estado de Acceso:</strong> ' + (activo ? '<span class="badge-exito">Habilitado</span>' : '<span class="badge-peligro">Bloqueado / Suspendido</span>') + '</p>' +
            '  </div>' +
            '  <div>' +
            '    <h4 class="sv-font-bold sv-mb-xs">Control de Riesgo Financiero</h4>' +
            '    <p class="sv-text-xs sv-mb-xs"><strong>Cuotas en Mora Activa:</strong> ' + evaMora.cuotasEnMora + ' cuotas</p>' +
            '    <p class="sv-text-xs sv-mb-xs"><strong>Mora Monetaria Exigible:</strong> ' + monedaActiva(evaMora.totalMoraUSD) + '</p>' +
            '    <p class="sv-text-xs sv-mb-xs"><strong>Veredicto de Aprobación:</strong> ' + (evaMora.tieneMora ? '<span class="sv-text-peligro">BLOQUEADO POR MORA</span>' : '<span class="sv-text-exito">AUTORIZADO PARA COTIZAR</span>') + '</p>' +
            '  </div>' +
            '</div>';
    }

    // Pestaña Cotizaciones
    var cuerpoCots = document.getElementById('cuerpoTablaExpedienteCotizaciones');
    if (cuerpoCots) {
        cuerpoCots.innerHTML = '';
        var contC = 0;
        for (var c = 0; c < cotizaciones.length; c++) {
            var cot = cotizaciones[c];
            if (cot.usuarioId === usuario.id) {
                contC++;
                var badgeEstado = '<span class="badge-' + (cot.estado === 'APROBADA' || cot.estado === 'ENTREGADA' ? 'exito' : (cot.estado === 'RECHAZADA' ? 'peligro' : 'alerta')) + '">' + cot.estado + '</span>';
                var trC = document.createElement('tr');
                trC.innerHTML =
                    '<td><strong>' + escaparHtml(cot.correlativo) + '</strong></td>' +
                    '<td>' + escaparHtml(cot.nombreObra || 'Sin nombre') + '</td>' +
                    '<td>' + escaparHtml(cot.fechaCreacion) + '</td>' +
                    '<td><strong>' + monedaActiva(cot.totalUSD || cot.total) + '</strong></td>' +
                    '<td>' + badgeEstado + '</td>';
                cuerpoCots.appendChild(trC);
            }
        }
        if (contC === 0) {
            cuerpoCots.innerHTML = '<tr><td colspan="5" class="sv-text-center sv-text-muted sv-p-sm">No posee cotizaciones registradas.</td></tr>';
        }
    }

    // Pestaña Planes y Financiamiento
    var cuerpoPlanes = document.getElementById('cuerpoTablaExpedientePlanes');
    if (cuerpoPlanes) {
        cuerpoPlanes.innerHTML = '';
        var contP = 0;
        for (var p = 0; p < financiamientos.length; p++) {
            var pl = financiamientos[p];
            if (pl.usuarioId === usuario.id) {
                contP++;
                var badgeP = '<span class="badge-' + (pl.estado === 'PAGADO' ? 'exito' : (pl.estado === 'EN_MORA' ? 'peligro' : 'alerta')) + '">' + pl.estado + '</span>';
                var trP = document.createElement('tr');
                trP.innerHTML =
                    '<td><strong>' + escaparHtml(pl.nombrePlan || pl.tipoPlan) + '</strong></td>' +
                    '<td>' + escaparHtml(pl.correlativoCotizacion) + '</td>' +
                    '<td>' + monedaActiva(pl.totalFinanciado || pl.montoTotalUSD) + '</td>' +
                    '<td><strong class="sv-text-peligro">' + monedaActiva(pl.saldoPendiente) + '</strong></td>' +
                    '<td>' + badgeP + '</td>';
                cuerpoPlanes.appendChild(trP);
            }
        }
        if (contP === 0) {
            cuerpoPlanes.innerHTML = '<tr><td colspan="5" class="sv-text-center sv-text-muted sv-p-sm">No posee planes de financiamiento activos.</td></tr>';
        }
    }

    // Pestaña Libro Mayor de Movimientos
    var cuerpoMovs = document.getElementById('cuerpoTablaExpedienteMovimientos');
    if (cuerpoMovs) {
        cuerpoMovs.innerHTML = '';
        var movs = (typeof obtenerMovimientosPorUsuario === 'function') ? obtenerMovimientosPorUsuario(usuario.id) : [];
        for (var m = 0; m < movs.length; m++) {
            var mv = movs[m];
            var fTexto = mv.fechaISO ? mv.fechaISO.slice(0, 10) : 'Hoy';
            var trM = document.createElement('tr');
            trM.innerHTML =
                '<td>#' + mv.id + '</td>' +
                '<td>' + fTexto + '</td>' +
                '<td><span class="sv-badge sv-badge--info" style="font-size:0.7rem;">' + escaparHtml(mv.tipo) + (mv.cuotaNumero ? ' #' + mv.cuotaNumero : '') + '</span></td>' +
                '<td><code>' + escaparHtml(mv.referencia || 'N/A') + '</code></td>' +
                '<td>' + escaparHtml(mv.metodo || 'Transferencia') + '</td>' +
                '<td><strong>' + monedaActiva(mv.montoUSD) + '</strong></td>' +
                '<td><button type="button" class="boton boton--secundario boton--sm" onclick="abrirComprobantePago(' + mv.id + ')">' + icono('imprimir', 12) + ' Recibo</button></td>';
            cuerpoMovs.appendChild(trM);
        }
        if (movs.length === 0) {
            cuerpoMovs.innerHTML = '<tr><td colspan="7" class="sv-text-center sv-text-muted sv-p-sm">No registra amortizaciones ni cuotas pagadas aún.</td></tr>';
        }
    }

    // Acciones de cuenta (Suspender / Reactivar)
    var divAcciones = document.getElementById('accionesCuentaUsuario');
    if (divAcciones) {
        divAcciones.innerHTML =
            '<button type="button" class="boton ' + (activo ? 'boton--peligro' : 'boton--exito') + ' boton--sm" onclick="alternarEstadoActivoUsuario(' + usuario.id + ')">' +
            (activo ? icono('cerrar', 14) + ' Suspender Acceso a la Plataforma' : icono('check', 14) + ' Reactivar Acceso a la Plataforma') +
            '</button>';
    }

    cambiarTabExpediente('balance');
    if (modal) modal.classList.remove('oculto');
}

/**
 * Cierra el modal de expediente integral de usuario.
 */
function cerrarModalExpedienteUsuario() {
    var modal = document.getElementById('modalExpedienteUsuario');
    if (modal) modal.classList.add('oculto');
    _usuarioExpedienteActualId = null;
}

/**
 * Alterna entre pestañas internas del expediente de usuario.
 * @param {string} tabId - 'balance', 'cotizaciones', 'planes', 'movimientos'.
 */
function cambiarTabExpediente(tabId) {
    var tabs = ['balance', 'cotizaciones', 'planes', 'movimientos'];
    for (var i = 0; i < tabs.length; i++) {
        var t = tabs[i];
        var btn = document.getElementById('btnTabExp' + t.charAt(0).toUpperCase() + t.slice(1));
        var cont = document.getElementById('tabExpediente' + t.charAt(0).toUpperCase() + t.slice(1));
        if (btn) btn.classList.remove('activa');
        if (cont) cont.classList.add('oculto');
    }
    var btnAct = document.getElementById('btnTabExp' + tabId.charAt(0).toUpperCase() + tabId.slice(1));
    var contAct = document.getElementById('tabExpediente' + tabId.charAt(0).toUpperCase() + tabId.slice(1));
    if (btnAct) btnAct.classList.add('activa');
    if (contAct) contAct.classList.remove('oculto');
}

/**
 * Activa o suspende el acceso de un usuario.
 * @param {number} usuarioId - ID del usuario a modificar.
 */
function alternarEstadoActivoUsuario(usuarioId) {
    usuarioId = Number(usuarioId);
    if (sesionUsuario && sesionUsuario.id === usuarioId) {
        mostrarNotificacion('Operación denegada: Un funcionario no puede suspender su propia cuenta de acceso.', 'advertencia');
        return;
    }

    var usuarios = obtenerUsuarios();
    var modificado = null;
    for (var i = 0; i < usuarios.length; i++) {
        if (usuarios[i].id === usuarioId) {
            usuarios[i].activo = (usuarios[i].activo === false ? true : false);
            modificado = usuarios[i];
            break;
        }
    }

    if (!modificado) return;

    guardarUsuarios(usuarios);

    var accionAudit = modificado.activo ? 'USUARIO_REACTIVADO' : 'USUARIO_SUSPENDIDO';
    var detalleAudit = (modificado.activo ? 'Reactivación' : 'Suspensión') + ' de la cuenta de ' + modificado.nombre + ' (@' + modificado.usuario + ').';
    if (typeof registrarEnBitacora === 'function') {
        registrarEnBitacora(sesionUsuario ? sesionUsuario.nombre : 'Gobernación', accionAudit, detalleAudit);
    }

    mostrarNotificacion('La cuenta de ' + modificado.nombre + ' fue ' + (modificado.activo ? 'reactivada' : 'suspendida') + ' con éxito.', 'info');

    // Actualizar vista de tabla
    renderizarModuloEstadoUsuarios();

    // Si el expediente está abierto, actualizarlo
    if (_usuarioExpedienteActualId === usuarioId) {
        abrirExpedienteUsuario(usuarioId);
    }
}

/**
 * Imprime la ficha del expediente de usuario.
 */
function imprimirExpedienteUsuario() {
    window.print();
}

/**
 * Exporta el directorio integral de usuarios a formato CSV sanitizado.
 */
function exportarDirectorioUsuariosCSV() {
    var usuarios = obtenerUsuarios();
    var financiamientos = (typeof obtenerFinanciamientos === 'function') ? obtenerFinanciamientos() : [];

    var filas = [];
    filas.push(['ID', 'Usuario', 'Nombre', 'Perfil', 'Estado', 'LimiteGastoUSD', 'GastadoUSD', 'ComprometidoUSD', 'DisponibleUSD', 'Solvencia', 'Acceso']);

    for (var i = 0; i < usuarios.length; i++) {
        var u = usuarios[i];
        var eva = (typeof evaluarMoraUsuario === 'function') ? evaluarMoraUsuario(u.id, financiamientos) : { tieneMora: false };
        var lim = Number(u.limiteGasto) || 0;
        var gast = Number(u.gastado) || 0;
        var comp = Number(u.comprometido) || 0;
        var disp = Math.max(0, lim - (gast + comp));
        var sol = eva.tieneMora ? 'EN_MORA' : ((lim > 0 && ((gast + comp) / lim) >= 0.90) ? 'SOBREGIRADO' : 'SOLVENTE');
        var acc = (u.activo !== false) ? 'ACTIVO' : 'SUSPENDIDO';

        filas.push([
            u.id,
            sanitizarCSV(u.usuario),
            sanitizarCSV(u.nombre),
            sanitizarCSV(u.perfil),
            sanitizarCSV(u.estado),
            lim.toFixed(2),
            gast.toFixed(2),
            comp.toFixed(2),
            disp.toFixed(2),
            sol,
            acc
        ]);
    }

    var contenidoCSV = '\uFEFF';
    for (var r = 0; r < filas.length; r++) {
        contenidoCSV += filas[r].join(';') + '\r\n';
    }

    descargarArchivo(contenidoCSV, 'directorio_usuarios_sicop_' + formatearFechaHoy() + '.csv', 'text/csv;charset=utf-8;');
    mostrarNotificacion('Directorio de usuarios exportado en formato CSV.', 'exito');
}

/**
 * Abre el comprobante oficial de pago / recibo de caja de un movimiento.
 * @param {number} movimientoId - ID del movimiento en el libro mayor.
 */
function abrirComprobantePago(movimientoId) {
    movimientoId = Number(movimientoId);
    var movs = (typeof obtenerMovimientos === 'function') ? obtenerMovimientos() : [];
    var mov = null;
    for (var i = 0; i < movs.length; i++) {
        if (movs[i].id === movimientoId) {
            mov = movs[i];
            break;
        }
    }
    if (!mov) {
        mostrarNotificacion('Comprobante de movimiento no encontrado.', 'error');
        return;
    }

    var modal = document.getElementById('modalComprobantePago');
    var tasa = (typeof obtenerTasaBCVValida === 'function') ? obtenerTasaBCVValida() : 900.00;

    var numRecibo = 'REC-' + String(100000 + mov.id).slice(1);
    var concepto = (mov.tipo === 'INICIAL')
        ? 'Pago de Cuota Inicial (Down Payment 50%)'
        : 'Amortización de Cuota Ordinaria #' + (mov.cuotaNumero || '1');

    var elemNum = document.getElementById('comprobanteNumeroRecibo');
    if (elemNum) elemNum.textContent = numRecibo;

    var elemFecha = document.getElementById('comprobanteFechaEmision');
    if (elemFecha) elemFecha.textContent = mov.fechaISO ? (mov.fechaISO.slice(0, 10) + ' ' + mov.fechaISO.slice(11, 19)) : 'Fecha oficial';

    var elemCliente = document.getElementById('comprobanteClienteNombre');
    if (elemCliente) elemCliente.textContent = mov.cliente || 'Ente Contratante';

    var elemCot = document.getElementById('comprobanteCotizacionRef');
    if (elemCot) elemCot.textContent = mov.correlativoCotizacion || 'N/A';

    var elemConc = document.getElementById('comprobanteConcepto');
    if (elemConc) elemConc.textContent = concepto;

    var elemMetodo = document.getElementById('comprobanteMetodoPago');
    if (elemMetodo) elemMetodo.textContent = mov.metodo || 'Transferencia Bancaria';

    var elemRef = document.getElementById('comprobanteReferenciaBancaria');
    if (elemRef) elemRef.textContent = mov.referencia || 'REF-DIRECTA';

    var elemTasa = document.getElementById('comprobanteTasaBCV');
    if (elemTasa) elemTasa.textContent = 'Bs. ' + tasa.toFixed(2) + ' por USD';

    var elemUSD = document.getElementById('comprobanteMontoUSD');
    if (elemUSD) elemUSD.textContent = '$' + formatearMoneda(mov.montoUSD);

    var elemBs = document.getElementById('comprobanteMontoBs');
    if (elemBs) elemBs.textContent = 'Bs. ' + formatearMoneda(mov.montoUSD * tasa);

    var elemHash = document.getElementById('comprobanteHashSeguridad');
    if (elemHash) {
        var hStr = 'SICOP-REC-' + mov.id + '-' + (mov.referencia || 'REF') + '-' + Math.round(mov.montoUSD);
        elemHash.textContent = 'HASH INTEGRIDAD: ' + hStr.toUpperCase();
    }

    if (modal) modal.classList.remove('oculto');
}

/**
 * Cierra el modal del comprobante de pago.
 */
function cerrarModalComprobantePago() {
    var modal = document.getElementById('modalComprobantePago');
    if (modal) modal.classList.add('oculto');
}

/**
 * Imprime el comprobante de pago.
 */
function imprimirComprobantePago() {
    window.print();
}

/**
 * Validador automático idempotente de vencimientos de cuotas al inicio de la aplicación.
 */
function verificarAlertasVencimientosAutomaticas() {
    if (typeof obtenerFinanciamientos !== 'function' || typeof guardarFinanciamientos !== 'function') return;
    try {
        var financiamientos = obtenerFinanciamientos();
        var hoy = new Date();
        var huboCambios = false;

        for (var i = 0; i < financiamientos.length; i++) {
            var f = financiamientos[i];
            if (!f.cuotas) continue;

            var tieneVencida = false;
            for (var c = 0; c < f.cuotas.length; c++) {
                var cuota = f.cuotas[c];
                if (cuota.estado === 'PENDIENTE' && cuota.fechaVencimientoISO) {
                    var fVenc = new Date(cuota.fechaVencimientoISO);
                    if (hoy > fVenc) {
                        cuota.estado = 'VENCIDA';
                        tieneVencida = true;
                        huboCambios = true;
                    }
                } else if (cuota.estado === 'VENCIDA') {
                    tieneVencida = true;
                }
            }

            if (tieneVencida && f.estado !== 'EN_MORA' && f.estado !== 'PAGADO') {
                f.estado = 'EN_MORA';
                huboCambios = true;
            }
        }

        if (huboCambios) {
            guardarFinanciamientos(financiamientos);
        }
    } catch (eAuto) {
        console.warn('Alerta automática de vencimientos:', eAuto);
    }
}

// ============================================================
// 19. CONEXIÓN DE EVENTOS DE INTERFAZ
// ============================================================

function conectarEventosGenerales() {
    // 0. Protección contra pérdida accidental de datos en cotizaciones en curso
    window.addEventListener('beforeunload', function (e) {
        if (typeof cotizacionEnEdicion !== 'undefined' && cotizacionEnEdicion && cotizacionEnEdicion.items && cotizacionEnEdicion.items.length > 0) {
            e.preventDefault();
            e.returnValue = 'Tiene una cotización en progreso. ¿Está seguro de salir?';
            return e.returnValue;
        }
    });

    // 1. Evento de Login
    var formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', function (e) {
            e.preventDefault();
            var usuarioInput = document.getElementById('inputUsuarioLogin').value.trim();
            var claveInput = document.getElementById('inputClaveLogin').value.trim();

            var usuarios = obtenerUsuarios();
            var encontrado = null;

            for (var i = 0; i < usuarios.length; i++) {
                if (usuarios[i].usuario === usuarioInput && usuarios[i].clave === claveInput) {
                    encontrado = usuarios[i];
                    break;
                }
            }

            if (encontrado) {
                if (encontrado.activo === false) {
                    mostrarNotificacion('Acceso denegado: Esta cuenta se encuentra suspendida o desactivada por la administración.', 'error');
                    return;
                }
                sesionUsuario = encontrado;
                guardarSesionActual(encontrado);
                registrarEnBitacora(encontrado.nombre, 'INICIO_SESION', 'Ingreso exitoso al sistema.');
                mostrarAplicacion();
            } else {
                mostrarNotificacion('Credenciales inválidas. Compruebe usuario y clave o use el selector de demostración.', 'error');
            }
        });
    }

    // Selector rápido de usuario en login
    var selRapido = document.getElementById('selectorUsuarioRapido');
    if (selRapido) {
        selRapido.addEventListener('change', function () {
            var usrVal = this.value;
            if (!usrVal) return;
            var usuarios = obtenerUsuarios();
            for (var i = 0; i < usuarios.length; i++) {
                if (usuarios[i].usuario === usrVal) {
                    document.getElementById('inputUsuarioLogin').value = usuarios[i].usuario;
                    document.getElementById('inputClaveLogin').value = usuarios[i].clave;
                    break;
                }
            }
        });
    }

    // Botón Cerrar Sesión
    var btnCerrar = document.getElementById('btnCerrarSesion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', function () {
            if (sesionUsuario) {
                registrarEnBitacora(sesionUsuario.nombre, 'CIERRE_SESION', 'Salida del sistema.');
            }
            cerrarSesionStorage();
            sesionUsuario = null;
            mostrarPantallaLogin();
        });
    }

    // Selector de Moneda Global en el Encabezado
    var selectMoneda = document.getElementById('selectorMonedaGlobal');
    if (selectMoneda) {
        selectMoneda.addEventListener('change', function () {
            cambiarMonedaGlobal(this.value);
        });
    }

    // Botones de navegación de módulos
    var botonesNav = document.querySelectorAll('.nav-btn');
    for (var b = 0; b < botonesNav.length; b++) {
        botonesNav[b].addEventListener('click', function () {
            var modulo = this.getAttribute('data-modulo');
            if (modulo) cambiarPestana(modulo);
        });
    }

    // Calculadora: cambio de tipo de obra y cálculos
    var selTipoCalc = document.getElementById('calcTipoObra');
    if (selTipoCalc) {
        selTipoCalc.addEventListener('change', function () {
            cambiarCamposCalculadora(this.value);
        });
    }
    var btnCalcObra = document.getElementById('btnCalcularObra');
    if (btnCalcObra) {
        btnCalcObra.addEventListener('click', ejecutarCalculoObra);
    }
    var btnTransf = document.getElementById('btnTransferirACotizador');
    if (btnTransf) {
        btnTransf.addEventListener('click', transferirEstimacionACotizador);
    }

    // Asistente: Botón Atrás y Siguiente
    var btnAtrasAsistente = document.getElementById('btnAtrasAsistente');
    if (btnAtrasAsistente) {
        btnAtrasAsistente.addEventListener('click', retrocederPasoCotizador);
    }
    var btnSigAsistente = document.getElementById('btnSiguienteAsistente');
    if (btnSigAsistente) {
        btnSigAsistente.addEventListener('click', avanzarPasoCotizador);
    }

    // Asistente: Banner de borrador guardado
    var btnContBorrador = document.getElementById('btnContinuarBorrador');
    if (btnContBorrador) {
        btnContBorrador.addEventListener('click', continuarBorradorGuardado);
    }
    var btnDescBorrador = document.getElementById('btnDescartarBorradorGuardado');
    if (btnDescBorrador) {
        btnDescBorrador.addEventListener('click', descartarBorradorGuardado);
    }

    // Asistente: Botón para ir a calculadora desde Paso 2
    var btnCalcPaso2 = document.getElementById('btnIrACalculadoraDesdePaso2');
    if (btnCalcPaso2) {
        btnCalcPaso2.addEventListener('click', function () {
            // Forzar guardado ANTES de navegar
            try { guardarBorradorActualEnStorage(); } catch (e) {}
            cambiarPestana('calculadora');
        });
    }

    // Asistente: Botones de plantillas de obra
    var botonesPlantillas = document.querySelectorAll('.btn-plantilla');
    for (var p = 0; p < botonesPlantillas.length; p++) {
        botonesPlantillas[p].addEventListener('click', function () {
            var clave = this.getAttribute('data-plantilla');
            if (clave) aplicarPlantillaObra(clave);
        });
    }

    // Asistente: Reactividad en cambio de ciudad, tasa y estado para total en vivo
    var selectCiudad = document.getElementById('selectCiudadCotizador');
    if (selectCiudad) {
        selectCiudad.addEventListener('change', function () {
            actualizarTotalEnVivo();
            programarGuardadoBorrador();
        });
    }
    var inputTasa = document.getElementById('inputTasaBCVCotizador');
    if (inputTasa) {
        inputTasa.addEventListener('input', function () {
            var val = parseFloat(inputTasa.value);
            if (!isNaN(val) && val > 0) {
                guardarTasaBCV(val, formatearFechaHoy());
                var badgeFecha = document.getElementById('badgeFechaTasaBCV');
                if (badgeFecha) {
                    badgeFecha.textContent = 'Fijada: ' + formatearFechaHoy() + ' (editable)';
                }
                var avisoDesact = document.getElementById('avisoTasaBCVDesactualizada');
                if (avisoDesact) avisoDesact.classList.add('oculto');
            }
            actualizarTotalEnVivo();
            programarGuardadoBorrador();
        });
    }

    // Bandeja de Notificaciones: apertura y marcado
    var btnCampana = document.getElementById('btnCampanaNotificaciones');
    var panelNotifs = document.getElementById('panelDropdownNotificaciones');
    var btnMarcarLeidas = document.getElementById('btnMarcarNotifsLeidas');

    if (btnCampana && panelNotifs) {
        btnCampana.addEventListener('click', function (e) {
            e.stopPropagation();
            var estaOculto = panelNotifs.classList.contains('oculto');
            if (estaOculto) {
                actualizarBandejaNotificaciones();
                panelNotifs.classList.remove('oculto');
                btnCampana.setAttribute('aria-expanded', 'true');
            } else {
                panelNotifs.classList.add('oculto');
                btnCampana.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('click', function (e) {
            if (!panelNotifs.contains(e.target) && e.target !== btnCampana && !btnCampana.contains(e.target)) {
                panelNotifs.classList.add('oculto');
                btnCampana.setAttribute('aria-expanded', 'false');
            }
        });
    }

    if (btnMarcarLeidas) {
        btnMarcarLeidas.addEventListener('click', function (e) {
            e.stopPropagation();
            if (sesionUsuario) {
                marcarNotificacionesLeidas(sesionUsuario.id);
                actualizarBandejaNotificaciones();
            }
        });
    }
    var selectEstadoObra = document.getElementById('selectEstadoObraCotizador');
    if (selectEstadoObra) {
        selectEstadoObra.addEventListener('change', function () {
            actualizarTotalEnVivo();
            programarGuardadoBorrador();
        });
    }
    var inputNombreObra = document.getElementById('inputNombreObra');
    if (inputNombreObra) {
        inputNombreObra.addEventListener('input', function () {
            limpiarErrorCampo('inputNombreObra');
            programarGuardadoBorrador();
        });
    }
    var inputNotasObra = document.getElementById('inputNotasObra');
    if (inputNotasObra) {
        inputNotasObra.addEventListener('input', function () {
            programarGuardadoBorrador();
        });
    }

    // Modal Rechazo de Aprobaciones: Cancelar y Confirmar
    var btnCancRechazo = document.getElementById('btnCancelarRechazo');
    if (btnCancRechazo) {
        btnCancRechazo.addEventListener('click', cerrarTodosLosModales);
    }
    var btnConfRechazo = document.getElementById('btnConfirmarRechazo');
    if (btnConfRechazo) {
        btnConfRechazo.addEventListener('click', confirmarRechazoDesdeModal);
    }

    // Modal Pago de Cuota: Confirmar y Cancelar
    var btnConfPagoCuota = document.getElementById('btnConfirmarPagoCuota');
    if (btnConfPagoCuota) {
        btnConfPagoCuota.addEventListener('click', confirmarPagoCuotaDesdeModal);
    }
    var btnCancPagoCuota = document.getElementById('btnCancelarPagoCuota');
    if (btnCancPagoCuota) {
        btnCancPagoCuota.addEventListener('click', cerrarModalPagoCuota);
    }

    // Asistente Paso 3: Botón ¿Cómo se calculó esto?
    var btnComoSeCalc = document.getElementById('btnComoSeCalculoCotizador');
    if (btnComoSeCalc) {
        btnComoSeCalc.addEventListener('click', function () {
            abrirModalComoSeCalculo();
        });
    }

    // Modal Pedagógico: Cerrar
    var btnCerrarComoSeCalc = document.getElementById('btnCerrarModalComoSeCalculo');
    if (btnCerrarComoSeCalc) {
        btnCerrarComoSeCalc.addEventListener('click', cerrarModalComoSeCalculo);
    }
    var btnEntendidoComoSeCalc = document.getElementById('btnEntendidoModalComoSeCalculo');
    if (btnEntendidoComoSeCalc) {
        btnEntendidoComoSeCalc.addEventListener('click', cerrarModalComoSeCalculo);
    }

    // Modal Confirmación: Conectar Aceptar y Cancelar
    var btnOkModal = document.getElementById('btnAceptarModalConfirmacion');
    if (btnOkModal) {
        btnOkModal.addEventListener('click', function () {
            if (typeof accionConfirmacionModal === 'function') {
                var cb = accionConfirmacionModal;
                cerrarModalConfirmacion();
                cb();
            } else {
                cerrarModalConfirmacion();
            }
        });
    }
    var btnCancelModal = document.getElementById('btnCancelarModalConfirmacion');
    if (btnCancelModal) {
        btnCancelModal.addEventListener('click', cerrarModalConfirmacion);
    }

    // Asistente Paso 4: Botones finales
    var btnGuardarBorrador = document.getElementById('btnGuardarBorrador');
    if (btnGuardarBorrador) {
        btnGuardarBorrador.addEventListener('click', function () {
            guardarCotizacionComo('BORRADOR');
        });
    }
    var btnEnviarGobernacion = document.getElementById('btnEnviarGobernacion');
    if (btnEnviarGobernacion) {
        btnEnviarGobernacion.addEventListener('click', function () {
            guardarCotizacionComo('ENVIADA');
        });
    }
    var btnCancelarCot = document.getElementById('btnCancelarCotizacion');
    if (btnCancelarCot) {
        btnCancelarCot.addEventListener('click', cancelarCotizacionEnEdicion);
    }
    var btnVerDoc = document.getElementById('btnVerDocImprimible');
    if (btnVerDoc) {
        btnVerDoc.addEventListener('click', function () {
            if (cotizacionEnEdicion) {
                documentoActual = cotizacionEnEdicion;
                renderizarDocumentoImprimible(documentoActual);
            }
        });
    }
    var btnShareWA = document.getElementById('btnCompartirWhatsApp');
    if (btnShareWA) {
        btnShareWA.addEventListener('click', compartirDocumentoWhatsApp);
    }

    // Accesibilidad WCAG 2.1 AA: Escape para cerrar modales y focus trap para navegación por teclado
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            cerrarTodosLosModales();
        }
        if (e.key === 'Tab' || e.keyCode === 9) {
            var modalActivo = document.querySelector('.modal-fondo:not(.oculto), .vista-imprimible:not(.oculto)');
            if (!modalActivo) return;
            var interactivos = modalActivo.querySelectorAll('button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
            if (!interactivos.length) return;
            var primero = interactivos[0];
            var ultimo = interactivos[interactivos.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === primero) {
                    e.preventDefault();
                    ultimo.focus();
                }
            } else {
                if (document.activeElement === ultimo) {
                    e.preventDefault();
                    primero.focus();
                }
            }
        }
    });

    // Filtro de historial
    var filtroHistorial = document.getElementById('filtroEstadoHistorial');
    if (filtroHistorial) {
        filtroHistorial.addEventListener('change', renderizarModuloHistorial);
    }

    // Importación de archivo JSON
    var inputImportar = document.getElementById('inputImportarJSON');
    if (inputImportar) {
        inputImportar.addEventListener('change', importarDatosJSON);
    }

    // Modo Demostración en Respaldo
    var btnCargarDemo = document.getElementById('btnCargarDatosDemo');
    if (btnCargarDemo) {
        btnCargarDemo.addEventListener('click', ejecutarCargaDatosDemo);
    }
    var btnVaciarDemo = document.getElementById('btnVaciarTodoDemo');
    if (btnVaciarDemo) {
        btnVaciarDemo.addEventListener('click', ejecutarVaciadoTodoDemo);
    }

    // Botón Alternar Tema Claro / Oscuro
    var btnTema = document.getElementById('btnAlternarTema');
    if (btnTema) {
        btnTema.addEventListener('click', alternarTema);
    }

    // Botón flotante Volver Arriba
    var btnScroll = document.getElementById('btnScrollTop');
    if (btnScroll) {
        window.addEventListener('scroll', function () {
            var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
            if (scrollY > 400) {
                btnScroll.classList.remove('oculto');
            } else {
                btnScroll.classList.add('oculto');
            }
        });
        btnScroll.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Botón Menú Móvil (Hamburguesa) y Overlay
    var btnMenu = document.getElementById('btnMenuMovil');
    var overlay = document.getElementById('sidebarOverlay');
    if (btnMenu) {
        btnMenu.addEventListener('click', function () {
            var sidebar = document.getElementById('sidebarApp');
            if (sidebar) sidebar.classList.toggle('abierta');
            if (overlay) overlay.classList.toggle('activa');
        });
    }
    if (overlay) {
        overlay.addEventListener('click', function () {
            var sidebar = document.getElementById('sidebarApp');
            if (sidebar) sidebar.classList.remove('abierta');
            overlay.classList.remove('activa');
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.keyCode === 27) cerrarTodosLosModales();
        if (e.key === 'Tab' || e.keyCode === 9) {
            var m = document.querySelector('.modal-fondo:not(.oculto) .modal-caja');
            if (!m) return;
            var f = m.querySelectorAll('button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])');
            if (!f.length) return;
            var p = f[0], u = f[f.length - 1];
            if (e.shiftKey && document.activeElement === p) {
                e.preventDefault(); u.focus();
            } else if (!e.shiftKey && document.activeElement === u) {
                e.preventDefault(); p.focus();
            }
        }
    });
    var btnReparar = document.getElementById('btnRepararUsuariosDemo');
    if (btnReparar) {
        btnReparar.addEventListener('click', repararUsuariosDemo);
    }

    // Eventos del Módulo de Estado Integral de Usuarios
    var bUsr = document.getElementById('buscarUsuarioAdmin');
    if (bUsr) bUsr.addEventListener('input', renderizarModuloEstadoUsuarios);

    var fPerf = document.getElementById('filtroPerfilAdmin');
    if (fPerf) fPerf.addEventListener('change', renderizarModuloEstadoUsuarios);

    var fCta = document.getElementById('filtroEstadoCuentaAdmin');
    if (fCta) fCta.addEventListener('change', renderizarModuloEstadoUsuarios);

    var fSolv = document.getElementById('filtroEstadoFinancieroAdmin');
    if (fSolv) fSolv.addEventListener('change', renderizarModuloEstadoUsuarios);

    var btnExpUsrCSV = document.getElementById('btnExportarUsuariosCSV');
    if (btnExpUsrCSV) btnExpUsrCSV.addEventListener('click', exportarDirectorioUsuariosCSV);

    var btnRecUsr = document.getElementById('btnRecargarEstadoUsuarios');
    if (btnRecUsr) btnRecUsr.addEventListener('click', renderizarModuloEstadoUsuarios);

    // Contador de caracteres interactivo para rechazo de cotización (mínimo 10 caracteres)
    var txtRechazo = document.getElementById('inputMotivoRechazo');
    var cntRechazo = document.getElementById('contadorCaracteresRechazo');
    if (txtRechazo && cntRechazo) {
        txtRechazo.addEventListener('input', function () {
            var longitud = this.value.trim().length;
            cntRechazo.textContent = longitud + ' / 10';
            if (longitud >= 10) {
                cntRechazo.style.color = 'var(--color-exito)';
            } else {
                cntRechazo.style.color = 'var(--color-peligro)';
            }
        });
    }
}

// Exposición en ámbito global window para manejadores en línea
if (typeof window !== 'undefined') {
    window.renderizarModuloEstadoUsuarios = renderizarModuloEstadoUsuarios;
    window.abrirExpedienteUsuario = abrirExpedienteUsuario;
    window.cerrarModalExpedienteUsuario = cerrarModalExpedienteUsuario;
    window.cambiarTabExpediente = cambiarTabExpediente;
    window.alternarEstadoActivoUsuario = alternarEstadoActivoUsuario;
    window.imprimirExpedienteUsuario = imprimirExpedienteUsuario;
    window.exportarDirectorioUsuariosCSV = exportarDirectorioUsuariosCSV;
    window.abrirComprobantePago = abrirComprobantePago;
    window.cerrarModalComprobantePago = cerrarModalComprobantePago;
    window.imprimirComprobantePago = imprimirComprobantePago;
    window.verificarAlertasVencimientosAutomaticas = verificarAlertasVencimientosAutomaticas;
}

function repararUsuariosDemo() {
    var actuales = leerStorage(CLAVES_STORAGE.USUARIOS, []);
    if (!Array.isArray(actuales)) actuales = [];

    var agregados = 0;
    var corregidos = 0;

    for (var i = 0; i < USUARIOS_INICIALES.length; i++) {
        var seed = USUARIOS_INICIALES[i];
        var encontrado = -1;
        for (var j = 0; j < actuales.length; j++) {
            if (actuales[j].id === seed.id || actuales[j].usuario === seed.usuario) {
                encontrado = j;
                break;
            }
        }
        if (encontrado === -1) {
            var copia = {};
            for (var prop in seed) {
                if (seed.hasOwnProperty(prop)) copia[prop] = seed[prop];
            }
            actuales.push(copia);
            agregados++;
        } else {
            // Corregir perfil y nombre del existente
            var u = actuales[encontrado];
            if (u.perfil !== seed.perfil) {
                u.perfil = seed.perfil;
                corregidos++;
            }
            if (!u.nombre || u.nombre === '') { u.nombre = seed.nombre; }
            if (!u.clave || u.clave === '') { u.clave = seed.clave; }
        }
    }
    escribirStorage(CLAVES_STORAGE.USUARIOS, actuales);

    mostrarNotificacion(
        'Reparación completada: ' + agregados + ' usuarios agregados, ' +
        corregidos + ' perfiles corregidos. Recargando...',
        'exito', 2500);
    setTimeout(function () { location.reload(); }, 2000);
}

// Iniciar al cargar el documento
document.addEventListener('DOMContentLoaded', inicializarInterfaz);
