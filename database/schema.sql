-- =========================================================================
-- SICOP-VE 2.0 — ESQUEMA RELACIONAL EMPRESARIAL POSTGRESQL (v2.0)
-- Plataforma Institucional Inteligente, Financiera y Administrativa
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. INSTITUCIONES (MULTI-TENANT ISOLATION)
-- =========================================================================
CREATE TABLE IF NOT EXISTS instituciones (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('GOBERNACION', 'ALCALDIA', 'EMPRESA_PUBLICA', 'COMUNA', 'ENTE_DESCENTRALIZADO')),
    rif VARCHAR(20) UNIQUE NOT NULL,
    direccion TEXT,
    estado_venezolano VARCHAR(50) NOT NULL,
    telefono VARCHAR(30),
    email_contacto VARCHAR(100),
    limite_presupuestario NUMERIC(15,2) DEFAULT 0.00 CHECK (limite_presupuestario >= 0),
    activo BOOLEAN DEFAULT TRUE,
    creado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 2. USUARIOS Y CONTROL DE ACCESO (RBAC)
-- =========================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    institucion_id INT REFERENCES instituciones(id) ON DELETE RESTRICT,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    clave_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(120) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    cargo VARCHAR(80),
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('SUPERADMIN', 'GOBERNACION', 'ALCALDIA', 'EMPRESA', 'CONSTRUCTOR')),
    nivel INT NOT NULL CHECK (nivel BETWEEN 1 AND 5),
    ingreso_mensual NUMERIC(15,2) DEFAULT 0.00,
    limite_gasto NUMERIC(15,2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE,
    creado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP WITH TIME ZONE
);

-- =========================================================================
-- 3. GESTIÓN PRESUPUESTARIA INSTITUCIONAL
-- =========================================================================
CREATE TABLE IF NOT EXISTS presupuestos_institucionales (
    id SERIAL PRIMARY KEY,
    institucion_id INT REFERENCES instituciones(id) ON DELETE CASCADE,
    ano_fiscal INT NOT NULL,
    monto_asignado NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (monto_asignado >= 0),
    monto_comprometido NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (monto_comprometido >= 0),
    monto_ejecutado NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (monto_ejecutado >= 0),
    monto_disponible NUMERIC(15,2) GENERATED ALWAYS AS (monto_asignado - monto_comprometido - monto_ejecutado) STORED,
    alerta_umbral_pct NUMERIC(5,2) DEFAULT 80.00,
    estado VARCHAR(30) DEFAULT 'ABIERTO' CHECK (estado IN ('PLANIFICADO', 'ABIERTO', 'CERRADO', 'BLOQUEADO')),
    creado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institucion_id, ano_fiscal)
);

