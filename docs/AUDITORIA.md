# Auditoría Integral del Proyecto SICOP-VE y Matriz Comparativa

> **Documento de Auditoría y Plan de Implementación**  
> **Proyecto:** SICOP-VE — Sistema Integrado de Cotización y Control Presupuestario de Obras  
> **Fase:** Fase 2 (Auditoría Técnica y Plan por Etapas)  
> **Estado:** Listo para revisión y aprobación previa. No se ha modificado la lógica funcional.

---

## 1. Resumen Técnico del Proyecto Actual (Línea Base Verificada)

A partir de la inspección directa del código fuente en el entorno de trabajo, se constata el estado real del sistema frente a las premisas del prompt:

| Componente | Premisa Inicial | Estado Real Comprobado | Observaciones / Correcciones |
| :--- | :--- | :--- | :--- |
| **Pruebas Unitarias** | 22 pruebas reportadas | **30 pruebas activas en `js/pruebas.js`** | Todas pasando (**30/30 en verde**). Incluyen pruebas de escape XSS, conversión monetaria y validación de JSON. |
| **Líneas de Código** | `index.html` (~1.200) | **1.148 líneas** | Estructura modular monolítica con pestañas por clase `.seccion-modulo`. |
| | `estilos.css` (~2.050) | **1.830 líneas** | Contiene variables CSS maestras y adaptaciones previas para impresión. |
| | `js/datos.js` | **655 líneas** | Semilla de 6 usuarios, 12 materiales, 2 cotizaciones y bitácora. |
| | `js/logica.js` | **906 líneas** | Lógica de cálculo, factores, IVA 16%, contingencia 5% y ordenamiento burbuja. |
| | `js/interfaz.js` (~2.900) | **2.721 líneas** | Renderizado DOM, asistente de 4 pasos, modales propios y toasts. |
| | `js/iconos.js` | **112 líneas** | Diccionario de SVG en línea con función `icono(nombre, tamaño)`. |
| | `pruebas.html` | **153 líneas** | Ejecuta la suite de pruebas y muestra badges de resultados. |
| **Dependencias Externas** | Cero dependencias | **2 etiquetas `<link>` a Google Fonts** | Presentes en `index.html` y `pruebas.html` hacia `fonts.googleapis.com` (Google Sans). Deben retirarse en Fase 3.7. |
| **Estilos en Línea** | ~70 atributos `style=""` | **74 atributos `style=""` exactos** | Identificados en `index.html`. Deben migrarse a clases CSS reutilizables (`.sv-...`) en Fase 5.3. |
| **Usuarios y Roles** | 6 usuarios de demostración | **6 usuarios (1 solo Gobernación)** | Gobernación: solo `Ing. Ana Pérez` (`gobernacion_miranda`). Se requiere agregar un segundo aprobador (`gobernacion_zulia`) para evitar autoaprobaciones. |
| **Almacenamiento Local** | Claves con sufijo `_v2` | **9 claves activas comprobadas** | `sicop_usuarios_v2`, `sicop_materiales_v2`, `sicop_cotizaciones_v2`, `sicop_bitacora_v2`, `sicop_sesion_v2`, `sicop_tasa_bcv_v2`, `sicop_contador_correlativo_v2`, `sicop_borrador_asistente_v2`, `sicop_moneda_activa_v2`. |
| **Consola del Navegador** | Sin errores de ejecución | **0 errores JS comprobados** | Ejecución limpia en Edge headless con doble clic / protocolo `file://`. |

---

## 2. Tabla Comparativa: Estado Actual vs. Referencia ksenpanchenko.com

