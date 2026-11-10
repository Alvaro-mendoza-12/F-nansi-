# Fase 4 · Navegación y métodos de cálculo

## Auditoría y decisiones

La barra anterior mostraba Inicio, Productos, Ventas, Inventario y Mi dinero en escritorio. Diagnóstico estaba en el menú de perfil y Asistente tenía un acceso propio. En móvil, el menú Más reunía módulos con distintos propósitos y Calcular precio se encontraba dentro de la receta. Las cabeceras y barras duplicadas en HTML podían divergir al agregar una ruta o traducir una etiqueta. La calculadora solo aceptaba un margen, aunque el comparador ya permitía evaluar un precio propio.

- Xero agrupa las funciones de uso diario y separa informes y ajustes. QuickBooks mantiene accesos rápidos a tareas frecuentes y permite elegir preferencias desde lugares reconocibles. Finansi usa el recorrido de sus registros reales para priorizar Inicio, Productos, Calcular precio y Ventas. La prioridad se deduce del flujo del producto. Aún falta validarla con sesiones de emprendedores. [Xero Central](https://central.xero.com/0/article/Menus-icons-and-tabs-in-Xero) · [QuickBooks](https://quickbooks.intuit.com/learn-support/en-us/help-article/bookkeeping-processes/understand-navigation-menu-quickbooks-online/L310NeoHY_US_en_US)
- Android recomienda conservar los mismos destinos al pasar de una barra inferior a navegación lateral. Finansi mantiene cuatro destinos rotulados y Más en ventanas compactas. La barra lateral muestra los grupos desde 1050 px. [Android Developers](https://developer.android.com/develop/ui/compose/layouts/adaptive/build-adaptive-navigation)
- La receta mantiene sus tres pasos de entrada. La calculadora muestra un campo por método y deja el desglose de costos y las definiciones bajo controles desplegables. El ejemplo del método elegido aparece al lado del campo. Las preferencias se reúnen en Configuración y se anuncian al guardarse. [Divulgación progresiva](https://www.nngroup.com/articles/progressive-disclosure/) · [Diseño de formularios](https://www.nngroup.com/articles/web-form-design/) · [Ayuda contextual](https://www.nngroup.com/articles/help-and-documentation/)

| Grupo | Destinos y función |
| --- | --- |
| Principal | Inicio, Productos, Calcular precio y Ventas. La calculadora ofrece abrir una receta existente, crear otra o usar una muestra. Cada producto guardado también tiene acceso directo a su cálculo. |
| Herramientas | Comparar precios. Usa el mismo simulador para evitar dos destinos con la misma función. |
| Mi negocio | Inventario, Mi dinero, Diagnóstico y Asistente. Cada enlace y pantalla indican que es una demostración con datos ficticios. |
| Configuración | Idioma, apariencia, método preferido, país y moneda, exportación y restauración. |
| Ejemplos | Galería de pantallas y acceso a las rutas históricas de demostración. |

## Cálculo y persistencia

Sea **C** el costo unitario, **P** el precio por unidad, **m** el margen objetivo en decimal, **r** el recargo en decimal y **n** la cantidad de ventas.

| Método | Fórmula o entrada | Con costo de S/ 20 |
| --- | --- | --- |
| Margen | P = C ÷ (1 − m). El margen objetivo va de 0 % a menos de 100 %. | 20 % → S/ 25, ganancia S/ 5 |
| Recargo | P = C × (1 + r). El recargo admite cero y valores superiores a 100 %. | 20 % → S/ 24, ganancia S/ 4 |
| Manual | P es el precio positivo ingresado. | S/ 30 → ganancia S/ 10, margen ≈ 33,33 %, recargo 50 % |

La ganancia por unidad es P − C. El margen realizado es (P − C) ÷ P, el recargo realizado es (P − C) ÷ C y la ganancia estimada para n ventas es (P − C) × n. Los porcentajes se muestran multiplicados por 100. El recargo se muestra como «—» si C = 0. Los precios derivados se redondean hacia arriba al céntimo y las métricas se calculan con el precio redondeado y el costo exacto. Los resultados reflejan los costos ingresados y la cantidad indicada. La interfaz advierte cuando un precio queda por debajo del costo.

Las preferencias de método, idioma y tema pertenecen al navegador. Un método nuevo se aplica al empezar una receta. Los borradores viven en la pestaña y conservan los valores al retroceder o recargar. IndexedDB guarda el método con su entrada y el precio explícitamente elegido en campos separados. Los registros antiguos conservan su margen y precio. Las ventas conservan el costo unitario del momento en que se registraron. Las copias JSON v2 incluyen el método y siguen admitiendo restauración de v1. La confirmación de restauración informa el alcance del reemplazo.

## Evaluación heurística

Se revisó el flujo de receta, cálculo, comparación, catálogo y configuración contra las diez heurísticas. WCAG 2.2 AA es el objetivo de las comprobaciones web. Se usó ISO 9241-110 como referencia de interacción, en particular para control, claridad y recuperación ante errores. [Nielsen Norman Group](https://www.nngroup.com/articles/ten-usability-heuristics/) · [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [ISO 9241-110:2020](https://www.iso.org/standard/75258.html)

| Heurística | Evidencia revisable |
| --- | --- |
| 1. Visibilidad del estado | Destino y paso actual, resumen de costo, resultados y mensajes de guardado. |
| 2. Correspondencia con el mundo real | Se distingue cuánto cuesta, cuánto se cobra, cuánto se gana y cuánto falta por cobrar. |
| 3. Control y libertad | Atrás conserva entradas. Escape cierra Más y devuelve el foco. Cancelar conserva los productos. |
| 4. Consistencia | Los destinos, iconos y traducciones vienen de un único componente. |
| 5. Prevención de errores | Límites de cantidades y porcentajes, compatibilidad de unidades, advertencias de pérdida, elección explícita y confirmación para eliminar o restaurar. |
| 6. Reconocimiento | Cada destino lleva etiqueta. El método elegido muestra un ejemplo al lado del formulario. |
| 7. Flexibilidad | El método preferido se puede sustituir en una receta. El idioma y la apariencia se ajustan desde Configuración. |
| 8. Diseño minimalista | Un campo de precio o porcentaje por método. El desglose y los conceptos se abren cuando hacen falta. |
| 9. Recuperación | Los errores identifican el campo. El flujo vuelve al paso pertinente cuando faltan datos de receta. |
| 10. Ayuda y documentación | Las ayudas de costo, precio, ganancia, ventas y cobros están junto al dato que explican. |

## Reproducción y alcance

La verificación local pasó 10 pruebas unitarias y el recorrido a 390, 768 y 1440 px. Axe 4.10.3 reportó cero infracciones en los 17 estados auditados de receta, calculadora, comparador, Más, configuración oscura y ventas. El recorrido confirmó el foco del primer campo inválido, la devolución del foco al cerrar Más con Escape y la cancelación de una eliminación. En las vistas recorridas no hubo desbordamiento horizontal, errores JavaScript ni respuestas fallidas del sitio.

- `npm test` verifica fórmulas, precisión, entradas inválidas, costo cero y compatibilidad de copias v1 y v2.
- `npm run test:e2e` usa Chromium en perfiles temporales a 390, 768 y 1440 px. Verifica los métodos A, B y C, preferencia tras recargar, precio histórico, persistencia de borradores, navegación ES/EN y regresión de ventas, cobros y catálogo.
- El recorrido acepta `FINANSI_AXE` con la ruta local de `axe.min.js` para ejecutar reglas WCAG. `FINANSI_EVIDENCE` permite guardar las capturas en un directorio de salida. Las capturas documentan el resultado actual. Una comparación visual automatizada requiere una referencia equivalente de las mismas pantallas y tamaños.
- Los datos y las preferencias permanecen en el navegador. La copia JSON traslada registros. El texto de algunas vistas históricas de demostración sigue en español. Quedan pendientes las sesiones de usabilidad con emprendedores y una revisión manual con lector de pantalla.
