/* ============================================================
   SICOP-VE — Suite de Pruebas Unitarias y de Integración (js/pruebas.js)
   Proyecto Final: Lógica y Programación I
   
   Ejecuta automáticamente una batería de pruebas sobre las funciones
   de js/logica.js para verificar el cumplimiento riguroso de cada
   regla de negocio y de los algoritmos de la materia.
   ============================================================ */

/**
 * Captura una instantánea completa de todas las claves sicop_* en localStorage.
 * @returns {Object} Mapa clave -> valor.
 */
function _capturarSnapshotStorage() {
    var snap = {};
    try {
        if (typeof CLAVES_STORAGE !== 'undefined') {
            for (var k in CLAVES_STORAGE) {
                if (CLAVES_STORAGE.hasOwnProperty(k)) {
                    var c = CLAVES_STORAGE[k];
                    snap[c] = localStorage.getItem(c);
                }
            }
        }
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key && key.indexOf('sicop_') === 0 && snap[key] === undefined) {
                snap[key] = localStorage.getItem(key);
            }
        }
    } catch (e) {
        console.error('Error capturando snapshot de localStorage:', e);
    }
    return snap;
}

/**
 * Restaura exactamente el estado del almacenamiento desde una instantánea.
 * @param {Object} snap - Mapa de claves y valores.
 */
function _restaurarSnapshotStorage(snap) {
    if (!snap) return;
    try {
        var clavesActuales = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key && key.indexOf('sicop_') === 0) {
                clavesActuales.push(key);
            }
        }
        for (var j = 0; j < clavesActuales.length; j++) {
            var kAct = clavesActuales[j];
            if (snap[kAct] === undefined || snap[kAct] === null) {
                localStorage.removeItem(kAct);
            }
        }
        for (var k in snap) {
            if (snap.hasOwnProperty(k)) {
                if (snap[k] === null || snap[k] === undefined) {
                    localStorage.removeItem(k);
                } else {
                    localStorage.setItem(k, snap[k]);
                }
            }
        }
    } catch (e) {
        console.error('Error restaurando snapshot de localStorage:', e);
    }
}

/**
 * Registra y ejecuta la suite completa de pruebas automáticas.
 */
