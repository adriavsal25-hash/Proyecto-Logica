# SICOP-VE — Checklist de Verificación Funcional
> Lista de verificación exhaustiva para validar que ninguna mejora visual, arquitectónica o de movimiento rompa la lógica de negocio ni la integridad contable.
> Estado actual: **100% VERIFICADO EN VERDE (43/43 Pruebas Automatizadas Aprobadas)**.

---

## 1. Autenticación y Perfiles
- [x] **Login con Alcaldía (María González):** Accede al dashboard, visualiza sus cotizaciones y módulos operativos asignados con límite de $35.000.
- [x] **Login con Empresa (Carlos Rodríguez):** Accede correctamente con su descuento comercial aplicado (3%).
- [x] **Login con Constructor (José Martínez):** Accede con su límite y descuento de constructor (5%).
- [x] **Login con Empresa en Alerta (Luis Hernández):** Accede con semáforo y advertencia de consumo presupuestario crítico (≥90%).
- [x] **Login con Gobernación 1 (Ing. Ana Pérez):** Accede como aprobador/supervisor; visualiza módulos exclusivos con clase `solo-gobernacion`.
- [x] **Login con Gobernación 2 (Ing. Marcos Rivas):** Cuenta secundaria de supervisión para auditoría cruzada y prevención estricta de autoaprobaciones.
- [x] **Selector rápido de usuarios:** Autocompleta credenciales con un clic y permite inicio de sesión inmediato con teclado o ratón.
- [x] **Cierre de sesión:** Limpia la sesión actual en memoria y `localStorage` (`sicop_sesion_v2`) y redirige limpiamente a la pantalla de login.

---

## 2. Asistente de Cotización (4 Pasos Editoriales)
- [x] **Paso 01 / 04 (Obra):** Validación obligatoria de Nombre descriptivo de Obra y Estado destino geográfico. Campo de observaciones técnicas opcional.
- [x] **Paso 02 / 04 (Materiales sin plantilla):** Selección manual de partidas, ingreso de cantidades con control estricto de enteros/decimales y búsqueda instantánea.
- [x] **Paso 02 / 04 (Materiales con plantilla):** Carga inmediata de las 5 plantillas ("Casa pequeña 50m²", "Cerca perimetral 20m", "Rehabilitar calle", "Alumbrado público", "Sistema de agua potable").
- [x] **Reemplazar vs. Sumar plantilla:** Al elegir una plantilla teniendo ya partidas en la tabla, se activa modal accesible de confirmación técnica para sustituir o anexar.
- [x] **Paso 03 / 04 (Revisión):** Resumen detallado con desglose fiscal completo (Subtotal, Flete regional, Descuento institucional, Neto, Contingencia 5%, IVA 16%, Total USD y Bolívares BCV).
- [x] **Modal Pedagógico "¿Cómo se calculó esto?":** Explicación algorítmica paso a paso con fórmulas matemáticas y valores reales de la cotización activa para defensa académica.
- [x] **Paso 04 / 04 (Emisión y Confirmación):** Confirmación final, guardado en bitácora e historial con correlativo único oficial (`COT-AAAA-XXXX`) y transición a BORRADOR o ENVIADA.
- [x] **Navegación Atrás / Siguiente:** Conserva datos intactos al retroceder entre pasos sin pérdida de información; bloquea avance ante campos inválidos.

---

## 3. Total en Vivo y Validación en Tiempo Real
- [x] **Cálculo en vivo continuo:** Al tipear cantidades o alternar estado/ciudad, el panel lateral flotante recalcula Subtotal, Flete, Descuento, Contingencia, IVA y Total en USD y Bs. al vuelo (60fps, sin parpadeos ni recargas).
- [x] **Validación de cantidades por material:**
  - Rechaza valores negativos, `NaN`, `Infinity`, caracteres alfabéticos y notación exponencial (`1e308`).
  - Respeta la bandera `permiteDecimales` (solo materiales a granel o cable admiten decimales; bloques y sacos exigen enteros).
  - Límite máximo operativo seguro establecido en 1.000.000 de unidades.
