/* ============================================================
   SICOP-VE — Tour Guiado / Onboarding Interactivo (js/tour.js)
   Proyecto Final: Lógica y Programación I
   Vanilla JavaScript ES5 — Cero dependencias externas
   ============================================================ */

(function () {
    'use strict';

    var CLAVE_TOUR = 'sicop_tour_completado_v1';
    var pasoActual = 0;
    var overlayTour = null;

    var PASOS = [
        {
            titulo: 'Bienvenido a SICOP-VE v7.0',
            texto: 'Sistema Integrado de Cotización y Control Presupuestario para Obras en Venezuela. Administre presupuestos institucionales, cotizaciones y suministros bajo normativa venezolana.',
            modulo: 'dashboard',
            elementoId: 'modulo-dashboard'
        },
        {
            titulo: 'Asistente de Cotización en 4 Pasos',
            texto: 'Cree presupuestos con cálculo en vivo de IVA (16%), flete terrestre por estado, factores de ciudad y plantillas precargadas con un solo clic.',
            modulo: 'cotizador',
            elementoId: 'modulo-cotizador'
        },
        {
            titulo: 'Calculadora de Materiales y Dónde Comprar',
            texto: 'Estime automáticamente insumos para losas, paredes y asfaltos con margen de desperdicio y optimice sus compras según la ciudad con mejores factores de costo.',
            modulo: 'calculadora',
            elementoId: 'modulo-calculadora'
        },
        {
            titulo: 'Control Multimoneda y Paleta de Comandos',
            texto: 'Alterne instantáneamente entre USD y Bolívares a tasa oficial BCV, cambie el tema visual o presione Ctrl + K en cualquier momento para navegar sin tocar el mouse.',
            modulo: 'dashboard',
            elementoId: 'selectorMonedaGlobal'
        }
    ];

    function crearOverlayTour() {
        if (overlayTour) return;

        overlayTour = document.createElement('div');
        overlayTour.id = 'overlayTourGuiado';
        overlayTour.className = 'modal-fondo oculto';
        overlayTour.style.zIndex = '9999';

        var tarjeta = document.createElement('div');
        tarjeta.className = 'modal-caja sv-tour-caja';
        tarjeta.style.maxWidth = '460px';
        tarjeta.style.position = 'relative';

        tarjeta.innerHTML =
            '<div class="sv-flex-between sv-mb-sm">' +
            '<span class="badge badge-resultado badge-exito" id="badgePasoTour">Paso 1 de 4</span>' +
            '<button type="button" class="btn-cerrar-modal" id="btnCerrarTour" aria-label="Cerrar tour">&times;</button>' +
            '</div>' +
            '<h3 id="tituloPasoTour" class="tarjeta__titulo sv-mb-xs" style="font-size:1.15rem;"></h3>' +
            '<p id="textoPasoTour" class="tarjeta__descripcion sv-mb-md" style="font-size:0.9rem; line-height:1.5;"></p>' +
            '<div class="sv-flex-between sv-mt-md" style="border-top:1px solid var(--color-borde); padding-top:1rem;">' +
            '<button type="button" class="boton boton--secundario boton--sm" id="btnAnteriorTour">Anterior</button>' +
            '<div style="display:flex; gap:0.5rem;">' +
            '<button type="button" class="boton boton--secundario boton--sm" id="btnOmitirTour">Omitir</button>' +
            '<button type="button" class="boton boton--primario boton--sm" id="btnSiguienteTour">Siguiente</button>' +
            '</div>' +
            '</div>';

        overlayTour.appendChild(tarjeta);
        document.body.appendChild(overlayTour);

        document.getElementById('btnCerrarTour').addEventListener('click', cerrarTour);
        document.getElementById('btnOmitirTour').addEventListener('click', finalizarTour);
        document.getElementById('btnAnteriorTour').addEventListener('click', function() {
            if (pasoActual > 0) {
                pasoActual--;
                mostrarPaso();
            }
        });
        document.getElementById('btnSiguienteTour').addEventListener('click', function() {
            if (pasoActual < PASOS.length - 1) {
                pasoActual++;
                mostrarPaso();
            } else {
                finalizarTour();
            }
        });
    }

    function mostrarPaso() {
        var p = PASOS[pasoActual];
        if (!p) return;

        if (typeof cambiarPestana === 'function' && p.modulo) {
            cambiarPestana(p.modulo);
        } else if (typeof cambiarModulo === 'function' && p.modulo) {
            cambiarModulo(p.modulo);
        }

        document.getElementById('badgePasoTour').textContent = 'Paso ' + (pasoActual + 1) + ' de ' + PASOS.length;
        document.getElementById('tituloPasoTour').textContent = p.titulo;
        document.getElementById('textoPasoTour').textContent = p.texto;

        var btnAnt = document.getElementById('btnAnteriorTour');
        var btnSig = document.getElementById('btnSiguienteTour');

        if (btnAnt) {
            btnAnt.style.visibility = (pasoActual === 0) ? 'hidden' : 'visible';
        }
        if (btnSig) {
            btnSig.textContent = (pasoActual === PASOS.length - 1) ? '¡Comenzar!' : 'Siguiente';
        }
    }

    function iniciarTour() {
        crearOverlayTour();
        pasoActual = 0;
        overlayTour.classList.remove('oculto');
        mostrarPaso();
    }

    function cerrarTour() {
        if (overlayTour) {
            overlayTour.classList.add('oculto');
        }
    }

    function finalizarTour() {
        cerrarTour();
        try {
            localStorage.setItem(CLAVE_TOUR, 'true');
        } catch (e) {}
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('¡Tour completado! Puede volver a abrirlo en cualquier momento desde la barra o con Ctrl+K.', 'exito');
        }
    }

    function verificarTourAutomatico() {
        try {
            var completado = localStorage.getItem(CLAVE_TOUR);
            if (!completado) {
                // Iniciar tras login si no se ha completado
                setTimeout(function () {
                    var sesion = (typeof sesionUsuario !== 'undefined') ? sesionUsuario : null;
                    if (sesion) {
                        iniciarTour();
                    }
                }, 1000);
            }
        } catch (e) {}
    }

    // Exponer globalmente
    window.iniciarTourGuiado = iniciarTour;
    window.verificarTourAutomatico = verificarTourAutomatico;

    document.addEventListener('DOMContentLoaded', function () {
        verificarTourAutomatico();
    });
})();

