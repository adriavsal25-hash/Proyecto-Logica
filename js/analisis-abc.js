/* ============================================================
   SICOP-VE — Análisis ABC de Pareto de Materiales (js/analisis-abc.js)
   Proyecto Final: Lógica y Programación I
   Vanilla JavaScript ES5 — Algoritmo de Burbuja Manual
   ============================================================ */

(function () {
    'use strict';

    /**
     * Ordenamiento por método de burbuja descendente manual para análisis ABC.
     * @param {Array} arreglo - Arreglo de objetos.
     * @param {string} campo - Propiedad numérica a ordenar.
     * @returns {Array} Nuevo arreglo ordenado descendente.
     */
    function ordenarBurbujaDescendente(arreglo, campo) {
        var res = [];
        for (var k = 0; k < arreglo.length; k++) {
            res.push(arreglo[k]);
        }
        var n = res.length;
        var intercambiado;
        for (var i = 0; i < n - 1; i++) {
            intercambiado = false;
            for (var j = 0; j < n - 1 - i; j++) {
                if (res[j][campo] < res[j + 1][campo]) {
                    var temp = res[j];
                    res[j] = res[j + 1];
                    res[j + 1] = temp;
                    intercambiado = true;
                }
            }
            if (!intercambiado) break;
        }
        return res;
    }

    function renderizarAnalisisABC() {
        var contenedor = document.getElementById('contenedorAnalisisABC');
        if (!contenedor) return;

        var cotizaciones = (typeof obtenerCotizaciones === 'function') ? obtenerCotizaciones() : [];
        var acumulador = {};
        var granTotal = 0;

        // Consolidar compras de cotizaciones aprobadas, entregadas o enviadas
        for (var i = 0; i < cotizaciones.length; i++) {
            var cot = cotizaciones[i];
            if (cot.estado === 'RECHAZADA') continue;
            if (!cot.items) continue;

            for (var j = 0; j < cot.items.length; j++) {
                var it = cot.items[j];
                var mId = it.materialId || it.id;
                var nombre = it.nombre;
                var sector = it.sector || 'General';
                var unidad = it.unidad || 'Und';
                var subtotalItem = Number(it.total) || (Number(it.cantidad) * Number(it.precioUnitario)) || 0;

                if (!acumulador[mId]) {
                    acumulador[mId] = {
                        id: mId,
                        nombre: nombre,
                        sector: sector,
                        unidad: unidad,
                        cantidadTotal: 0,
                        montoTotal: 0
                    };
                }
                acumulador[mId].cantidadTotal += Number(it.cantidad) || 0;
                acumulador[mId].montoTotal += subtotalItem;
                granTotal += subtotalItem;
            }
        }

        var lista = [];
        for (var k in acumulador) {
            if (acumulador.hasOwnProperty(k)) {
                lista.push(acumulador[k]);
            }
        }

        if (lista.length === 0 || granTotal <= 0) {
            contenedor.innerHTML = '<p class="texto-secundario" style="padding:1rem 0;">No hay datos de consumo registrados para ejecutar el análisis ABC.</p>';
            return;
        }

        // Ordenar con algoritmo burbuja manual descendente por montoTotal
        var ordenados = ordenarBurbujaDescendente(lista, 'montoTotal');

        // Calcular porcentaje acumulado y clasificar Zona A, B, C
        var acumulado = 0;
        var conteoA = 0;
        var conteoB = 0;
        var conteoC = 0;
        var montoA = 0;
        var montoB = 0;
        var montoC = 0;

        for (var x = 0; x < ordenados.length; x++) {
            var item = ordenados[x];
            item.pctMonto = (item.montoTotal / granTotal) * 100;
            acumulado += item.pctMonto;
            item.pctAcumulado = acumulado;

            if (acumulado <= 80 || (x === 0 && acumulado > 80)) {
                item.zona = 'A';
                conteoA++;
                montoA += item.montoTotal;
            } else if (acumulado <= 95) {
                item.zona = 'B';
                conteoB++;
                montoB += item.montoTotal;
            } else {
                item.zona = 'C';
                conteoC++;
                montoC += item.montoTotal;
            }
        }

        // Generar marcado HTML
        var html = '<div class="sv-grid-abc" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.25rem;">';

        var fmtMon = function(v) {
            return (typeof monedaActiva === 'function') ? monedaActiva(v) : ((typeof usd === 'function') ? usd(v) : ('$' + Number(v).toFixed(2)));
        };
        var etqMon = (typeof etiquetaMonedaActiva === 'function') ? etiquetaMonedaActiva() : 'USD';

        html += '<div class="tarjeta-stat" style="border-left:4px solid #16a34a;">' +
            '<div class="tarjeta-stat__etiqueta">Zona A (Críticos · 80% Inversión)</div>' +
            '<div class="tarjeta-stat__valor" style="color:#16a34a; font-size:1.5rem;">' + conteoA + ' materiales</div>' +
            '<div class="texto-secundario" style="font-size:0.75rem;">' + fmtMon(montoA) + ' (' + ((montoA/granTotal)*100).toFixed(1) + '%)</div>' +
            '</div>';

        html += '<div class="tarjeta-stat" style="border-left:4px solid #ca8a04;">' +
            '<div class="tarjeta-stat__etiqueta">Zona B (Intermedios · 15% Inversión)</div>' +
            '<div class="tarjeta-stat__valor" style="color:#ca8a04; font-size:1.5rem;">' + conteoB + ' materiales</div>' +
            '<div class="texto-secundario" style="font-size:0.75rem;">' + fmtMon(montoB) + ' (' + ((montoB/granTotal)*100).toFixed(1) + '%)</div>' +
            '</div>';

        html += '<div class="tarjeta-stat" style="border-left:4px solid #64748b;">' +
            '<div class="tarjeta-stat__etiqueta">Zona C (Secundarios · 5% Inversión)</div>' +
            '<div class="tarjeta-stat__valor" style="color:#64748b; font-size:1.5rem;">' + conteoC + ' materiales</div>' +
            '<div class="texto-secundario" style="font-size:0.75rem;">' + fmtMon(montoC) + ' (' + ((montoC/granTotal)*100).toFixed(1) + '%)</div>' +
            '</div>';

        html += '</div>';

        // Tabla con los materiales principales (top 10)
        html += '<div class="tabla-responsive">' +
            '<table class="tabla" style="font-size:0.85rem;">' +
            '<thead>' +
            '<tr><th>Zona</th><th>Material</th><th>Sector</th><th>Cantidad Total</th><th>Monto Total (' + escaparHtml(etqMon) + ')</th><th>% Individual</th><th>% Acumulado</th></tr>' +
            '</thead><tbody>';

        var limiteMostrar = Math.min(ordenados.length, 12);
        for (var t = 0; t < limiteMostrar; t++) {
            var m = ordenados[t];
            var badgeZona = '';
            if (m.zona === 'A') {
                badgeZona = '<span class="badge badge-resultado badge-exito">Zona A</span>';
            } else if (m.zona === 'B') {
                badgeZona = '<span class="badge-sector badge-sector--energía">Zona B</span>';
            } else {
                badgeZona = '<span class="badge-sector">Zona C</span>';
            }

            html += '<tr>' +
                '<td>' + badgeZona + '</td>' +
                '<td><strong>' + escaparHtml(m.nombre) + '</strong></td>' +
                '<td><span class="badge-sector badge-sector--' + m.sector.toLowerCase() + '">' + escaparHtml(m.sector) + '</span></td>' +
                '<td>' + m.cantidadTotal + ' ' + escaparHtml(m.unidad) + '</td>' +
                '<td><strong>' + fmtMon(m.montoTotal) + '</strong></td>' +
                '<td>' + m.pctMonto.toFixed(1) + '%</td>' +
                '<td><div style="display:flex; align-items:center; gap:0.5rem;"><div style="flex:1; background:var(--color-borde); height:6px; border-radius:3px; overflow:hidden;"><div style="width:' + Math.min(100, m.pctAcumulado) + '%; background:' + (m.zona === 'A' ? '#16a34a' : (m.zona === 'B' ? '#ca8a04' : '#64748b')) + '; height:100%;"></div></div><span>' + m.pctAcumulado.toFixed(1) + '%</span></div></td>' +
                '</tr>';
        }

        html += '</tbody></table></div>';
        contenedor.innerHTML = html;
    }

    // Exponer globalmente
    window.renderizarAnalisisABC = renderizarAnalisisABC;
    window.SICOPAnalisisABC = {
        renderizar: renderizarAnalisisABC
    };
})();

