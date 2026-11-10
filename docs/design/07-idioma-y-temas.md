# Revisión de idioma y temas

La revisión del 10 de noviembre de 2026 corrige dos problemas que quedaban visibles en la portada: EN cambiaba solo parte de la interfaz y el título conservaba un verde oscuro sobre el fondo oscuro.

## Cambios

- Se añadieron 334 traducciones editoriales para completar las 14 pantallas de Finansi: bienvenida, configuración inicial, inicio, productos, receta, calculadora, comparador, ventas, inventario, dinero, diagnóstico, asistente, ajustes y galería. Incluyen textos de ejemplo, respuestas preparadas del asistente, títulos, ayudas, diálogos, etiquetas y atributos accesibles.
- Los textos de las pantallas heredadas se registran una sola vez desde el HTML inicial. Se traducen sus nodos de texto sin reemplazar iconos, enlaces ni énfasis. Los datos que el usuario añade después no se traducen. Los valores internos de las opciones se conservan al cambiar su etiqueta para evitar alterar categorías de negocio guardadas.
- La galería dispone de 24 capturas nuevas en inglés, en móvil y escritorio. Sus imágenes y enlaces PNG cambian con el idioma; las capturas originales en español se conservan. `node scripts/capturar-galeria.mjs` permite regenerar las versiones inglesas con datos ficticios.
- ES/EN y los botones de sol y luna se agrupan en la cabecera. Cada botón indica su estado y tiene nombre accesible y ayuda al pasar el puntero. En móvil la acción de explorar pantallas ocupa una segunda fila para mantener los controles cómodos y legibles.
- El valor inicial del tema es claro, con fondo blanco incluso si el dispositivo prefiere oscuro. El tema oscuro usa fondos neutros, texto claro y acentos verdes del concepto B. Las preferencias explícitas existentes, incluido seguir al dispositivo desde Configuración, se respetan. La cabecera y Configuración comparten la misma preferencia persistente.
- El tema se aplica antes de cargar los estilos. Se corrigieron el color del título de bienvenida, los avisos de cobros pendientes, los encabezados de tabla, el asistente y la galería para que utilicen los colores del tema.

## Verificación local

| Comprobación | Resultado |
| --- | --- |
| Fórmulas y compatibilidad de respaldos | 10 pruebas aprobadas |
| Recorrido de receta, tres métodos, comparación, guardado, ventas y recuperación | Aprobado a 390, 768 y 1440 px |
| Navegación en inglés, teclado y restauración JSON | Aprobado a 390, 768 y 1440 px |
| Todas las pantallas y variantes, ES/EN y claro/oscuro | 160 estados aprobados a 390 y 1440 px, incluidos diálogos de demostración |
| Axe-core 4.10.3, reglas WCAG A/AA | Cero infracciones en esos 160 estados |
| Cabecera compacta | Sin desbordamiento horizontal a 320 px |
| Persistencia | Idioma y tema conservados al recargar; selector y botones sincronizados |
| Datos del usuario | El texto escrito no cambia al traducir; se conservan los valores internos de opciones |
| Consola y red | Sin errores en la revisión completa |

Ejecución: `npm test`, `npm run test:e2e`, `npm run test:navigation` y `npm run test:display`. Para incluir axe se proporciona `FINANSI_AXE` con una copia local válida. `FINANSI_EVIDENCE` configura el directorio de capturas e informes; `test:display` utiliza `output/idioma-tema` si no se indica otro. Los recorridos aceptan una URL pública como argumento y usan perfiles temporales.

[Resultados completos de idioma y contraste](evidencia/idioma-tema/resultados-locales.json).

| Vista | Claro | Oscuro |
| --- | --- | --- |
| Portada en inglés, 1440 px | [Captura](evidencia/idioma-tema/portada-en-light-1440.png) | [Captura](evidencia/idioma-tema/portada-en-dark-1440.png) |
| Portada en inglés, 390 px | [Captura](evidencia/idioma-tema/portada-en-light-390.png) | [Captura](evidencia/idioma-tema/portada-en-dark-390.png) |

Se revisaron visualmente las capturas de la portada en ambos tamaños y temas. La auditoría automática y las pruebas de teclado no acreditan conformidad integral WCAG. Siguen pendientes una revisión con lector de pantalla y sesiones de usabilidad con emprendedores. Los textos impresos dentro de la fotografía del envase son parte de la imagen; los nombres y registros del usuario se conservan como fueron escritos. El video aprobado permanece intacto.

Demo: [Finansi](https://alvaro-mendoza-12.github.io/F-nansi-/).
