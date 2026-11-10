# SICOP-VE — Documento Consolidado de Cambios y Mejoras (Changelog Técnico)

**Proyecto:** Sistema Integrado de Cotización y Control Presupuestario para Obras en Venezuela (SICOP-VE)  
**Cátedra:** Lógica y Algoritmos / Programación I  
**Versión:** 2.5 Editorial Release  
**Fecha de Entrega:** Noviembre 2026  
**Estado de Pruebas:** 43/43 Pruebas Automatizadas en Verde (100% aprobadas)

---

## 1. Resumen Ejecutivo de la Transformación

El proyecto **SICOP-VE** ha completado una transformación técnica integral que cumple dos objetivos fundamentales:
1. **Auditoría, Corrección y Blindaje Lógico (Fases 0 a 4):** Se corrigieron 13 debilidades funcionales, contables, de seguridad y de consistencia de estados identificadas en el código base, elevando la suite de pruebas unitarias de 22 a **43 pruebas automatizadas**, todas en verde.
2. **Dirección Artística Editorial y Sistema de Movimiento (Fases 5 a 7):** Se rediseñó la experiencia visual inspirada en la estética editorial y minimalista de la referencia de diseño (`ksenpanchenko.com`), implementando una paleta neutra cálida (`#F1F0EC` en modo claro y `#121211` en modo oscuro), tipografía fluida, números tabulares, numeración editorial de módulos y microinteracciones a 60fps respetando la accesibilidad WCAG 2.1 AA.

El sistema mantiene intactas sus reglas de negocio originales, las fórmulas de flete e impuestos venezolanos y su ejecución nativa mediante doble clic en `index.html` bajo protocolo `file://`, sin frameworks, librerías externas ni pasos de compilación.

---

## 2. Arquitectura de Software y Contratos Cumplidos

El sistema respeta rigurosamente el paradigma de capas desacopladas en Vanilla JavaScript (ES5 estricto):

- **`js/iconos.js`:** Biblioteca vectorial SVG en línea; retorna strings SVG limpios sin dependencias externas de fuentes de iconos.
- **`js/datos.js`:** Capa de datos y persistencia en `localStorage`. Contiene las constantes fijas (`FACTORES_CIUDADES`, `FLETES_ESTADOS`, `DESCUENTOS_PERFIL`, `PLANTILLAS_OBRA`), estructuras semilla y funciones de lectura/escritura. **Cero manipulación del DOM**.
- **`js/logica.js`:** Algoritmos puros, validaciones matemáticas, cálculo presupuestario, redondeos contables y ordenamiento manual de burbuja. **Cero manipulación del DOM**.
- **`js/movimiento.js`:** Sistema de microinteracciones, reloj oficial de Caracas UTC-4, transiciones de pestañas, contadores con animación por `requestAnimationFrame` y detección de `prefers-reduced-motion`.
- **`js/interfaz.js`:** Controlador de la interfaz gráfica, eventos de usuario, renderizado dinámico de tablas, actualización del panel reactivo en vivo y gestión de modales accesibles.
- **`js/pruebas.js`:** Framework ligero de aserciones para verificar lógica pura y contratos de persistencia sin alterar el entorno del usuario.

### Contratos Preservados:
- **Claves de almacenamiento intactas:** Se mantienen los identificadores con sufijo `_v2` (`sicop_usuarios_v2`, `sicop_materiales_v2`, `sicop_cotizaciones_v2`, `sicop_bitacora_v2`, `sicop_sesion_v2`, `sicop_tasa_bcv_v2`, `sicop_contador_correlativo_v2`, `sicop_borrador_asistente_v2`, `sicop_moneda_activa_v2`).
- **Fórmulas matemáticas oficiales:**
  - $\text{Subtotal} = \sum (\text{cantidad} \times \text{precioBase} \times \text{factorCiudad})$
  - $\text{Flete} = \text{Subtotal} \times (\text{factorEstado} - 1)$
  - $\text{Descuento} = (\text{Subtotal} + \text{Flete}) \times \%_{\text{perfil}}$
  - $\text{Neto} = \text{Subtotal} + \text{Flete} - \text{Descuento}$
  - $\text{Contingencia} = \text{Neto} \times 5\%$
  - $\text{IVA} = (\text{Neto} + \text{Contingencia}) \times 16\%$
  - $\text{Total} = \text{Neto} + \text{Contingencia} + \text{IVA}$
