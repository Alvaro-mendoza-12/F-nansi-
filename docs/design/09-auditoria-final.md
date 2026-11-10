# Auditoría final de Finansi

La revisión partió de `40d77e3` en `main`. El README, las rutas y sus módulos JavaScript permitieron distinguir las operaciones que leían y escribían IndexedDB de las vistas con cifras fijas, filtros locales y respuestas preparadas. La línea base aprobó las diez pruebas unitarias y los tres recorridos de navegador vigentes en ese commit.

| Superficie | Resultado de la auditoría |
| --- | --- |
| Portada | Finansi abre directamente en la raíz con su título y descripción. Los accesos llevan al primer cálculo, a Inicio o a una receta editable. |
| Principal | Inicio, Productos, Calcular precio y Ventas operan sobre registros locales. Ventas guía a crear un producto cuando todavía no hay ninguno. |
| Herramientas | Comparar precios abre un producto guardado o permite seguir el flujo desde la calculadora. Los dos escenarios usan la misma cantidad. |
| Configuración | Idioma, tema, método preferido, país/moneda y copias JSON con validación y confirmación. |
| Simulaciones retiradas | Inventario, Mi dinero, Diagnóstico, Asistente, galería y vistas de ventas, catálogo e Inicio con datos fijos. Las rutas antiguas abren pantallas funcionales. |
| Evidencia histórica | Capturas y commits conservados. El MP4 aprobado conserva sus bytes originales. |

## Interacción y accesibilidad

| Heurística | Comprobación |
| --- | --- |
| 1. Visibilidad del estado | Destino actual, paso de receta, resumen de costos y estados de ventas y cobros. |
| 2. Correspondencia con el mundo real | Materiales, trabajo, empaque y unidades producidas. Margen y recargo se explican por separado. |
| 3. Control y libertad | El borrador conserva cambios al retroceder. Guardar requiere elegir un precio. Restaurar y eliminar se pueden cancelar. |
| 4. Consistencia | Los mismos cuatro destinos principales en escritorio y móvil. Etiquetas de acciones y formularios en ES/EN. |
| 5. Prevención de errores | Entradas inválidas se rechazan, los precios por debajo del costo muestran advertencia y la moneda se protege con registros existentes. |
| 6. Reconocimiento | Iconos con etiquetas, nombres de productos en el selector y ejemplos junto a los métodos de cálculo. |
| 7. Flexibilidad y eficiencia | Preferencia de cálculo y acceso directo al producto desde la calculadora y el comparador. |
| 8. Diseño minimalista | La portada muestra el núcleo del producto y Más contiene solo la comparación y la configuración. |
| 9. Recuperación de errores | Campos inválidos identificados, copias inválidas rechazadas y estados vacíos con una acción para avanzar. |
| 10. Ayuda y documentación | Definiciones de margen, recargo, cobro y ganancia junto a los datos. Explicación de almacenamiento y copias en Configuración. |

Se usaron como referencia las [heurísticas de Nielsen](https://www.nngroup.com/articles/ten-usability-heuristics/) y [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/). Las comprobaciones automatizadas y de teclado cubren los estados recorridos. Quedan pendientes la evaluación con lector de pantalla y las sesiones de usabilidad con emprendedores.

## Verificación reproducible

| Comando | Cobertura |
| --- | --- |
| `npm test` | Diez pruebas de costo, precio, recargo, margen, pérdidas, precisión y compatibilidad de copias. |
| `npm run test:e2e` | Usuario nuevo, plantilla editable sin registros, cantidades inválidas, tres métodos, guardado, recarga, edición, venta y cobro. Verifica que el costo histórico permanece al editar y eliminar la receta. Prueba las rutas retiradas y el estado vacío. |
| `npm run test:navigation` | Teclado, recorrido en inglés, venta en tema oscuro, formato de las cinco monedas, preferencia, validación, exportación y restauración JSON. |
| `npm run test:display` | Portada y rutas funcionales, navegación y enlaces, contenido localizado, estados vacíos, tema claro y oscuro, consola, red y axe. |

Los recorridos se ejecutan a 390, 768 y 1440 px en perfiles limpios. Los tres comandos de navegador aceptan la URL pública de Finansi. `FINANSI_AXE` habilita axe-core y `FINANSI_EVIDENCE` guarda informes y capturas. El video de 2:18 se conserva con SHA-256 `8dba1a12bdc1d4b756119edc85a2ef90d3cfc0525aebbbb63073f12b2c4cbd99`.

La ejecución local pasó las diez pruebas unitarias y los tres recorridos. Axe no reportó infracciones en 192 comprobaciones (156 de idioma, tema y diseño adaptable, 17 del recorrido principal y 19 de navegación). La revisión corrigió el contraste del botón de restauración en modo oscuro y una solicitud de favicon inexistente al abrir las rutas antiguas.

El alcance final cubre una moneda por negocio, almacenamiento local, copias JSON y ganancia bruta estimada con los costos ingresados. La plantilla editable usa PEN. El [paquete de IceHacks](../icehacks/entrega.md) contiene el texto para Devpost, las atribuciones y el checklist de publicación manual.
