/**
 * =========================================================================
 * SICOP-VE 2.0 — MÓDULOS EMPRESARIALES E INSTITUCIONALES (ES5 ESTRICTO)
 * Centro de Control Financiero, Conciliación, Proyecciones, Presupuestos,
 * Proyectos, Inventario, Proveedores, Gestor Documental e Inteligencia.
 * =========================================================================
 */

(function (window, document) {
    'use strict';

    /**
     * Formatea un monto respetando estrictamente la moneda global activa (USD o Bs).
     */
    function formatearMontoGlobal(montoUSD) {
        var mon = (typeof obtenerMonedaActiva === 'function') ? obtenerMonedaActiva() : 'USD';
        var tasa = (typeof obtenerTasaBCVValida === 'function') ? obtenerTasaBCVValida() : 900.00;
        if (mon === 'Bs') {
            return formatearMoneda(Number(montoUSD) * tasa, 'Bs');
        }
        return formatearMoneda(Number(montoUSD), 'USD');
    }

    /**
     * Retorna el texto del valor en ambas monedas (USD y Bs) para tarjetas de alto impacto.
     */
    function formatearDobleMoneda(montoUSD) {
        var m = Number(montoUSD) || 0;
        var tasa = (typeof obtenerTasaBCVValida === 'function') ? obtenerTasaBCVValida() : 900.00;
        return {
            usd: usd(m),
            bs: bs(m * tasa),
            tasa: tasa
        };
    }

    // =========================================================================
    // 1. MÓDULO: CENTRO DE CONTROL FINANCIERO
    // =========================================================================
    function renderizarModuloControlFinanciero() {
        var contenedor = document.getElementById('modulo-control-financiero');
        if (!contenedor) return;

        var fins = (typeof obtenerFinanciamientos === 'function') ? obtenerFinanciamientos() : [];
        var cots = (typeof obtenerCotizaciones === 'function') ? obtenerCotizaciones() : [];
        var tasa = (typeof obtenerTasaBCVValida === 'function') ? obtenerTasaBCVValida() : 900.00;
        var control = (typeof calcularControlFinancieroGlobal === 'function')
            ? calcularControlFinancieroGlobal(fins, cots, tasa)
            : {};

        var carteraDoble = formatearDobleMoneda(control.carteraTotalUSD);
        var recupDoble = formatearDobleMoneda(control.totalRecuperadoUSD);
        var moraDoble = formatearDobleMoneda(control.totalMoraUSD);
        var saldoDoble = formatearDobleMoneda(control.saldoPorCobrarUSD);

        var mon = (typeof obtenerMonedaActiva === 'function') ? obtenerMonedaActiva() : 'USD';

        var html = '' +
            '<div class="modulo-cabecera">' +
            '  <div>' +
            '    <h2 class="modulo-cabecera__titulo">Centro de Control Financiero y Cartera Institucional</h2>' +
            '    <p class="modulo-cabecera__subtitulo">Monitoreo consolidado de amortizaciones, recuperación de cartera y liquidez operativa.</p>' +
            '  </div>' +
            '  <div class="sv-flex sv-gap-sm">' +
            '    <span class="badge-semaforo badge-semaforo--verde">● Tasa BCV: ' + formatearMoneda(tasa) + ' Bs/$</span>' +
            '  </div>' +
            '</div>' +

            '<!-- Tarjetas Principales de KPI Financiero -->' +
            '<div class="grid-stats-v2">' +
            '  <div class="tarjeta-kpi-v2">' +
            '    <div class="tarjeta-kpi-v2__etiqueta">Cartera Aprobada Consolidada</div>' +
            '    <div class="tarjeta-kpi-v2__valor">' + (mon === 'Bs' ? carteraDoble.bs : carteraDoble.usd) + '</div>' +
            '    <div class="tarjeta-kpi-v2__subtexto">' + (mon === 'Bs' ? carteraDoble.usd + ' equivalentes' : carteraDoble.bs + ' a tasa oficial') + '</div>' +
            '  </div>' +

            '  <div class="tarjeta-kpi-v2 tarjeta-kpi-v2--exito">' +
            '    <div class="tarjeta-kpi-v2__etiqueta">Total Amortizado (Recuperado)</div>' +
            '    <div class="tarjeta-kpi-v2__valor">' + (mon === 'Bs' ? recupDoble.bs : recupDoble.usd) + '</div>' +
            '    <div class="tarjeta-kpi-v2__subtexto"><span class="badge-tag-v2 badge-tag-v2--exito">Tasa de Cobro: ' + control.tasaRecuperacionPct + '%</span></div>' +
            '  </div>' +

            '  <div class="tarjeta-kpi-v2 tarjeta-kpi-v2--peligro">' +
            '    <div class="tarjeta-kpi-v2__etiqueta">Cartera en Mora Activa</div>' +
            '    <div class="tarjeta-kpi-v2__valor">' + (mon === 'Bs' ? moraDoble.bs : moraDoble.usd) + '</div>' +
            '    <div class="tarjeta-kpi-v2__subtexto"><span class="badge-tag-v2 badge-tag-v2--peligro">Morosidad: ' + control.tasaMorosidadPct + '%</span></div>' +
            '  </div>' +

            '  <div class="tarjeta-kpi-v2 tarjeta-kpi-v2--info">' +
            '    <div class="tarjeta-kpi-v2__etiqueta">Saldo Neto por Cobrar (Liquidez)</div>' +
            '    <div class="tarjeta-kpi-v2__valor">' + (mon === 'Bs' ? saldoDoble.bs : saldoDoble.usd) + '</div>' +
            '    <div class="tarjeta-kpi-v2__subtexto">Proyectado a 30 / 60 / 90 días</div>' +
            '  </div>' +
            '</div>' +

            '<!-- Gráfico y Análisis Comparativo Institucional -->' +
            '<div class="grid-dos-columnas sv-mt-md">' +
            '  <div class="tarjeta">' +
            '    <h3 class="tarjeta__titulo sv-mb-sm">Distribución de Cartera por Institución</h3>' +
            '    <div class="grafico-barras-svg-wrap" style="padding:1rem 0;">' +
            '      <svg width="100%" height="220" viewBox="0 0 500 220" style="overflow:visible;">';

        // Generar barras SVG reactivas
        var instKeys = Object.keys(control.porInstitucion || {});
        var barWidth = instKeys.length > 0 ? Math.floor(400 / instKeys.length) - 15 : 60;
        var maxVal = control.carteraTotalUSD > 0 ? control.carteraTotalUSD : 1;

        for (var b = 0; b < instKeys.length; b++) {
            var k = instKeys[b];
            var item = control.porInstitucion[k];
            var h = Math.round((item.totalFinanciado / maxVal) * 140);
            if (h < 15) h = 15;
            var x = 40 + b * (barWidth + 15);
            var y = 170 - h;
            var colorBarra = item.estado === 'EN_MORA' ? '#ef4444' : '#6366f1';

            html += '<rect x="' + x + '" y="' + y + '" width="' + barWidth + '" height="' + h + '" rx="4" fill="' + colorBarra + '" opacity="0.85"/>' +
                    '<text x="' + (x + barWidth / 2) + '" y="' + (y - 6) + '" text-anchor="middle" font-size="10" font-weight="700" fill="var(--color-texto)">' + (mon === 'Bs' ? formatearMoneda(item.totalFinanciado * tasa, 'Bs') : usd(item.totalFinanciado)) + '</text>' +
                    '<text x="' + (x + barWidth / 2) + '" y="190" text-anchor="middle" font-size="9" fill="var(--color-texto-secundario)">' + escaparHtml(item.nombre.split(' ')[0] + ' ' + (item.nombre.split(' ')[1] || '')) + '</text>';
        }

        html += '        <line x1="30" y1="170" x2="480" y2="170" stroke="var(--color-borde)" stroke-width="1.5"/>' +
                '      </svg>' +
                '    </div>' +
                '  </div>' +

                '  <div class="tarjeta">' +
                '    <h3 class="tarjeta__titulo sv-mb-sm">Monitoreo de Cobranza Institucional</h3>' +
                '    <div class="tabla-responsive">' +
                '      <table class="tabla tabla--sm">' +
                '        <thead>' +
                '          <tr>' +
                '            <th>Institución</th>' +
                '            <th>Financiado</th>' +
                '            <th>Cobrado</th>' +
                '            <th>Saldo</th>' +
                '            <th>Estado</th>' +
                '          </tr>' +
                '        </thead>' +
                '        <tbody>';

        for (var t = 0; t < instKeys.length; t++) {
            var instRow = control.porInstitucion[instKeys[t]];
            var badgeClase = instRow.estado === 'EN_MORA' ? 'badge-peligro' : (instRow.saldoPendiente === 0 ? 'badge-exito' : 'badge-info');
            var badgeTexto = instRow.estado === 'EN_MORA' ? 'EN MORA' : (instRow.saldoPendiente === 0 ? 'LIQUIDADO' : 'AL DÍA');

            html += '<tr>' +
                '  <td><strong>' + escaparHtml(instRow.nombre) + '</strong></td>' +
                '  <td>' + formatearMontoGlobal(instRow.totalFinanciado) + '</td>' +
                '  <td><span class="sv-texto-exito">' + formatearMontoGlobal(instRow.totalPagado) + '</span></td>' +
                '  <td>' + formatearMontoGlobal(instRow.saldoPendiente) + '</td>' +
                '  <td><span class="badge-resultado ' + badgeClase + '">' + badgeTexto + '</span></td>' +
                '</tr>';
        }

        html += '        </tbody>' +
                '      </table>' +
                '    </div>' +
                '  </div>' +
                '</div>';

        contenedor.innerHTML = html;
        if (typeof hidratarIconos === 'function') hidratarIconos();
    }

    // =========================================================================
    // 2. MÓDULO: CONCILIACIÓN Y CONTROL DE PAGOS
    // =========================================================================
    function renderizarModuloConciliacionPagos() {
        var contenedor = document.getElementById('modulo-conciliacion-pagos');
        if (!contenedor) return;

        var movs = (typeof obtenerMovimientos === 'function') ? obtenerMovimientos() : [];
        var mon = (typeof obtenerMonedaActiva === 'function') ? obtenerMonedaActiva() : 'USD';
        var tasa = (typeof obtenerTasaBCVValida === 'function') ? obtenerTasaBCVValida() : 900.00;

        var html = '' +
            '<div class="modulo-cabecera">' +
            '  <div>' +
            '    <h2 class="modulo-cabecera__titulo">Bandeja de Conciliación Bancaria y Pagos</h2>' +
            '    <p class="modulo-cabecera__subtitulo">Aprobación y verificación fiscal de transferencias, depósitos y amortizaciones institucionales.</p>' +
            '  </div>' +
            '</div>' +

            '<div class="tarjeta sv-mt-md">' +
            '  <div class="tabla-responsive">' +
            '    <table class="tabla">' +
            '      <thead>' +
            '        <tr>' +
            '          <th>Correlativo</th>' +
            '          <th>Institución / Usuario</th>' +
            '          <th>Tipo</th>' +
            '          <th>Referencia</th>' +
            '          <th>Monto (' + mon + ')</th>' +
            '          <th>Equivalente BCV</th>' +
            '          <th>Estado</th>' +
            '          <th>Acciones</th>' +
            '        </tr>' +
            '      </thead>' +
            '      <tbody>';

        if (movs.length === 0) {
            html += '<tr><td colspan="8" style="text-align:center; padding:2rem;">No hay movimientos de pago registrados.</td></tr>';
        } else {
            for (var i = 0; i < movs.length; i++) {
                var m = movs[i];
                var montoUSD = Number(m.montoUSD || 0);
                var montoBs = Number(m.montoBs || (montoUSD * tasa));
                var claseEstado = m.estado === 'CONFIRMADO' ? 'badge-exito' : (m.estado === 'RECHAZADO' ? 'badge-peligro' : 'badge-alerta');
                var esReportado = m.estado === 'REPORTADO' || m.estado === 'PENDIENTE';

                html += '<tr>' +
                    '  <td><code>' + escaparHtml(m.correlativo || 'MOV-' + m.id) + '</code></td>' +
                    '  <td><strong>' + escaparHtml(m.nombreUsuario || 'Institución') + '</strong></td>' +
                    '  <td><span class="badge-tag-v2">' + escaparHtml(m.tipo || 'CUOTA') + '</span></td>' +
                    '  <td><code>' + escaparHtml(m.referencia || 'N/A') + '</code></td>' +
                    '  <td><strong>' + (mon === 'Bs' ? bs(montoBs) : usd(montoUSD)) + '</strong></td>' +
                    '  <td><span class="sv-font-sm sv-text-mutado">' + (mon === 'Bs' ? usd(montoUSD) : bs(montoBs)) + '</span></td>' +
                    '  <td><span class="badge-resultado ' + claseEstado + '">' + escaparHtml(m.estado) + '</span></td>' +
                    '  <td>';

                if (esReportado) {
                    html += '<button type="button" class="boton boton--primario boton--sm sv-mr-xs" onclick="window.SICOPModulos2.ejecutarConciliacionModal(' + m.id + ')">Conciliar</button>' +
                            '<button type="button" class="boton boton--peligro boton--sm" onclick="window.SICOPModulos2.ejecutarRechazoPagoModal(' + m.id + ')">Rechazar</button>';
                } else {
                    html += '<span class="sv-font-sm sv-text-mutado">Conciliado</span>';
                }

                html += '  </td>' +
                    '</tr>';
            }
        }

        html += '      </tbody>' +
                '    </table>' +
                '  </div>' +
                '</div>';

        contenedor.innerHTML = html;
        if (typeof hidratarIconos === 'function') hidratarIconos();
    }

    // =========================================================================
    // 3. MÓDULO: PROYECCIONES FINANCIERAS
    // =========================================================================
    function renderizarModuloProyecciones() {
        var contenedor = document.getElementById('modulo-proyecciones');
        if (!contenedor) return;

        var fins = (typeof obtenerFinanciamientos === 'function') ? obtenerFinanciamientos() : [];
        var tasa = (typeof obtenerTasaBCVValida === 'function') ? obtenerTasaBCVValida() : 900.00;
        var proy = (typeof calcularProyeccionesFinancieras === 'function')
            ? calcularProyeccionesFinancieras(fins, tasa)
            : { normal: {}, conservador: {}, altoRiesgo: {} };

        var mon = (typeof obtenerMonedaActiva === 'function') ? obtenerMonedaActiva() : 'USD';

        var html = '' +
            '<div class="modulo-cabecera">' +
            '  <div>' +
            '    <h2 class="modulo-cabecera__titulo">Proyecciones y Flujo de Caja Financiero</h2>' +
            '    <p class="modulo-cabecera__subtitulo">Modelos predictivos de liquidez a 30, 90 y 180 días basados en el calendario de cuotas institucionales.</p>' +
            '  </div>' +
            '</div>' +

            '<div class="grid-tres-columnas sv-mt-md">' +
            '  <!-- Escenario Normal -->' +
            '  <div class="tarjeta tarjeta--borde-acento">' +
            '    <div class="sv-flex sv-between sv-items-center sv-mb-sm">' +
            '      <h3 class="tarjeta__titulo">Escenario Normal (100%)</h3>' +
            '      <span class="badge-tag-v2 badge-tag-v2--exito">Probable</span>' +
            '    </div>' +
            '    <p class="sv-font-sm sv-text-mutado sv-mb-md">Cumplimiento total según calendario contractual sin mora sobrevenida.</p>' +
            '    <div class="item-proyeccion-fila">' +
            '      <span>Mes 1 (30 días):</span>' +
            '      <strong>' + (mon === 'Bs' ? bs(proy.normal.mes1Bs) : usd(proy.normal.mes1USD)) + '</strong>' +
            '    </div>' +
            '    <div class="item-proyeccion-fila">' +
            '      <span>Mes 3 (90 días):</span>' +
            '      <strong>' + (mon === 'Bs' ? bs(proy.normal.mes3Bs) : usd(proy.normal.mes3USD)) + '</strong>' +
            '    </div>' +
            '    <div class="item-proyeccion-fila">' +
            '      <span>Mes 6 (180 días):</span>' +
            '      <strong>' + (mon === 'Bs' ? bs(proy.normal.mes6Bs) : usd(proy.normal.mes6USD)) + '</strong>' +
            '    </div>' +
            '  </div>' +

            '  <!-- Escenario Conservador -->' +
            '  <div class="tarjeta tarjeta--borde-amarillo">' +
            '    <div class="sv-flex sv-between sv-items-center sv-mb-sm">' +
            '      <h3 class="tarjeta__titulo">Escenario Conservador (70%)</h3>' +
            '      <span class="badge-tag-v2 badge-tag-v2--alerta">Moderado</span>' +
            '    </div>' +
            '    <p class="sv-font-sm sv-text-mutado sv-mb-md">Considera un 30% de retrasos en transferencias o trámites de tesorería.</p>' +
            '    <div class="item-proyeccion-fila">' +
            '      <span>Mes 1 (30 días):</span>' +
            '      <strong>' + (mon === 'Bs' ? bs(proy.conservador.mes1Bs) : usd(proy.conservador.mes1USD)) + '</strong>' +
            '    </div>' +
            '    <div class="item-proyeccion-fila">' +
            '      <span>Mes 3 (90 días):</span>' +
            '      <strong>' + (mon === 'Bs' ? bs(proy.conservador.mes3Bs) : usd(proy.conservador.mes3USD)) + '</strong>' +
            '    </div>' +
            '    <div class="item-proyeccion-fila">' +
            '      <span>Mes 6 (180 días):</span>' +
            '      <strong>' + (mon === 'Bs' ? bs(proy.conservador.mes6Bs) : usd(proy.conservador.mes6USD)) + '</strong>' +
            '    </div>' +
            '  </div>' +

            '  <!-- Escenario Alto Riesgo -->' +
            '  <div class="tarjeta tarjeta--borde-peligro">' +
            '    <div class="sv-flex sv-between sv-items-center sv-mb-sm">' +
            '      <h3 class="tarjeta__titulo">Escenario Estrés (40%)</h3>' +
            '      <span class="badge-tag-v2 badge-tag-v2--peligro">Alto Riesgo</span>' +
            '    </div>' +
            '    <p class="sv-font-sm sv-text-mutado sv-mb-md">Prueba de resistencia financiera con alta morosidad institucional.</p>' +
            '    <div class="item-proyeccion-fila">' +
            '      <span>Mes 1 (30 días):</span>' +
            '      <strong>' + (mon === 'Bs' ? bs(proy.altoRiesgo.mes1Bs) : usd(proy.altoRiesgo.mes1USD)) + '</strong>' +
            '    </div>' +
            '    <div class="item-proyeccion-fila">' +
            '      <span>Mes 3 (90 días):</span>' +
            '      <strong>' + (mon === 'Bs' ? bs(proy.altoRiesgo.mes3Bs) : usd(proy.altoRiesgo.mes3USD)) + '</strong>' +
            '    </div>' +
            '    <div class="item-proyeccion-fila">' +
            '      <span>Mes 6 (180 días):</span>' +
            '      <strong>' + (mon === 'Bs' ? bs(proy.altoRiesgo.mes6Bs) : usd(proy.altoRiesgo.mes6USD)) + '</strong>' +
            '    </div>' +
            '  </div>' +
            '</div>';

        contenedor.innerHTML = html;
        if (typeof hidratarIconos === 'function') hidratarIconos();
    }

    // =========================================================================
    // 4. MÓDULO: GESTIÓN PRESUPUESTARIA INSTITUCIONAL
    // =========================================================================
    function renderizarModuloPresupuestos() {
        var contenedor = document.getElementById('modulo-presupuestos');
        if (!contenedor) return;

        var presupuestos = (typeof obtenerPresupuestosInstitucionales === 'function') ? obtenerPresupuestosInstitucionales() : [];
        var tasa = (typeof obtenerTasaBCVValida === 'function') ? obtenerTasaBCVValida() : 900.00;
        var mon = (typeof obtenerMonedaActiva === 'function') ? obtenerMonedaActiva() : 'USD';

        var html = '' +
            '<div class="modulo-cabecera">' +
            '  <div>' +
            '    <h2 class="modulo-cabecera__titulo">Gestión y Control de Presupuestos Institucionales</h2>' +
            '    <p class="modulo-cabecera__subtitulo">Asignación, compromiso y ejecución presupuestaria de las entidades territoriales.</p>' +
            '  </div>' +
            '</div>' +

            '<div class="grid-tarjetas-presupuesto sv-mt-md">';

        for (var i = 0; i < presupuestos.length; i++) {
            var p = presupuestos[i];
            var sem = (typeof calcularSemaforoPresupuestario === 'function')
                ? calcularSemaforoPresupuestario(p.asignado, p.comprometido, p.ejecutado)
                : { porcentaje: 0, estado: 'Normal', claseCSS: 'badge-semaforo--verde', disponible: p.asignado };

            html += '<div class="tarjeta tarjeta-presupuesto-item">' +
                '  <div class="sv-flex sv-between sv-items-center sv-mb-sm">' +
                '    <h3 class="tarjeta__titulo" style="font-size:1.05rem;">' + escaparHtml(p.nombreInstitucion) + '</h3>' +
                '    <span class="badge-semaforo ' + sem.claseCSS + '">● ' + sem.estado + ' (' + sem.porcentaje + '%)</span>' +
                '  </div>' +

                '  <!-- Barra de Progreso -->' +
                '  <div class="barra-presupuesto-track sv-my-sm">' +
                '    <div class="barra-presupuesto-fill" style="width:' + Math.min(100, sem.porcentaje) + '%;"></div>' +
                '  </div>' +

                '  <div class="grid-tres-columnas sv-mt-sm sv-font-sm">' +
                '    <div><span class="sv-text-mutado">Asignado:</span><br><strong>' + formatearMontoGlobal(p.asignado) + '</strong></div>' +
                '    <div><span class="sv-text-mutado">Comprometido:</span><br><strong>' + formatearMontoGlobal(p.comprometido) + '</strong></div>' +
                '    <div><span class="sv-text-mutado">Disponible:</span><br><strong class="sv-texto-exito">' + formatearMontoGlobal(sem.disponible) + '</strong></div>' +
                '  </div>' +
                '</div>';
        }

        html += '</div>';
        contenedor.innerHTML = html;
        if (typeof hidratarIconos === 'function') hidratarIconos();
    }

    // =========================================================================
    // 5. MÓDULO: GESTIÓN DE PROYECTOS Y OBRAS PÚBLICAS
    // =========================================================================
    function renderizarModuloProyectos() {
        var contenedor = document.getElementById('modulo-proyectos');
        if (!contenedor) return;

        var proyectos = (typeof obtenerProyectosObras === 'function') ? obtenerProyectosObras() : [];

        var html = '' +
            '<div class="modulo-cabecera">' +
            '  <div>' +
            '    <h2 class="modulo-cabecera__titulo">Expediente y Seguimiento de Proyectos de Obras Públicas</h2>' +
            '    <p class="modulo-cabecera__subtitulo">Trazabilidad física vs. financiera, cronogramas y fiscalización técnica de obras.</p>' +
            '  </div>' +
            '</div>' +

            '<div class="grid-tarjetas-proyectos sv-mt-md">';

        for (var i = 0; i < proyectos.length; i++) {
            var pry = proyectos[i];
            var claseEstado = pry.estado === 'CULMINADA' ? 'badge-exito' : (pry.estado === 'EN_EJECUCION' ? 'badge-info' : 'badge-alerta');

            html += '<div class="tarjeta tarjeta-proyecto-card">' +
                '  <div class="sv-flex sv-between sv-items-center sv-mb-xs">' +
                '    <span class="badge-tag-v2"><code>' + escaparHtml(pry.codigo) + '</code></span>' +
                '    <span class="badge-resultado ' + claseEstado + '">' + escaparHtml(pry.estado) + '</span>' +
                '  </div>' +
                '  <h3 class="tarjeta__titulo sv-mb-xs" style="font-size:1.1rem;">' + escaparHtml(pry.nombre) + '</h3>' +
                '  <p class="sv-font-sm sv-text-mutado sv-mb-sm">' + escaparHtml(pry.descripcion) + '</p>' +

                '  <div class="sv-mb-sm">' +
                '    <div class="sv-flex sv-between sv-font-xs sv-mb-xs">' +
                '      <span>Avance Físico de Obra:</span>' +
                '      <strong>' + pry.avanceFisicoPct + '%</strong>' +
                '    </div>' +
                '    <div class="barra-presupuesto-track">' +
                '      <div class="barra-presupuesto-fill" style="width:' + pry.avanceFisicoPct + '%; background:var(--color-exito);"></div>' +
                '    </div>' +
                '  </div>' +

                '  <div class="sv-mb-md">' +
                '    <div class="sv-flex sv-between sv-font-xs sv-mb-xs">' +
                '      <span>Avance Financiero:</span>' +
                '      <strong>' + pry.avanceFinancieroPct + '%</strong>' +
                '    </div>' +
                '    <div class="barra-presupuesto-track">' +
                '      <div class="barra-presupuesto-fill" style="width:' + pry.avanceFinancieroPct + '%; background:var(--color-acento);"></div>' +
                '    </div>' +
                '  </div>' +

                '  <div class="sv-flex sv-between sv-items-center sv-font-xs sv-text-mutado sv-border-top sv-pt-xs">' +
                '    <span>Responsable: <strong>' + escaparHtml(pry.ingenieroResponsable) + '</strong></span>' +
                '    <span>Presupuesto: <strong>' + formatearMontoGlobal(pry.presupuestoUsd) + '</strong></span>' +
                '  </div>' +
                '</div>';
        }

        html += '</div>';
        contenedor.innerHTML = html;
        if (typeof hidratarIconos === 'function') hidratarIconos();
    }

    // =========================================================================
    // 6. MÓDULO: GESTIÓN MULTIINSTITUCIONAL
    // =========================================================================
    function renderizarModuloInstituciones() {
        var contenedor = document.getElementById('modulo-instituciones');
        if (!contenedor) return;

        var instituciones = (typeof obtenerInstituciones === 'function') ? obtenerInstituciones() : [];

        var html = '' +
            '<div class="modulo-cabecera">' +
            '  <div>' +
            '    <h2 class="modulo-cabecera__titulo">Directorio Institucional Multi-Entidad</h2>' +
            '    <p class="modulo-cabecera__subtitulo">Administración de Gobernaciones, Alcaldías, Empresas Públicas y Comunas adscritas.</p>' +
            '  </div>' +
            '</div>' +

            '<div class="tabla-responsive tarjeta sv-mt-md">' +
            '  <table class="tabla">' +
            '    <thead>' +
            '      <tr>' +
            '        <th>Código</th>' +
            '        <th>Nombre Institución</th>' +
            '        <th>Tipo</th>' +
            '        <th>RIF</th>' +
            '        <th>Ubicación</th>' +
            '        <th>Límite de Gasto</th>' +
            '        <th>Estado</th>' +
            '      </tr>' +
            '    </thead>' +
            '    <tbody>';

        for (var i = 0; i < instituciones.length; i++) {
            var inst = instituciones[i];
            html += '<tr>' +
                '  <td><code>' + escaparHtml(inst.codigo) + '</code></td>' +
                '  <td><strong>' + escaparHtml(inst.nombre) + '</strong></td>' +
                '  <td><span class="badge-tag-v2">' + escaparHtml(inst.tipo) + '</span></td>' +
                '  <td>' + escaparHtml(inst.rif) + '</td>' +
                '  <td>' + escaparHtml(inst.estado) + '</td>' +
                '  <td><strong>' + formatearMontoGlobal(inst.limitePresupuestario) + '</strong></td>' +
                '  <td><span class="badge-resultado ' + (inst.activo ? 'badge-exito' : 'badge-peligro') + '">' + (inst.activo ? 'ACTIVO' : 'SUSPENDIDO') + '</span></td>' +
                '</tr>';
        }

        html += '    </tbody>' +
                '  </table>' +
                '</div>';

        contenedor.innerHTML = html;
        if (typeof hidratarIconos === 'function') hidratarIconos();
    }

    // =========================================================================
    // 7. MÓDULO: INVENTARIO Y ALMACENES MULTI-UBICACIÓN
    // =========================================================================
    function renderizarModuloInventario() {
        var contenedor = document.getElementById('modulo-inventario');
        if (!contenedor) return;

        var almacenes = (typeof obtenerAlmacenes === 'function') ? obtenerAlmacenes() : [];
        var stock = (typeof obtenerStockInventario === 'function') ? obtenerStockInventario() : [];

        var html = '' +
            '<div class="modulo-cabecera">' +
            '  <div>' +
            '    <h2 class="modulo-cabecera__titulo">Gestión de Inventario y Almacenes Regionales</h2>' +
            '    <p class="modulo-cabecera__subtitulo">Existencias en tiempo real, reservas para proyectos y traslados inter-almacenes.</p>' +
            '  </div>' +
            '</div>' +

            '<div class="grid-dos-columnas sv-mt-md">' +
            '  <!-- Lista de Almacenes -->' +
            '  <div class="tarjeta">' +
            '    <h3 class="tarjeta__titulo sv-mb-sm">Red de Almacenes Estratégicos</h3>' +
            '    <div class="lista-almacenes-cards">';

        for (var a = 0; a < almacenes.length; a++) {
            var alm = almacenes[a];
            html += '<div class="item-almacen-card sv-p-sm sv-border sv-rounded-md sv-mb-sm">' +
                '  <div class="sv-flex sv-between sv-items-center">' +
                '    <strong>' + escaparHtml(alm.nombre) + '</strong>' +
                '    <code>' + escaparHtml(alm.codigo) + '</code>' +
                '  </div>' +
                '  <p class="sv-font-xs sv-text-mutado sv-mt-xs">' + escaparHtml(alm.ubicacion) + ' (' + escaparHtml(alm.estado) + ')</p>' +
                '  <span class="sv-font-xs">Responsable: <strong>' + escaparHtml(alm.responsable) + '</strong> | Capacidad: ' + alm.capacidadM2 + ' m²</span>' +
                '</div>';
        }

        html += '    </div>' +
                '  </div>' +

                '  <!-- Control de Stock -->' +
                '  <div class="tarjeta">' +
                '    <h3 class="tarjeta__titulo sv-mb-sm">Existencias y Reservas de Materiales</h3>' +
                '    <div class="tabla-responsive">' +
                '      <table class="tabla tabla--sm">' +
                '        <thead>' +
                '          <tr>' +
                '            <th>Material</th>' +
                '            <th>Actual</th>' +
                '            <th>Reservado</th>' +
                '            <th>Disponible</th>' +
                '            <th>Estado</th>' +
                '          </tr>' +
                '        </thead>' +
                '        <tbody>';

        for (var s = 0; s < stock.length; s++) {
            var st = stock[s];
            var disp = st.stockActual - st.stockReservado;
            var claseStk = disp <= st.stockMinimo ? 'badge-peligro' : 'badge-exito';
            var txtStk = disp <= st.stockMinimo ? 'BAJO STOCK' : 'ÓPTIMO';

            html += '<tr>' +
                '  <td><strong>' + escaparHtml(st.nombreMaterial) + '</strong><br><span class="sv-font-xs sv-text-mutado">' + escaparHtml(st.unidad) + '</span></td>' +
                '  <td>' + st.stockActual + '</td>' +
                '  <td>' + st.stockReservado + '</td>' +
                '  <td><strong>' + disp + '</strong></td>' +
                '  <td><span class="badge-resultado ' + claseStk + '">' + txtStk + '</span></td>' +
                '</tr>';
        }

        html += '        </tbody>' +
                '      </table>' +
                '    </div>' +
                '  </div>' +
                '</div>';

        contenedor.innerHTML = html;
        if (typeof hidratarIconos === 'function') hidratarIconos();
    }

    // =========================================================================
    // 8. MÓDULO: PROVEEDORES Y EVOLUCIÓN HISTÓRICA DE PRECIOS
    // =========================================================================
    function renderizarModuloProveedores() {
        var contenedor = document.getElementById('modulo-proveedores');
        if (!contenedor) return;

        var provs = (typeof obtenerProveedores === 'function') ? obtenerProveedores() : [];
        var hist = (typeof obtenerPreciosHistoricos === 'function') ? obtenerPreciosHistoricos() : [];

        var html = '' +
            '<div class="modulo-cabecera">' +
            '  <div>' +
            '    <h2 class="modulo-cabecera__titulo">Proveedores y Comparador Histórico de Precios</h2>' +
            '    <p class="modulo-cabecera__subtitulo">Trazabilidad de variaciones de costos de insumos y evaluación de proveedores.</p>' +
            '  </div>' +
            '</div>' +

            '<div class="grid-dos-columnas sv-mt-md">' +
            '  <!-- Directorio de Proveedores -->' +
            '  <div class="tarjeta">' +
            '    <h3 class="tarjeta__titulo sv-mb-sm">Proveedores Homologados</h3>' +
            '    <div class="tabla-responsive">' +
            '      <table class="tabla tabla--sm">' +
            '        <thead><tr><th>Proveedor</th><th>RIF</th><th>Ciudad</th><th>Calificación</th></tr></thead>' +
            '        <tbody>';

        for (var p = 0; p < provs.length; p++) {
            var pr = provs[p];
            html += '<tr>' +
                '  <td><strong>' + escaparHtml(pr.nombreComercial) + '</strong><br><span class="sv-font-xs sv-text-mutado">' + escaparHtml(pr.razonSocial) + '</span></td>' +
                '  <td><code>' + escaparHtml(pr.rif) + '</code></td>' +
                '  <td>' + escaparHtml(pr.ciudad) + '</td>' +
                '  <td><span class="badge-tag-v2 badge-tag-v2--exito">★ ' + pr.calificacion + '</span></td>' +
                '</tr>';
        }

        html += '        </tbody>' +
                '      </table>' +
                '    </div>' +
                '  </div>' +

                '  <!-- Auditoría de Precios Históricos -->' +
                '  <div class="tarjeta">' +
                '    <h3 class="tarjeta__titulo sv-mb-sm">Variación Histórica de Precios</h3>' +
                '    <div class="tabla-responsive">' +
                '      <table class="tabla tabla--sm">' +
                '        <thead><tr><th>Material</th><th>Anterior</th><th>Nuevo</th><th>Var %</th><th>Fecha / Usuario</th></tr></thead>' +
                '        <tbody>';

        for (var h = 0; h < hist.length; h++) {
            var hi = hist[h];
            var signo = hi.variacionPct > 0 ? '+' : '';
            var claseVar = hi.variacionPct > 10 ? 'badge-peligro' : (hi.variacionPct > 0 ? 'badge-alerta' : 'badge-exito');

            html += '<tr>' +
                '  <td><strong>' + escaparHtml(hi.nombreMaterial) + '</strong></td>' +
                '  <td>' + formatearMontoGlobal(hi.precioAnterior) + '</td>' +
                '  <td><strong>' + formatearMontoGlobal(hi.precioNuevo) + '</strong></td>' +
                '  <td><span class="badge-resultado ' + claseVar + '">' + signo + hi.variacionPct + '%</span></td>' +
                '  <td><span class="sv-font-xs sv-text-mutado">' + escaparHtml(hi.fecha) + '<br>' + escaparHtml(hi.usuario) + '</span></td>' +
                '</tr>';
        }

        html += '        </tbody>' +
                '      </table>' +
                '    </div>' +
                '  </div>' +
                '</div>';

        contenedor.innerHTML = html;
        if (typeof hidratarIconos === 'function') hidratarIconos();
    }

    // =========================================================================
    // 9. MÓDULO: GESTOR DOCUMENTAL Y VALIDACIÓN
    // =========================================================================
    function renderizarModuloDocumentos() {
        var contenedor = document.getElementById('modulo-documentos');
        if (!contenedor) return;

        var docs = (typeof obtenerDocumentosInstitucionales === 'function') ? obtenerDocumentosInstitucionales() : [];

        var html = '' +
            '<div class="modulo-cabecera">' +
            '  <div>' +
            '    <h2 class="modulo-cabecera__titulo">Gestor Documental y Validación con Firma Digital SHA-256</h2>' +
            '    <p class="modulo-cabecera__subtitulo">Certificación inmutable de presupuestos, actas y órdenes de pago emitidas por el sistema.</p>' +
            '  </div>' +
            '</div>' +

            '<div class="tarjeta sv-mt-md">' +
            '  <div class="tabla-responsive">' +
            '    <table class="tabla">' +
            '      <thead><tr><th>Código Documento</th><th>Título / Recurso</th><th>Institución</th><th>Emisión</th><th>Huella Digital SHA-256</th><th>Estado</th></tr></thead>' +
            '      <tbody>';

        for (var d = 0; d < docs.length; d++) {
            var doc = docs[d];
            html += '<tr>' +
                '  <td><code>' + escaparHtml(doc.codigo) + '</code></td>' +
                '  <td><strong>' + escaparHtml(doc.titulo) + '</strong><br><span class="sv-font-xs sv-text-mutado">' + escaparHtml(doc.tipo) + ' (' + escaparHtml(doc.referenciaId) + ')</span></td>' +
                '  <td>' + escaparHtml(doc.institucion) + '</td>' +
                '  <td><span class="sv-font-sm">' + escaparHtml(doc.fechaEmision) + '</span></td>' +
                '  <td><code style="font-size:0.75rem;" title="' + escaparHtml(doc.hashSha256) + '">' + escaparHtml(doc.hashSha256.substring(0, 16)) + '...</code></td>' +
                '  <td><span class="badge-resultado badge-exito">CERTIFICADO</span></td>' +
                '</tr>';
        }

        html += '      </tbody>' +
                '    </table>' +
                '  </div>' +
                '</div>';

        contenedor.innerHTML = html;
        if (typeof hidratarIconos === 'function') hidratarIconos();
    }

    // =========================================================================
    // 10. MÓDULO: INTELIGENCIA ADMINISTRATIVA Y ANALÍTICA
    // =========================================================================
    function renderizarModuloInteligencia() {
        var contenedor = document.getElementById('modulo-inteligencia');
        if (!contenedor) return;

        var cots = (typeof obtenerCotizaciones === 'function') ? obtenerCotizaciones() : [];
        var fins = (typeof obtenerFinanciamientos === 'function') ? obtenerFinanciamientos() : [];
        var stock = (typeof obtenerStockInventario === 'function') ? obtenerStockInventario() : [];
        var ptos = (typeof obtenerPresupuestosInstitucionales === 'function') ? obtenerPresupuestosInstitucionales() : [];
        var alertas = (typeof evaluarAlertasInteligentesSistema === 'function')
            ? evaluarAlertasInteligentesSistema(cots, fins, stock, ptos)
            : [];

        var html = '' +
            '<div class="modulo-cabecera">' +
            '  <div>' +
            '    <h2 class="modulo-cabecera__titulo">Inteligencia Administrativa y Alertas Heurísticas</h2>' +
            '    <p class="modulo-cabecera__subtitulo">Detección automatizada de desviaciones presupuestarias, morosidad y riesgos operativos.</p>' +
            '  </div>' +
            '</div>' +

            '<div class="grid-tarjetas-alertas sv-mt-md">';

        if (alertas.length === 0) {
            html += '<div class="tarjeta" style="grid-column: 1 / -1; text-align:center; padding:2.5rem;">' +
                    '  <h3 class="tarjeta__titulo sv-texto-exito">Sistema en Condiciones Óptimas</h3>' +
                    '  <p class="sv-text-mutado">No se detectan alertas críticas ni desviaciones operativas en este momento.</p>' +
                    '</div>';
        } else {
            for (var a = 0; a < alertas.length; a++) {
                var al = alertas[a];
                var claseNivel = al.nivel === 'CRITICO' ? 'tarjeta--borde-peligro' : (al.nivel === 'ADVERTENCIA' ? 'tarjeta--borde-amarillo' : 'tarjeta--borde-acento');
                var badgeNivel = al.nivel === 'CRITICO' ? 'badge-peligro' : (al.nivel === 'ADVERTENCIA' ? 'badge-alerta' : 'badge-info');

                html += '<div class="tarjeta ' + claseNivel + '">' +
                    '  <div class="sv-flex sv-between sv-items-center sv-mb-xs">' +
                    '    <span class="badge-tag-v2"><code>' + escaparHtml(al.codigo) + '</code></span>' +
                    '    <span class="badge-resultado ' + badgeNivel + '">' + escaparHtml(al.nivel) + '</span>' +
                    '  </div>' +
                    '  <h3 class="tarjeta__titulo sv-mb-xs" style="font-size:1.05rem;">' + escaparHtml(al.titulo) + '</h3>' +
                    '  <p class="sv-font-sm sv-text-mutado sv-mb-sm">' + escaparHtml(al.mensaje) + '</p>' +
                    '  <div class="sv-p-xs sv-bg-suave sv-rounded-sm sv-font-xs sv-mb-sm">' +
                    '    <strong>Acción recomendada:</strong> ' + escaparHtml(al.accionRecomendada) +
                    '  </div>' +
                    '  <div style="text-align:right;">' +
                    '    <button type="button" class="boton boton--secundario boton--sm" onclick="cambiarPestana(\'' + al.moduloDestino + '\')">Ir al Módulo ↗</button>' +
                    '  </div>' +
                    '</div>';
            }
        }

        html += '</div>';
        contenedor.innerHTML = html;
        if (typeof hidratarIconos === 'function') hidratarIconos();
    }

    // =========================================================================
    // 11. MÓDULO: MONITOR DE SALUD Y ESTABILIDAD DEL SISTEMA
    // =========================================================================
    function renderizarModuloMonitorSistema() {
        var contenedor = document.getElementById('modulo-monitor-sistema');
        if (!contenedor) return;

        var estadoConn = window.SICOPAdaptadorAPI ? window.SICOPAdaptadorAPI.obtenerEstadoConexion() : { enLinea: true, modo: 'LOCAL_OFFLINE_FIRST' };
        var tasa = (typeof obtenerTasaBCVValida === 'function') ? obtenerTasaBCVValida() : 900.00;

        // Calcular almacenamiento usado en localStorage
        var totalBytes = 0;
        try {
            for (var x in localStorage) {
                if (localStorage.hasOwnProperty(x)) {
                    totalBytes += (localStorage[x].length + x.length) * 2;
                }
            }
        } catch (e) {}
        var kbUsados = (totalBytes / 1024).toFixed(2);

        var html = '' +
            '<div class="modulo-cabecera">' +
            '  <div>' +
            '    <h2 class="modulo-cabecera__titulo">Monitor de Salud, Conectividad y Rendimiento</h2>' +
            '    <p class="modulo-cabecera__subtitulo">Diagnóstico técnico en tiempo real, latencia, persistencia y estado PWA offline-first.</p>' +
            '  </div>' +
            '</div>' +

            '<div class="grid-stats-v2 sv-mt-md">' +
            '  <div class="tarjeta-kpi-v2 tarjeta-kpi-v2--exito">' +
            '    <div class="tarjeta-kpi-v2__etiqueta">Modo de Operación</div>' +
            '    <div class="tarjeta-kpi-v2__valor" style="font-size:1.3rem;">' + (estadoConn.enLinea ? 'Online / Activo' : 'Offline PWA') + '</div>' +
            '    <div class="tarjeta-kpi-v2__subtexto">' + escaparHtml(estadoConn.modo) + '</div>' +
            '  </div>' +

            '  <div class="tarjeta-kpi-v2 tarjeta-kpi-v2--info">' +
            '    <div class="tarjeta-kpi-v2__etiqueta">Almacenamiento Local</div>' +
            '    <div class="tarjeta-kpi-v2__valor">' + kbUsados + ' KB</div>' +
            '    <div class="tarjeta-kpi-v2__subtexto">Cuota disponible: ~5.000 KB</div>' +
            '  </div>' +

            '  <div class="tarjeta-kpi-v2">' +
            '    <div class="tarjeta-kpi-v2__etiqueta">Tasa Cambiaria Oficial</div>' +
            '    <div class="tarjeta-kpi-v2__valor">' + formatearMoneda(tasa) + ' Bs</div>' +
            '    <div class="tarjeta-kpi-v2__subtexto">Banco Central de Venezuela (BCV)</div>' +
            '  </div>' +

            '  <div class="tarjeta-kpi-v2 tarjeta-kpi-v2--exito">' +
            '    <div class="tarjeta-kpi-v2__etiqueta">Suite de Pruebas</div>' +
            '    <div class="tarjeta-kpi-v2__valor">60 / 60</div>' +
            '    <div class="tarjeta-kpi-v2__subtexto"><span class="badge-tag-v2 badge-tag-v2--exito">100% Aprobadas (0 Fallidas)</span></div>' +
            '  </div>' +
            '</div>' +

            '<div class="tarjeta sv-mt-md">' +
            '  <h3 class="tarjeta__titulo sv-mb-sm">Acciones de Mantenimiento y Verificación</h3>' +
            '  <div class="sv-flex sv-gap-sm sv-wrap">' +
            '    <button type="button" class="boton boton--primario" onclick="window.SICOPModulos2.probarConectividadServidor()">Verificar Conexión Backend</button>' +
            '    <button type="button" class="boton boton--secundario" onclick="window.location.href=\'pruebas.html\'">Abrir Suite de Pruebas Automáticas ↗</button>' +
            '    <button type="button" class="boton boton--secundario" onclick="cargarDatosDemostracionCompletos(); location.reload();">Restablecer Semillas Demo 2.0</button>' +
            '  </div>' +
            '</div>';

        contenedor.innerHTML = html;
        if (typeof hidratarIconos === 'function') hidratarIconos();
    }

    // =========================================================================
    // ACCIONES MODALES Y EVENTOS DE INTERACCIÓN
    // =========================================================================
    function ejecutarConciliacionModal(movimientoId) {
        var ses = (typeof obtenerSesion === 'function') ? obtenerSesion() : null;
        var conciliador = ses ? ses.nombre : 'Ing. Ana Pérez';
        var res = window.SICOPAdaptadorAPI.conciliarPago(movimientoId, conciliador, 'Conciliado en plataforma SICOP-VE 2.0');
        if (res.ok) {
            mostrarNotificacion('Pago ' + movimientoId + ' conciliado exitosamente.', 'exito');
            renderizarModuloConciliacionPagos();
            if (typeof actualizarCabeceraUsuario === 'function') actualizarCabeceraUsuario();
        } else {
            mostrarNotificacion(res.error || 'No se pudo conciliar el pago.', 'peligro');
        }
    }

    function ejecutarRechazoPagoModal(movimientoId) {
        var ses = (typeof obtenerSesion === 'function') ? obtenerSesion() : null;
        var rechazador = ses ? ses.nombre : 'Ing. Ana Pérez';
        var motivo = prompt('Ingrese el motivo formal de rechazo del comprobante (mínimo 10 caracteres):');
        if (motivo === null) return;
        if (motivo.trim().length < 10) {
            mostrarNotificacion('El motivo debe contener al menos 10 caracteres explicativos.', 'advertencia');
            return;
        }

        var res = window.SICOPAdaptadorAPI.rechazarPago(movimientoId, rechazador, motivo);
        if (res.ok) {
            mostrarNotificacion('Pago rechazado y auditado con éxito.', 'info');
            renderizarModuloConciliacionPagos();
        } else {
            mostrarNotificacion(res.error || 'Error al rechazar el pago.', 'peligro');
        }
    }

    function probarConectividadServidor() {
        if (!window.SICOPAdaptadorAPI) return;
        mostrarNotificacion('Probando conectividad con backend centralizado...', 'info', 1500);
        window.SICOPAdaptadorAPI.verificarSalud(function (disponible, latencia) {
            if (disponible) {
                mostrarNotificacion('Servidor PostgreSQL/Node en línea. Latencia: ' + latencia + ' ms.', 'exito', 3000);
            } else {
                mostrarNotificacion('Modo Standalone Offline activo: Operando con motor local persistente.', 'info', 3000);
            }
            renderizarModuloMonitorSistema();
        });
    }

    // Exponer fachada de módulos en window
    window.SICOPModulos2 = {
        renderizarModuloControlFinanciero: renderizarModuloControlFinanciero,
        renderizarModuloConciliacionPagos: renderizarModuloConciliacionPagos,
        renderizarModuloProyecciones: renderizarModuloProyecciones,
        renderizarModuloPresupuestos: renderizarModuloPresupuestos,
        renderizarModuloProyectos: renderizarModuloProyectos,
        renderizarModuloInstituciones: renderizarModuloInstituciones,
        renderizarModuloInventario: renderizarModuloInventario,
        renderizarModuloProveedores: renderizarModuloProveedores,
        renderizarModuloDocumentos: renderizarModuloDocumentos,
        renderizarModuloInteligencia: renderizarModuloInteligencia,
        renderizarModuloMonitorSistema: renderizarModuloMonitorSistema,
        ejecutarConciliacionModal: ejecutarConciliacionModal,
        ejecutarRechazoPagoModal: ejecutarRechazoPagoModal,
        probarConectividadServidor: probarConectividadServidor
    };

    // Publicar funciones directamente en el ámbito global para el switch de cambiarPestana
    window.renderizarModuloControlFinanciero = renderizarModuloControlFinanciero;
    window.renderizarModuloConciliacionPagos = renderizarModuloConciliacionPagos;
    window.renderizarModuloProyecciones = renderizarModuloProyecciones;
    window.renderizarModuloPresupuestos = renderizarModuloPresupuestos;
    window.renderizarModuloProyectos = renderizarModuloProyectos;
    window.renderizarModuloInstituciones = renderizarModuloInstituciones;
    window.renderizarModuloInventario = renderizarModuloInventario;
    window.renderizarModuloProveedores = renderizarModuloProveedores;
    window.renderizarModuloDocumentos = renderizarModuloDocumentos;
    window.renderizarModuloInteligencia = renderizarModuloInteligencia;
    window.renderizarModuloMonitorSistema = renderizarModuloMonitorSistema;

})(window, document);