- **Algoritmo de Burbuja:** Mantenido manualmente para ordenar ciudades y clasificaciones sin recurrir al método nativo `.sort()`.

---

## 3. Correcciones Críticas de Lógica y Seguridad (P0 – P3)

### P0.1 — Sistema de Borrador Automático Aislado por Usuario
- **Problema previo:** Las funciones `guardarBorradorAsistente`, `obtenerBorradorAsistente` y `limpiarBorradorAsistente` en `js/datos.js` no recibían el `usuarioId`, causando que el borrador de un usuario sobreescribiera el de otro o se almacenara como valor primitivo corrupto.
- **Solución implementada:** Se reestructuró la persistencia como un diccionario asociativo indexado por `usuarioId` (`{ [usuarioId]: paqueteBorrador }`). Al iniciar sesión, el usuario recupera únicamente su borrador activo mediante el banner interactivo.

### P0.2 — Corrección del Modal Pedagógico "¿Cómo se calculó esto?"
- **Problema previo:** `desglosarPasosCalculoPedagogico` retornaba un arreglo de objetos explicativos, pero la vista esperaba una cadena de texto, generando un fallo de renderizado (`[object Object]`).
- **Solución implementada:** Se implementó el formateador visual de pasos con bloques HTML estructurados que muestran la fórmula matemática, la sustitución con valores reales del presupuesto y el resultado parcial de cada línea.

### P0.3 — Aislamiento del Estado en la Suite de Pruebas
- **Problema previo:** Al ejecutar las pruebas automatizadas, se modificaba el `localStorage` real del usuario, alterando cotizaciones y saldos en curso.
- **Solución implementada:** Se incorporó un mecanismo de aislamiento transaccional en `js/pruebas.js` que captura un volcado completo de las claves `sicop_*_v2` antes de iniciar la batería de pruebas y lo restaura fielmente dentro de un bloque `try ... finally`.

### P1.1 — Corrección de Precisión de Punto Flotante en Desperdicio
- **Problema previo:** La función `aplicarDesperdicio` en `js/logica.js` multiplicaba directamente la cantidad por $(1 + \text{desperdicio}/100)$ y aplicaba `Math.ceil()`. Debido a las imprecisiones de IEEE 754 (por ejemplo, `100 * 1.05 = 105.00000000000001`), el cálculo redondeaba hacia arriba números enteros exactos.
- **Solución implementada:** Se normaliza el cálculo redondeando a 6 decimales antes de invocar `Math.ceil()`: `Math.ceil(Number((cantidad * (1 + pct)).toFixed(6)))`.

### P1.2 — Sanitización Bidireccional contra Inyección XSS
- **Problema previo:** El nombre de la obra, notas y motivos de rechazo se insertaban directamente en el DOM mediante concatenación sin escape, permitiendo inyección de código script.
- **Solución implementada:** Se creó la función utilitaria pura `escaparHtml(cadena)` (con alias `escaparHTML`) en `js/logica.js`, reemplazando caracteres reservados (`&`, `<`, `>`, `"`, `'`). Todos los campos de texto libre se procesan por este filtro antes de ser renderizados en tablas o en el documento de impresión.

### P1.3 — Registro y Trazabilidad del Motivo de Rechazo
- **Problema previo:** Al rechazar una cotización, no se documentaba la causa formal, impidiendo la retroalimentación técnica al solicitante.
- **Solución implementada:** Se agregó la propiedad `motivoRechazo` en el modelo de la cotización. Se diseñó el modal accesible de rechazo con validación de longitud mínima (10 caracteres) y se refleja el motivo tanto en la tabla de historial como en el documento oficial membretado.

### P1.4 — Validación Robusta de Cantidades Numéricas
- **Problema previo:** Los campos de cantidad aceptaban notación científica (`1e20`), valores infinitos (`Infinity`), cadenas hexadecimales o números negativos.
- **Solución implementada:** Se creó la función `validarCampoCantidad(valor, permiteDecimales)` en `js/logica.js`, que restringe el rango a $[0, 1.000.000]$, verifica el tipo de dato, rechaza exponenciales y valida si el material admite o no fracciones.

