/* ============================================================
   SICOP-VE — Capa de Datos (js/datos.js)
   Proyecto Final: Lógica y Programación I
   
   Responsabilidad:
   - Constantes fijas del negocio (IVA, contingencia, factores de flete, etc.)
   - Datos iniciales de demostración (usuarios, materiales, ciudades)
   - Funciones auxiliares para interactuar con localStorage
   ============================================================ */

// ============================================================
// 1. CONSTANTES DEL NEGOCIO
// ============================================================

/** Porcentaje de Impuesto al Valor Agregado (16%) */
var IVA = 0.16;

/** Porcentaje de contingencia sobre el monto neto (5%) */
var CONTINGENCIA = 0.05;

/** Días de validez legal de una cotización emitida */
var DIAS_VIGENCIA_COTIZACION = 15;

/** Tasa de cambio oficial referencial inicial (Bs./USD) */
var TASA_BCV_INICIAL = 900.00;

/** Descuento según el perfil del usuario solicitante */
var DESCUENTOS_POR_PERFIL = {
    'Alcaldía': 0.04,
    'Gobernación': 0.04,
    'Empresa': 0.02,
    'Constructor': 0.00
};

/**
 * Factores de flete terrestre según el estado destino de la obra.
 * Flete = Subtotal * (factor - 1)
 */
var FACTORES_FLETE = {
    'Distrito Capital': 1.00,
    'Aragua':           1.02,
    'Miranda':          1.03,
    'Carabobo':         1.04,
    'Guárico':          1.05,
    'Anzoátegui':       1.06,
    'Lara':             1.06,
    'Falcón':           1.07,
    'Zulia':            1.08,
    'Barinas':          1.09,
    'Monagas':          1.10,
    'Trujillo':         1.10,
    'Sucre':            1.11,
    'Mérida':           1.12,
    'Táchira':          1.13,
    'Bolívar':          1.14,
    'Nueva Esparta':    1.20,
    'Amazonas':         1.25
};

/**
 * Ciudades de compra y sus factores de costo relativo.
 */
var CIUDADES_BASE = [
    { nombre: 'Caracas',        factor: 1.05 },
    { nombre: 'Valencia',       factor: 0.95 },
    { nombre: 'Maracay',        factor: 0.97 },
    { nombre: 'Barquisimeto',   factor: 1.00 },
    { nombre: 'Maracaibo',      factor: 1.04 },
    { nombre: 'Puerto Ordaz',   factor: 0.90 },
    { nombre: 'Barcelona',      factor: 1.02 },
    { nombre: 'San Cristóbal',  factor: 1.08 },
    { nombre: 'Maturín',        factor: 1.03 },
    { nombre: 'Mérida',         factor: 1.06 },
    { nombre: 'Ciudad Bolívar', factor: 0.98 },
    { nombre: 'Porlamar',       factor: 1.15 }
];

/**
 * Multiplicadores para calcular cupo de financiamiento/límite de crédito:
 * Cupo = Ingreso mensual * multiplicador
 */
var MULTIPLICADORES_NIVEL = {
    1: 1.5,
    2: 2.5,
    3: 4.0,
    4: 6.0,
    5: 9.0
};

/** Sectores de infraestructura disponibles en el catálogo */
var SECTORES_CATALOGO = ['Construcción', 'Energía', 'Agua', 'Vialidad', 'Acabados', 'Equipos'];

/**
 * Planes de financiamiento disponibles en la plataforma (estilo Cashea / institucional)
 */
var PLANES_FINANCIAMIENTO = {
    'contado': {
        clave: 'contado',
        nombre: 'De Contado (100% Inicial)',
        descripcion: 'Sin financiamiento. Pago total inmediato al momento de aprobación.',
        porcentajeInicial: 1.00,
        numeroCuotas: 0,
        frecuenciaDias: 0,
        recargoPct: 0.00
    },
    'cashea_3': {
        clave: 'cashea_3',
        nombre: 'Cashea 3 Cuotas (0% Interés)',
        descripcion: '50% inicial al aprobar y 3 cuotas iguales quincenales (cada 14 días) sin interés.',
        porcentajeInicial: 0.50,
        numeroCuotas: 3,
        frecuenciaDias: 14,
        recargoPct: 0.00
    },
    'cashea_6': {
        clave: 'cashea_6',
        nombre: 'Cashea 6 Cuotas (0% Interés)',
        descripcion: '40% inicial y 6 cuotas quincenales (cada 14 días) sin recargo.',
        porcentajeInicial: 0.40,
        numeroCuotas: 6,
        frecuenciaDias: 14,
        recargoPct: 0.00
    },
    'quincenal_6': {
        clave: 'quincenal_6',
        nombre: 'Financiamiento Quincenal 6 Cuotas (5% Gastos Admin)',
        descripcion: '30% inicial y 6 cuotas quincenales con 5% de recargo administrativo.',
        porcentajeInicial: 0.30,
        numeroCuotas: 6,
        frecuenciaDias: 14,
        recargoPct: 0.05
    },
    'mensual_12': {
        clave: 'mensual_12',
        nombre: 'Financiamiento Institucional 12 Cuotas (12% Gastos Admin)',
        descripcion: '20% inicial y 12 cuotas mensuales (cada 30 días) con 12% de recargo.',
        porcentajeInicial: 0.20,
        numeroCuotas: 12,
        frecuenciaDias: 30,
        recargoPct: 0.12
    }
};

/** Estados del ciclo de vida de un plan de financiamiento */
var ESTADOS_FINANCIAMIENTO = ['ACTIVO', 'PAGADO', 'EN_MORA', 'CANCELADO'];

/** Estados de una cuota individual */
var ESTADOS_CUOTA = ['PENDIENTE', 'PAGADA', 'VENCIDA'];

/**
 * Plantillas preconfiguradas con materiales típicos para obras comunes en Venezuela.
 * Los valores son referenciales y totalmente editables por el usuario.
 */
