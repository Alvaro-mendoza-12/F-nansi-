# Finansi: arquitectura de experiencia

La primera sesión se considera útil cuando alguien obtiene y entiende un precio para su primer producto. Lucía no necesita tener un catálogo, inventario inicial o datos de facturación para empezar.

## Mapa de navegación propuesto

~~~mermaid
flowchart LR
    B["Bienvenida"] --> O["Configurar negocio"]
    O -->|Primer producto| P["Crear producto"]
    O -->|Ver ejemplo| I["Inicio"]
    P --> M["Añadir insumo sin salir"]
    M --> P
    P --> C["Calculadora · costo y precio"]
    C --> S["Simulador · comparar"]
    C --> D["Mis productos · detalle"]
    S --> D
    I --> D
    I --> V["Ventas · registrar e historial"]
    I --> N["Inventario · materiales y unidades"]
    I --> F["Mi dinero · caja y movimientos"]
    I --> G["Diagnóstico · prioridades"]
    G --> A["Asistente Finansi · explicación"]
    G --> C
    G --> N
    D --> C
    D --> V
    V -->|Cobro confirmado| F
~~~

| Grupo | Escritorio | Móvil | Información primaria |
| --- | --- | --- | --- |
| Inicio | Inicio en menú principal | Inicio en barra inferior | Fecha, ventas, costos/gastos, ganancia y caja; luego una acción prioritaria |
| Productos | Menú principal | Productos en barra inferior | Catálogo; al elegir producto: costo, precio, margen y acceso a cálculo/simulación |
| Ventas | Menú principal | Ventas en barra inferior | Acción de registro y pendientes de cobro; luego historial |
| Inventario | Menú principal | Más y acceso desde alertas | Stock bajo primero; filtros por insumo/producto; detalle de ajustes |
| Mi dinero | Menú principal | Más y enlace desde caja | Saldo, cobros/pagos y aportes/retiros en grupos explícitos |
| Diagnóstico | Inicio y menú secundario | Hallazgo en Inicio y acceso en Más | Un hallazgo priorizado, datos que lo sustentan, siguiente paso |
| Asistente Finansi | Menú secundario y ayuda contextual | Más y desde producto/diagnóstico | Alcance, consultas sugeridas, respuesta con datos y enlace |

La calculadora y el simulador viven en el contexto de un producto. En un móvil, el detalle vuelve a la lista conservando el filtro; los accesos a una alerta conservan su material o producto. En escritorio, el detalle de costo puede abrir al lado del resumen. Las tres alternativas de Inicio prueban jerarquías distintas; su navegación es provisional.

## Flujos principales

| Flujo | Pasos y decisión | Salida / recuperación |
| --- | --- | --- |
| 1. Primer ingreso | Bienvenida → “Calcular mi primer precio” → nombre de negocio y moneda (PEN por defecto) → producto. “Ver ejemplo” usa datos marcados como ficticios. | El giro, foto y saldo inicial son opcionales para costear. Si cierra el flujo, recuperar borrador; al limpiar una demo, regresar al estado inicial. |
| 2. Materiales | Desde Inventario o la receta, “Añadir material” → nombre → cantidad comprada, unidad, importe y stock inicial si lo conoce. Mostrar la equivalencia, p. ej. S/ 42.67/kg ≈ S/ 0.043/g. | Volver a receta con el insumo seleccionado. Si mezcla unidades incompatibles, pedir la conversión válida y conservar lo digitado. |
| 3. Producto | Nombre y unidades vendibles por lote → seleccionar materiales y cantidad usada → tiempo e indirectos. Foto y categoría opcionales. | Guardar como borrador o seguir al costo. Si existen nombres similares, avisar y permitir continuar tras revisar. |
| 4. Costo | Mostrar costo de materiales, trabajo e indirectos por lote y por unidad. Indicar qué dato es estimado; editar desde el renglón. | Si faltan datos, mostrar subtotal identificado y pedir el insumo o el tiempo antes de sugerir precio. No dividir entre cero. |
| 5. Precio | Elegir margen objetivo → ver precio mínimo, precio sugerido y ganancia en soles → comparar un escenario → confirmar precio propio si quiere guardarlo. | Precios no positivos y márgenes inválidos muestran error. Si el precio elegido deja margen bajo, avisar y permitir que la persona decida. La simulación no altera el producto. |
| 6. Venta | Elegir producto, cantidad y precio real → medio, fecha y estado de cobro → revisar total → confirmar. | Venta pendiente aparece en ventas, sin aumentar caja. Cobrar después crea solo el cobro. Revisar stock antes de confirmar y poder corregir un registro sin duplicarlo. |
| 7. Dashboard | Elegir período → leer importes → abrir tabla del gráfico o detalle de caja → ir a la acción destacada. | Sin ventas, explicar qué aparecerá y ofrecer “Registrar primera venta”. Si falta saldo inicial, “Caja parcial” con origen y acción “Registrar saldo inicial”. |
| 8. Diagnóstico y asistencia | Inicio → hallazgo “Vela Cedro: 22.5% de margen” → ver costo, precio y meta → “Probar otro precio”. En Asistente: “¿Qué pasa si sube la cera?”. | La explicación cita producto, fecha y campos; muestra un escenario, sin aplicar cambios. Ante falta de datos, pedir el dato; si no hay conexión, mantener visibles el costo y el resultado calculados cuando estén disponibles. |

## Comportamiento por dispositivo

| Módulo | Móvil · 390 × 844 | Tableta | Escritorio · 1440 × 900 |
| --- | --- | --- | --- |
| Bienvenida y configuración | Una columna, una acción y pasos cortos | Formulario centrado; ayuda opcional al lado | Presentación y formulario con resumen |
| Inicio y diagnóstico | Orden de lectura por decisión, gráfico breve y barra inferior | Dos columnas si los importes caben; alertas debajo si no | Resumen, gráfico y diagnóstico comparables de un vistazo |
| Productos, ventas, inventario y dinero | Fila táctil con nombre, importe/stock y estado; filtros en panel desplegable | Vista de lista con detalle si hay espacio | Tabla con columnas, filtros y detalle |
| Producto, calculadora y simulador | Paso a paso; resultado compacto y visible cerca de “Continuar” | Formulario más resultado lateral si cabe | Editor y desglose en paralelo |
| Asistente | Conversación a ancho completo; evidencia desplegable | Conversación y contexto en columnas si caben | Respuesta y fuentes internas visibles en paralelo |

**Estados comunes.** Carga: mantener espacios y anunciar “Calculando” sin mostrar ceros provisionales. Vacío: indicar qué falta y dar una acción. Error de campo: explicar cómo corregir y conservar los valores. Error de guardado: mantener borrador y ofrecer reintento sin crear duplicados. Resultado parcial: indicar cobertura y evitar comparar períodos incompletos como si fueran equivalentes. Desactualizado: mostrar fecha de corte. Acciones de edición: confirmar solo cuando cambia un dato importante y mostrar el resultado.

Estas son especificaciones de diseño. En esta entrega solo se prototipa Inicio; los mockups de los demás módulos se preparan tras aprobar un concepto visual.