### P2.1 — Máquina de Estados Formal y Control de Sobregiro Cero
- **Problema previo:** Existían saltos de estado inconsistentes (por ejemplo, de `CANCELADA` a `APROBADA`) y aprobaciones sin verificar el saldo presupuestario del cliente.
- **Solución implementada:** Se definió la matriz inmutable `TRANSICIONES_VALIDAS` en `js/datos.js`. La función `cambiarEstadoCotizacion` valida la transición, comprueba que el saldo disponible no sea superado (principio de sobregiro cero) y reserva los fondos transfiriéndolos a saldo comprometido.

### P2.2 — Prevención Estricta de Autoaprobación y Segundo Supervisor
- **Problema previo:** Un usuario con rol de Gobernación podía crear una cotización y autoaprobarse el presupuesto inmediatamente.
- **Solución implementada:** Se implementó una guardia algorítmica que impide que el usuario autorice una cotización si `cotizacion.usuarioId === sesionUsuario.id`. Adicionalmente, se dio de alta en los datos semilla al segundo supervisor oficial: **Ing. Marcos Rivas** (`gobernacion_zulia`).

### P2.3 — Independencia Total de Internet (100% Offline)
- **Problema previo:** Existían referencias a fuentes remotas de Google Fonts en `index.html`, provocando lentitud o fallas de renderizado si el equipo carecía de conexión.
- **Solución implementada:** Se retiraron todas las etiquetas `<link>` externas. La plataforma utiliza la pila tipográfica nativa de alto rendimiento del sistema operativo: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Google Sans", "Helvetica Neue", sans-serif`.

### P3.1 — Seguridad de Sesión y Exclusión de Contraseñas
- **Problema previo:** La sesión activa en `localStorage` y las copias de seguridad en JSON almacenaban contraseñas en texto claro.
- **Solución implementada:** Se eliminó la clave `password` del objeto de sesión antes de guardarlo en almacenamiento y de la rutina de exportación `exportarDatosJSON()`.

### P3.2 — Exportación CSV Segura y Compatible con Excel
- **Problema previo:** El archivo CSV exportado carecía de codificación internacional y era susceptible a inyecciones DDE (fórmulas maliciosas que inician con `=`, `+`, `-`, `@`).
- **Solución implementada:** Se antepuso el BOM UTF-8 (`\uFEFF`), se fijó el delimitador universal punto y coma (`;`) y se sanitizan las cadenas que inician con caracteres de fórmula anteponiendo un apóstrofe de neutralización.

### P3.3 — Vigencia Presupuestaria en Días Calendario
- **Problema previo:** La vigencia de las cotizaciones se expresaba de forma ambigua como "días hábiles".
- **Solución implementada:** Se estandarizó el cálculo a **15 días calendario corridos** mediante `calcularFechaVencimiento(fechaEmision, 15)`. Si una cotización sobrepasa este lapso, el sistema bloquea su aprobación y habilita la duplicación con precios vigentes.

---

## 4. Mejoras Funcionales y Contables (Fase 4)

1. **Plantillas de Obra con Supuestos Técnicos:** Se enriqueció la base de datos `PLANTILLAS_OBRA` en `js/datos.js` con descripciones de ingeniería civil (dimensiones, calibres, espesores y factores de cálculo) para las 5 plantillas precargadas, mostrándose en cuadros de diálogo de confirmación y descripciones emergentes.
2. **Centro de Notificaciones Reactivo:** Se agregó el canal de avisos en el almacenamiento (`sicop_notificaciones_v2`), con contador dinámico en la campana de la barra superior y registro de eventos clave (aprobación de partidas, rechazos y despachos).
3. **Trazabilidad y Alerta de Tasa BCV:** El registro de la tasa cambiaria ahora almacena el valor numérico y la fecha de última actualización (`{ valor: 36.50, fecha: "2026-11-08" }`). La interfaz muestra la etiqueta con la fecha de fijación y despliega una advertencia si la tasa tiene más de 7 días sin actualizarse.
4. **Redondeo Contable Estandarizado:** Se normalizó el cálculo presupuestario en `calcularPresupuestoCotizacion` asegurando que los subtotales de cada línea y los totales finales redondeen a dos cifras decimales sin truncar previamente las fracciones de centavo de los factores de ciudad, logrando cuadratura exacta al centavo.