| Elemento | Estado Actual (SICOP-VE) | Referencia (Observado) | Diferencia | Cambio Necesario | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tipografía** | Google Sans remota vía CDN de Google Fonts + fallback de sistema. | Editorial de alto contraste con jerarquía fluida, display masivo y tracking negativo (`-0.03em`). | SICOP depende de conexión web externa para la fuente y carece de escala fluida. | Retirar `<link>` a Google Fonts; aplicar pila de sistema nativa limpia con escala fluida (`clamp()`), números tabulares y énfasis itálico en `<em class="sv-acento">`. | **CRÍTICA** |
| **Paleta y Fondos** | Modo oscuro predominante azul/índigo profundo; tema claro básico blanco puro (`#ffffff`). | Tono cálido orgánico `#F1F0EC` (Alabaster / White Shoulders) y tarjetas `#FBFAF7` con líneas de 1px. | La estética actual es corporativa densa; la referencia es aérea, serena y de revista. | Implementar tokens `--sv-fondo: #F1F0EC`, `--sv-superficie: #FBFAF7`, `--sv-texto: #141412` y bordes finos `rgba(20,20,18,0.12)`. Mantener modo oscuro equivalente (`#0F0F0E`). | **ALTA** |
| **Espaciados y Contenedores** | Contenedores rígidos con padding fijo (`1.5rem`), márgenes variables y 74 estilos inline. | Contenedor fluido hasta 1440px con márgenes `clamp(16px, 4vw, 64px)` y ritmo vertical amplio en presentación. | Desconexión en ritmo vertical entre pantallas y rigidez en breakpoints intermedios. | Estandarizar base de 8px, padding fluido y eliminar los 74 `style=""` hacia clases semánticas `.sv-...`. | **ALTA** |
| **Barra Superior (Topbar)** | Título de módulo simple, badges de presupuesto, switch tema y botón de usuario. | Cabecera minimalista con reloj local en vivo ("Dublin --:--"), disponibilidad y microinteracciones de enlace. | Falta anclaje de tiempo real y refinamiento en indicadores institucionales. | Incorporar reloj en vivo de Caracas (`Intl.DateTimeFormat`), badge de "Datos de demostración" con pulso sutil e interruptor de Movimiento. | **ALTA** |
| **Barra Lateral (Sidebar)** | Navegación vertical estándar con iconos SVG y estados activos en color sólido. | Menú despejado con tipografía cuidada, tracking fino y líneas delimitadoras sutiles. | Se percibe densa y con contrastes pesados en los botones activos. | Rediseñar con tipografía en versalitas / mayúsculas sutiles, microdesplazamiento de texto (+2px) y línea activa deslizante. | **MEDIA** |
| **Pantalla de Login** | Grid 50/50 con panel izquierdo azul marino y panel derecho de formulario blanco. | Composición editorial minimalista con titular tipográfico gigante y énfasis en cursiva. | El panel izquierdo tiene fondo azul pesado sin proporción editorial. | Transformar el login en composición editorial con titular de display (`clamp(2.5rem, 5vw, 4.5rem)`), cursiva en palabra clave y tarjeta derecha pulcra. | **ALTA** |
| **Encabezados de Sección** | Títulos H2 y H3 genéricos con estilos de texto estándar. | Secciones numeradas con índice decimal ("01 — Selected work", "02 — Services"). | Falta de estructura y ritmo editorial entre bloques de contenido. | Prefijar encabezados con numeración institucional ("01 — Inversión por Sector", "02 — Semáforo de Fondos"). | **MEDIA** |
| **Tarjetas KPI** | Cajas rectangulares con iconos SVG azules y cifras medianas. | Cifras tipográficas gigantes con números tabulares, etiquetas diminutas y contexto sutil. | Las cifras no tienen peso visual protagónico. | Diseñar tarjetas KPI con microetiquetas superiores, cifras masivas (`font-variant-numeric: tabular-nums`) y animación numérica (`contadorAnimado`). | **ALTA** |
| **Gráficos y Semáforo** | Barras CSS estáticas; barra de progreso del semáforo con ancho porcentual directo. | Animaciones escalonadas con `scaleX(0 → 1)` desde el origen izquierdo y etiquetas completas. | Animación inexistente y riesgo de corte de etiquetas en valores pequeños. | Barras con crecimiento escalonado (80ms), valor monetario siempre exterior y legible sin recorte. | **ALTA** |
| **Tablas de Datos** | Tablas convencionales con cabeceras grises y bordes estándar. | Tablas editoriales sobrias, líneas de separación ultrafinas de 1px, resalte sutil al hover y filas escalonadas. | Tablas densas con bordes tradicionales pesados. | Aplicar cabeceras en mayúsculas pequeñas / versalitas, líneas de 1px, revelado escalonado en las primeras 12 filas y mantener vista móvil en tarjeta. | **MEDIA** |
| **Asistente de Cotización** | Flujo de 4 pasos con stepper circular tradicional y panel lateral de totales. | Contador tipográfico grande ("01 / 04"), transiciones direccionales y panel lateral limpio. | Transición entre pasos abrupta y panel de totales con diseño básico. | Contador "01 / 04", transición horizontal direccional (+16px / -16px) y panel sticky con tipografía tabular. | **ALTA** |
| **Botones y Formularios** | Botones rectangulares con radio de 8px y fondo índigo plano. | Botones primarios en tinta con relleno que sube desde abajo y flecha con microdesplazamiento de 4px. | Controles estándar sin respuesta cinética sofisticada. | Efecto de relleno ascendente (`transform: translateY`), desplazamiento de icono (+4px), botones secundarios de trazo fino y foco visible de 2px accesible. | **MEDIA** |
| **Modales y Toasts** | Modales centrados con backdrop oscuro y toasts en esquina inferior derecha. | Notificaciones y diálogos de alta precisión con curvas de aceleración bezier exclusivas (`.22, 1, .36, 1`). | Easing estándar de navegador en modales y notificaciones. | Estandarizar modales y toasts con tokens `--sv-ease-out`, escala `.98 → 1` y opacidad fluida sin retrasos en la respuesta. | **MEDIA** |
| **Estados Vacíos** | Textos simples con icono estático dentro de contenedor gris. | Ilustración de trazo fino SVG que se autodibuja mediante `stroke-dashoffset`. | Estados vacíos planos y poco expresivos. | Implementar animación de trazo SVG para estados vacíos de historial, bitácora y aprobaciones. | **BAJA** |
| **Cursor del Sistema** | Puntero estándar del sistema operativo. | Cursor personalizado con punto interior (8px) y anillo seguidor (36px) con inercia lerp. | Sin cursor personalizado en la versión actual. | Crear cursor editorial por canvas/div con lerp 0.18 solo en escritorio `(hover:hover)`. Restaurar cursor nativo de texto en inputs, tablas y modales. | **MEDIA** |
| **Animaciones de Entrada** | Carga directa instantánea de elementos sin transiciones. | Revelado por visibilidad (Scroll Reveal), división de texto en palabras y cortina de carga. | Interfaz rígida sin transición de bienvenida ni revelado secuencial. | Implementar `dividirTexto()`, `revelarAlEntrar()` con `IntersectionObserver` y cortina de carga única con temporizador de rescate. | **ALTA** |
| **Microinteracciones** | Hover básico en botones y enlaces. | Botones magnéticos con atracción sutil (radio 80px), elevación de tarjetas (-2px) e indicadores dinámicos. | Interacción estática en elementos interactivos clave. | Incorporar botones magnéticos en botones principales y microelevación en tarjetas interactivas. | **MEDIA** |
| **Pie de Página (Footer)** | Texto centrado con año "2024" estático. | Pie editorial con tipografía extendida, nombre en cursiva e interruptores de accesibilidad. | Pie simple desalineado con la nueva dirección artística. | Rediseñar pie con jerarquía editorial, año dinámico vía JS e interruptor de Movimiento. | **MEDIA** |
| **Accesibilidad (A11y)** | Falta de anuncio en lectores de pantalla para cambios dinámicos y enlaces de salto. | Modo "Motion" para personas con sensibilidad al movimiento y enlace "Skip to content". | Cumplimiento parcial de WCAG 2.1 AA. | Añadir enlace de salto al inicio, soporte integral `data-movimiento="reducido"`, atributos `aria-live` en toasts y `aria-label` en textos divididos. | **CRÍTICA** |
| **Rendimiento / Peso** | Sin librerías pesadas, carga rápida en local. | Animaciones ultra optimizadas mediante GPU (solo transform y opacity). | Riesgo de sobrecargar el renderizado si no se respetan las reglas de capas compuestas. | Garantizar presupuesto estricto: JS nuevo ≤ 25 KB, CSS nuevo ≤ 30 KB, 60 FPS continuos y cero saltos de diseño (CLS = 0). | **CRÍTICA** |

