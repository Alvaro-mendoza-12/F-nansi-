# Finansi

Finansi ayuda a quienes fabrican en lotes pequeños a calcular lo que cuesta producir cada unidad, probar precios de venta y guardar el precio que elijan. La aplicación conserva el concepto visual **B · Emprendedor Moderno**.

[Probar Finansi en GitHub Pages](https://alvaro-mendoza-12.github.io/F-nansi-/) · [Video narrado en inglés](https://alvaro-mendoza-12.github.io/F-nansi-/docs/icehacks/finansi-demo.mp4?v=3) · [Entrega para IceHacks](docs/icehacks/entrega.md)

## Prueba de tres minutos

1. Abre la demo y elige **Calcular mi primer precio**. Ponle nombre al negocio y crea un producto de 2 unidades por lote.
2. Añade dos materiales con costos consumidos de S/ 12 y S/ 8. Puedes usar una unidad comprada y consumida por material. En **Trabajo**, registra 60 minutos a S/ 15 la hora y S/ 5 de empaques.
3. Abre **Ver costo y precio**. El lote cuesta S/ 40 y cada unidad cuesta S/ 20. Prueba un margen de 20 % para obtener S/ 25, un recargo de 20 % para obtener S/ 24 o evalúa un precio manual de S/ 30.
4. Compara S/ 25 y S/ 30 con 3 ventas. Quedan S/ 5 o S/ 10 por unidad. Elige **Precio B** y pulsa **Guardar producto**.
5. Recarga **Productos** y abre la receta guardada. Puedes editarla o eliminarla con confirmación. Desde **Ventas** puedes registrar una venta y reflejar el cobro en **Inicio**.

Para empezar con datos ya cargados, elige **Abrir la receta de ejemplo** en la pantalla de configuración. Las vistas ficticias de Taller Bruma están separadas de tus registros. La copia editable solo se añade a tu catálogo si confirmas un precio y la guardas.

## Alcance

- Las recetas incluyen cantidades compradas y consumidas, unidades compatibles, mano de obra, empaques y otros gastos del lote.
- JavaScript calcula los costos, márgenes, recargos y ganancias con fracciones exactas de céntimo. Redondea los importes al mostrarlos y los precios derivados por margen o recargo hacia arriba al céntimo.
- IndexedDB guarda negocio, catálogo y ventas en transacciones del navegador. Cada venta conserva el costo por unidad de su receta al registrarla. Inicio distingue ventas registradas, cobros, pendientes y ganancia bruta estimada.
- Los datos pertenecen al perfil y al sitio donde se guardaron. En **Configuración** puedes elegir idioma, país y moneda, apariencia y método de cálculo. Desde allí puedes descargar y restaurar copias JSON del negocio, el catálogo y las ventas. La moneda queda fija mientras haya productos o ventas guardados.
- Inventario, Mi dinero, Diagnóstico y el Asistente Finansi muestran ejemplos de Taller Bruma. La conversación del asistente tiene respuestas preparadas. OpenRouter queda para una fase posterior.

Codex ayudó a implementar y probar el MVP. Las imágenes ilustrativas se generaron con OpenAI y la voz en inglés del video se sintetizó localmente con Kokoro. El motor de costos y las explicaciones del comparador usan reglas deterministas. [Guion en español](docs/icehacks/guion-es.md) · [Subtítulos en inglés](docs/icehacks/finansi-en.srt) · [Materiales de edición](docs/icehacks/produccion-video.md).

## Desarrollo y pruebas

Necesitas Node.js 20 o superior y npm. El sitio usa HTML, CSS y JavaScript sin paso de compilación.

```sh
npm ci
npm run dev
```

Abre [la demo local](http://127.0.0.1:4173/). Para las pruebas en navegador, usa Google Chrome instalado, configura `FINANSI_CHROME` con la ruta a otro ejecutable Chromium o instala Chromium con `npx playwright-core install chromium`.

```sh
npm test
npm run test:e2e
npm run test:navigation
npm run test:e2e -- https://alvaro-mendoza-12.github.io/F-nansi-/
npm run test:navigation -- https://alvaro-mendoza-12.github.io/F-nansi-/
```

Las pruebas de navegador usan perfiles temporales. En PowerShell puedes usar `npm.cmd` y `npx.cmd`.

El recorrido de navegación comprueba también el flujo completo en inglés, el teclado, la continuidad del borrador desde el menú y la exportación/restauración sin sustituir precios ni métodos históricos. Para auditar accesibilidad, configura `FINANSI_AXE` con una copia local de `axe.min.js`; sin esa variable, axe se omite. `FINANSI_EVIDENCE` guarda capturas y resultados JSON. [Evidencia y límites de la revisión de Fase 4](docs/design/evidencia/fase4/README.md).

## Investigación y diseño

- [Mercado peruano y siete plataformas comparadas](docs/research/01-mercado-y-competencia.md).
- [Referencias de UX, interfaz y accesibilidad](docs/research/02-ux-ui.md).
- [Diferenciación y alcance del MVP](docs/research/03-diferenciacion-y-mvp.md).
- [Arquitectura y flujos](docs/design/01-arquitectura-y-flujos.md).
- [Navegación, métodos de cálculo y verificación de Fase 4](docs/design/06-fase-4-navegacion-y-precios.md).
- [Sistema visual](docs/design/03-sistema-de-diseno.md) y [caso de Taller Bruma](docs/design/04-caso-demo.md).
- [Prototipo aprobado de Fase 1](https://github.com/Alvaro-mendoza-12/F-nansi-/tree/d821aee/docs/design/finansi) y [sus 24 capturas](docs/design/05-prototipo-b.md).

Las fuentes Inter, Manrope y Fraunces se distribuyen con sus [licencias](docs/design/prototipo/fonts/).
