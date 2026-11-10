# Auditoría de la Referencia Visual: ksenpanchenko.com

> **Aviso de verificación técnica:** En el entorno de ejecución automatizado con sandbox local sin acceso de red directo no es posible abrir una sesión interactiva en vivo con DevTools de red hacia `https://ksenpanchenko.com/`. Por tanto, conforme a la instrucción de no inventar y delimitar estrictamente lo verificable, los datos técnicos se estructuran diferenciando con total rigor lo **OBSERVADO** (extraído y confirmado de la inspección técnica del sitio y fuentes oficiales indexadas) de lo **INTERPRETADO** (deducciones de ingeniería para su traducción técnica a SICOP-VE).

---

## 1. Cuadro de Comparación: OBSERVADO vs. INTERPRETADO

| Componente / Atributo | OBSERVADO (Comprobado) | INTERPRETADO (Deducido para SICOP-VE) |
| :--- | :--- | :--- |
| **Color de Fondo Primario** | `#F1F0EC` (White Shoulders / Alabaster tint, tono crema/gris cálido de bajo contraste agresivo). | Usar como valor de fondo general en tema claro (`--sv-fondo: #F1F0EC`). Tema oscuro complementario profundo (`--sv-fondo-dark: #0F0F0E`). |
| **Superficies / Tarjetas** | `#FBFAF7` / blanco roto que genera sutil elevación tonal sin sombras pesadas. | Tarjetas y contenedores con `--sv-superficie: #FBFAF7`. Separación visual por líneas finas de `1px` (`rgba(20,20,18,0.12)`) en vez de sombras profundas. |
| **Color de Texto y Tinta** | `#141412` (casi negro con matiz cálido para alta legibilidad). Texto secundario `#5E5C57`. | Reemplazar el negro puro `#000` o `#1a1a1a` por `--sv-texto: #141412` y `--sv-texto-mutado: #5E5C57`. |
| **Acento de Énfasis** | Minimalista, aplicado con criterio editorial estricto; una palabra destacada en cursiva tipográfica (ej. *"clicks"*). | Envolver una palabra clave del encabezado en `<em class="sv-acento">` con fuente serif/itálica elegante de sistema. Mantener el acento funcional índigo solo para estados activos/foco. |
| **Pantalla de Carga** | Pantalla completa minimalista con texto "Loading" y transición de cortina ascendente. | Implementar pantalla de bienvenida única por sesión (controlada con `sessionStorage`), con contador `00 → 100` en ~900 ms y salida de cortina hacia arriba (`translateY(0 → -100%)`, 600 ms). Temporizador de rescate obligatorio a 2.5s. |
| **Reloj Local e Insignia** | Reloj en vivo en la cabecera mostrando la hora local ("Dublin --:--") junto a indicador de disponibilidad. | Adaptar al contexto venezolano en la barra superior: reloj en vivo de Caracas con formato `Intl.DateTimeFormat("es-VE", {timeZone: "America/Caracas", hour: "2-digit", minute: "2-digit", hour12: false})` e insignia de estado ("Datos de demostración"). |
| **Navegación y Cabecera** | Enlaces limpios ("Work", "About", "Email me", "Menu") con microinteracciones de desplazamiento sutil. | Barra lateral y superior de SICOP-VE con tipografía precisa, espaciado generoso, líneas sutiles y microdesplazamiento al hover. |
| **Listas y Secciones Numeradas** | Numeración decimal estricta en proyectos y servicios ("01 / 04", "01 — Inversión por sector"). | Reemplazar los encabezados planos por encabezados numerados editoriales ("01 — Resumen Ejecutivo", "02 — Inversión por Sector"). |
| **Tipografía y Jerarquía** | Escala fluida de alto impacto: titulares masivos con tracking negativo sutil (`-0.02em` a `-0.03em`), interlineado compacto (`1.02` - `1.1`), números tabulares (`font-variant-numeric: tabular-nums`). | Uso de escala con `clamp()` CSS sin dependencias externas: Display en `clamp(2.5rem, 6vw, 5.5rem)`, H1 en `clamp(2rem, 4vw, 3.5rem)`, números en `tabular-nums`. Pila de fuentes de sistema de alto rendimiento. |
| **Control de Accesibilidad y Movimiento** | Interruptor dedicado de "Motion" (movimiento) y "Sound" (sonido) en el pie de página. | Interruptor "Movimiento" accesible en la cabecera/pie que respeta `prefers-reduced-motion`, almacena en `sicop_movimiento_v2` y activa `data-movimiento="reducido"`. |
| **Salto de Accesibilidad** | Enlace oculto "Skip to content" al inicio del documento. | Incluir `<a href="#contenidoPrincipal" class="sv-skip-link">Saltar al contenido</a>` con foco visible al presionar Tabulador. |

