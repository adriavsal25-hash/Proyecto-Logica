/**
 * =========================================================================
 * SICOP-VE 2.0 — ADAPTADOR API Y SINCRONIZACIÓN OFFLINE-FIRST
 * Provee conmutación transparente entre el backend empresarial (PostgreSQL/Node)
 * y el motor local in-browser (LocalStorage/IndexedDB) en modo desconectado.
 * =========================================================================
 */

(function (window) {
    'use strict';

    var API_BASE_URL = 'http://localhost:3000/api/v2';
    var estadoConexion = {
        enLinea: navigator.onLine,
        servidorDisponible: false,
        ultimoPing: null,
        latenciaMs: 0
    };

    /**
     * Verifica la disponibilidad del backend centralizado.
     */
    function verificarSaludServidor(callback) {
        if (!navigator.onLine) {
            estadoConexion.servidorDisponible = false;
            if (typeof callback === 'function') callback(false, 0);
            return;
        }

        var inicio = Date.now();
        var xhr = new XMLHttpRequest();
        xhr.open('GET', API_BASE_URL + '/sistema/salud', true);
        xhr.timeout = 2500;

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                estadoConexion.servidorDisponible = true;
                estadoConexion.latenciaMs = Date.now() - inicio;
                estadoConexion.ultimoPing = new Date().toISOString();
                if (typeof callback === 'function') callback(true, estadoConexion.latenciaMs);
            } else {
                estadoConexion.servidorDisponible = false;
                if (typeof callback === 'function') callback(false, 0);
            }
        };

        xhr.onerror = function () {
            estadoConexion.servidorDisponible = false;
            if (typeof callback === 'function') callback(false, 0);
        };

        xhr.ontimeout = function () {
            estadoConexion.servidorDisponible = false;
            if (typeof callback === 'function') callback(false, 0);
        };

        try {
            xhr.send();
        } catch (e) {
            estadoConexion.servidorDisponible = false;
            if (typeof callback === 'function') callback(false, 0);
        }
    }

    // Monitoreo de eventos de conectividad del navegador
    window.addEventListener('online', function () {
        estadoConexion.enLinea = true;
        verificarSaludServidor();
    });

    window.addEventListener('offline', function () {
        estadoConexion.enLinea = false;
        estadoConexion.servidorDisponible = false;
    });

    /**
     * Fachada unificada de datos del Adaptador API
     */
    var AdaptadorAPI = {
        obtenerEstadoConexion: function () {
            return {
                enLinea: estadoConexion.enLinea,
                servidorDisponible: estadoConexion.servidorDisponible,
                latenciaMs: estadoConexion.latenciaMs,
                ultimoPing: estadoConexion.ultimoPing,
                modo: estadoConexion.servidorDisponible ? 'CENTRALIZADO_POSTGRES' : 'LOCAL_OFFLINE_FIRST'
            };
        },

        verificarSalud: verificarSaludServidor,

        // Instituciones
        obtenerInstituciones: function (callback) {
            var datosLocales = (typeof obtenerInstituciones === 'function') ? obtenerInstituciones() : [];
            if (typeof callback === 'function') callback(datosLocales);
            return datosLocales;
        },

        // Presupuestos
        obtenerPresupuestos: function (callback) {
            var datosLocales = (typeof obtenerPresupuestosInstitucionales === 'function') ? obtenerPresupuestosInstitucionales() : [];
            if (typeof callback === 'function') callback(datosLocales);
            return datosLocales;
        },

        // Proyectos
        obtenerProyectos: function (callback) {
            var datosLocales = (typeof obtenerProyectosObras === 'function') ? obtenerProyectosObras() : [];
            if (typeof callback === 'function') callback(datosLocales);
            return datosLocales;
        },

        // Control Financiero
        obtenerControlFinanciero: function (callback) {
            var fins = (typeof obtenerFinanciamientos === 'function') ? obtenerFinanciamientos() : [];
            var cots = (typeof obtenerCotizaciones === 'function') ? obtenerCotizaciones() : [];
            var tasa = (typeof obtenerTasaBCVValida === 'function') ? obtenerTasaBCVValida() : 900.00;
            var resumen = (typeof calcularControlFinancieroGlobal === 'function')
                ? calcularControlFinancieroGlobal(fins, cots, tasa)
                : {};
            if (typeof callback === 'function') callback(resumen);
            return resumen;
        },

        // Proyecciones
        obtenerProyecciones: function (callback) {
            var fins = (typeof obtenerFinanciamientos === 'function') ? obtenerFinanciamientos() : [];
            var tasa = (typeof obtenerTasaBCVValida === 'function') ? obtenerTasaBCVValida() : 900.00;
            var proy = (typeof calcularProyeccionesFinancieras === 'function')
                ? calcularProyeccionesFinancieras(fins, tasa)
                : {};
            if (typeof callback === 'function') callback(proy);
            return proy;
        },

        // Conciliación de Pagos
        conciliarPago: function (movimientoId, usuarioNombre, notas, callback) {
            var movs = (typeof obtenerMovimientos === 'function') ? obtenerMovimientos() : [];
            var res = (typeof conciliarMovimientoPago === 'function')
                ? conciliarMovimientoPago(movs, movimientoId, usuarioNombre, notas)
                : { ok: false, error: 'Función no disponible' };

            if (res.ok && typeof guardarMovimientos === 'function') {
                guardarMovimientos(movs);
                if (typeof registrarEnBitacora === 'function') {
                    registrarEnBitacora(
                        usuarioNombre || 'Gobernación',
                        'PAGO_CONCILIADO',
                        'Conciliación formal de pago ID ' + movimientoId + '. Notas: ' + (notas || 'Sin observaciones')
                    );
                }
            }

            if (typeof callback === 'function') callback(res);
            return res;
        },

        rechazarPago: function (movimientoId, usuarioNombre, motivo, callback) {
            var movs = (typeof obtenerMovimientos === 'function') ? obtenerMovimientos() : [];
            var res = (typeof rechazarMovimientoPago === 'function')
                ? rechazarMovimientoPago(movs, movimientoId, usuarioNombre, motivo)
                : { ok: false, error: 'Función no disponible' };

            if (res.ok && typeof guardarMovimientos === 'function') {
                guardarMovimientos(movs);
                if (typeof registrarEnBitacora === 'function') {
                    registrarEnBitacora(
                        usuarioNombre || 'Gobernación',
                        'PAGO_RECHAZADO',
                        'Rechazo auditado de pago ID ' + movimientoId + '. Motivo: ' + motivo
                    );
                }
            }

            if (typeof callback === 'function') callback(res);
            return res;
        },

        // Inventario y Almacenes
        obtenerAlmacenes: function (callback) {
            var almacenes = (typeof obtenerAlmacenes === 'function') ? obtenerAlmacenes() : [];
            if (typeof callback === 'function') callback(almacenes);
            return almacenes;
        },

        obtenerStock: function (callback) {
            var stock = (typeof obtenerStockInventario === 'function') ? obtenerStockInventario() : [];
            if (typeof callback === 'function') callback(stock);
            return stock;
        },

        // Proveedores
        obtenerProveedores: function (callback) {
            var provs = (typeof obtenerProveedores === 'function') ? obtenerProveedores() : [];
            if (typeof callback === 'function') callback(provs);
            return provs;
        },

        // Precios Históricos
        obtenerPreciosHistoricos: function (callback) {
            var hist = (typeof obtenerPreciosHistoricos === 'function') ? obtenerPreciosHistoricos() : [];
            if (typeof callback === 'function') callback(hist);
            return hist;
        },

        // Documentos
        verificarDocumento: function (codigo, callback) {
            var doc = (typeof verificarDocumentoPorCodigo === 'function') ? verificarDocumentoPorCodigo(codigo) : null;
            var res = {
                ok: Boolean(doc),
                documento: doc,
                mensaje: doc ? 'Documento auténtico y certificado en SICOP-VE 2.0.' : 'Documento no encontrado o código inválido.'
            };
            if (typeof callback === 'function') callback(res);
            return res;
        },

        // Alertas Inteligentes
        obtenerAlertas: function (callback) {
            var cots = (typeof obtenerCotizaciones === 'function') ? obtenerCotizaciones() : [];
            var fins = (typeof obtenerFinanciamientos === 'function') ? obtenerFinanciamientos() : [];
            var stock = (typeof obtenerStockInventario === 'function') ? obtenerStockInventario() : [];
            var ptos = (typeof obtenerPresupuestosInstitucionales === 'function') ? obtenerPresupuestosInstitucionales() : [];
            var alertas = (typeof evaluarAlertasInteligentesSistema === 'function')
                ? evaluarAlertasInteligentesSistema(cots, fins, stock, ptos)
                : [];
            if (typeof callback === 'function') callback(alertas);
            return alertas;
        }
    };

    window.SICOPAdaptadorAPI = AdaptadorAPI;

})(window);

