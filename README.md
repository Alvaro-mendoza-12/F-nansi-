# Finansi

Finansi ayuda a pequeños productores a calcular cuánto les cuesta fabricar un lote, comparar precios y elegir cuánto cobrar. Puedes guardar recetas, registrar ventas y consultar los cobros pendientes desde el mismo navegador. El diseño usa el concepto **B · Emprendedor Moderno**.

[Aplicación pública](https://alvaro-mendoza-12.github.io/F-nansi-/) · [Repositorio](https://github.com/Alvaro-mendoza-12/F-nansi-) · [Video aprobado de 2:18](https://alvaro-mendoza-12.github.io/F-nansi-/docs/icehacks/finansi-demo.mp4?v=3) · [Entrega para IceHacks](docs/icehacks/entrega.md)

## Primer recorrido

1. Elige **Calcular mi primer precio**, ponle nombre a tu negocio y crea un producto de dos unidades por lote.
2. Añade materiales por S/ 12 y S/ 8. Registra 60 minutos a S/ 15 por hora y S/ 5 de empaque. El lote cuesta S/ 40 y cada unidad S/ 20.
3. Prueba un margen del 20 % para obtener S/ 25, un recargo del 20 % para obtener S/ 24 o un precio manual de S/ 30 para ver una ganancia de S/ 10 por unidad.
4. Compara dos precios, elige uno y guarda el producto. Recarga **Productos** para recuperarlo y registra una venta desde **Ventas**.

**Probar con una receta de ejemplo** abre una vela editable en PEN con el mismo motor de cálculo. La receta solo entra en tu catálogo cuando eliges un precio y la guardas.

## Funciones y límites

- **Inicio** muestra ventas registradas, cobros, pendientes y ganancia bruta estimada a partir de tus registros. **Productos** permite crear, editar y eliminar recetas con confirmación.
- **Calcular precio** incluye materiales, cantidades compradas y usadas, mano de obra, empaque, otros gastos y unidades producidas. **Comparar precios** evalúa dos precios, una cantidad de ventas y advierte cuando el precio queda por debajo del costo.
- **Ventas** registra cobros recibidos y pendientes. Cada venta conserva el costo unitario del momento en que la registraste, incluso si luego editas o eliminas la receta.
- **Configuración** permite elegir ES/EN, tema claro u oscuro, método preferido y país/moneda. Se admiten Perú (PEN), Estados Unidos (USD), México (MXN), Colombia (COP) y España (EUR). El negocio conserva su moneda mientras tenga productos o ventas. Restaurar una copia de otra moneda reemplaza los datos tras confirmación y conserva los importes de la copia.
- **Datos locales.** Tu información se guarda en este navegador. Exporta una copia JSON para trasladarla o protegerla. La ganancia estimada usa los costos registrados. El alcance cubre precios y ventas, con almacenamiento por navegador y una moneda por negocio.

## Arquitectura y herramientas

HTML, CSS y módulos JavaScript se sirven en GitHub Pages sin compilación. [El motor de precios](docs/design/finansi/mvp/precios.js) conserva costos como fracciones exactas de céntimo. [La capa de almacenamiento](docs/design/finansi/mvp/almacen.js) usa transacciones de IndexedDB. [El módulo de respaldos](docs/design/finansi/mvp/respaldo.js) valida las copias antes de restaurarlas. `Intl.NumberFormat` da formato a los importes y `localStorage` guarda las preferencias de la interfaz.

ChatGPT ayudó a organizar requisitos. OpenAI Codex asistió en la implementación, pruebas y documentación. Las ilustraciones se generaron con OpenAI y la narración inglesa con Kokoro de forma local. FFmpeg se usó para producir el video. El cálculo financiero se ejecuta mediante reglas deterministas en el navegador. [Créditos y materiales del video](docs/icehacks/produccion-video.md)

## Desarrollo y pruebas

Con Node.js 20 o superior, ejecuta `npm ci` y `npm run dev`. Abre [Finansi local](http://127.0.0.1:4173/). Las pruebas de navegador usan Chrome o Chromium. Puedes indicar su ruta con `FINANSI_CHROME`. Usa `FINANSI_AXE` para pasar la ruta de `axe.min.js` y `FINANSI_EVIDENCE` para guardar capturas e informes.

```sh
npm test
npm run test:e2e
npm run test:navigation
npm run test:display
```

Los tres comandos de navegador aceptan `-- https://alvaro-mendoza-12.github.io/F-nansi-/` para repetir el recorrido público en perfiles aislados. En PowerShell se puede usar `npm.cmd`. [Auditoría final](docs/design/09-auditoria-final.md)

Las [capturas históricas](docs/design/05-prototipo-b.md), el [prototipo original](https://github.com/Alvaro-mendoza-12/F-nansi-/tree/d821aee/docs/design/finansi) y la [investigación](docs/research/01-mercado-y-competencia.md) documentan el proceso de diseño. Las fuentes Inter, Manrope y Fraunces incluyen sus [licencias](docs/design/prototipo/fonts/).