var PLANTILLAS_OBRA = {
    'casa_pequena': {
        clave: 'casa_pequena',
        nombre: 'Casa pequeña 50m²',
        iconoId: 'casa',
        descripcion: 'Construcción básica de vivienda de 50 m² (bloques, cemento, cabilla y tubería).',
        supuestos: 'Losa de 50 m² (10×5m, e=10cm), 28 m lineales de pared h=2.5m, 1 tramo de tubería PVC de 60m y cableado eléctrico.',
        cantidades: {
            1: 40,  // Cemento (sacos)
            2: 20,  // Cabilla (barras)
            3: 350, // Bloques (unidades)
            4: 50,  // Cable eléctrico (metros)
            7: 10   // Tubería PVC (tubos)
        },
        materiales: [
            { materialId: 1, cantidad: 40 },
            { materialId: 2, cantidad: 20 },
            { materialId: 3, cantidad: 350 },
            { materialId: 4, cantidad: 50 },
            { materialId: 7, cantidad: 10 }
        ]
    },
    'cerca_perimetral': {
        clave: 'cerca_perimetral',
        nombre: 'Cerca perimetral',
        iconoId: 'muro',
        descripcion: 'Cerramiento de linderos con bloques y vigas de corona (bloques, cemento y cabilla).',
        supuestos: 'Muro perimetral de 20 m lineales por 2.4 m de alto (48 m²), vigas de corona y columnas de confinamiento.',
        cantidades: {
            1: 45,  // Cemento
            2: 25,  // Cabilla
            3: 600  // Bloques
        },
        materiales: [
            { materialId: 1, cantidad: 45 },
            { materialId: 2, cantidad: 25 },
            { materialId: 3, cantidad: 600 }
        ]
    },
    'rehabilitar_calle': {
        clave: 'rehabilitar_calle',
        nombre: 'Rehabilitar una calle',
        iconoId: 'calle',
        descripcion: 'Bacheo, repavimentación y drenajes menores (asfalto, luminarias y tuberías).',
        supuestos: 'Bacheo de 25 t de asfalto caliente, drenaje transversal de 72 m (12 tubos PVC de 6m) y 8 luminarias viales LED.',
        cantidades: {
            8: 25, // Asfalto
            5: 8,  // Luminarias LED
            7: 12  // Tubería PVC
        },
        materiales: [
            { materialId: 8, cantidad: 25 },
            { materialId: 5, cantidad: 8 },
            { materialId: 7, cantidad: 12 }
        ]
    },
    'alumbrado_publico': {
        clave: 'alumbrado_publico',
        nombre: 'Alumbrado público',
        iconoId: 'luz',
        descripcion: 'Electrificación e iluminación vial eficiente (luminarias, cableado y paneles solares).',
        supuestos: 'Línea de electrificación de 350 m, 20 luminarias LED de 150W y 10 kits autónomos con panel solar fotovoltaico.',
        cantidades: {
            4: 350, // Cable eléctrico
            5: 20,  // Luminarias LED
            6: 10   // Paneles solares
        },
        materiales: [
            { materialId: 4, cantidad: 350 },
            { materialId: 5, cantidad: 20 },
            { materialId: 6, cantidad: 10 }
        ]
    },
    'sistema_agua': {
        clave: 'sistema_agua',
        nombre: 'Sistema de agua',
        iconoId: 'agua',
        descripcion: 'Aducción y red de distribución de agua potable (tuberías PVC y obras de concreto).',
        supuestos: 'Red de aducción de 300 m lineales (50 tubos PVC alta presión de 6m) y obras menores de anclaje con 30 sacos de cemento.',
        cantidades: {
            1: 30, // Cemento
            7: 50  // Tubería PVC
        },
        materiales: [
            { materialId: 1, cantidad: 30 },
            { materialId: 7, cantidad: 50 }
        ]
    },
    'cancha_deportiva_400m2': {
        clave: 'cancha_deportiva_400m2',
        nombre: 'Cancha deportiva 400m²',
        iconoId: 'deporte',
        descripcion: 'Cancha de usos múltiples con losa armada, cerramiento e iluminación LED.',
        supuestos: 'Losa armada (80 sacos), cabillas (45), reflectores LED (6) y demarcación vial (4 cuñetes).',
        cantidades: { 1: 80, 2: 45, 10: 20, 19: 12, 58: 6, 99: 4, 100: 2 },
        materiales: [
            { materialId: 1, cantidad: 80 },
            { materialId: 2, cantidad: 45 },
            { materialId: 10, cantidad: 20 },
            { materialId: 19, cantidad: 12 },
            { materialId: 58, cantidad: 6 },
            { materialId: 99, cantidad: 4 },
            { materialId: 100, cantidad: 2 }
        ]
    },
    'estacionamiento_pavimento_500m2': {
        clave: 'estacionamiento_pavimento_500m2',
        nombre: 'Estacionamiento 500m²',
        iconoId: 'calle',
        descripcion: 'Pavimentación integral con base granular, asfalto y demarcación vial.',
        supuestos: '50t de asfalto caliente, 45 m³ de base granular picada, 80 brocales y pintura reflectiva.',
        cantidades: { 8: 50, 96: 3, 99: 3, 101: 2, 104: 80, 105: 45 },
        materiales: [
            { materialId: 8, cantidad: 50 },
            { materialId: 96, cantidad: 3 },
            { materialId: 99, cantidad: 3 },
            { materialId: 101, cantidad: 2 },
            { materialId: 104, cantidad: 80 },
            { materialId: 105, cantidad: 45 }
        ]
    },
    'paneles_solares_5kw': {
        clave: 'paneles_solares_5kw',
        nombre: 'Paneles solares 5 kW',
        iconoId: 'luz',
        descripcion: 'Sistema fotovoltaico aislado con inversor híbrido 5kW y banco de baterías.',
        supuestos: '12 paneles monocristalinos 450W, inversor 5kW, 4 baterías gel de ciclo profundo y barra a tierra.',
        cantidades: { 4: 60, 6: 12, 47: 30, 66: 1, 67: 4, 69: 2 },
        materiales: [
            { materialId: 4, cantidad: 60 },
            { materialId: 6, cantidad: 12 },
            { materialId: 47, cantidad: 30 },
            { materialId: 66, cantidad: 1 },
            { materialId: 67, cantidad: 4 },
            { materialId: 69, cantidad: 2 }
        ]
    },
    'rehabilitacion_escuela_500m2': {
        clave: 'rehabilitacion_escuela_500m2',
        nombre: 'Rehabilitación escuela',
        iconoId: 'edificio',
        descripcion: 'Reparación integral de techos, pintura de aulas, luminarias y piezas sanitarias.',
        supuestos: '15 rollos de manto 3mm, 10 cuñetes pintura interior/exterior, 30 lámparas LED y 4 inodoros.',
        cantidades: { 32: 2, 33: 15, 34: 2, 59: 30, 116: 6, 117: 4, 134: 4, 135: 4 },
        materiales: [
            { materialId: 32, cantidad: 2 },
            { materialId: 33, cantidad: 15 },
            { materialId: 34, cantidad: 2 },
            { materialId: 59, cantidad: 30 },
            { materialId: 116, cantidad: 6 },
            { materialId: 117, cantidad: 4 },
            { materialId: 134, cantidad: 4 },
            { materialId: 135, cantidad: 4 }
        ]
    },
    'caney_comunal': {
        clave: 'caney_comunal',
        nombre: 'Caney comunal 60m²',
        iconoId: 'casa',
        descripcion: 'Estructura metálica rústica con losa de piso y cubierta de acerolit.',
        supuestos: 'Columnas estructurales 100x100mm, correas 80x40mm, 20 láminas acerolit, 50 sacos de cemento.',
        cantidades: { 1: 50, 2: 22, 19: 8, 20: 16, 23: 20, 58: 2 },
        materiales: [
            { materialId: 1, cantidad: 50 },
            { materialId: 2, cantidad: 22 },
            { materialId: 19, cantidad: 8 },
            { materialId: 20, cantidad: 16 },
            { materialId: 23, cantidad: 20 },
            { materialId: 58, cantidad: 2 }
        ]
    },
    'aire_acondicionado_split': {
        clave: 'aire_acondicionado_split',
        nombre: 'Acometida climatización',
        iconoId: 'rayo',
        descripcion: 'Canalización eléctrica y breakers industriales para unidades split.',
        supuestos: '80m de cable THW #10, tubería conduit EMT 3/4", tablero principal y breakers termomagnéticos 2P.',
        cantidades: { 46: 80, 50: 10, 52: 1, 55: 4, 69: 1 },
        materiales: [
            { materialId: 46, cantidad: 80 },
            { materialId: 50, cantidad: 10 },
            { materialId: 52, cantidad: 1 },
            { materialId: 55, cantidad: 4 },
            { materialId: 69, cantidad: 1 }
        ]
    },
    'riego_goteo_1000m2': {
        clave: 'riego_goteo_1000m2',
        nombre: 'Riego por goteo 1000m²',
        iconoId: 'agua',
        descripcion: 'Red de riego tecnificado con tubería PEAD, electrobomba y válvulas esféricas.',
        supuestos: '250m tubería PEAD 1", bomba centrífuga 1 HP, 6 llaves de paso bronce y filtros.',
        cantidades: { 73: 8, 78: 250, 81: 6, 83: 2, 89: 1, 92: 2 },
        materiales: [
            { materialId: 73, cantidad: 8 },
            { materialId: 78, cantidad: 250 },
            { materialId: 81, cantidad: 6 },
            { materialId: 83, cantidad: 2 },
            { materialId: 89, cantidad: 1 },
            { materialId: 92, cantidad: 2 }
        ]
    },
    'urbanismo_10_casas': {
        clave: 'urbanismo_10_casas',
        nombre: 'Urbanismo comunal (10 casas)',
        iconoId: 'edificio',
        descripcion: 'Acometidas maestras de servicios públicos para 10 viviendas populares.',
        supuestos: '200 sacos cemento, tuberías matrices agua blanca y servida, postes viales y acometida concéntrica.',
        cantidades: { 1: 200, 2: 80, 7: 40, 48: 150, 60: 6, 75: 30, 77: 40 },
        materiales: [
            { materialId: 1, cantidad: 200 },
            { materialId: 2, cantidad: 80 },
            { materialId: 7, cantidad: 40 },
            { materialId: 48, cantidad: 150 },
            { materialId: 60, cantidad: 6 },
            { materialId: 75, cantidad: 30 },
            { materialId: 77, cantidad: 40 }
        ]
    },
    'puente_peatonal_15m': {
        clave: 'puente_peatonal_15m',
        nombre: 'Puente peatonal 15m',
        iconoId: 'muro',
        descripcion: 'Pasarela peatonal metálica sobre quebrada con vigas IPE y losacero.',
        supuestos: '6 vigas IPE 160 de 12m, 25 m² losacero, concreto f\'c=250, pintura anticorrosiva y esmalte.',
        cantidades: { 2: 25, 18: 6, 21: 25, 37: 5, 119: 4, 120: 4 },
        materiales: [
            { materialId: 2, cantidad: 25 },
            { materialId: 18, cantidad: 6 },
            { materialId: 21, cantidad: 25 },
            { materialId: 37, cantidad: 5 },
            { materialId: 119, cantidad: 4 },
            { materialId: 120, cantidad: 4 }
        ]
    },
    'sistema_contra_incendios': {
        clave: 'sistema_contra_incendios',
        nombre: 'Red contra incendios',
        iconoId: 'alerta',
        descripcion: 'Red presurizada de combate de incendio con bomba 2HP y válvulas check.',
        supuestos: '18 tubos PVC presión 4", llaves de paso bronce 2", electrobomba sumergible y de alta presión.',
        cantidades: { 75: 18, 80: 12, 82: 4, 83: 2, 89: 1, 90: 1 },
        materiales: [
            { materialId: 75, cantidad: 18 },
            { materialId: 80, cantidad: 12 },
            { materialId: 82, cantidad: 4 },
            { materialId: 83, cantidad: 2 },
            { materialId: 89, cantidad: 1 },
            { materialId: 90, cantidad: 1 }
        ]
    },
    'tanque_elevado_10000l': {
        clave: 'tanque_elevado_10000l',
        nombre: 'Tanque elevado 10.000L',
        iconoId: 'agua',
        descripcion: 'Torre soporte con tanques cilíndricos reforzados para reserva hídrica.',
        supuestos: '5 tanques reforzados de 2000L, estructura de perfiles IPE 140, tubería de 2" y bomba centrífuga.',
        cantidades: { 7: 15, 17: 8, 19: 12, 82: 2, 87: 5, 89: 1 },
        materiales: [
            { materialId: 7, cantidad: 15 },
            { materialId: 17, cantidad: 8 },
            { materialId: 19, cantidad: 12 },
            { materialId: 82, cantidad: 2 },
            { materialId: 87, cantidad: 5 },
            { materialId: 89, cantidad: 1 }
        ]
    },
    'parque_infantil_comunal': {
        clave: 'parque_infantil_comunal',
        nombre: 'Parque biosaludable',
        iconoId: 'deporte',
        descripcion: 'Plaza recreativa con caminerías, brocales, luminarias viales y pintura esmalte.',
        supuestos: '45 sacos cemento, 50m brocales prefabricados, 4 luminarias LED 100W y 6 galones esmalte sintético.',
        cantidades: { 1: 45, 5: 4, 104: 50, 105: 15, 118: 4, 120: 2 },
        materiales: [
            { materialId: 1, cantidad: 45 },
            { materialId: 5, cantidad: 4 },
            { materialId: 104, cantidad: 50 },
            { materialId: 105, cantidad: 15 },
            { materialId: 118, cantidad: 4 },
            { materialId: 120, cantidad: 2 }
        ]
    },
    'modulo_salud_ambulatorio': {
        clave: 'modulo_salud_ambulatorio',
        nombre: 'Ambulatorio comunal 80m²',
        iconoId: 'edificio',
        descripcion: 'Construcción de módulo asistencial con áreas sanitarias y acabado porcelanato.',
        supuestos: '90 sacos cemento, 40 cabillas 1/2", 700 bloques de arcilla, porcelanato 60x60 e inodoros.',
        cantidades: { 1: 90, 2: 40, 3: 700, 33: 8, 116: 8, 125: 60, 134: 2, 135: 2 },
        materiales: [
            { materialId: 1, cantidad: 90 },
            { materialId: 2, cantidad: 40 },
            { materialId: 3, cantidad: 700 },
            { materialId: 33, cantidad: 8 },
            { materialId: 116, cantidad: 8 },
            { materialId: 125, cantidad: 60 },
            { materialId: 134, cantidad: 2 },
            { materialId: 135, cantidad: 2 }
        ]
    },
    'impermeabilizacion_techo_300m2': {
        clave: 'impermeabilizacion_techo_300m2',
        nombre: 'Impermeabilización 300m²',
        iconoId: 'casa',
        descripcion: 'Mantenimiento preventivo mayor con imprimación asfáltica y manto 3mm.',
        supuestos: '34 rollos de manto 3mm, 4 cuñetes de primer asfáltico y pintura elastomérica.',
        cantidades: { 32: 3, 33: 34, 34: 4, 117: 6 },
        materiales: [
            { materialId: 32, cantidad: 3 },
            { materialId: 33, cantidad: 34 },
            { materialId: 34, cantidad: 4 },
            { materialId: 117, cantidad: 6 }
        ]
    },
    'bacheo_vial_asfalto_frio': {
        clave: 'bacheo_vial_asfalto_frio',
        nombre: 'Bacheo asfalto en frío',
        iconoId: 'calle',
        descripcion: 'Reparación de fallas puntuales en pavimento con asfalto y compactación.',
        supuestos: '15 toneladas de asfalto caliente, 2 tambores RC-250 y alquiler de compactadora rana.',
        cantidades: { 8: 15, 96: 2, 105: 10, 138: 3 },
        materiales: [
            { materialId: 8, cantidad: 15 },
            { materialId: 96, cantidad: 2 },
            { materialId: 105, cantidad: 10 },
            { materialId: 138, cantidad: 3 }
        ]
    },
    'acera_y_brocal_200m': {
        clave: 'acera_y_brocal_200m',
        nombre: 'Aceras y brocales 200m',
        iconoId: 'calle',
        descripcion: 'Caminerías de concreto armado con madera para encofrado y brocal tipo A.',
        supuestos: '120 sacos de cemento, 15 m³ de arena lavada, 18 m³ piedra picada y 100m brocales.',
        cantidades: { 1: 120, 9: 15, 10: 18, 28: 25, 104: 100 },
        materiales: [
            { materialId: 1, cantidad: 120 },
            { materialId: 9, cantidad: 15 },
            { materialId: 10, cantidad: 18 },
            { materialId: 28, cantidad: 25 },
            { materialId: 104, cantidad: 100 }
        ]
    },
    'torre_iluminacion_campo': {
        clave: 'torre_iluminacion_campo',
        nombre: 'Torre iluminación 12m',
        iconoId: 'luz',
        descripcion: 'Postes tubulares con cruceta, reflectores LED 200W y tablero eléctrico.',
        supuestos: '8 reflectores LED 200W IP66, 2 postes de 6m acoplados, tablero 24 circuitos y cable concéntrico.',
        cantidades: { 49: 80, 53: 1, 58: 8, 60: 2, 69: 2 },
        materiales: [
            { materialId: 49, cantidad: 80 },
            { materialId: 53, cantidad: 1 },
            { materialId: 58, cantidad: 8 },
            { materialId: 60, cantidad: 2 },
            { materialId: 69, cantidad: 2 }
        ]
    },
    'pozo_profundo_agua': {
        clave: 'pozo_profundo_agua',
        nombre: 'Pozo de agua profundo',
        iconoId: 'agua',
        descripcion: 'Equipamiento de pozo artesiano comunal con electrobomba sumergible 2HP.',
        supuestos: 'Bomba sumergible 2 HP, 18 tubos de presión 2", cable sumergible TTU y tanques 2000L.',
        cantidades: { 7: 18, 48: 60, 83: 2, 87: 2, 90: 1 },
        materiales: [
            { materialId: 7, cantidad: 18 },
            { materialId: 48, cantidad: 60 },
            { materialId: 83, cantidad: 2 },
            { materialId: 87, cantidad: 2 },
            { materialId: 90, cantidad: 1 }
        ]
    },
    'galpon_industrial_300m2': {
        clave: 'galpon_industrial_300m2',
        nombre: 'Galpón comunal 300m²',
        iconoId: 'edificio',
        descripcion: 'Nave metálica con vigas IPE 140, cubierta de zinc y losacero.',
        supuestos: '14 vigas IPE 140, 24 tubos Conduven, 45 láminas de zinc y 10 rollos de malla electrosoldada.',
        cantidades: { 1: 150, 14: 10, 17: 14, 20: 24, 22: 45, 37: 25 },
        materiales: [
            { materialId: 1, cantidad: 150 },
            { materialId: 14, cantidad: 10 },
            { materialId: 17, cantidad: 14 },
            { materialId: 20, cantidad: 24 },
            { materialId: 22, cantidad: 45 },
            { materialId: 37, cantidad: 25 }
        ]
    },
    'comedor_comunitario': {
        clave: 'comedor_comunitario',
        nombre: 'Comedor popular comunal',
        iconoId: 'casa',
        descripcion: 'Adecuación de cocina e instalaciones hidrosanitarias con mesones de cerámica.',
        supuestos: '30 m² cerámica esmaltada, 35 sacos cemento, tubería sanitaria y pintura lavable.',
        cantidades: { 1: 35, 71: 6, 76: 8, 118: 3, 124: 30, 127: 5 },
        materiales: [
            { materialId: 1, cantidad: 35 },
            { materialId: 71, cantidad: 6 },
            { materialId: 76, cantidad: 8 },
            { materialId: 118, cantidad: 3 },
            { materialId: 124, cantidad: 30 },
            { materialId: 127, cantidad: 5 }
        ]
    },
    'reparacion_puente_vehicular': {
        clave: 'reparacion_puente_vehicular',
        nombre: 'Reparación puente vial',
        iconoId: 'muro',
        descripcion: 'Restauración de defensas flex-beam, juntas de dilatación y asfalto.',
        supuestos: '8 tramos defensas flex-beam, 6 tiras junta de dilatación y 12 toneladas asfalto caliente.',
        cantidades: { 8: 12, 100: 2, 108: 6, 115: 8 },
        materiales: [
            { materialId: 8, cantidad: 12 },
            { materialId: 100, cantidad: 2 },
            { materialId: 108, cantidad: 6 },
            { materialId: 115, cantidad: 8 }
        ]
    },
    'planta_electrica_comercial': {
        clave: 'planta_electrica_comercial',
        nombre: 'Caseta planta eléctrica',
        iconoId: 'rayo',
        descripcion: 'Caseta de mampostería para generador auxiliar y tablero de transferencia.',
        supuestos: '220 bloques arcilla, 30 sacos cemento, 25m cable TTU 2/0 y breaker 2P.',
        cantidades: { 1: 30, 2: 12, 3: 220, 48: 25, 55: 2 },
        materiales: [
            { materialId: 1, cantidad: 30 },
            { materialId: 2, cantidad: 12 },
            { materialId: 3, cantidad: 220 },
            { materialId: 48, cantidad: 25 },
            { materialId: 55, cantidad: 2 }
        ]
    },
    'pintura_general_edificio': {
        clave: 'pintura_general_edificio',
        nombre: 'Pintura edificio 4 pisos',
        iconoId: 'edificio',
        descripcion: 'Pintura y revestimiento exterior con andamios y fondo anticorrosivo.',
        supuestos: '12 cuñetes pintura elastomérica, 4 galones anticorrosivo, rodillos y alquiler de andamios.',
        cantidades: { 117: 12, 119: 4, 122: 8, 123: 6, 142: 10 },
        materiales: [
            { materialId: 117, cantidad: 12 },
            { materialId: 119, cantidad: 4 },
            { materialId: 122, cantidad: 8 },
            { materialId: 123, cantidad: 6 },
            { materialId: 142, cantidad: 10 }
        ]
    },
    'cerramiento_perimetral_malla': {
        clave: 'cerramiento_perimetral_malla',
        nombre: 'Cerca de malla ciclón 100m',
        iconoId: 'muro',
        descripcion: 'Cerramiento con tubos galvanizados, malla electrosoldada y poyos de concreto.',
        supuestos: '18 tubos estructurales, 6 rollos malla electrosoldada, alambre dulce y cemento.',
        cantidades: { 1: 25, 11: 8, 14: 6, 20: 18 },
        materiales: [
            { materialId: 1, cantidad: 25 },
            { materialId: 11, cantidad: 8 },
            { materialId: 14, cantidad: 6 },
            { materialId: 20, cantidad: 18 }
        ]
    },
    'pasarela_urbana_metalica': {
        clave: 'pasarela_urbana_metalica',
        nombre: 'Pasarela urbana techada',
        iconoId: 'calle',
        descripcion: 'Cruce peatonal elevado con cubierta de acerolit y luminarias LED.',
        supuestos: '4 vigas IPE 160, 12 tubos Conduven, 14 láminas acerolit y 4 reflectores LED.',
        cantidades: { 5: 4, 18: 4, 20: 12, 23: 14, 119: 3 },
        materiales: [
            { materialId: 5, cantidad: 4 },
            { materialId: 18, cantidad: 4 },
            { materialId: 20, cantidad: 12 },
            { materialId: 23, cantidad: 14 },
            { materialId: 119, cantidad: 3 }
        ]
    }
};

// ============================================================
// 2. DATOS INICIALES DE DEMOSTRACIÓN
// ============================================================

/**
 * Función auxiliar para formatear enteros con cero inicial en ES5.
 * @param {number} num - Número.
 * @returns {string} Con dos dígitos.
 */
function _padCero(num) {
    return num < 10 ? '0' + num : String(num);
}

/**
 * Genera una fecha relativa a hoy para mantener la coherencia temporal de la demostración.
 * @param {number} diasAtras - Cantidad de días de antigüedad.
 * @param {string} [hora] - Hora opcional HH:MM.
 * @returns {Object} { texto: 'DD/MM/AAAA HH:MM', iso: 'YYYY-MM-DDTHH:MM:SS.000Z' }
 */
function generarFechaRelativa(diasAtras, hora) {
    var ahora = new Date();
    var objetivo = new Date(ahora.getTime() - diasAtras * 24 * 60 * 60 * 1000);
    var h = hora || '10:00';
    var partesHora = h.split(':');
    if (partesHora.length >= 2) {
        objetivo.setHours(parseInt(partesHora[0], 10), parseInt(partesHora[1], 10), 0, 0);
    }
    var dStr = _padCero(objetivo.getDate());
    var mStr = _padCero(objetivo.getMonth() + 1);
    var aStr = objetivo.getFullYear();
    return {
        texto: dStr + '/' + mStr + '/' + aStr + ' ' + h,
        iso: objetivo.toISOString()
    };
}

/**
 * 7 usuarios representativos con perfiles, estados, niveles y credenciales.
 * Incluye un segundo usuario de Gobernación para evitar autoaprobaciones.
 * ACLARATORIA DIDÁCTICA: En producción las contraseñas se almacenan con
 * funciones hash y salting en un servidor seguro; este arreglo es solo
 * para fines pedagógicos y de defensa académica.
 */
var USUARIOS_INICIALES = [
    {
        id: 1,
        usuario: 'alcaldia_libertador',
        clave: '1234',
        nombre: 'María González',
        perfil: 'Alcaldía',
        estado: 'Distrito Capital',
        ingresoMensual: 35000.00,
        nivel: 3,
        limiteGasto: 35000.00, // Presupuesto asignado
        gastadoInicial: 0.00,
        comprometidoInicial: 0.00,
        gastado: 4472.50,
        comprometido: 0.00,
        activo: true
    },
    {
        id: 2,
        usuario: 'constructora_valencia',
        clave: '1234',
        nombre: 'Carlos Rodríguez',
        perfil: 'Empresa',
        estado: 'Carabobo',
        ingresoMensual: 6000.00,
        nivel: 4,
        limiteGasto: 36000.00, // 6000 * 6.0
        gastadoInicial: 0.00,
        comprometidoInicial: 0.00,
        gastado: 0.00,
        comprometido: 4647.74,
        activo: true
    },
    {
        id: 3,
        usuario: 'maestro_martinez',
        clave: '1234',
        nombre: 'José Martínez',
        perfil: 'Constructor',
        estado: 'Zulia',
        ingresoMensual: 2200.00,
        nivel: 2,
        limiteGasto: 5500.00, // 2200 * 2.5
        gastadoInicial: 1200.00,
        comprometidoInicial: 0.00,
        gastado: 1200.00,
        comprometido: 0.00,
        activo: true
    },
    {
        id: 4,
        usuario: 'gobernacion_miranda',
        clave: 'admin123',
        nombre: 'Ing. Ana Pérez',
        perfil: 'Gobernación', // Supervisor / Aprobador 1
        estado: 'Miranda',
        ingresoMensual: 90000.00,
        nivel: 5,
        limiteGasto: 90000.00,
        gastadoInicial: 0.00,
        comprometidoInicial: 0.00,
        gastado: 0.00,
        comprometido: 0.00,
        activo: true
    },
    {
        id: 5,
        usuario: 'vialidad_merida',
        clave: '1234',
        nombre: 'Luis Hernández',
        perfil: 'Empresa',
        estado: 'Mérida',
        ingresoMensual: 4500.00,
        nivel: 1,
        limiteGasto: 6750.00, // 4500 * 1.5
        gastadoInicial: 5800.00,
        comprometidoInicial: 400.00,
        gastado: 5800.00,
        comprometido: 400.00, // Supera el 90% (Alerta crítica)
        activo: true
    },
    {
        id: 6,
        usuario: 'alcaldia_iribarren',
        clave: '1234',
        nombre: 'Pedro Castillo',
        perfil: 'Alcaldía',
        estado: 'Lara',
        ingresoMensual: 20000.00,
        nivel: 2,
        limiteGasto: 20000.00,
        gastadoInicial: 2000.00,
        comprometidoInicial: 0.00,
        gastado: 2000.00,
        comprometido: 0.00,
        activo: true
    },
    {
        id: 7,
        usuario: 'gobernacion_zulia',
        clave: 'admin123',
        nombre: 'Ing. Marcos Rivas',
        perfil: 'Gobernación', // Supervisor / Aprobador 2
        estado: 'Zulia',
        ingresoMensual: 90000.00,
        nivel: 5,
        limiteGasto: 90000.00,
        gastadoInicial: 0.00,
        comprometidoInicial: 0.00,
        gastado: 0.00,
        comprometido: 0.00,
        activo: true
    },
    {
        id: 8,
        usuario: 'comuna_panamericana',
        clave: '1234',
        nombre: 'Elena Blanco',
        perfil: 'Constructor',
        estado: 'Táchira',
        ingresoMensual: 1800.00,
        nivel: 2,
        limiteGasto: 4500.00,
        gastadoInicial: 0.00,
        comprometidoInicial: 0.00,
        gastado: 0.00,
        comprometido: 0.00,
        activo: true
    },
    {
        id: 9,
        usuario: 'gobernacion_carabobo',
        clave: 'admin123',
        nombre: 'Ing. Elena Blanco',
        perfil: 'Gobernación',
        estado: 'Carabobo',
        ingresoMensual: 90000.00,
        nivel: 5,
        limiteGasto: 90000.00,
        gastadoInicial: 0.00,
        comprometidoInicial: 0.00,
        gastado: 0.00,
        comprometido: 0.00,
        activo: true
    },
    {
        id: 10,
        usuario: 'gobernacion_anzoategui',
        clave: 'admin123',
        nombre: 'Ing. Rafael Sosa',
        perfil: 'Gobernación',
        estado: 'Anzoátegui',
        ingresoMensual: 90000.00,
        nivel: 5,
        limiteGasto: 90000.00,
        gastadoInicial: 0.00,
        comprometidoInicial: 0.00,
        gastado: 0.00,
        comprometido: 0.00,
        activo: true
    }
];