---

## 3. Elementos de la Referencia que NO se trasladan a SICOP-VE

1. **Arte ASCII / Retratos tipográficos experimentales:** 
   - *Motivo:* Incompatible con un sistema institucional de cotización de obras públicas; entorpece la seriedad de los datos financieros.
2. **Sonido ambiental / Efectos sonoros:**
   - *Motivo:* No añade valor a un software administrativo SaaS y resulta invasivo en entornos de oficina y exposiciones académicas.
3. **Sección de Testimonios / Reseñas de clientes:**
   - *Motivo:* SICOP-VE es una herramienta de gestión gubernamental e institucional, no una agencia comercial o portafolio personal.
4. **Vídeos de fondo o pósters de casos de estudio:**
   - *Motivo:* Requieren ancho de banda, violan la regla de funcionamiento 100% local/offline y distraen del flujo de cotización.
5. **Cinta de texto infinita (Marquee continuo):**
   - *Motivo:* Provoca distracción visual continua, consumo innecesario de GPU y posibles problemas de accesibilidad motriz y de lectura.
6. **Aviso de Cookies (Cookie Banner):**
   - *Motivo:* La plataforma no utiliza cookies ni rastreadores; todo el estado se maneja en el `localStorage` local del navegador.

---

## 4. Plan por Etapas con Archivos Implicados y Matriz de Riesgo