---

## 5. Dirección Artística Editorial y Sistema Visual (Fases 5 y 7)

Inspirado en la dirección de arte de `ksenpanchenko.com`, se transformó la experiencia estética del sistema:

- **Paleta Cromática Cálida Neutra:**
  - Modo Claro: Fondo editorial `#F1F0EC`, superficie de tarjetas `#FBFAF7`, tinta de texto `#141412` y bordes finos `#E2E0D8`.
  - Modo Oscuro: Fondo carbón `#121211`, tarjetas `#1B1B19`, texto claro `#EBEAE5` y bordes `#2B2B28`.
- **Eliminación Total de Estilos en Línea:** Se reemplazaron más de 40 atributos `style="..."` dispersos en `index.html` por un catálogo limpio de utilidades CSS semánticas (`.sv-flex-between`, `.sv-gap-sm`, `.sv-text-muted`, `.sv-modal-calculo`, `.sv-tarjeta-destacada`, etc.).
- **Indicador de Pasos Editorial:** El asistente de cotización presenta la secuencia numerada:
  - `01 / 04 Obra`
  - `02 / 04 Materiales`
  - `03 / 04 Revisión`
  - `04 / 04 Emisión`
- **Numeración Editorial de Secciones:** Los encabezados de módulos principales incorporan numeración de bajo contraste (`<span class="sv-num-seccion">01</span> Inversión por Sector`, `02 Semáforo Presupuestario`).
- **Documento Imprimible Membretado:** Se perfeccionó la regla `@media print` para generar presupuestos formales tipo factura proforma institucional con firmas autorizadas, desglose fiscal completo y motivos de rechazo si aplica.

---

## 6. Sistema de Movimiento y Microinteracciones (Fase 6)

Se creó el módulo dedicado `js/movimiento.js` (~14 KB) que dota a la plataforma de movimiento orgánico:

- **Curvas de Aceleración:** Se adoptó la curva suave característica de diseño moderno: `cubic-bezier(.22, 1, .36, 1)` con duración base de 400ms a 750ms.
- **Contadores Numéricos con Easing:** Las métricas clave del Dashboard (cotizaciones activas, monto aprobado, monto entregado) incrementan suavemente desde cero hasta el valor final al ingresar al módulo utilizando `window.requestAnimationFrame`.
- **Transición de Módulos:** Cada cambio de pestaña activa una animación sutil de desvanecimiento y ascenso (`svEntradaModulo`).
- **Reloj Oficial de Caracas (UTC-4):** Integrado en la barra superior con actualización continua segundo a segundo y punto pulsante en verde operativo. Se oculta automáticamente en dispositivos móviles para optimizar el espacio.
- **Respeto a la Accesibilidad de Movimiento:** Si el usuario tiene habilitada la preferencia del sistema operativo `prefers-reduced-motion: reduce`, o si activa la opción manual en la plataforma, todas las animaciones se desactivan instantáneamente sin afectar la funcionalidad.

---

## 7. Responsividad y Accesibilidad WCAG 2.1 AA (Fase 8)

- **Enlace de Salto (Skip Link):** Se incorporó `<a href="#contenidoPrincipal" class="saltar-enlace">Saltar al contenido principal</a>` accesible para navegación por teclado.
- **Ratios de Contraste:** El texto principal sobre las superficies neutrales cálidas supera una relación de contraste de **15.8:1**, excediendo ampliamente los requisitos de nivel AAA de las pautas WCAG (mínimo 7:1).
- **Diseño Adaptativo Fluido:**
  - *Móvil (360px – 768px):* Barra de navegación táctil fija en la base con áreas de toque ergonómicas de al menos 44×44px, barra superior compactada y tablas con desplazamiento horizontal asistido.
  - *Tablet (769px – 1024px):* Menú lateral colapsable y cuadrículas flexibles en 2 columnas.
  - *Escritorio (1025px – 1920px):* Distribución espaciosa en dos paneles con panel de total en vivo flotante y barra lateral completa.

