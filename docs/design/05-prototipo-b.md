# Finansi · Prototipo del concepto B

El concepto B, Emprendedor Moderno, fue aprobado el 9 de noviembre de 2026. El prototipo conserva el verde bosque, la ilustración de Taller Bruma en Inicio y la caja como punto de entrada. Usa titulares editoriales en la bienvenida, los encabezados de módulo y los importes que orientan decisiones.

Abre [Bienvenida](finansi/index.html) para seguir el recorrido o [la galería](finansi/pantallas.html) para entrar en una pantalla. Descarga el repositorio completo para abrir los HTML con sus imágenes y fuentes.

| Pantalla | Qué puedes probar | Escritorio · 1440 × 900 | Móvil · 390 × 844 |
| --- | --- | --- | --- |
| [Bienvenida](finansi/index.html) | Conoce el objetivo de Finansi y empieza por calcular un precio. | [PNG](mockups/b/bienvenida-escritorio.png) | [PNG](mockups/b/bienvenida-movil.png) |
| [Onboarding](finansi/onboarding.html) | Introduce los datos básicos del negocio y sigue a su primer producto. | [PNG](mockups/b/onboarding-escritorio.png) | [PNG](mockups/b/onboarding-movil.png) |
| [Dashboard](finansi/inicio.html) | Consulta caja, ventas, gastos, ganancia y la revisión que propone Finansi. | [PNG](mockups/b/inicio-escritorio.png) | [PNG](mockups/b/inicio-movil.png) |
| [Mis productos](finansi/productos.html) | Busca, filtra y compara las tres velas de Taller Bruma. | [PNG](mockups/b/productos-escritorio.png) | [PNG](mockups/b/productos-movil.png) |
| [Crear producto](finansi/crear-producto.html) | Avanza entre Datos, Materiales y Trabajo. La captura muestra el paso Materiales. | [PNG](mockups/b/crear-producto-escritorio.png) | [PNG](mockups/b/crear-producto-movil.png) |
| [Calculadora de precio](finansi/calculadora.html) | Explora costos de material y trabajo y dos metas de margen. | [PNG](mockups/b/calculadora-escritorio.png) | [PNG](mockups/b/calculadora-movil.png) |
| [Simulador de precios](finansi/simulador.html) | Prueba precio, costo o cantidad y compara la ganancia con el punto de partida. | [PNG](mockups/b/simulador-escritorio.png) | [PNG](mockups/b/simulador-movil.png) |
| [Ventas](finansi/ventas.html) | Abre el registro de venta y filtra el historial por estado de cobro. | [PNG](mockups/b/ventas-escritorio.png) | [PNG](mockups/b/ventas-movil.png) |
| [Inventario](finansi/inventario.html) | Consulta existencias, alertas y el formulario de alta de material. | [PNG](mockups/b/inventario-escritorio.png) | [PNG](mockups/b/inventario-movil.png) |
| [Mi dinero](finansi/mi-dinero.html) | Distingue caja, entradas y salidas del negocio y dinero personal. | [PNG](mockups/b/mi-dinero-escritorio.png) | [PNG](mockups/b/mi-dinero-movil.png) |
| [Asistente Finansi](finansi/asistente.html) | Elige preguntas de ejemplo y abre la evidencia de cada respuesta. | [PNG](mockups/b/asistente-escritorio.png) | [PNG](mockups/b/asistente-movil.png) |
| [Diagnóstico](finansi/diagnostico.html) | Revisa el margen de Cedro y la alerta de cera desde su origen. | [PNG](mockups/b/diagnostico-escritorio.png) | [PNG](mockups/b/diagnostico-movil.png) |

## Recorrido sugerido

