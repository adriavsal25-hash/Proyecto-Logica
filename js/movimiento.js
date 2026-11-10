/* ============================================================
   SICOP-VE — Sistema de Animación y Microinteracciones (js/movimiento.js)
   Inspirado en la dirección artística editorial y fluida de Ksen Panchenko.
   
   Características:
   - Vanilla JavaScript ES5 puro (sin frameworks ni librerías externas).
   - Compatible 100% con protocolo file:// y doble clic.
   - Respeta estrictamente prefers-reduced-motion y preferencia guardada.
   - Presupuesto ligero: < 25 KB sin bloquear el hilo principal.
   - Espacio de nombres global: window.SICOPMovimiento.
   ============================================================ */

(function (window, document) {
    'use strict';

    // Clave de almacenamiento de preferencia de movimiento
    var CLAVE_STORAGE_MOVIMIENTO = 'sicop_movimiento_v2';
    var CLAVE_SESSION_PRELOADER = 'sicop_preloader_visto_v2';

    // Estado interno del sistema
    var estado = {
        movimientoReducido: false,
        cursorActivo: false,
        relojIntervalo: null,
        observers: []
    };

    /**
     * Curva de flexión exponencial suave (ease-out expo).
     * @param {number} t - Progreso entre 0 y 1.
     * @returns {number}
     */
    function easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    /**
     * Curva bezier suave inspirada en Ksen Panchenko (0.22, 1, 0.36, 1).
     * @param {number} t - Progreso entre 0 y 1.
     * @returns {number}
     */
    function easeOutCubic(t) {
        var t1 = t - 1;
        return t1 * t1 * t1 + 1;
    }

    /**
     * Inicializa la clase raíz 'sv-js' para activar estilos progresivos de animación.
     */
    function marcarSoporteJS() {
        if (document.documentElement) {
            document.documentElement.classList.add('sv-js');
        }
    }

    /**
     * Evalúa y aplica la preferencia de movimiento del usuario.
     */
    function inicializarPreferenciaMovimiento() {
        var guardado = localStorage.getItem(CLAVE_STORAGE_MOVIMIENTO);
        var mediaQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
        var prefiereReducido = (guardado === 'reducido') || (!guardado && mediaQuery && mediaQuery.matches);

        aplicarModoMovimiento(prefiereReducido);

        if (mediaQuery && mediaQuery.addListener) {
            mediaQuery.addListener(function (e) {
                if (!localStorage.getItem(CLAVE_STORAGE_MOVIMIENTO)) {
                    aplicarModoMovimiento(e.matches);
                }
            });
        }
    }

    /**
     * Aplica o desactiva el modo de movimiento reducido en el documento.
     * @param {boolean} reducido
     */
    function aplicarModoMovimiento(reducido) {
        estado.movimientoReducido = Boolean(reducido);
        if (document.documentElement) {
            if (estado.movimientoReducido) {
                document.documentElement.setAttribute('data-movimiento', 'reducido');
            } else {
                document.documentElement.removeAttribute('data-movimiento');
            }
        }
    }

    /**
     * Alterna la preferencia de movimiento y la persiste en localStorage.
     * @returns {boolean} Nuevo estado.
     */
    function alternarMovimientoReducido() {
        var nuevo = !estado.movimientoReducido;
        aplicarModoMovimiento(nuevo);
        localStorage.setItem(CLAVE_STORAGE_MOVIMIENTO, nuevo ? 'reducido' : 'completo');
        return nuevo;
    }

    /**
     * Divide títulos editoriales en palabras para animación staggered manteniendo accesibilidad.
     * @param {HTMLElement} elemento
     */
    function dividirTexto(elemento) {
        if (!elemento || elemento.getAttribute('data-sv-dividido')) return;
        var textoOriginal = elemento.textContent || '';
        if (!textoOriginal.trim()) return;

        elemento.setAttribute('aria-label', textoOriginal);
        elemento.setAttribute('data-sv-dividido', 'true');

        var palabras = textoOriginal.trim().split(/\s+/);
        var fragmento = document.createDocumentFragment();

        for (var i = 0; i < palabras.length; i++) {
            var palabra = palabras[i];
            var spanPalabra = document.createElement('span');
            spanPalabra.className = 'sv-palabra';
            spanPalabra.setAttribute('aria-hidden', 'true');

            var spanInterior = document.createElement('span');
            spanInterior.className = 'sv-palabra__interior';
            spanInterior.textContent = palabra;
            spanInterior.style.transitionDelay = (i * 45) + 'ms';

            spanPalabra.appendChild(spanInterior);
            fragmento.appendChild(spanPalabra);

            if (i < palabras.length - 1) {
                fragmento.appendChild(document.createTextNode(' '));
            }
        }

        elemento.innerHTML = '';
        elemento.appendChild(fragmento);
    }

    /**
     * Revela elementos conforme ingresan al viewport mediante IntersectionObserver.
     */
    function inicializarReveladoAlEntrar() {
        if (estado.movimientoReducido) {
            var todos = document.querySelectorAll('[data-sv-reveal], .tarjeta, .kpi-card');
            for (var j = 0; j < todos.length; j++) {
                todos[j].classList.add('sv-revelado');
            }
            return;
        }

        if (!('IntersectionObserver' in window)) {
            var els = document.querySelectorAll('[data-sv-reveal], .tarjeta, .kpi-card');
            for (var k = 0; k < els.length; k++) {
                els[k].classList.add('sv-revelado');
            }
            return;
        }

        var observer = new IntersectionObserver(function (entries, obs) {
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                if (entry.isIntersecting) {
                    entry.target.classList.add('sv-revelado');
                    obs.unobserve(entry.target);
                }
            }
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        estado.observers.push(observer);

        var elementos = document.querySelectorAll('[data-sv-reveal], .tarjeta, .kpi-card');
        for (var e = 0; e < elementos.length; e++) {
            observer.observe(elementos[e]);
        }
    }

    /**
     * Anima el conteo numérico de un elemento desde su valor actual hasta el objetivo.
     * @param {HTMLElement} elemento
     * @param {number} valorFinal
     * @param {Function|boolean} [formateador]
     * @param {number} [duracionMs]
     */
    function contadorAnimado(elemento, valorFinal, formateador, duracionMs) {
        if (!elemento) return;
        var objetivo = Number(valorFinal) || 0;
        var duracion = duracionMs || (estado.movimientoReducido ? 0 : 800);

        // Normalizar formateador para evitar TypeError cuando se pasa un booleano u otro tipo
        var fnFormato;
        if (typeof formateador === 'function') {
            fnFormato = formateador;
        } else if (formateador === true) {
            fnFormato = function (v) {
                return (typeof monedaActiva === 'function') ? monedaActiva(v) : ((typeof usd === 'function') ? usd(v) : ('$' + Number(v).toFixed(2)));
            };
        } else {
            fnFormato = function (v) {
                return String(Math.round(v));
            };
        }

        if (duracion === 0 || estado.movimientoReducido) {
            elemento.textContent = fnFormato(objetivo);
            return;
        }

        var inicio = 0;
        var tiempoInicio = null;

        function pasoAnimacion(timestamp) {
            if (!tiempoInicio) tiempoInicio = timestamp;
            var transcurrido = timestamp - tiempoInicio;
            var progreso = Math.min(1, transcurrido / duracion);
            var progresoEased = easeOutExpo(progreso);
            var valorActual = inicio + (objetivo - inicio) * progresoEased;

            elemento.textContent = fnFormato(valorActual);

            if (progreso < 1) {
                window.requestAnimationFrame(pasoAnimacion);
            } else {
                elemento.textContent = fnFormato(objetivo);
            }
        }

        window.requestAnimationFrame(pasoAnimacion);
    }

    /**
     * Anima las barras del gráfico de inversión y semáforo con transformación horizontal suave.
     */
    function animarBarrasGraficos() {
        if (estado.movimientoReducido) return;
        var barras = document.querySelectorAll('.grafico-barra__fill, .barra-progreso__fill');
        for (var i = 0; i < barras.length; i++) {
            var b = barras[i];
            b.classList.remove('sv-barra-animada');
            // Forzar reflow para reiniciar la animación
            void b.offsetWidth;
            b.classList.add('sv-barra-animada');
        }
    }

    /**
     * Efecto magnético sutil para botones primarios de llamado a la acción (solo en punteros finos).
     */
    function inicializarBotonesMagneticos() {
        if (estado.movimientoReducido) return;
        if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return;

        var botones = document.querySelectorAll('[data-sv-magnetico], .boton--primario');
        for (var i = 0; i < botones.length; i++) {
            (function (btn) {
                btn.addEventListener('mousemove', function (e) {
                    var rect = btn.getBoundingClientRect();
                    var relX = e.clientX - rect.left - (rect.width / 2);
                    var relY = e.clientY - rect.top - (rect.height / 2);
                    var maxDesplazamiento = 6;
                    var x = (relX / (rect.width / 2)) * maxDesplazamiento;
                    var y = (relY / (rect.height / 2)) * maxDesplazamiento;

                    btn.style.transform = 'translate3d(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px, 0)';
                });

                btn.addEventListener('mouseleave', function () {
                    btn.style.transform = '';
                });
            })(botones[i]);
        }
    }

    /**
     * Cursor interactivo personalizado de precisión (punto y anillo con lerp) solo en escritorio.
     */
    function inicializarCursorEditorial() {
        if (estado.movimientoReducido) return;
        if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return;
        if (document.getElementById('svCursorPunto')) return;

        var punto = document.createElement('div');
        punto.id = 'svCursorPunto';
        punto.className = 'sv-cursor-punto';

        var aro = document.createElement('div');
        aro.id = 'svCursorAro';
        aro.className = 'sv-cursor-aro';

        document.body.appendChild(punto);
        document.body.appendChild(aro);

        var mouseX = -100;
        var mouseY = -100;
        var aroX = -100;
        var aroY = -100;
        var activo = false;

        window.addEventListener('mousemove', function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (!activo) {
                activo = true;
                punto.classList.add('sv-cursor--visible');
                aro.classList.add('sv-cursor--visible');
            }
            punto.style.transform = 'translate3d(' + mouseX + 'px, ' + mouseY + 'px, 0)';
        });

        window.addEventListener('mouseleave', function () {
            activo = false;
            punto.classList.remove('sv-cursor--visible');
            aro.classList.remove('sv-cursor--visible');
        });

        // Loop de interpolación (lerp) para el aro
        function bucleAro() {
            if (activo) {
                aroX += (mouseX - aroX) * 0.18;
                aroY += (mouseY - aroY) * 0.18;
                aro.style.transform = 'translate3d(' + aroX.toFixed(1) + 'px, ' + aroY.toFixed(1) + 'px, 0)';
            }
            window.requestAnimationFrame(bucleAro);
        }
        window.requestAnimationFrame(bucleAro);

        // Agrandar aro sobre elementos interactivos
        document.addEventListener('mouseover', function (e) {
            var target = e.target;
            if (!target) return;
            var interactivo = target.closest('a, button, input, select, textarea, .tarjeta-clickeable, [role="button"]');
            if (interactivo) {
                aro.classList.add('sv-cursor-aro--hover');
                if (target.closest('input, textarea, select')) {
                    // Ocultar cursor custom en inputs para no estorbar el caret nativo
                    punto.classList.add('sv-cursor--oculto');
                    aro.classList.add('sv-cursor--oculto');
                } else {
                    punto.classList.remove('sv-cursor--oculto');
                    aro.classList.remove('sv-cursor--oculto');
                }
            } else {
                aro.classList.remove('sv-cursor-aro--hover');
                punto.classList.remove('sv-cursor--oculto');
                aro.classList.remove('sv-cursor--oculto');
            }
        });
    }

    /**
     * Pantalla de carga editorial (preloader) de una sola ejecución por sesión.
     */
    function inicializarPantallaCarga() {
        var yaVisto = false;
        try {
            yaVisto = Boolean(sessionStorage.getItem(CLAVE_SESSION_PRELOADER));
        } catch (e) {}

        if (yaVisto || estado.movimientoReducido) {
            var pExistente = document.getElementById('svPreloader');
            if (pExistente && pExistente.parentNode) {
                pExistente.parentNode.removeChild(pExistente);
            }
            return;
        }

        var preloader = document.getElementById('svPreloader');
        if (!preloader) return;

        var contador = document.getElementById('svPreloaderContador');
        var barra = document.getElementById('svPreloaderBarra');
        var duracion = 700;
        var tiempoInicio = null;

        function pasoPreloader(timestamp) {
            if (!tiempoInicio) tiempoInicio = timestamp;
            var transcurrido = timestamp - tiempoInicio;
            var progreso = Math.min(1, transcurrido / duracion);
            var porcentaje = Math.round(progreso * 100);

            if (contador) {
                contador.textContent = (porcentaje < 10 ? '0' : '') + porcentaje;
            }
            if (barra) {
                barra.style.width = porcentaje + '%';
            }

            if (progreso < 1) {
                window.requestAnimationFrame(pasoPreloader);
            } else {
                finalizarPreloader();
            }
        }

        function finalizarPreloader() {
            preloader.classList.add('sv-preloader--terminado');
            try {
                sessionStorage.setItem(CLAVE_SESSION_PRELOADER, 'true');
            } catch (e) {}

            setTimeout(function () {
                if (preloader && preloader.parentNode) {
                    preloader.parentNode.removeChild(preloader);
                }
            }, 600);
        }

        // Temporizador de rescate de 2.0 segundos para garantizar que jamás se quede trabado
        setTimeout(finalizarPreloader, 2000);

        window.requestAnimationFrame(pasoPreloader);
    }

    /**
     * Reloj en tiempo real oficial para Caracas, Venezuela (UTC-4).
     */
    function inicializarRelojCaracas() {
        var relojElem = document.getElementById('svRelojCaracas');
        if (!relojElem) return;

        function actualizarReloj() {
            var ahora = new Date();
            // Compensar a UTC-4 si Intl no está disponible
            var horaStr = '';
            if (window.Intl && Intl.DateTimeFormat) {
                try {
                    horaStr = new Intl.DateTimeFormat('es-VE', {
                        timeZone: 'America/Caracas',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    }).format(ahora);
                } catch (e) {
                    horaStr = _horaFallback(ahora);
                }
            } else {
                horaStr = _horaFallback(ahora);
            }

            relojElem.textContent = horaStr + ' VET';
        }

        function _horaFallback(d) {
            var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
            var caracas = new Date(utc - (4 * 3600000));
            var h = caracas.getHours();
            var m = caracas.getMinutes();
            var s = caracas.getSeconds();
            return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
        }

        actualizarReloj();
        estado.relojIntervalo = setInterval(actualizarReloj, 1000);
    }

    /**
     * Transición suave al cambiar de módulo o pestaña en la aplicación principal.
     * @param {HTMLElement} contenedorModulo
     */
    function transicionDeModulo(contenedorModulo) {
        if (!contenedorModulo || estado.movimientoReducido) return;
        contenedorModulo.classList.remove('sv-modulo-activo');
        void contenedorModulo.offsetWidth;
        contenedorModulo.classList.add('sv-modulo-activo');
    }

    /**
     * Arranque centralizado del sistema de movimiento.
     */
    function iniciar() {
        marcarSoporteJS();
        inicializarPreferenciaMovimiento();
        inicializarPantallaCarga();
        inicializarReveladoAlEntrar();
        inicializarBotonesMagneticos();
        inicializarCursorEditorial();
        inicializarRelojCaracas();

        // Dividir títulos con clase de acento editorial si existen
        var titulos = document.querySelectorAll('.sv-split-texto');
        for (var i = 0; i < titulos.length; i++) {
            dividirTexto(titulos[i]);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }

    // Exponer API pública en window.SICOPMovimiento
    window.SICOPMovimiento = {
        iniciar: iniciar,
        dividirTexto: dividirTexto,
        contadorAnimado: contadorAnimado,
        animarBarrasGraficos: animarBarrasGraficos,
        transicionDeModulo: transicionDeModulo,
        alternarMovimientoReducido: alternarMovimientoReducido,
        esMovimientoReducido: function () {
            return estado.movimientoReducido;
        }
    };

})(window, document);