---

## 8. Verificación de la Suite de Pruebas Automatizadas (Fase 9)

La suite de pruebas disponible en `pruebas.html` valida 43 aserciones unitarias organizadas en 10 dominios lógicos:

| Dominio de Prueba | Casos | Estado |
| :--- | :---: | :---: |
| 1. Formato Monetario y Numérico | 4 | ✅ Aprobadas |
| 2. Factores Geográficos y Logísticos | 4 | ✅ Aprobadas |
| 3. Descuentos por Perfil de Usuario | 4 | ✅ Aprobadas |
| 4. Fórmulas Presupuestarias y Tributarias | 6 | ✅ Aprobadas |
| 5. Ordenamiento Manual de Ciudades (Burbuja) | 4 | ✅ Aprobadas |
| 6. Control de Presupuesto y Semáforo | 4 | ✅ Aprobadas |
| 7. Correlativo de Cotizaciones | 4 | ✅ Aprobadas |
| 8. Validación de Formulario y Sanitización XSS | 4 | ✅ Aprobadas |
| 9. Calculadora de Materiales y Desperdicio | 4 | ✅ Aprobadas |
| 10. Persistencia, Notificaciones y Borrador por Usuario | 5 | ✅ Aprobadas |
| **TOTAL CONSOLIDADO** | **43** | **100% EN VERDE** |

---

## 10. Versión 7.0 "Plataforma Profesional Definitiva"

### 10.1 Resumen de la Actualización v7.0
La versión 7.0 consolida a SICOP-VE como la plataforma web definitiva de cotización y control de inversiones para obras en Venezuela, alcanzando:
- **50 Pruebas Automáticas Unitarias y de Integración (100% en verde, 0 fallidas)**.
- **150 Materiales Industriales de Construcción** catalogados con precios reales del mercado venezolano en 6 sectores técnicos: Construcción, Energía, Agua, Vialidad, Acabados y Equipos.
- **30 Plantillas de Obras Preconfiguradas**, cubriendo vialidad, electrificación, agua potable, canchas deportivas, escuelas, centros de salud y edificaciones comunales.
- **18 Estados y 12 Ciudades Base** con matrices logísticas reales de flete y poder adquisitivo.
- **8 Usuarios Demo** con perfiles y jerarquía de permisos institucionales (Alcaldía, Empresa, Constructor, Gobernación y Comuna).

### 10.2 Nuevos Módulos y Capacidades Técnicas
1. **Sistema de Financiamiento Cashea / Cuotas Institucionales:**
   - 5 modalidades de pago: `contado` (100%), `cashea_3` (50% inicial + 3 cuotas cada 14 días), `cashea_6` (40% inicial + 6 cuotas cada 14 días), `quincenal_6` (30% inicial + 5% recargo administrativo) y `mensual_12` (20% inicial + 12% recargo administrativo).
   - Cálculo automático de moras diarias (0.1% diario por cuota vencida).
   - Bloqueo institucional: impedimento estricto de emisión o aprobación de nuevas cotizaciones si la entidad solicitante mantiene cuotas en mora activa.
   - Módulo interactivo "Mis Cuotas" y módulo supervisor "Cartera Global y Cobranzas" (Gobernación).
2. **Paleta de Comandos Accesible (`Ctrl+K` / `Cmd+K`):**
   - Búsqueda en tiempo real de módulos, acciones rápidas, plantillas y materiales en `js/comandos.js`.
3. **Comparador Visual de Cotizaciones Lado a Lado (`js/comparador.js`):**
   - Comparación multidimensional de 2 a 4 presupuestos con resaltado algorítmico de mejores precios (verde) y peores precios (rojo).
4. **Análisis ABC Pareto de Materiales (`js/analisis-abc.js`):**
   - Clasificación presupuestaria Tipo A (80% inversión), Tipo B (15%) y Tipo C (5%) implementada con ordenamiento burbuja manual.
5. **Tour Guiado Interactivo (`js/tour.js`):**
   - Recorrido paso a paso para usuarios nuevos con persistencia de finalización en `localStorage`.
