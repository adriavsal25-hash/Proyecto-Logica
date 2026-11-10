/* ============================================================
   SICOP-VE — Capa de Lógica de Negocio Pura (js/logica.js)
   Proyecto Final: Lógica y Programación I
   
   REGLA ESTRICTA DE DISEÑO:
   Este archivo NO interactúa con el DOM (sin document.getElementById,
   sin alertas, sin elementos HTML). Contiene únicamente funciones puras,
   algoritmos, cálculos matemáticos y validaciones de reglas de negocio.
   ============================================================ */

// ============================================================
// 1. FUNCIONES AUXILIARES DE FORMATO Y FECHA
// ============================================================

/**
 * Formatea un número en formato venezolano estándar:
 * - Separador de miles: punto (.)
 * - Separador de decimales: coma (,)
 * - Ejemplo: 1234.56 -> "1.234,56"
 * 
 * Si se especifica el parámetro 'moneda', antepone el símbolo respectivo:
 * - 'USD' -> "$1.234,56"
 * - 'Bs'  -> "Bs. 1.234,56"
 * 
 * @param {number} numero - Monto a formatear.
 * @param {string} [moneda] - Opcional ('USD' o 'Bs').
 * @param {number} [tasaBCV] - Tasa opcional para convertir de USD a Bs en vivo.
 * @returns {string} Texto formateado con dos decimales y separadores venezolanos.
 */
function formatearMoneda(numero, moneda, tasaBCV) {
    var valor = Number(numero);
    if (isNaN(valor)) valor = 0;
    if (moneda === 'Bs' && tasaBCV && !isNaN(Number(tasaBCV)) && Number(tasaBCV) > 0) {
        valor = valor * Number(tasaBCV);
    }
    var signo = valor < 0 ? '-' : '';
    valor = Math.abs(valor);
    var partes = valor.toFixed(2).split('.');
    var entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    var cifra = entero + ',' + partes[1];
    if (moneda === 'USD' || moneda === '$') return signo + '$' + cifra;
    if (moneda === 'Bs' || moneda === 'VES') return signo + 'Bs. ' + cifra;
    return signo + cifra;
}

/**
 * Funciones auxiliares centralizadas para formateo monetario estándar.
 */
function usd(n) { return formatearMoneda(n, 'USD'); }
function bs(n) { return formatearMoneda(n, 'Bs'); }
function bsDesdeUSD(n, tasa) { return formatearMoneda(n, 'Bs', tasa); }

/**
 * Normaliza la denominación de un perfil o rol institucional.
 * @param {string} perfil - Texto del perfil.
 * @returns {string} Rol en mayúsculas sin tildes ('GOBERNACION', 'ALCALDIA', 'EMPRESA', 'CONSTRUCTOR').
 */
function normalizarRol(perfil) {
    if (!perfil) return '';
    var p = String(perfil).toLowerCase()
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
        .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n').trim();
    if (p.indexOf('gobernacion') !== -1) return 'GOBERNACION';
    if (p.indexOf('alcaldia') !== -1) return 'ALCALDIA';
    if (p.indexOf('empresa') !== -1) return 'EMPRESA';
    if (p.indexOf('constructor') !== -1 || p.indexOf('comuna') !== -1) return 'CONSTRUCTOR';
    return p.toUpperCase();
}

/**
 * Determina de forma normalizada e insensible a mayúsculas o tildes si un usuario pertenece al rol Gobernación.
 * @param {Object} usuario - Objeto usuario con propiedad perfil o nivel.
 * @returns {boolean}
 */
function esRolGobernacion(usuario) {
    if (!usuario) return false;
    if (usuario.nivel === 5) return true;
    var r = normalizarRol(usuario.perfil || usuario.rol);
    return r === 'GOBERNACION';
}

/**
 * Sistema centralizado de autorización y control de acceso (RBAC).
 * @param {Object} usuario - Usuario en sesión.
 * @param {string} accion - Clave de la acción o módulo a verificar.
 * @returns {boolean}
 */
function tienePermiso(usuario, accion) {
    if (!usuario || usuario.activo === false) return false;
    var esAdmin = esRolGobernacion(usuario);

    // Módulos y acciones de control y supervisión (Gobernación)
    if (accion === 'ver_catalogo' ||
        accion === 'editar_materiales' ||
        accion === 'aprobar_cotizacion' ||
        accion === 'rechazar_cotizacion' ||
        accion === 'marcar_entregada' ||
        accion === 'gestionar_cartera' ||
        accion === 'supervisar_cuotas' ||
        accion === 'ver_bitacora' ||
        accion === 'gestionar_usuarios' ||
        accion === 'estado-usuarios' ||
        accion === 'catalogo' ||
        accion === 'aprobaciones' ||
        accion === 'cartera' ||
        accion === 'supervision' ||
        accion === 'bitacora' ||
        accion === 'control-financiero' ||
        accion === 'conciliacion-pagos' ||
        accion === 'conciliar_pago' ||
        accion === 'proyecciones' ||
        accion === 'presupuestos' ||
        accion === 'instituciones' ||
        accion === 'inventario' ||
        accion === 'proveedores' ||
        accion === 'documentos' ||
        accion === 'inteligencia' ||
        accion === 'monitor-sistema') {
        return esAdmin;
    }

    // Módulos y acciones operativas comunes
    if (accion === 'cotizador' ||
        accion === 'crear_cotizacion' ||
        accion === 'dashboard' ||
        accion === 'calculadora' ||
        accion === 'mapa' ||
        accion === 'historial' ||
        accion === 'cuotas' ||
        accion === 'exportar' ||
        accion === 'ver_mis_cuotas' ||
        accion === 'pagar_cuota' ||
        accion === 'proyectos') {
        return true;
    }

    return false;
}

/**
 * Verifica si un usuario cuenta con autenticación activa y válida.
 * @param {Object} usuario - Objeto de usuario.
 * @returns {boolean}
 */
function requiereAutenticacion(usuario) {
    return Boolean(usuario && usuario.id && usuario.activo !== false);
}

/**
 * Valida si un usuario es propietario legítimo de un recurso o si tiene perfil de Gobernación.
 * @param {Object} usuario - Usuario solicitante.
 * @param {Object} recurso - Recurso con propiedad usuarioId.
 * @returns {boolean}
 */
function validarPropiedadDelRecurso(usuario, recurso) {
    if (!usuario || !recurso) return false;
    if (esRolGobernacion(usuario)) return true;
    return Number(usuario.id) === Number(recurso.usuarioId);
}

/**
 * Obtiene la moneda activa del sistema desde localStorage ('USD' o 'Bs').
 * @returns {string}
 */
function obtenerMonedaActiva() {
    if (typeof localStorage !== 'undefined' && typeof CLAVES_STORAGE !== 'undefined' && CLAVES_STORAGE.MONEDA) {
        return localStorage.getItem(CLAVES_STORAGE.MONEDA) || 'USD';
    }
    return 'USD';
}

/**
 * Establece y persiste la moneda activa del sistema ('USD' o 'Bs').
 * @param {string} moneda - 'USD' o 'Bs'.
 * @returns {string}
 */
function establecerMonedaActiva(moneda) {
    moneda = (moneda === 'Bs' || moneda === 'VES') ? 'Bs' : 'USD';
    if (typeof localStorage !== 'undefined' && typeof CLAVES_STORAGE !== 'undefined' && CLAVES_STORAGE.MONEDA) {
        localStorage.setItem(CLAVES_STORAGE.MONEDA, moneda);
    }
    return moneda;
}

/**
 * Obtiene una tasa BCV válida y saneada (fallback a 900.00 si está corrupta).
 * @returns {number}
 */
function obtenerTasaBCVValida() {
    var tasa = (typeof obtenerTasaBCV === 'function') ? obtenerTasaBCV() : 900.00;
    if (!tasa || isNaN(Number(tasa)) || Number(tasa) <= 100 || Number(tasa) === 0.18 || Number(tasa) === 36.50) {
        return 900.00;
    }
    return Number(tasa);
}

/**
 * Convierte un monto USD a Bolívares usando la tasa BCV oficial activa.
 * @param {number} montoUSD - Monto en dólares.
 * @param {number} [tasaBCV] - Tasa opcional.
 * @returns {number}
 */
function convertirUSDaBs(montoUSD, tasaBCV) {
    var t = (tasaBCV && !isNaN(Number(tasaBCV)) && Number(tasaBCV) > 0) ? Number(tasaBCV) : obtenerTasaBCVValida();
    return Math.round((Number(montoUSD) || 0) * t * 100) / 100;
}

/**
 * Convierte un monto en Bolívares a USD usando la tasa BCV oficial activa.
 * @param {number} montoBs - Monto en bolívares.
 * @param {number} [tasaBCV] - Tasa opcional.
 * @returns {number}
 */
function convertirBsaUSD(montoBs, tasaBCV) {
    var t = (tasaBCV && !isNaN(Number(tasaBCV)) && Number(tasaBCV) > 0) ? Number(tasaBCV) : obtenerTasaBCVValida();
    if (t <= 0) return 0;
    return Math.round(((Number(montoBs) || 0) / t) * 100) / 100;
}

/**
 * Formatea un monto expresado originalmente en USD según la moneda activa en la plataforma.
 * Si la moneda activa es Bolívares ('Bs' o 'VES'), lo multiplica por la tasa oficial BCV activa.
 * @param {number} montoUSD - Monto base en dólares.
 * @param {number} [tasaOverride] - Tasa de cambio opcional para sobrescribir la del almacenamiento.
 * @returns {string} Cadena formateada ($X.XXX,XX o Bs. X.XXX,XX).
 */
function monedaActiva(montoUSD, tasaOverride) {
    var m = obtenerMonedaActiva();
    var t = (tasaOverride && !isNaN(Number(tasaOverride)) && Number(tasaOverride) > 0)
        ? Number(tasaOverride)
        : obtenerTasaBCVValida();
    if (m === 'Bs' || m === 'VES') {
        return formatearMoneda(Number(montoUSD) || 0, 'Bs', t);
    }
    return formatearMoneda(Number(montoUSD) || 0, 'USD');
}

/**
 * Alias de compatibilidad para formatear con la moneda activa.
 */
function formatearMontoActivo(montoUSD, tasaOverride) {
    return monedaActiva(montoUSD, tasaOverride);
}

/**
 * Devuelve la etiqueta corta de la moneda activa ('Bs.' o 'USD').
 * @returns {string}
 */
function etiquetaMonedaActiva() {
    var m = obtenerMonedaActiva();
    return (m === 'Bs' || m === 'VES') ? 'Bs.' : 'USD';
}

if (typeof window !== 'undefined') {
    window.normalizarRol = normalizarRol;
    window.esRolGobernacion = esRolGobernacion;
    window.tienePermiso = tienePermiso;
    window.requiereAutenticacion = requiereAutenticacion;
    window.validarPropiedadDelRecurso = validarPropiedadDelRecurso;
    window.monedaActiva = monedaActiva;
    window.formatearMontoActivo = formatearMontoActivo;
    window.etiquetaMonedaActiva = etiquetaMonedaActiva;
    window.obtenerMonedaActiva = obtenerMonedaActiva;
    window.establecerMonedaActiva = establecerMonedaActiva;
    window.convertirUSDaBs = convertirUSDaBs;
    window.convertirBsaUSD = convertirBsaUSD;
    window.obtenerTasaBCVValida = obtenerTasaBCVValida;
    window.procesarPagoInicial = procesarPagoInicial;
}

/**
 * Valida los datos iniciales de la obra en el Paso 1 del asistente de cotización.
 * @param {string} nombreObra - Nombre descriptivo de la obra.
 * @param {string} estadoObra - Estado geográfico de destino.
 * @returns {Object} { valido: boolean, error?: string, campo?: string }
 */
function validarPasoObra(nombreObra, estadoObra) {
    if (!nombreObra || typeof nombreObra !== 'string' || nombreObra.trim().length < 4) {
        return {
            valido: false,
            campo: 'nombreObra',
            error: 'El nombre de la obra debe tener al menos 4 caracteres. Ejemplo: "Reparación Escuela San José".'
        };
    }
    if (!estadoObra || !FACTORES_FLETE[estadoObra]) {
        return {
            valido: false,
            campo: 'estadoObra',
            error: 'Seleccione un estado de destino válido para calcular el flete terrestre.'
        };
    }
    return { valido: true };
}

/**
 * Valida un campo individual de cantidad de material con mensaje claro y sugerencia concreta.
 * @param {*} valor - Valor ingresado en el input.
 * @param {string} nombreMaterial - Nombre del material para contextualizar el error.
 * @returns {Object} { valido: boolean, cantidad: number, error?: string }
 */
/**
 * Valida de manera estricta el campo de cantidad ingresado para un material.
 * Reglas:
 * - Rechaza NaN, Infinity, notación científica (1e5) y hexadecimal (0x10).
 * - Exige formato numérico positivo mediante expresión regular.
 * - Respeta si el material permite o no cantidades decimales (permiteDecimales).
 * - Límite máximo razonable de 1.000.000 de unidades.
 * @param {*} valor - Valor a validar.
 * @param {string} nombreMaterial - Nombre descriptivo para el mensaje de error.
 * @param {boolean} [permiteDecimales=false] - Indica si el material tolera fracciones.
 * @returns {Object} { valido: boolean, cantidad: number, error?: string }
 */
function validarCampoCantidad(valor, nombreMaterial, permiteDecimales) {
    var nombre = nombreMaterial || 'el material';
    var admiteDec = Boolean(permiteDecimales);
    var str = String(valor === undefined || valor === null ? '' : valor).trim();
    if (str === '') {
        return { valido: true, cantidad: 0 };
    }

    // Normalizar separador decimal venezolano (coma a punto)
    str = str.replace(',', '.');

    // Detección inmediata de números negativos con mensaje pedagógico
    if (/^-\s*[0-9]+/.test(str) || Number(str) < 0) {
        return {
            valido: false,
            cantidad: 0,
            error: 'La cantidad para "' + nombre + '" no puede ser negativa. Debe ser mayor que cero. Prueba con 10.'
        };
    }

    // Validación estricta con regex para rechazar notación científica, hex, símbolos o espacios
    var patron = admiteDec ? /^[0-9]+(\.[0-9]+)?$/ : /^[0-9]+$/;
    if (!patron.test(str)) {
        if (!admiteDec && /^[0-9]+\.[0-9]+$/.test(str)) {
            return {
                valido: false,
                cantidad: 0,
                error: 'El material "' + nombre + '" solo admite cantidades enteras, sin decimales.'
            };
        }
        return {
            valido: false,
            cantidad: 0,
            error: 'Cantidad no válida para "' + nombre + '". Escribe solo números (ej. ' + (admiteDec ? '10 ó 10.5' : '10') + '), sin letras, notación científica ni caracteres especiales.'
        };
    }

    var num = Number(str);
    if (isNaN(num) || !isFinite(num)) {
        return {
            valido: false,
            cantidad: 0,
            error: 'Cantidad numérica inválida para "' + nombre + '".'
        };
    }
    if (num < 0) {
        return {
            valido: false,
            cantidad: 0,
            error: 'La cantidad para "' + nombre + '" no puede ser negativa. Debe ser mayor que cero. Prueba con 10.'
        };
    }
    if (num > 1000000) {
        return {
            valido: false,
            cantidad: 0,
            error: 'La cantidad máxima permitida para "' + nombre + '" es de 1.000.000 unidades.'
        };
    }

    if (admiteDec) {
        num = Math.round(num * 100) / 100;
    }

    return { valido: true, cantidad: num };
}

