# Evidencia de Fase 4

Revisión del 10 de noviembre de 2026. Base funcional: commit `c74039f` (navegación agrupada y tres métodos de cálculo). Esta revisión corrige la continuidad del borrador desde los menús y completa las comprobaciones de aceptación. Se conserva el concepto B y el video aprobado.

## Resultado local

Entorno: Node.js, Playwright Core 1.65.0, Google Chrome 157.0.8103.39 y axe-core 4.10.3. Cada recorrido usa un contexto de navegador nuevo. Los productos de prueba solo existen en el almacenamiento de ese contexto; no se envían registros a un servidor.

| Comprobación | Resultado |
| --- | --- |
| Motor financiero y copias v1/v2 | 10 pruebas aprobadas |
| A: costo 20, margen 20 % | Precio 25; ganancia 5 |
| B: costo 20, recargo 20 % | Precio 24; ganancia 4 |
| C: costo 20, precio manual 30 | Ganancia 10; margen 33,33 %; recargo 50 % |
| D: preferencia al recargar | Conservada; aplicada a nuevas recetas |
| E: cambio de preferencia | Producto anterior conserva método y precio |
| F: recorrido responsive | Aprobado a 390, 768 y 1440 px |
| G: idiomas | Flujo principal en ES; creación → recuperación en EN |
| Ayudas, errores y pérdidas | Ejemplos junto al método; errores asociados al campo; advertencia bajo el costo |
| Teclado | Tab, Enter, Espacio y Escape; retorno de foco y controles recorridos visibles |
| Copia JSON | Exportación, cancelación y restauración confirmada conservan método y precio |
| Accesibilidad automatizada | 29 estados auditados; cero infracciones en las reglas WCAG ejecutadas |
| Consola, JavaScript y HTTP | Sin errores en los recorridos |

Informes generados por las pruebas: [recorrido principal](recorrido-local.json) y [navegación en inglés](navegacion-local.json). Contienen tamaños, comprobaciones y resultados de axe por estado. Las direcciones `127.0.0.1` identifican los servidores temporales usados en esas ejecuciones.

## Capturas

| Estado | 390 px | 1440 px |
| --- | --- | --- |
| Calculadora en español | [Ver captura](precio-390.png) | [Ver captura](precio-1440.png) |
| Comparador en inglés | [Ver captura](comparacion-en-390.png) | [Ver captura](comparacion-en-1440.png) |
| Preferencias en tema oscuro | [Ver captura](preferencias-390.png) | [Ver captura](preferencias-1440.png) |

Se revisaron visualmente las capturas. No existe una base equivalente para comparar automáticamente estas pantallas: regresión visual **inconclusa**. Las barras fijas de las capturas de página completa aparecen en la posición del viewport durante la toma; las pruebas de teclado comprueban por separado que el control enfocado esté visible.

## Reproducción

```powershell
npm.cmd ci
npm.cmd test
# Proporciona una copia local de axe-core para incluir la auditoría automática.
$env:FINANSI_AXE = 'D:\finansi\output\axe.min.js'
$env:FINANSI_EVIDENCE = 'D:\finansi\output\fase4-revision'
npm.cmd run test:e2e
npm.cmd run test:navigation
```

Ambos comandos de navegador aceptan como argumento `https://alvaro-mendoza-12.github.io/F-nansi-/`. Los informes se escriben únicamente si termina la ejecución completa. Sin `FINANSI_AXE` no se ejecuta axe y no debe interpretarse el recorrido como una auditoría automática de accesibilidad.

## Alcance y pendientes

WCAG 2.2 AA es el objetivo de revisión. Axe y el recorrido de teclado no acreditan conformidad completa. Quedan pendientes lector de pantalla, pruebas de usabilidad con emprendedores y una base de regresión visual equivalente. ISO 9241-110 se usa como referencia, sin afirmar certificación.

Las preferencias son del navegador y no forman parte de la copia del negocio. Los datos requieren exportación para trasladarse a otro dispositivo. Las traducciones pendientes de las demostraciones se completaron en la [revisión posterior de idioma y temas](../../07-idioma-y-temas.md). Inventario, Mi dinero, Diagnóstico y Asistente siguen identificados como demostraciones.

La investigación, fórmulas, estructura de navegación y evaluación de las diez heurísticas se encuentran en el [informe de Fase 4](../../06-fase-4-navegacion-y-precios.md).

## Verificación pública

La [demo pública de Finansi](https://alvaro-mendoza-12.github.io/F-nansi-/) superó los mismos dos recorridos a 390, 768 y 1440 px, con cero infracciones en los 29 estados auditados. Se verificaron 21 archivos HTML, JavaScript y CSS: todos respondieron HTTP 200 y sus hashes SHA-256 coincidieron con el código funcional del commit [`ebb8679`](https://github.com/Alvaro-mendoza-12/F-nansi-/commit/ebb867945849c08012fe62e5c4d805098a66fab1), normalizando únicamente finales de línea. GitHub confirmó el [despliegue satisfactorio de ese commit](https://github.com/Alvaro-mendoza-12/F-nansi-/actions/runs/42821391336).

Evidencia obtenida sobre la URL pública: [publicación y hashes](publicacion.json), [recorrido principal](recorrido-publico.json) y [navegación en inglés](navegacion-publica.json). El commit posterior que registra estos resultados solo añade documentación y evidencia; no modifica el código auditado.
