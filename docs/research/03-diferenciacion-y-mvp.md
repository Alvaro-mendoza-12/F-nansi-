# Finansi: diferenciación y alcance recomendado

**Propuesta:** de la receta a un precio defendible. Finansi ayuda a quien fabrica en casa a incluir lo que gasta y lo que trabaja, comparar dos precios y entender cuánto le quedaría por unidad. Después de vender, muestra por separado la ganancia estimada y el dinero disponible.

## Problemas y oportunidades

| Señal | Oportunidad | Cómo comprobar valor |
| --- | --- | --- |
| Etsy enseña a contabilizar tiempo, materiales e indirectos; la [comunidad de vendedores](https://www.reddit.com/r/CraftyCommerce/comments/1dno2wn/pricing_megathread/) pide ayuda con tarifa y gastos de venta. | Desglosar qué entra en el costo y permitir indicar qué parte es estimada. | El participante incorpora tiempo propio y explica cuánto cuesta una unidad. |
| [Stocksmith](https://help.stocksmith.io/article/155-about-pricing-guidance) ya vincula receta con precio; [reseñas](https://www.g2.com/products/craftybase/reviews) describen esfuerzo al cargar insumos. | Dar un resultado con un solo producto y alta de insumos dentro del flujo. Guardar y reutilizar lo aprendido después. | Medir tiempo hasta el primer precio explicado, ayuda requerida y errores de unidad. |
| [Wave](https://support.waveapps.com/hc/en-us/articles/48497863638548-Overview-of-your-business-Dashboard-new-Dashboard-experience) distingue caja y resultados; [Kyte](https://docs.kyteapp.com/en/articles/7861107-view-your-business-results) ofrece ganancia de producto. | Mostrar por qué un cobro pendiente, un aporte o un retiro cambia el dinero disponible de forma distinta a la ganancia. | Con una venta pendiente de cobro y un retiro, pedir que expliquen qué cambia y qué no. |
| [QuickBooks](https://quickbooks.intuit.com/business-intelligence/ai-report-insights/) ya usa IA para sugerir y explicar con datos. | Una recomendación concreta basada en costo y margen, con importes y supuesto a un toque. | Pedir que localicen el origen de una sugerencia e identifiquen cuándo no alcanza la información. |

La ventaja es una **hipótesis de experiencia**, no de exclusividad: precio, escenarios e IA son capacidades conocidas. El valor está en el recorrido completo para un taller pequeño, desde el teléfono, con soles y lenguaje cotidiano.

## Priorización del MVP

| Capacidad | Valor / esfuerzo relativo | Decisión y límite |
| --- | --- | --- |
| Alta corta, insumos y receta | Alto / medio | **Núcleo.** Una receta por producto; compra y consumo con unidades compatibles; costo por lote y unidad. Evitar maestros obligatorios antes del primer cálculo. |
| Precio guiado y explicación | Alto / medio | **Núcleo.** Materiales, trabajo, empaque e indirectos por lote. Margen objetivo editable; explicar precio mínimo para el objetivo y sugerencia redondeada. El precio lo decide la persona. |
| Simulación | Alto / bajo si reutiliza el cálculo | **Núcleo.** Escenario base y uno editable (precio, costo o unidades); comparación en soles y porcentaje. Nunca se guarda un escenario como precio sin confirmación. |
| Ventas y dinero personal | Alto / medio | **Núcleo.** Venta simple, cobrada o pendiente, gasto, aporte y retiro; registrar efectivo, transferencia o billetera manualmente. Sin facturación, pagos ni conciliación. |
| Diagnóstico y detección de bajo margen | Alto / bajo | **Núcleo.** Reglas transparentes: margen bajo con umbral elegido, costo faltante y stock bajo. Priorizar una acción, sin puntaje opaco. |
| Inventario | Medio / medio | **Acotado.** Materiales, ajustes y umbral. Si se confirma producción se descuentan insumos y se suman unidades terminadas; una venta consume unidades, no insumos de nuevo. Sin lotes con trazabilidad ni almacenes. |
| Asistente contextual | Medio / medio-alto | **Condicional.** Primero probar explicación basada en datos calculados. Si se autoriza otra fase, evaluar preguntas acotadas y solo lectura; ante datos faltantes, pedirlos o mostrar explicación estática. |
| Predicción, banca, contabilidad fiscal, varios roles | Bajo para la demo / alto | **Después.** No prometer demanda futura, automatizar compras, integrar bancos o replicar un ERP. |

**Reglas de cálculo para revisión, no lógica implementada.** Costo unitario = costo del lote dividido entre unidades vendibles. Ganancia estimada por unidad = precio menos costo unitario. Margen = ganancia dividida entre precio (si el precio es positivo). Precio mínimo para un margen objetivo m = costo unitario / (1 − m), con 0 ≤ m < 1; redondear hacia arriba al centavo para no quedar bajo el objetivo. “Precio sugerido” puede ser el siguiente sol entero; mostrar el margen resultante. Si se modela una comisión proporcional f más adelante, el denominador es 1 − m − f y debe ser positivo. Un costo faltante no se interpreta como cero; si es estimado se rotula como tal. No se estiman impuestos ni demanda.

## Demostración de tres minutos

| Tiempo | Qué ve el jurado |
| --- | --- |
| 0:00–0:25 | Lucía fabrica Vela Cedro y la vende a S/ 32. Quiere saber si le conviene mantener ese precio. |
| 0:25–1:05 | Parte de un producto y añade materiales y 30 minutos de trabajo. Costo completo: S/ 24.80; queda S/ 7.20, un margen de 22.5%. |
| 1:05–1:55 | Pide un margen de 30%. El mínimo es S/ 35.43; prueba S/ 36 y ve S/ 11.20 por unidad. Si el insumo sube S/ 2, a S/ 36 obtiene S/ 9.20: aún no alcanza la meta. |
| 1:55–2:35 | Ve una venta de S/ 64 y un retiro personal: explica cuándo entra efectivo y por qué el retiro no reduce la ganancia operativa. |
| 2:35–3:00 | El diagnóstico muestra el producto, margen y costo que explican la alerta; propone revisar el precio. La decisión sigue en manos de Lucía. |

## Validación antes de invertir

Probar con 5 a 7 personas que produzcan por lotes (p. ej., velas, repostería, accesorios), usando su teléfono y datos ficticios. Contrastar el prototipo posterior con su método actual (libreta, hoja de cálculo o intuición). Metas propuestas, todavía no medidas: al menos 4 de las primeras 5 llegan a un precio razonado en menos de 3 minutos sin ayuda; al menos 4 distinguen correctamente ganancia y dinero disponible; ninguna termina con un precio sugerido tras omitir un costo imprescindible. Si falla el tiempo, reducir alta; si falla comprensión, revisar etiquetas antes de añadir IA. La aprobación visual permite diseñar los demás mockups; una autorización independiente se requiere para construir funciones.
