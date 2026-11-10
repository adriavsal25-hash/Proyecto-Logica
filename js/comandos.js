/* ============================================================
   SICOP-VE — Paleta de Comandos Accesible (Ctrl + K) (js/comandos.js)
   Proyecto Final: Lógica y Programación I
   Vanilla JavaScript ES5 — Cero dependencias externas
   ============================================================ */

(function () {
    'use strict';

    function navegarA(modulo) {
        if (typeof cambiarPestana === 'function') {
            cambiarPestana(modulo);
        } else if (typeof cambiarModulo === 'function') {
            cambiarModulo(modulo);
        }
    }

    var COMANDOS = [
        // Navegación de Módulos
        { id: 'nav-dashboard', titulo: 'Ir a Dashboard General', seccion: 'Navegación', icono: 'dashboard', accion: function() { navegarA('dashboard'); } },
        { id: 'nav-cotizador', titulo: 'Iniciar Nueva Cotización (Asistente)', seccion: 'Navegación', icono: 'cotizador', accion: function() { navegarA('cotizador'); } },
        { id: 'nav-calculadora', titulo: 'Abrir Calculadora de Materiales de Obra', seccion: 'Navegación', icono: 'calculadora', accion: function() { navegarA('calculadora'); } },
        { id: 'nav-ciudades', titulo: 'Consultar Dónde Comprar (Precios por Ciudad)', seccion: 'Navegación', icono: 'ciudades', accion: function() { navegarA('ciudades'); } },
        { id: 'nav-historial', titulo: 'Ver Historial de Cotizaciones', seccion: 'Navegación', icono: 'historial', accion: function() { navegarA('historial'); } },
        { id: 'nav-financiamiento', titulo: 'Mis Cuotas / Planes de Financiamiento Cashea', seccion: 'Navegación', icono: 'dinero', accion: function() { navegarA('financiamiento'); } },
        { id: 'nav-catalogo', titulo: 'Catálogo Maestro de Precios (Gobernación)', seccion: 'Navegación', icono: 'catalogo', accion: function() { navegarA('catalogo'); } },
        { id: 'nav-aprobaciones', titulo: 'Bandeja de Aprobaciones y Control de Fondos', seccion: 'Navegación', icono: 'aprobaciones', accion: function() { navegarA('aprobaciones'); } },
        { id: 'nav-cartera', titulo: 'Cartera Global de Financiamiento y Cobranzas (Gobernación)', seccion: 'Navegación', icono: 'supervision', accion: function() { navegarA('cartera'); } },
        { id: 'nav-supervision', titulo: 'Métricas de Supervisión y Rendición', seccion: 'Navegación', icono: 'supervision', accion: function() { navegarA('supervision'); } },
        { id: 'nav-bitacora', titulo: 'Bitácora de Auditoría del Sistema', seccion: 'Navegación', icono: 'bitacora', accion: function() { navegarA('bitacora'); } },
        { id: 'nav-respaldo', titulo: 'Exportar / Importar Respaldo de Datos', seccion: 'Navegación', icono: 'respaldo', accion: function() { navegarA('respaldo'); } },
        { id: 'nav-pruebas', titulo: 'Ejecutar Suite de Pruebas Unitarias', seccion: 'Navegación', icono: 'pruebas', accion: function() { window.open('pruebas.html', '_blank'); } },

        // Acciones del Sistema
        { id: 'act-moneda', titulo: 'Alternar Moneda Activa (USD / Bolívares)', seccion: 'Acciones', icono: 'dinero', accion: function() {
            var mActual = (typeof obtenerMonedaActiva === 'function') ? obtenerMonedaActiva() : 'USD';
            var nueva = (mActual === 'USD') ? 'Bs' : 'USD';
            if (typeof cambiarMonedaGlobal === 'function') {
                cambiarMonedaGlobal(nueva);
            } else if (typeof alternarMonedaGlobal === 'function') {
                alternarMonedaGlobal();
            } else if (typeof alternarMoneda === 'function') {
                alternarMoneda();
            }
        } },
        { id: 'act-tema', titulo: 'Alternar Tema Visual (Claro / Oscuro)', seccion: 'Acciones', icono: 'sol', accion: function() { if (typeof alternarTema === 'function') alternarTema(); } },
        { id: 'act-doc', titulo: 'Ver Documento de Cotización Imprimible', seccion: 'Acciones', icono: 'documento', accion: function() { if (typeof documentoActual !== 'undefined' && documentoActual) { renderizarDocumentoImprimible(documentoActual); } else { mostrarNotificacion('No hay una cotización activa para visualizar.', 'info'); } } },
        { id: 'act-exportar-json', titulo: 'Descargar Respaldo JSON del Sistema', seccion: 'Acciones', icono: 'descargar', accion: function() {
            if (typeof exportarDatosJSON === 'function') {
                exportarDatosJSON();
            } else if (typeof descargarRespaldoJSON === 'function') {
                descargarRespaldoJSON();
            }
        } },
        { id: 'act-top', titulo: 'Volver al Inicio de la Página (Scroll Top)', seccion: 'Acciones', icono: 'chevronAbajo', accion: function() { window.scrollTo({ top: 0, behavior: 'smooth' }); } },
        { id: 'act-tour', titulo: 'Iniciar Tour Guiado de Bienvenida', seccion: 'Acciones', icono: 'info', accion: function() { if (typeof iniciarTourGuiado === 'function') iniciarTourGuiado(); } }
    ];

    var modalPaleta = null;
    var inputBusqueda = null;
    var listaResultados = null;
    var indiceSeleccionado = 0;
    var resultadosActuales = [];

    function crearEstructuraModal() {
        if (modalPaleta) return;

        modalPaleta = document.createElement('div');
        modalPaleta.id = 'modalPaletaComandos';
        modalPaleta.className = 'modal-fondo oculto';
        modalPaleta.setAttribute('role', 'dialog');
        modalPaleta.setAttribute('aria-modal', 'true');
        modalPaleta.setAttribute('aria-label', 'Paleta de Comandos');

        var caja = document.createElement('div');
        caja.className = 'modal-caja sv-max-w-modal-md sv-paleta-caja';
        caja.style.padding = '0';
        caja.style.overflow = 'hidden';

        var cabecera = document.createElement('div');
        cabecera.style.padding = '0.85rem 1rem';
        cabecera.style.borderBottom = '1px solid var(--color-borde)';
        cabecera.style.display = 'flex';
        cabecera.style.alignItems = 'center';
        cabecera.style.gap = '0.5rem';

        var iconoLupa = document.createElement('span');
        iconoLupa.innerHTML = '🔍';
        cabecera.appendChild(iconoLupa);

        inputBusqueda = document.createElement('input');
        inputBusqueda.type = 'text';
        inputBusqueda.id = 'inputBusquedaPaleta';
        inputBusqueda.placeholder = 'Escriba un comando o módulo... (Esc para salir)';
        inputBusqueda.style.width = '100%';
        inputBusqueda.style.border = 'none';
        inputBusqueda.style.outline = 'none';
        inputBusqueda.style.background = 'transparent';
        inputBusqueda.style.fontSize = '0.95rem';
        inputBusqueda.style.color = 'var(--color-texto)';
        cabecera.appendChild(inputBusqueda);

        var atajoPill = document.createElement('span');
        atajoPill.className = 'badge-sector';
        atajoPill.textContent = 'ESC';
        atajoPill.style.cursor = 'pointer';
        atajoPill.onclick = cerrarPaleta;
        cabecera.appendChild(atajoPill);

        listaResultados = document.createElement('div');
        listaResultados.id = 'listaResultadosPaleta';
        listaResultados.style.maxHeight = '320px';
        listaResultados.style.overflowY = 'auto';
        listaResultados.style.padding = '0.5rem';

        var pie = document.createElement('div');
        pie.style.padding = '0.5rem 1rem';
        pie.style.borderTop = '1px solid var(--color-borde)';
        pie.style.fontSize = '0.72rem';
        pie.style.color = 'var(--color-texto-terciario)';
        pie.style.display = 'flex';
        pie.style.justifyContent = 'space-between';
        pie.innerHTML = '<span>↑↓ Navegar</span><span>↵ Ejecutar</span><span>Esc Cerrar</span>';

        caja.appendChild(cabecera);
        caja.appendChild(listaResultados);
        caja.appendChild(pie);
        modalPaleta.appendChild(caja);

        modalPaleta.addEventListener('click', function(e) {
            if (e.target === modalPaleta) cerrarPaleta();
        });

        inputBusqueda.addEventListener('input', function() {
            filtrarComandos(inputBusqueda.value);
        });

        inputBusqueda.addEventListener('keydown', manejarTeclasPaleta);

        document.body.appendChild(modalPaleta);
    }

    function abrirPaleta() {
        crearEstructuraModal();
        modalPaleta.classList.remove('oculto');
        inputBusqueda.value = '';
        filtrarComandos('');
        setTimeout(function() { inputBusqueda.focus(); }, 50);
    }

    function cerrarPaleta() {
        if (modalPaleta) {
            modalPaleta.classList.add('oculto');
        }
    }

    function filtrarComandos(termino) {
        var query = termino.toLowerCase().trim();
        var esGobernacion = false;
        if (typeof sesionUsuario !== 'undefined' && sesionUsuario && sesionUsuario.perfil) {
            var pNorm = String(sesionUsuario.perfil).toLowerCase()
                .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
                .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n');
            esGobernacion = (pNorm.indexOf('gobernacion') !== -1);
        }

        resultadosActuales = [];
        for (var i = 0; i < COMANDOS.length; i++) {
            var c = COMANDOS[i];
            // Si el comando requiere rol gobernación y no lo tiene, omitir
            if ((c.id === 'nav-catalogo' || c.id === 'nav-aprobaciones' || c.id === 'nav-cartera' || c.id === 'nav-supervision' || c.id === 'nav-bitacora') && !esGobernacion) {
                continue;
            }
            if (!query || c.titulo.toLowerCase().indexOf(query) !== -1 || c.seccion.toLowerCase().indexOf(query) !== -1) {
                resultadosActuales.push(c);
            }
        }

        indiceSeleccionado = 0;
        renderizarResultados();
    }

    function renderizarResultados() {
        if (!listaResultados) return;
        listaResultados.innerHTML = '';

        if (resultadosActuales.length === 0) {
            listaResultados.innerHTML = '<div style="padding:1rem; text-align:center; color:var(--color-texto-secundario); font-size:0.85rem;">No se encontraron comandos coincidentes.</div>';
            return;
        }

        for (var i = 0; i < resultadosActuales.length; i++) {
            var c = resultadosActuales[i];
            var item = document.createElement('div');
            item.className = 'sv-paleta-item' + (i === indiceSeleccionado ? ' sv-paleta-item--activo' : '');
            item.style.padding = '0.55rem 0.85rem';
            item.style.borderRadius = 'var(--radio-md)';
            item.style.cursor = 'pointer';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'space-between';
            item.style.fontSize = '0.85rem';
            item.style.marginBottom = '2px';
            if (i === indiceSeleccionado) {
                item.style.backgroundColor = 'var(--color-superficie-hover)';
            }

            var textoBloque = document.createElement('div');
            textoBloque.style.display = 'flex';
            textoBloque.style.alignItems = 'center';
            textoBloque.style.gap = '0.65rem';

            var iconoSpan = document.createElement('span');
            iconoSpan.setAttribute('data-icono', c.icono);
            iconoSpan.setAttribute('data-tamano', '16');

            var spanTitulo = document.createElement('span');
            spanTitulo.textContent = c.titulo;

            textoBloque.appendChild(iconoSpan);
            textoBloque.appendChild(spanTitulo);

            var badgeSec = document.createElement('span');
            badgeSec.className = 'badge-sector';
            badgeSec.textContent = c.seccion;
            badgeSec.style.fontSize = '0.68rem';

            item.appendChild(textoBloque);
            item.appendChild(badgeSec);

            (function(cmd, idx) {
                item.addEventListener('mouseenter', function() {
                    indiceSeleccionado = idx;
                    actualizarSeleccionVisual();
                });
                item.addEventListener('click', function() {
                    ejecutarComando(cmd);
                });
            })(c, i);

            listaResultados.appendChild(item);
        }

        if (typeof hidratarIconos === 'function') {
            hidratarIconos(listaResultados);
        }
    }

    function actualizarSeleccionVisual() {
        var items = listaResultados.children;
        for (var i = 0; i < items.length; i++) {
            if (i === indiceSeleccionado) {
                items[i].classList.add('sv-paleta-item--activo');
                items[i].style.backgroundColor = 'var(--color-superficie-hover)';
            } else {
                items[i].classList.remove('sv-paleta-item--activo');
                items[i].style.backgroundColor = 'transparent';
            }
        }
    }

    function manejarTeclasPaleta(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (resultadosActuales.length > 0) {
                indiceSeleccionado = (indiceSeleccionado + 1) % resultadosActuales.length;
                actualizarSeleccionVisual();
                scrollSeleccionadoEnVista();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (resultadosActuales.length > 0) {
                indiceSeleccionado = (indiceSeleccionado - 1 + resultadosActuales.length) % resultadosActuales.length;
                actualizarSeleccionVisual();
                scrollSeleccionadoEnVista();
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (resultadosActuales[indiceSeleccionado]) {
                ejecutarComando(resultadosActuales[indiceSeleccionado]);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cerrarPaleta();
        }
    }

    function scrollSeleccionadoEnVista() {
        var items = listaResultados.children;
        if (items[indiceSeleccionado]) {
            items[indiceSeleccionado].scrollIntoView({ block: 'nearest' });
        }
    }

    function ejecutarComando(cmd) {
        cerrarPaleta();
        if (cmd && typeof cmd.accion === 'function') {
            cmd.accion();
        }
    }

    // Atajo global de teclado Ctrl+K / Cmd+K
    document.addEventListener('keydown', function(e) {
        var esMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        var teclaMod = esMac ? e.metaKey : e.ctrlKey;
        if (teclaMod && (e.key === 'k' || e.key === 'K' || e.keyCode === 75)) {
            e.preventDefault();
            if (modalPaleta && !modalPaleta.classList.contains('oculto')) {
                cerrarPaleta();
            } else {
                abrirPaleta();
            }
        }
    });

    // Exponer función global para abrir desde botón o menú si se requiere
    window.abrirPaletaComandos = abrirPaleta;
})();