6. **Firma Digital Criptográfica y Trazabilidad:**
   - Hash determinista FNV-1a de 32 caracteres con prefijo `SICOP-SIG-` y timeline de 4 fases en documentos imprimibles.

---

## 9. Guía Rápida para la Exposición y Defensa del Proyecto

Para la presentación académica ante el jurado o profesor de la cátedra:

1. **Apertura:** Hacer doble clic en `index.html`. Demostrar que no requiere servidor local (`node`, `python`, `xampp`) ni conexión a internet.
2. **Modo Demostración en un Clic:** Ir al módulo *Exportar / Importar* y hacer clic en **"Cargar Datos de Demostración"** para poblar el sistema con cotizaciones aprobadas, entregadas y en revisión.
3. **Simulación de Cotización en Vivo:**
   - Iniciar sesión como *María González (Alcaldía Libertador)*.
   - Ir al *Cotizador*, seleccionar el Paso 1 y elegir *Estado Zulia* (demostrar el factor de flete del 8%).
   - En el Paso 2, hacer clic en la plantilla *"Casa pequeña 50m²"*. Señalar cómo el panel de la derecha reacciona en vivo calculando el total en USD y en Bolívares BCV.
   - En el Paso 3, presionar el botón **"¿Cómo se calculó esto?"** para proyectar la explicación algorítmica paso a paso con las fórmulas evaluadas.
   - Emitir la cotización.
4. **Supervisión y Control Presupuestario:**
   - Cambiar de usuario a *Ing. Ana Pérez (Gobernación)*.
   - Mostrar el módulo exclusivo de *Aprobaciones*, evidenciar el semáforo de disponibilidad y aprobar una cotización.
   - Intentar autoaprobar una cotización creada por la misma gobernación para demostrar la guardia de seguridad que exige la intervención del *Ing. Marcos Rivas*.
5. **Verificación del Código de Pruebas:**
   - Hacer clic en el enlace *Pruebas Automáticas* en el menú lateral para abrir `pruebas.html`.
   - Mostrar el cuadro resumen con **60/60 pruebas aprobadas (0 fallidas)**.

---

## 10. Bitácora de la Auditoría Integral y Optimización Definitiva (v7.3)

### 10.1. Seguridad, Control de Acceso Centralizado (RBAC) y Route Guard
- **Normalización de Roles (`normalizarRol`):** Implementada función pura que estandariza las denominaciones institucionales (`'GOBERNACION'`, `'ALCALDIA'`, `'EMPRESA'`, `'CONSTRUCTOR'`), eliminando vulnerabilidades por discrepancias de tildes o mayúsculas.
- **Guardia de Módulos (`tienePermiso`):** Centralización de permisos por perfil. Los módulos de gestión y control (`catalogo`, `aprobaciones`, `cartera`, `supervision`, `bitacora`, `estado-usuarios`) quedan estrictamente bloqueados para usuarios sin rol de Gobernación / Nivel 5.
- **Route Guard en `cambiarPestana`:** Si un usuario intenta acceder por URL o consola a un módulo no autorizado, el sistema intercepta la petición, emite notificación Toast de advertencia y redirige inmediatamente al `dashboard`.
- **Validación de Cuentas Activas:** En el inicio de sesión (`formLogin`), las cuentas con `activo: false` son rechazadas de inmediato, impidiendo el acceso a funcionarios o contratistas suspendidos.
- **Validación de Propiedad de Recursos (`validarPropiedadDelRecurso`):** Los clientes solo pueden consultar y amortizar sus propios compromisos financieros, preservando la confidencialidad entre contratistas y alcaldías.