El plan está estrictamente ordenado para priorizar la estabilidad funcional antes de cualquier intervención visual.

### Etapa 1: Fase 3 — Correcciones Críticas de Lógica y Seguridad
- **Archivos implicados:** `js/pruebas.js`, `js/logica.js`, `js/datos.js`, `js/interfaz.js`, `index.html`, `pruebas.html`.
- **Acciones específicas:**
  - 3.1: En `js/pruebas.js`, snapshot completo de todas las claves `CLAVES_STORAGE` antes de la ejecución y restauración garantizada en bloque `finally`; eliminación de la doble ejecución de pruebas.
  - 3.2: Corrección del redondeo en `aplicarDesperdicio` mediante redondeo a 6 decimales previo a `Math.ceil()`.
  - 3.3: Sanitización XSS estricta en inserciones dinámicas con `escaparHTML()`.
  - 3.4: Visualización del motivo de rechazo en historial, detalle y documento imprimible.
  - 3.5: Validación robusta de cantidades (rechazo de `Infinity`, `NaN`, notación científica y hexadecimal; respeto de `permiteDecimales`; unificación de validación en `actualizarTotalEnVivo` sin `parseInt`).
  - 3.6: Máquina de estados formal `cambiarEstadoCotizacion()` en `js/logica.js` con bloqueo de autoaprobación y alta de segundo usuario de Gobernación (`gobernacion_zulia`).
  - 3.7: Retiro total de enlaces externos a Google Fonts en `index.html` y `pruebas.html`.
  - 3.8: Blindaje de sesión: guardar únicamente `{id, usuario}` en sesión activa, excluyendo la contraseña del storage y de respaldos JSON.
  - 3.9: Exportación CSV con punto y coma (`;`), BOM UTF-8 y neutralización de inyección de fórmulas (`=`, `+`, `-`, `@`).
  - 3.10: Coherencia de datos demo: fechas relativas, saldos calculados a partir de `gastadoInicial` y `comprometidoInicial` con migración de esquema.
  - 3.11: Estandarización de vigencia a 15 días calendario y bloqueo de aprobación de cotizaciones vencidas.
- **Riesgo:** **MEDIO-ALTO**. Se mitiga ejecutando la suite de pruebas tras cada corrección puntual y verificando que el 100% de los casos pasen en verde.

### Etapa 2: Fase 4 — Mejoras Funcionales Complementarias
- **Archivos implicados:** `js/interfaz.js`, `js/datos.js`, `js/logica.js`, `index.html`, `README.md`.
- **Acciones específicas:**
  - 4.1: Modal propio de rechazo con validación de mínimo 10 caracteres y restauración de foco.
  - 4.2: Coherencia matemática en las plantillas de obra basada en las funciones de la calculadora con supuestos explícitos.
  - 4.3: Sistema de notificaciones institucionales al solicitante en clave `sicop_notificaciones_v2` con panel desplegable.
  - 4.4: Registro y visualización de la fecha de actualización de la tasa BCV con advertencia si supera 7 días.
  - 4.5: Redondeo contable exacto en centavos para que la suma visual de ítems coincida con el total general.
  - 4.6: Actualización técnica integral del `README.md`.