1. Entra desde Bienvenida y sigue a Crear producto. El lote de 10 velas incluye S/ 156 en materiales, S/ 80 de trabajo y S/ 12 de gastos asignados. Usa la calculadora para ver el costo de S/ 24.80 por unidad y el precio sugerido de S/ 36 con una meta de 30%.
2. En el simulador, compara 20 velas a S/ 32 con uno de los cuatro escenarios. Cada barra comparte la misma escala y la tabla desglosa los valores.
3. Desde Inicio, abre Ventas y prueba una venta pendiente de cobro. Mi dinero separa los cobros de los aportes y retiros personales.
4. En Diagnóstico, abre la consulta sobre la cera. El asistente indica qué datos usó y enlaza al escenario que explica su respuesta.

En móvil, Inventario, Mi dinero y Diagnóstico se abren desde **Más**. Las tablas de operación pasan a filas de lectura vertical. En tableta, la calculadora y el simulador conservan dos columnas cuando hay espacio. La galería enlaza a un Inicio sin ventas, el registro de venta, el alta de material y una consulta con datos insuficientes. Para probar un error de formulario, introduce 0 en “Unidades por lote”.

La maqueta trabaja con datos ficticios y respuestas predefinidas. Las entradas de formularios sirven para revisar los pasos y su retroalimentación. La calculadora ofrece seis combinaciones fijas y el simulador, cuatro escenarios. Los importes y supuestos están en el [caso de Taller Bruma](04-caso-demo.md).

## Imágenes de muestra

Las tres fotografías ficticias del catálogo se generaron con la herramienta integrada de generación de imágenes. La foto de Cedro también se usa en Bienvenida.

<details>
<summary>Archivos y prompts de las fotografías</summary>

- [cedro.png](finansi/img/cedro.png)

~~~text
Use case: product-mockup. Asset type: sample product photograph for the Finansi prototype and fictitious Peruvian maker Taller Bruma. Light olive plaster in a real candle-maker's studio and a warm limestone counter. An unlit amber glass jar candle with natural cream soy wax, cream textured label reading exactly 'BRUMA' and 'CEDRO' beneath it, and one spare cedar sprig on the table. Soft shadows from a nearby window, organic green and honey tones. The jar is in the center and fills the middle half of the frame. Landscape 4:3 composition with margin for crops, entire jar and label visible. Used both for a catalogue thumbnail and a welcoming workshop story photo. Photorealistic independent artisan catalogue photography, softly lit and restrained. True glass and paper texture. Single candle as the focus. No UI, no hands, no watermark, no extra text or logos.
~~~

- [lavanda.png](finansi/img/lavanda.png)

~~~text
Use case: product-mockup. Asset type: sample product photograph for the Finansi prototype and fictitious Peruvian maker Taller Bruma. Quiet muted pale lavender-grey plaster and a natural limestone counter. An unlit frosted off-white glass jar candle with ivory soy wax and subtle cream label reading exactly 'BRUMA' and 'LAVANDA' beneath it. A tiny dried lavender stem on the counter. Soft window side light, fine tactile surfaces, the jar centered at medium distance filling the middle half of the image. Landscape 4:3 composition with margin for crops, entire jar and label visible. Photorealistic independent artisan catalogue photography, softly lit and restrained. True glass and paper texture. Single candle as the focus. No UI, no hands, no watermark, no extra text or logos.
~~~

- [naranja.png](finansi/img/naranja.png)

~~~text
Use case: product-mockup. Asset type: sample product photograph for the Finansi prototype and fictitious Peruvian maker Taller Bruma. Quiet warm pale peach plaster and a natural limestone counter. An unlit short brown amber glass jar candle with ivory soy wax and subtle cream label reading exactly 'BRUMA' and 'NARANJA' beneath it. A small dried orange slice on the counter. Soft window side light, fine tactile surfaces, the jar centered at medium distance filling the middle half of the image. Landscape 4:3 composition with margin for crops, entire jar and label visible. Photorealistic independent artisan catalogue photography, softly lit and restrained. True glass and paper texture. Single candle as the focus. No UI, no hands, no watermark, no extra text or logos.
~~~

</details>