/**
 * Catálogo base de materiales con sectores e historial de auditoría de precio.
 */
var MATERIALES_INICIALES = [
    {
        id: 1,
        nombre: 'Cemento Portland Tipo I',
        sector: 'Construcción',
        unidad: 'Saco 42.5 kg',
        precioBase: 8.50,
        pesoKg: 42.5,
        permiteDecimales: false,
        activo: true,
        historialPrecios: [
            { fecha: '15/09/2024 10:00', precioAnterior: 8.00, precioNuevo: 8.50, usuario: 'Ing. Ana Pérez' }
        ]
    },
    {
        id: 2,
        nombre: 'Cabilla Estriada 1/2 pulgada',
        sector: 'Construcción',
        unidad: 'Barra 12m',
        precioBase: 12.00,
        pesoKg: 11.9,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 3,
        nombre: 'Bloque de Arcilla 15cm',
        sector: 'Construcción',
        unidad: 'Unidad',
        precioBase: 0.85,
        pesoKg: 6.5,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 4,
        nombre: 'Cable Eléctrico THW #12',
        sector: 'Energía',
        unidad: 'Metro',
        precioBase: 2.30,
        pesoKg: 0.05,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 5,
        nombre: 'Luminaria LED Vial 100W',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 45.00,
        pesoKg: 2.8,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 6,
        nombre: 'Panel Solar Monocristalino 450W',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 180.00,
        pesoKg: 21.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 7,
        nombre: 'Tubería PVC Presión 2 pulgadas',
        sector: 'Agua',
        unidad: 'Tubo 6m',
        precioBase: 14.50,
        pesoKg: 3.2,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 8,
        nombre: 'Mezcla Asfáltica en Caliente',
        sector: 'Vialidad',
        unidad: 'Tonelada',
        precioBase: 95.00,
        pesoKg: 1000.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 9,
        nombre: 'Arena Lavada de Río',
        sector: 'Construcción',
        unidad: 'M³',
        precioBase: 25.00,
        pesoKg: 1400.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 10,
        nombre: 'Piedra Picada 3/4"',
        sector: 'Construcción',
        unidad: 'M³',
        precioBase: 28.00,
        pesoKg: 1500.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 11,
        nombre: 'Alambre Dulce Galvanizado #18',
        sector: 'Construcción',
        unidad: 'Kg',
        precioBase: 3.20,
        pesoKg: 1.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 12,
        nombre: 'Cabilla Estriada 3/8"',
        sector: 'Construcción',
        unidad: 'Barra 12m',
        precioBase: 8.50,
        pesoKg: 6.7,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 13,
        nombre: 'Cabilla Estriada 5/8"',
        sector: 'Construcción',
        unidad: 'Barra 12m',
        precioBase: 18.50,
        pesoKg: 18.6,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 14,
        nombre: 'Malla Electrosoldada 4x4',
        sector: 'Construcción',
        unidad: 'Rollo 50m²',
        precioBase: 75.00,
        pesoKg: 45.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 15,
        nombre: 'Bloque de Concreto 15cm',
        sector: 'Construcción',
        unidad: 'Unidad',
        precioBase: 0.95,
        pesoKg: 12.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 16,
        nombre: 'Bloque de Arcilla 10cm',
        sector: 'Construcción',
        unidad: 'Unidad',
        precioBase: 0.70,
        pesoKg: 4.8,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 17,
        nombre: 'Viga IPE 140',
        sector: 'Construcción',
        unidad: 'Barra 12m',
        precioBase: 145.00,
        pesoKg: 154.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 18,
        nombre: 'Viga IPE 160',
        sector: 'Construcción',
        unidad: 'Barra 12m',
        precioBase: 185.00,
        pesoKg: 189.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 19,
        nombre: 'Tubo Estructural 100x100mm e=3mm',
        sector: 'Construcción',
        unidad: 'Tubo 6m',
        precioBase: 58.00,
        pesoKg: 52.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 20,
        nombre: 'Tubo Estructural Conduven 80x40mm',
        sector: 'Construcción',
        unidad: 'Tubo 6m',
        precioBase: 32.00,
        pesoKg: 24.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 21,
        nombre: 'Lámina Losacero e=0.75mm',
        sector: 'Construcción',
        unidad: 'M²',
        precioBase: 14.50,
        pesoKg: 7.8,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 22,
        nombre: 'Lámina de Zinc Ondulada 3.66m',
        sector: 'Construcción',
        unidad: 'Lámina',
        precioBase: 11.50,
        pesoKg: 6.2,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 23,
        nombre: 'Lámina Acerolit 3.66m',
        sector: 'Construcción',
        unidad: 'Lámina',
        precioBase: 28.00,
        pesoKg: 8.5,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 24,
        nombre: 'Cemento Blanco',
        sector: 'Construcción',
        unidad: 'Saco 40 kg',
        precioBase: 16.50,
        pesoKg: 40.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 25,
        nombre: 'Pego Gris Estándar',
        sector: 'Construcción',
        unidad: 'Saco 15 kg',
        precioBase: 4.20,
        pesoKg: 15.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 26,
        nombre: 'Pego Blanco para Porcelanato',
        sector: 'Construcción',
        unidad: 'Saco 15 kg',
        precioBase: 7.50,
        pesoKg: 15.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 27,
        nombre: 'Polvo de Piedra',
        sector: 'Construcción',
        unidad: 'M³',
        precioBase: 22.00,
        pesoKg: 1350.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 28,
        nombre: 'Madera para Encofrado Tablas 3m',
        sector: 'Construcción',
        unidad: 'Pieza',
        precioBase: 6.50,
        pesoKg: 8.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 29,
        nombre: 'Tirantes de Madera 2x4 3m',
        sector: 'Construcción',
        unidad: 'Pieza',
        precioBase: 8.00,
        pesoKg: 9.5,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 30,
        nombre: 'Puntal Metálico Telescópico 3m',
        sector: 'Construcción',
        unidad: 'Unidad',
        precioBase: 24.00,
        pesoKg: 10.5,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 31,
        nombre: 'Clavos de Acero con Cabeza 3"',
        sector: 'Construcción',
        unidad: 'Kg',
        precioBase: 3.50,
        pesoKg: 1.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 32,
        nombre: 'Impermeabilizante Asfáltico Base Solvente',
        sector: 'Construcción',
        unidad: 'Cuñete 5 Gal',
        precioBase: 38.00,
        pesoKg: 20.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 33,
        nombre: 'Manto Asfáltico 3mm Arenado',
        sector: 'Construcción',
        unidad: 'Rollo 10m²',
        precioBase: 36.00,
        pesoKg: 32.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 34,
        nombre: 'Primer Asfáltico de Adherencia',
        sector: 'Construcción',
        unidad: 'Cuñete 5 Gal',
        precioBase: 32.00,
        pesoKg: 18.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 35,
        nombre: 'Yeso para Construcción',
        sector: 'Construcción',
        unidad: 'Saco 20 kg',
        precioBase: 5.50,
        pesoKg: 20.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 36,
        nombre: 'Cal Hidratada',
        sector: 'Construcción',
        unidad: 'Saco 20 kg',
        precioBase: 4.80,
        pesoKg: 20.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 37,
        nombre: "Concreto Premezclado f'c=250 kg/cm²",
        sector: 'Construcción',
        unidad: 'M³',
        precioBase: 115.00,
        pesoKg: 2400.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 38,
        nombre: "Concreto Premezclado f'c=210 kg/cm²",
        sector: 'Construcción',
        unidad: 'M³',
        precioBase: 105.00,
        pesoKg: 2350.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 39,
        nombre: 'Bloque de Ventilación Arcilla',
        sector: 'Construcción',
        unidad: 'Unidad',
        precioBase: 1.40,
        pesoKg: 4.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 40,
        nombre: 'Tablero OSB 12mm 1.22x2.44m',
        sector: 'Construcción',
        unidad: 'Lámina',
        precioBase: 22.00,
        pesoKg: 22.5,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 41,
        nombre: 'Teja Criolla de Arcilla',
        sector: 'Construcción',
        unidad: 'Unidad',
        precioBase: 0.65,
        pesoKg: 1.8,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 42,
        nombre: 'Grava Lavada 1/2"',
        sector: 'Construcción',
        unidad: 'M³',
        precioBase: 26.00,
        pesoKg: 1450.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 43,
        nombre: 'Polietileno Negro para Losa Calibre 600',
        sector: 'Construcción',
        unidad: 'M²',
        precioBase: 1.20,
        pesoKg: 0.15,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 44,
        nombre: 'Aditivo Plastificante para Concreto',
        sector: 'Construcción',
        unidad: 'Galón',
        precioBase: 12.00,
        pesoKg: 4.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 45,
        nombre: 'Esparrago Roscado Galvanizado 1/2"x3m',
        sector: 'Construcción',
        unidad: 'Barra',
        precioBase: 9.50,
        pesoKg: 3.2,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 46,
        nombre: 'Cable Cobre THW #10',
        sector: 'Energía',
        unidad: 'Metro',
        precioBase: 3.10,
        pesoKg: 0.08,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 47,
        nombre: 'Cable Cobre THW #8',
        sector: 'Energía',
        unidad: 'Metro',
        precioBase: 4.80,
        pesoKg: 0.12,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 48,
        nombre: 'Cable Cobre TTU 2/0',
        sector: 'Energía',
        unidad: 'Metro',
        precioBase: 14.50,
        pesoKg: 0.45,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 49,
        nombre: 'Conductor Concentrico 2x8 AWG',
        sector: 'Energía',
        unidad: 'Metro',
        precioBase: 5.20,
        pesoKg: 0.18,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 50,
        nombre: 'Tubería EMT Conduit 3/4"',
        sector: 'Energía',
        unidad: 'Tubo 3m',
        precioBase: 6.50,
        pesoKg: 2.1,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 51,
        nombre: 'Tubería EMT Conduit 1"',
        sector: 'Energía',
        unidad: 'Tubo 3m',
        precioBase: 9.20,
        pesoKg: 2.9,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 52,
        nombre: 'Tablero Eléctrico Residencial 8 Circuitos',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 35.00,
        pesoKg: 4.2,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 53,
        nombre: 'Tablero Eléctrico Industrial 24 Circuitos',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 120.00,
        pesoKg: 14.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 54,
        nombre: 'Interruptor Termomagnético 1P 20A',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 4.50,
        pesoKg: 0.2,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 55,
        nombre: 'Interruptor Termomagnético 2P 40A',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 11.00,
        pesoKg: 0.35,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 56,
        nombre: 'Tomacorriente Doble con Tierra 120V',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 2.80,
        pesoKg: 0.15,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 57,
        nombre: 'Interruptor Sencillo 15A',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 2.20,
        pesoKg: 0.12,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 58,
        nombre: 'Reflector LED 200W Exterior IP66',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 38.00,
        pesoKg: 3.5,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 59,
        nombre: 'Lámpara Tubo LED T8 18W',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 3.80,
        pesoKg: 0.3,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 60,
        nombre: 'Poste Metálico Tubular 6m para Alumbrado',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 110.00,
        pesoKg: 48.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 61,
        nombre: 'Brazo Metálico Galvanizado 1.5m para Luminaria',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 18.00,
        pesoKg: 4.5,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 62,
        nombre: 'Transformador Monofásico 25 kVA 13.8kV',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 1450.00,
        pesoKg: 160.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 63,
        nombre: 'Cortacorriente 15 kV con Fusible',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 65.00,
        pesoKg: 5.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 64,
        nombre: 'Pararrayos Distribución Polimérico 12 kV',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 55.00,
        pesoKg: 3.8,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 65,
        nombre: 'Inversor Solar Onda Pura 3 kW 24V',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 380.00,
        pesoKg: 8.5,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 66,
        nombre: 'Inversor Solar Onda Pura 5 kW 48V',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 620.00,
        pesoKg: 13.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 67,
        nombre: 'Batería Ciclo Profundo Gel 12V 200Ah',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 290.00,
        pesoKg: 58.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 68,
        nombre: 'Regulador de Carga Solar MPPT 60A',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 115.00,
        pesoKg: 2.5,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 69,
        nombre: 'Barra Cooperweld Puesta a Tierra 5/8"x2.4m',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 22.00,
        pesoKg: 3.8,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 70,
        nombre: 'Fotocelda Electrónica 120V/220V con Base',
        sector: 'Energía',
        unidad: 'Unidad',
        precioBase: 8.50,
        pesoKg: 0.25,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 71,
        nombre: 'Tubería PVC Presión 1/2"',
        sector: 'Agua',
        unidad: 'Tubo 6m',
        precioBase: 4.80,
        pesoKg: 1.1,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 72,
        nombre: 'Tubería PVC Presión 3/4"',
        sector: 'Agua',
        unidad: 'Tubo 6m',
        precioBase: 6.20,
        pesoKg: 1.5,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 73,
        nombre: 'Tubería PVC Presión 1"',
        sector: 'Agua',
        unidad: 'Tubo 6m',
        precioBase: 8.50,
        pesoKg: 2.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 74,
        nombre: 'Tubería PVC Presión 3"',
        sector: 'Agua',
        unidad: 'Tubo 6m',
        precioBase: 22.00,
        pesoKg: 5.5,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 75,
        nombre: 'Tubería PVC Presión 4"',
        sector: 'Agua',
        unidad: 'Tubo 6m',
        precioBase: 34.00,
        pesoKg: 8.2,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 76,
        nombre: 'Tubería PVC Sanitaria 2" para Desagüe',
        sector: 'Agua',
        unidad: 'Tubo 3m',
        precioBase: 7.50,
        pesoKg: 1.8,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 77,
        nombre: 'Tubería PVC Sanitaria 4" para Aguas Negras',
        sector: 'Agua',
        unidad: 'Tubo 3m',
        precioBase: 14.00,
        pesoKg: 3.9,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 78,
        nombre: 'Tubería PEAD Polietileno 1" PN10',
        sector: 'Agua',
        unidad: 'Metro',
        precioBase: 1.80,
        pesoKg: 0.25,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 79,
        nombre: 'Codo PVC Presión 1/2" x 90°',
        sector: 'Agua',
        unidad: 'Unidad',
        precioBase: 0.60,
        pesoKg: 0.05,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 80,
        nombre: 'Codo PVC Presión 2" x 90°',
        sector: 'Agua',
        unidad: 'Unidad',
        precioBase: 2.20,
        pesoKg: 0.18,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 81,
        nombre: 'Llave de Paso Esférica Bronce 1/2"',
        sector: 'Agua',
        unidad: 'Unidad',
        precioBase: 6.50,
        pesoKg: 0.35,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 82,
        nombre: 'Llave de Paso Esférica Bronce 2"',
        sector: 'Agua',
        unidad: 'Unidad',
        precioBase: 28.00,
        pesoKg: 1.4,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 83,
        nombre: 'Válvula Check de Retención 2"',
        sector: 'Agua',
        unidad: 'Unidad',
        precioBase: 32.00,
        pesoKg: 1.8,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 84,
        nombre: 'Soldadura Líquida para PVC (Pega) 1/4 Galón',
        sector: 'Agua',
        unidad: 'Unidad',
        precioBase: 12.00,
        pesoKg: 1.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 85,
        nombre: 'Limpiador Químico para PVC 1/4 Galón',
        sector: 'Agua',
        unidad: 'Unidad',
        precioBase: 8.00,
        pesoKg: 0.9,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 86,
        nombre: 'Tanque Cilíndrico de Agua 1000L Polietileno',
        sector: 'Agua',
        unidad: 'Unidad',
        precioBase: 95.00,
        pesoKg: 22.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 87,
        nombre: 'Tanque Cilíndrico de Agua 2000L Reforzado',
        sector: 'Agua',
        unidad: 'Unidad',
        precioBase: 175.00,
        pesoKg: 42.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 88,
        nombre: 'Bomba Centrífuga de Agua 0.5 HP 110V',
        sector: 'Agua',
        unidad: 'Unidad',
        precioBase: 65.00,
        pesoKg: 8.5,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 89,
        nombre: 'Bomba Centrífuga de Agua 1.0 HP 110/220V',
        sector: 'Agua',
        unidad: 'Unidad',
        precioBase: 110.00,
        pesoKg: 13.5,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 90,
        nombre: 'Bomba Sumergible de Pozo Profundo 2 HP',
        sector: 'Agua',
        unidad: 'Unidad',
        precioBase: 280.00,
        pesoKg: 18.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 91,
        nombre: 'Sistema Hidroneumático Tanque Membrana 24L',
        sector: 'Agua',
        unidad: 'Unidad',
        precioBase: 140.00,
        pesoKg: 15.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 92,
        nombre: 'Filtro de Agua Sedimentador 10"',
        sector: 'Agua',
        unidad: 'Unidad',
        precioBase: 22.00,
        pesoKg: 1.2,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 93,
        nombre: 'Flotante Mecánico de Bronce 1/2" para Tanque',
        sector: 'Agua',
        unidad: 'Unidad',
        precioBase: 7.50,
        pesoKg: 0.4,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 94,
        nombre: 'Cinta Teflón Industrial 3/4"',
        sector: 'Agua',
        unidad: 'Rollo',
        precioBase: 0.85,
        pesoKg: 0.02,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 95,
        nombre: 'Tapa de Registro Sanitario PVC 4"',
        sector: 'Agua',
        unidad: 'Unidad',
        precioBase: 3.20,
        pesoKg: 0.25,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 96,
        nombre: 'Imprimación Asfáltica RC-250',
        sector: 'Vialidad',
        unidad: 'Tambor 200L',
        precioBase: 160.00,
        pesoKg: 205.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 97,
        nombre: 'Asfalto Líquido RC-2',
        sector: 'Vialidad',
        unidad: 'Galón',
        precioBase: 4.50,
        pesoKg: 3.8,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 98,
        nombre: 'Cemento Asfáltico AC-20',
        sector: 'Vialidad',
        unidad: 'Tonelada',
        precioBase: 120.00,
        pesoKg: 1000.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 99,
        nombre: 'Pintura para Tráfico Amarilla Base Solvente',
        sector: 'Vialidad',
        unidad: 'Cuñete 5 Gal',
        precioBase: 65.00,
        pesoKg: 25.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 100,
        nombre: 'Pintura para Tráfico Blanca Reflectiva',
        sector: 'Vialidad',
        unidad: 'Cuñete 5 Gal',
        precioBase: 65.00,
        pesoKg: 25.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 101,
        nombre: 'Microesferas de Vidrio para Tráfico',
        sector: 'Vialidad',
        unidad: 'Saco 25 kg',
        precioBase: 32.00,
        pesoKg: 25.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 102,
        nombre: 'Tachas Reflectivas Viales (Ojos de Gato)',
        sector: 'Vialidad',
        unidad: 'Unidad',
        precioBase: 2.50,
        pesoKg: 0.35,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 103,
        nombre: 'Reductor de Velocidad Caucho Reciclado 1m',
        sector: 'Vialidad',
        unidad: 'Módulo',
        precioBase: 28.00,
        pesoKg: 12.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 104,
        nombre: 'Brocal de Concreto Prefabricado Tipo A',
        sector: 'Vialidad',
        unidad: 'Metro',
        precioBase: 9.50,
        pesoKg: 75.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 105,
        nombre: 'Base Granular Integral Picada',
        sector: 'Vialidad',
        unidad: 'M³',
        precioBase: 22.00,
        pesoKg: 1600.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 106,
        nombre: 'Sub-Base Granular de Río',
        sector: 'Vialidad',
        unidad: 'M³',
        precioBase: 18.00,
        pesoKg: 1500.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 107,
        nombre: 'Geotextil No Tejido para Pavimentación',
        sector: 'Vialidad',
        unidad: 'M²',
        precioBase: 1.95,
        pesoKg: 0.2,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 108,
        nombre: 'Junta de Dilatación Asfáltica Premoldeada',
        sector: 'Vialidad',
        unidad: 'Tira 3m',
        precioBase: 6.00,
        pesoKg: 2.5,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 109,
        nombre: 'Señal Vial Reglamentaria Reflectiva Grado Ingeniería',
        sector: 'Vialidad',
        unidad: 'Unidad',
        precioBase: 45.00,
        pesoKg: 4.2,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 110,
        nombre: 'Señal Vial Preventiva Amarilla 60x60cm',
        sector: 'Vialidad',
        unidad: 'Unidad',
        precioBase: 42.00,
        pesoKg: 3.8,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 111,
        nombre: 'Tapa Boca de Visita en Hierro Dúctil',
        sector: 'Vialidad',
        unidad: 'Unidad',
        precioBase: 120.00,
        pesoKg: 45.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 112,
        nombre: 'Rejilla Sumidero de Aguas Pluviales Acero',
        sector: 'Vialidad',
        unidad: 'Unidad',
        precioBase: 85.00,
        pesoKg: 30.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 113,
        nombre: 'Gavión Metálico Triple Torsión 2x1x1m',
        sector: 'Vialidad',
        unidad: 'Unidad',
        precioBase: 38.00,
        pesoKg: 14.5,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 114,
        nombre: 'Piedra Bruta para Gaviones y Defensas',
        sector: 'Vialidad',
        unidad: 'M³',
        precioBase: 20.00,
        pesoKg: 1650.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 115,
        nombre: 'Defensa Metálica Galvanizada Tipo Flex-Beam 3.8m',
        sector: 'Vialidad',
        unidad: 'Tramo',
        precioBase: 68.00,
        pesoKg: 48.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 116,
        nombre: 'Pintura Caucho Mate para Interiores Blanco',
        sector: 'Acabados',
        unidad: 'Cuñete 5 Gal',
        precioBase: 42.00,
        pesoKg: 22.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 117,
        nombre: 'Pintura Elastomérica para Fachadas Exteriores',
        sector: 'Acabados',
        unidad: 'Cuñete 5 Gal',
        precioBase: 62.00,
        pesoKg: 24.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 118,
        nombre: 'Pintura Esmalte Sintético Brillante',
        sector: 'Acabados',
        unidad: 'Galón',
        precioBase: 16.50,
        pesoKg: 4.5,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 119,
        nombre: 'Fondo Anticorrosivo Cromato de Zinc',
        sector: 'Acabados',
        unidad: 'Galón',
        precioBase: 15.00,
        pesoKg: 4.4,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 120,
        nombre: 'Fondo de Herrería Gris/Negro',
        sector: 'Acabados',
        unidad: 'Galón',
        precioBase: 13.50,
        pesoKg: 4.3,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 121,
        nombre: 'Pasta Profesional para Drywall y Muros',
        sector: 'Acabados',
        unidad: 'Cuñete 5 Gal',
        precioBase: 24.00,
        pesoKg: 28.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 122,
        nombre: 'Rodillo de Felpa para Pintar 9"',
        sector: 'Acabados',
        unidad: 'Unidad',
        precioBase: 4.20,
        pesoKg: 0.3,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 123,
        nombre: 'Brocha de Cerdas 4" Profesional',
        sector: 'Acabados',
        unidad: 'Unidad',
        precioBase: 3.50,
        pesoKg: 0.15,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 124,
        nombre: 'Cerámica Esmaltada para Pisos 40x40cm',
        sector: 'Acabados',
        unidad: 'M²',
        precioBase: 9.50,
        pesoKg: 14.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 125,
        nombre: 'Porcelanato Pulido Rectificado 60x60cm',
        sector: 'Acabados',
        unidad: 'M²',
        precioBase: 16.00,
        pesoKg: 20.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 126,
        nombre: 'Rodapié Cerámico 8x40cm',
        sector: 'Acabados',
        unidad: 'Pieza',
        precioBase: 0.85,
        pesoKg: 0.6,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 127,
        nombre: 'Fraguador Impermeable con Sellador',
        sector: 'Acabados',
        unidad: 'Bolsa 2 kg',
        precioBase: 2.50,
        pesoKg: 2.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 128,
        nombre: 'Lámina de Drywall Yeso Standard 1/2" 1.22x2.44m',
        sector: 'Acabados',
        unidad: 'Lámina',
        precioBase: 11.50,
        pesoKg: 24.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 129,
        nombre: 'Perfil Metálico Omega Montante Drywall',
        sector: 'Acabados',
        unidad: 'Unidad',
        precioBase: 3.20,
        pesoKg: 1.2,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 130,
        nombre: 'Cinta de Papel Microperforada para Drywall',
        sector: 'Acabados',
        unidad: 'Rollo 75m',
        precioBase: 4.50,
        pesoKg: 0.6,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 131,
        nombre: 'Puerta Entamborada Madera MDF 0.80x2.10m',
        sector: 'Acabados',
        unidad: 'Unidad',
        precioBase: 42.00,
        pesoKg: 16.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 132,
        nombre: 'Cerradura de Pomo Cilindro Acero Inox',
        sector: 'Acabados',
        unidad: 'Unidad',
        precioBase: 12.50,
        pesoKg: 0.8,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 133,
        nombre: 'Ventana Panorámica Aluminio Blanco 1.00x1.00m',
        sector: 'Acabados',
        unidad: 'Unidad',
        precioBase: 55.00,
        pesoKg: 11.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 134,
        nombre: 'Inodoro Sanitario Cerámico Blanco con Herraje',
        sector: 'Acabados',
        unidad: 'Unidad',
        precioBase: 68.00,
        pesoKg: 26.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 135,
        nombre: 'Lavamanos Cerámico de Colgar Blanco',
        sector: 'Acabados',
        unidad: 'Unidad',
        precioBase: 34.00,
        pesoKg: 12.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 136,
        nombre: 'Mezcladora de Concreto Portátil 1 Saco Trompo',
        sector: 'Equipos',
        unidad: 'Día/Alquiler',
        precioBase: 25.00,
        pesoKg: 180.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 137,
        nombre: 'Vibrador de Concreto Eléctrico 2 HP con Manguera',
        sector: 'Equipos',
        unidad: 'Día/Alquiler',
        precioBase: 18.00,
        pesoKg: 16.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 138,
        nombre: 'Compactadora Tipo Rana / Canguro Gasolina',
        sector: 'Equipos',
        unidad: 'Día/Alquiler',
        precioBase: 30.00,
        pesoKg: 75.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 139,
        nombre: 'Generador Eléctrico a Gasolina 6.5 kVA',
        sector: 'Equipos',
        unidad: 'Día/Alquiler',
        precioBase: 35.00,
        pesoKg: 85.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 140,
        nombre: 'Soldadora Inverter 200A 110/220V',
        sector: 'Equipos',
        unidad: 'Día/Alquiler',
        precioBase: 15.00,
        pesoKg: 8.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 141,
        nombre: 'Cortadora de Concreto y Asfalto Disco Diamante',
        sector: 'Equipos',
        unidad: 'Día/Alquiler',
        precioBase: 40.00,
        pesoKg: 95.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 142,
        nombre: 'Andamio Metálico Tubular Tubo 2"',
        sector: 'Equipos',
        unidad: 'Cuerpo 2x1.5m',
        precioBase: 12.00,
        pesoKg: 36.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 143,
        nombre: 'Bomba de Achique de Agua Sucia Gasolina 3"',
        sector: 'Equipos',
        unidad: 'Día/Alquiler',
        precioBase: 22.00,
        pesoKg: 42.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 144,
        nombre: 'Retroexcavadora Cargadora 4x4',
        sector: 'Equipos',
        unidad: 'Hora/Máquina',
        precioBase: 65.00,
        pesoKg: 7500.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 145,
        nombre: 'Camión Volteo 8 M³',
        sector: 'Equipos',
        unidad: 'Viaje Urbano',
        precioBase: 50.00,
        pesoKg: 12000.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 146,
        nombre: 'Motoniveladora Vial 140H',
        sector: 'Equipos',
        unidad: 'Hora/Máquina',
        precioBase: 85.00,
        pesoKg: 14000.0,
        permiteDecimales: true,
        activo: true,
        historialPrecios: []
    },
    {
        id: 147,
        nombre: 'Rodillo Compactador Doble Tambor 2.5t',
        sector: 'Equipos',
        unidad: 'Día/Alquiler',
        precioBase: 90.00,
        pesoKg: 2500.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 148,
        nombre: 'Compresor de Aire Neumático con Martillo Demoledor',
        sector: 'Equipos',
        unidad: 'Día/Alquiler',
        precioBase: 55.00,
        pesoKg: 450.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 149,
        nombre: 'Teodolito y Nivel Óptico de Precisión',
        sector: 'Equipos',
        unidad: 'Día/Alquiler',
        precioBase: 20.00,
        pesoKg: 7.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    },
    {
        id: 150,
        nombre: 'Carretilla de Construcción Tolva Metálica Reforzada',
        sector: 'Equipos',
        unidad: 'Unidad',
        precioBase: 45.00,
        pesoKg: 14.0,
        permiteDecimales: false,
        activo: true,
        historialPrecios: []
    }
];

