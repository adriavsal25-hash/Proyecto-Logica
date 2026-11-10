-- =========================================================================
-- SICOP-VE 2.0 — SEMILLAS INICIALES POSTGRESQL (v2.0)
-- =========================================================================

-- 1. INSTITUCIONES
INSERT INTO instituciones (id, codigo, nombre, tipo, rif, direccion, estado_venezolano, limite_presupuestario, activo) VALUES
(1, 'GOB-MIR', 'Gobernación Bolivariana de Miranda', 'GOBERNACION', 'G-20000142-1', 'Los Teques, Edif. Gubernamental', 'Miranda', 90000.00, true),
(2, 'ALC-GUA', 'Alcaldía Bolivariana de Guarenas', 'ALCALDIA', 'G-20004512-3', 'Plaza Bolívar de Guarenas', 'Miranda', 35000.00, true),
(3, 'ALC-CHA', 'Alcaldía de Chacao', 'ALCALDIA', 'G-20007891-2', 'Av. Venezuela, Chacao', 'Distrito Capital', 45000.00, true),
(4, 'ALC-MAR', 'Alcaldía de Maracaibo', 'ALCALDIA', 'G-20001199-4', 'Casco Central Maracaibo', 'Zulia', 50000.00, true),
(5, 'EMP-VIAMER', 'Empresa de Vialidad Mérida (Viamer)', 'EMPRESA_PUBLICA', 'J-30441920-5', 'Av. Las Américas, Mérida', 'Mérida', 25000.00, true),
(6, 'ALC-IRI', 'Alcaldía Bolivariana de Iribarren', 'ALCALDIA', 'G-20003311-8', 'Carrera 17 con Calle 25, Barquisimeto', 'Lara', 40000.00, true),
(7, 'GOB-SUC', 'Gobernación del Estado Sucre', 'GOBERNACION', 'G-20000551-0', 'Cumaná, Calle Sucre', 'Sucre', 75000.00, true),
(8, 'ALC-MCPO', 'Alcaldía de San Cristóbal', 'ALCALDIA', 'G-20008812-7', 'Centro Cívico San Cristóbal', 'Táchira', 38000.00, true),
(9, 'COM-PANAM', 'Comuna Panamericana 2026', 'COMUNA', 'J-50119922-3', 'Carretera Panamericana Km 18', 'Miranda', 15000.00, true)
ON CONFLICT (id) DO NOTHING;

-- 2. USUARIOS
-- Clave demo 'admin123' o '1234'
INSERT INTO usuarios (id, institucion_id, usuario, clave_hash, nombre_completo, email, cargo, rol, nivel, ingreso_mensual, limite_gasto, activo) VALUES
(1, 1, 'gobernacion_miranda', crypt('admin123', gen_salt('bf')), 'Ing. Ana Pérez', 'ana.perez@miranda.gob.ve', 'Directora de Obras Públicas', 'GOBERNACION', 5, 90000.00, 90000.00, true),
(2, 2, 'alcaldia_guarenas', crypt('1234', gen_salt('bf')), 'María González', 'maria.gonzalez@guarenas.gob.ve', 'Jefe de Infraestructura', 'ALCALDIA', 3, 35000.00, 35000.00, true),
(3, 3, 'alcaldia_chacao', crypt('1234', gen_salt('bf')), 'Carlos Rodríguez', 'carlos.rodriguez@chacao.gob.ve', 'Coordinador Urbano', 'ALCALDIA', 3, 45000.00, 45000.00, true),
(4, 4, 'alcaldia_maracaibo', crypt('1234', gen_salt('bf')), 'Sofía Morales', 'sofia.morales@maracaibo.gob.ve', 'Ingeniero Municipal', 'ALCALDIA', 3, 50000.00, 50000.00, true),
(5, 5, 'empresa_viamer', crypt('1234', gen_salt('bf')), 'Luis Hernández', 'luis.hernandez@viamer.gob.ve', 'Gerente de Operaciones', 'EMPRESA', 2, 25000.00, 25000.00, true),
(6, 6, 'alcaldia_iribarren', crypt('1234', gen_salt('bf')), 'Pedro Castillo', 'pedro.castillo@iribarren.gob.ve', 'Director de Vialidad', 'ALCALDIA', 3, 40000.00, 40000.00, true),
(7, 1, 'marcos_rivas', crypt('admin123', gen_salt('bf')), 'Ing. Marcos Rivas', 'marcos.rivas@miranda.gob.ve', 'Supervisor Regional de Obras', 'GOBERNACION', 5, 80000.00, 80000.00, true),
(8, 8, 'carmen_urdaneta', crypt('1234', gen_salt('bf')), 'Dra. Carmen Urdaneta', 'carmen.urdaneta@sancristobal.gob.ve', 'Directora de Servicios Públicos', 'ALCALDIA', 3, 38000.00, 38000.00, true),
(9, 9, 'elena_blanco', crypt('1234', gen_salt('bf')), 'Elena Blanco', 'elena.blanco@comunapanamericana.gob.ve', 'Coordinadora de Hábitat y Vivienda', 'CONSTRUCTOR', 1, 15000.00, 15000.00, true)
ON CONFLICT (id) DO NOTHING;