- [x] **Coherencia contable y matemática:** El total en vivo coincide con exactitud matemática de centavos con el desglose del Paso 3 y el documento impreso.

---

## 4. Control de Presupuesto y Reglas de Negocio
- [x] **Regla de cotización única abierta:** Si el usuario tiene una cotización activa en `BORRADOR` o `ENVIADA`, se bloquea preventivamente la creación de una nueva.
- [x] **Acciones ante bloqueo:**
  - Botón "Ir a mi cotización abierta": retoma el asistente en el paso correspondiente.
  - Botón "Descartar": solicita confirmación accesible y descarta el borrador liberando la creación.
- [x] **Borrador automático persistente por usuario:** Guardado automático desacoplado bajo `sicop_borrador_asistente_v2[usuarioId]`; recuperable al cambiar de pestaña, recargar o reingresar.
- [x] **Semáforo de presupuesto dinámico:**
  - Verde: Operativo Óptimo (<70% de consumo).
  - Amarillo: Precaución (70% - 89.9% de consumo).
  - Rojo: Alerta Crítica (≥90% de consumo).
  - Bloqueo por sobregiro cero: Impide autorizar compromisos que superen el saldo disponible asignado a la entidad.

---

## 5. Flujo de Aprobación y Supervisión (Gobernación)
- [x] **Bandeja de Aprobaciones:** Listado dinámico de órdenes en estado `ENVIADA` con indicador visual de suficiencia de fondos.
- [x] **Aprobar con fondos suficientes:** Verifica saldo disponible del solicitante, avanza estado a `APROBADA`, reserva el monto en saldo comprometido y emite notificación.
- [x] **Aprobar sin fondos:** Bloquea la aprobación si el monto total excede el saldo disponible del solicitante emitiendo advertencia de fondos insuficientes.
- [x] **Bloqueo estricto de autoaprobación:** Un usuario con rol Gobernación no puede aprobar sus propias cotizaciones (requiere la intervención del segundo supervisor).
- [x] **Rechazar cotización:** Abre modal formal de rechazo con validación de motivo (mínimo 10 caracteres obligatorios); guarda `motivoRechazo`, transiciona a `RECHAZADA` y emite notificación.
- [x] **Visualización del motivo de rechazo:** Visible para el solicitante en la tabla del historial, en la vista detallada y en el documento formal imprimible.
- [x] **Marcar como entregada:** Transición válida de `APROBADA` a `ENTREGADA`, trasladando el monto reservado de comprometido a gasto definitivo ejecutado.
- [x] **Control de vigencia fiscal (15 días calendario):** Valida la vigencia de la cotización; bloquea la aprobación de presupuestos vencidos y ofrece botón para duplicar con precios actualizados.

---

## 6. Historial y Operaciones sobre Cotizaciones
- [x] **Ver detalle:** Abre vista de inspección con partidas, precios unitarios ajustados por factor de ciudad y subtotales.
- [x] **Duplicar cotización:** Crea una copia limpia en borrador con fecha actual y nuevo correlativo consecutivo.
- [x] **Cancelar cotización:** Transición controlada a `CANCELADA` respetando la matriz de estados válidos.
- [x] **Filtros de estado:** Filtrado instantáneo por Todos, Borrador, Enviada, Aprobada, Rechazada, Entregada y Cancelada.
- [x] **Documento imprimible oficial:** Formato editorial formal membretado; oculta barras de navegación y controles en `@media print` para exportación impecable a PDF.
- [x] **Compartir vía WhatsApp:** Genera enlace `https://wa.me/?text=...` con resumen técnico legible y montos formateados.

---

