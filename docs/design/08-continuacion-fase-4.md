# Continuación de Fase 4

La revisión comenzó en `10cacdd`. La navegación compartida, los tres métodos, las cinco monedas, el cambio de idioma y los temas ya funcionaban. Los cambios se concentraron en accesos que exigían pasos extra y en conservar datos al volver a una receta o comparación.

| Grupo | Decisión |
| --- | --- |
| Principal | Inicio, Productos, Calcular precio y Ventas. Cada destino tiene icono, etiqueta y estado actual. |
| Herramientas | Comparar precios reúne las simulaciones de precio y cantidad. La calculadora y el comparador permiten abrir un producto guardado desde su propia pantalla. |
| Mi negocio | Inventario, Mi dinero, Diagnóstico y Asistente siguen agrupados y marcados como demostraciones. |
| Configuración | Idioma, país y moneda, apariencia, método preferido y exportación/restauración. |
| Ejemplos | La galería conserva un acceso separado. |

En escritorio la barra lateral muestra los grupos. En móvil los cuatro destinos principales quedan en la barra inferior y las opciones secundarias se abren en Más. La vista secundaria actual se indica visualmente y también en la descripción accesible de Más.

| Heurística | Aplicación |
| --- | --- |
| Visibilidad del estado | Destino activo, paso actual y resumen de costo del lote y por unidad junto al formulario móvil. |
| Correspondencia con el mundo real | La receta separa producto, materiales, mano de obra y costos adicionales. Las ayudas distinguen ventas, cobros y ganancia. |
| Control y libertad | Volver a editar conserva los datos del borrador. El usuario elige el precio antes de guardarlo y puede cancelar una restauración. |
| Consistencia | Los mismos nombres y destinos aparecen en móvil y escritorio. La calculadora muestra «Editar receta» cuando el enlace vuelve al borrador. |
| Prevención de errores | Se preserva el precio alternativo que escribió el usuario. Se bloquea cambiar moneda con registros y se indica si una copia usa otra moneda antes de confirmarla. |
| Reconocimiento | Los productos guardados se pueden elegir dentro de la herramienta. Cada método tiene un ejemplo en la moneda correspondiente. |
| Flexibilidad y eficiencia | Se mantiene un método preferido para nuevos cálculos y un acceso directo desde cada herramienta de precios. |
| Diseño minimalista | La cantidad se prueba en el mismo comparador. El resumen móvil muestra dos importes y conserva el desglose en la página. |
| Recuperación de errores | Los errores llevan al campo pendiente. Un enlace inválido permite abrir un producto existente o empezar de nuevo. |
| Ayuda y documentación | Se aclara cómo se calcula la ganancia por unidad y por cantidad junto a los resultados. |

Referencia para la auditoría. [Diez heurísticas de Nielsen Norman Group](https://www.nngroup.com/articles/ten-usability-heuristics/).

Perú (PEN), Estados Unidos (USD), México (MXN), Colombia (COP) y España (EUR) están disponibles en Configuración. Los importes usan `Intl.NumberFormat` según idioma y país. Cada negocio local usa una moneda mientras tenga productos o ventas. Una copia de otra moneda puede reemplazar el conjunto de datos tras confirmación y conserva sus importes y moneda originales. [Especificación de Intl.NumberFormat](https://tc39.es/ecma402/#numberformat-objects).

Con un costo de S/ 20, un margen del 20 % produce S/ 25 y un recargo del 20 % produce S/ 24. Un precio manual de S/ 30 da S/ 10 por unidad, un margen aproximado del 33,33 % y un recargo del 50 %. La ganancia total estimada depende de la cantidad ingresada y de los costos registrados. El método preferido persiste al recargar y el método y precio guardados se conservan.

La verificación se reproduce con `npm test`, `npm run test:e2e`, `npm run test:navigation` y `npm run test:display`. Las pruebas de navegador aceptan la URL de la demo y usan perfiles aislados. Con `FINANSI_AXE` se audita el recorrido financiero y las variantes de idioma y tema. La revisión automática se complementa con pruebas de teclado, validación y recuperación de datos. Quedan pendientes una prueba con emprendedores y una revisión con lector de pantalla.