-- 3. PRESUPUESTOS INSTITUCIONALES (AÑO 2026)
INSERT INTO presupuestos_institucionales (institucion_id, ano_fiscal, monto_asignado, monto_comprometido, monto_ejecutado, alerta_umbral_pct, estado) VALUES
(1, 2026, 90000.00, 0.00, 0.00, 80.00, 'ABIERTO'),
(2, 2026, 35000.00, 0.00, 4472.50, 75.00, 'ABIERTO'),
(3, 2026, 45000.00, 4647.74, 0.00, 80.00, 'ABIERTO'),
(4, 2026, 50000.00, 0.00, 0.00, 85.00, 'ABIERTO'),
(5, 2026, 25000.00, 1800.00, 0.00, 70.00, 'ABIERTO'),
(6, 2026, 40000.00, 2007.89, 0.00, 80.00, 'ABIERTO')
ON CONFLICT (institucion_id, ano_fiscal) DO NOTHING;

-- 4. ALMACENES
INSERT INTO almacenes (id, institucion_id, codigo, nombre, ubicacion, estado_venezolano, capacidad_m2, responsable, activo) VALUES
(1, 1, 'ALM-CEN-01', 'Almacén Central Los Teques', 'Zona Industrial El Tambor, Galpón 4', 'Miranda', 1200.00, 'Ing. Carlos Mendoza', true),
(2, 1, 'ALM-GUA-02', 'Almacén Regional Guarenas-Guatire', 'Av. Intercomunal Guarenas', 'Miranda', 650.00, 'Téc. Rafael Ochoa', true),
(3, 3, 'ALM-CCS-03', 'Almacén Metropolitano Chacao', 'Zona Rental Bello Monte', 'Distrito Capital', 450.00, 'Lic. Alberto Silva', true),
(4, 6, 'ALM-BAR-04', 'Almacén Occidente Barquisimeto', 'Zona Industrial II, Barquisimeto', 'Lara', 900.00, 'Ing. Mireya Gil', true)
ON CONFLICT (id) DO NOTHING;

-- 5. PROYECTOS Y OBRAS PÚBLICAS
INSERT INTO proyectos_obras (id, institucion_id, codigo_proyecto, nombre, descripcion, estado_venezolano, presupuesto_estimado_usd, avance_fisico_pct, avance_financiero_pct, estado, fecha_inicio, fecha_fin_estimada, responsable_ingeniero) VALUES
(1, 2, 'PRY-2026-001', 'Rehabilitación Módulo de Salud Trapichito', 'Impermeabilización, sustitución de luminarias y adecuación sanitaria', 'Miranda', 4472.50, 100.00, 100.00, 'CULMINADA', '2026-01-15', '2026-03-30', 'Ing. Roberto Méndez'),
(2, 3, 'PRY-2026-002', 'Canalización de Aguas Pluviales Av. Principal', 'Drenajes profundos, tuberías corrugadas y torrenteras', 'Distrito Capital', 4647.74, 45.00, 50.00, 'EN_EJECUCION', '2026-02-01', '2026-05-15', 'Ing. Andrea Colmenares'),
(3, 5, 'PRY-2026-003', 'Pavimentación Rígida Sector El Valle', 'Colocación de losas de concreto armado y cunetas laterales', 'Mérida', 1800.00, 25.00, 30.00, 'EN_EJECUCION', '2026-02-20', '2026-06-10', 'Ing. Luis Hernández'),
(4, 6, 'PRY-2026-004', 'Alumbrado Público y Vialidad Carrera 19', 'Tendido eléctrico y rehabilitación de calzada', 'Lara', 2007.89, 10.00, 15.00, 'EN_PLANIFICACION', '2026-04-01', '2026-07-30', 'Ing. Pedro Castillo')
ON CONFLICT (id) DO NOTHING;