## 7. Catálogo de Materiales y Optimización Logística
- [x] **Alta de material:** Formulario modal para registrar nuevos insumos con código, categoría, unidad de medida, precio base y validación de decimales.
- [x] **Edición de material:** Modifica precio base o unidad de medida sin alterar registros de cotizaciones históricas previamente emitidas.
- [x] **Desactivar / Activar material:** Permite deshabilitar ítems obsoletos del cotizador sin eliminarlos de la base de datos histórica.
- [x] **Historial de precios:** Registro de variaciones en la bitácora de auditoría.
- [x] **Dónde Comprar (Logística):** Algoritmo manual de ordenamiento tipo burbuja (sin `.sort()`) que clasifica ciudades proveedoras de menor a mayor factor de costo (Puerto Ordaz 0.90 hasta Amazonas 1.25).

---

## 8. Calculadora de Obras
- [x] **Cálculo de Pared de Bloques:** Ingreso de longitud, altura y porcentaje de desperdicio → cálculo exacto de bloques, sacos de cemento y arena con redondeo matemático corregido.
- [x] **Cálculo de Losa de Concreto Armado:** Ingreso de largo, ancho y espesor → estimación de concreto premezclado, cabillas de acero y alambre de amarre.
- [x] **Cálculo de Instalación de Tuberías:** Ingreso de metros lineales y diámetro → cómputo métrico de tubos de 6m, codos y soldadura líquida.
- [x] **Transferencia directa al Cotizador:** Botón "Agregar a la Cotización" transfiere los materiales calculados directamente a la tabla del asistente en el Paso 2.

---

## 9. Supervisión, Bitácora y Sistema
- [x] **Supervisión y Ranking:** Métricas de inversión consolidada por sector (Construcción, Electricidad, Vialidad, Hidráulico) y barras semafóricas de fondos.
- [x] **Bitácora de Auditoría Inmutable:** Registro cronológico de inicio de sesión, creación de cotizaciones, aprobaciones, rechazos y actualizaciones de catálogo.
- [x] **Exportar JSON seguro:** Descarga archivo `.json` de respaldo íntegro excluyendo contraseñas y hashes de seguridad.
- [x] **Exportar CSV protegido:** Descarga archivo `.csv` con separador punto y coma (`;`), BOM UTF-8 (`\uFEFF`) para compatibilidad directa con Microsoft Excel y neutralización de inyección de fórmulas (`=`, `+`, `-`, `@`).
- [x] **Importar JSON con validación:** Analiza y valida la estructura y esquema antes de cargar datos, previniendo sobreescritura de contraseñas y corrupción de datos.
- [x] **Modo Demostración / Restablecer Fábrica:** Permite recargar los datos semilla de prueba para la defensa en clase o reiniciar el sistema a cero con confirmación.

---

## 10. Interfaz, Preferencias, Movimiento y Responsividad
- [x] **Selector de Moneda USD / Bolívares:** Alterna denominación monetaria en todas las vistas aplicando la tasa oficial del BCV en vivo con badge de fecha de fijación.
- [x] **Selector de Tema Claro / Oscuro:** Paleta editorial monocromática (Neutro cálido `#F1F0EC` y Carbón editorial `#121211`) con contraste superior a 15:1 (cumple WCAG AAA).
- [x] **Preferencia de Movimiento:** Soporte nativo para `@media (prefers-reduced-motion: reduce)` y toggle manual persistente en `localStorage`.
- [x] **Menú lateral colapsable:** Botón de repliegue/expansión fluido con cajón móvil superpuesto y overlay accesible.
- [x] **Barra inferior móvil (<768px):** Barra táctil fija con accesos rápidos y objetivos de toque ergonómicos (mínimo 44×44px).
- [x] **Diseño Responsive 100% fluido:** Probado y verificado en 360px, 390px, 768px, 1024px, 1280px y 1440px sin desbordamiento horizontal.
- [x] **100% Offline y sin dependencias externas:** Funciona abriendo `index.html` con doble clic (`file://`) sin librerías externas ni CDNs.
- [x] **Suite de Pruebas Automáticas (`pruebas.html`):** 43 de 43 pruebas en verde (100% aprobadas sin fallos).