/**
 * Fechas relativas a hoy para garantizar coherencia en la demostración.
 */
var _fDemoCot1 = generarFechaRelativa(12, '09:30');
var _fDemoCot1Aprob = generarFechaRelativa(12, '11:00');
var _fDemoCot1Entreg = generarFechaRelativa(10, '16:00');
var _fDemoCot2 = generarFechaRelativa(3, '14:15');
var _fDemoCot2Aprob = generarFechaRelativa(3, '16:20');
var _fDemoCot3 = generarFechaRelativa(20, '10:00');
var _fDemoCot3Aprob = generarFechaRelativa(20, '11:30');
var _fDemoCot4 = generarFechaRelativa(1, '11:00');

/**
 * Cotizaciones iniciales para demostrar histórico y estados del flujo.
 */
var COTIZACIONES_INICIALES = [
    {
        id: 1,
        correlativo: 'COT-0001',
        usuarioId: 1,
        nombreCliente: 'María González',
        perfil: 'Alcaldía',
        estadoObra: 'Distrito Capital',
        ciudadCompra: 'Puerto Ordaz',
        factorCiudad: 0.90,
        factorFlete: 1.00,
        descuentoPct: 0.04,
        fechaCreacion: _fDemoCot1.texto,
        fechaISO: _fDemoCot1.iso,
        validezDias: 15,
        estado: 'ENTREGADA',
        tipoPlanFinanciamiento: 'cashea_3',
        items: [
            { materialId: 1, nombre: 'Cemento Portland Tipo I', cantidad: 300, precioUnitario: 7.65, total: 2295.00, sector: 'Construcción' },
            { materialId: 3, nombre: 'Bloque de Arcilla 15cm', cantidad: 2000, precioUnitario: 0.765, total: 1530.00, sector: 'Construcción' }
        ],
        subtotal: 3825.00,
        flete: 0.00,
        descuento: 153.00,
        neto: 3672.00,
        contingencia: 183.60,
        iva: 616.90,
        total: 4472.50,
        totalUSD: 4472.50,
        tasaBCV: TASA_BCV_INICIAL,
        totalBs: 4025250.00,
        motivoRechazo: ''
    },
    {
        id: 2,
        correlativo: 'COT-0002',
        usuarioId: 2,
        nombreCliente: 'Carlos Rodríguez',
        perfil: 'Empresa',
        estadoObra: 'Carabobo',
        ciudadCompra: 'Puerto Ordaz',
        factorCiudad: 0.90,
        factorFlete: 1.04,
        descuentoPct: 0.02,
        fechaCreacion: _fDemoCot2.texto,
        fechaISO: _fDemoCot2.iso,
        validezDias: 15,
        estado: 'APROBADA',
        tipoPlanFinanciamiento: 'quincenal_6',
        items: [
            { materialId: 2, nombre: 'Cabilla Estriada 1/2 pulgada', cantidad: 250, precioUnitario: 10.80, total: 2700.00, sector: 'Construcción' },
            { materialId: 7, nombre: 'Tubería PVC Presión 2 pulgadas', cantidad: 80, precioUnitario: 13.05, total: 1044.00, sector: 'Agua' }
        ],
        subtotal: 3744.00,
        flete: 149.76,
        descuento: 77.88,
        neto: 3815.88,
        contingencia: 190.79,
        iva: 641.07,
        total: 4647.74,
        totalUSD: 4647.74,
        tasaBCV: TASA_BCV_INICIAL,
        totalBs: 4182966.00,
        motivoRechazo: ''
    },
    {
        id: 3,
        correlativo: 'COT-0003',
        usuarioId: 5,
        nombreCliente: 'Luis Hernández',
        perfil: 'Empresa',
        estadoObra: 'Mérida',
        ciudadCompra: 'Puerto Ordaz',
        factorCiudad: 0.90,
        factorFlete: 1.00,
        descuentoPct: 0.02,
        fechaCreacion: _fDemoCot3.texto,
        fechaISO: _fDemoCot3.iso,
        validezDias: 15,
        estado: 'APROBADA',
        tipoPlanFinanciamiento: 'cashea_3',
        items: [
            { materialId: 8, nombre: 'Mezcla Asfáltica en Caliente', cantidad: 15, precioUnitario: 80.00, total: 1200.00, sector: 'Vialidad' },
            { materialId: 97, nombre: 'Asfalto Líquido RC-2', cantidad: 150, precioUnitario: 4.00, total: 600.00, sector: 'Vialidad' }
        ],
        subtotal: 1800.00,
        flete: 0.00,
        descuento: 0.00,
        neto: 1800.00,
        contingencia: 0.00,
        iva: 0.00,
        total: 1800.00,
        totalUSD: 1800.00,
        tasaBCV: TASA_BCV_INICIAL,
        totalBs: 1620000.00,
        motivoRechazo: ''
    },
    {
        id: 4,
        correlativo: 'COT-0004',
        usuarioId: 6,
        nombreCliente: 'Pedro Castillo',
        perfil: 'Alcaldía',
        estadoObra: 'Lara',
        ciudadCompra: 'Puerto Ordaz',
        factorCiudad: 0.90,
        factorFlete: 1.06,
        descuentoPct: 0.04,
        fechaCreacion: _fDemoCot4.texto,
        fechaISO: _fDemoCot4.iso,
        validezDias: 15,
        estado: 'ENVIADA',
        tipoPlanFinanciamiento: null,
        items: [
            { materialId: 5, nombre: 'Luminaria LED Vial 100W', cantidad: 40, precioUnitario: 40.50, total: 1620.00, sector: 'Energía' }
        ],
        subtotal: 1620.00,
        flete: 97.20,
        descuento: 68.69,
        neto: 1648.51,
        contingencia: 82.43,
        iva: 276.95,
        total: 2007.89,
        totalUSD: 2007.89,
        tasaBCV: TASA_BCV_INICIAL,
        totalBs: 1807101.00,
        motivoRechazo: ''
    }
];