-- 6. COTIZACIONES BASE
INSERT INTO cotizaciones (id, numero, usuario_id, institucion_id, proyecto_id, nombre_obra, estado_destino, ciudad_proveedora, subtotal_base, flete_total, descuento_total, descuento_porcentaje, monto_neto, contingencia, iva, total_usd, total_bs, tasa_bcv, peso_total_kg, estado) VALUES
(1, 'COT-0001', 2, 2, 1, 'Rehabilitación Módulo Trapichito', 'Miranda', 'Los Teques', 3800.00, 120.00, 152.00, 4.00, 3768.00, 188.40, 516.10, 4472.50, 4025250.00, 900.00, 4200.00, 'ENTREGADA'),
(2, 'COT-0002', 3, 3, 2, 'Drenajes Av. Principal Chacao', 'Distrito Capital', 'Valencia', 3950.00, 140.00, 158.00, 4.00, 3932.00, 196.60, 519.14, 4647.74, 4182966.00, 900.00, 3900.00, 'APROBADA'),
(3, 'COT-0003', 5, 5, 3, 'Pavimentación Sector El Valle', 'Mérida', 'Barquisimeto', 1500.00, 95.00, 30.00, 2.00, 1565.00, 78.25, 156.75, 1800.00, 1620000.00, 900.00, 2100.00, 'APROBADA'),
(4, 'COT-0004', 6, 6, 4, 'Alumbrado y Vialidad Carrera 19', 'Lara', 'Valencia', 1700.00, 110.00, 68.00, 4.00, 1742.00, 87.10, 178.79, 2007.89, 1807101.00, 900.00, 1850.00, 'ENVIADA')
ON CONFLICT (id) DO NOTHING;

-- 7. FINANCIAMIENTOS Y CUOTAS (CASHEA / INSTITUCIONAL)
INSERT INTO financiamientos (id, cotizacion_id, usuario_id, institucion_id, modalidad, monto_total_usd, porcentaje_inicial, monto_inicial_usd, saldo_restante_usd, recargo_porcentaje, total_financiado_usd, numero_cuotas, monto_cuota_usd, cuotas_pagadas, saldo_pendiente_usd, total_pagado_usd, dias_atraso, estado) VALUES
(1, 1, 2, 2, 'quincenal_3', 4472.50, 50.00, 2236.25, 2236.25, 0.00, 2236.25, 3, 745.42, 3, 0.00, 4472.50, 0, 'PAGADO'),
(2, 2, 3, 3, 'quincenal_3', 4647.74, 50.00, 2323.87, 2323.87, 0.00, 2323.87, 3, 774.62, 0, 4647.74, 0.00, 0, 'AL_DIA'),
(3, 3, 5, 5, 'quincenal_3', 1800.00, 50.00, 900.00, 900.00, 0.00, 900.00, 3, 300.00, 0, 1800.00, 0.00, 32, 'EN_MORA')
ON CONFLICT (id) DO NOTHING;

-- Cuotas de COT-0001 (Liquidadas)
INSERT INTO cuotas_financiamiento (financiamiento_id, numero_cuota, monto_usd, monto_bs, tasa_bcv, fecha_vencimiento, fecha_pago, dias_atraso, estado, referencia_pago) VALUES
(1, 1, 745.42, 670878.00, 900.00, '2026-02-15', '2026-02-14', 0, 'PAGADA', 'TRANSF-BCV-98124'),
(1, 2, 745.42, 670878.00, 900.00, '2026-03-01', '2026-02-28', 0, 'PAGADA', 'TRANSF-BCV-99341'),
(1, 3, 745.41, 670869.00, 900.00, '2026-03-15', '2026-03-14', 0, 'PAGADA', 'TRANSF-BCV-99882')
ON CONFLICT (financiamiento_id, numero_cuota) DO NOTHING;

