# Fase 4 · Navegación y métodos de cálculo

## Auditoría y decisiones

La barra anterior mostraba Inicio, Productos, Ventas, Inventario y Mi dinero en escritorio. Diagnóstico estaba en el menú de perfil y Asistente tenía un acceso propio. En móvil, el menú Más reunía módulos con distintos propósitos y Calcular precio se encontraba dentro de la receta. Las cabeceras y barras duplicadas en HTML podían divergir al agregar una ruta o traducir una etiqueta. La calculadora solo aceptaba un margen, aunque el comparador ya permitía evaluar un precio propio.

- QuickBooks reúne los flujos frecuentes en Inicio y permite personalizar los accesos. Zoho Books separa los módulos en una barra lateral, ofrece creación rápida y concentra las preferencias en Configuración. Finansi conserva esas relaciones entre tarea, módulo y preferencia, con menos destinos porque su alcance es menor. Se priorizan Inicio, Productos, Calcular precio y Ventas por el recorrido de los registros reales. Es una decisión de diseño pendiente de validar con emprendedores. Fuentes oficiales consultadas de nuevo el 10 de noviembre de 2026: [QuickBooks: personalizar Inicio](https://quickbooks.intuit.com/learn-support/en-us/help-article/product-setup/customize-home-page-quickbooks-online/L0ryPsyjD_US_en_US) · [Zoho Books: navegación](https://www.zoho.com/books/help/getting-started/navigating-zoho-books.html).
- Android recomienda conservar los mismos destinos al pasar de una barra inferior a navegación lateral. Finansi mantiene cuatro destinos rotulados y Más en ventanas compactas. La barra lateral muestra los grupos desde 1050 px. [Android Developers](https://developer.android.com/develop/ui/compose/layouts/adaptive/build-adaptive-navigation)
- La receta mantiene sus tres pasos de entrada. La calculadora muestra un campo por método y deja el desglose de costos y las definiciones bajo controles desplegables. El ejemplo del método elegido aparece al lado del campo. Las preferencias se reúnen en Configuración y se anuncian al guardarse. [Divulgación progresiva](https://www.nngroup.com/articles/progressive-disclosure/) · [Diseño de formularios](https://www.nngroup.com/articles/web-form-design/) · [Ayuda contextual](https://www.nngroup.com/articles/help-and-documentation/)
- Se usan grupos de campos, títulos claros y ejemplos junto a la entrada para reducir lo que una persona debe recordar. La ayuda ampliada se abre a petición. Esta decisión aplica los principios de estructura, transparencia, claridad y apoyo descritos por NN/g; no demuestra por sí misma una reducción medida de carga cognitiva. [NN/g: carga cognitiva en formularios](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/).

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

La revisión del 10 de noviembre de 2026 pasó 10 pruebas unitarias y dos recorridos a 390, 768 y 1440 px: el flujo principal en español y un recorrido completo de creación, cálculo, comparación, guardado y recuperación en inglés. Axe 4.10.3 reportó cero infracciones en 29 estados auditados: 17 del recorrido principal y 12 del recorrido en inglés, incluidos los diálogos de material y restauración. No se detectaron desbordamientos horizontales ni errores JavaScript, de consola o respuestas HTTP fallidas en los recorridos.

La prueba de navegación recorre Tab y activa controles con Enter, comprueba que el control enfocado no esté tapado y selecciona el precio con Espacio. También verifica el foco de campos inválidos, el cierre de Más antes de mostrar el error, la persistencia del borrador al usar los destinos del menú y la confirmación/cancelación de restauración. Se revisaron visualmente las capturas de calculadora a 390 y 1440 px. La base visual equivalente de las nuevas pantallas no existe: la regresión visual automatizada sigue siendo **inconclusa**.

Los controles de navegación miden al menos 44 px de alto (51 px en la barra inferior); el objetivo mínimo AA es 24 × 24 px o sus excepciones de espaciado. Las comprobaciones de foco verifican visibilidad en los controles recorridos, sin afirmar cobertura completa de WCAG. [W3C: tamaño mínimo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) · [W3C: foco no oculto](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).

- `npm test` verifica fórmulas, precisión, entradas inválidas, costo cero y compatibilidad de copias v1 y v2.
- `npm run test:e2e` usa Chromium en perfiles temporales a 390, 768 y 1440 px. Verifica los métodos A, B y C, preferencia tras recargar, precio histórico, persistencia de borradores, navegación ES/EN y regresión de ventas, cobros y catálogo.
- `npm run test:navigation` verifica el recorrido en inglés, Tab/Enter/Espacio, errores desde el menú, continuidad del borrador, exportación JSON, cancelación y confirmación de restauración, método preferido persistente y método/precio históricos.
- Ambos recorridos aceptan una URL pública como argumento y usan perfiles temporales, sin acceder a datos de otros perfiles. `FINANSI_AXE` señala una copia local de `axe.min.js` para ejecutar las reglas WCAG. Si se omite, se omite axe; el resto de las pruebas sigue ejecutándose. `FINANSI_EVIDENCE` guarda capturas y los informes `recorrido-resultados.json` y `navegacion-resultados.json`. [Evidencia de esta revisión](evidencia/fase4/README.md).
- Los datos y las preferencias permanecen en el navegador. La copia JSON traslada registros. La [revisión posterior de idioma y temas](07-idioma-y-temas.md) completa la traducción de las demostraciones y añade los controles de tema a la cabecera. Quedan pendientes las sesiones de usabilidad con emprendedores y una revisión manual con lector de pantalla.

## Problemas corregidos en la revisión

1. Desde una receta, Calcular precio abría una calculadora sin contexto. Ahora conserva el identificador de borrador, valida nombre, materiales y costos, y abre el paso correspondiente si falta corregir un dato. Comparar precios desde la receta pasa primero por la elección del método.
2. Desde la calculadora, Comparar precios en la barra lateral o en Más no confirmaba el método actual. Ahora usa la misma acción validada que el botón del formulario, conserva los valores al volver y evita comparar con un método anterior.
3. Un error detectado desde Más podía quedar fuera del diálogo abierto. Ahora se cierra Más antes de enfocar el campo inválido, sin perder el contenido ingresado.

La nueva prueba reprodujo el primer fallo antes de corregirlo. Los cálculos financieros, las rutas históricas, la identidad B y los archivos del video aprobado se conservaron. ISO 9241-110 se utiliza como referencia de interacción; no se declara certificación ISO ni conformidad integral WCAG.