/**
 * Retorna la fecha y hora actual en formato estándar DD/MM/AAAA HH:MM.
 * @returns {string} Fecha formateada.
 */
function obtenerFechaActual() {
    var ahora = new Date();
    var dia = String(ahora.getDate()).padStart(2, '0');
    var mes = String(ahora.getMonth() + 1).padStart(2, '0');
    var anio = ahora.getFullYear();
    var horas = String(ahora.getHours()).padStart(2, '0');
    var minutos = String(ahora.getMinutes()).padStart(2, '0');
    return dia + '/' + mes + '/' + anio + ' ' + horas + ':' + minutos;
}

/**
 * Calcula la diferencia en días entre una fecha dada (DD/MM/AAAA) y la fecha de hoy.
 * @param {string} fechaTexto - Cadena de fecha en formato "DD/MM/AAAA...".
 * @returns {number} Número de días transcurridos.
 */
function calcularDiasTranscurridos(fechaTexto, fechaISO) {
    var hoy = new Date();
    // Priorizar fechaISO si existe
    if (fechaISO && typeof fechaISO === 'string') {
        var dIso = new Date(fechaISO);
        if (!isNaN(dIso.getTime())) {
            var difIso = hoy.getTime() - dIso.getTime();
            return Math.max(0, Math.floor(difIso / (1000 * 60 * 60 * 24)));
        }
    }
    if (!fechaTexto || typeof fechaTexto !== 'string') {
        return 0;
    }
    // Si fechaTexto viene en formato ISO
    if (fechaTexto.indexOf('T') !== -1 || fechaTexto.indexOf('-') !== -1) {
        var dTextoIso = new Date(fechaTexto);
        if (!isNaN(dTextoIso.getTime())) {
            var difT = hoy.getTime() - dTextoIso.getTime();
            return Math.max(0, Math.floor(difT / (1000 * 60 * 60 * 24)));
        }
    }
    var partesFecha = fechaTexto.split(' ')[0].split('/');
    if (partesFecha.length < 3) {
        return 0;
    }
    var dia = parseInt(partesFecha[0], 10);
    var mes = parseInt(partesFecha[1], 10) - 1;
    var anio = parseInt(partesFecha[2], 10);

    var fechaOrigen = new Date(anio, mes, dia);
    var diferenciaMilisegundos = hoy.getTime() - fechaOrigen.getTime();
    return Math.max(0, Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24)));
}

// ============================================================
// 2. ALGORITMO DE ORDENAMIENTO BURBUJA MANUAL (SIN sort())
// ============================================================

/**
 * Ordena un arreglo de objetos según una propiedad numérica o alfabética.
 * Algoritmo clásico de intercambio de burbuja implementado a mano.
 * @param {Array<Object>} arreglo - Arreglo a ordenar.
 * @param {string} propiedad - Nombre de la propiedad del objeto a comparar.
 * @param {boolean} ascendente - true: menor a mayor, false: mayor a menor.
 * @returns {Array<Object>} Nuevo arreglo ordenado (no muta el original).
 */
function ordenarBurbuja(arreglo, propiedad, ascendente) {
    if (!Array.isArray(arreglo)) {
        return [];
    }

    // Se realiza una copia superficial para no alterar el arreglo original
    var copia = [];
    for (var k = 0; k < arreglo.length; k++) {
        copia.push(arreglo[k]);
    }

    var n = copia.length;
    var huboIntercambio;

    // Ciclo exterior: pasadas por el arreglo
    for (var i = 0; i < n - 1; i++) {
        huboIntercambio = false;

        // Ciclo interior: comparaciones adyacentes
        for (var j = 0; j < n - 1 - i; j++) {
            var valA = copia[j][propiedad];
            var valB = copia[j + 1][propiedad];

            var debeIntercambiar = false;
            if (ascendente) {
                if (valA > valB) {
                    debeIntercambiar = true;
                }
            } else {
                if (valA < valB) {
                    debeIntercambiar = true;
                }
            }

            if (debeIntercambiar) {
                var temporal = copia[j];
                copia[j] = copia[j + 1];
                copia[j + 1] = temporal;
                huboIntercambio = true;
            }
        }

        // Optimización: si en una pasada no hubo intercambios, la lista ya está ordenada
        if (!huboIntercambio) {
            break;
        }
    }

    return copia;
}

/**
 * Obtiene la ciudad de compra más económica disponible usando burbuja.
 * @param {Array<Object>} ciudades - Lista de ciudades con factor de precio.
 * @returns {Object} La ciudad con menor factor de costo.
 */
function obtenerCiudadMasBarata(ciudades) {
    var ciudadesOrdenadas = ordenarBurbuja(ciudades, 'factor', true);
    return ciudadesOrdenadas[0];
}

// ============================================================
// 3. MÓDULO 1: ESTIMADOR / CALCULADORA DE MATERIALES
// ============================================================

/**
 * Aplica el margen de desperdicio editable a una cantidad base y redondea hacia arriba.
 * @param {number} cantidadBase - Cantidad teórica neta.
 * @param {number} porcentajeDesperdicio - Margen en % (por ej. 10 para 10%).
 * @returns {number} Cantidad ajustada redondeada con Math.ceil.
 */
function aplicarDesperdicio(cantidadBase, porcentajeDesperdicio) {
    var pct = Number(porcentajeDesperdicio);
    if (isNaN(pct) || pct < 0) {
        pct = 10;
    }
    var totalConDesperdicio = cantidadBase * (1 + (pct / 100));
    // Redondear a 6 decimales para neutralizar imprecisiones de punto flotante IEEE 754 antes de Math.ceil
    var redondeado = Math.round(totalConDesperdicio * 1000000) / 1000000;
    return Math.ceil(redondeado);
}

/**
 * Estima los materiales requeridos para levantar una pared de bloques.
 * Reglas:
 * - Área = largo * alto (m²)
 * - Bloques base = m² * 12.5 unidades
 * - Cemento base = m² * 0.20 sacos de pega
 * @param {number} largo - Longitud en metros.
 * @param {number} alto - Altura en metros.
 * @param {number} desperdicioPct - Porcentaje de desperdicio (defecto 10%).
 * @returns {Object} Estimación calculada.
 */
function calcularMaterialesPared(largo, alto, desperdicioPct) {
    var l = Number(largo);
    var h = Number(alto);
    if (isNaN(l) || l <= 0 || isNaN(h) || h <= 0) {
        return { valido: false, error: 'Dimensiones de pared inválidas (deben ser mayores a 0).' };
    }

    var area = l * h;
    var bloquesBase = area * 12.5;
    var cementoBase = area * 0.20;

    var bloquesFinal = aplicarDesperdicio(bloquesBase, desperdicioPct);
    var cementoFinal = aplicarDesperdicio(cementoBase, desperdicioPct);

    return {
        valido: true,
        tipo: 'Pared de Bloques',
        areaM2: area,
        desperdicioPct: desperdicioPct,
        resultados: [
            { nombreBusqueda: 'Bloque', cantidad: bloquesFinal, unidad: 'Unidades', detalle: '12.5 bloques/m²' },
            { nombreBusqueda: 'Cemento', cantidad: cementoFinal, unidad: 'Sacos 42.5kg', detalle: '0.20 sacos/m² (pega)' }
        ]
    };
}

/**
 * Estima los materiales para una losa de concreto armado.
 * Reglas:
 * - Volumen = largo * ancho * espesor (m³)
 * - Cemento base = m³ * 7 sacos
 * - Cabilla base = (largo * ancho) * cabillaPorM2
 * @param {number} largo - Largo en metros.
 * @param {number} ancho - Ancho en metros.
 * @param {number} espesor - Espesor en metros (ej: 0.15 para 15 cm).
 * @param {number} cabillaPorM2 - Barras de cabilla por m² (editable, ej: 1.2).
 * @param {number} desperdicioPct - Margen de desperdicio.
 * @returns {Object} Estimación calculada.
 */
function calcularMaterialesLosa(largo, ancho, espesor, cabillaPorM2, desperdicioPct) {
    var l = Number(largo);
    var a = Number(ancho);
    var e = Number(espesor);
    var cPorM2 = Number(cabillaPorM2);

    if (isNaN(l) || l <= 0 || isNaN(a) || a <= 0 || isNaN(e) || e <= 0) {
        return { valido: false, error: 'Dimensiones de losa inválidas (deben ser mayores a 0).' };
    }
    if (isNaN(cPorM2) || cPorM2 < 0) {
        cPorM2 = 1.2;
    }

    var area = l * a;
    var volumen = area * e;
    var cementoBase = volumen * 7.0;
    var cabillasBase = area * cPorM2;

    var cementoFinal = aplicarDesperdicio(cementoBase, desperdicioPct);
    var cabillasFinal = aplicarDesperdicio(cabillasBase, desperdicioPct);

    return {
        valido: true,
        tipo: 'Losa de Concreto',
        areaM2: area,
        volumenM3: volumen,
        desperdicioPct: desperdicioPct,
        resultados: [
            { nombreBusqueda: 'Cemento', cantidad: cementoFinal, unidad: 'Sacos 42.5kg', detalle: '7 sacos/m³' },
            { nombreBusqueda: 'Cabilla', cantidad: cabillasFinal, unidad: 'Barras 12m', detalle: cPorM2 + ' barras/m²' }
        ]
    };
}

/**
 * Estima los tubos necesarios para un tramo de tubería.
 * Cada tubo estándar mide 6 metros.
 * @param {number} metrosLineales - Metros lineales de recorrido.
 * @param {number} desperdicioPct - Desperdicio.
 * @returns {Object} Estimación calculada.
 */
function calcularMaterialesTuberia(metrosLineales, desperdicioPct) {
    var m = Number(metrosLineales);
    if (isNaN(m) || m <= 0) {
        return { valido: false, error: 'Metros de tramo inválidos (debe ser mayor a 0).' };
    }

    var tubosBase = m / 6.0;
    var tubosFinal = aplicarDesperdicio(tubosBase, desperdicioPct);

    return {
        valido: true,
        tipo: 'Instalación de Tubería',
        metrosLineales: m,
        desperdicioPct: desperdicioPct,
        resultados: [
            { nombreBusqueda: 'Tubería', cantidad: tubosFinal, unidad: 'Tubos 6m', detalle: '6 m por tramo' }
        ]
    };
}

// ============================================================
// 4. MÓDULO 2: MOTOR DE CÁLCULO DE COTIZACIÓN
// ============================================================

/**
 * Valida un conjunto de cantidades ingresadas por el usuario.
 * @param {Array<Object>} materialesCatalogo - Lista completa de materiales activos.
 * @param {Object} mapaCantidades - Objeto { [materialId]: cantidad }.
 * @returns {Object} { valido: boolean, error?: string, itemsValidos?: Array }
 */
function validarCantidadesCotizacion(materialesCatalogo, mapaCantidades) {
    var items = [];
    var sumaCantidades = 0;

    for (var i = 0; i < materialesCatalogo.length; i++) {
        var mat = materialesCatalogo[i];
        if (!mat.activo) {
            continue;
        }

        var valIngresado = mapaCantidades[mat.id];
        // Si no está definido o es string vacío, se asume 0
        if (valIngresado === undefined || valIngresado === null || String(valIngresado).trim() === '') {
            continue;
        }

        var resCampo = validarCampoCantidad(valIngresado, mat.nombre, mat.permiteDecimales);
        if (!resCampo.valido) {
            return {
                valido: false,
                materialId: mat.id,
                error: resCampo.error
            };
        }

        if (resCampo.cantidad > 0) {
            items.push({
                materialId: mat.id,
                nombre: mat.nombre,
                unidad: mat.unidad,
                sector: mat.sector,
                precioBase: mat.precioBase,
                cantidad: resCampo.cantidad
            });
            sumaCantidades += resCampo.cantidad;
        }
    }

    if (items.length === 0 || sumaCantidades === 0) {
        return { valido: false, error: 'Debe ingresar al menos un material con cantidad mayor a cero.' };
    }

    return { valido: true, items: items };
}

/**
 * Realiza el cálculo matemático completo de una cotización conforme a la normativa:
 * 1. Subtotal = Suma(cantidad * precioBase * factorCiudad)
 * 2. Flete = Subtotal * (factorFlete - 1)
 * 3. Descuento = (Subtotal + Flete) * porcentajeDescuentoPerfil
 * 4. Neto = (Subtotal + Flete) - Descuento
 * 5. Contingencia = Neto * 0.05
 * 6. IVA = (Neto + Contingencia) * 0.16
 * 7. Total USD = Neto + Contingencia + IVA
 * 8. Total Bs = Total USD * tasaBCV
 *
 * @param {Array<Object>} itemsValidados - Materiales con cantidad y precioBase.
 * @param {Object} ciudadCompra - Ciudad seleccionada (por defecto la más barata).
 * @param {Object} usuario - Usuario solicitante (perfil y estado).
 * @param {number} tasaCambio - Tasa referencial en Bs./USD.
 * @returns {Object} Desglose detallado del presupuesto.
 */