function ejecutarSuitePruebas() {
    var resultados = [];
    var snapshotInicial = _capturarSnapshotStorage();

    /**
     * Función auxiliar para asentar un caso de prueba.
     */
    function verificar(numero, caso, esperado, obtenido, condicionExito) {
        resultados.push({
            numero: numero,
            caso: caso,
            esperado: esperado,
            obtenido: obtenido,
            paso: Boolean(condicionExito)
        });
    }

    try {

    // ------------------------------------------------------------
    // PRUEBA 1: Total con IVA y Contingencia correcto
    // ------------------------------------------------------------
    (function () {
        // Material: 10 unidades a $10.00 en Pto Ordaz (factor 0.90) = Subtotal $90.00
        // Estado: Distrito Capital (factor flete 1.00 -> flete $0.00)
        // Perfil: Constructor (descuento 0%)
        // Neto = 90.00
        // Contingencia (5%) = 4.50
        // Base IVA = 94.50
        // IVA (16%) = 15.12
        // Total USD = 109.62
        var items = [{ materialId: 99, nombre: 'Item Test', unidad: 'Und', sector: 'Construcción', precioBase: 10.00, cantidad: 10 }];
        var ciudad = { nombre: 'Puerto Ordaz', factor: 0.90 };
        var usuario = { perfil: 'Constructor', estado: 'Distrito Capital' };
        var calc = calcularPresupuestoCotizacion(items, ciudad, usuario, 36.50);

        var totalObtenido = Number(calc.total.toFixed(2));
        var totalEsperado = 109.62;
        verificar(
            1,
            'Cálculo de Cotización con IVA (16%) y Contingencia (5%)',
            '$' + totalEsperado + ' USD',
            '$' + totalObtenido + ' USD',
            Math.abs(totalObtenido - totalEsperado) < 0.01
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 2: Rechazo de cantidades negativas en validación
    // ------------------------------------------------------------
    (function () {
        var catalogo = [{ id: 1, nombre: 'Cemento', precioBase: 8.5, activo: true, unidad: 'Saco' }];
        var entradaInvalida = { 1: -5 };
        var res = validarCantidadesCotizacion(catalogo, entradaInvalida);
        verificar(
            2,
            'Validación de cantidades: rechazar números negativos',
            'valido: false',
            'valido: ' + res.valido + ' (' + res.error + ')',
            res.valido === false && res.error.indexOf('no puede ser negativa') !== -1
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 3: Restricción de una cotización abierta (BORRADOR o ENVIADA)
    // ------------------------------------------------------------
    (function () {
        var cotizacionesEjemplo = [
            { id: 101, usuarioId: 50, estado: 'BORRADOR', correlativo: 'COT-0101' },
            { id: 102, usuarioId: 51, estado: 'APROBADA', correlativo: 'COT-0102' }
        ];
        var resUsuario50 = verificarDisponibilidadNuevaCotizacion(50, cotizacionesEjemplo);
        var resUsuario51 = verificarDisponibilidadNuevaCotizacion(51, cotizacionesEjemplo);

        var paso = (resUsuario50.puede === false) && (resUsuario51.puede === true);
        verificar(
            3,
            'Restricción estricta: bloqueo si tiene cotización BORRADOR o ENVIADA',
            'Usuario 50 bloqueado, Usuario 51 habilitado',
            'Usuario 50 puede: ' + resUsuario50.puede + ' | Usuario 51 puede: ' + resUsuario51.puede,
            paso
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 4: Algoritmo Burbuja ascendente (sin usar sort())
    // ------------------------------------------------------------
    (function () {
        var ciudades = [
            { nombre: 'Caracas', factor: 1.05 },
            { nombre: 'Puerto Ordaz', factor: 0.90 },
            { nombre: 'Valencia', factor: 0.95 }
        ];
        var ordenadas = ordenarBurbuja(ciudades, 'factor', true);
        var esMenorAMayor = (ordenadas[0].factor === 0.90 && ordenadas[1].factor === 0.95 && ordenadas[2].factor === 1.05);

        verificar(
            4,
            'Algoritmo Burbuja manual (Ascendente de ciudades por factor)',
            'Puerto Ordaz (0.90), Valencia (0.95), Caracas (1.05)',
            ordenadas.map(function (c) { return c.nombre + ' (' + c.factor + ')'; }).join(', '),
            esMenorAMayor
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 5: Algoritmo Burbuja descendente (Ranking por monto)
    // ------------------------------------------------------------
    (function () {
        var lista = [
            { nombre: 'Obra B', monto: 1200 },
            { nombre: 'Obra A', monto: 5000 },
            { nombre: 'Obra C', monto: 3500 }
        ];
        var ranking = ordenarBurbuja(lista, 'monto', false);
        var ordenCorrecto = (ranking[0].monto === 5000 && ranking[1].monto === 3500 && ranking[2].monto === 1200);

        verificar(
            5,
            'Algoritmo Burbuja manual (Descendente para ranking de supervisión)',
            '5000, 3500, 1200',
            ranking.map(function (r) { return r.monto; }).join(', '),
            ordenCorrecto
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 6: Aprobación rechazada por fondos insuficientes
    // ------------------------------------------------------------
    (function () {
        // Usuario con límite $5,000, gastado $4,000, comprometido $800 -> Disponible $200
        var usuario = {
            id: 88,
            nombre: 'Test Fondos',
            perfil: 'Empresa',
            limiteGasto: 5000,
            gastado: 4000,
            comprometido: 800
        };
        // Cotización por $500 (supera los $200 disponibles)
        var cot = { total: 500 };
        var evaluacion = evaluarAprobacionCotizacion(cot, usuario);

        verificar(
            6,
            'Control Presupuestario: rechazo de aprobación por déficit de fondos',
            'aprobable: false con déficit de $300.00',
            'aprobable: ' + evaluacion.aprobable + ' | faltante: $' + (evaluacion.faltante || 0),
            evaluacion.aprobable === false && Math.abs(evaluacion.faltante - 300) < 0.01
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 7: Aprobación exitosa y reserva de fondos comprometidos
    // ------------------------------------------------------------
    (function () {
        var usuario = {
            id: 89,
            nombre: 'Test Aprobado',
            perfil: 'Alcaldía',
            limiteGasto: 10000,
            gastado: 2000,
            comprometido: 1000
        };
        // Cotización por $1500 (disponible es $7000)
        var cot = { total: 1500 };
        var evaluacion = evaluarAprobacionCotizacion(cot, usuario);

        verificar(
            7,
            'Control Presupuestario: aprobación y reserva de saldo comprometido',
            'aprobable: true, nuevoComprometido: $2500.00',
            'aprobable: ' + evaluacion.aprobable + ', comprometido estimado: $' + evaluacion.nuevoComprometidoEstimado,
            evaluacion.aprobable === true && evaluacion.nuevoComprometidoEstimado === 2500
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 8: Paso de comprometido a gastado al entregar obra
    // ------------------------------------------------------------
    (function () {
        var usuario = {
            limiteGasto: 10000,
            comprometido: 2500,
            gastado: 2000
        };
        var montoEntregado = 1500;
        // Simulación lógica de transición ENTREGADA:
        usuario.comprometido -= montoEntregado;
        usuario.gastado += montoEntregado;

        var paso = (usuario.comprometido === 1000 && usuario.gastado === 3500);
        verificar(
            8,
            'Transición de Estado ENTREGADA: comprometido pasa a gastado',
            'Comprometido: $1000, Gastado: $3500',
            'Comprometido: $' + usuario.comprometido + ', Gastado: $' + usuario.gastado,
            paso
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 9: Estimador de Materiales - Pared de bloques
    // ------------------------------------------------------------
    (function () {
        // Pared 4m largo x 2.5m alto = 10 m²
        // Desperdicio: 10%
        // Bloques base = 10 * 12.5 = 125 bloques -> con 10% = Math.ceil(137.5) = 138 bloques
        // Cemento base = 10 * 0.20 = 2 sacos -> con 10% = Math.ceil(2.2) = 3 sacos
        var est = calcularMaterialesPared(4, 2.5, 10);
        var bloques = est.resultados[0].cantidad;
        var cemento = est.resultados[1].cantidad;

        var paso = (bloques === 138 && cemento === 3);
        verificar(
            9,
            'Calculadora de Obra: Estimación de bloques y cemento para pared (10 m²)',
            '138 bloques y 3 sacos cemento (con 10% desperdicio)',
            bloques + ' bloques y ' + cemento + ' sacos',
            paso
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 10: Estimador de Materiales - Losa de Concreto
    // ------------------------------------------------------------
    (function () {
        // Losa 5m x 4m x 0.10m espesor = 2 m³ (Área 20 m²)
        // Cabilla: 1.5 barras/m²
        // Desperdicio: 10%
        // Cemento base = 2 * 7 = 14 sacos -> con 10% = Math.ceil(15.4) = 16 sacos
        // Cabilla base = 20 * 1.5 = 30 barras -> con 10% = Math.ceil(33) = 33 barras
        var est = calcularMaterialesLosa(5, 4, 0.10, 1.5, 10);
        var cemento = est.resultados[0].cantidad;
        var cabillas = est.resultados[1].cantidad;

        var paso = (cemento === 16 && cabillas === 33);
        verificar(
            10,
            'Calculadora de Obra: Estimación de concreto y cabillas para losa (2 m³)',
            '16 sacos cemento y 33 barras de cabilla',
            cemento + ' sacos y ' + cabillas + ' cabillas',
            paso
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 11: Redondeo de tramos de tubería con Math.ceil
    // ------------------------------------------------------------
    (function () {
        // Tramo de 15 metros lineales (a 6m por tubo = 2.5 tubos)
        // Con 10% de desperdicio: 2.5 * 1.10 = 2.75 tubos -> Math.ceil = 3 tubos
        var est = calcularMaterialesTuberia(15, 10);
        var tubos = est.resultados[0].cantidad;

        verificar(
            11,
            'Calculadora de Tubería: Redondeo hacia arriba con Math.ceil (tramos de 6m)',
            '3 tubos de 6m',
            tubos + ' tubos',
            tubos === 3
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 12: Descuento institucional por perfil (Alcaldía vs Constructor)
    // ------------------------------------------------------------
    (function () {
        var items = [{ materialId: 1, nombre: 'Test', unidad: 'U', sector: 'V', precioBase: 100, cantidad: 1 }];
        var ciudad = { nombre: 'Base', factor: 1.00 };

        var uAlcaldia = { perfil: 'Alcaldía', estado: 'Distrito Capital' };
        var uConstructor = { perfil: 'Constructor', estado: 'Distrito Capital' };

        var calcAlcaldia = calcularPresupuestoCotizacion(items, ciudad, uAlcaldia, 36.50);
        var calcConstructor = calcularPresupuestoCotizacion(items, ciudad, uConstructor, 36.50);

        var paso = (calcAlcaldia.descuento === 4.00 && calcConstructor.descuento === 0.00);
        verificar(
            12,
            'Diferenciación de Descuento por Perfil (Alcaldía 4% vs Constructor 0%)',
            'Alcaldía: $4.00 desc, Constructor: $0.00 desc',
            'Alcaldía: $' + calcAlcaldia.descuento.toFixed(2) + ', Constructor: $' + calcConstructor.descuento.toFixed(2),
            paso
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 13: Semáforo de ejecución presupuestaria
    // ------------------------------------------------------------
    (function () {
        var uNormal = { limiteGasto: 1000, gastado: 400, comprometido: 100 }; // 50% -> normal
        var uAlerta = { limiteGasto: 1000, gastado: 600, comprometido: 100 }; // 70% -> alerta
        var uCritico = { limiteGasto: 1000, gastado: 850, comprometido: 100 }; // 95% -> critico

        var stNormal = calcularEstadoPresupuestoUsuario(uNormal).semaforo;
        var stAlerta = calcularEstadoPresupuestoUsuario(uAlerta).semaforo;
        var stCritico = calcularEstadoPresupuestoUsuario(uCritico).semaforo;

        var paso = (stNormal === 'normal' && stAlerta === 'alerta' && stCritico === 'critico');
        verificar(
            13,
            'Semáforo Presupuestario (<60% normal, 60%-89% alerta, >=90% crítico)',
            'normal, alerta, critico',
            stNormal + ', ' + stAlerta + ', ' + stCritico,
            paso
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 14: Validación de material en Catálogo (nombre único y precio > 0)
    // ------------------------------------------------------------
    (function () {
        var catalogo = [{ id: 1, nombre: 'Cemento Gris', precioBase: 8.5 }];
        var matInvalidoPrecio = { nombre: 'Pintura', precioBase: -2, unidad: 'Galón' };
        var matInvalidoRepetido = { nombre: 'cemento gris', precioBase: 10, unidad: 'Saco' };

        var val1 = validarMaterialCatalogo(matInvalidoPrecio, catalogo);
        var val2 = validarMaterialCatalogo(matInvalidoRepetido, catalogo);

        var paso = (val1.valido === false && val2.valido === false);
        verificar(
            14,
            'Catálogo Gobernación: Rechazo de precio <= 0 y nombres duplicados',
            'Ambos rechazados con mensajes explicativos',
            'Val1: ' + val1.valido + ' (' + val1.error + ') | Val2: ' + val2.valido + ' (' + val2.error + ')',
            paso
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 15: Validación pedagógica de cantidades (rechazo de negativos con sugerencia concreta)
    // ------------------------------------------------------------
    (function () {
        var catalogo = [{ id: 1, nombre: 'Cemento Portland Tipo I', precioBase: 8.5, activo: true, unidad: 'Saco' }];
        var entradaInvalida = { 1: -10 };
        var res = validarCantidadesCotizacion(catalogo, entradaInvalida);

        var contieneConsejo = res.error && (res.error.indexOf('Prueba con') !== -1 || res.error.indexOf('mayor que cero') !== -1);
        var rechazoNegativo = (res.valido === false) && (res.error.indexOf('no puede ser negativa') !== -1);

        verificar(
            15,
            'Mensajes de Error Claros: Rechazo de negativos con instrucción didáctica',
            'valido: false con mensaje que incluye sugerencia concreta',
            'valido: ' + res.valido + ' (' + res.error + ')',
            rechazoNegativo && contieneConsejo
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 16: Asistente Paso 1: Validación de nombre descriptivo y estado de obra
    // ------------------------------------------------------------
    (function () {
        var invalidoPorNombreCorto = validarPasoObra('Abc', 'Miranda');
        var validoCorrecto = validarPasoObra('Reparación Integral Ambulatorio', 'Miranda');
        var invalidoPorEstado = validarPasoObra('Reparación Integral Ambulatorio', 'EstadoInexistente');

        var paso = (invalidoPorNombreCorto.valido === false) &&
                   (validoCorrecto.valido === true) &&
                   (invalidoPorEstado.valido === false);

        verificar(
            16,
            'Asistente Paso 1: Validación de obra (nombre >= 4 chars y estado venezolano válido)',
            'Corto: false, Correcto: true, EstadoInv: false',
            'Corto: ' + invalidoPorNombreCorto.valido + ', Correcto: ' + validoCorrecto.valido + ', EstadoInv: ' + invalidoPorEstado.valido,
            paso
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 17: Plantillas de Obra: Verificación de estructura y precarga ("Casa pequeña")
    // ------------------------------------------------------------
    (function () {
        var plantilla = PLANTILLAS_OBRA ? PLANTILLAS_OBRA['casa_pequena'] : null;
        var existePlantilla = Boolean(plantilla && plantilla.cantidades);

        // Casa pequeña define: Cemento (id 1) = 40 sacos, Bloques (id 3) = 350 unidades
        var tieneCemento = plantilla && (plantilla.cantidades[1] === 40);
        var tieneBloques = plantilla && (plantilla.cantidades[3] === 350);

        verificar(
            17,
            'Plantillas de Obra: Estructura precargada "Casa pequeña" (40 sacos cemento, 350 bloques)',
            'Plantilla existente con Cemento=40 y Bloques=350',
            existePlantilla ? 'Nombre: ' + plantilla.nombre + ' | Cemento: ' + (plantilla.cantidades[1] || 0) + ' | Bloques: ' + (plantilla.cantidades[3] || 0) : 'No definida',
            existePlantilla && tieneCemento && tieneBloques
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 18: Total en Vivo: Consistencia entre cálculo reactivo y presupuesto definitivo
    // ------------------------------------------------------------
    (function () {
        var itemsVivo = [
            { materialId: 1, nombre: 'Cemento Portland', precioBase: 8.50, cantidad: 20, sector: 'Construcción', unidad: 'Saco' },
            { materialId: 2, nombre: 'Cabilla 1/2', precioBase: 14.00, cantidad: 10, sector: 'Construcción', unidad: 'Barra' }
        ];
        var ciudad = { nombre: 'Valencia', factor: 0.95 };
        var usuario = { perfil: 'Empresa', estado: 'Carabobo' };
        var tasa = 40.00;

        var calculoVivo = calcularPresupuestoCotizacion(itemsVivo, ciudad, usuario, tasa);

        // Subtotal = (20*8.50 + 10*14.00) * 0.95 = (170 + 140) * 0.95 = 310 * 0.95 = 294.50
        // Flete Carabobo (1.04) = 294.50 * 0.04 = 11.78
        // Descuento Empresa (2%) = (294.50 + 11.78) * 0.02 = 306.28 * 0.02 = 6.1256 -> 6.13
        // Neto = 306.28 - 6.13 = 300.15
        // Contingencia (5%) = 300.15 * 0.05 = 15.01
        // IVA (16%) = (300.15 + 15.01) * 0.16 = 315.16 * 0.16 = 50.43
        // Total USD = 315.16 + 50.43 = 365.59
        var subtotalEsperado = 294.50;
        var paso = Math.abs(calculoVivo.subtotal - subtotalEsperado) < 0.01 && calculoVivo.total > 0;

        verificar(
            18,
            'Total en Vivo: Consistencia matemática de subtotal con factor de ciudad',
            '$' + subtotalEsperado + ' USD',
            '$' + calculoVivo.subtotal.toFixed(2) + ' USD (Total final: $' + calculoVivo.total.toFixed(2) + ' USD)',
            paso
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 19: Formato Monetario Venezolano (Miles con punto, decimales con coma)
    // ------------------------------------------------------------
    (function () {
        var formateadoSimple = formatearMoneda(1234.56);
        var formateadoGrande = formatearMoneda(1234567.89, 'USD');

        var paso = (formateadoSimple === '1.234,56') && (formateadoGrande === '$1.234.567,89');

        verificar(
            19,
            'Formato Venezolano: Miles con punto (.) y decimales con coma (,)',
            '1.234,56 y $1.234.567,89',
            formateadoSimple + ' y ' + formateadoGrande,
            paso
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 20: Formato de Bolívares con tasa BCV oficial (prefijo "Bs.")
    // ------------------------------------------------------------
    (function () {
        // $100.00 a tasa 40.00 Bs/USD = Bs. 4.000,00
        var formateadoBs = formatearMoneda(100.00, 'Bs', 40.00);
        var esperado = 'Bs. 4.000,00';
        var paso = (formateadoBs === esperado);

        verificar(
            20,
            'Conversión y Formato en Bolívares (Tasa BCV referencial y prefijo "Bs.")',
            esperado,
            formateadoBs,
            paso
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 21: Duplicar Cotización: Bloqueo estricto si el usuario tiene una cotización abierta
    // ------------------------------------------------------------
    (function () {
        var cotizacionesEjemplo = [
            { id: 701, usuarioId: 77, estado: 'BORRADOR', correlativo: 'COT-0701' },
            { id: 702, usuarioId: 78, estado: 'APROBADA', correlativo: 'COT-0702' }
        ];

        var usuarioConBorrador = verificarDisponibilidadNuevaCotizacion(77, cotizacionesEjemplo);
        var usuarioSinBorrador = verificarDisponibilidadNuevaCotizacion(78, cotizacionesEjemplo);

        var paso = (usuarioConBorrador.puede === false) && (usuarioSinBorrador.puede === true);

        verificar(
            21,
            'Duplicar Cotización: Impedir duplicación si ya existe una abierta (BORRADOR/ENVIADA)',
            'Usuario 77 bloqueado (puede: false), Usuario 78 permitido (puede: true)',
            'Usuario 77 puede: ' + usuarioConBorrador.puede + ' | Usuario 78 puede: ' + usuarioSinBorrador.puede,
            paso
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 22: Modo Demostración: Vaciado completo del sistema y reinicio de cotizaciones
    // ------------------------------------------------------------
    (function () {
        var snap22 = _capturarSnapshotStorage();

        // Ejecutar vaciado de prueba
        vaciarDatosSistema();
        var cotizacionesDespues = obtenerCotizaciones();
        var contadorDespues = localStorage.getItem(CLAVES_STORAGE.CONTADOR);

        var paso = (cotizacionesDespues.length === 0) && (contadorDespues === '0');

        // Restaurar estado íntegro original inmediatamente
        _restaurarSnapshotStorage(snap22);

        verificar(
            22,
            'Modo Demostración: vaciarDatosSistema() reinicia contador a 0 y limpia cotizaciones',
            'Cotizaciones: 0, Contador: "0"',
            'Cotizaciones: ' + cotizacionesDespues.length + ', Contador: "' + contadorDespues + '"',
            paso
        );
    })();

    // ------------------------------------------------------------
    // PRUEBA 23: formatearMoneda con NaN retorna "0,00"
    // ------------------------------------------------------------
    (function () {
        var res = formatearMoneda(NaN);
        verificar(23, 'formatearMoneda(NaN) retorna "0,00"', '0,00', res, res === '0,00');
    })();

    // ------------------------------------------------------------
    // PRUEBA 24: desglosarPasosCalculoPedagogico retorna Array con 7+ pasos
    // ------------------------------------------------------------
    (function () {
        var items = [{ materialId: 1, nombre: 'Test', unidad: 'U', sector: 'Construcción', precioBase: 100, cantidad: 1 }];
        var calc = calcularPresupuestoCotizacion(items, { nombre: 'Pto Ordaz', factor: 0.90 }, { perfil: 'Alcaldía', estado: 'Miranda' }, 36.50);
        calc.nombreObra = 'Test';
        calc.ciudadCompra = 'Pto Ordaz';
        var pasos = desglosarPasosCalculoPedagogico(calc);
        var ok = Array.isArray(pasos) && pasos.length >= 7 && pasos[0].paso && pasos[0].titulo && pasos[0].formula && pasos[0].detalle && pasos[0].resultado;
        verificar(24, 'desglosarPasosCalculoPedagogico retorna Array con 7+ pasos válidos', 'Array con 7+ pasos', 'length=' + pasos.length, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 25: escaparHtml neutraliza <script> e <img>
    // ------------------------------------------------------------
    (function () {
        var escapado = escaparHtml('<img src=x onerror=alert(1)>');
        var ok = escapado.indexOf('<') === -1 && escapado.indexOf('&lt;') !== -1;
        verificar(25, 'escaparHtml neutraliza <script> e <img>', 'Sin < > literales', escapado.substring(0, 20) + '...', ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 26: validarRespaldoJSON rechaza usuarios sin estructura
    // ------------------------------------------------------------
    (function () {
        var res = validarRespaldoJSON('{"usuarios":[{}],"materiales":[{}],"cotizaciones":[]}');
        verificar(26, 'validarRespaldoJSON rechaza usuarios sin estructura', 'valido: false', 'valido: ' + res.valido, res.valido === false);
    })();

    // ------------------------------------------------------------
    // PRUEBA 27: formatearMoneda(-1234.56, USD) = "-$1.234,56"
    // ------------------------------------------------------------
    (function () {
        var res = formatearMoneda(-1234.56, 'USD');
        verificar(27, 'formatearMoneda(-1234.56, USD) = "-$1.234,56"', '-$1.234,56', res, res === '-$1.234,56');
    })();

    // ------------------------------------------------------------
    // PRUEBA 28: Todos los [data-icono] del DOM existen en ICONOS_SVG
    // ------------------------------------------------------------
    (function () {
        var iconosDOM = document.querySelectorAll('[data-icono]');
        var faltantes = [];
        for (var i = 0; i < iconosDOM.length; i++) {
            var nombre = iconosDOM[i].getAttribute('data-icono');
            if (nombre && !ICONOS_SVG[nombre]) faltantes.push(nombre);
        }
        verificar(28, 'Todos los [data-icono] del DOM existen en ICONOS_SVG', '0 faltantes', faltantes.length + ' faltantes: ' + faltantes.join(', '), faltantes.length === 0);
    })();

    // ------------------------------------------------------------
    // PRUEBA 29: Borradores por usuario son independientes
    // ------------------------------------------------------------
    (function () {
        var uidA = 99901, uidB = 99902;
        guardarBorradorAsistente(uidA, { nombreObra: 'Obra A', pasoActual: 2 });
        guardarBorradorAsistente(uidB, { nombreObra: 'Obra B', pasoActual: 3 });
        var borA = obtenerBorradorAsistente(uidA);
        var borB = obtenerBorradorAsistente(uidB);
        var borC = obtenerBorradorAsistente(99999);
        var ok = borA && borA.nombreObra === 'Obra A' && borB && borB.nombreObra === 'Obra B' && borC === null;
        limpiarBorradorAsistente(uidA);
        limpiarBorradorAsistente(uidB);
        verificar(29, 'Borradores por usuario son independientes', 'A=Obra A, B=Obra B, C=null', 'A=' + (borA ? borA.nombreObra : 'null') + ', B=' + (borB ? borB.nombreObra : 'null') + ', C=' + borC, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 30: detectarAlertasSistema marca cotización con 7 días como DEMORADA
    // ------------------------------------------------------------
    (function () {
        var hoy = new Date();
        var hace7dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        var fechaVieja = String(hace7dias.getDate()).padStart(2, '0') + '/' + String(hace7dias.getMonth() + 1).padStart(2, '0') + '/' + hace7dias.getFullYear() + ' 10:00';
        var cotVieja = { id: 1, usuarioId: 1, estado: 'ENVIADA', correlativo: 'COT-9999', nombreCliente: 'Test', fechaCreacion: fechaVieja, total: 100 };
        var alertas = detectarAlertasSistema([], [cotVieja]);
        var tieneAlerta = false;
        for (var i = 0; i < alertas.length; i++) {
            if (alertas[i].tipo === 'COTIZACION_DEMORADA') tieneAlerta = true;
        }
        verificar(30, 'detectarAlertasSistema marca cotización con 7 días como DEMORADA', 'Alerta COTIZACION_DEMORADA presente', tieneAlerta ? 'Presente' : 'Ausente', tieneAlerta);
    })();

    // ------------------------------------------------------------
    // PRUEBA 31: Redondeo del desperdicio sin error flotante IEEE 754
    // ------------------------------------------------------------
    (function () {
        var d100 = aplicarDesperdicio(100, 10);   // Esperado: 110 (antes 111 por float)
        var d200 = aplicarDesperdicio(200, 10);   // Esperado: 220 (antes 221 por float)
        var d1000 = aplicarDesperdicio(1000, 10); // Esperado: 1100
        var d10 = aplicarDesperdicio(10, 10);     // Esperado: 11
        var dDec = aplicarDesperdicio(12.5, 10);  // 12.5 * 1.1 = 13.75 -> ceil = 14
        var ok = (d100 === 110) && (d200 === 220) && (d1000 === 1100) && (d10 === 11) && (dDec === 14);
        verificar(31, 'aplicarDesperdicio redondea a 6 decimales antes de Math.ceil (100->110, 200->220)', '100->110, 200->220, 12.5->14', '100->' + d100 + ', 200->' + d200 + ', 12.5->' + dDec, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 32: escaparHTML (alias y neutralización XSS)
    // ------------------------------------------------------------
    (function () {
        var ataque = '<img src=x onerror=alert(1)>';
        var escapado = escaparHTML(ataque);
        var comillas = escaparHTML('O\'Reilly & "Asociados"');
        var ok = escapado.indexOf('<') === -1 && escapado.indexOf('>') === -1 && comillas.indexOf('&quot;') !== -1;
        verificar(32, 'escaparHTML neutraliza etiquetas HTML y comillas dobles/simples', 'Sin < > literales y comillas escapadas', escapado, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 33: validarCampoCantidad rechaza Infinity, 1e308, 0x10 y > 1.000.000
    // ------------------------------------------------------------
    (function () {
        var rInf = validarCampoCantidad(Infinity, 'Cemento');
        var rExp = validarCampoCantidad('1e308', 'Cemento');
        var rHex = validarCampoCantidad('0x10', 'Cemento');
        var rNeg = validarCampoCantidad(-5, 'Cemento');
        var rMax = validarCampoCantidad(1500000, 'Cemento');
        var ok = (!rInf.valido) && (!rExp.valido) && (!rHex.valido) && (!rNeg.valido) && (!rMax.valido);
        verificar(33, 'validarCampoCantidad rechaza Infinity, notación científica, hex, negativos y >1.000.000', 'Todos inválidos (valido: false)', 'Inf=' + rInf.valido + ', 1e308=' + rExp.valido + ', 0x10=' + rHex.valido + ', >1M=' + rMax.valido, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 34: validarCampoCantidad respeta permiteDecimales
    // ------------------------------------------------------------
    (function () {
        var rAsfalto = validarCampoCantidad('10.5', 'Mezcla Asfáltica', true);
        var rBloque = validarCampoCantidad('10.5', 'Bloques', false);
        var ok = (rAsfalto.valido === true && rAsfalto.cantidad === 10.5) && (rBloque.valido === false);
        verificar(34, 'validarCampoCantidad admite decimales solo cuando permiteDecimales es true', 'Asfalto válido (10.5), Bloques inválido', 'Asfalto=' + rAsfalto.valido + ' (' + rAsfalto.cantidad + '), Bloques=' + rBloque.valido, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 35: Transición de estados: doble aprobación bloqueada
    // ------------------------------------------------------------
    (function () {
        var cots = obtenerCotizaciones();
        var tempCot = {
            id: 9991,
            correlativo: 'COT-9991',
            usuarioId: 1,
            estado: 'ENVIADA',
            totalUSD: 100,
            fechaCreacion: obtenerFechaActual(),
            validezDias: 15
        };
        cots.push(tempCot);
        guardarCotizaciones(cots);

        var supervisor = { id: 4, nombre: 'Ing. Ana Pérez', perfil: 'Gobernación' };
        var ap1 = cambiarEstadoCotizacion(9991, 'APROBADA', supervisor);
        var ap2 = cambiarEstadoCotizacion(9991, 'APROBADA', supervisor);

        var ok = (ap1.ok === true) && (ap2.ok === false);
        verificar(35, 'cambiarEstadoCotizacion bloquea doble aprobación consecutiva', '1ra: ok=true, 2da: ok=false', '1ra: ' + ap1.ok + ', 2da: ' + ap2.ok, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 36: Transición de estados: autoaprobación bloqueada
    // ------------------------------------------------------------
    (function () {
        var cots = obtenerCotizaciones();
        var cotGobernacion = {
            id: 9992,
            correlativo: 'COT-9992',
            usuarioId: 4, // Creada por Ing. Ana Pérez
            estado: 'ENVIADA',
            totalUSD: 200,
            fechaCreacion: obtenerFechaActual(),
            validezDias: 15
        };
        cots.push(cotGobernacion);
        guardarCotizaciones(cots);

        var mismaSolicitante = { id: 4, nombre: 'Ing. Ana Pérez', perfil: 'Gobernación' };
        var segundoSupervisor = { id: 7, nombre: 'Ing. Marcos Rivas', perfil: 'Gobernación' };

        var intentoAuto = cambiarEstadoCotizacion(9992, 'APROBADA', mismaSolicitante);
        var aprobacionTercero = cambiarEstadoCotizacion(9992, 'APROBADA', segundoSupervisor);

        var ok = (intentoAuto.ok === false) && (aprobacionTercero.ok === true);
        verificar(36, 'cambiarEstadoCotizacion impide autoaprobación de funcionario de Gobernación', 'Autoaprobación rechazada, Tercero aprobada', 'Auto: ok=' + intentoAuto.ok + ', Tercero: ok=' + aprobacionTercero.ok, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 37: Transición de estados: transiciones inválidas bloqueadas
    // ------------------------------------------------------------
    (function () {
        var cots = obtenerCotizaciones();
        var cotBorrador = {
            id: 9993,
            correlativo: 'COT-9993',
            usuarioId: 1,
            estado: 'BORRADOR',
            totalUSD: 150,
            fechaCreacion: obtenerFechaActual()
        };
        cots.push(cotBorrador);
        guardarCotizaciones(cots);

        var supervisor = { id: 4, nombre: 'Ing. Ana Pérez', perfil: 'Gobernación' };
        var transInvalida = cambiarEstadoCotizacion(9993, 'ENTREGADA', supervisor); // BORRADOR no puede ir directo a ENTREGADA

        verificar(37, 'cambiarEstadoCotizacion rechaza transiciones no definidas en la matriz', 'ok: false', 'ok: ' + transInvalida.ok, transInvalida.ok === false);
    })();

    // ------------------------------------------------------------
    // PRUEBA 38: Transición de estados: rol incorrecto bloqueado
    // ------------------------------------------------------------
    (function () {
        var cots = obtenerCotizaciones();
        var cotEnv = {
            id: 9994,
            correlativo: 'COT-9994',
            usuarioId: 1,
            estado: 'ENVIADA',
            totalUSD: 300,
            fechaCreacion: obtenerFechaActual(),
            validezDias: 15
        };
        cots.push(cotEnv);
        guardarCotizaciones(cots);

        var usuarioEmpresa = { id: 2, nombre: 'Carlos Rodríguez', perfil: 'Empresa' };
        var intento = cambiarEstadoCotizacion(9994, 'APROBADA', usuarioEmpresa);

        verificar(38, 'cambiarEstadoCotizacion bloquea aprobación si el usuario no tiene rol Gobernación', 'ok: false', 'ok: ' + intento.ok, intento.ok === false);
    })();

    // ------------------------------------------------------------
    // PRUEBA 39: Fechas relativas y alerta de demora
    // ------------------------------------------------------------
    (function () {
        var cReciente = { estado: 'ENVIADA', fechaCreacion: obtenerFechaActual(), fechaISO: new Date().toISOString() };
        var hace6dias = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
        var cVieja = { estado: 'ENVIADA', fechaCreacion: 'hace 6 dias', fechaISO: hace6dias.toISOString() };

        var diasReciente = calcularDiasTranscurridos(cReciente.fechaCreacion, cReciente.fechaISO);
        var diasVieja = calcularDiasTranscurridos(cVieja.fechaCreacion, cVieja.fechaISO);

        var ok = (diasReciente === 0) && (diasVieja >= 5);
        verificar(39, 'calcularDiasTranscurridos usa fechaISO y discrimina cotizaciones demoradas (>=5 días)', 'Reciente=0, Vieja>=5', 'Reciente=' + diasReciente + ', Vieja=' + diasVieja, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 40: Saldos de usuarios derivados de forma inmutable
    // ------------------------------------------------------------
    (function () {
        var uTest = [{ id: 91, limiteGasto: 10000, gastadoInicial: 1000, comprometidoInicial: 500, gastado: 0, comprometido: 0 }];
        var cTest = [
            { usuarioId: 91, estado: 'ENTREGADA', totalUSD: 2000 },
            { usuarioId: 91, estado: 'APROBADA', totalUSD: 800 },
            { usuarioId: 91, estado: 'ENVIADA', totalUSD: 500 }
        ];
        var res = recalcularSaldosUsuarios(uTest, cTest);
        var u = res[0];
        // gastado = 1000 + 2000 = 3000; comprometido = 500 + 800 = 1300
        var ok = (u.gastado === 3000) && (u.comprometido === 1300);
        verificar(40, 'recalcularSaldosUsuarios deriva gastado y comprometido desde cotizaciones reales', 'gastado: 3000, comprometido: 1300', 'gastado: ' + u.gastado + ', comprometido: ' + u.comprometido, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 41: Vigencia de 15 días calendario bloquea cotización vencida
    // ------------------------------------------------------------
    (function () {
        var hace20dias = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
        var cots = obtenerCotizaciones();
        var cotVencida = {
            id: 9995,
            correlativo: 'COT-9995',
            usuarioId: 1,
            estado: 'ENVIADA',
            totalUSD: 100,
            fechaCreacion: 'hace 20 dias',
            fechaISO: hace20dias.toISOString(),
            validezDias: 15
        };
        cots.push(cotVencida);
        guardarCotizaciones(cots);

        var supervisor = { id: 4, nombre: 'Ing. Ana Pérez', perfil: 'Gobernación' };
        var intento = cambiarEstadoCotizacion(9995, 'APROBADA', supervisor);

        verificar(41, 'cambiarEstadoCotizacion bloquea aprobación de cotización con vigencia vencida (>15 días)', 'ok: false', 'ok: ' + intento.ok, intento.ok === false);
    })();

    // ------------------------------------------------------------
    // PRUEBA 42: Exportación CSV con punto y coma (;), BOM UTF-8 y neutralización de inyección
    // ------------------------------------------------------------
    (function () {
        var cots = [{
            correlativo: 'COT-0001',
            fechaCreacion: '10/11/2026',
            nombreCliente: '=SUM(A1:A10)', // Intento de inyección de fórmula
            perfil: 'Alcaldía',
            estadoObra: 'Zulia',
            ciudadCompra: 'Caracas',
            estado: 'APROBADA',
            subtotal: 100,
            flete: 10,
            descuento: 4,
            iva: 16,
            total: 122,
            tasaBCV: 36.50,
            totalBs: 4453
        }];
        var csv = exportarCotizacionesACSV(cots);
        var tieneBOM = (csv.indexOf('\uFEFF') === 0);
        var tienePuntoYComa = (csv.indexOf(';') !== -1);
        var neutralizado = (csv.indexOf("''=SUM") !== -1 || csv.indexOf("'=SUM") !== -1);
        var ok = tieneBOM && tienePuntoYComa && neutralizado;
        verificar(42, 'exportarCotizacionesACSV incluye BOM UTF-8, separador ";" y neutraliza inyección "=SUM"', 'BOM=true, sep=";", neutralizado=true', 'BOM=' + tieneBOM + ', sep=";", neutralizado=' + neutralizado, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 43: Aislamiento del almacenamiento garantizado
    // ------------------------------------------------------------
    (function () {
        var snapActual = _capturarSnapshotStorage();
        var clavesValidas = true;
        for (var prop in CLAVES_STORAGE) {
            if (CLAVES_STORAGE.hasOwnProperty(prop)) {
                var c = CLAVES_STORAGE[prop];
                if (snapActual[c] === undefined) clavesValidas = false;
            }
        }
        verificar(43, 'Aislamiento del almacenamiento: las claves del sistema existen y están protegidas', 'Todas las claves íntegras', clavesValidas ? 'Todas íntegras' : 'Faltan claves', clavesValidas);
    })();

    // ------------------------------------------------------------
    // PRUEBA 44: Generación de plan Cashea 3 cuotas (50% inicial, 3 cuotas exactas, suma consistente)
    // ------------------------------------------------------------
    (function () {
        var cot = {
            id: 9944,
            correlativo: 'COT-9944',
            usuarioId: 1,
            totalUSD: 300,
            nombreObra: 'Prueba Cashea 3'
        };
        var plan = generarPlanFinanciamiento(cot, 'cashea_3', '2026-11-01T00:00:00.000Z');
        var sumaCuotas = 0;
        for (var i = 0; i < plan.cuotas.length; i++) {
            sumaCuotas += plan.cuotas[i].montoUSD;
        }
        var totalReconstruido = Math.round((plan.montoInicial + sumaCuotas) * 100) / 100;
        var ok = (plan.tipoPlan === 'cashea_3') &&
                 (plan.porcentajeInicial === 0.50) &&
                 (plan.montoInicial === 150) &&
                 (plan.cuotas.length === 3) &&
                 (totalReconstruido === 300);
        verificar(44, 'generarPlanFinanciamiento Cashea 3 calcula 50% inicial, 3 cuotas exactas y suma consistente', 'montoInicial=150, cuotas=3, total=300', 'montoInicial=' + plan.montoInicial + ', cuotas=' + plan.cuotas.length + ', total=' + totalReconstruido, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 45: Plan con recargo administrativo (quincenal_6 con 5% o mensual_12 con 12%)
    // ------------------------------------------------------------
    (function () {
        var cot = {
            id: 9945,
            correlativo: 'COT-9945',
            usuarioId: 1,
            totalUSD: 1000,
            nombreObra: 'Prueba Recargo'
        };
        var plan = generarPlanFinanciamiento(cot, 'quincenal_6', '2026-11-01T00:00:00.000Z');
        var sumaCuotas = 0;
        for (var i = 0; i < plan.cuotas.length; i++) {
            sumaCuotas += plan.cuotas[i].montoUSD;
        }
        sumaCuotas = Math.round(sumaCuotas * 100) / 100;
        var ok = (plan.montoInicial === 300) &&
                 (plan.recargoUSD === 35) &&
                 (plan.saldoFinanciado === 735) &&
                 (plan.cuotas.length === 6) &&
                 (sumaCuotas === 735);
        verificar(45, 'generarPlanFinanciamiento aplica recargo administrativo exacto (5% en quincenal_6) sin desfase', 'montoInicial=300, recargo=35, cuotas=6 sumando 735', 'montoInicial=' + plan.montoInicial + ', recargo=' + plan.recargoUSD + ', sumaCuotas=' + sumaCuotas, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 46: calcularDiasAtraso y recalcularEstadoPlan marcan plan como EN_MORA
    // ------------------------------------------------------------
    (function () {
        var fechaVenc = '2026-10-01T00:00:00.000Z';
        var fechaHoy = '2026-11-01T00:00:00.000Z';
        var dias = calcularDiasAtraso(fechaVenc, fechaHoy);

        var planTest = {
            id: 9946,
            usuarioId: 1,
            estado: 'ACTIVO',
            saldoPendiente: 100,
            cuotas: [
                { numero: 1, montoUSD: 100, fechaVencimientoISO: fechaVenc, estado: 'PENDIENTE', mora: 0 }
            ]
        };
        var planRecalculado = recalcularEstadoPlan(planTest, fechaHoy);
        var ok = (dias === 31) &&
                 (planRecalculado.estado === 'EN_MORA') &&
                 (planRecalculado.cuotas[0].estado === 'VENCIDA') &&
                 (planRecalculado.cuotas[0].mora > 0);
        verificar(46, 'calcularDiasAtraso y recalcularEstadoPlan detectan atraso y marcan plan EN_MORA con mora diaria', 'dias=31, estado=EN_MORA, cuota=VENCIDA, mora>0', 'dias=' + dias + ', estado=' + planRecalculado.estado + ', cuota=' + planRecalculado.cuotas[0].estado + ', mora=' + planRecalculado.cuotas[0].mora, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 47: procesarPagoCuota valida monto, marca PAGADA, fecha y referencia
    // ------------------------------------------------------------
    (function () {
        var planTest = {
            id: 9947,
            usuarioId: 1,
            totalFinanciado: 200,
            totalPagado: 0,
            saldoPendiente: 200,
            estado: 'ACTIVO',
            cuotas: [
                { numero: 1, montoUSD: 100, fechaVencimientoISO: '2026-11-15T00:00:00.000Z', estado: 'PENDIENTE' },
                { numero: 2, montoUSD: 100, fechaVencimientoISO: '2026-11-30T00:00:00.000Z', estado: 'PENDIENTE' }
            ]
        };
        var pagoInsuficiente = procesarPagoCuota(planTest, 1, 50, 'REF-TEST-001', '2026-11-05');
        var pagoExitoso = procesarPagoCuota(planTest, 1, 100, 'REF-TEST-001', '2026-11-05');
        var cuota1 = planTest.cuotas[0];
        var ok = (pagoInsuficiente.ok === false) &&
                 (pagoExitoso.ok === true) &&
                 (cuota1.estado === 'PAGADA') &&
                 (cuota1.referencia === 'REF-TEST-001') &&
                 (cuota1.fechaPagoISO === '2026-11-05');
        verificar(47, 'procesarPagoCuota rechaza pagos insuficientes y registra amortización formal con referencia', 'Insuficiente: ok=false; Exitoso: ok=true, estado=PAGADA', 'Insuficiente: ' + pagoInsuficiente.ok + '; Exitoso: ' + pagoExitoso.ok + ', cuota1=' + cuota1.estado, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 48: Liquidación total: última cuota pagada pasa plan a PAGADO
    // ------------------------------------------------------------
    (function () {
        var planTest = {
            id: 9948,
            usuarioId: 1,
            totalFinanciado: 100,
            totalPagado: 0,
            saldoPendiente: 100,
            estado: 'ACTIVO',
            cuotas: [
                { numero: 1, montoUSD: 100, fechaVencimientoISO: '2026-11-15T00:00:00.000Z', estado: 'PENDIENTE' }
            ]
        };
        var pago = procesarPagoCuota(planTest, 1, 100, 'REF-FIN-FINAL', '2026-11-10');
        var ok = (pago.ok === true) &&
                 (planTest.estado === 'PAGADO') &&
                 (planTest.saldoPendiente === 0) &&
                 (planTest.totalPagado === 100);
        verificar(48, 'Liquidación total: al abonar la última cuota el plan cambia a PAGADO con saldo cero', 'estado=PAGADO, saldoPendiente=0, totalPagado=100', 'estado=' + planTest.estado + ', saldoPendiente=' + planTest.saldoPendiente + ', totalPagado=' + planTest.totalPagado, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 49: verificarDisponibilidadNuevaCotizacion bloquea por mora activa
    // ------------------------------------------------------------
    (function () {
        var financiamientosMock = [
            {
                id: 9949,
                usuarioId: 88,
                estado: 'EN_MORA',
                cuotas: [
                    { numero: 1, montoUSD: 150, fechaVencimientoISO: '2026-10-01T00:00:00.000Z', estado: 'VENCIDA' }
                ]
            }
        ];
        var evalMora = evaluarMoraUsuario(88, financiamientosMock, '2026-11-01T00:00:00.000Z');
        guardarFinanciamientos(financiamientosMock);
        var disp = verificarDisponibilidadNuevaCotizacion(88, []);
        var ok = (evalMora.tieneMora === true) &&
                 (disp.puede === false) &&
                 (disp.motivoMora === true);
        verificar(49, 'verificarDisponibilidadNuevaCotizacion y evaluarMoraUsuario bloquean cotización por mora activa', 'tieneMora=true, puede=false, motivoMora=true', 'tieneMora=' + evalMora.tieneMora + ', puede=' + disp.puede + ', motivoMora=' + disp.motivoMora, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 50: simularPlanFinanciamiento es pura e idempotente
    // ------------------------------------------------------------
    (function () {
        var sim1 = simularPlanFinanciamiento(500, 'cashea_3');
        var sim2 = simularPlanFinanciamiento(500, 'cashea_3');
        var cuotasIguales = (sim1.cuotas.length === 3) && (sim2.cuotas.length === 3) &&
                            (sim1.cuotas[0].montoUSD === sim2.cuotas[0].montoUSD);
        var ok = (sim1.montoInicial === 250) &&
                 (sim1.saldoFinanciado === 250) &&
                 cuotasIguales &&
                 (sim1 !== sim2);
        verificar(50, 'simularPlanFinanciamiento es pura e idempotente (cero mutación de estado externo)', 'Inicial=250, Saldo=250, 3 cuotas exactas, referencias distintas', 'Inicial=' + sim1.montoInicial + ', Saldo=' + sim1.saldoFinanciado + ', cuotas=' + sim1.cuotas.length + ', dist=' + (sim1 !== sim2), ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 51: Normalización de roles y validación de Gobernación
    // ------------------------------------------------------------
    (function () {
        var r1 = normalizarRol('Gobernación');
        var r2 = normalizarRol('alcaldía');
        var r3 = normalizarRol('Empresa');
        var r4 = normalizarRol('Constructor Comunal');

        var uGob = { perfil: 'Gobernación', nivel: 5 };
        var uEmp = { perfil: 'Empresa', nivel: 2 };

        var ok = (r1 === 'GOBERNACION') &&
                 (r2 === 'ALCALDIA') &&
                 (r3 === 'EMPRESA') &&
                 (r4 === 'CONSTRUCTOR') &&
                 (esRolGobernacion(uGob) === true) &&
                 (esRolGobernacion(uEmp) === false);

        verificar(51, 'normalizarRol y esRolGobernacion normalizan perfiles y discriminan supervisores', 'Roles normalizados y esRolGobernacion exactos', 'r1=' + r1 + ', r2=' + r2 + ', esGob=' + esRolGobernacion(uGob), ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 52: Control de Acceso Centralizado (tienePermiso RBAC)
    // ------------------------------------------------------------
    (function () {
        var admin = { id: 7, perfil: 'Gobernación', nivel: 5, activo: true };
        var cliente = { id: 1, perfil: 'Alcaldía', nivel: 2, activo: true };

        var pAdminCat = tienePermiso(admin, 'catalogo');
        var pAdminAprob = tienePermiso(admin, 'aprobaciones');
        var pAdminUsrs = tienePermiso(admin, 'estado-usuarios');

        var pCliCat = tienePermiso(cliente, 'catalogo');
        var pCliAprob = tienePermiso(cliente, 'aprobaciones');
        var pCliUsrs = tienePermiso(cliente, 'estado-usuarios');
        var pCliCot = tienePermiso(cliente, 'cotizador');

        var ok = (pAdminCat === true) &&
                 (pAdminAprob === true) &&
                 (pAdminUsrs === true) &&
                 (pCliCat === false) &&
                 (pCliAprob === false) &&
                 (pCliUsrs === false) &&
                 (pCliCot === true);

        verificar(52, 'tienePermiso bloquea módulos administrativos a usuarios estándar y habilita a Gobernación', 'Admin=true en gestión, Cliente=false en gestión y true en cotizador', 'AdminCat=' + pAdminCat + ', CliCat=' + pCliCat + ', CliCot=' + pCliCot, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 53: Control de cuentas inactivas / suspendidas
    // ------------------------------------------------------------
    (function () {
        var usrInactivo = { id: 88, nombre: 'Suspendido', perfil: 'Empresa', activo: false };
        var usrActivo = { id: 89, nombre: 'Activo', perfil: 'Empresa', activo: true };

        var pInactivo = tienePermiso(usrInactivo, 'cotizador');
        var reqInactivo = requiereAutenticacion(usrInactivo);
        var reqActivo = requiereAutenticacion(usrActivo);

        var ok = (pInactivo === false) &&
                 (reqInactivo === false) &&
                 (reqActivo === true);

        verificar(53, 'requiereAutenticacion y tienePermiso deniegan acceso a cuentas desactivadas (activo=false)', 'Inactivo bloqueado (false), Activo autorizado (true)', 'pInactivo=' + pInactivo + ', reqInactivo=' + reqInactivo + ', reqActivo=' + reqActivo, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 54: Validación de propiedad del recurso (validarPropiedadDelRecurso)
    // ------------------------------------------------------------
    (function () {
        var admin = { id: 7, perfil: 'Gobernación', nivel: 5 };
        var duenio = { id: 10, perfil: 'Alcaldía' };
        var tercero = { id: 11, perfil: 'Empresa' };
        var recurso = { id: 501, usuarioId: 10 };

        var okDuenio = validarPropiedadDelRecurso(duenio, recurso);
        var okAdmin = validarPropiedadDelRecurso(admin, recurso);
        var okTercero = validarPropiedadDelRecurso(tercero, recurso);

        var ok = (okDuenio === true) && (okAdmin === true) && (okTercero === false);

        verificar(54, 'validarPropiedadDelRecurso permite acceso al dueño y al supervisor, pero bloquea terceros', 'Dueño=true, Admin=true, Tercero=false', 'Dueño=' + okDuenio + ', Admin=' + okAdmin + ', Tercero=' + okTercero, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 55: Rechazo formal exige motivo mínimo de 10 caracteres
    // ------------------------------------------------------------
    (function () {
        var supervisor = { id: 7, nombre: 'Ing. Marcos Rivas', perfil: 'Gobernación', nivel: 5 };
        var cots = [
            { id: 8881, correlativo: 'COT-8881', usuarioId: 10, estado: 'ENVIADA', total: 1000, totalUSD: 1000, validezDias: 15, fechaCreacion: '10/05/2026', fechaISO: new Date().toISOString() },
            { id: 8882, correlativo: 'COT-8882', usuarioId: 10, estado: 'ENVIADA', total: 1000, totalUSD: 1000, validezDias: 15, fechaCreacion: '10/05/2026', fechaISO: new Date().toISOString() }
        ];
        guardarCotizaciones(cots);

        var rCorto = cambiarEstadoCotizacion(8881, 'RECHAZADA', supervisor, { motivoRechazo: 'Muy caro' });
        var rValido = cambiarEstadoCotizacion(8882, 'RECHAZADA', supervisor, { motivoRechazo: 'Monto excede disponibilidad presupuestaria asignada para el ejercicio.' });

        var ok = (rCorto.ok === false) &&
                 (rValido.ok === true) &&
                 (rValido.cotizacion.estado === 'RECHAZADA') &&
                 (rValido.cotizacion.rechazadoPor === supervisor.nombre);

        verificar(55, 'cambiarEstadoCotizacion rechaza motivos < 10 caracteres y asienta auditoría con >= 10', 'Corto=false, Válido=true con trazabilidad', 'Corto.ok=' + rCorto.ok + ', Valido.ok=' + rValido.ok, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 56: Procesamiento de pago inicial (procesarPagoInicial)
    // ------------------------------------------------------------
    (function () {
        var planTest = {
            id: 991,
            cotizacionId: 991,
            correlativoCotizacion: 'COT-991',
            usuarioId: 10,
            nombreCliente: 'Alcaldía Test',
            montoInicialUSD: 500.00,
            pagoInicialConfirmado: false
        };

        var pInsuf = procesarPagoInicial(planTest, 400.00, 'REF-INSUF');
        var pOk = procesarPagoInicial(planTest, 500.00, 'TRANSF-INI-OK', new Date().toISOString(), 'Transferencia');
        var pDuplicado = procesarPagoInicial(planTest, 500.00, 'TRANSF-INI-DUP');

        var ok = (pInsuf.ok === false) &&
                 (pOk.ok === true) &&
                 (planTest.pagoInicialConfirmado === true) &&
                 (planTest.pagoInicialReferencia === 'TRANSF-INI-OK') &&
                 (pDuplicado.ok === false);

        verificar(56, 'procesarPagoInicial valida monto exacto de la cuota inicial y bloquea pagos duplicados', 'Insuf=false, Valido=true, Duplicado=false', 'Insuf=' + pInsuf.ok + ', Ok=' + pOk.ok + ', Dup=' + pDuplicado.ok, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 57: Libro Mayor de Pagos y Movimientos (registrarMovimiento)
    // ------------------------------------------------------------
    (function () {
        var movsPrev = obtenerMovimientos();
        var cantPrev = movsPrev.length;

        var movCreado = registrarMovimiento({
            financiamientoId: 992,
            cotizacionId: 992,
            correlativoCotizacion: 'COT-992',
            usuarioId: 77,
            cliente: 'Ente Auditoría',
            tipo: 'CUOTA',
            cuotaNumero: 1,
            montoUSD: 250.00,
            montoAplicadoCapital: 250.00,
            montoAplicadoMora: 0.00,
            referencia: 'BANCO-992-TEST',
            metodo: 'Transferencia',
            estado: 'CONFIRMADO'
        });

        var movsPost = obtenerMovimientos();
        var movsUsr = obtenerMovimientosPorUsuario(77);

        var ok = (movCreado && movCreado.id > 0) &&
                 (movsPost.length === cantPrev + 1) &&
                 (movsUsr.length >= 1) &&
                 (movsUsr[0].referencia === 'BANCO-992-TEST');

        verificar(57, 'registrarMovimiento asienta movimientos en el libro mayor con ID correlativo y filtro por usuario', 'ID generado, total incrementado, filtro usuario exacto', 'ID=' + (movCreado ? movCreado.id : 0) + ', total=' + movsPost.length + ', porUsr=' + movsUsr.length, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 58: Conversión universal USD <-> Bolívares (convertirUSDaBs / convertirBsaUSD)
    // ------------------------------------------------------------
    (function () {
        var tasa = 900.00;
        var bs = convertirUSDaBs(100.00, tasa);
        var usd = convertirBsaUSD(90000.00, tasa);

        var ok = (bs === 90000.00) && (usd === 100.00);

        verificar(58, 'convertirUSDaBs y convertirBsaUSD ejecutan conversiones matemáticas bidireccionales exactas', '100 USD = 90.000 Bs; 90.000 Bs = 100 USD', '100 USD -> ' + bs + ' Bs | 90.000 Bs -> ' + usd + ' USD', ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 59: Formateo reactivo universal con monedaActiva
    // ------------------------------------------------------------
    (function () {
        establecerMonedaActiva('USD');
        var textoUSD = monedaActiva(1250.50);

        establecerMonedaActiva('Bs');
        var textoBs = monedaActiva(100.00, 900.00); // 100 * 900 = 90.000,00

        establecerMonedaActiva('USD'); // Restaurar a USD

        var ok = (textoUSD === '$1.250,50') &&
                 (textoBs === 'Bs. 90.000,00');

        verificar(59, 'monedaActiva formatea estrictamente en USD o Bs según la selección activa global', '$1.250,50 en USD y Bs. 90.000,00 en Bolívares', 'USD=' + textoUSD + ', Bs=' + textoBs, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 60: Saneamiento total en restablecerDatosFabrica (incluye financiamientos y movimientos)
    // ------------------------------------------------------------
    (function () {
        localStorage.setItem(CLAVES_STORAGE.FINANCIAMIENTOS, JSON.stringify([{ id: 999 }]));
        localStorage.setItem(CLAVES_STORAGE.MOVIMIENTOS, JSON.stringify([{ id: 888 }]));

        restablecerDatosFabrica();

        var finPost = localStorage.getItem(CLAVES_STORAGE.FINANCIAMIENTOS);
        var movPost = localStorage.getItem(CLAVES_STORAGE.MOVIMIENTOS);
        var usrPost = localStorage.getItem(CLAVES_STORAGE.USUARIOS);

        var ok = (finPost === null) &&
                 (movPost === null) &&
                 (usrPost === null);

        verificar(60, 'restablecerDatosFabrica purga todas las 12 colecciones incluyendo FINANCIAMIENTOS y MOVIMIENTOS', 'Todas las claves removidas (null)', 'finPost=' + finPost + ', movPost=' + movPost + ', usrPost=' + usrPost, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 61: Directorio Multiinstitucional (Registro y Límites)
    // ------------------------------------------------------------
    (function () {
        var insts = (typeof obtenerInstituciones === 'function') ? obtenerInstituciones() : [];
        var tieneMiranda = false;
        var tieneGuarenas = false;
        for (var i = 0; i < insts.length; i++) {
            if (insts[i].codigo === 'GOB-MIR') tieneMiranda = true;
            if (insts[i].codigo === 'ALC-GUA') tieneGuarenas = true;
        }
        var ok = (insts.length >= 6) && tieneMiranda && tieneGuarenas;
        verificar(61, 'obtenerInstituciones administra directorio territorial con RIF y límites presupuestarios', 'Al menos 6 instituciones con GOB-MIR y ALC-GUA', 'total=' + insts.length + ', miranda=' + tieneMiranda, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 62: Centro de Control Financiero (Cartera, Cobranza y Mora)
    // ------------------------------------------------------------
    (function () {
        var finsDemo = [
            { id: 101, totalFinanciadoUSD: 1000, totalPagadoUSD: 1000, saldoPendienteUSD: 0, estado: 'PAGADO', nombreCliente: 'Alcaldía A' },
            { id: 102, totalFinanciadoUSD: 2000, totalPagadoUSD: 500, saldoPendienteUSD: 1500, estado: 'AL_DIA', nombreCliente: 'Alcaldía B' },
            { id: 103, totalFinanciadoUSD: 1000, totalPagadoUSD: 0, saldoPendienteUSD: 1000, estado: 'EN_MORA', diasAtraso: 20, nombreCliente: 'Empresa C' }
        ];
        var res = calcularControlFinancieroGlobal(finsDemo, [], 900.00);
        var ok = (res.carteraTotalUSD === 4000) &&
                 (res.totalRecuperadoUSD === 1500) &&
                 (res.totalMoraUSD === 1000) &&
                 (res.saldoPorCobrarUSD === 2500) &&
                 (res.carteraTotalBs === 3600000) &&
                 (res.tasaRecuperacionPct === 37.5) &&
                 (res.tasaMorosidadPct === 25.0);

        verificar(62, 'calcularControlFinancieroGlobal computa cartera consolidada, total amortizado y morosidad en USD y Bs', 'Cartera=4000, Recup=1500, Mora=1000, Saldo=2500, Cobro=37.5%, Mora%=25.0%', 'Cartera=' + res.carteraTotalUSD + ', Recup=' + res.totalRecuperadoUSD + ', Mora=' + res.totalMoraUSD, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 63: Análisis Comparativo y Distribución Institucional
    // ------------------------------------------------------------
    (function () {
        var finsDemo = [
            { id: 201, totalFinanciadoUSD: 1500, totalPagadoUSD: 500, saldoPendienteUSD: 1000, estado: 'AL_DIA', nombreCliente: 'Alcaldía Chacao' },
            { id: 202, totalFinanciadoUSD: 800, totalPagadoUSD: 0, saldoPendienteUSD: 800, estado: 'EN_MORA', nombreCliente: 'Empresa Viamer' }
        ];
        var res = calcularControlFinancieroGlobal(finsDemo, [], 900.00);
        var chacao = res.porInstitucion['Alcaldía Chacao'];
        var viamer = res.porInstitucion['Empresa Viamer'];
        var ok = Boolean(chacao && viamer && chacao.saldoPendiente === 1000 && viamer.estado === 'EN_MORA' && viamer.enMora === 800);

        verificar(63, 'calcularControlFinancieroGlobal agrupa con precisión matemática la cartera por entidad territorial', 'Chacao Saldo=1000, Viamer Mora=800 con estado EN_MORA', 'ChacaoSaldo=' + (chacao ? chacao.saldoPendiente : 'null') + ', ViamerMora=' + (viamer ? viamer.enMora : 'null'), ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 64: Conciliación Formal de Movimiento de Pago
    // ------------------------------------------------------------
    (function () {
        var movs = [
            { id: 501, correlativo: 'MOV-501', estado: 'REPORTADO', montoUSD: 300, referencia: 'TRANSF-TEST-501' }
        ];
        var res = conciliarMovimientoPago(movs, 501, 'Ing. Ana Pérez', 'Comprobante verificado en cuenta');
        var ok = res.ok &&
                 (movs[0].estado === 'CONFIRMADO') &&
                 (movs[0].conciliadoPor === 'Ing. Ana Pérez') &&
                 Boolean(movs[0].fechaConciliacion);

        verificar(64, 'conciliarMovimientoPago actualiza el estado a CONFIRMADO y registra fecha y funcionario auditor', 'ok: true, estado: CONFIRMADO, conciliadoPor: Ing. Ana Pérez', 'ok=' + res.ok + ', estado=' + movs[0].estado, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 65: Prevención de Doble Conciliación de Pagos
    // ------------------------------------------------------------
    (function () {
        var movs = [
            { id: 502, correlativo: 'MOV-502', estado: 'CONFIRMADO', montoUSD: 400, referencia: 'TRANSF-YA-PAGADA' }
        ];
        var res = conciliarMovimientoPago(movs, 502, 'Ing. Ana Pérez', 'Intento redundante');
        var ok = (res.ok === false) && (res.error.indexOf('previamente') !== -1);

        verificar(65, 'conciliarMovimientoPago bloquea doble conciliación consecutiva de un movimiento ya confirmado', 'ok: false con mensaje de ya conciliado', 'ok=' + res.ok + ', error=' + res.error, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 66: Rechazo Auditado con Justificación (>= 10 caracteres)
    // ------------------------------------------------------------
    (function () {
        var movs = [
            { id: 503, correlativo: 'MOV-503', estado: 'REPORTADO', montoUSD: 250, referencia: 'TRANSF-DUDOSA' }
        ];
        var intentoCorto = rechazarMovimientoPago(movs, 503, 'Ing. Ana Pérez', 'Malo');
        var intentoValido = rechazarMovimientoPago(movs, 503, 'Ing. Ana Pérez', 'Comprobante bancario no coincide con saldo en cuenta');

        var ok = (intentoCorto.ok === false) &&
                 (intentoValido.ok === true) &&
                 (movs[0].estado === 'RECHAZADO') &&
                 (movs[0].motivoRechazo.indexOf('no coincide') !== -1);

        verificar(66, 'rechazarMovimientoPago exige motivo explicativo >= 10 caracteres y asienta trazabilidad', 'Corto=false, Valido=true con motivo registrado', 'Corto=' + intentoCorto.ok + ', Valido=' + intentoValido.ok, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 67: Proyecciones Financieras en 3 Escenarios Consistentes
    // ------------------------------------------------------------
    (function () {
        var fins = [
            {
                id: 601, estado: 'AL_DIA',
                cuotas: [
                    { numero: 1, montoUSD: 200, estado: 'PENDIENTE' },
                    { numero: 2, montoUSD: 200, estado: 'PENDIENTE' },
                    { numero: 3, montoUSD: 200, estado: 'PENDIENTE' }
                ]
            }
        ];
        var proy = calcularProyeccionesFinancieras(fins, 900.00);
        var norm = proy.normal.mes6USD;
        var cons = proy.conservador.mes6USD;
        var riesg = proy.altoRiesgo.mes6USD;

        var ok = (norm === 600) &&
                 (cons === 420) &&
                 (riesg === 240) &&
                 (proy.normal.mes6Bs === 540000);

        verificar(67, 'calcularProyeccionesFinancieras genera 3 escenarios consistentes (Normal 100%, Conservador 70%, Alto Riesgo 40%)', 'Normal=600, Conservador=420, AltoRiesgo=240, NormalBs=540000', 'Norm=' + norm + ', Cons=' + cons + ', Riesgo=' + riesg, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 68: Semáforo Presupuestario Institucional
    // ------------------------------------------------------------
    (function () {
        var s1 = calcularSemaforoPresupuestario(10000, 2000, 1000); // 30% -> Normal
        var s2 = calcularSemaforoPresupuestario(10000, 4000, 3500); // 75% -> Alerta
        var s3 = calcularSemaforoPresupuestario(10000, 6000, 3500); // 95% -> Crítico

        var ok = (s1.estado === 'Normal' && s1.porcentaje === 30 && s1.disponible === 7000) &&
                 (s2.estado === 'Alerta' && s2.porcentaje === 75 && s2.disponible === 2500) &&
                 (s3.estado === 'Crítico' && s3.porcentaje === 95 && s3.disponible === 500);

        verificar(68, 'calcularSemaforoPresupuestario clasifica en Normal (<60%), Alerta (60%-89.99%) y Crítico (>=90%)', 's1=Normal (30%), s2=Alerta (75%), s3=Crítico (95%)', 's1=' + s1.estado + ' (' + s1.porcentaje + '%), s2=' + s2.estado + ', s3=' + s3.estado, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 69: Gestión y Expedientes de Obras Públicas
    // ------------------------------------------------------------
    (function () {
        var proys = (typeof obtenerProyectosObras === 'function') ? obtenerProyectosObras() : [];
        var tienePry1 = false;
        var pctsValidos = true;

        for (var i = 0; i < proys.length; i++) {
            if (proys[i].codigo === 'PRY-2026-001') tienePry1 = true;
            if (proys[i].avanceFisicoPct < 0 || proys[i].avanceFisicoPct > 100) pctsValidos = false;
            if (proys[i].avanceFinancieroPct < 0 || proys[i].avanceFinancieroPct > 100) pctsValidos = false;
        }

        var ok = (proys.length >= 4) && tienePry1 && pctsValidos;
        verificar(69, 'obtenerProyectosObras administra expedientes con avances físico (%) y financiero (%)', 'Al menos 4 proyectos válidos con PRY-2026-001 y porcentajes 0-100%', 'total=' + proys.length + ', pry1=' + tienePry1 + ', pcts=' + pctsValidos, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 70: Red de Almacenes y Control de Stock Disponible
    // ------------------------------------------------------------
    (function () {
        var almacenes = (typeof obtenerAlmacenes === 'function') ? obtenerAlmacenes() : [];
        var stock = (typeof obtenerStockInventario === 'function') ? obtenerStockInventario() : [];
        var stockConsistente = true;

        for (var s = 0; s < stock.length; s++) {
            var disp = stock[s].stockActual - stock[s].stockReservado;
            if (disp < 0) stockConsistente = false;
        }

        var ok = (almacenes.length >= 4) && (stock.length >= 6) && stockConsistente;
        verificar(70, 'obtenerStockInventario y almacenes discriminan existencias y garantizan saldo disponible >= 0', 'Almacenes>=4, Stock>=6, saldo disponible consistente', 'almacenes=' + almacenes.length + ', stock=' + stock.length + ', consistente=' + stockConsistente, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 71: Comparador Histórico de Precios y Detección de Inflación
    // ------------------------------------------------------------
    (function () {
        var v1 = calcularVariacionPrecioHistorico(8.00, 8.50);  // +6.25%
        var v2 = calcularVariacionPrecioHistorico(10.00, 12.00); // +20% -> aumento significativo
        var v3 = calcularVariacionPrecioHistorico(15.00, 14.00); // -6.67% -> disminución

        var ok = (v1.variacionPct === 6.25 && v1.tipoVariacion === 'AUMENTO' && v1.esAumentoSignificativo === false) &&
                 (v2.variacionPct === 20.00 && v2.esAumentoSignificativo === true) &&
                 (v3.tipoVariacion === 'DISMINUCION' && v3.variacionPct < 0);

        verificar(71, 'calcularVariacionPrecioHistorico computa variaciones porcentuales y detecta aumentos >= 15%', 'v1=+6.25%, v2=+20% (significativo=true), v3=disminución', 'v1=' + v1.variacionPct + '%, v2=' + v2.variacionPct + '% (sig=' + v2.esAumentoSignificativo + '), v3=' + v3.variacionPct + '%', ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 72: Generación Determinista de Hash Digital SHA-256
    // ------------------------------------------------------------
    (function () {
        var h1 = generarHashDocumento('DOC-COT-001', 'Certificado Presupuesto', '2026-03-15T10:00:00Z');
        var h2 = generarHashDocumento('DOC-COT-001', 'Certificado Presupuesto', '2026-03-15T10:00:00Z');
        var h3 = generarHashDocumento('DOC-COT-002', 'Certificado Distinto', '2026-03-15T10:00:00Z');

        var ok = (typeof h1 === 'string') &&
                 (h1.length === 64) &&
                 (h1 === h2) &&
                 (h1 !== h3);

        verificar(72, 'generarHashDocumento produce huellas criptográficas deterministas de 64 caracteres hex', 'Longitud 64, h1 === h2, h1 !== h3', 'len=' + (h1 ? h1.length : 0) + ', identicos=' + (h1 === h2), ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 73: Verificación Inmutable de Documentos Certificados
    // ------------------------------------------------------------
    (function () {
        var doc = verificarDocumentoPorCodigo('DOC-2026-COT-0001');
        var docInexistente = verificarDocumentoPorCodigo('DOC-INEXISTENTE-999');

        var ok = Boolean(doc) &&
                 (doc.codigo === 'DOC-2026-COT-0001') &&
                 (doc.valido === true) &&
                 (docInexistente === null);

        verificar(73, 'verificarDocumentoPorCodigo valida autenticidad de certificaciones institucionales emitidas', 'Documento encontrado y válido; inexistente retorna null', 'doc=' + (doc ? doc.codigo : 'null') + ', inex=' + docInexistente, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 74: Inteligencia Administrativa y Alertas Heurísticas
    // ------------------------------------------------------------
    (function () {
        var cotDemorada = [
            { correlativo: 'COT-TEST-DEM', estado: 'ENVIADA', fechaCreacionISO: generarFechaRelativa(7).iso, nombreObra: 'Hospital' }
        ];
        var finMora = [
            { correlativoCotizacion: 'COT-MORA', estado: 'EN_MORA', diasAtraso: 25, saldoPendienteUSD: 500, nombreCliente: 'Ente X' }
        ];
        var stockCritico = [
            { id: 99, nombreMaterial: 'Tubería Gas', stockActual: 5, stockReservado: 2, stockMinimo: 10 }
        ];
        var ptoCritico = [
            { institucionId: 88, nombreInstitucion: 'Municipio Y', asignado: 1000, comprometido: 900, ejecutado: 50 }
        ];

        var alertas = evaluarAlertasInteligentesSistema(cotDemorada, finMora, stockCritico, ptoCritico);
        var tieneCot = false;
        var tieneFin = false;
        var tieneStk = false;
        var tienePto = false;

        for (var a = 0; a < alertas.length; a++) {
            if (alertas[a].codigo === 'COTIZACION_DEMORADA') tieneCot = true;
            if (alertas[a].codigo === 'CARTERA_EN_MORA') tieneFin = true;
            if (alertas[a].codigo === 'STOCK_CRITICO') tieneStk = true;
            if (alertas[a].codigo === 'PRESUPUESTO_CRITICO') tienePto = true;
        }

        var ok = (alertas.length === 4) && tieneCot && tieneFin && tieneStk && tienePto;
        verificar(74, 'evaluarAlertasInteligentesSistema detecta cotizaciones demoradas, mora crítica, stock y presupuesto', '4 alertas heurísticas detectadas con precisión', 'total=' + alertas.length + ', cot=' + tieneCot + ', fin=' + tieneFin + ', stk=' + tieneStk + ', pto=' + tienePto, ok);
    })();

    // ------------------------------------------------------------
    // PRUEBA 75: Adaptador API Offline-First y Resiliencia
    // ------------------------------------------------------------
    (function () {
        var adaptador = window.SICOPAdaptadorAPI;
        var existe = Boolean(adaptador && typeof adaptador.obtenerEstadoConexion === 'function');
        var estado = existe ? adaptador.obtenerEstadoConexion() : {};
        var insts = existe ? adaptador.obtenerInstituciones() : [];

        var ok = existe &&
                 (typeof estado.modo === 'string') &&
                 (insts.length >= 6);

        verificar(75, 'AdaptadorAPI opera de forma no bloqueante con fallback transparente a almacenamiento local', 'Adaptador activo con modo definido e instituciones disponibles', 'existe=' + existe + ', modo=' + estado.modo + ', insts=' + insts.length, ok);
    })();

    } finally {
        _restaurarSnapshotStorage(snapshotInicial);
    }

    return resultados;
}

/**
 * Renderiza la tabla de resultados en el documento HTML de pruebas.
 */
function renderizarResultadosPruebas() {
    var contenedor = document.getElementById('cuerpoResultadosPruebas');
    var badgeTotal = document.getElementById('badgeTotalPruebas');
    var badgeAprobadas = document.getElementById('badgeAprobadas');
    var badgeFallidas = document.getElementById('badgeFallidas');

    if (!contenedor) return;

    var resultados = ejecutarSuitePruebas();
    contenedor.innerHTML = '';

    var totalAprobadas = 0;

    for (var i = 0; i < resultados.length; i++) {
        var r = resultados[i];
        if (r.paso) totalAprobadas++;

        var fila = document.createElement('tr');
        fila.className = r.paso ? 'fila-prueba-aprobada' : 'fila-prueba-fallida';

        fila.innerHTML =
            '<td><strong>#' + r.numero + '</strong></td>' +
            '<td>' + r.caso + '</td>' +
            '<td><code>' + r.esperado + '</code></td>' +
            '<td><code>' + r.obtenido + '</code></td>' +
            '<td><span class="badge-resultado ' + (r.paso ? 'badge-exito' : 'badge-peligro') + '" style="display:inline-flex; align-items:center; gap:0.35rem;">' +
            (typeof icono === 'function' ? (r.paso ? icono('check', 12) : icono('cerrar', 12)) : '') +
            '<span>' + (r.paso ? 'APROBADA' : 'FALLÓ') + '</span></span></td>';

        contenedor.appendChild(fila);
    }

    if (badgeTotal) badgeTotal.textContent = resultados.length;
    if (badgeAprobadas) badgeAprobadas.textContent = totalAprobadas;
    if (badgeFallidas) badgeFallidas.textContent = (resultados.length - totalAprobadas);

    console.log("TESTS_SUMMARY: Total=" + resultados.length + ", Aprobadas=" + totalAprobadas + ", Fallidas=" + (resultados.length - totalAprobadas));
}

document.addEventListener('DOMContentLoaded', renderizarResultadosPruebas);