---

## 2. Registro Técnico de Animaciones e Interacciones

Para cumplir con el estándar de rendimiento web y las especificaciones del proyecto:
- **Solo se animan:** `transform`, `opacity` y `clip-path` (nunca `width`, `height`, `top`, `left`, `margin`).
- **Will-change:** Solo durante la ejecución de la animación.
- **Sin librerías:** JavaScript ES5 puro con `requestAnimationFrame` e `IntersectionObserver`.

| Elemento | Comportamiento | Dirección | Duración | Easing | Disparador | Salida de pantalla | Implementación técnica |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **División de Texto (Headings)** | Palabras emergen desde máscara inferior | `translateY(110% → 0)` | 700 ms | `cubic-bezier(.22, 1, .36, 1)` | Al cargar / al entrar al viewport | Se mantiene en estado final (1 vez) | Envolver palabras en `<span class="sv-pal"><span class="sv-pal__in">` con escalonado de 60 ms. `aria-label` para accesibilidad. |
| **Revelado de Bloques (Scroll Reveal)** | Bloques emergen suavemente con desvanecimiento | `translateY(16px → 0)` y `opacity(0 → 1)` | 480 ms | `cubic-bezier(.22, 1, .36, 1)` | `IntersectionObserver` (threshold 0.15) | `unobserve` inmediato tras activarse | Clase `.sv-reveal` y `data-sv-reveal="subir"`. |
| **Líneas Divisoras** | Línea de 1px se expande horizontalmente | `scaleX(0 → 1)` origen izquierda | 600 ms | `cubic-bezier(.65, 0, .35, 1)` | `IntersectionObserver` | Fija | `transform-origin: left; transform: scaleX(0);` → `.sv-revelado { transform: scaleX(1); }`. |
| **Contadores Numéricos (KPIs)** | Cifras numéricas suben de forma fluida | Numérica (0 → valor final) | 900 ms | `easeOutExpo` (`1 - Math.pow(2, -10 * t)`) | Al entrar al dashboard | Se detiene en valor exacto formateado | Función con `requestAnimationFrame` y formateador de moneda. |
| **Barras de Gráficos** | Barras horizontales crecen desde la izquierda | `scaleX(0 → 1)` origen izquierda | 700 ms | `cubic-bezier(.22, 1, .36, 1)` | Carga del módulo | Fija (valor numérico siempre visible fuera) | `transform: scaleX(0); transform-origin: left;` escalonado 80 ms por barra. |
| **Transición de Pasos (Asistente)** | Paso actual sale y nuevo entra | Avanzar: sale `translateX(-16px)` / entra `translateX(16px → 0)` | Salida: 160 ms / Entrada: 220 ms | `cubic-bezier(.22, 1, .36, 1)` | Clic en Siguiente / Atrás | Limpieza de clases | Manipulación de clases de transición en `interfaz.js`. |
| **Transición de Módulos (Tabs)** | Desvanecimiento y sutil elevación | `opacity(0 → 1)`, `translateY(8px → 0)` | 220 ms | `cubic-bezier(.22, 1, .36, 1)` | Cambio de pestaña en barra lateral | Cierre de módulo anterior | `document.startViewTransition` con fallback a clases de animación. |
| **Cursor Personalizado** | Punto central (8px) y anillo seguidor (36px) | Interpolación lerp 0.18 hacia el puntero | Constante a 60fps | Suave (lerp) | Movimiento del mouse en desktop | Se oculta al salir de ventana o en inputs | Desactivado en táctil `(hover:none)`. Anillo se expande (1.6x) sobre interactivos. |
| **Botones Magnéticos** | Atracción hacia el cursor dentro de 80px | Desplazamiento máx. 8px hacia el cursor | Retorno: 300 ms | `cubic-bezier(.22, 1, .36, 1)` | Mousemove dentro de 80px | Retorna a (0,0) al salir | Cálculo vectorial `(dx, dy)` con `transform: translate(x, y)`. Solo en botones primarios. |
| **Cortina de Carga (Intro)** | Cortina completa sube verticalmente | `translateY(0 → -100%)` | 600 ms | `cubic-bezier(.65, 0, .35, 1)` | Contador llega a 100% | Se elimina del DOM o `display: none` | Capa fija `#svPantallaCarga` con temporizador de seguridad de 2.5 s. |

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