/**
 * Bitácora inicial de auditoría.
 */
var BITACORA_INICIAL = [
    { fecha: _fDemoCot1.texto, usuario: 'María González', accion: 'COTIZACIÓN_CREADA', detalle: 'Creación de cotización COT-0001' },
    { fecha: _fDemoCot1Aprob.texto, usuario: 'Ing. Ana Pérez', accion: 'COTIZACIÓN_APROBADA', detalle: 'Aprobación de COT-0001 por USD 4,472.50' },
    { fecha: _fDemoCot1Entreg.texto, usuario: 'Ing. Ana Pérez', accion: 'COTIZACIÓN_ENTREGADA', detalle: 'Entrega final de COT-0001. Fondos transferidos a gastado.' },
    { fecha: _fDemoCot2.texto, usuario: 'Carlos Rodríguez', accion: 'COTIZACIÓN_CREADA', detalle: 'Creación de cotización COT-0002' },
    { fecha: _fDemoCot2Aprob.texto, usuario: 'Ing. Ana Pérez', accion: 'COTIZACIÓN_APROBADA', detalle: 'Aprobación de COT-0002 por USD 4,647.74' },
    { fecha: _fDemoCot3.texto, usuario: 'Luis Hernández', accion: 'COTIZACIÓN_CREADA', detalle: 'Creación de cotización COT-0003' },
    { fecha: _fDemoCot3Aprob.texto, usuario: 'Ing. Marcos Rivas', accion: 'COTIZACIÓN_APROBADA', detalle: 'Aprobación de COT-0003 por USD 1,800.00 con plan Cashea 3' },
    { fecha: _fDemoCot4.texto, usuario: 'Pedro Castillo', accion: 'COTIZACIÓN_CREADA', detalle: 'Creación y emisión de cotización COT-0004 por USD 2,007.89 (pendiente de revisión)' }
];

// ============================================================
// 2.2. SEMILLAS INSTITUCIONALES SICOP-VE 2.0
// ============================================================

var INSTITUCIONES_INICIALES = [
    { id: 1, codigo: 'GOB-MIR', nombre: 'Gobernación Bolivariana de Miranda', tipo: 'GOBERNACION', rif: 'G-20000142-1', direccion: 'Los Teques, Edif. Gubernamental', estado: 'Miranda', limitePresupuestario: 90000.00, activo: true },
    { id: 2, codigo: 'ALC-GUA', nombre: 'Alcaldía Bolivariana de Guarenas', tipo: 'ALCALDIA', rif: 'G-20004512-3', direccion: 'Plaza Bolívar de Guarenas', estado: 'Miranda', limitePresupuestario: 35000.00, activo: true },
    { id: 3, codigo: 'ALC-CHA', nombre: 'Alcaldía de Chacao', tipo: 'ALCALDIA', rif: 'G-20007891-2', direccion: 'Av. Venezuela, El Rosal', estado: 'Distrito Capital', limitePresupuestario: 45000.00, activo: true },
    { id: 4, codigo: 'ALC-MAR', nombre: 'Alcaldía de Maracaibo', tipo: 'ALCALDIA', rif: 'G-20001199-4', direccion: 'Casco Central de Maracaibo', estado: 'Zulia', limitePresupuestario: 50000.00, activo: true },
    { id: 5, codigo: 'EMP-VIAMER', nombre: 'Empresa de Vialidad Mérida (Viamer)', tipo: 'EMPRESA', rif: 'J-30441920-5', direccion: 'Av. Las Américas, Mérida', estado: 'Mérida', limitePresupuestario: 25000.00, activo: true },
    { id: 6, codigo: 'ALC-IRI', nombre: 'Alcaldía Bolivariana de Iribarren', tipo: 'ALCALDIA', rif: 'G-20003311-8', direccion: 'Carrera 17 con Calle 25, Barquisimeto', estado: 'Lara', limitePresupuestario: 40000.00, activo: true },
    { id: 7, codigo: 'GOB-SUC', nombre: 'Gobernación del Estado Sucre', tipo: 'GOBERNACION', rif: 'G-20000551-0', direccion: 'Cumaná, Calle Sucre', estado: 'Sucre', limitePresupuestario: 75000.00, activo: true },
    { id: 8, codigo: 'ALC-MCPO', nombre: 'Alcaldía de San Cristóbal', tipo: 'ALCALDIA', rif: 'G-20008812-7', direccion: 'Centro Cívico San Cristóbal', estado: 'Táchira', limitePresupuestario: 38000.00, activo: true },
    { id: 9, codigo: 'COM-PANAM', nombre: 'Comuna Panamericana 2026', tipo: 'CONSTRUCTOR', rif: 'J-50119922-3', direccion: 'Carretera Panamericana Km 18', estado: 'Miranda', limitePresupuestario: 15000.00, activo: true }
];

var PRESUPUESTOS_INICIALES = [
    { id: 1, institucionId: 1, nombreInstitucion: 'Gobernación Bolivariana de Miranda', anoFiscal: 2026, asignado: 90000.00, comprometido: 0.00, ejecutado: 0.00, umbralAlertaPct: 80.00, estado: 'ABIERTO' },
    { id: 2, institucionId: 2, nombreInstitucion: 'Alcaldía Bolivariana de Guarenas', anoFiscal: 2026, asignado: 35000.00, comprometido: 0.00, ejecutado: 4472.50, umbralAlertaPct: 75.00, estado: 'ABIERTO' },
    { id: 3, institucionId: 3, nombreInstitucion: 'Alcaldía de Chacao', anoFiscal: 2026, asignado: 45000.00, comprometido: 4647.74, ejecutado: 0.00, umbralAlertaPct: 80.00, estado: 'ABIERTO' },
    { id: 4, institucionId: 4, nombreInstitucion: 'Alcaldía de Maracaibo', anoFiscal: 2026, asignado: 50000.00, comprometido: 0.00, ejecutado: 0.00, umbralAlertaPct: 85.00, estado: 'ABIERTO' },
    { id: 5, institucionId: 5, nombreInstitucion: 'Empresa de Vialidad Mérida (Viamer)', anoFiscal: 2026, asignado: 25000.00, comprometido: 1800.00, ejecutado: 0.00, umbralAlertaPct: 70.00, estado: 'ABIERTO' },
    { id: 6, institucionId: 6, nombreInstitucion: 'Alcaldía Bolivariana de Iribarren', anoFiscal: 2026, asignado: 40000.00, comprometido: 2007.89, ejecutado: 0.00, umbralAlertaPct: 80.00, estado: 'ABIERTO' }
];

var PROYECTOS_INICIALES = [
    { id: 1, codigo: 'PRY-2026-001', institucionId: 2, nombre: 'Rehabilitación Módulo de Salud Trapichito', descripcion: 'Impermeabilización, sustitución de luminarias y adecuación sanitaria general.', estado: 'CULMINADA', estadoGeografico: 'Miranda', presupuestoUsd: 4472.50, avanceFisicoPct: 100, avanceFinancieroPct: 100, fechaInicio: '2026-01-15', fechaFinEstimada: '2026-03-30', ingenieroResponsable: 'Ing. Roberto Méndez', cotizacionAsociada: 'COT-0001' },
    { id: 2, codigo: 'PRY-2026-002', institucionId: 3, nombre: 'Canalización de Aguas Pluviales Av. Principal', descripcion: 'Drenajes profundos, tuberías corrugadas de 12 pulgadas y torrenteras de descarga.', estado: 'EN_EJECUCION', estadoGeografico: 'Distrito Capital', presupuestoUsd: 4647.74, avanceFisicoPct: 45, avanceFinancieroPct: 50, fechaInicio: '2026-02-01', fechaFinEstimada: '2026-05-15', ingenieroResponsable: 'Ing. Andrea Colmenares', cotizacionAsociada: 'COT-0002' },
    { id: 3, codigo: 'PRY-2026-003', institucionId: 5, nombre: 'Pavimentación Rígida Sector El Valle', descripcion: 'Colocación de losas de concreto armado con malla electrosoldada y cunetas laterales.', estado: 'EN_EJECUCION', estadoGeografico: 'Mérida', presupuestoUsd: 1800.00, avanceFisicoPct: 25, avanceFinancieroPct: 30, fechaInicio: '2026-02-20', fechaFinEstimada: '2026-06-10', ingenieroResponsable: 'Ing. Luis Hernández', cotizacionAsociada: 'COT-0003' },
    { id: 4, codigo: 'PRY-2026-004', institucionId: 6, nombre: 'Alumbrado Público y Vialidad Carrera 19', descripcion: 'Tendido eléctrico, luminarias LED solares y rehabilitación de carpeta asfáltica.', estado: 'EN_PLANIFICACION', estadoGeografico: 'Lara', presupuestoUsd: 2007.89, avanceFisicoPct: 10, avanceFinancieroPct: 15, fechaInicio: '2026-04-01', fechaFinEstimada: '2026-07-30', ingenieroResponsable: 'Ing. Pedro Castillo', cotizacionAsociada: 'COT-0004' }
];

var ALMACENES_INICIALES = [
    { id: 1, codigo: 'ALM-CEN-01', institucionId: 1, nombre: 'Almacén Central Los Teques', ubicacion: 'Zona Industrial El Tambor, Galpón 4', estado: 'Miranda', capacidadM2: 1200, responsable: 'Ing. Carlos Mendoza', activo: true },
    { id: 2, codigo: 'ALM-GUA-02', institucionId: 1, nombre: 'Almacén Regional Guarenas-Guatire', ubicacion: 'Av. Intercomunal Guarenas', estado: 'Miranda', capacidadM2: 650, responsable: 'Téc. Rafael Ochoa', activo: true },
    { id: 3, codigo: 'ALM-CCS-03', institucionId: 3, nombre: 'Almacén Metropolitano Chacao', ubicacion: 'Zona Rental Bello Monte', estado: 'Distrito Capital', capacidadM2: 450, responsable: 'Lic. Alberto Silva', activo: true },
    { id: 4, codigo: 'ALM-BAR-04', institucionId: 6, nombre: 'Almacén Occidente Barquisimeto', ubicacion: 'Zona Industrial II, Barquisimeto', estado: 'Lara', capacidadM2: 900, responsable: 'Ing. Mireya Gil', activo: true }
];

var INVENTARIO_STOCK_INICIAL = [
    { id: 1, almacenId: 1, materialId: 1, nombreMaterial: 'Cemento Portland Tipo I', stockActual: 1850, stockReservado: 350, stockMinimo: 200, unidad: 'Saco 42.5kg' },
    { id: 2, almacenId: 1, materialId: 2, nombreMaterial: 'Cabilla Estriada 1/2 pulgada', stockActual: 920, stockReservado: 120, stockMinimo: 150, unidad: 'Barra 12m' },
    { id: 3, almacenId: 1, materialId: 4, nombreMaterial: 'Bloque de Concreto 15cm', stockActual: 6400, stockReservado: 1200, stockMinimo: 1000, unidad: 'Pieza' },
    { id: 4, almacenId: 1, materialId: 5, nombreMaterial: 'Tubo PVC Sanitario 4 pulgadas', stockActual: 380, stockReservado: 45, stockMinimo: 50, unidad: 'Tubo 6m' },
    { id: 5, almacenId: 2, materialId: 1, nombreMaterial: 'Cemento Portland Tipo I', stockActual: 800, stockReservado: 150, stockMinimo: 150, unidad: 'Saco 42.5kg' },
    { id: 6, almacenId: 2, materialId: 4, nombreMaterial: 'Bloque de Concreto 15cm', stockActual: 3200, stockReservado: 600, stockMinimo: 500, unidad: 'Pieza' },
    { id: 7, almacenId: 3, materialId: 5, nombreMaterial: 'Tubo PVC Sanitario 4 pulgadas', stockActual: 210, stockReservado: 30, stockMinimo: 40, unidad: 'Tubo 6m' },
    { id: 8, almacenId: 4, materialId: 2, nombreMaterial: 'Cabilla Estriada 1/2 pulgada', stockActual: 620, stockReservado: 80, stockMinimo: 100, unidad: 'Barra 12m' }
];

var INVENTARIO_MOVIMIENTOS_INICIALES = [
    { id: 1, fecha: '10/01/2026 09:30', tipo: 'ENTRADA', materialId: 1, nombreMaterial: 'Cemento Portland Tipo I', cantidad: 2000, almacenOrigen: 'Proveedor Vencemos', almacenDestino: 'Almacén Central Los Teques', motivo: 'Recepción orden de compra institucional OC-2026-08', referencia: 'GUIA-VENCEMOS-4481' },
    { id: 2, fecha: '18/01/2026 14:15', tipo: 'RESERVA', materialId: 1, nombreMaterial: 'Cemento Portland Tipo I', cantidad: 350, almacenOrigen: 'Almacén Central Los Teques', almacenDestino: 'Obra Trapichito', motivo: 'Reserva para ejecución COT-0001', referencia: 'PRY-2026-001' },
    { id: 3, fecha: '25/01/2026 11:00', tipo: 'TRASLADO', materialId: 4, nombreMaterial: 'Bloque de Concreto 15cm', cantidad: 1000, almacenOrigen: 'Almacén Central Los Teques', almacenDestino: 'Almacén Regional Guarenas-Guatire', motivo: 'Reabastecimiento regional para obras de Miranda Este', referencia: 'TRASL-MIR-014' }
];

var PROVEEDORES_INICIALES = [
    { id: 1, rif: 'J-00012345-6', razonSocial: 'Corporación Venezolana del Cemento (Vencemos)', nombreComercial: 'Vencemos', ciudad: 'Caracas', estado: 'Distrito Capital', telefono: '0212-5551200', email: 'ventas@vencemos.com.ve', calificacion: 4.9, activo: true },
    { id: 2, rif: 'J-00078901-2', razonSocial: 'Siderúrgica del Orinoco Alfredo Maneiro (SIDOR)', nombreComercial: 'SIDOR', ciudad: 'Puerto Ordaz', estado: 'Bolívar', telefono: '0286-9601111', email: 'despachos@sidor.com.ve', calificacion: 4.8, activo: true },
    { id: 3, rif: 'J-30114422-9', razonSocial: 'Tubos y Perfiles Plásticos de Venezuela C.A.', nombreComercial: 'Tubrica / Pavco', ciudad: 'Barquisimeto', estado: 'Lara', telefono: '0251-2690022', email: 'comercial@tubricaven.com', calificacion: 4.7, activo: true },
    { id: 4, rif: 'J-30889911-4', razonSocial: 'Canteras y Agregados del Centro S.A.', nombreComercial: 'Agregados Centro', ciudad: 'Valencia', estado: 'Carabobo', telefono: '0241-8714400', email: 'pedidos@agregadoscentro.ve', calificacion: 4.6, activo: true },
    { id: 5, rif: 'J-40223311-0', razonSocial: 'Alfarería y Bloques Miranda C.A.', nombreComercial: 'Bloquera Los Teques', ciudad: 'Los Teques', estado: 'Miranda', telefono: '0212-3229988', email: 'contacto@bloqueralosteques.com', calificacion: 4.8, activo: true }
];

