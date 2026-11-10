# ARQUITECTURA TÉCNICA DEL SISTEMA — SICOP-VE 2.0
**Plataforma Institucional Inteligente, Financiera y Administrativa de Nivel Empresarial**

---

## 1. RESUMEN EJECUTIVO Y VISIÓN GENERAL

**SICOP-VE 2.0** representa la evolución integral del Sistema Integrado de Cotización y Control Presupuestario de Obras Públicas de Venezuela, transformándolo desde una aplicación de estimación local hacia un ecosistema de gestión financiera e institucional multi-entidad con arquitectura híbrida de alta resiliencia.

### Objetivos Clave Alcanzados:
- **Aislamiento Multi-Tenant:** Capacidad de operar simultáneamente para Gobernaciones, Alcaldías, Ministerios, Corporaciones Regionales y Entes Mixtos con segregación total de cotizaciones, presupuestos y auditorías.
- **Doble Modalidad Operativa (Offline-First / Cloud-Native):** Funcionamiento autónomo e instantáneo en cliente estricto (`file:///` o servidor local) sin dependencias externas, combinable con API RESTful Express/TypeScript y PostgreSQL 16 para despliegues empresariales centralizados.
- **Gobernanza Financiera Bimonetaria:** Conversión reactiva y matemática universal entre USD ($) y Bolívares (Bs.) bajo tasa oficial del Banco Central de Venezuela (BCV), fijada estrictamente en **900,00 Bs./USD**, con soporte para recálculos en caliente en los 11 módulos de la plataforma.
- **Cadena de Custodia Inmutable:** Trazabilidad criptográfica SHA-256 de documentos y comprobantes de conciliación financiera, junto con alertas tempranas automáticas basadas en inteligencia administrativa.

---

## 2. DIAGRAMA DE ARQUITECTURA DEL SISTEMA

```
+---------------------------------------------------------------------------------------+
|                                    CAPA DE CLIENTE                                    |
|  +---------------------------------------------------------------------------------+  |
|  |           Interfaz Unificada de Usuario (HTML5 + CSS3 + Vanilla JS ES5)         |  |
|  |   - Dashboard General               - Control Financiero Institucional          |  |
|  |   - Asistente de Cotización (4 P)   - Conciliación de Pagos & Auditoría         |  |
|  |   - Calculadora Paramétrica (30 P)  - Proyecciones Financieras Multiescenario   |  |
|  |   - Proyectos y Obras (Gantt)       - Presupuestos Dinámicos (Semáforo)         |  |
|  |   - Inventario y Almacenes          - Directorio y Variación de Proveedores     |  |
|  |   - Gestor Documental Digital       - Motor Heurístico de Inteligencia Admin.   |  |
|  |   - Monitor de Salud de Sistema     - Configuración y Gobernanza Multi-Ente     |  |
|  +---------------------------------------------------------------------------------+  |
|                                          |                                            |
|                                          v                                            |
|  +---------------------------------------------------------------------------------+  |
|  |                          Adaptador API (Offline-First)                          |  |
|  |   - Detección activa de latencia/conectividad (Heartbeat /api/v2/sistema/salud) |  |
|  |   - Fallback instantáneo y transparente a motor de persistencia local           |  |
|  +---------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------+
                                           |
               +---------------------------+---------------------------+
               |                                                       |
               v (Modo Desconectado / Local)                           v (Modo Conectado / API REST)
+---------------------------------------------+       +---------------------------------------------+
|          MOTOR LOCAL DE PERSISTENCIA        |       |             BACKEND EMPRESARIAL             |
|              (js/datos.js - ES5)            |       |     (Node.js + Express + TypeScript 5)      |
|  - localStorage estructurado (18 colecciones)|      |  - Middleware de Autenticación JWT / RBAC   |
|  - Semillas completas de demostración       |       |  - Endpoints RESTful versionados /api/v2/*  |
|  - Validadores de esquema e integridad      |       |  - Validaciones de negocio & sanitización   |
|  - Motor de reglas financieras puras        |       |  - Generador de respuestas JSON normalizadas|
+---------------------------------------------+       +---------------------------------------------+
                                                                       |
                                                                       v
                                                      +---------------------------------------------+
                                                      |             CAPA DE DATOS PRISMA            |
                                                      |         (Prisma ORM + PostgreSQL 16)       |
                                                      |  - 12 Tablas relacionales normalizadas      |
                                                      |  - Claves foráneas, checks e índices B-Tree |
                                                      |  - Triggers y reglas de inmutabilidad       |
                                                      +---------------------------------------------+
```