-- Cuotas de COT-0003 (En Mora)
INSERT INTO cuotas_financiamiento (financiamiento_id, numero_cuota, monto_usd, monto_bs, tasa_bcv, fecha_vencimiento, fecha_pago, dias_atraso, mora_usd, estado) VALUES
(3, 1, 300.00, 270000.00, 900.00, '2026-03-10', NULL, 32, 9.60, 'VENCIDA'),
(3, 2, 300.00, 270000.00, 900.00, '2026-03-25', NULL, 17, 5.10, 'VENCIDA'),
(3, 3, 300.00, 270000.00, 900.00, '2026-04-10', NULL, 0, 0.00, 'PENDIENTE')
ON CONFLICT (financiamiento_id, numero_cuota) DO NOTHING;

-- 8. LIBRO MAYOR DE MOVIMIENTOS
INSERT INTO movimientos_pago (correlativo, financiamiento_id, cuota_numero, usuario_id, institucion_id, tipo, monto_usd, monto_bs, tasa_bcv, referencia_bancaria, banco_origen, banco_destino, estado, fecha_reporte, fecha_conciliacion) VALUES
('MOV-2026-0001', 1, 0, 2, 2, 'INICIAL', 2236.25, 2012625.00, 900.00, 'INIC-GUARENAS-01', 'Banco de Venezuela', 'Banco del Tesoro', 'CONFIRMADO', '2026-01-20', '2026-01-20'),
('MOV-2026-0002', 1, 1, 2, 2, 'CUOTA', 745.42, 670878.00, 900.00, 'TRANSF-BCV-98124', 'Banco de Venezuela', 'Banco del Tesoro', 'CONFIRMADO', '2026-02-14', '2026-02-14'),
('MOV-2026-0003', 1, 2, 2, 2, 'CUOTA', 745.42, 670878.00, 900.00, 'TRANSF-BCV-99341', 'Banco Banesco', 'Banco del Tesoro', 'CONFIRMADO', '2026-02-28', '2026-02-28'),
('MOV-2026-0004', 1, 3, 2, 2, 'CUOTA', 745.41, 670869.00, 900.00, 'TRANSF-BCV-99882', 'Banco de Venezuela', 'Banco del Tesoro', 'CONFIRMADO', '2026-03-14', '2026-03-14'),
('MOV-2026-0005', 2, 0, 3, 3, 'INICIAL', 2323.87, 2091483.00, 900.00, 'DEP-CHACAO-7721', 'Banco Mercantil', 'Banco del Tesoro', 'CONFIRMADO', '2026-02-05', '2026-02-05'),
('MOV-2026-0006', 3, 0, 5, 5, 'INICIAL', 900.00, 810000.00, 900.00, 'INIC-VIAMER-03', 'Banco Bicentenario', 'Banco del Tesoro', 'CONFIRMADO', '2026-02-22', '2026-02-22'),
('MOV-2026-0007', 3, 1, 5, 5, 'CUOTA', 309.60, 278640.00, 900.00, 'REP-MERIDA-99410', 'Banco Bicentenario', 'Banco del Tesoro', 'REPORTADO', '2026-04-05', NULL)
ON CONFLICT (correlativo) DO NOTHING;

-- 9. AUDITORÍA INICIAL
INSERT INTO auditoria_eventos (institucion_id, usuario_id, usuario_nombre, modulo, accion, entidad, entidad_id, descripcion) VALUES
(1, 1, 'Ing. Ana Pérez', 'SISTEMA', 'INICIALIZACION', 'PLATAFORMA', 'v2.0', 'Inicialización y arranque del ecosistema empresarial SICOP-VE 2.0.'),
(2, 2, 'María González', 'COTIZADOR', 'COTIZACION_CREADA', 'COTIZACION', 'COT-0001', 'Creación de cotización para Rehabilitación Módulo Trapichito.'),
(1, 1, 'Ing. Ana Pérez', 'APROBACIONES', 'COTIZACION_APROBADA', 'COTIZACION', 'COT-0001', 'Aprobación de la cotización COT-0001 bajo plan financiado.'),
(1, 1, 'Ing. Ana Pérez', 'CONTROL_OBRAS', 'COTIZACION_ENTREGADA', 'COTIZACION', 'COT-0001', 'Formalización de entrega y pase de fondos a gastado.'),
(5, 5, 'Luis Hernández', 'FINANCIAMIENTO', 'PAGO_REPORTADO', 'PAGO', 'REP-MERIDA-99410', 'Reporte de pago por $309.60 para cuota 1 en mora de COT-0003.')
ON CONFLICT DO NOTHING;