-- =========================================================================
-- 4. PROYECTOS Y OBRAS PÚBLICAS
-- =========================================================================
CREATE TABLE IF NOT EXISTS proyectos_obras (
    id SERIAL PRIMARY KEY,
    institucion_id INT REFERENCES instituciones(id) ON DELETE RESTRICT,
    codigo_proyecto VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    estado_venezolano VARCHAR(50) NOT NULL,
    municipio VARCHAR(80),
    presupuesto_estimado_usd NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    avance_fisico_pct NUMERIC(5,2) DEFAULT 0.00 CHECK (avance_fisico_pct BETWEEN 0 AND 100),
    avance_financiero_pct NUMERIC(5,2) DEFAULT 0.00 CHECK (avance_financiero_pct BETWEEN 0 AND 100),
    fecha_inicio DATE,
    fecha_fin_estimada DATE,
    fecha_culminacion DATE,
    responsable_ingeniero VARCHAR(120),
    estado VARCHAR(30) DEFAULT 'EN_PLANIFICACION' CHECK (estado IN ('EN_PLANIFICACION', 'EN_EJECUCION', 'PARALIZADA', 'CULMINADA', 'CANCELADA')),
    creado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 5. CATÁLOGO MAESTRO Y PROVEEDORES
-- =========================================================================
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    rif VARCHAR(20) UNIQUE NOT NULL,
    razon_social VARCHAR(150) NOT NULL,
    nombre_comercial VARCHAR(150),
    contacto_nombre VARCHAR(100),
    telefono VARCHAR(30),
    email VARCHAR(100),
    ciudad VARCHAR(80) NOT NULL,
    estado_venezolano VARCHAR(50) NOT NULL,
    calificacion NUMERIC(3,2) DEFAULT 5.00 CHECK (calificacion BETWEEN 1 AND 5),
    activo BOOLEAN DEFAULT TRUE,
    creado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS materiales (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    sector VARCHAR(80) NOT NULL,
    unidad VARCHAR(30) NOT NULL,
    descripcion TEXT,
    precio_base NUMERIC(12,2) NOT NULL CHECK (precio_base > 0),
    peso_kg NUMERIC(10,3) NOT NULL DEFAULT 1.00 CHECK (peso_kg > 0),
    permite_decimales BOOLEAN DEFAULT FALSE,
    stock_minimo INT DEFAULT 10 CHECK (stock_minimo >= 0),
    proveedor_preferido_id INT REFERENCES proveedores(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE,
    creado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS precios_historicos (
    id SERIAL PRIMARY KEY,
    material_id INT REFERENCES materiales(id) ON DELETE CASCADE,
    proveedor_id INT REFERENCES proveedores(id) ON DELETE SET NULL,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    precio_anterior NUMERIC(12,2) NOT NULL,
    precio_nuevo NUMERIC(12,2) NOT NULL,
    variacion_pct NUMERIC(6,2) GENERATED ALWAYS AS (
        CASE WHEN precio_anterior > 0 THEN ((precio_nuevo - precio_anterior) / precio_anterior) * 100 ELSE 0 END
    ) STORED,
    motivo VARCHAR(200),
    fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 6. ALMACENES Y GESTIÓN DE INVENTARIO
-- =========================================================================
CREATE TABLE IF NOT EXISTS almacenes (
    id SERIAL PRIMARY KEY,
    institucion_id INT REFERENCES instituciones(id) ON DELETE RESTRICT,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    ubicacion TEXT NOT NULL,
    estado_venezolano VARCHAR(50) NOT NULL,
    capacidad_m2 NUMERIC(10,2) DEFAULT 500.00,
    responsable VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    creado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_almacen_stock (
    id SERIAL PRIMARY KEY,
    almacen_id INT REFERENCES almacenes(id) ON DELETE CASCADE,
    material_id INT REFERENCES materiales(id) ON DELETE RESTRICT,
    stock_actual NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (stock_actual >= 0),
    stock_reservado NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (stock_reservado >= 0),
    stock_disponible NUMERIC(12,2) GENERATED ALWAYS AS (stock_actual - stock_reservado) STORED,
    actualizado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(almacen_id, material_id)
);

CREATE TABLE IF NOT EXISTS inventario_movimientos (
    id SERIAL PRIMARY KEY,
    material_id INT REFERENCES materiales(id) ON DELETE RESTRICT,
    almacen_origen_id INT REFERENCES almacenes(id) ON DELETE RESTRICT,
    almacen_destino_id INT REFERENCES almacenes(id) ON DELETE SET NULL,
    proyecto_id INT REFERENCES proyectos_obras(id) ON DELETE SET NULL,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA', 'TRASLADO', 'AJUSTE', 'RESERVA', 'DEVOLUCION')),
    cantidad NUMERIC(12,2) NOT NULL CHECK (cantidad > 0),
    motivo TEXT NOT NULL,
    referencia VARCHAR(50),
    fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 7. COTIZACIONES Y LÍNEAS DE PRESUPUESTO
-- =========================================================================
CREATE TABLE IF NOT EXISTS cotizaciones (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(30) UNIQUE NOT NULL,
    usuario_id INT REFERENCES usuarios(id) ON DELETE RESTRICT,
    institucion_id INT REFERENCES instituciones(id) ON DELETE RESTRICT,
    proyecto_id INT REFERENCES proyectos_obras(id) ON DELETE SET NULL,
    nombre_obra VARCHAR(200) NOT NULL,
    estado_destino VARCHAR(50) NOT NULL,
    ciudad_proveedora VARCHAR(50) DEFAULT 'Los Teques',
    subtotal_base NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    flete_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    descuento_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    descuento_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    monto_neto NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    contingencia NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    iva NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_usd NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_bs NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    tasa_bcv NUMERIC(10,2) NOT NULL DEFAULT 900.00,
    peso_total_kg NUMERIC(12,3) NOT NULL DEFAULT 0.00,
    estado VARCHAR(30) DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'ENTREGADA', 'CANCELADA')),
    fecha_validez_dias INT DEFAULT 15,
    notas TEXT,
    aprobado_por_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    rechazado_por_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_rechazo TIMESTAMP WITH TIME ZONE,
    motivo_rechazo TEXT,
    creado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cotizacion_items (
    id SERIAL PRIMARY KEY,
    cotizacion_id INT REFERENCES cotizaciones(id) ON DELETE CASCADE,
    material_id INT REFERENCES materiales(id) ON DELETE RESTRICT,
    cantidad NUMERIC(12,2) NOT NULL CHECK (cantidad > 0),
    precio_unitario_usd NUMERIC(12,2) NOT NULL,
    peso_unitario_kg NUMERIC(10,3) NOT NULL,
    flete_item_usd NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_item_usd NUMERIC(12,2) NOT NULL
);

-- =========================================================================
-- 8. PLANES DE FINANCIAMIENTO Y CUOTAS (ESTILO CASHEA / INSTITUCIONAL)
-- =========================================================================
CREATE TABLE IF NOT EXISTS financiamientos (
    id SERIAL PRIMARY KEY,
    cotizacion_id INT UNIQUE REFERENCES cotizaciones(id) ON DELETE CASCADE,
    usuario_id INT REFERENCES usuarios(id) ON DELETE RESTRICT,
    institucion_id INT REFERENCES instituciones(id) ON DELETE RESTRICT,
    modalidad VARCHAR(40) NOT NULL CHECK (modalidad IN ('contado', 'quincenal_3', 'quincenal_6', 'mensual_4')),
    monto_total_usd NUMERIC(15,2) NOT NULL,
    porcentaje_inicial NUMERIC(5,2) NOT NULL,
    monto_inicial_usd NUMERIC(15,2) NOT NULL,
    saldo_restante_usd NUMERIC(15,2) NOT NULL,
    recargo_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    monto_recargo_usd NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_financiado_usd NUMERIC(15,2) NOT NULL,
    numero_cuotas INT NOT NULL CHECK (numero_cuotas >= 0),
    monto_cuota_usd NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    cuotas_pagadas INT NOT NULL DEFAULT 0,
    saldo_pendiente_usd NUMERIC(15,2) NOT NULL,
    total_pagado_usd NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    dias_atraso INT NOT NULL DEFAULT 0,
    estado VARCHAR(30) DEFAULT 'AL_DIA' CHECK (estado IN ('AL_DIA', 'EN_MORA', 'PAGADO', 'CANCELADO')),
    fecha_emision TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cuotas_financiamiento (
    id SERIAL PRIMARY KEY,
    financiamiento_id INT REFERENCES financiamientos(id) ON DELETE CASCADE,
    numero_cuota INT NOT NULL,
    monto_usd NUMERIC(15,2) NOT NULL,
    monto_bs NUMERIC(15,2) NOT NULL,
    tasa_bcv NUMERIC(10,2) NOT NULL DEFAULT 900.00,
    fecha_vencimiento DATE NOT NULL,
    fecha_pago TIMESTAMP WITH TIME ZONE,
    dias_atraso INT DEFAULT 0,
    mora_usd NUMERIC(10,2) DEFAULT 0.00,
    estado VARCHAR(30) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PAGADA', 'VENCIDA', 'ANULADA')),
    referencia_pago VARCHAR(60),
    actualizado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(financiamiento_id, numero_cuota)
);

-- =========================================================================
-- 9. CONCILIACIÓN, PAGOS Y LIBRO MAYOR FINANCIERO
-- =========================================================================
CREATE TABLE IF NOT EXISTS movimientos_pago (
    id SERIAL PRIMARY KEY,
    correlativo VARCHAR(30) UNIQUE NOT NULL,
    financiamiento_id INT REFERENCES financiamientos(id) ON DELETE RESTRICT,
    cuota_numero INT,
    usuario_id INT REFERENCES usuarios(id) ON DELETE RESTRICT,
    institucion_id INT REFERENCES instituciones(id) ON DELETE RESTRICT,
    tipo VARCHAR(40) NOT NULL CHECK (tipo IN ('INICIAL', 'CUOTA', 'CONTADO', 'MORA', 'AJUSTE')),
    monto_usd NUMERIC(15,2) NOT NULL CHECK (monto_usd > 0),
    monto_bs NUMERIC(15,2) NOT NULL CHECK (monto_bs > 0),
    tasa_bcv NUMERIC(10,2) NOT NULL DEFAULT 900.00,
    referencia_bancaria VARCHAR(80) NOT NULL,
    banco_origen VARCHAR(80),
    banco_destino VARCHAR(80),
    comprobante_url TEXT,
    comprobante_hash VARCHAR(64),
    estado VARCHAR(30) DEFAULT 'REPORTADO' CHECK (estado IN ('REPORTADO', 'EN_REVISION', 'CONFIRMADO', 'RECHAZADO', 'ANULADO')),
    fecha_reporte TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    conciliado_por_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_conciliacion TIMESTAMP WITH TIME ZONE,
    motivo_rechazo TEXT,
    notas TEXT
);

-- =========================================================================
-- 10. GESTOR DOCUMENTAL Y VALIDACIÓN CON FIRMA SHA-256
-- =========================================================================
CREATE TABLE IF NOT EXISTS documentos_institucionales (
    id SERIAL PRIMARY KEY,
    institucion_id INT REFERENCES instituciones(id) ON DELETE CASCADE,
    recurso_tipo VARCHAR(40) NOT NULL CHECK (recurso_tipo IN ('COTIZACION', 'PAGO', 'PROYECTO', 'INVENTARIO', 'PRESUPUESTO')),
    recurso_id INT NOT NULL,
    codigo_documento VARCHAR(40) UNIQUE NOT NULL,
    titulo VARCHAR(180) NOT NULL,
    hash_sha256 VARCHAR(64) NOT NULL,
    emitido_por_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_emision TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    url_archivo TEXT,
    codigo_verificacion_qr VARCHAR(120) NOT NULL,
    valido BOOLEAN DEFAULT TRUE
);

-- =========================================================================
-- 11. BITÁCORA INMUTABLE DE AUDITORÍA Y TRAZABILIDAD (APPEND-ONLY)
-- =========================================================================
CREATE TABLE IF NOT EXISTS auditoria_eventos (
    id BIGSERIAL PRIMARY KEY,
    institucion_id INT REFERENCES instituciones(id) ON DELETE SET NULL,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_nombre VARCHAR(120) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(60) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id VARCHAR(50),
    ip_origen VARCHAR(45) DEFAULT '127.0.0.1',
    user_agent TEXT,
    detalles_previos JSONB,
    detalles_nuevos JSONB,
    descripcion TEXT NOT NULL,
    creado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prohibir UPDATE y DELETE en auditoria_eventos para garantizar inmutabilidad
CREATE OR REPLACE RULE auditoria_inmutable_no_update AS ON UPDATE TO auditoria_eventos DO INSTEAD NOTHING;
CREATE OR REPLACE RULE auditoria_inmutable_no_delete AS ON DELETE TO auditoria_eventos DO INSTEAD NOTHING;

-- =========================================================================
-- 12. INTELIGENCIA DE GESTIÓN Y NOTIFICACIONES
-- =========================================================================
CREATE TABLE IF NOT EXISTS alertas_inteligentes (
    id SERIAL PRIMARY KEY,
    institucion_id INT REFERENCES instituciones(id) ON DELETE CASCADE,
    codigo_alerta VARCHAR(50) NOT NULL,
    nivel VARCHAR(20) NOT NULL CHECK (nivel IN ('INFO', 'ADVERTENCIA', 'CRITICO')),
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    accion_recomendada TEXT,
    modulo_destino VARCHAR(50),
    leida BOOLEAN DEFAULT FALSE,
    fecha_generacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notificaciones_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('INFO', 'EXITO', 'ADVERTENCIA', 'PELIGRO')),
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    enlace_modulo VARCHAR(50),
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- ÍNDICES DE ALTO RENDIMIENTO
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_institucion ON usuarios(institucion_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_usuario ON cotizaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON cotizaciones(estado);
CREATE INDEX IF NOT EXISTS idx_financiamientos_usuario ON financiamientos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_financiamientos_estado ON financiamientos(estado);
CREATE INDEX IF NOT EXISTS idx_cuotas_vencimiento ON cuotas_financiamiento(fecha_vencimiento, estado);
CREATE INDEX IF NOT EXISTS idx_movimientos_financiamiento ON movimientos_pago(financiamiento_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_estado ON movimientos_pago(estado);
CREATE INDEX IF NOT EXISTS idx_stock_almacen_material ON material_almacen_stock(almacen_id, material_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria_eventos(creado_el DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_eventos(usuario_id);