---

## 3. MODELO DE DATOS RELACIONAL (POSTGRESQL 16)

La base de datos relacional de SICOP-VE 2.0 (`database/schema.sql` y `database/prisma/schema.prisma`) implementa un esquema en Tercera Forma Normal (3FN) con soporte para auditoría estricta:

### Entidades Principales:
1. **`instituciones`**:
   - `id` (VARCHAR PK): Identificador único (ej: `INST-GOB-MIRANDA`, `INST-ALC-CHACAO`).
   - `codigo`, `nombre`, `tipo`, `estado_geografico`, `presupuesto_anual_usd`, `activo`.
2. **`usuarios`**:
   - `id` (SERIAL PK), `nombre`, `correo`, `cargo`, `perfil` (SuperAdmin, Gobernacion, Contratista, etc.).
   - `institucion_id` (FK a `instituciones`), `limite_credito_usd`, `mora_activa`, `activo`.
3. **`presupuestos_institucionales`**:
   - `id` (VARCHAR PK), `institucion_id` (FK), `ejercicio_fiscal` (INT), `partida_codigo`, `partida_nombre`.
   - `monto_asignado_usd`, `monto_comprometido_usd`, `monto_ejecutado_usd`.
   - Columnas generadas y restricciones de integridad: `monto_disponible_usd`.
4. **`proyectos_obras`**:
   - `id` (VARCHAR PK), `codigo_obra`, `nombre`, `institucion_id` (FK), `responsable_usuario_id` (FK).
   - `presupuesto_total_usd`, `monto_ejecutado_usd`, `porcentaje_avance_fisico`, `porcentaje_avance_financiero`.
   - Fechas planificadas y reales, coordenadas GPS, estado de avance.
5. **`almacenes`**:
   - `id` (VARCHAR PK), `codigo`, `nombre`, `ubicacion_estado`, `responsable`, `capacidad_m3`.
6. **`inventario_stock`**:
   - `id` (SERIAL PK), `almacen_id` (FK), `material_id` (INT), `codigo_material`, `descripcion`.
   - `unidad`, `cantidad_disponible`, `cantidad_reservada`, `punto_reorden`.
7. **`inventario_movimientos`**:
   - `id` (VARCHAR PK), `almacen_origen_id` (FK), `almacen_destino_id` (FK nullable).
   - `tipo_movimiento` (ENTRADA, SALIDA, TRANSFERENCIA, MERMA, AJUSTE), `fecha`, `usuario_id` (FK).
8. **`proveedores`**:
   - `id` (VARCHAR PK), `rif`, `razon_social`, `calificacion_estrellas`, `rubro_principal`, `activo`.
9. **`precios_historicos`**:
   - `id` (SERIAL PK), `material_id`, `proveedor_id` (FK), `precio_unitario_usd`, `fecha_registro`, `variacion_pct`.
10. **`cotizaciones`**:
    - `id` (SERIAL PK), `numero_cotizacion`, `obra_nombre`, `usuario_id` (FK), `institucion_id` (FK).
    - `subtotal_usd`, `flete_usd`, `descuento_usd`, `contingencia_usd`, `iva_usd`, `total_usd`, `tasa_bcv`.
    - `estado` (BORRADOR, ENVIADA, EN_REVISION, APROBADA, RECHAZADA, EN_FINANCIAMIENTO, PAGADA).
11. **`planes_financiamiento` & `cuotas_financiamiento`**:
    - `id` (SERIAL PK), `cotizacion_id` (FK), `modalidad` (CASHEA_INICIAL_40_3C, INSTITUCIONAL_6C, CONTADO).
    - Número de cuota, fecha de vencimiento, monto USD, monto pagado, estado (PENDIENTE, PAGADA, EN_MORA).
12. **`movimientos_pago_conciliacion` & `auditoria_financiera`**:
    - Registro inmutable de transacciones, referencias bancarias, montos USD/Bs., comprobantes, sellos de tiempo y hashes SHA-256.

---

## 4. GOBERNANZA DE SEGURIDAD Y MATRIZ RBAC

El sistema opera bajo un modelo de control de acceso basado en roles (RBAC) con 6 perfiles estrictamente tipificados:

| Módulo / Acción | SuperAdmin | Gobernación | Alcaldía | Contratista | Auditor | Operador |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Dashboard y KPIs Generales** | Total | Total | Total | Propio | Solo Lectura | Solo Lectura |
| **Cotizador de Obras** | Total | Total | Total | Crear/Editar | Prohibido | Prohibido |
| **Aprobación de Cotizaciones** | Total | Total | Propia Institución | Prohibido | Prohibido | Prohibido |
| **Control Financiero & Conciliación** | Total | Total | Propia Institución | Ver Sus Pagos | Auditoría Total | Registro Pagos |
| **Planes de Financiamiento (Cashea)** | Total | Aprobar/Monitorear | Monitorear | Ver Cuotas | Auditoría | Prohibido |
| **Presupuestos Institucionales** | Total | Configurar/Comprometer | Comprometer | Prohibido | Auditoría | Prohibido |
| **Proyectos y Obras Públicas** | Total | Crear/Actualizar | Crear/Actualizar | Reportar Avance | Supervisar | Prohibido |
| **Inventario Multi-Almacén** | Total | Supervisar | Supervisar | Prohibido | Auditoría | Transferir/Ajustar |
| **Directorio de Proveedores** | Total | Total | Consultar | Consultar | Auditoría | Registrar |
| **Certificación de Documentos** | Total | Emitir/Verificar | Emitir/Verificar | Verificar | Verificar | Verificar |
| **Inteligencia y Alertas** | Total | Total | Total | Prohibido | Total | Avisos Operativos |
| **Monitor de Salud & Backup** | Total | Solo Monitoreo | Prohibido | Prohibido | Solo Monitoreo | Prohibido |

---

## 5. REGLAS FINANCIERAS Y BIMONETARIAS

1. **Tasa Oficial BCV:**
   - La tasa oficial es de **900,00 Bs. por cada 1,00 USD**.
   - Cualquier valor previo anómalo o residual (como 0.18 o 36.50) es automáticamente neutralizado e higienizado por los validadores de inicialización.
2. **Conversión Universal Reactiva:**
   - Todo monto almacenado en la base de datos se guarda canónicamente en `USD` para preservar su valor frente a la inflación.
   - En la capa visual, cuando el usuario conmuta el selector global a `Bs.`, la función `formatearMonedaUniversal()` multiplica el valor base por la tasa oficial BCV y aplica el formato bancario venezolano (`Bs. 1.234,56`).
3. **Esquema de Financiamiento Institucional y Cashea:**
   - **Modalidad Cashea 3 Cuotas:** 40% inicial al contado, 3 cuotas quincenales iguales de 20% cada una (días 14, 28 y 42).
   - **Modalidad Cashea 6 Cuotas:** 30% inicial al contado, 6 cuotas quincenales de 11.67%.
   - **Modalidad Institucional 12 Cuotas:** 15% inicial al contado, 12 cuotas mensuales estructuradas.
   - **Gestión de Mora:** Si una cuota supera su fecha límite sin conciliación bancaria, el usuario pasa a estado `Mora Activa`, bloqueando automáticamente nuevas cotizaciones en el sistema.

---

## 6. ESTRATEGIA OFFLINE-FIRST Y ALMACENAMIENTO HÍBRIDO

1. **Adaptador API Facade (`js/adaptador-api.js`):**
   - El cliente realiza una comprobación no bloqueante contra el endpoint de salud `/api/v2/sistema/salud`.
   - Si el backend responde, opera en modo `HÍBRIDO_CONECTADO`.
   - Si no hay conectividad (servidor apagado, caída de red o ejecución directa vía `file:///`), el adaptador conmuta automáticamente al modo `LOCAL_OFFLINE_FIRST` sin emitir excepciones en consola ni interrumpir al usuario.
2. **Service Worker y Caché Progresivo (`service-worker.js`):**
   - Precaché de activos estáticos nucleares (`index.html`, `estilos.css`, scripts `js/*.js`, iconos, tipografías e imágenes).
   - Cumplimiento de estándares PWA (`manifest.json`) para instalación en dispositivos móviles y de escritorio.
3. **Integridad Criptográfica de Certificados:**
   - Todo documento emitido (cotización aprobada, acta de recepción, constancia de solvencia) genera un hash de 64 caracteres hexadecimales (SHA-256 / digest algorítmico determinista) que puede ser verificado públicamente en el validador documental.