function calcularPresupuestoCotizacion(itemsValidados, ciudadCompra, usuario, tasaCambio) {
    var factorCiudad = ciudadCompra.factor;
    var factorFlete = FACTORES_FLETE[usuario.estado] || 1.00;
    var pctDescuento = DESCUENTOS_POR_PERFIL[usuario.perfil] || 0.00;

    var subtotal = 0;
    var itemsConPrecio = [];

    for (var i = 0; i < itemsValidados.length; i++) {
        var itm = itemsValidados[i];
        // Precio ajustado por el factor de la ciudad
        var precioUnitarioAjustado = itm.precioBase * factorCiudad;
        var totalLinea = itm.cantidad * precioUnitarioAjustado;
        subtotal += totalLinea;

        itemsConPrecio.push({
            materialId: itm.materialId,
            nombre: itm.nombre,
            unidad: itm.unidad,
            sector: itm.sector,
            cantidad: itm.cantidad,
            precioUnitario: precioUnitarioAjustado,
            total: totalLinea
        });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // Regla 2: Flete terrestre
    var flete = Math.round(subtotal * (factorFlete - 1.00) * 100) / 100;

    // Regla 3: Descuento institucional por perfil
    var baseDescuento = subtotal + flete;
    var descuento = Math.round(baseDescuento * pctDescuento * 100) / 100;

    // Regla 4: Monto Neto
    var neto = Math.round((baseDescuento - descuento) * 100) / 100;

    // Regla 5: Contingencia técnica (5%)
    var contingencia = Math.round(neto * CONTINGENCIA * 100) / 100;

    // Regla 6: IVA (16% sobre neto + contingencia)
    var baseImponible = neto + contingencia;
    var iva = Math.round(baseImponible * IVA * 100) / 100;

    // Regla 7: Total final en USD
    var totalUSD = Math.round((baseImponible + iva) * 100) / 100;

    // Regla 8: Conversión a Bolívares
    var tasa = Number(tasaCambio);
    if (isNaN(tasa) || tasa <= 0) {
        tasa = TASA_BCV_INICIAL;
    }
    var totalBs = Math.round(totalUSD * tasa * 100) / 100;

    return {
        ciudadCompra: ciudadCompra.nombre,
        factorCiudad: factorCiudad,
        estadoDestino: usuario.estado,
        factorFlete: factorFlete,
        perfilUsuario: usuario.perfil,
        descuentoPct: pctDescuento,
        items: itemsConPrecio,
        subtotal: subtotal,
        flete: flete,
        descuento: descuento,
        neto: neto,
        contingencia: contingencia,
        iva: iva,
        total: totalUSD,
        tasaBCV: tasa,
        totalBs: totalBs
    };
}

// ============================================================
// 5. MÓDULO 5: CONTROL PRESUPUESTARIO Y REGLAS DE FLUJO
// ============================================================

/**
 * REGLA ESTRICTA: Un usuario no puede iniciar una nueva cotización
 * si actualmente posee alguna en estado 'BORRADOR' o 'ENVIADA'.
 * Queda liberado si sus cotizaciones están en APROBADA, RECHAZADA, ENTREGADA o CANCELADA.
 * @param {number} usuarioId - ID del usuario.
 * @param {Array<Object>} todasCotizaciones - Colección de cotizaciones.
 * @returns {Object} { puede: boolean, cotizacionBloqueante?: Object }
 */
function verificarDisponibilidadNuevaCotizacion(usuarioId, todasCotizaciones) {
    var cots = todasCotizaciones || [];

    // 1. Chequeo de mora CONSERVADOR — solo bloquea si hay datos válidos
    if (typeof evaluarMoraUsuario === 'function') {
        try {
            var _mv = evaluarMoraUsuario(usuarioId);
            // Solo bloquear si:
            //   - realmente hay planes atrasados
            //   - la mora supera $0.01 (evitar falsos positivos)
            //   - el motivo es un string no vacío
            if (_mv && (_mv.bloqueado === true || _mv.tieneMora === true) &&
                (Number(_mv.moraTotal || _mv.totalMoraUSD) > 0.01) &&
                typeof (_mv.motivo || _mv.mensajeMora) === 'string' && (_mv.motivo || _mv.mensajeMora).length > 0) {
                return {
                    puede: false,
                    cotizacionBloqueante: null,
                    motivoMora: true,
                    mensajeMora: _mv.motivo || _mv.mensajeMora
                };
            }
        } catch (eMora) {
            console.warn('evaluarMoraUsuario falló, se ignora:', eMora);
            // NUNCA bloquear por un error del chequeo de mora
        }
    }

    // 2. Chequeo original: una sola cotización abierta
    for (var i = 0; i < cots.length; i++) {
        var cot = cots[i];
        if (cot.usuarioId === usuarioId) {
            if (cot.estado === 'BORRADOR' || cot.estado === 'ENVIADA') {
                return { puede: false, cotizacionBloqueante: cot, motivoMora: false };
            }
        }
    }
    return { puede: true, motivoMora: false };
}

/**
 * Calcula el semáforo y estado de ejecución presupuestaria de un usuario.
 * Límite de gasto:
 * - Alcaldía / Gobernación: Presupuesto institucional asignado.
 * - Empresa / Constructor: Cupo = Ingreso mensual * multiplicador de nivel.
 * Semáforo:
 * - < 60%: Normal (Verde)
 * - 60% a < 90%: Alerta (Ámbar)
 * - >= 90%: Crítico (Rojo)
 *
 * @param {Object} usuario - Objeto usuario.
 * @returns {Object} Resumen presupuestario con semáforo y fondos disponibles.
 */
function calcularEstadoPresupuestoUsuario(usuario) {
    var limite = usuario.limiteGasto;
    // Si no está fijado explícitamente, se calcula por perfil
    if (limite === undefined || limite === null) {
        if (usuario.perfil === 'Empresa' || usuario.perfil === 'Constructor') {
            var mult = MULTIPLICADORES_NIVEL[usuario.nivel] || 1.5;
            limite = (usuario.ingresoMensual || 0) * mult;
        } else {
            limite = usuario.presupuestoMensual || 0;
        }
    }

    var gastado = Number(usuario.gastado) || 0;
    var comprometido = Number(usuario.comprometido) || 0;
    var totalComprometidoYGastado = gastado + comprometido;
    var saldoDisponible = limite - totalComprometidoYGastado;

    var porcentajeUso = limite > 0 ? (totalComprometidoYGastado / limite) * 100 : 0;

    var semaforo = 'normal';
    var colorSemaforo = 'verde';
    var textoSemaforo = 'Presupuesto Saludable';

    if (porcentajeUso >= 90) {
        semaforo = 'critico';
        colorSemaforo = 'rojo';
        textoSemaforo = 'Nivel Crítico de Consumo';
    } else if (porcentajeUso >= 60) {
        semaforo = 'alerta';
        colorSemaforo = 'ambar';
        textoSemaforo = 'Alerta de Presupuesto';
    }

    return {
        usuarioId: usuario.id,
        nombre: usuario.nombre,
        perfil: usuario.perfil,
        limite: limite,
        gastado: gastado,
        comprometido: comprometido,
        saldoDisponible: saldoDisponible,
        porcentajeUso: Math.min(100, Math.max(0, porcentajeUso)),
        semaforo: semaforo,
        colorSemaforo: colorSemaforo,
        textoSemaforo: textoSemaforo
    };
}

/**
 * Evalúa y procesa la aprobación de una cotización por parte de la Gobernación.
 * Regla de aprobación:
 * Verifica que Total Cotización <= (Límite - Gastado - Comprometido).
 * Si alcanza: suma a 'comprometido' y pasa a APROBADA.
 * Si no alcanza: RECHAZA la aprobación y calcula el déficit.
 *
 * @param {Object} cotizacion - Cotización a evaluar.
 * @param {Object} usuarioSolicitante - Usuario dueño de la cotización.
 * @returns {Object} Resultado de la evaluación.
 */
function evaluarAprobacionCotizacion(cotizacion, usuarioSolicitante) {
    var estadoPto = calcularEstadoPresupuestoUsuario(usuarioSolicitante);
    var montoRequerido = cotizacion.total;

    if (montoRequerido <= estadoPto.saldoDisponible) {
        return {
            aprobable: true,
            saldoDisponibleActual: estadoPto.saldoDisponible,
            nuevoSaldoEstimado: estadoPto.saldoDisponible - montoRequerido,
            nuevoComprometidoEstimado: estadoPto.comprometido + montoRequerido
        };
    } else {
        var faltante = montoRequerido - estadoPto.saldoDisponible;
        return {
            aprobable: false,
            saldoDisponibleActual: estadoPto.saldoDisponible,
            montoRequerido: montoRequerido,
            faltante: faltante,
            motivo: 'Fondos insuficientes. El monto requerido ($' + formatearMoneda(montoRequerido) +
                    ') supera el saldo disponible del usuario ($' + formatearMoneda(estadoPto.saldoDisponible) +
                    '). Déficit presupuestario: $' + formatearMoneda(faltante) + '.'
        };
    }
}

// ============================================================
// 6. MÓDULO 4: REGLAS DEL CATÁLOGO EDITABLE (GOBERNACIÓN)
// ============================================================

/**
 * Valida la creación o actualización de un material en el catálogo.
 * Reglas:
 * - Precio base > 0
 * - Nombre no repetido (distinto a sí mismo si se está editando)
 * - Sector válido
 * @param {Object} material - Objeto material a validar.
 * @param {Array<Object>} catalogoActual - Catálogo de materiales existentes.
 * @param {number} [idIgnorar] - ID del material que se está editando (opcional).
 * @returns {Object} { valido: boolean, error?: string }
 */
function validarMaterialCatalogo(material, catalogoActual, idIgnorar) {
    if (!material.nombre || material.nombre.trim().length < 3) {
        return { valido: false, error: 'El nombre del material debe tener al menos 3 caracteres.' };
    }

    var precio = Number(material.precioBase);
    if (isNaN(precio) || precio <= 0) {
        return { valido: false, error: 'El precio base debe ser un número mayor a cero.' };
    }

    if (!material.unidad || material.unidad.trim() === '') {
        return { valido: false, error: 'Debe especificar la unidad de medida.' };
    }

    // Verificar nombre único
    var nombreNormalizado = material.nombre.trim().toLowerCase();
    for (var i = 0; i < catalogoActual.length; i++) {
        var m = catalogoActual[i];
        if (idIgnorar && m.id === idIgnorar) {
            continue;
        }
        if (m.nombre.trim().toLowerCase() === nombreNormalizado) {
            return { valido: false, error: 'Ya existe un material registrado con el nombre "' + material.nombre + '".' };
        }
    }

    return { valido: true };
}

// ============================================================
// 7. MÓDULO 9: SUPERVISIÓN Y RANKINGS (ALGORITMO BURBUJA)
// ============================================================

/**
 * Genera el ranking de usuarios por monto aprobado de mayor a menor,
 * utilizando el algoritmo de ordenamiento burbuja escrito a mano.
 *
 * @param {Array<Object>} usuarios - Lista de usuarios.
 * @param {Array<Object>} cotizaciones - Todas las cotizaciones registradas.
 * @returns {Array<Object>} Lista de usuarios ordenada descendentemente por monto aprobado.
 */
function calcularRankingSupervision(usuarios, cotizaciones) {
    var resumenUsuarios = [];

    for (var i = 0; i < usuarios.length; i++) {
        var u = usuarios[i];
        var totalAprobado = 0;
        var totalEntregado = 0;
        var cantCotizaciones = 0;

        for (var j = 0; j < cotizaciones.length; j++) {
            var c = cotizaciones[j];
            if (c.usuarioId === u.id) {
                cantCotizaciones++;
                if (c.estado === 'APROBADA' || c.estado === 'ENTREGADA') {
                    totalAprobado += c.total;
                }
                if (c.estado === 'ENTREGADA') {
                    totalEntregado += c.total;
                }
            }
        }

        resumenUsuarios.push({
            id: u.id,
            nombre: u.nombre,
            perfil: u.perfil,
            estado: u.estado,
            cantCotizaciones: cantCotizaciones,
            montoAprobado: totalAprobado,
            montoEntregado: totalEntregado,
            comprometido: u.comprometido || 0,
            gastado: u.gastado || 0,
            limiteGasto: u.limiteGasto || 0
        });
    }

    // Ordenamiento descendente por montoAprobado con burbuja
    return ordenarBurbuja(resumenUsuarios, 'montoAprobado', false);
}

/**
 * Consolida los totales de inversión aprobada por perfil y por estado geográfico.
 * @param {Array<Object>} cotizaciones - Colección de cotizaciones.
 * @returns {Object} { porPerfil: Object, porEstado: Object, porSector: Object }
 */
function calcularTotalesSupervision(cotizaciones) {
    var porPerfil = { 'Alcaldía': 0, 'Empresa': 0, 'Constructor': 0, 'Gobernación': 0 };
    var porEstado = {};
    var porSector = { 'Construcción': 0, 'Energía': 0, 'Agua': 0, 'Vialidad': 0, 'Acabados': 0, 'Equipos': 0 };

    for (var i = 0; i < cotizaciones.length; i++) {
        var c = cotizaciones[i];
        // Solo contabilizamos cotizaciones vigentes (APROBADA o ENTREGADA)
        if (c.estado === 'APROBADA' || c.estado === 'ENTREGADA') {
            if (porPerfil[c.perfil] !== undefined) {
                porPerfil[c.perfil] += c.total;
            } else {
                porPerfil[c.perfil] = c.total;
            }

            if (!porEstado[c.estadoObra]) {
                porEstado[c.estadoObra] = 0;
            }
            porEstado[c.estadoObra] += c.total;

            // Desglose por sector
            if (Array.isArray(c.items)) {
                for (var k = 0; k < c.items.length; k++) {
                    var itm = c.items[k];
                    var sec = itm.sector || 'Construcción';
                    if (porSector[sec] === undefined) {
                        porSector[sec] = 0;
                    }
                    porSector[sec] += (Number(itm.total) || (Number(itm.cantidad) * Number(itm.precioUnitario)) || 0);
                }
            }
        }
    }

    return {
        porPerfil: porPerfil,
        porEstado: porEstado,
        porSector: porSector
    };
}

// ============================================================
// 8. MÓDULO 10: GENERACIÓN DE ENLACE WHATSAPP
// ============================================================

/**
 * Genera el enlace oficial de WhatsApp Web/App (wa.me) con el resumen formal.
 * @param {Object} cotizacion - Cotización a compartir.
 * @returns {string} URL formateada con mensaje predeterminado codificado.
 */
function generarEnlaceWhatsApp(cotizacion) {
    var mensaje = '🏗️ *SICOP-VE | Resumen de Cotización*\n\n' +
        '📄 *N° Documento:* ' + cotizacion.correlativo + '\n' +
        '👤 *Cliente:* ' + cotizacion.nombreCliente + ' (' + cotizacion.perfil + ')\n' +
        '📍 *Destino:* ' + cotizacion.estadoObra + '\n' +
        '🛒 *Ciudad de Compra:* ' + cotizacion.ciudadCompra + '\n' +
        '📅 *Emisión:* ' + cotizacion.fechaCreacion + '\n' +
        '⏳ *Vigencia:* ' + cotizacion.validezDias + ' días calendario\n' +
        '📌 *Estado Actual:* ' + cotizacion.estado + '\n\n' +
        '💰 *TOTAL USD:* $' + formatearMoneda(cotizacion.total) + '\n' +
        '🇻🇪 *TOTAL BS:* Bs. ' + formatearMoneda(cotizacion.totalBs) + ' (Tasa: ' + cotizacion.tasaBCV + ')\n\n' +
        '_Emitido por SICOP-VE: Sistema de Control Presupuestario para Obras en Venezuela._';

    return 'https://wa.me/?text=' + encodeURIComponent(mensaje);
}

// ============================================================
// 9. MÓDULO 11: EXPORTACIÓN A CSV Y VALIDACIÓN DE IMPORTACIÓN
// ============================================================

/**
 * Transforma la lista de cotizaciones en una cadena con formato CSV (valores separados por coma).
 * @param {Array<Object>} cotizaciones - Arreglo de cotizaciones.
 * @returns {string} Contenido CSV con encabezados.
 */
/**
 * Sanitiza un valor para su inclusión segura en celdas CSV.
 * - Neutraliza inyecciones de fórmulas en Excel (=, +, -, @).
 * - Escapa comillas dobles internas.
 * - Envuelve el contenido en comillas dobles.
 * @param {*} val - Valor a sanitizar.
 * @returns {string} Celda formateada.
 */
function sanitizarCeldaCSV(val) {
    if (val === null || val === undefined) return '""';
    var str = String(val);
    // Neutralizar inyección de fórmulas si el valor inicia con =, +, -, o @
    if (/^[=+\-@]/.test(str)) {
        str = "'" + str;
    }
    str = str.replace(/"/g, '""');
    return '"' + str + '"';
}

/**
 * Transforma la lista de cotizaciones en una cadena con formato CSV compatible con Excel en español.
 * Cumple con:
 * - Separador punto y coma (;).
 * - Marca de orden de bytes UTF-8 (BOM \uFEFF) al inicio.
 * - Comillas dobles escapadas y neutralización de inyección de fórmulas.
 * @param {Array<Object>} cotizaciones - Arreglo de cotizaciones.
 * @returns {string} Contenido CSV completo con BOM.
 */
function exportarCotizacionesACSV(cotizaciones) {
    var cots = cotizaciones || [];
    var encabezados = [
        'Correlativo',
        'Fecha',
        'Cliente',
        'Perfil',
        'Estado_Obra',
        'Ciudad_Compra',
        'Estado',
        'Subtotal_USD',
        'Flete_USD',
        'Descuento_USD',
        'IVA_USD',
        'Total_USD',
        'Tasa_BCV',
        'Total_Bs'
    ];

    var filas = [];
    var filaEncabezados = [];
    for (var h = 0; h < encabezados.length; h++) {
        filaEncabezados.push(sanitizarCeldaCSV(encabezados[h]));
    }
    filas.push(filaEncabezados.join(';'));

    for (var i = 0; i < cots.length; i++) {
        var c = cots[i];
        var subtotal = Number(c.subtotal || 0).toFixed(2);
        var flete = Number(c.flete || 0).toFixed(2);
        var descuento = Number(c.descuento || 0).toFixed(2);
        var iva = Number(c.iva || 0).toFixed(2);
        var total = Number(c.total || c.totalUSD || 0).toFixed(2);
        var tasa = Number(c.tasaBCV || 0).toFixed(2);
        var totalBs = Number(c.totalBs || 0).toFixed(2);

        var fila = [
            sanitizarCeldaCSV(c.correlativo || ''),
            sanitizarCeldaCSV(c.fechaCreacion || ''),
            sanitizarCeldaCSV(c.nombreCliente || ''),
            sanitizarCeldaCSV(c.perfil || ''),
            sanitizarCeldaCSV(c.estadoObra || ''),
            sanitizarCeldaCSV(c.ciudadCompra || ''),
            sanitizarCeldaCSV(c.estado || ''),
            sanitizarCeldaCSV(subtotal),
            sanitizarCeldaCSV(flete),
            sanitizarCeldaCSV(descuento),
            sanitizarCeldaCSV(iva),
            sanitizarCeldaCSV(total),
            sanitizarCeldaCSV(tasa),
            sanitizarCeldaCSV(totalBs)
        ];
        filas.push(fila.join(';'));
    }

    // BOM UTF-8 (\uFEFF) al inicio
    return '\uFEFF' + filas.join('\r\n');
}

/**
 * Valida la integridad de un archivo de respaldo JSON antes de restaurar datos.
 * @param {string} contenidoJSON - Texto del archivo JSON cargado.
 * @returns {Object} { valido: boolean, error?: string, datos?: Object }
 */
function validarRespaldoJSON(contenidoJSON) {
    try {
        var datos = JSON.parse(contenidoJSON);
        if (!datos || typeof datos !== 'object') {
            return { valido: false, error: 'El archivo JSON no tiene estructura válida.' };
        }
        if (!Array.isArray(datos.usuarios) || datos.usuarios.length === 0) {
            return { valido: false, error: 'El respaldo no contiene usuarios válidos.' };
        }
        if (!Array.isArray(datos.materiales) || datos.materiales.length === 0) {
            return { valido: false, error: 'El respaldo no contiene materiales válidos.' };
        }
        if (!Array.isArray(datos.cotizaciones)) {
            return { valido: false, error: 'El respaldo no contiene cotizaciones.' };
        }
        var u = datos.usuarios[0];
        if (!u.id || !u.usuario || !u.nombre || !u.perfil) {
            return { valido: false, error: 'Los usuarios no tienen estructura (id, usuario, nombre, perfil).' };
        }
        var m = datos.materiales[0];
        if (!m.id || !m.nombre || typeof m.precioBase !== 'number') {
            return { valido: false, error: 'Los materiales no tienen estructura (id, nombre, precioBase).' };
        }
        for (var i = 0; i < datos.cotizaciones.length; i++) {
            var c = datos.cotizaciones[i];
            if (!c.id || !c.correlativo || !c.estado || typeof c.total !== 'number') {
                return { valido: false, error: 'Cotización #' + (i + 1) + ' incompleta.' };
            }
        }
        return { valido: true, datos: datos };
    } catch (e) {
        return { valido: false, error: 'Error al interpretar JSON: ' + e.message };
    }
}

// ============================================================
// 10. MÓDULO 12: DETECCIÓN DE ALERTAS TEMPRANAS
// ============================================================

/**
 * Identifica alertas críticas en el sistema:
 * 1. Usuarios con más del 90% de su límite presupuestario consumido.
 * 2. Cotizaciones en estado 'ENVIADA' con más de 5 días hábiles esperando revisión.
 *
 * @param {Array<Object>} usuarios - Lista de usuarios.
 * @param {Array<Object>} cotizaciones - Lista de cotizaciones.
 * @returns {Array<Object>} Lista de alertas detectadas.
 */
function detectarAlertasSistema(usuarios, cotizaciones) {
    var alertas = [];

    // Alerta de usuarios con sobregiro o límite crítico
    for (var i = 0; i < usuarios.length; i++) {
        var u = usuarios[i];
        var st = calcularEstadoPresupuestoUsuario(u);
        if (st.porcentajeUso >= 90) {
            alertas.push({
                tipo: 'PRESUPUESTO_CRITICO',
                nivel: 'critico',
                titulo: 'Presupuesto Crítico: ' + u.nombre,
                mensaje: 'Ha consumido el ' + st.porcentajeUso.toFixed(1) + '% de su límite ($' +
                         formatearMoneda(st.gastado + st.comprometido) + ' de $' + formatearMoneda(st.limite) + ').',
                usuario: u,
                fecha: obtenerFechaActual()
            });
        }
    }

    // Alerta de cotizaciones pendientes por más de 5 días
    for (var j = 0; j < cotizaciones.length; j++) {
        var c = cotizaciones[j];
        if (c.estado === 'ENVIADA') {
            var dias = calcularDiasTranscurridos(c.fechaCreacion, c.fechaISO);
            if (dias >= 5) {
                alertas.push({
                    tipo: 'COTIZACION_DEMORADA',
                    nivel: 'alerta',
                    titulo: 'Revisión Pendiente: ' + c.correlativo,
                    mensaje: 'La cotización de ' + c.nombreCliente + ' lleva ' + dias + ' días esperando aprobación.',
                    fecha: c.fechaCreacion
                });
            }
        }
    }

    return alertas;
}

// ============================================================
// 11. DESGLOSE PEDAGÓGICO DE CÁLCULO DOCENTE
// ============================================================

/**
 * Desglosa la explicación matemática paso a paso de una cotización para fines docentes.
 * Muestra las fórmulas con los números reales aplicados en cada renglón.
 * @param {Object} cotizacion - Cotización completa con todos sus campos calculados.
 * @returns {Array<Object>} Lista de pasos pedagógicos con fórmulas y valores reales.
 */
function desglosarPasosCalculoPedagogico(cotizacion) {
    var p = [];

    // Paso 1: Subtotal
    p.push({
        paso: 1,
        titulo: 'Subtotal con Factor de Ciudad Proveedora',
        formula: 'Subtotal = Σ (Cantidad × Precio Base × Factor Ciudad)',
        detalle: 'Comprado en ' + cotizacion.ciudadCompra + ' con factor regional de ' + cotizacion.factorCiudad.toFixed(2) + '.',
        resultado: '$' + formatearMoneda(cotizacion.subtotal)
    });

    // Paso 2: Flete
    var fletePct = ((cotizacion.factorFlete - 1) * 100).toFixed(0);
    p.push({
        paso: 2,
        titulo: 'Flete Terrestre hacia Estado ' + cotizacion.estadoObra,
        formula: 'Flete = Subtotal × (Factor Flete - 1.00) = $' + formatearMoneda(cotizacion.subtotal) + ' × (' + cotizacion.factorFlete.toFixed(2) + ' - 1.00)',
        detalle: 'Recargo logístico por destino (' + cotizacion.estadoObra + '): ' + fletePct + '%.',
        resultado: '$' + formatearMoneda(cotizacion.flete)
    });

    // Paso 3: Descuento
    var descPct = (cotizacion.descuentoPct * 100).toFixed(0);
    p.push({
        paso: 3,
        titulo: 'Descuento Institucional (' + cotizacion.perfil + ')',
        formula: 'Descuento = (Subtotal + Flete) × ' + descPct + '% = ($' + formatearMoneda(cotizacion.subtotal) + ' + $' + formatearMoneda(cotizacion.flete) + ') × ' + cotizacion.descuentoPct,
        detalle: 'Beneficio fiscal institucional según el perfil (' + cotizacion.perfil + '): ' + descPct + '%.',
        resultado: '-$' + formatearMoneda(cotizacion.descuento)
    });

    // Paso 4: Monto Neto
    p.push({
        paso: 4,
        titulo: 'Monto Neto Imponible',
        formula: 'Neto = (Subtotal + Flete) - Descuento',
        detalle: 'Monto base de operación antes de imprevistos e impuestos.',
        resultado: '$' + formatearMoneda(cotizacion.neto)
    });

    // Paso 5: Contingencia
    p.push({
        paso: 5,
        titulo: 'Margen de Contingencia Técnica (5%)',
        formula: 'Contingencia = Neto × 5% = $' + formatearMoneda(cotizacion.neto) + ' × 0.05',
        detalle: 'Reserva legal técnica para variaciones y fluctuaciones de obra en Venezuela.',
        resultado: '$' + formatearMoneda(cotizacion.contingencia)
    });

    // Paso 6: IVA
    p.push({
        paso: 6,
        titulo: 'I.V.A. Ley Tributaria (16%)',
        formula: 'IVA = (Neto + Contingencia) × 16% = ($' + formatearMoneda(cotizacion.neto) + ' + $' + formatearMoneda(cotizacion.contingencia) + ') × 0.16',
        detalle: 'Alícuota general vigente del Impuesto al Valor Agregado.',
        resultado: '$' + formatearMoneda(cotizacion.iva)
    });

    // Paso 7: Total Final y Conversión
    p.push({
        paso: 7,
        titulo: 'Total General en Divisas y Bolívares',
        formula: 'Total USD = Neto + Contingencia + IVA | Total Bs. = Total USD × Tasa BCV',
        detalle: 'Tasa oficial referencial aplicada: ' + cotizacion.tasaBCV.toFixed(2) + ' Bs./USD.',
        resultado: '$' + formatearMoneda(cotizacion.total) + ' USD  =  Bs. ' + formatearMoneda(cotizacion.totalBs)
    });

    return p;
}

/**
 * Sanitiza texto para prevenir inyecciones XSS en el DOM.
 * @param {*} str - Texto a escapar.
 * @returns {string} Texto seguro para HTML.
 */
function escaparHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Calcula la fecha exacta de vencimiento a partir de la fecha de emisión y los días de vigencia calendario.
 * @param {string} fechaTexto - Fecha de emisión 'DD/MM/AAAA HH:MM'.
 * @param {number} [diasVigencia=15] - Días calendario de validez.
 * @returns {string} Fecha de vencimiento 'DD/MM/AAAA'.
 */
function calcularFechaVencimiento(fechaTexto, diasVigencia) {
    var dias = diasVigencia || (typeof DIAS_VIGENCIA_COTIZACION !== 'undefined' ? DIAS_VIGENCIA_COTIZACION : 15);
    if (!fechaTexto || typeof fechaTexto !== 'string') return '';
    var partes = fechaTexto.split(' ')[0].split('/');
    if (partes.length < 3) return '';
    var d = parseInt(partes[0], 10);
    var m = parseInt(partes[1], 10) - 1;
    var y = parseInt(partes[2], 10);
    var f = new Date(y, m, d + dias);
    var diaStr = f.getDate() < 10 ? '0' + f.getDate() : String(f.getDate());
    var mesStr = (f.getMonth() + 1) < 10 ? '0' + (f.getMonth() + 1) : String(f.getMonth() + 1);
    return diaStr + '/' + mesStr + '/' + f.getFullYear();
}

/** Alias para cumplir con la firma requerida escaparHTML */
function escaparHTML(str) {
    return escaparHtml(str);
}

// ============================================================
// 12. MÁQUINA DE ESTADOS Y CONTROL DE TRANSICIONES
// ============================================================

/**
 * Matriz estricta de transiciones válidas del ciclo de vida de una cotización.
 * Reglas de negocio:
 * - BORRADOR  -> ENVIADA o CANCELADA
 * - ENVIADA   -> APROBADA, RECHAZADA o CANCELADA
 * - APROBADA  -> ENTREGADA (o CANCELADA por revocación antes de despacho)
 * - RECHAZADA, ENTREGADA y CANCELADA son estados terminales e inmutables.
 */
var TRANSICIONES_VALIDAS = {
    'BORRADOR':  ['ENVIADA', 'CANCELADA'],
    'ENVIADA':   ['APROBADA', 'RECHAZADA', 'CANCELADA'],
    'APROBADA':  ['ENTREGADA'],
    'RECHAZADA': [],
    'ENTREGADA': [],
    'CANCELADA': []
};

/**
 * Función centralizada para ejecutar transiciones de estado en cotizaciones con guardas completas.
 * @param {number|string} cotizacionId - ID de la cotización a modificar.
 * @param {string} nuevoEstado - Estado destino solicitado.
 * @param {Object} usuarioOperador - Usuario que ejecuta la acción.
 * @param {Object} [opciones] - Opciones adicionales (ej. motivoRechazo).
 * @returns {Object} { ok: boolean, error?: string, cotizacion?: Object }
 */
function cambiarEstadoCotizacion(cotizacionId, nuevoEstado, usuarioOperador, opciones) {
    if (!usuarioOperador) {
        return { ok: false, error: 'Se requiere una sesión de usuario válida para cambiar el estado.' };
    }

    var cotizaciones = typeof obtenerCotizaciones === 'function' ? obtenerCotizaciones() : [];
    var cot = null;
    var cotIndex = -1;
    for (var i = 0; i < cotizaciones.length; i++) {
        if (String(cotizaciones[i].id) === String(cotizacionId)) {
            cot = cotizaciones[i];
            cotIndex = i;
            break;
        }
    }

    if (!cot) {
        return { ok: false, error: 'Cotización con ID ' + cotizacionId + ' no encontrada.' };
    }

    var estadoActual = cot.estado;
    var permitidas = TRANSICIONES_VALIDAS[estadoActual] || [];
    if (permitidas.indexOf(nuevoEstado) === -1) {
        return {
            ok: false,
            error: 'Transición no permitida: no se puede pasar una cotización de ' + estadoActual + ' a ' + nuevoEstado + '.'
        };
    }

    var rolOperador = usuarioOperador.perfil || usuarioOperador.rol || '';
    var rolNorm = String(rolOperador).toLowerCase()
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
        .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n');
    var esGobernacion = (rolNorm.indexOf('gobernacion') !== -1);

    // Solo Gobernación puede APROBAR, RECHAZAR o marcar ENTREGADA
    if (nuevoEstado === 'APROBADA' || nuevoEstado === 'RECHAZADA' || nuevoEstado === 'ENTREGADA') {
        if (!esGobernacion) {
            return {
                ok: false,
                error: 'Acción denegada: solo usuarios con rol de Gobernación pueden aprobar, rechazar o entregar cotizaciones.'
            };
        }
    }

    // Bloqueo estricto de autoaprobación
    if (nuevoEstado === 'APROBADA' && cot.usuarioId === usuarioOperador.id) {
        return {
            ok: false,
            error: 'Autoaprobación bloqueada: un funcionario de Gobernación no puede aprobar sus propias cotizaciones. Debe hacerlo otro funcionario supervisor.'
        };
    }

    // Cancelación: Solicitante o Gobernación
    if (nuevoEstado === 'CANCELADA') {
        if (!esGobernacion && cot.usuarioId !== usuarioOperador.id) {
            return {
                ok: false,
                error: 'Acción denegada: solo el solicitante o Gobernación pueden cancelar esta cotización.'
            };
        }
    }

    // Validación de vigencia y mora para aprobación
    if (nuevoEstado === 'APROBADA') {
        if (typeof obtenerFinanciamientos === 'function' && typeof evaluarMoraUsuario === 'function') {
            var listaFins = obtenerFinanciamientos();
            var moraSol = evaluarMoraUsuario(cot.usuarioId, listaFins);
            if (moraSol.tieneMora) {
                return {
                    ok: false,
                    error: 'Aprobación bloqueada: El solicitante posee ' + moraSol.cuotasEnMora + ' cuota(s) en mora activa por USD ' + formatearMoneda(moraSol.totalMoraUSD) + '. Debe regularizar sus compromisos financieros previos.'
                };
            }
        }
        var dias = calcularDiasTranscurridos(cot.fechaCreacion, cot.fechaISO);
        var vigencia = cot.validezDias || (typeof DIAS_VIGENCIA_COTIZACION !== 'undefined' ? DIAS_VIGENCIA_COTIZACION : 15);
        if (dias > vigencia) {
            return {
                ok: false,
                error: 'La cotización ' + cot.correlativo + ' está vencida (' + dias + ' días calendario transcurridos de un máximo de ' + vigencia + '). Debe duplicarse desde el historial para emitir una nueva versión con precios actualizados.'
            };
        }
    }

    if (nuevoEstado === 'ENTREGADA') {
        if (typeof obtenerFinanciamientoPorCotizacion === 'function') {
            var fPlan = obtenerFinanciamientoPorCotizacion(cot.id);
            if (fPlan && fPlan.estado === 'EN_MORA') {
                return {
                    ok: false,
                    error: 'Entrega de obra bloqueada: El plan de financiamiento presenta cuotas vencidas en mora activa.'
                };
            }
        }
    }

    // Obtener usuarios para control presupuestario
    var usuarios = typeof obtenerUsuarios === 'function' ? obtenerUsuarios() : [];
    var solicitante = null;
    for (var u = 0; u < usuarios.length; u++) {
        if (usuarios[u].id === cot.usuarioId) {
            solicitante = usuarios[u];
            break;
        }
    }

    var totalCotUSD = Number(cot.totalUSD || cot.total || 0);

    if (nuevoEstado === 'APROBADA') {
        if (solicitante) {
            var saldoDisponible = (Number(solicitante.limiteGasto) || 0) - ((Number(solicitante.gastado) || 0) + (Number(solicitante.comprometido) || 0));
            if (totalCotUSD > saldoDisponible) {
                return {
                    ok: false,
                    error: 'Saldo presupuestario insuficiente: el monto de $' + formatearMoneda(totalCotUSD) + ' USD excede el saldo disponible del solicitante ($' + formatearMoneda(saldoDisponible) + ' USD).'
                };
            }
        }
    }

    // Aplicar nuevo estado y metadatos
    cot.estado = nuevoEstado;

    if (nuevoEstado === 'APROBADA') {
        cot.aprobadoPor = usuarioOperador ? usuarioOperador.nombre : 'Gobernación';
        cot.fechaAprobacionISO = new Date().toISOString();
        var tipoPlanElegido = (opciones && (opciones.tipoPlan || opciones.planFinanciamientoId)) || cot.tipoPlanFinanciamiento || 'cashea_3';
        cot.tipoPlanFinanciamiento = tipoPlanElegido;
        if (typeof generarPlanFinanciamiento === 'function' && typeof obtenerFinanciamientos === 'function' && typeof guardarFinanciamientos === 'function') {
            var planExiste = (typeof obtenerFinanciamientoPorCotizacion === 'function') ? obtenerFinanciamientoPorCotizacion(cot.id) : null;
            if (!planExiste) {
                var nuevoPlan = generarPlanFinanciamiento(cot, tipoPlanElegido);
                if (nuevoPlan) {
                    var todosFins = obtenerFinanciamientos();
                    todosFins.push(nuevoPlan);
                    guardarFinanciamientos(todosFins);
                }
            }
        }
    }

    if (nuevoEstado === 'RECHAZADA') {
        var mot = (opciones && (opciones.motivoRechazo || opciones.motivo)) || cot.motivoRechazo || '';
        mot = String(mot).trim();
        if (mot.length < 10) {
            return {
                ok: false,
                error: 'El motivo de rechazo debe contener al menos 10 caracteres explicativos.'
            };
        }
        cot.motivoRechazo = mot;
        cot.rechazadoPor = usuarioOperador ? usuarioOperador.nombre : 'Gobernación';
        cot.fechaRechazoISO = new Date().toISOString();
    }

    if (nuevoEstado === 'ENTREGADA') {
        cot.entregadoPor = usuarioOperador ? usuarioOperador.nombre : 'Gobernación';
        cot.fechaEntregaISO = new Date().toISOString();
    }

    // Persistir cotizaciones
    cotizaciones[cotIndex] = cot;
    if (typeof guardarCotizaciones === 'function') {
        guardarCotizaciones(cotizaciones);
    }

    // Recalcular saldos de forma derivada e inmutable
    if (typeof recalcularSaldosUsuarios === 'function') {
        usuarios = recalcularSaldosUsuarios(usuarios, cotizaciones);
        if (typeof guardarUsuarios === 'function') {
            guardarUsuarios(usuarios);
        }
    }

    // Registrar en bitácora institucional
    if (typeof registrarEnBitacora === 'function') {
        var detalleAccion = 'Cambio de estado de ' + cot.correlativo + ' de ' + estadoActual + ' a ' + nuevoEstado;
        if (nuevoEstado === 'RECHAZADA') {
            detalleAccion += '. Motivo: ' + cot.motivoRechazo;
        } else if (nuevoEstado === 'APROBADA') {
            detalleAccion += ' por USD ' + formatearMoneda(totalCotUSD);
        } else if (nuevoEstado === 'ENTREGADA') {
            detalleAccion += '. Fondos transferidos definitivamente a gastado.';
        }
        registrarEnBitacora(usuarioOperador.nombre, 'COTIZACION_' + nuevoEstado, detalleAccion);
    }

    return { ok: true, cotizacion: cot };
}

/**
 * Genera una firma digital criptográfica pedagógica determinista (hash hexadecimal de 32 caracteres)
 * para garantizar la no-repudiación y verificación de integridad documental de una cotización.
 * @param {Object} cotizacion - Objeto de cotización a firmar.
 * @returns {string} Cadena hexadecimal con prefijo institucional SICOP-VE.
 */
function generarFirmaDigital(cotizacion) {
    if (!cotizacion) return 'SICOP-0000000000000000';
    var semilla = [
        cotizacion.correlativo || 'COT-0000',
        cotizacion.nombreObra || '',
        cotizacion.totalUSD !== undefined ? Number(cotizacion.totalUSD).toFixed(2) : '0.00',
        cotizacion.solicitante || cotizacion.nombreCliente || '',
        cotizacion.fechaISO || cotizacion.fechaCreacion || '',
        cotizacion.estado || 'BORRADOR'
    ].join('::');

    var h1 = 0x811c9dc5;
    var h2 = 0x5b358479;
    var h3 = 0x27d4eb2f;
    var h4 = 0x1a46e19d;

    for (var i = 0; i < semilla.length; i++) {
        var c = semilla.charCodeAt(i);
        h1 = ((h1 ^ c) * 16777619) >>> 0;
        h2 = ((h2 ^ ((c << 3) | (c >>> 5))) * 2246822519) >>> 0;
        h3 = ((h3 ^ ((c << 7) | (c >>> 1))) * 3266489917) >>> 0;
        h4 = ((h4 ^ (c + i * 31)) * 374761393) >>> 0;
    }

    function aHex8(n) {
        var s = (n >>> 0).toString(16).toUpperCase();
        while (s.length < 8) s = '0' + s;
        return s;
    }

    return 'SICOP-SIG-' + aHex8(h1) + aHex8(h2) + aHex8(h3) + aHex8(h4);
}

// ============================================================
// 17. SISTEMA INTEGRAL DE FINANCIAMIENTO EN CUOTAS (CASHEA)
// ============================================================

/**
 * Genera un plan de financiamiento detallado para una cotización.
 * @param {Object} cotizacion - Objeto de cotización con monto total.
 * @param {string} tipoPlan - Clave en PLANES_FINANCIAMIENTO (ej: 'cashea_3', 'quincenal_6').
 * @param {string} [fechaInicioISO] - Fecha base en formato ISO.
 * @returns {Object} Objeto completo de plan de financiamiento con cronograma de cuotas.
 */
function generarPlanFinanciamiento(cotizacion, tipoPlan, fechaInicioISO) {
    if (!cotizacion) return null;
    tipoPlan = (typeof PLANES_FINANCIAMIENTO !== 'undefined' && PLANES_FINANCIAMIENTO[tipoPlan]) ? tipoPlan : 'cashea_3';
    var planConfig = PLANES_FINANCIAMIENTO[tipoPlan];

    var montoTotal = cotizacion.totalUSD !== undefined ? Number(cotizacion.totalUSD) : (Number(cotizacion.total) || 0);
    var montoInicial = Math.round(montoTotal * planConfig.porcentajeInicial * 100) / 100;
    var saldoBase = Math.round((montoTotal - montoInicial) * 100) / 100;
    var recargoPct = planConfig.recargoPct || 0;
    var recargoUSD = Math.round(saldoBase * recargoPct * 100) / 100;
    var saldoFinanciado = Math.round((saldoBase + recargoUSD) * 100) / 100;

    var fechaBase = fechaInicioISO ? new Date(fechaInicioISO) : new Date();
    var cuotas = [];
    var montoCuota = 0;

    if (planConfig.numeroCuotas > 0) {
        var baseCuota = Math.floor((saldoFinanciado / planConfig.numeroCuotas) * 100) / 100;
        var sumaCuotas = 0;

        for (var i = 1; i <= planConfig.numeroCuotas; i++) {
            var vMonto = baseCuota;
            if (i === planConfig.numeroCuotas) {
                vMonto = Math.round((saldoFinanciado - sumaCuotas) * 100) / 100;
            } else {
                sumaCuotas = Math.round((sumaCuotas + vMonto) * 100) / 100;
            }

            var diasOffset = i * planConfig.frecuenciaDias;
            var fechaVenc = new Date(fechaBase.getTime() + (diasOffset * 24 * 60 * 60 * 1000));

            cuotas.push({
                numero: i,
                montoUSD: vMonto,
                fechaVencimientoISO: fechaVenc.toISOString(),
                fechaPagoISO: null,
                estado: 'PENDIENTE',
                referencia: null
            });
        }
        montoCuota = cuotas.length > 0 ? cuotas[0].montoUSD : 0;
    }

    var estadoInicial = (planConfig.numeroCuotas === 0) ? 'PAGADO' : 'ACTIVO';

    return {
        id: Date.now() + Math.floor(Math.random() * 1000),
        cotizacionId: cotizacion.id || null,
        correlativoCotizacion: cotizacion.correlativo || 'COT-0000',
        usuarioId: cotizacion.usuarioId || (typeof sesionUsuario !== 'undefined' && sesionUsuario ? sesionUsuario.id : null),
        nombreCliente: cotizacion.nombreCliente || (typeof sesionUsuario !== 'undefined' && sesionUsuario ? sesionUsuario.nombre : 'Solicitante'),
        perfil: cotizacion.perfil || (typeof sesionUsuario !== 'undefined' && sesionUsuario ? sesionUsuario.perfil : 'Empresa'),
        nombreObra: cotizacion.nombreObra || 'Obra Institucional',
        tipoPlan: tipoPlan,
        nombrePlan: planConfig.nombre,
        porcentajeInicial: planConfig.porcentajeInicial,
        montoTotalUSD: montoTotal,
        montoInicialUSD: montoInicial,
        montoInicial: montoInicial,
        saldoFinanciadoUSD: saldoFinanciado,
        saldoFinanciado: saldoFinanciado,
        totalFinanciado: (montoTotal + recargoUSD),
        totalPagado: (planConfig.numeroCuotas === 0 ? (montoTotal + recargoUSD) : 0),
        saldoPendiente: (planConfig.numeroCuotas === 0 ? 0 : saldoFinanciado),
        recargoPct: recargoPct,
        recargoUSD: recargoUSD,
        numeroCuotas: planConfig.numeroCuotas,
        montoCuotaUSD: montoCuota,
        fechaCreacionISO: fechaBase.toISOString(),
        estado: estadoInicial,
        cuotas: cuotas
    };
}

/**
 * Calcula los días de retraso de una fecha de vencimiento respecto a una fecha de referencia.
 * @param {string} fechaVencimientoISO - Fecha límite de pago en ISO.
 * @param {string} [fechaReferenciaISO] - Fecha de corte (por defecto hoy).
 * @returns {number} Días de atraso (0 si está al día o futura).
 */
function calcularDiasAtraso(fechaVencimientoISO, fechaReferenciaISO) {
    if (!fechaVencimientoISO) return 0;
    var fVenc = new Date(fechaVencimientoISO);
    var fRef = fechaReferenciaISO ? new Date(fechaReferenciaISO) : new Date();

    if (isNaN(fVenc.getTime()) || isNaN(fRef.getTime())) return 0;
    if (fRef.getTime() <= fVenc.getTime()) return 0;

    var diffMs = fRef.getTime() - fVenc.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calcula el monto por mora de una cuota en mora.
 * @param {Object} cuota - Objeto cuota.
 * @param {number} [tasaMoraDiaria=0.001] - Tasa de mora diaria (por defecto 0.1%).
 * @param {string} [fechaReferenciaISO] - Fecha de corte.
 * @returns {number} Monto de mora en USD.
 */
function calcularMoraCuota(cuota, tasaMoraDiaria, fechaReferenciaISO) {
    if (!cuota || cuota.estado === 'PAGADA') return 0;
    var tasa = (tasaMoraDiaria !== undefined && tasaMoraDiaria !== null) ? Number(tasaMoraDiaria) : 0.001;
    var dias = calcularDiasAtraso(cuota.fechaVencimientoISO, fechaReferenciaISO);
    if (dias <= 0) return 0;
    return Math.round((Number(cuota.montoUSD) * tasa * dias) * 100) / 100;
}

/**
 * Recalcula de forma pura el estado de un plan según sus cuotas y fechas de vencimiento.
 * @param {Object} plan - Objeto plan a evaluar.
 * @param {string} [fechaReferenciaISO] - Fecha de corte referencial.
 * @returns {Object} Objeto plan con estados actualizados.
 */
function recalcularEstadoPlan(plan, fechaReferenciaISO) {
    if (!plan || !plan.cuotas) return plan;
    var todasPagadas = true;
    var algunaVencida = false;
    var inicial = Number(plan.montoInicialUSD !== undefined ? plan.montoInicialUSD : plan.montoInicial) || 0;
    var totalPagado = inicial;
    var saldoPendiente = 0;
    var sumaTotalCuotas = 0;

    for (var i = 0; i < plan.cuotas.length; i++) {
        var c = plan.cuotas[i];
        var montoCuota = Number(c.montoUSD) || 0;
        sumaTotalCuotas += montoCuota;
        if (c.estado === 'PAGADA') {
            totalPagado += montoCuota;
            c.mora = 0;
            c.diasAtraso = 0;
        } else {
            todasPagadas = false;
            var dias = calcularDiasAtraso(c.fechaVencimientoISO, fechaReferenciaISO);
            if (dias > 0) {
                c.estado = 'VENCIDA';
                c.diasAtraso = dias;
                c.mora = calcularMoraCuota(c, 0.001, fechaReferenciaISO);
                algunaVencida = true;
            } else {
                c.estado = 'PENDIENTE';
                c.diasAtraso = 0;
                c.mora = 0;
            }
            saldoPendiente += (montoCuota + (c.mora || 0));
        }
    }

    if (plan.totalFinanciado === undefined) {
        plan.totalFinanciado = Math.round((inicial + sumaTotalCuotas) * 100) / 100;
    }

    plan.totalPagado = Math.round(totalPagado * 100) / 100;
    plan.saldoPendiente = Math.round(saldoPendiente * 100) / 100;

    if (plan.cuotas.length === 0 || todasPagadas) {
        plan.estado = 'PAGADO';
        plan.saldoPendiente = 0;
    } else if (algunaVencida) {
        plan.estado = 'EN_MORA';
    } else {
        plan.estado = 'ACTIVO';
    }

    return plan;
}

/**
 * Procesa el pago de una cuota individual de forma pura y controlada, registrando el movimiento en el libro mayor.
 * @param {Object} plan - Objeto de plan de financiamiento.
 * @param {number} numeroCuota - Número de la cuota a pagar (1, 2, ...).
 * @param {number} montoPagado - Monto abonado en USD.
 * @param {string} referenciaPago - Número o código de referencia de la transferencia.
 * @param {string} [fechaPagoISO] - Fecha del pago en ISO.
 * @param {string} [metodo] - Método de pago ('Transferencia', 'Pago Móvil', etc.).
 * @returns {Object} { ok: boolean, error?: string, plan?: Object, cuota?: Object }.
 */
function procesarPagoCuota(plan, numeroCuota, montoPagado, referenciaPago, fechaPagoISO, metodo) {
    if (!plan || !plan.cuotas) {
        return { ok: false, error: 'Plan de financiamiento inválido.' };
    }
    numeroCuota = Number(numeroCuota);
    var cuota = null;

    for (var i = 0; i < plan.cuotas.length; i++) {
        if (plan.cuotas[i].numero === numeroCuota) {
            cuota = plan.cuotas[i];
            break;
        }
    }

    if (!cuota) {
        return { ok: false, error: 'No se encontró la cuota número #' + numeroCuota + ' en este plan.' };
    }

    if (cuota.estado === 'PAGADA') {
        return { ok: false, error: 'La cuota #' + numeroCuota + ' ya se encuentra registrada como PAGADA.' };
    }

    var montoReq = Number(cuota.montoUSD);
    var montoIngresado = Number(montoPagado) || 0;

    if (montoIngresado < (montoReq - 0.01)) {
        return {
            ok: false,
            error: 'Monto insuficiente. La cuota requiere al menos USD ' + montoReq.toFixed(2) + ' (ingresó USD ' + montoIngresado.toFixed(2) + ').'
        };
    }

    var moraCuota = Number(cuota.mora) || 0;
    var capitalAmortizado = Math.min(montoIngresado, montoReq);

    cuota.estado = 'PAGADA';
    cuota.fechaPagoISO = fechaPagoISO || new Date().toISOString();
    cuota.referencia = referenciaPago ? String(referenciaPago).trim() : 'PAGO-DIRECTO';
    cuota.metodo = metodo || 'Transferencia';

    recalcularEstadoPlan(plan, cuota.fechaPagoISO);

    if (typeof registrarMovimiento === 'function') {
        registrarMovimiento({
            financiamientoId: plan.id,
            cotizacionId: plan.cotizacionId,
            correlativoCotizacion: plan.correlativoCotizacion,
            usuarioId: plan.usuarioId,
            cliente: plan.nombreCliente,
            tipo: 'CUOTA',
            cuotaNumero: numeroCuota,
            montoUSD: montoIngresado,
            montoAplicadoCapital: capitalAmortizado,
            montoAplicadoMora: moraCuota,
            referencia: cuota.referencia,
            metodo: cuota.metodo,
            fechaISO: cuota.fechaPagoISO,
            estado: 'CONFIRMADO'
        });
    }

    return { ok: true, plan: plan, cuota: cuota };
}

/**
 * Procesa el pago de la inicial de un financiamiento, activando el plan y registrando el movimiento.
 * @param {Object} plan - Objeto de plan de financiamiento.
 * @param {number} montoPagado - Monto abonado en USD para la inicial.
 * @param {string} referenciaPago - Referencia del pago.
 * @param {string} [fechaPagoISO] - Fecha del pago en ISO.
 * @param {string} [metodo] - Método de pago ('Transferencia', 'Pago Móvil', etc.).
 * @returns {Object} { ok: boolean, error?: string, plan?: Object }.
 */
function procesarPagoInicial(plan, montoPagado, referenciaPago, fechaPagoISO, metodo) {
    if (!plan) {
        return { ok: false, error: 'Plan de financiamiento inválido.' };
    }
    if (plan.pagoInicialConfirmado) {
        return { ok: false, error: 'La cuota inicial de este financiamiento ya se encuentra confirmada.' };
    }
    var montoReq = Number(plan.montoInicialUSD !== undefined ? plan.montoInicialUSD : plan.montoInicial) || 0;
    var montoIngresado = Number(montoPagado) || 0;

    if (montoIngresado < (montoReq - 0.01)) {
        return {
            ok: false,
            error: 'Monto insuficiente para la inicial. Requiere al menos USD ' + montoReq.toFixed(2) + ' (ingresó USD ' + montoIngresado.toFixed(2) + ').'
        };
    }

    plan.pagoInicialConfirmado = true;
    plan.pagoInicialReferencia = referenciaPago ? String(referenciaPago).trim() : 'INI-CONFIRMADA';
    plan.pagoInicialFechaISO = fechaPagoISO || new Date().toISOString();
    plan.metodoPagoInicial = metodo || 'Transferencia';

    if (typeof registrarMovimiento === 'function') {
        registrarMovimiento({
            financiamientoId: plan.id,
            cotizacionId: plan.cotizacionId,
            correlativoCotizacion: plan.correlativoCotizacion,
            usuarioId: plan.usuarioId,
            cliente: plan.nombreCliente,
            tipo: 'INICIAL',
            cuotaNumero: null,
            montoUSD: montoIngresado,
            montoAplicadoCapital: montoIngresado,
            montoAplicadoMora: 0.00,
            referencia: plan.pagoInicialReferencia,
            metodo: plan.metodoPagoInicial,
            fechaISO: plan.pagoInicialFechaISO,
            estado: 'CONFIRMADO'
        });
    }

    return { ok: true, plan: plan };
}

/**
 * Evalúa si un usuario tiene cuotas vencidas y financiamientos en estado de mora activa.
 * @param {number} usuarioId - ID del usuario.
 * @param {Array} financiamientos - Colección de financiamientos.
 * @param {string} [fechaReferenciaISO] - Fecha de corte.
 * @returns {Object} { tieneMora: boolean, cuotasEnMora: number, totalMoraUSD: number, planesEnMora: Array }.
 */
function evaluarMoraUsuario(usuarioId, financiamientosOpcional, fechaReferenciaOpcional) {
    var resultadoVacio = {
        bloqueado: false,
        tieneMora: false,
        moraTotal: 0,
        totalMoraUSD: 0,
        planesAtrasados: 0,
        cuotasEnMora: 0,
        planesEnMora: [],
        motivo: ''
    };
    if (!usuarioId) return resultadoVacio;

    var planes = [];
    if (financiamientosOpcional && Array.isArray(financiamientosOpcional)) {
        planes = financiamientosOpcional;
    } else if (typeof obtenerFinanciamientosPorUsuario === 'function') {
        try {
            planes = obtenerFinanciamientosPorUsuario(usuarioId);
        } catch (eGet) {
            return resultadoVacio;
        }
    } else if (typeof obtenerFinanciamientos === 'function') {
        try {
            planes = obtenerFinanciamientos();
        } catch (eGet2) {
            return resultadoVacio;
        }
    }
    if (!Array.isArray(planes) || planes.length === 0) return resultadoVacio;

    var moraTotal = 0;
    var planesAtrasados = 0;
    var cuotasEnMora = 0;
    var planesEnMora = [];
    var hoy = fechaReferenciaOpcional ? new Date(fechaReferenciaOpcional) : new Date();

    for (var i = 0; i < planes.length; i++) {
        var p = planes[i];
        if (!p || typeof p !== 'object') continue;
        if (Number(p.usuarioId) !== Number(usuarioId)) continue;
        if (p.estado === 'CANCELADO' || p.estado === 'PAGADO') continue;
        if (!Array.isArray(p.cuotas) || p.cuotas.length === 0) continue;

        var tieneVencida = false;
        var moraPlan = 0;
        for (var j = 0; j < p.cuotas.length; j++) {
            var c = p.cuotas[j];
            if (!c || c.estado === 'PAGADA') continue;
            try {
                var fVenc = c.fechaVencimientoISO || c.fechaVencimiento;
                var dias = calcularDiasAtraso(fVenc, hoy);
                if (dias > 0 || c.estado === 'VENCIDA') {
                    tieneVencida = true;
                    cuotasEnMora++;
                    var moraCuota = (typeof calcularMoraCuota === 'function') ?
                        calcularMoraCuota(c, 0.001, hoy) :
                        ((Number(c.montoUSD || c.monto) || 0) * 0.001 * Math.max(1, dias));
                    moraPlan += ((Number(c.montoUSD || c.monto) || 0) + moraCuota);
                }
            } catch (eDias) {}
        }
        if (tieneVencida || p.estado === 'EN_MORA') {
            planesAtrasados++;
            moraTotal += moraPlan;
            planesEnMora.push(p);
        }
    }

    if (planesAtrasados === 0 && cuotasEnMora === 0) return resultadoVacio;

    var moraRedondeada = Math.round(moraTotal * 100) / 100;
    var motivoTexto = 'Tiene ' + planesAtrasados + ' plan(es) con cuotas vencidas y mora acumulada de $' +
                      formatearMoneda(moraRedondeada) + ' USD. Regularice sus pagos en el módulo "Mis Cuotas".';

    return {
        bloqueado: true,
        tieneMora: true,
        moraTotal: moraRedondeada,
        totalMoraUSD: moraRedondeada,
        planesAtrasados: planesAtrasados,
        cuotasEnMora: cuotasEnMora,
        planesEnMora: planesEnMora,
        motivo: motivoTexto
    };
}

/**
 * Simula las cuotas y estructura de un plan de financiamiento sin guardar datos.
 * @param {number} montoTotal - Monto total a presupuestar.
 * @param {string} tipoPlan - Clave en PLANES_FINANCIAMIENTO.
 * @returns {Object} Desglose detallado de la simulación.
 */
function simularPlanFinanciamiento(montoTotal, tipoPlan) {
    montoTotal = Number(montoTotal) || 0;
    tipoPlan = (typeof PLANES_FINANCIAMIENTO !== 'undefined' && PLANES_FINANCIAMIENTO[tipoPlan]) ? tipoPlan : 'cashea_3';
    var planConfig = PLANES_FINANCIAMIENTO[tipoPlan];

    var montoInicial = Math.round(montoTotal * planConfig.porcentajeInicial * 100) / 100;
    var saldoBase = Math.round((montoTotal - montoInicial) * 100) / 100;
    var recargoPct = planConfig.recargoPct || 0;
    var recargoUSD = Math.round(saldoBase * recargoPct * 100) / 100;
    var saldoFinanciado = Math.round((saldoBase + recargoUSD) * 100) / 100;

    var cuotas = [];
    if (planConfig.numeroCuotas > 0) {
        var baseCuota = Math.floor((saldoFinanciado / planConfig.numeroCuotas) * 100) / 100;
        var sumaCuotas = 0;
        for (var i = 1; i <= planConfig.numeroCuotas; i++) {
            var vMonto = (i === planConfig.numeroCuotas) ? Math.round((saldoFinanciado - sumaCuotas) * 100) / 100 : baseCuota;
            sumaCuotas = Math.round((sumaCuotas + vMonto) * 100) / 100;
            cuotas.push({
                numero: i,
                montoUSD: vMonto,
                diasVencimiento: i * planConfig.frecuenciaDias
            });
        }
    }

    return {
        tipoPlan: tipoPlan,
        nombrePlan: planConfig.nombre,
        descripcion: planConfig.descripcion,
        montoTotalUSD: montoTotal,
        montoInicialUSD: montoInicial,
        montoInicial: montoInicial,
        saldoFinanciadoUSD: saldoFinanciado,
        saldoFinanciado: saldoFinanciado,
        recargoPct: recargoPct,
        recargoUSD: recargoUSD,
        numeroCuotas: planConfig.numeroCuotas,
        montoCuotaUSD: cuotas.length > 0 ? cuotas[0].montoUSD : 0,
        montoPorCuotaUSD: cuotas.length > 0 ? cuotas[0].montoUSD : 0,
        cuotas: cuotas
    };
}

/**
 * Obtiene todas las cuotas de financiamiento próximas a vencer en una ventana de días.
 * @param {Array} financiamientos - Colección de financiamientos.
 * @param {number} [diasVentana=7] - Días futuros de anticipación.
 * @param {string} [fechaReferenciaISO] - Fecha de corte.
 * @returns {Array} Cuotas con contexto del plan.
 */
function obtenerCuotasProximasVencer(financiamientos, diasVentana, fechaReferenciaISO) {
    var ventana = diasVentana !== undefined ? Number(diasVentana) : 7;
    var fRef = fechaReferenciaISO ? new Date(fechaReferenciaISO) : new Date();
    var msVentana = ventana * 24 * 60 * 60 * 1000;
    var proximas = [];

    if (!financiamientos || !Array.isArray(financiamientos)) return proximas;

    for (var i = 0; i < financiamientos.length; i++) {
        var f = financiamientos[i];
        if (f.estado === 'PAGADO' || f.estado === 'CANCELADO') continue;
        if (!f.cuotas) continue;

        for (var c = 0; c < f.cuotas.length; c++) {
            var cuota = f.cuotas[c];
            if (cuota.estado === 'PAGADA') continue;

            var fVenc = new Date(cuota.fechaVencimientoISO);
            var diffMs = fVenc.getTime() - fRef.getTime();

            if (diffMs >= 0 && diffMs <= msVentana) {
                var diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                proximas.push({
                    financiamientoId: f.id,
                    correlativoCotizacion: f.correlativoCotizacion,
                    usuarioId: f.usuarioId,
                    nombreCliente: f.nombreCliente,
                    numeroCuota: cuota.numero,
                    montoUSD: cuota.montoUSD,
                    fechaVencimientoISO: cuota.fechaVencimientoISO,
                    diasRestantes: diasRestantes
                });
            }
        }
    }
    return proximas;
}

// ============================================================
// 18. EXPANSIONES DE ESTIMACIÓN DE MATERIALES (14 TIPOS)
// ============================================================

function calcularMaterialesContrapiso(area, espesor, desperdicioPct) {
    var a = Number(area), e = Number(espesor);
    if (isNaN(a) || a <= 0 || isNaN(e) || e <= 0) {
        return { valido: false, error: 'Dimensiones inválidas.' };
    }
    var volumen = a * e;
    return {
        valido: true, tipo: 'Contrapiso de Concreto', areaM2: a,
        volumenM3: volumen, desperdicioPct: desperdicioPct,
        resultados: [
            { nombreBusqueda: 'Cemento', cantidad: aplicarDesperdicio(volumen * 7, desperdicioPct), unidad: 'Sacos 42.5kg', detalle: '7 sacos/m³' },
            { nombreBusqueda: 'Arena', cantidad: aplicarDesperdicio(volumen * 0.5, desperdicioPct), unidad: 'Metro cúbico', detalle: '0.5 m³ arena/m³' },
            { nombreBusqueda: 'Piedra Picada', cantidad: aplicarDesperdicio(volumen * 0.9, desperdicioPct), unidad: 'Metro cúbico', detalle: '0.9 m³ piedra/m³' }
        ]
    };
}

function calcularMaterialesColumna(cantidad, alto, seccionCm, desperdicioPct) {
    var n = Number(cantidad), h = Number(alto), s = Number(seccionCm);
    if (isNaN(n) || n <= 0 || isNaN(h) || h <= 0 || isNaN(s) || s <= 0) {
        return { valido: false, error: 'Dimensiones inválidas.' };
    }
    var seccionM = s / 100;
    var volumenTotal = seccionM * seccionM * h * n;
    var cabillas = n * 4;
    var estribos = n * Math.ceil(h * 5);
    return {
        valido: true, tipo: 'Columna de Concreto Armado', volumenM3: volumenTotal,
        desperdicioPct: desperdicioPct,
        resultados: [
            { nombreBusqueda: 'Cemento', cantidad: aplicarDesperdicio(volumenTotal * 7, desperdicioPct), unidad: 'Sacos 42.5kg', detalle: '7 sacos/m³' },
            { nombreBusqueda: 'Cabilla', cantidad: aplicarDesperdicio(cabillas, desperdicioPct), unidad: 'Barras 12m', detalle: '4 cabillas/columna' },
            { nombreBusqueda: 'Alambre Dulce', cantidad: aplicarDesperdicio(estribos * 0.3, desperdicioPct), unidad: 'Kilogramo', detalle: '0.3 kg/estribo' }
        ]
    };
}

function calcularMaterialesViga(longitud, anchoCm, altoCm, desperdicioPct) {
    var l = Number(longitud), a = Number(anchoCm), h = Number(altoCm);
    if (isNaN(l) || l <= 0 || isNaN(a) || a <= 0 || isNaN(h) || h <= 0) {
        return { valido: false, error: 'Dimensiones inválidas.' };
    }
    var volumen = l * (a / 100) * (h / 100);
    return {
        valido: true, tipo: 'Viga de Concreto Armado', volumenM3: volumen,
        desperdicioPct: desperdicioPct,
        resultados: [
            { nombreBusqueda: 'Cemento', cantidad: aplicarDesperdicio(volumen * 7, desperdicioPct), unidad: 'Sacos 42.5kg', detalle: '7 sacos/m³' },
            { nombreBusqueda: 'Cabilla', cantidad: aplicarDesperdicio(l * 4, desperdicioPct), unidad: 'Barras 12m', detalle: '4 cabillas/m lineales' },
            { nombreBusqueda: 'Alambre Dulce', cantidad: aplicarDesperdicio(l * 0.5, desperdicioPct), unidad: 'Kilogramo', detalle: '0.5 kg/m' }
        ]
    };
}

function calcularMaterialesCeramica(area, tamanoCm, desperdicioPct) {
    var a = Number(area), t = Number(tamanoCm);
    if (isNaN(a) || a <= 0 || isNaN(t) || t <= 0) {
        return { valido: false, error: 'Dimensiones inválidas.' };
    }
    var ladoM = t / 100;
    var piezasBase = a / (ladoM * ladoM);
    return {
        valido: true, tipo: 'Cerámica / Porcelanato', areaM2: a, desperdicioPct: desperdicioPct,
        resultados: [
            { nombreBusqueda: 'Cerámica', cantidad: aplicarDesperdicio(piezasBase, desperdicioPct), unidad: 'Piezas', detalle: 'Piezas de ' + t + '×' + t + ' cm' },
            { nombreBusqueda: 'Pego', cantidad: aplicarDesperdicio(a * 5, desperdicioPct), unidad: 'Kilogramo', detalle: '5 kg/m²' },
            { nombreBusqueda: 'Fraguador', cantidad: aplicarDesperdicio(a * 0.5, desperdicioPct), unidad: 'Kilogramo', detalle: '0.5 kg/m²' }
        ]
    };
}

function calcularMaterialesPintura(area, manos, desperdicioPct) {
    var a = Number(area), m = Number(manos);
    if (isNaN(a) || a <= 0 || isNaN(m) || m <= 0) {
        return { valido: false, error: 'Dimensiones inválidas.' };
    }
    var galones = (a / 30) * m;
    return {
        valido: true, tipo: 'Pintura de Paredes', areaM2: a, manos: m,
        desperdicioPct: desperdicioPct,
        resultados: [
            { nombreBusqueda: 'Pintura', cantidad: aplicarDesperdicio(galones, desperdicioPct), unidad: 'Galón', detalle: '30 m²/galón/mano' },
            { nombreBusqueda: 'Pasta Profesional', cantidad: aplicarDesperdicio(a / 40, desperdicioPct), unidad: 'Galón', detalle: '40 m²/galón' },
            { nombreBusqueda: 'Rodillo de Felpa', cantidad: aplicarDesperdicio(a / 100, desperdicioPct), unidad: 'Galón', detalle: '100 m²/galón' }
        ]
    };
}

function calcularMaterialesCerca(longitud, alto, desperdicioPct) {
    var l = Number(longitud), h = Number(alto);
    if (isNaN(l) || l <= 0 || isNaN(h) || h <= 0) {
        return { valido: false, error: 'Dimensiones inválidas.' };
    }
    var area = l * h;
    return {
        valido: true, tipo: 'Cerca Perimetral', areaM2: area, desperdicioPct: desperdicioPct,
        resultados: [
            { nombreBusqueda: 'Bloque', cantidad: aplicarDesperdicio(area * 12.5, desperdicioPct), unidad: 'Unidades', detalle: '12.5 bloques/m²' },
            { nombreBusqueda: 'Cemento', cantidad: aplicarDesperdicio(area * 0.20, desperdicioPct), unidad: 'Sacos 42.5kg', detalle: '0.20 sacos/m²' },
            { nombreBusqueda: 'Cabilla', cantidad: aplicarDesperdicio(l * 1.2, desperdicioPct), unidad: 'Barras 12m', detalle: '1.2 cabillas/m' }
        ]
    };
}

function calcularMaterialesMuroContencion(longitud, alto, espesor, desperdicioPct) {
    var l = Number(longitud), h = Number(alto), e = Number(espesor);
    if (isNaN(l) || l <= 0 || isNaN(h) || h <= 0 || isNaN(e) || e <= 0) {
        return { valido: false, error: 'Dimensiones inválidas.' };
    }
    var volumen = l * h * e;
    return {
        valido: true, tipo: 'Muro de Contención', volumenM3: volumen, desperdicioPct: desperdicioPct,
        resultados: [
            { nombreBusqueda: 'Cemento', cantidad: aplicarDesperdicio(volumen * 7, desperdicioPct), unidad: 'Sacos 42.5kg', detalle: '7 sacos/m³' },
            { nombreBusqueda: 'Cabilla', cantidad: aplicarDesperdicio(l * 4, desperdicioPct), unidad: 'Barras 12m', detalle: '4 cabillas/m' },
            { nombreBusqueda: 'Madera para Encofrado', cantidad: aplicarDesperdicio(l * 2, desperdicioPct), unidad: 'Pulgada', detalle: 'Encofrado 2/m' }
        ]
    };
}

function calcularMaterialesTanque(litros, desperdicioPct) {
    var l = Number(litros);
    if (isNaN(l) || l <= 0) {
        return { valido: false, error: 'Capacidad inválida.' };
    }
    var numTanques = Math.ceil(l / 5000);
    var necesitaBomba = l > 5000 ? 1 : 0;
    return {
        valido: true, tipo: 'Tanque / Cisterna', capacidadLitros: l, desperdicioPct: desperdicioPct,
        resultados: [
            { nombreBusqueda: 'Tanque', cantidad: numTanques, unidad: 'Unidad', detalle: numTanques + ' tanque(s) de 5000L' },
            { nombreBusqueda: 'Bomba', cantidad: necesitaBomba, unidad: 'Unidad', detalle: 'Bomba 1HP si > 5000L' },
            { nombreBusqueda: 'Tubería', cantidad: aplicarDesperdicio(l / 500, desperdicioPct), unidad: 'Tubo 6m', detalle: 'PVC 2" aprox' }
        ]
    };
}

function calcularMaterialesElectrico(area, desperdicioPct) {
    var a = Number(area);
    if (isNaN(a) || a <= 0) {
        return { valido: false, error: 'Área inválida.' };
    }
    var metrosCable = a * 1.5;
    var tomas = Math.ceil(a / 25);
    var interruptores = Math.ceil(a / 40);
    return {
        valido: true, tipo: 'Sistema Eléctrico de Vivienda', areaM2: a, desperdicioPct: desperdicioPct,
        resultados: [
            { nombreBusqueda: 'Cable Eléctrico', cantidad: aplicarDesperdicio(metrosCable, desperdicioPct), unidad: 'Metro', detalle: '1.5 m/m²' },
            { nombreBusqueda: 'Tomacorriente', cantidad: aplicarDesperdicio(tomas, desperdicioPct), unidad: 'Unidad', detalle: '1 por 25 m²' },
            { nombreBusqueda: 'Interruptor', cantidad: aplicarDesperdicio(interruptores, desperdicioPct), unidad: 'Unidad', detalle: '1 por 40 m²' }
        ]
    };
}

function calcularMaterialesImpermeabilizacion(area, desperdicioPct) {
    var a = Number(area);
    if (isNaN(a) || a <= 0) {
        return { valido: false, error: 'Área inválida.' };
    }
    return {
        valido: true, tipo: 'Impermeabilización de Techo', areaM2: a, desperdicioPct: desperdicioPct,
        resultados: [
            { nombreBusqueda: 'Impermeabilizante', cantidad: aplicarDesperdicio(a / 12.5, desperdicioPct), unidad: 'Galón', detalle: '12.5 m²/galón' },
            { nombreBusqueda: 'Cemento', cantidad: aplicarDesperdicio(a * 0.15, desperdicioPct), unidad: 'Sacos 42.5kg', detalle: 'Mortero de nivelación' },
            { nombreBusqueda: 'Malla Electrosoldada', cantidad: aplicarDesperdicio(a * 1.05, desperdicioPct), unidad: 'm²', detalle: '5% traslape' }
        ]
    };
}

function calcularMaterialesPozoSeptico(personas, desperdicioPct) {
    var p = Number(personas);
    if (isNaN(p) || p <= 0) {
        return { valido: false, error: 'Número de personas inválido.' };
    }
    var volumen = p * 0.15 * 3;
    var bloques = volumen * 50;
    return {
        valido: true, tipo: 'Pozo Séptico', volumenM3: volumen, desperdicioPct: desperdicioPct,
        resultados: [
            { nombreBusqueda: 'Bloque de Concreto', cantidad: aplicarDesperdicio(bloques, desperdicioPct), unidad: 'Unidad', detalle: '50 bloques/m³' },
            { nombreBusqueda: 'Tubería PVC', cantidad: aplicarDesperdicio(6, desperdicioPct), unidad: 'Tubo 6m', detalle: 'Desagüe 4"' },
            { nombreBusqueda: 'Cemento', cantidad: aplicarDesperdicio(volumen * 3, desperdicioPct), unidad: 'Sacos 42.5kg', detalle: 'Losa tapa y pega' }
        ]
    };
}

// ============================================================
// 12. MOTOR FINANCIERO Y ANALÍTICO SICOP-VE 2.0
// ============================================================

/**
 * Calcula las métricas globales del Centro de Control Financiero:
 * - Cartera total aprobada
 * - Total recuperado / amortizado
 * - Total en mora activa
 * - Saldo neto por cobrar
 * - Tasas porcentuales de recuperación y morosidad
 * - Distribución por institución
 * @param {Array<Object>} financiamientos - Lista de planes.
 * @param {Array<Object>} cotizaciones - Lista de cotizaciones aprobadas.
 * @param {number} [tasaBCV] - Tasa oficial referencial.
 * @returns {Object} Resumen financiero consolidado.
 */
function calcularControlFinancieroGlobal(financiamientos, cotizaciones, tasaBCV) {
    var tasa = (tasaBCV && !isNaN(Number(tasaBCV)) && Number(tasaBCV) > 0) ? Number(tasaBCV) : obtenerTasaBCVValida();
    var fins = financiamientos || [];
    var cots = cotizaciones || [];

    var carteraTotalUSD = 0;
    var totalRecuperadoUSD = 0;
    var totalMoraUSD = 0;
    var saldoPorCobrarUSD = 0;
    var porInstitucion = {};

    for (var i = 0; i < fins.length; i++) {
        var f = fins[i];
        var totalPlan = Number(f.totalFinanciadoUSD || f.montoTotalUSD || 0);
        var pagado = Number(f.totalPagadoUSD || 0);
        var pendiente = Number(f.saldoPendienteUSD || (totalPlan - pagado));
        if (pendiente < 0) pendiente = 0;

        carteraTotalUSD += totalPlan;
        totalRecuperadoUSD += pagado;
        saldoPorCobrarUSD += pendiente;

        // Evaluar mora
        if (f.estado === 'EN_MORA' || Number(f.diasAtraso) > 0) {
            totalMoraUSD += pendiente;
        }

        // Agrupación por cliente / institución
        var inst = f.nombreCliente || 'Institución General';
        if (!porInstitucion[inst]) {
            porInstitucion[inst] = { nombre: inst, totalFinanciado: 0, totalPagado: 0, saldoPendiente: 0, enMora: 0, estado: 'AL_DIA' };
        }
        porInstitucion[inst].totalFinanciado += totalPlan;
        porInstitucion[inst].totalPagado += pagado;
        porInstitucion[inst].saldoPendiente += pendiente;
        if (f.estado === 'EN_MORA') {
            porInstitucion[inst].enMora += pendiente;
            porInstitucion[inst].estado = 'EN_MORA';
        }
    }

    var tasaRecuperacionPct = carteraTotalUSD > 0 ? Number(((totalRecuperadoUSD / carteraTotalUSD) * 100).toFixed(2)) : 0;
    var tasaMorosidadPct = carteraTotalUSD > 0 ? Number(((totalMoraUSD / carteraTotalUSD) * 100).toFixed(2)) : 0;

    return {
        carteraTotalUSD: carteraTotalUSD,
        carteraTotalBs: carteraTotalUSD * tasa,
        totalRecuperadoUSD: totalRecuperadoUSD,
        totalRecuperadoBs: totalRecuperadoUSD * tasa,
        totalMoraUSD: totalMoraUSD,
        totalMoraBs: totalMoraUSD * tasa,
        saldoPorCobrarUSD: saldoPorCobrarUSD,
        saldoPorCobrarBs: saldoPorCobrarUSD * tasa,
        tasaRecuperacionPct: tasaRecuperacionPct,
        tasaMorosidadPct: tasaMorosidadPct,
        tasaBCV: tasa,
        porInstitucion: porInstitucion
    };
}

/**
 * Calcula las proyecciones de flujo de caja financiero bajo 3 escenarios institucionales:
 * 1. Escenario Normal (100% de cumplimiento del cronograma activo)
 * 2. Escenario Conservador (70% de cumplimiento, excluyendo mora severa)
 * 3. Escenario de Alto Riesgo (40% de efectividad con estrés de cartera)
 * @param {Array<Object>} financiamientos - Lista de planes activos.
 * @param {number} [tasaBCV] - Tasa oficial BCV.
 * @returns {Object} Proyecciones en USD y Bs para 30, 90 y 180 días.
 */
function calcularProyeccionesFinancieras(financiamientos, tasaBCV) {
    var tasa = (tasaBCV && !isNaN(Number(tasaBCV)) && Number(tasaBCV) > 0) ? Number(tasaBCV) : obtenerTasaBCVValida();
    var fins = financiamientos || [];

    var mes1Normal = 0;
    var mes3Normal = 0;
    var mes6Normal = 0;

    for (var i = 0; i < fins.length; i++) {
        var f = fins[i];
        if (f.estado === 'PAGADO' || f.estado === 'CANCELADO') continue;

        var cuotas = f.cuotas || [];
        for (var c = 0; c < cuotas.length; c++) {
            var cuota = cuotas[c];
            if (cuota.estado === 'PENDIENTE' || cuota.estado === 'VENCIDA') {
                var m = Number(cuota.montoUSD || 0);
                if (c < 2) {
                    mes1Normal += m;
                }
                if (c < 4) {
                    mes3Normal += m;
                }
                mes6Normal += m;
            }
        }
    }

    if (mes1Normal === 0 && mes6Normal === 0) {
        // Fallback matemático representativo basado en saldos pendientes
        var control = calcularControlFinancieroGlobal(fins, [], tasa);
        var saldo = control.saldoPorCobrarUSD;
        mes1Normal = saldo * 0.35;
        mes3Normal = saldo * 0.70;
        mes6Normal = saldo;
    }

    // Escenario Conservador (70%)
    var mes1Cons = mes1Normal * 0.70;
    var mes3Cons = mes3Normal * 0.70;
    var mes6Cons = mes6Normal * 0.70;

    // Escenario Alto Riesgo (40%)
    var mes1Riesgo = mes1Normal * 0.40;
    var mes3Riesgo = mes3Normal * 0.40;
    var mes6Riesgo = mes6Normal * 0.40;

    return {
        tasaBCV: tasa,
        normal: {
            mes1USD: mes1Normal,
            mes1Bs: mes1Normal * tasa,
            mes3USD: mes3Normal,
            mes3Bs: mes3Normal * tasa,
            mes6USD: mes6Normal,
            mes6Bs: mes6Normal * tasa
        },
        conservador: {
            mes1USD: mes1Cons,
            mes1Bs: mes1Cons * tasa,
            mes3USD: mes3Cons,
            mes3Bs: mes3Cons * tasa,
            mes6USD: mes6Cons,
            mes6Bs: mes6Cons * tasa
        },
        altoRiesgo: {
            mes1USD: mes1Riesgo,
            mes1Bs: mes1Riesgo * tasa,
            mes3USD: mes3Riesgo,
            mes3Bs: mes3Riesgo * tasa,
            mes6USD: mes6Riesgo,
            mes6Bs: mes6Riesgo * tasa
        }
    };
}

/**
 * Calcula el estado de semáforo presupuestario para una institución.
 * Regla:
 * - < 60%: Normal (Verde)
 * - 60% - 89.99%: Alerta (Amarillo)
 * - >= 90%: Crítico (Rojo)
 * @param {number} asignado - Presupuesto total asignado.
 * @param {number} comprometido - Monto de cotizaciones aprobadas.
 * @param {number} ejecutado - Monto de cotizaciones formalmente entregadas.
 * @returns {Object} { porcentaje, estado, disponible, claseCSS, texto }
 */
function calcularSemaforoPresupuestario(asignado, comprometido, ejecutado) {
    var asig = Number(asignado) || 0;
    var comp = Number(comprometido) || 0;
    var ejec = Number(ejecutado) || 0;
    var utilizado = comp + ejec;
    var disponible = asig - utilizado;
    if (disponible < 0) disponible = 0;

    var pct = asig > 0 ? Number(((utilizado / asig) * 100).toFixed(2)) : 0;
    var estado = 'Normal';
    var clase = 'badge-semaforo--verde';

    if (pct >= 90) {
        estado = 'Crítico';
        clase = 'badge-semaforo--rojo';
    } else if (pct >= 60) {
        estado = 'Alerta';
        clase = 'badge-semaforo--amarillo';
    }

    return {
        asignado: asig,
        comprometido: comp,
        ejecutado: ejec,
        utilizado: utilizado,
        disponible: disponible,
        porcentaje: pct,
        estado: estado,
        claseCSS: clase
    };
}

/**
 * Concilia un pago en el libro de movimientos y actualiza el plan y cuota correspondiente.
 * @param {Array<Object>} movimientos - Lista de movimientos.
 * @param {string|number} movimientoId - ID o correlativo del movimiento.
 * @param {string} conciliadorNombre - Nombre del funcionario que concilia.
 * @param {string} [notas] - Notas de conciliación.
 * @returns {Object} Resultado { ok, movimiento, error }
 */
function conciliarMovimientoPago(movimientos, movimientoId, conciliadorNombre, notas) {
    if (!movimientoId) return { ok: false, error: 'Identificador de movimiento no proporcionado.' };
    var lista = movimientos || [];
    var encontrado = null;

    for (var i = 0; i < lista.length; i++) {
        if (String(lista[i].id) === String(movimientoId) || String(lista[i].correlativo) === String(movimientoId)) {
            encontrado = lista[i];
            break;
        }
    }

    if (!encontrado) return { ok: false, error: 'Movimiento no encontrado en el libro financiero.' };
    if (encontrado.estado === 'CONFIRMADO') return { ok: false, error: 'El movimiento ya fue conciliado previamente.' };

    encontrado.estado = 'CONFIRMADO';
    encontrado.fechaConciliacion = new Date().toISOString();
    encontrado.conciliadoPor = conciliadorNombre || 'Gobernación';
    if (notas) encontrado.notas = (encontrado.notas ? encontrado.notas + ' | ' : '') + notas;

    return { ok: true, movimiento: encontrado };
}

/**
 * Rechaza un movimiento de pago reportado con motivo formal justificado (mínimo 10 caracteres).
 * @param {Array<Object>} movimientos - Lista de movimientos.
 * @param {string|number} movimientoId - ID o correlativo.
 * @param {string} rechazadorNombre - Funcionario que rechaza.
 * @param {string} motivo - Explicación auditada.
 * @returns {Object} { ok, movimiento, error }
 */
function rechazarMovimientoPago(movimientos, movimientoId, rechazadorNombre, motivo) {
    if (!motivo || String(motivo).trim().length < 10) {
        return { ok: false, error: 'El motivo del rechazo debe contener al menos 10 caracteres explicativos.' };
    }
    var lista = movimientos || [];
    var encontrado = null;

    for (var i = 0; i < lista.length; i++) {
        if (String(lista[i].id) === String(movimientoId) || String(lista[i].correlativo) === String(movimientoId)) {
            encontrado = lista[i];
            break;
        }
    }

    if (!encontrado) return { ok: false, error: 'Movimiento no encontrado.' };

    encontrado.estado = 'RECHAZADO';
    encontrado.fechaRechazo = new Date().toISOString();
    encontrado.rechazadoPor = rechazadorNombre || 'Gobernación';
    encontrado.motivoRechazo = String(motivo).trim();

    return { ok: true, movimiento: encontrado };
}

/**
 * Calcula la variación absoluta y porcentual entre dos precios históricos.
 * @param {number} precioAnterior - Precio base.
 * @param {number} precioNuevo - Precio actualizado.
 * @returns {Object} { diferenciaAbsoluta, variacionPct, tipoVariacion }
 */
function calcularVariacionPrecioHistorico(precioAnterior, precioNuevo) {
    var pAnt = Number(precioAnterior) || 0;
    var pNue = Number(precioNuevo) || 0;
    var dif = pNue - pAnt;
    var pct = pAnt > 0 ? Number(((dif / pAnt) * 100).toFixed(2)) : 0;
    var tipo = 'ESTABLE';
    if (pct > 0.05) tipo = 'AUMENTO';
    else if (pct < -0.05) tipo = 'DISMINUCION';

    return {
        precioAnterior: pAnt,
        precioNuevo: pNue,
        diferenciaAbsoluta: Number(dif.toFixed(2)),
        variacionPct: pct,
        tipoVariacion: tipo,
        esAumentoSignificativo: pct >= 15.00
    };
}

/**
 * Evalúa el sistema y genera alertas inteligentes administrativas automáticas.
 * @param {Array<Object>} cotizaciones - Lista de cotizaciones.
 * @param {Array<Object>} financiamientos - Lista de financiamientos.
 * @param {Array<Object>} inventarioStock - Stock de almacenes.
 * @param {Array<Object>} presupuestos - Presupuestos institucionales.
 * @returns {Array<Object>} Lista de alertas heurísticas detectadas.
 */
function evaluarAlertasInteligentesSistema(cotizaciones, financiamientos, inventarioStock, presupuestos) {
    var alertas = [];
    var cots = cotizaciones || [];
    var fins = financiamientos || [];
    var stock = inventarioStock || [];
    var ptos = presupuestos || [];

    // 1. Alertas de cotizaciones demoradas en revisión (> 5 días)
    for (var c = 0; c < cots.length; c++) {
        var cot = cots[c];
        if (cot.estado === 'ENVIADA') {
            var dias = calcularDiasTranscurridos(cot.fechaCreacionISO || cot.fecha);
            if (dias >= 5) {
                alertas.push({
                    id: 'ALR-COT-' + cot.correlativo,
                    codigo: 'COTIZACION_DEMORADA',
                    nivel: 'ADVERTENCIA',
                    titulo: 'Cotización Demorada en Aprobación: ' + cot.correlativo,
                    mensaje: 'La cotización para "' + (cot.nombreObra || 'Obra') + '" lleva ' + dias + ' días en espera de dictamen técnico.',
                    accionRecomendada: 'Revisar disponibilidad presupuestaria y dictaminar en el módulo de Aprobaciones.',
                    moduloDestino: 'aprobaciones'
                });
            }
        }
    }

    // 2. Alertas de financiamientos con mora severa (> 15 días)
    for (var f = 0; f < fins.length; f++) {
        var fin = fins[f];
        if (fin.estado === 'EN_MORA' || Number(fin.diasAtraso) >= 15) {
            alertas.push({
                id: 'ALR-FIN-' + (fin.correlativoCotizacion || fin.id),
                codigo: 'CARTERA_EN_MORA',
                nivel: 'CRITICO',
                titulo: 'Mora Activa: ' + (fin.nombreCliente || 'Institución') + ' (' + (fin.correlativoCotizacion || 'Plan') + ')',
                mensaje: 'Se registran ' + fin.diasAtraso + ' días de atraso en cuotas por USD $' + Number(fin.saldoPendienteUSD || 0).toFixed(2) + '.',
                accionRecomendada: 'Coordinar con la institución la conciliación inmediata de amortizaciones pendientes.',
                moduloDestino: 'financiamiento'
            });
        }
    }

    // 3. Alertas de inventario crítico bajo mínimo
    for (var s = 0; s < stock.length; s++) {
        var it = stock[s];
        var disponible = Number(it.stockActual || 0) - Number(it.stockReservado || 0);
        if (disponible <= Number(it.stockMinimo || 10)) {
            alertas.push({
                id: 'ALR-STK-' + it.id,
                codigo: 'STOCK_CRITICO',
                nivel: 'ADVERTENCIA',
                titulo: 'Bajo Inventario: ' + (it.nombreMaterial || 'Material #' + it.materialId),
                mensaje: 'Existencia disponible (' + disponible + ') por debajo del umbral de seguridad mínimo (' + it.stockMinimo + ').',
                accionRecomendada: 'Generar orden de reposición o evaluar traslados inter-almacenes.',
                moduloDestino: 'inventario'
            });
        }
    }

    // 4. Alertas de presupuestos en umbral crítico
    for (var p = 0; p < ptos.length; p++) {
        var pto = ptos[p];
        var sem = calcularSemaforoPresupuestario(pto.asignado, pto.comprometido, pto.ejecutado);
        if (sem.estado === 'Crítico') {
            alertas.push({
                id: 'ALR-PTO-' + (pto.institucionId || p),
                codigo: 'PRESUPUESTO_CRITICO',
                nivel: 'CRITICO',
                titulo: 'Presupuesto Institucional Agotado: ' + (pto.nombreInstitucion || 'Institución'),
                mensaje: 'Uso del ' + sem.porcentaje + '% del presupuesto asignado. Saldo disponible: $' + sem.disponible.toFixed(2) + ' USD.',
                accionRecomendada: 'Solicitar ampliación de partida presupuestaria antes de emitir nuevas cotizaciones.',
                moduloDestino: 'presupuestos'
            });
        }
    }

    return alertas;
}

/**
 * Genera un código hash determinista estilo SHA-256 para validación de documentos oficiales.
 * @param {string} codigo - Código único del documento.
 * @param {string} titulo - Título oficial.
 * @param {string} fechaISO - Timestamp de emisión.
 * @returns {string} Huella criptográfica hexadecimal de 64 caracteres.
 */
function generarHashDocumento(codigo, titulo, fechaISO) {
    var raw = String(codigo) + '|' + String(titulo) + '|' + String(fechaISO) + '|SICOP_VE_2_0_CERT';
    var hash1 = 0x811c9dc5;
    var hash2 = 0xcbf29ce4;
    for (var i = 0; i < raw.length; i++) {
        var ch = raw.charCodeAt(i);
        hash1 = ((hash1 ^ ch) * 0x01000193) >>> 0;
        hash2 = ((hash2 ^ (ch << 1)) * 0x5bd1e995) >>> 0;
    }
    var hex1 = hash1.toString(16);
    while (hex1.length < 8) hex1 = '0' + hex1;
    var hex2 = hash2.toString(16);
    while (hex2.length < 8) hex2 = '0' + hex2;

    // Repetir para generar 64 caracteres consistentes
    var seedStr = hex1 + hex2 + hex1.split('').reverse().join('') + hex2.split('').reverse().join('');
    while (seedStr.length < 64) seedStr += seedStr;
    return seedStr.substring(0, 64);
}