### 10.2. Integridad Relacional y Saneamiento de Datos
- **Reconciliación COT-0003 / Plan 3:** Se resolvió la discrepancia entre la cotización semilla y el plan de financiamiento. COT-0003 fue asignada formalmente a Luis Hernández (`usuarioId: 5`, $1.800,00, estado `APROBADA`) respaldando el Plan 3 (`EN_MORA`).
- **Inclusión de COT-0004:** Se agregó la cotización de Pedro Castillo (`usuarioId: 6`, Alcaldía Iribarren, $2.007,89, estado `ENVIADA`) como solicitud pendiente de revisión en la bandeja de entrada de Aprobaciones.
- **Contador Correlativo Inicial:** Actualizado a `'4'` en la semilla para que la próxima cotización emitida sea correlativa `COT-0005`.
- **Saneamiento en `restablecerDatosFabrica`:** Se incorporó el borrado de las 12 colecciones (`USUARIOS`, `MATERIALES`, `COTIZACIONES`, `BITACORA`, `CONTADOR`, `TASA`, `SESION`, `BORRADOR_ASISTENTE`, `MONEDA`, `NOTIFICACIONES`, `FINANCIAMIENTOS` y `MOVIMIENTOS`).

### 10.3. Libro Mayor de Pagos y Gestión de Cuota Inicial (Down Payment)
- **Colección `CLAVES_STORAGE.MOVIMIENTOS`:** Implementación del libro mayor con registro histórico inmutable de amortizaciones tanto de iniciales (`tipo: 'INICIAL'`) como de cuotas (`tipo: 'CUOTA'`).
- **`procesarPagoInicial`:** Función pura y validada que confirma el 50% de inicial, asienta la referencia bancaria y registra el movimiento de capital en el libro mayor.
- **`procesarPagoCuota`:** Distribuye el abono entre mora calculada y amortización de capital, actualiza el estado de la cuota a `PAGADA`, recalcula el saldo pendiente del plan y genera el asiento contable.

### 10.4. Nuevo Módulo: Estado Integral de Usuarios y Expedientes
- **Ubicación:** `#modulo-estado-usuarios` en la sección de Gestión Institucional (exclusivo Gobernación).
- **KPIs en Vivo:** Total de usuarios registrados, relación activos/suspendidos, usuarios solventes, usuarios en mora y cupo comprometido total.
- **Filtros Combinados:** Búsqueda en vivo por texto (nombre, usuario, estado), filtro por perfil institucional, filtro por estado de cuenta (Activo/Inactivo) y filtro por solvencia financiera (Solvente, En Mora, Sobregirado).
- **Expediente de Usuario (`modalExpedienteUsuario`):** Modal interactivo con 4 pestañas:
  1. *Balance y Cupo:* Ficha general, límite, saldo gastado, comprometido, disponible y barra de consumo porcentual.
  2. *Cotizaciones:* Tabla histórica de solicitudes del usuario.
  3. *Planes y Cuotas:* Seguimiento de obligaciones y financiamientos Cashea.
  4. *Libro Mayor de Pagos:* Historial de transferencias y pagos móviles con acceso directo a recibos.
- **Control de Suspensión:** Botón interactivo para alternar el acceso de la cuenta (`Activar / Suspender`), con bloqueo estricto contra auto-suspensión de supervisores.

### 10.5. Sistema Universal de Moneda Reactiva (USD ↔ Bs)
- **Uniformidad Absoluta:** Supresión de etiquetas mixtas (`$ / Bs.`) simultáneas en tablas y tarjetas.
- **Reactividad:** Conmutación universal e instantánea mediante `monedaActiva(montoUSD)`. Al seleccionar `USD ($)` se visualiza estrictamente `$X.XXX,XX`; al seleccionar `Bs. (BCV)` se visualiza estrictamente `Bs. X.XXX,XX` a la tasa oficial de 900,00 Bs/USD.

### 10.6. Comprobante Oficial de Pago / Recibo de Caja
- **Modal `#modalComprobantePago`:** Diseñado con formato legal e institucional que detalla: número de recibo correlativo, fecha/hora, cliente, cotización, concepto, referencia bancaria, método, tasa BCV, montos en ambas monedas y hash de seguridad digital.
- **Soporte de Impresión:** Reglas `@media print` para exportar o imprimir recibos limpios directamente desde el navegador.

### 10.7. Batería de Pruebas Automáticas Expandida a 60 Casos
- Se agregaron 10 nuevos casos de prueba automatizados (Pruebas 51 a 60) en `js/pruebas.js` y `pruebas.html`.
- Resultado verificado en Chrome Headless: **60/60 Aprobadas (0 Fallidas, 100% Verde)**.