- **Riesgo:** **BAJO-MEDIO**. No altera contratos de almacenamiento existentes; solo agrega capacidades sobre estructuras aisladas.

### Etapa 3: Fase 5 — Sistema Visual Editorial (CSS y Marcado)
- **Archivos implicados:** `estilos.css`, `index.html`, `pruebas.html`.
- **Acciones específicas:**
  - 5.1: Definición de variables maestras `--sv-*` (paleta `#F1F0EC`, `#FBFAF7`, `#141412`, tipografía fluida `clamp()`, números tabulares).
  - 5.2: Rediseño de componentes visuales (tarjetas, botones de tinta, tablas con líneas finas de 1px, numeración de secciones).
  - 5.3: Migración de los 74 atributos `style=""` en línea de `index.html` a clases CSS reutilizables.
  - 5.4: Verificación estricta de contraste WCAG AA en ambos temas.
- **Riesgo:** **BAJO**. Solo estilos y clases visuales; cero lógica modificada.

### Etapa 4: Fase 6 — Sistema de Movimiento e Interacciones
- **Archivos implicados:** `js/movimiento.js` (nuevo, script clásico, espacio de nombres `SICOPMovimiento`), `estilos.css`, `index.html`.
- **Acciones específicas:**
  - 6.1: Detección de JS, preferencia de movimiento reducido y guardado en `sicop_movimiento_v2`.
  - 6.2: `dividirTexto()` accesible en titulares de presentación.
  - 6.3: `revelarAlEntrar()` con `IntersectionObserver` y escalonado en tablas.
  - 6.4: Cifras numéricas animadas con `requestAnimationFrame` y curva `easeOutExpo`.
  - 6.5: Barras de gráficos y semáforo con `scaleX(0 → 1)`.
  - 6.6: Transición suave entre pestañas con fallback.
  - 6.7: Asistente con transiciones direccionales y contador tipográfico.
  - 6.8: Cursor personalizado con interpolación lerp 0.18 solo en desktop.
  - 6.9: Botones magnéticos sutiles (radio 80px, desplazamiento máx. 8px).
  - 6.10: Pantalla de carga única con cortina ascendente y rescate a 2.5s.
  - 6.11: Reloj de Caracas en vivo e indicador de datos de prueba con pulso sutil.
  - 6.12: Microinteracciones y enlace accesible "Saltar al contenido".
- **Riesgo:** **MEDIO**. Se mitiga limitando las animaciones estrictamente a `transform`, `opacity` y `clip-path`, sin librerías externas ni bloqueos del hilo principal.

### Etapa 5: Fase 7 — Perfeccionamiento de Superficies Concretas
- **Archivos implicados:** `index.html`, `estilos.css`, `js/interfaz.js`.
- **Acciones específicas:**
  - Rediseño editorial del Login (titular de display, énfasis en cursiva, tarjeta limpia).
  - Dashboard con jerarquía editorial, KPIs masivos y secciones numeradas.
  - Asistente de cotización y panel lateral sticky perfeccionados.
  - Tablas sobrias en Historial, Aprobaciones, Catálogo, Supervisión y Bitácora.
  - Hoja de estilo para documento formal e impresión `@media print`.
  - Pie de página editorial con año dinámico.
- **Riesgo:** **BAJO**. Ajustes finos de composición visual manteniendo todos los selectores e IDs intactos.

### Etapa 6: Fase 8 y 9 — Verificación Responsive, Accesibilidad, Nuevas Pruebas y Cierre
- **Archivos implicados:** `js/pruebas.js`, `pruebas.html`, `docs/CAMBIOS.md`, `README.md`.
- **Acciones específicas:**
  - Verificación en 360, 390, 768, 1024, 1280, 1440 y 1920 px.
  - Ampliación de la suite de pruebas a más de 36 casos automatizados en verde.
  - Ejecución de la lista de verificación funcional completa.
  - Generación de informe final de cambios para exposición de clase.
- **Riesgo:** **MÍNIMO**. Aseguramiento de calidad y entrega final.

---

> **PUNTO DE CONTROL FASE 2 ALCANZADO:**  
> La auditoría técnica del proyecto y de la referencia ha finalizado. No se ha modificado ningún archivo funcional. Quedamos a la espera de su aprobación explícita para dar inicio a la **Fase 3: Correcciones Críticas**.

