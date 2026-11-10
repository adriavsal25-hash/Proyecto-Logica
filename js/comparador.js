/* ============================================================
   SICOP-VE — Comparador de Cotizaciones Lado a Lado (js/comparador.js)
   Proyecto Final: Lógica y Programación I
   Vanilla JavaScript ES5 — Cero dependencias externas
   ============================================================ */

(function () {
    'use strict';

    var cotizacionesSeleccionadas = [];
    var modalComparador = null;

    function alternarSeleccionCotizacion(id) {
        id = Number(id);
        var idx = cotizacionesSeleccionadas.indexOf(id);
        if (idx !== -1) {
            cotizacionesSeleccionadas.splice(idx, 1);
        } else {
            if (cotizacionesSeleccionadas.length >= 3) {
                if (typeof mostrarNotificacion === 'function') {
                    mostrarNotificacion('Solo puede comparar un máximo de 3 cotizaciones simultáneamente.', 'advertencia');
                }
                actualizarEstadoCheckboxes();
                return;
            }
            cotizacionesSeleccionadas.push(id);
        }
        actualizarBotonComparar();
    }

    function actualizarEstadoCheckboxes() {
        var checkboxes = document.querySelectorAll('.chk-comparar-cot');
        for (var i = 0; i < checkboxes.length; i++) {
            var chk = checkboxes[i];
            var id = Number(chk.getAttribute('data-id'));
            chk.checked = (cotizacionesSeleccionadas.indexOf(id) !== -1);
        }
    }

    function actualizarBotonComparar() {
        var btn = document.getElementById('btnCompararCotizaciones');
        var count = cotizacionesSeleccionadas.length;
        if (!btn) return;

        if (count >= 2) {
            btn.classList.remove('oculto');
            btn.innerHTML = '⚖️ Comparar Seleccionadas (' + count + ')';
        } else {
            btn.classList.add('oculto');
        }
    }

    function crearModalComparador() {
        if (modalComparador) return;

        modalComparador = document.createElement('div');
        modalComparador.id = 'modalComparadorCotizaciones';
        modalComparador.className = 'modal-fondo oculto';
        modalComparador.setAttribute('role', 'dialog');
        modalComparador.setAttribute('aria-modal', 'true');
        modalComparador.setAttribute('aria-labelledby', 'tituloModalComparador');

        var caja = document.createElement('div');
        caja.className = 'modal-caja sv-max-w-modal-lg';
        caja.style.maxWidth = '900px';

        var cabecera = document.createElement('div');
        cabecera.className = 'sv-flex-between sv-mb-md';
        cabecera.innerHTML = '<h2 id="tituloModalComparador" class="tarjeta__titulo sv-mb-0">⚖️ Comparador Comparativo de Presupuestos</h2>' +
            '<button type="button" class="btn-cerrar-modal" id="btnCerrarComparador" aria-label="Cerrar modal">&times;</button>';

        var cuerpo = document.createElement('div');
        cuerpo.id = 'cuerpoComparadorModal';
        cuerpo.style.overflowX = 'auto';

        caja.appendChild(cabecera);
        caja.appendChild(cuerpo);
        modalComparador.appendChild(caja);

        modalComparador.addEventListener('click', function (e) {
            if (e.target === modalComparador) cerrarComparador();
        });

        document.body.appendChild(modalComparador);

        var btnCerrar = document.getElementById('btnCerrarComparador');
        if (btnCerrar) {
            btnCerrar.addEventListener('click', cerrarComparador);
        }
    }

    function abrirComparador() {
        if (cotizacionesSeleccionadas.length < 2) {
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('Seleccione al menos 2 cotizaciones en la tabla para comparar.', 'advertencia');
            }
            return;
        }

        crearModalComparador();
        var todas = (typeof obtenerCotizaciones === 'function') ? obtenerCotizaciones() : [];
        var seleccionadas = [];

        for (var i = 0; i < cotizacionesSeleccionadas.length; i++) {
            var targetId = cotizacionesSeleccionadas[i];
            for (var j = 0; j < todas.length; j++) {
                if (todas[j].id === targetId) {
                    seleccionadas.push(todas[j]);
                    break;
                }
            }
        }

        if (seleccionadas.length < 2) return;

        // Determinar mejor y peor precio
        var minTotal = Infinity;
        var maxTotal = -Infinity;
        for (var k = 0; k < seleccionadas.length; k++) {
            var tot = (seleccionadas[k].totalUSD !== undefined ? seleccionadas[k].totalUSD : seleccionadas[k].total);
            if (tot < minTotal) minTotal = tot;
            if (tot > maxTotal) maxTotal = tot;
        }

        var html = '<table class="tabla tabla--comparativa" style="width:100%; text-align:left; border-collapse:collapse;">';
        html += '<thead><tr><th style="width:25%;">Criterio</th>';

        for (var c = 0; c < seleccionadas.length; c++) {
            var cot = seleccionadas[c];
            var totCot = (cot.totalUSD !== undefined ? cot.totalUSD : cot.total);
            var esMejor = (totCot === minTotal);
            var esPeor = (totCot === maxTotal && minTotal !== maxTotal);
            var claseBorde = esMejor ? ' style="border-top:3px solid var(--color-exito);"' : (esPeor ? ' style="border-top:3px solid var(--color-peligro);"' : '');

            html += '<th' + claseBorde + '>' +
                '<strong>' + escaparHtml(cot.correlativo) + '</strong><br>' +
                '<span class="texto-secundario" style="font-size:0.75rem;">' + escaparHtml(cot.fechaCreacion) + '</span>' +
                (esMejor ? ' <span class="badge badge-resultado badge-exito" style="font-size:0.65rem;">MÁS ECONÓMICA</span>' : '') +
                '</th>';
        }
        html += '</tr></thead><tbody>';

        var fmtMon = function(v) {
            return (typeof monedaActiva === 'function') ? monedaActiva(v) : ((typeof usd === 'function') ? usd(v) : ('$' + Number(v).toFixed(2)));
        };
        var etqMon = (typeof etiquetaMonedaActiva === 'function') ? etiquetaMonedaActiva() : 'USD';

        // Filas de comparación
        var filas = [
            { campo: 'Obra / Proyecto', valor: function (c) { return escaparHtml(c.nombreObra || 'N/A'); } },
            { campo: 'Solicitante', valor: function (c) { return escaparHtml(c.nombreCliente) + ' (' + escaparHtml(c.perfil) + ')'; } },
            { campo: 'Estado Destino', valor: function (c) { return escaparHtml(c.estadoObra) + ' (Flete: ' + (c.factorFlete ? c.factorFlete.toFixed(2) : '1.00') + ')'; } },
            { campo: 'Ciudad Compra', valor: function (c) { return escaparHtml(c.ciudadCompra) + ' (Factor: ' + (c.factorCiudad ? c.factorCiudad.toFixed(2) : '1.00') + ')'; } },
            { campo: 'Ítems Cotizados', valor: function (c) { return (c.items ? c.items.length : 0) + ' materiales'; } },
            { campo: 'Subtotal Materiales', valor: function (c) { return fmtMon(c.subtotal); } },
            { campo: 'Flete Terrestre', valor: function (c) { return fmtMon(c.flete); } },
            {
                campo: 'Descuento', valor: function (c) {
                    var desc = (c.descuentoMonto !== undefined ? c.descuentoMonto : c.descuento);
                    return desc ? '-' + fmtMon(desc) : fmtMon(0);
                }
            },
            { campo: 'IVA (16%)', valor: function (c) { return fmtMon(c.iva); } },
            {
                campo: 'Total (' + etqMon + ')', valor: function (c) {
                    var tot = (c.totalUSD !== undefined ? c.totalUSD : c.total);
                    var esMejor = (tot === minTotal);
                    var esPeor = (tot === maxTotal && minTotal !== maxTotal);
                    var estilo = esMejor ? 'color:var(--color-exito); font-weight:700;' : (esPeor ? 'color:var(--color-peligro); font-weight:700;' : 'font-weight:700;');
                    return '<span style="' + estilo + '">' + fmtMon(tot) + '</span>';
                }
            },
            {
                campo: 'Total Bolívares (BCV)', valor: function (c) {
                    var tasa = (typeof obtenerTasaBCV === 'function') ? obtenerTasaBCV() : 900;
                    var totUSD = (c.totalUSD !== undefined ? c.totalUSD : c.total) || 0;
                    var totBs = (c.totalBs !== undefined ? c.totalBs : (totUSD * tasa));
                    return '<strong>' + bs(totBs) + '</strong>';
                }
            },
            { campo: 'Estado Actual', valor: function (c) { return '<span class="badge-semaforo badge-semaforo--verde">' + escaparHtml(c.estado) + '</span>'; } }
        ];

        for (var f = 0; f < filas.length; f++) {
            var fila = filas[f];
            html += '<tr><td><strong>' + fila.campo + '</strong></td>';
            for (var col = 0; col < seleccionadas.length; col++) {
                html += '<td>' + fila.valor(seleccionadas[col]) + '</td>';
            }
            html += '</tr>';
        }

        html += '</tbody></table>';

        var cuerpoModal = document.getElementById('cuerpoComparadorModal');
        if (cuerpoModal) {
            cuerpoModal.innerHTML = html;
        }

        modalComparador.classList.remove('oculto');
    }

    function cerrarComparador() {
        if (modalComparador) {
            modalComparador.classList.add('oculto');
        }
    }

    function limpiarSeleccionComparador() {
        cotizacionesSeleccionadas = [];
        actualizarEstadoCheckboxes();
        actualizarBotonComparar();
    }

    // Exponer globalmente
    window.alternarSeleccionCotizacion = alternarSeleccionCotizacion;
    window.abrirComparadorCotizaciones = abrirComparador;
    window.cerrarComparadorCotizaciones = cerrarComparador;
    window.limpiarSeleccionComparador = limpiarSeleccionComparador;
})();