var PRECIOS_HISTORICOS_INICIALES = [
    { id: 1, materialId: 1, nombreMaterial: 'Cemento Portland Tipo I', precioAnterior: 8.00, precioNuevo: 8.50, variacionPct: 6.25, fecha: '15/09/2025 10:00', usuario: 'Ing. Ana Pérez', motivo: 'Ajuste de flete nacional por parte del fabricante' },
    { id: 2, materialId: 2, nombreMaterial: 'Cabilla Estriada 1/2 pulgada', precioAnterior: 11.50, precioNuevo: 12.00, variacionPct: 4.35, fecha: '01/11/2025 16:30', usuario: 'Ing. Marcos Rivas', motivo: 'Actualización trimestral de lista de precios siderúrgicos' },
    { id: 3, materialId: 5, nombreMaterial: 'Tubo PVC Sanitario 4 pulgadas', precioAnterior: 17.50, precioNuevo: 18.20, variacionPct: 4.00, fecha: '10/01/2026 11:20', usuario: 'Ing. Ana Pérez', motivo: 'Reajuste de resina importada' }
];

var DOCUMENTOS_INICIALES = [
    { id: 1, codigo: 'DOC-2026-COT-0001', titulo: 'Certificado de Liquidación y Presupuesto COT-0001', tipo: 'COTIZACION', referenciaId: 'COT-0001', hashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', fechaEmision: '2026-03-15 11:30', emitidoPor: 'Ing. Ana Pérez (Gobernación)', institucion: 'Alcaldía Bolivariana de Guarenas', valido: true },
    { id: 2, codigo: 'DOC-2026-FIN-0002', titulo: 'Convenio de Financiamiento Institucional COT-0002', tipo: 'FINANCIAMIENTO', referenciaId: 'COT-0002', hashSha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', fechaEmision: '2026-02-05 14:00', emitidoPor: 'Ing. Ana Pérez (Gobernación)', institucion: 'Alcaldía de Chacao', valido: true },
    { id: 3, codigo: 'DOC-2026-PAG-0004', titulo: 'Comprobante de Conciliación Bancaria MOV-2026-0004', tipo: 'PAGO', referenciaId: 'MOV-2026-0004', hashSha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a', fechaEmision: '2026-03-14 10:45', emitidoPor: 'Ing. Marcos Rivas (Gobernación)', institucion: 'Alcaldía Bolivariana de Guarenas', valido: true }
];

var ALERTAS_INTELIGENTES_INICIALES = [
    { id: 1, codigo: 'ALR-MORA-01', nivel: 'CRITICO', titulo: 'Cuenta en Mora Crítica: Empresa Viamer', mensaje: 'Plan de financiamiento COT-0003 presenta 32 días de retraso en cuota #1 ($300.00 USD).', accionRecomendada: 'Emitir citación administrativa o bloquear nuevas solicitudes de cotización.', leida: false, fecha: '10/04/2026 08:00', moduloDestino: 'financiamiento' },
    { id: 2, codigo: 'ALR-STOCK-02', nivel: 'ADVERTENCIA', titulo: 'Stock Mínimo Comprometido: Tubos PVC 4"', mensaje: 'El Almacén Central cuenta con 380 tubos, de los cuales 45 están reservados para proyectos en curso.', accionRecomendada: 'Planificar reposición de lote con proveedor Tubrica.', leida: false, fecha: '08/04/2026 09:30', moduloDestino: 'inventario' },
    { id: 3, codigo: 'ALR-REVISION-03', nivel: 'INFO', titulo: 'Cotización Pendiente de Revisión: COT-0004', mensaje: 'Cotización emitida por Alcaldía de Iribarren ($2.007,89) pendiente de evaluación técnica por Gobernación.', accionRecomendada: 'Acceder a bandeja de Aprobaciones para verificar disponibilidad de cupo.', leida: false, fecha: '09/04/2026 15:45', moduloDestino: 'aprobaciones' }
];

// ============================================================
// 3. FUNCIONES DE PERSISTENCIA (LOCALSTORAGE)
// ============================================================

var CLAVES_STORAGE = {
    USUARIOS: 'sicop_usuarios_v2',
    MATERIALES: 'sicop_materiales_v2',
    COTIZACIONES: 'sicop_cotizaciones_v2',
    BITACORA: 'sicop_bitacora_v2',
    SESION: 'sicop_sesion_v2',
    TASA: 'sicop_tasa_bcv_v2',
    CONTADOR: 'sicop_contador_correlativo_v2',
    BORRADOR_ASISTENTE: 'sicop_borrador_asistente_v2',
    MONEDA: 'sicop_moneda_activa_v2',
    NOTIFICACIONES: 'sicop_notificaciones_v2',
    FINANCIAMIENTOS: 'sicop_financiamientos_v2',
    MOVIMIENTOS: 'sicop_movimientos_v2',
    INSTITUCIONES: 'sicop_instituciones_v2',
    PRESUPUESTOS: 'sicop_presupuestos_v2',
    PROYECTOS: 'sicop_proyectos_v2',
    ALMACENES: 'sicop_almacenes_v2',
    INVENTARIO_STOCK: 'sicop_inventario_stock_v2',
    INVENTARIO_MOVIMIENTOS: 'sicop_inventario_mov_v2',
    PROVEEDORES: 'sicop_proveedores_v2',
    PRECIOS_HISTORICOS: 'sicop_precios_hist_v2',
    DOCUMENTOS: 'sicop_documentos_v2',
    ALERTAS_INTELIGENTES: 'sicop_alertas_v2'
};

/**
 * Lee una colección de localStorage o inicializa con el valor por defecto.
 */
function leerStorage(clave, valorPorDefecto) {
    try {
        var valorGuardado = localStorage.getItem(clave);
        if (valorGuardado !== null) {
            return JSON.parse(valorGuardado);
        }
    } catch (error) {
        console.warn('Error leyendo de localStorage:', error);
    }
    return valorPorDefecto;
}

/**
 * Escribe una colección en localStorage.
 */
function escribirStorage(clave, valor) {
    try {
        localStorage.setItem(clave, JSON.stringify(valor));
    } catch (error) {
        console.error('Error escribiendo en localStorage:', error);
    }
}

/**
 * Recalcula de forma derivada e inmutable los saldos de usuarios (gastado y comprometido).
 * Fórmula:
 * - gastado = gastadoInicial + Σ totalUSD de cotizaciones ENTREGADAS
 * - comprometido = comprometidoInicial + Σ totalUSD de cotizaciones APROBADAS
 * @param {Array<Object>} usuarios - Lista de usuarios.
 * @param {Array<Object>} cotizaciones - Lista de cotizaciones.
 * @returns {Array<Object>} Usuarios con saldos actualizados.
 */
function recalcularSaldosUsuarios(usuarios, cotizaciones) {
    var usrs = usuarios || [];
    var cots = cotizaciones || [];
    for (var i = 0; i < usrs.length; i++) {
        var u = usrs[i];
        if (u.gastadoInicial === undefined) u.gastadoInicial = Number(u.gastado) || 0;
        if (u.comprometidoInicial === undefined) u.comprometidoInicial = Number(u.comprometido) || 0;

        var entregadas = 0;
        var aprobadas = 0;
        for (var j = 0; j < cots.length; j++) {
            var c = cots[j];
            if (c.usuarioId === u.id) {
                var totalC = Number(c.totalUSD || c.total || 0);
                if (c.estado === 'ENTREGADA') {
                    entregadas += totalC;
                } else if (c.estado === 'APROBADA') {
                    aprobadas += totalC;
                }
            }
        }
        u.gastado = Math.round((u.gastadoInicial + entregadas) * 100) / 100;
        u.comprometido = Math.round((u.comprometidoInicial + aprobadas) * 100) / 100;
    }
    return usrs;
}

/**
 * Obtiene la lista actual de usuarios con saldos derivados coherentemente.
 */
function obtenerUsuarios() {
    var usuariosGuardados = leerStorage(CLAVES_STORAGE.USUARIOS, null);
    var cotizaciones = leerStorage(CLAVES_STORAGE.COTIZACIONES, COTIZACIONES_INICIALES);

    // Si no hay nada guardado, usar semilla completa
    if (!Array.isArray(usuariosGuardados) || usuariosGuardados.length === 0) {
        var copiaSeed = [];
        for (var s = 0; s < USUARIOS_INICIALES.length; s++) {
            copiaSeed.push(USUARIOS_INICIALES[s]);
        }
        escribirStorage(CLAVES_STORAGE.USUARIOS, copiaSeed);
        return recalcularSaldosUsuarios(copiaSeed, cotizaciones);
    }

    // MIGRACIÓN: garantizar que TODOS los usuarios de USUARIOS_INICIALES
    // existan. Si falta alguno (por id o usuario), se agrega.
    // Si existe pero tiene perfil corrupto, se corrige.
    var huboCambios = false;
    for (var i = 0; i < USUARIOS_INICIALES.length; i++) {
        var seed = USUARIOS_INICIALES[i];
        var encontrado = -1;
        for (var j = 0; j < usuariosGuardados.length; j++) {
            if (usuariosGuardados[j].id === seed.id ||
                usuariosGuardados[j].usuario === seed.usuario) {
                encontrado = j;
                break;
            }
        }
        if (encontrado === -1) {
            // Usuario faltante → agregar copia limpia del seed
            var copia = {};
            for (var prop in seed) {
                if (seed.hasOwnProperty(prop)) copia[prop] = seed[prop];
            }
            usuariosGuardados.push(copia);
            huboCambios = true;
        } else {
            // Usuario existente → reparar campos críticos
            var u = usuariosGuardados[encontrado];
            // Reparar perfil si está corrupto
            if (typeof u.perfil !== 'string') {
                u.perfil = seed.perfil;
                huboCambios = true;
            } else {
                var pNorm = u.perfil.toLowerCase()
                    .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i')
                    .replace(/ó/g,'o').replace(/ú/g,'u');
                var seedNorm = seed.perfil.toLowerCase()
                    .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i')
                    .replace(/ó/g,'o').replace(/ú/g,'u');
                if (pNorm === seedNorm && u.perfil !== seed.perfil) {
                    // Mismo perfil semántico pero string distinto → corregir
                    u.perfil = seed.perfil;
                    huboCambios = true;
                }
            }
            // Reparar nombre y clave si están vacíos
            if (!u.nombre) { u.nombre = seed.nombre; huboCambios = true; }
            if (!u.clave) { u.clave = seed.clave; huboCambios = true; }
            if (!u.estado) { u.estado = seed.estado; huboCambios = true; }
            if (typeof u.limiteGasto !== 'number' || u.limiteGasto <= 0) {
                u.limiteGasto = seed.limiteGasto;
                huboCambios = true;
            }
        }
    }
    if (huboCambios) {
        escribirStorage(CLAVES_STORAGE.USUARIOS, usuariosGuardados);
    }
    return recalcularSaldosUsuarios(usuariosGuardados, cotizaciones);
}

/**
 * Guarda la lista actualizada de usuarios.
 */
function guardarUsuarios(usuarios) {
    escribirStorage(CLAVES_STORAGE.USUARIOS, usuarios);
}

/**
 * Obtiene el catálogo de materiales.
 */
function obtenerMateriales() {
    var mats = leerStorage(CLAVES_STORAGE.MATERIALES, MATERIALES_INICIALES);
    for (var i = 0; i < mats.length; i++) {
        if (mats[i].permiteDecimales === undefined) {
            mats[i].permiteDecimales = (mats[i].id === 4 || mats[i].id === 8 || mats[i].unidad === 'Metro' || mats[i].unidad === 'Tonelada');
        }
    }
    return mats;
}

/**
 * Guarda el catálogo de materiales.
 */
function guardarMateriales(materiales) {
    escribirStorage(CLAVES_STORAGE.MATERIALES, materiales);
}

/**
 * Obtiene todas las cotizaciones.
 * Realiza auto-migración reactiva si la tasa BCV guardada es obsoleta (< 100).
 */
function obtenerCotizaciones() {
    var cots = leerStorage(CLAVES_STORAGE.COTIZACIONES, COTIZACIONES_INICIALES);
    var tasaActual = (typeof obtenerTasaBCV === 'function') ? obtenerTasaBCV() : TASA_BCV_INICIAL;
    if (isNaN(tasaActual) || tasaActual <= 100) tasaActual = 900.00;
    var migrado = false;
    if (Array.isArray(cots)) {
        for (var i = 0; i < cots.length; i++) {
            var c = cots[i];
            if (!c.tasaBCV || isNaN(c.tasaBCV) || Number(c.tasaBCV) <= 100 || Number(c.tasaBCV) === 36.50 || Number(c.tasaBCV) === 0.18) {
                c.tasaBCV = tasaActual;
                var usdMonto = Number(c.totalUSD !== undefined ? c.totalUSD : c.total) || 0;
                c.totalBs = Math.round(usdMonto * tasaActual * 100) / 100;
                migrado = true;
            }
        }
        if (migrado) {
            escribirStorage(CLAVES_STORAGE.COTIZACIONES, cots);
        }
    }
    return cots;
}

/**
 * Guarda la lista de cotizaciones.
 */
function guardarCotizaciones(cotizaciones) {
    escribirStorage(CLAVES_STORAGE.COTIZACIONES, cotizaciones);
}

/**
 * Obtiene el registro de auditoría / bitácora.
 */
function obtenerBitacora() {
    return leerStorage(CLAVES_STORAGE.BITACORA, BITACORA_INICIAL);
}

/**
 * Agrega una nueva entrada a la bitácora de auditoría.
 */
function registrarEnBitacora(usuarioNombre, accion, detalle) {
    var bitacora = obtenerBitacora();
    var nuevaEntrada = {
        fecha: obtenerFechaActual(),
        usuario: usuarioNombre || 'Sistema',
        accion: accion,
        detalle: detalle
    };
    bitacora.unshift(nuevaEntrada); // Insertar al inicio (cronológico descendente)
    // Limitar a los últimos 200 eventos para controlar memoria
    if (bitacora.length > 200) {
        bitacora.pop();
    }
    escribirStorage(CLAVES_STORAGE.BITACORA, bitacora);
}

/**
 * Obtiene la sesión del usuario conectado actualmente (o null).
 * Carga el perfil completo desde el catálogo de usuarios sin persistir la clave en la sesión.
 */
function obtenerSesionActual() {
    var sesionToken = leerStorage(CLAVES_STORAGE.SESION, null);
    if (!sesionToken || !sesionToken.id) {
        return null;
    }
    var usuarios = obtenerUsuarios();
    for (var i = 0; i < usuarios.length; i++) {
        if (usuarios[i].id === sesionToken.id || usuarios[i].usuario === sesionToken.usuario) {
            var usuarioSeguro = {};
            for (var prop in usuarios[i]) {
                if (usuarios[i].hasOwnProperty(prop) && prop !== 'clave') {
                    usuarioSeguro[prop] = usuarios[i][prop];
                }
            }
            return usuarioSeguro;
        }
    }
    return null;
}

/**
 * Guarda la sesión del usuario activo (solo identificadores no sensibles, nunca la clave).
 */
function guardarSesionActual(usuario) {
    if (!usuario) {
        localStorage.removeItem(CLAVES_STORAGE.SESION);
        return;
    }
    var sesionMinima = {
        id: usuario.id,
        usuario: usuario.usuario
    };
    escribirStorage(CLAVES_STORAGE.SESION, sesionMinima);
}

/**
 * Cierra la sesión activa.
 */
function cerrarSesionStorage() {
    localStorage.removeItem(CLAVES_STORAGE.SESION);
}

/**
 * Retorna la fecha de hoy en formato DD/MM/AAAA.
 * @returns {string}
 */
function formatearFechaHoy() {
    var d = new Date();
    return _padCero(d.getDate()) + '/' + _padCero(d.getMonth() + 1) + '/' + d.getFullYear();
}

/**
 * Obtiene la información completa de la tasa de cambio vigente (valor numérico y fecha de registro).
 * @returns {{ valor: number, fecha: string }}
 */
function obtenerInfoTasaBCV() {
    var raw = localStorage.getItem(CLAVES_STORAGE.TASA);
    var hoy = formatearFechaHoy();
    if (!raw) {
        guardarTasaBCV(TASA_BCV_INICIAL, hoy);
        return { valor: TASA_BCV_INICIAL, fecha: hoy };
    }
    var val = TASA_BCV_INICIAL;
    var fecha = hoy;
    if (typeof raw === 'string' && raw.indexOf('{') === 0) {
        try {
            var obj = JSON.parse(raw);
            if (obj && typeof obj.valor === 'number' && !isNaN(obj.valor)) {
                val = obj.valor;
                fecha = obj.fecha || hoy;
            }
        } catch (e) {}
    } else {
        var num = parseFloat(raw);
        if (!isNaN(num) && num > 0) {
            val = num;
        }
    }
    // Si la tasa guardada es anómala o menor a 100 (ej. 0.18 o la tasa previa 36.50), forzar a 900
    if (val <= 100 || val === 0.18 || val === 36.50) {
        val = TASA_BCV_INICIAL;
        fecha = hoy;
        guardarTasaBCV(TASA_BCV_INICIAL, hoy);
    }
    return { valor: val, fecha: fecha };
}

/**
 * Obtiene la tasa de cambio vigente (numérica).
 * @returns {number}
 */
function obtenerTasaBCV() {
    var v = obtenerInfoTasaBCV().valor;
    if (isNaN(v) || v <= 100 || v === 0.18 || v === 36.50) {
        return TASA_BCV_INICIAL;
    }
    return v;
}

/**
 * Guarda una nueva tasa de cambio y asienta la fecha de fijación.
 * @param {number|string} tasa - Valor numérico de la tasa en Bs./USD.
 * @param {string} [fecha] - Fecha opcional DD/MM/AAAA.
 */
function guardarTasaBCV(tasa, fecha) {
    var val = parseFloat(tasa);
    if (isNaN(val) || val <= 100 || val === 0.18 || val === 36.50) {
        val = TASA_BCV_INICIAL;
    }
    var f = fecha || formatearFechaHoy();
    var info = { valor: val, fecha: f };
    localStorage.setItem(CLAVES_STORAGE.TASA, JSON.stringify(info));
}

/**
 * Obtiene el listado de notificaciones para un usuario específico.
 * @param {number} usuarioId - Identificador del usuario.
 * @returns {Array<Object>} Lista de notificaciones ordenadas cronológicamente (más recientes primero).
 */
function obtenerNotificaciones(usuarioId) {
    if (!usuarioId) return [];
    var todas = leerStorage(CLAVES_STORAGE.NOTIFICACIONES, {});
    var lista = todas[usuarioId] || [];
    return Array.isArray(lista) ? lista : [];
}

/**
 * Guarda una nueva notificación interna para un usuario.
 * @param {number} usuarioId - Identificador del destinatario.
 * @param {string} texto - Mensaje descriptivo.
 * @param {string} [tipo] - 'info', 'exito', 'advertencia' o 'peligro'.
 * @returns {Object} Notificación creada.
 */
function guardarNotificacion(usuarioId, texto, tipo) {
    if (!usuarioId || !texto) return null;
    var todas = leerStorage(CLAVES_STORAGE.NOTIFICACIONES, {});
    if (!todas[usuarioId]) {
        todas[usuarioId] = [];
    }
    var ahora = new Date();
    var dStr = _padCero(ahora.getDate());
    var mStr = _padCero(ahora.getMonth() + 1);
    var aStr = ahora.getFullYear();
    var hStr = _padCero(ahora.getHours());
    var minStr = _padCero(ahora.getMinutes());

    var notif = {
        id: ahora.getTime() + Math.floor(Math.random() * 1000),
        texto: String(texto),
        tipo: tipo || 'info',
        fecha: dStr + '/' + mStr + '/' + aStr + ' ' + hStr + ':' + minStr,
        fechaISO: ahora.toISOString(),
        leida: false
    };

    todas[usuarioId].unshift(notif);
    if (todas[usuarioId].length > 25) {
        todas[usuarioId] = todas[usuarioId].slice(0, 25);
    }
    escribirStorage(CLAVES_STORAGE.NOTIFICACIONES, todas);
    return notif;
}

/**
 * Marca todas las notificaciones pendientes de un usuario como leídas.
 * @param {number} usuarioId - Identificador del usuario.
 */
function marcarNotificacionesLeidas(usuarioId) {
    if (!usuarioId) return;
    var todas = leerStorage(CLAVES_STORAGE.NOTIFICACIONES, {});
    if (todas[usuarioId] && Array.isArray(todas[usuarioId])) {
        for (var i = 0; i < todas[usuarioId].length; i++) {
            todas[usuarioId][i].leida = true;
        }
        escribirStorage(CLAVES_STORAGE.NOTIFICACIONES, todas);
    }
}

/**
 * Retorna la cantidad de notificaciones sin leer de un usuario.
 * @param {number} usuarioId - Identificador del usuario.
 * @returns {number}
 */
function contarNotificacionesNoLeidas(usuarioId) {
    var lista = obtenerNotificaciones(usuarioId);
    var count = 0;
    for (var i = 0; i < lista.length; i++) {
        if (!lista[i].leida) {
            count++;
        }
    }
    return count;
}

/**
 * Obtiene el siguiente número correlativo de cotización (COT-XXXX).
 */
function generarSiguienteCorrelativo() {
    var contador = parseInt(localStorage.getItem(CLAVES_STORAGE.CONTADOR) || '3');
    contador++;
    localStorage.setItem(CLAVES_STORAGE.CONTADOR, String(contador));
    var numeroTexto = String(contador);
    while (numeroTexto.length < 4) {
        numeroTexto = '0' + numeroTexto;
    }
    return 'COT-' + numeroTexto;
}

/**
 * Restaura todos los datos al estado de fábrica de la demostración.
 */
function restablecerDatosFabrica() {
    localStorage.removeItem(CLAVES_STORAGE.USUARIOS);
    localStorage.removeItem(CLAVES_STORAGE.MATERIALES);
    localStorage.removeItem(CLAVES_STORAGE.COTIZACIONES);
    localStorage.removeItem(CLAVES_STORAGE.BITACORA);
    localStorage.removeItem(CLAVES_STORAGE.CONTADOR);
    localStorage.removeItem(CLAVES_STORAGE.TASA);
    localStorage.removeItem(CLAVES_STORAGE.SESION);
    localStorage.removeItem(CLAVES_STORAGE.BORRADOR_ASISTENTE);
    localStorage.removeItem(CLAVES_STORAGE.MONEDA);
    localStorage.removeItem(CLAVES_STORAGE.NOTIFICACIONES);
    localStorage.removeItem(CLAVES_STORAGE.FINANCIAMIENTOS);
    localStorage.removeItem(CLAVES_STORAGE.MOVIMIENTOS);
    localStorage.removeItem(CLAVES_STORAGE.INSTITUCIONES);
    localStorage.removeItem(CLAVES_STORAGE.PRESUPUESTOS);
    localStorage.removeItem(CLAVES_STORAGE.PROYECTOS);
    localStorage.removeItem(CLAVES_STORAGE.ALMACENES);
    localStorage.removeItem(CLAVES_STORAGE.INVENTARIO_STOCK);
    localStorage.removeItem(CLAVES_STORAGE.INVENTARIO_MOVIMIENTOS);
    localStorage.removeItem(CLAVES_STORAGE.PROVEEDORES);
    localStorage.removeItem(CLAVES_STORAGE.PRECIOS_HISTORICOS);
    localStorage.removeItem(CLAVES_STORAGE.DOCUMENTOS);
    localStorage.removeItem(CLAVES_STORAGE.ALERTAS_INTELIGENTES);
}

/**
 * Obtiene el borrador en progreso del asistente de cotización para un usuario específico.
 */
function obtenerBorradorAsistente(usuarioId) {
    var todos = leerStorage(CLAVES_STORAGE.BORRADOR_ASISTENTE, {});
    if (!usuarioId) return null;
    var b = todos[usuarioId] || null;
    if (b) {
        if (!b.tasaBCV || isNaN(b.tasaBCV) || b.tasaBCV <= 100 || b.tasaBCV === 0.18 || b.tasaBCV === 36.50) {
            b.tasaBCV = TASA_BCV_INICIAL;
        }
    }
    return b;
}

/**
 * Guarda el borrador en progreso del asistente de cotización por usuario en localStorage.
 */
function guardarBorradorAsistente(usuarioId, borrador) {
    if (!usuarioId) return;
    var todos = leerStorage(CLAVES_STORAGE.BORRADOR_ASISTENTE, {});
    todos[usuarioId] = borrador;
    escribirStorage(CLAVES_STORAGE.BORRADOR_ASISTENTE, todos);
}

/**
 * Elimina el borrador guardado del asistente para un usuario (o todos si no se pasa id).
 */
function limpiarBorradorAsistente(usuarioId) {
    var todos = leerStorage(CLAVES_STORAGE.BORRADOR_ASISTENTE, {});
    if (usuarioId) { delete todos[usuarioId]; } else { todos = {}; }
    escribirStorage(CLAVES_STORAGE.BORRADOR_ASISTENTE, todos);
}

/**
 * Obtiene la moneda activa de visualización ('USD' o 'Bs').
 */
function obtenerMonedaActiva() {
    return localStorage.getItem(CLAVES_STORAGE.MONEDA) || 'USD';
}

/**
 * Guarda la moneda activa de visualización.
 */
function guardarMonedaActiva(moneda) {
    localStorage.setItem(CLAVES_STORAGE.MONEDA, moneda);
}

/**
 * Datos semilla iniciales de financiamientos institucionales y Cashea.
 */
var FINANCIAMIENTOS_INICIALES = [
    {
        id: 1,
        cotizacionId: 1,
        correlativoCotizacion: 'COT-0001',
        usuarioId: 1,
        nombreCliente: 'María González',
        perfil: 'Alcaldía',
        nombreObra: 'Rehabilitación Módulo Comunal',
        tipoPlan: 'cashea_3',
        nombrePlan: 'Cashea 3 Cuotas (0% Interés)',
        montoTotalUSD: 4472.50,
        montoInicialUSD: 2236.25,
        saldoFinanciadoUSD: 2236.25,
        totalFinanciado: 4472.50,
        totalPagado: 4472.50,
        saldoPendiente: 0.00,
        recargoPct: 0.00,
        recargoUSD: 0.00,
        numeroCuotas: 3,
        montoCuotaUSD: 745.42,
        fechaCreacionISO: _fDemoCot1.iso,
        pagoInicialConfirmado: true,
        pagoInicialReferencia: 'TRANSF-INI-001',
        pagoInicialFechaISO: _fDemoCot1Aprob.iso,
        metodoPagoInicial: 'Transferencia',
        estado: 'PAGADO',
        cuotas: [
            { numero: 1, montoUSD: 745.42, fechaVencimientoISO: generarFechaRelativa(26, '12:00').iso, fechaPagoISO: generarFechaRelativa(25, '10:30').iso, estado: 'PAGADA', referencia: 'TRANSF-BCV-98124' },
            { numero: 2, montoUSD: 745.42, fechaVencimientoISO: generarFechaRelativa(40, '12:00').iso, fechaPagoISO: generarFechaRelativa(39, '14:15').iso, estado: 'PAGADA', referencia: 'TRANSF-BCV-99341' },
            { numero: 3, montoUSD: 745.41, fechaVencimientoISO: generarFechaRelativa(54, '12:00').iso, fechaPagoISO: generarFechaRelativa(53, '11:00').iso, estado: 'PAGADA', referencia: 'TRANSF-BCV-99882' }
        ]
    },
    {
        id: 2,
        cotizacionId: 2,
        correlativoCotizacion: 'COT-0002',
        usuarioId: 2,
        nombreCliente: 'Carlos Rodríguez',
        perfil: 'Empresa',
        nombreObra: 'Acometida Industrial y Pavimentación',
        tipoPlan: 'quincenal_6',
        nombrePlan: 'Financiamiento Quincenal 6 Cuotas (5% Gastos Admin)',
        montoTotalUSD: 4647.74,
        montoInicialUSD: 1394.32,
        saldoFinanciadoUSD: 3253.42,
        totalFinanciado: 4810.41,
        totalPagado: 1963.67,
        saldoPendiente: 2846.74,
        recargoPct: 0.05,
        recargoUSD: 162.67,
        numeroCuotas: 6,
        montoCuotaUSD: 569.35,
        fechaCreacionISO: _fDemoCot2.iso,
        pagoInicialConfirmado: true,
        pagoInicialReferencia: 'TRANSF-INI-002',
        pagoInicialFechaISO: _fDemoCot2Aprob.iso,
        metodoPagoInicial: 'Transferencia',
        estado: 'ACTIVO',
        cuotas: [
            { numero: 1, montoUSD: 569.35, fechaVencimientoISO: generarFechaRelativa(3, '12:00').iso, fechaPagoISO: generarFechaRelativa(2, '16:00').iso, estado: 'PAGADA', referencia: 'PAGOMOVIL-77123' },
            { numero: 2, montoUSD: 569.35, fechaVencimientoISO: generarFechaRelativa(-11, '12:00').iso, fechaPagoISO: null, estado: 'PENDIENTE', referencia: null },
            { numero: 3, montoUSD: 569.35, fechaVencimientoISO: generarFechaRelativa(-25, '12:00').iso, fechaPagoISO: null, estado: 'PENDIENTE', referencia: null },
            { numero: 4, montoUSD: 569.35, fechaVencimientoISO: generarFechaRelativa(-39, '12:00').iso, fechaPagoISO: null, estado: 'PENDIENTE', referencia: null },
            { numero: 5, montoUSD: 569.35, fechaVencimientoISO: generarFechaRelativa(-53, '12:00').iso, fechaPagoISO: null, estado: 'PENDIENTE', referencia: null },
            { numero: 6, montoUSD: 569.34, fechaVencimientoISO: generarFechaRelativa(-67, '12:00').iso, fechaPagoISO: null, estado: 'PENDIENTE', referencia: null }
        ]
    },
    {
        id: 3,
        cotizacionId: 3,
        correlativoCotizacion: 'COT-0003',
        usuarioId: 5,
        nombreCliente: 'Luis Hernández',
        perfil: 'Empresa',
        nombreObra: 'Rehabilitación Vial Mérida',
        tipoPlan: 'cashea_3',
        nombrePlan: 'Cashea 3 Cuotas (0% Interés)',
        montoTotalUSD: 1800.00,
        montoInicialUSD: 900.00,
        saldoFinanciadoUSD: 900.00,
        totalFinanciado: 1800.00,
        totalPagado: 900.00,
        saldoPendiente: 900.00,
        recargoPct: 0.00,
        recargoUSD: 0.00,
        numeroCuotas: 3,
        montoCuotaUSD: 300.00,
        fechaCreacionISO: generarFechaRelativa(20, '10:00').iso,
        pagoInicialConfirmado: true,
        pagoInicialReferencia: 'TRANSF-INI-003',
        pagoInicialFechaISO: _fDemoCot3Aprob.iso,
        metodoPagoInicial: 'Transferencia',
        estado: 'EN_MORA',
        cuotas: [
            { numero: 1, montoUSD: 300.00, fechaVencimientoISO: generarFechaRelativa(6, '12:00').iso, fechaPagoISO: null, estado: 'VENCIDA', referencia: null },
            { numero: 2, montoUSD: 300.00, fechaVencimientoISO: generarFechaRelativa(-8, '12:00').iso, fechaPagoISO: null, estado: 'PENDIENTE', referencia: null },
            { numero: 3, montoUSD: 300.00, fechaVencimientoISO: generarFechaRelativa(-22, '12:00').iso, fechaPagoISO: null, estado: 'PENDIENTE', referencia: null }
        ]
    }
];

/**
 * Movimientos y auditoría de pagos iniciales y cuotas (Libro Mayor).
 */
var MOVIMIENTOS_INICIALES = [
    {
        id: 1,
        financiamientoId: 1,
        cotizacionId: 1,
        correlativoCotizacion: 'COT-0001',
        usuarioId: 1,
        cliente: 'María González',
        tipo: 'INICIAL',
        cuotaNumero: null,
        montoUSD: 2236.25,
        montoAplicadoCapital: 2236.25,
        montoAplicadoMora: 0.00,
        referencia: 'TRANSF-INI-001',
        metodo: 'Transferencia',
        fechaISO: _fDemoCot1Aprob.iso,
        estado: 'CONFIRMADO'
    },
    {
        id: 2,
        financiamientoId: 1,
        cotizacionId: 1,
        correlativoCotizacion: 'COT-0001',
        usuarioId: 1,
        cliente: 'María González',
        tipo: 'CUOTA',
        cuotaNumero: 1,
        montoUSD: 745.42,
        montoAplicadoCapital: 745.42,
        montoAplicadoMora: 0.00,
        referencia: 'TRANSF-BCV-98124',
        metodo: 'Transferencia',
        fechaISO: generarFechaRelativa(25, '10:30').iso,
        estado: 'CONFIRMADO'
    },
    {
        id: 3,
        financiamientoId: 1,
        cotizacionId: 1,
        correlativoCotizacion: 'COT-0001',
        usuarioId: 1,
        cliente: 'María González',
        tipo: 'CUOTA',
        cuotaNumero: 2,
        montoUSD: 745.42,
        montoAplicadoCapital: 745.42,
        montoAplicadoMora: 0.00,
        referencia: 'TRANSF-BCV-99341',
        metodo: 'Transferencia',
        fechaISO: generarFechaRelativa(39, '14:15').iso,
        estado: 'CONFIRMADO'
    },
    {
        id: 4,
        financiamientoId: 1,
        cotizacionId: 1,
        correlativoCotizacion: 'COT-0001',
        usuarioId: 1,
        cliente: 'María González',
        tipo: 'CUOTA',
        cuotaNumero: 3,
        montoUSD: 745.41,
        montoAplicadoCapital: 745.41,
        montoAplicadoMora: 0.00,
        referencia: 'TRANSF-BCV-99882',
        metodo: 'Transferencia',
        fechaISO: generarFechaRelativa(53, '11:00').iso,
        estado: 'CONFIRMADO'
    },
    {
        id: 5,
        financiamientoId: 2,
        cotizacionId: 2,
        correlativoCotizacion: 'COT-0002',
        usuarioId: 2,
        cliente: 'Carlos Rodríguez',
        tipo: 'INICIAL',
        cuotaNumero: null,
        montoUSD: 1394.32,
        montoAplicadoCapital: 1394.32,
        montoAplicadoMora: 0.00,
        referencia: 'TRANSF-INI-002',
        metodo: 'Transferencia',
        fechaISO: _fDemoCot2Aprob.iso,
        estado: 'CONFIRMADO'
    },
    {
        id: 6,
        financiamientoId: 2,
        cotizacionId: 2,
        correlativoCotizacion: 'COT-0002',
        usuarioId: 2,
        cliente: 'Carlos Rodríguez',
        tipo: 'CUOTA',
        cuotaNumero: 1,
        montoUSD: 569.35,
        montoAplicadoCapital: 569.35,
        montoAplicadoMora: 0.00,
        referencia: 'PAGOMOVIL-77123',
        metodo: 'Pago Móvil',
        fechaISO: generarFechaRelativa(2, '16:00').iso,
        estado: 'CONFIRMADO'
    },
    {
        id: 7,
        financiamientoId: 3,
        cotizacionId: 3,
        correlativoCotizacion: 'COT-0003',
        usuarioId: 5,
        cliente: 'Luis Hernández',
        tipo: 'INICIAL',
        cuotaNumero: null,
        montoUSD: 900.00,
        montoAplicadoCapital: 900.00,
        montoAplicadoMora: 0.00,
        referencia: 'TRANSF-INI-003',
        metodo: 'Transferencia',
        fechaISO: _fDemoCot3Aprob.iso,
        estado: 'CONFIRMADO'
    }
];

/**
 * Obtiene todos los planes de financiamiento registrados.
 * @returns {Array} Arreglo de planes.
 */
function obtenerFinanciamientos() {
    return leerStorage(CLAVES_STORAGE.FINANCIAMIENTOS, FINANCIAMIENTOS_INICIALES);
}

/**
 * Guarda los planes de financiamiento en localStorage.
 * @param {Array} financiamientos - Arreglo de planes.
 */
function guardarFinanciamientos(financiamientos) {
    escribirStorage(CLAVES_STORAGE.FINANCIAMIENTOS, financiamientos);
}

/**
 * Obtiene el financiamiento asociado a una cotización específica.
 * @param {number} cotizacionId - ID de la cotización.
 * @returns {Object|null} Objeto plan o null si no existe.
 */
function obtenerFinanciamientoPorCotizacion(cotizacionId) {
    var todos = obtenerFinanciamientos();
    cotizacionId = Number(cotizacionId);
    for (var i = 0; i < todos.length; i++) {
        if (Number(todos[i].cotizacionId) === cotizacionId) {
            return todos[i];
        }
    }
    return null;
}

/**
 * Obtiene todos los financiamientos pertenecientes a un usuario.
 * @param {number} usuarioId - ID del usuario.
 * @returns {Array} Lista de planes del usuario.
 */
function obtenerFinanciamientosPorUsuario(usuarioId) {
    var todos = obtenerFinanciamientos();
    var resultado = [];
    usuarioId = Number(usuarioId);
    for (var i = 0; i < todos.length; i++) {
        if (Number(todos[i].usuarioId) === usuarioId) {
            resultado.push(todos[i]);
        }
    }
    return resultado;
}

/**
 * Obtiene todos los movimientos y pagos registrados.
 * @returns {Array} Arreglo de movimientos.
 */
function obtenerMovimientos() {
    return leerStorage(CLAVES_STORAGE.MOVIMIENTOS, MOVIMIENTOS_INICIALES);
}

/**
 * Guarda el arreglo de movimientos en localStorage.
 * @param {Array} movimientos - Arreglo de movimientos.
 */
function guardarMovimientos(movimientos) {
    escribirStorage(CLAVES_STORAGE.MOVIMIENTOS, movimientos);
}

/**
 * Registra un nuevo movimiento en el libro mayor de pagos.
 * @param {Object} movimiento - Datos del movimiento.
 * @returns {Object} Movimiento registrado con id y fechaISO asegurados.
 */
function registrarMovimiento(movimiento) {
    var movimientos = obtenerMovimientos();
    var maxId = 0;
    for (var i = 0; i < movimientos.length; i++) {
        if (movimientos[i].id && movimientos[i].id > maxId) {
            maxId = movimientos[i].id;
        }
    }
    movimiento.id = maxId + 1;
    if (!movimiento.fechaISO) {
        movimiento.fechaISO = new Date().toISOString();
    }
    if (movimiento.estado === undefined) {
        movimiento.estado = 'CONFIRMADO';
    }
    movimientos.push(movimiento);
    guardarMovimientos(movimientos);
    return movimiento;
}

/**
 * Obtiene los movimientos asociados a un financiamiento específico.
 * @param {number} financiamientoId - ID del plan.
 * @returns {Array} Lista de movimientos del plan.
 */
function obtenerMovimientosPorFinanciamiento(financiamientoId) {
    var todos = obtenerMovimientos();
    var resultado = [];
    financiamientoId = Number(financiamientoId);
    for (var i = 0; i < todos.length; i++) {
        if (Number(todos[i].financiamientoId) === financiamientoId) {
            resultado.push(todos[i]);
        }
    }
    return resultado;
}

/**
 * Obtiene los movimientos asociados a un usuario específico.
 * @param {number} usuarioId - ID del usuario.
 * @returns {Array} Lista de movimientos del usuario.
 */
function obtenerMovimientosPorUsuario(usuarioId) {
    var todos = obtenerMovimientos();
    var resultado = [];
    usuarioId = Number(usuarioId);
    for (var i = 0; i < todos.length; i++) {
        if (Number(todos[i].usuarioId) === usuarioId) {
            resultado.push(todos[i]);
        }
    }
    return resultado;
}

/**
 * Registra formalmente el pago de una cuota de financiamiento.
 * @param {number} financiamientoId - ID del plan.
 * @param {number} numeroCuota - Número correlativo de cuota (1, 2, ...).
 * @param {Object} datosPago - { monto, referencia, fechaISO }.
 * @returns {Object} { ok: boolean, error?: string, plan?: Object }.
 */
function registrarPagoCuota(financiamientoId, numeroCuota, datosPago) {
    var todos = obtenerFinanciamientos();
    var planEncontrado = null;
    var planIndex = -1;

    for (var i = 0; i < todos.length; i++) {
        if (todos[i].id === Number(financiamientoId)) {
            planEncontrado = todos[i];
            planIndex = i;
            break;
        }
    }

    if (!planEncontrado) {
        return { ok: false, error: 'Plan de financiamiento no encontrado.' };
    }

    if (typeof procesarPagoCuota === 'function') {
        var resProceso = procesarPagoCuota(planEncontrado, numeroCuota, datosPago.monto, datosPago.referencia, datosPago.fechaISO, datosPago.metodo);
        if (!resProceso.ok) {
            return resProceso;
        }
        planEncontrado = resProceso.plan;
    } else {
        // Fallback básico si procesarPagoCuota aún no está cargado
        for (var c = 0; c < planEncontrado.cuotas.length; c++) {
            if (planEncontrado.cuotas[c].numero === Number(numeroCuota)) {
                planEncontrado.cuotas[c].estado = 'PAGADA';
                planEncontrado.cuotas[c].fechaPagoISO = datosPago.fechaISO || new Date().toISOString();
                planEncontrado.cuotas[c].referencia = datosPago.referencia || 'TRANSF-DIRECTA';
                break;
            }
        }
    }

    todos[planIndex] = planEncontrado;
    guardarFinanciamientos(todos);

    if (typeof registrarEnBitacora === 'function') {
        registrarEnBitacora(
            planEncontrado.nombreCliente || 'Usuario',
            'PAGO_CUOTA_REGISTRADO',
            'Pago registrado de cuota #' + numeroCuota + ' por USD ' + Number(datosPago.monto).toFixed(2) + ' para cotización ' + planEncontrado.correlativoCotizacion + '. Ref: ' + (datosPago.referencia || 'N/A')
        );
    }

    return { ok: true, plan: planEncontrado };
}

// ============================================================
// 4. FUNCIONES DE PERSISTENCIA SICOP-VE 2.0
// ============================================================

function obtenerInstituciones() {
    return leerStorage(CLAVES_STORAGE.INSTITUCIONES, INSTITUCIONES_INICIALES);
}

function guardarInstituciones(instituciones) {
    escribirStorage(CLAVES_STORAGE.INSTITUCIONES, instituciones);
}

function obtenerPresupuestosInstitucionales() {
    return leerStorage(CLAVES_STORAGE.PRESUPUESTOS, PRESUPUESTOS_INICIALES);
}

function guardarPresupuestosInstitucionales(presupuestos) {
    escribirStorage(CLAVES_STORAGE.PRESUPUESTOS, presupuestos);
}

function obtenerProyectosObras() {
    return leerStorage(CLAVES_STORAGE.PROYECTOS, PROYECTOS_INICIALES);
}

function guardarProyectosObras(proyectos) {
    escribirStorage(CLAVES_STORAGE.PROYECTOS, proyectos);
}

function obtenerAlmacenes() {
    return leerStorage(CLAVES_STORAGE.ALMACENES, ALMACENES_INICIALES);
}

function guardarAlmacenes(almacenes) {
    escribirStorage(CLAVES_STORAGE.ALMACENES, almacenes);
}

function obtenerStockInventario() {
    return leerStorage(CLAVES_STORAGE.INVENTARIO_STOCK, INVENTARIO_STOCK_INICIAL);
}

function guardarStockInventario(stock) {
    escribirStorage(CLAVES_STORAGE.INVENTARIO_STOCK, stock);
}

function obtenerMovimientosInventario() {
    return leerStorage(CLAVES_STORAGE.INVENTARIO_MOVIMIENTOS, INVENTARIO_MOVIMIENTOS_INICIALES);
}

function guardarMovimientosInventario(movimientos) {
    escribirStorage(CLAVES_STORAGE.INVENTARIO_MOVIMIENTOS, movimientos);
}

function registrarMovimientoInventario(mov) {
    var movs = obtenerMovimientosInventario();
    var idNuevo = 1;
    for (var i = 0; i < movs.length; i++) {
        if (movs[i].id >= idNuevo) idNuevo = movs[i].id + 1;
    }
    mov.id = idNuevo;
    mov.fecha = mov.fecha || obtenerFechaActual();
    movs.unshift(mov);
    guardarMovimientosInventario(movs);
    return mov;
}

function obtenerProveedores() {
    return leerStorage(CLAVES_STORAGE.PROVEEDORES, PROVEEDORES_INICIALES);
}

function guardarProveedores(proveedores) {
    escribirStorage(CLAVES_STORAGE.PROVEEDORES, proveedores);
}

function obtenerPreciosHistoricos() {
    return leerStorage(CLAVES_STORAGE.PRECIOS_HISTORICOS, PRECIOS_HISTORICOS_INICIALES);
}

function guardarPreciosHistoricos(precios) {
    escribirStorage(CLAVES_STORAGE.PRECIOS_HISTORICOS, precios);
}

function registrarCambioPrecioHistorico(materialId, precioAnterior, precioNuevo, nombreMaterial, usuario, motivo) {
    var lista = obtenerPreciosHistoricos();
    var pAnt = Number(precioAnterior) || 0;
    var pNue = Number(precioNuevo) || 0;
    var varPct = pAnt > 0 ? Number((((pNue - pAnt) / pAnt) * 100).toFixed(2)) : 0;
    var nuevo = {
        id: lista.length + 1,
        materialId: materialId,
        nombreMaterial: nombreMaterial || 'Material #' + materialId,
        precioAnterior: pAnt,
        precioNuevo: pNue,
        variacionPct: varPct,
        fecha: obtenerFechaActual(),
        usuario: usuario || 'Sistema',
        motivo: motivo || 'Actualización de catálogo'
    };
    lista.unshift(nuevo);
    guardarPreciosHistoricos(lista);
    return nuevo;
}

function obtenerDocumentosInstitucionales() {
    return leerStorage(CLAVES_STORAGE.DOCUMENTOS, DOCUMENTOS_INICIALES);
}

function guardarDocumentosInstitucionales(docs) {
    escribirStorage(CLAVES_STORAGE.DOCUMENTOS, docs);
}

function registrarDocumentoInstitucional(doc) {
    var docs = obtenerDocumentosInstitucionales();
    doc.id = docs.length + 1;
    doc.fechaEmision = doc.fechaEmision || obtenerFechaActual();
    docs.unshift(doc);
    guardarDocumentosInstitucionales(docs);
    return doc;
}

function verificarDocumentoPorCodigo(codigo) {
    var docs = obtenerDocumentosInstitucionales();
    for (var i = 0; i < docs.length; i++) {
        if (docs[i].codigo === codigo) return docs[i];
    }
    return null;
}

function obtenerAlertasInteligentes() {
    return leerStorage(CLAVES_STORAGE.ALERTAS_INTELIGENTES, ALERTAS_INTELIGENTES_INICIALES);
}

function guardarAlertasInteligentes(alertas) {
    escribirStorage(CLAVES_STORAGE.ALERTAS_INTELIGENTES, alertas);
}

/**
 * Carga un juego completo de datos de demostración para exposiciones en clase.
 */
function cargarDatosDemostracionCompletos() {
    escribirStorage(CLAVES_STORAGE.USUARIOS, USUARIOS_INICIALES);
    escribirStorage(CLAVES_STORAGE.MATERIALES, MATERIALES_INICIALES);
    escribirStorage(CLAVES_STORAGE.COTIZACIONES, COTIZACIONES_INICIALES);
    escribirStorage(CLAVES_STORAGE.BITACORA, BITACORA_INICIAL);
    escribirStorage(CLAVES_STORAGE.FINANCIAMIENTOS, FINANCIAMIENTOS_INICIALES);
    escribirStorage(CLAVES_STORAGE.MOVIMIENTOS, MOVIMIENTOS_INICIALES);
    escribirStorage(CLAVES_STORAGE.INSTITUCIONES, INSTITUCIONES_INICIALES);
    escribirStorage(CLAVES_STORAGE.PRESUPUESTOS, PRESUPUESTOS_INICIALES);
    escribirStorage(CLAVES_STORAGE.PROYECTOS, PROYECTOS_INICIALES);
    escribirStorage(CLAVES_STORAGE.ALMACENES, ALMACENES_INICIALES);
    escribirStorage(CLAVES_STORAGE.INVENTARIO_STOCK, INVENTARIO_STOCK_INICIAL);
    escribirStorage(CLAVES_STORAGE.INVENTARIO_MOVIMIENTOS, INVENTARIO_MOVIMIENTOS_INICIALES);
    escribirStorage(CLAVES_STORAGE.PROVEEDORES, PROVEEDORES_INICIALES);
    escribirStorage(CLAVES_STORAGE.PRECIOS_HISTORICOS, PRECIOS_HISTORICOS_INICIALES);
    escribirStorage(CLAVES_STORAGE.DOCUMENTOS, DOCUMENTOS_INICIALES);
    escribirStorage(CLAVES_STORAGE.ALERTAS_INTELIGENTES, ALERTAS_INTELIGENTES_INICIALES);
    localStorage.setItem(CLAVES_STORAGE.CONTADOR, '4');
    guardarTasaBCV(TASA_BCV_INICIAL, formatearFechaHoy());
    localStorage.removeItem(CLAVES_STORAGE.BORRADOR_ASISTENTE);
    localStorage.removeItem(CLAVES_STORAGE.NOTIFICACIONES);
}

/**
 * Vacía completamente las cotizaciones y bitácora para empezar de cero una demostración limpia.
 */
function vaciarDatosSistema() {
    escribirStorage(CLAVES_STORAGE.COTIZACIONES, []);
    escribirStorage(CLAVES_STORAGE.FINANCIAMIENTOS, []);
    escribirStorage(CLAVES_STORAGE.MOVIMIENTOS, []);
    escribirStorage(CLAVES_STORAGE.BITACORA, [
        { fecha: obtenerFechaActual(), usuario: 'Sistema', accion: 'SISTEMA_REINICIADO', detalle: 'Reinicio total de datos para nueva demostración.' }
    ]);
    localStorage.removeItem(CLAVES_STORAGE.BORRADOR_ASISTENTE);
    localStorage.removeItem(CLAVES_STORAGE.NOTIFICACIONES);
    localStorage.setItem(CLAVES_STORAGE.CONTADOR, '0');

    // Restablecer saldo comprometido y gastado de los usuarios
    var usuarios = obtenerUsuarios();
    for (var i = 0; i < usuarios.length; i++) {
        usuarios[i].gastado = 0;
        usuarios[i].comprometido = 0;
    }
    guardarUsuarios(usuarios);
}

