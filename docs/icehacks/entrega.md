# Finansi en IceHacks 2026

[Demo pública](https://alvaro-mendoza-12.github.io/F-nansi-/) · [Repositorio público](https://github.com/Alvaro-mendoza-12/F-nansi-) · [Video MP4 para subir](https://alvaro-mendoza-12.github.io/F-nansi-/docs/icehacks/finansi-demo.mp4)

## Texto para Devpost

**Project name** · Finansi

**Tagline** · Turn a handmade recipe into a price you can explain.

### Inspiration

Small-batch makers often set prices from memory or from a competitor's listing. When the price leaves out labor, packaging or part of a material purchase, a sale can feel successful while the maker earns very little. Finansi gives makers a way to see the costs behind a price before they charge it.

### What it does

A maker enters the materials used, production time, packaging and batch yield. Finansi calculates the cost per unit, recommends a price for a target margin and compares two prices against the same number of sales. The maker chooses a price and saves it with the recipe. The catalog, sales and dashboard stay in the browser and work without an account.

### How it was built

The web app uses HTML, CSS and JavaScript modules on GitHub Pages. IndexedDB stores recipes, chosen prices and sales. A separate arithmetic module tracks costs as exact fractions of a cent and rounds the recommended price up when it falls between cents. When a sale is recorded, it keeps its unit cost so later recipe changes preserve the historical estimate.

### Challenges and learning

Unit conversion changes the real cost of an ingredient. For example, a maker might buy wax in kilograms and consume it in grams. Margin also needs to be calculated from the selling price. Keeping these rules in a separate module made it possible to test the math and use the same results on every screen.

### What works today

A two-unit batch costs S/ 40. Finansi finds S/ 20 per unit and recommends S/ 25 for a 20% margin. At prices of S/ 25 and S/ 30, three sales yield an estimated S/ 15 or S/ 30 in profit. The chosen price and recipe are still available after reload. A sale can be recorded as pending and later marked as collected.

### Current scope and what's next

The interface is in Spanish and uses Peruvian soles. Records are stored in the current browser profile. Export and restore are the next data feature. Inventory, cash management, diagnosis and the assistant are labeled sample screens. The assistant uses scripted replies. Connecting OpenRouter is future work.

### Built with and AI disclosure

HTML, CSS, JavaScript, IndexedDB, GitHub Pages, Node.js and Playwright. OpenAI Codex assisted with design implementation, application code, testing and documentation. The illustrative candle images were made with OpenAI image generation. The pricing engine and profitability explanations use deterministic rules.

### Try it as a judge

Open the live demo and choose **Calcular mi primer precio** to start with your own inputs. On the setup screen, **Abrir la receta de ejemplo** opens a prepared candle recipe you can edit. Compare two prices, explicitly select one, save, reload **Productos** and reopen the recipe. The demo video shows the Spanish interface with English captions.

## Verificación de la demo

```sh
npm ci
npm test
npm run test:e2e
npm run test:e2e -- https://alvaro-mendoza-12.github.io/F-nansi-/
```

| Criterio | Comprobación |
| --- | --- |
| Costo del lote y precio | La receta de aceptación da S/ 40 por lote, S/ 20 por unidad y S/ 25 para 20 % de margen. |
| Comparación y pérdidas | A S/ 25 y B S/ 30 dejan S/ 5 y S/ 10 por unidad. Tres ventas dejan S/ 15 y S/ 30. Un precio de S/ 18 muestra una advertencia. |
| Guardado y edición | Selección explícita, recarga, recuperación de dos materiales y precio B. Cambiar el costo de compra de S/ 24 a S/ 28 lleva el lote a S/ 42 y la unidad a S/ 21. |
| Datos inválidos | Se prueban cero unidades, cantidades negativas, unidades incompatibles, empaque vacío y margen de 100 %. |
| Venta y cobro | Dos unidades a S/ 30 se reflejan como S/ 60 pendientes. Al cobrar, los S/ 60 pasan al indicador de cobros. El historial conserva su costo al borrar el producto. |
| Móvil, escritorio y sitio público | El recorrido automatizado usa Chromium a 390 y 1440 px, comprueba que las pantallas no se desborden y permite usar la misma prueba sobre GitHub Pages. |

En la inspección visual local a 390 px se revisaron las cantidades y costos del editor, el botón **Guardar producto** al desplazar el comparador y el estado del cobro en Ventas e Inicio. Puedes repetirla con las herramientas del navegador. El video recoge el recorrido en escritorio.

## Antes de enviar

- **Cierre**. El domingo 15 de noviembre de 2026 a las 6:00 p. m. PST, que corresponde a las 9:00 p. m. en Bogotá y Lima. [Calendario oficial de Devpost](https://icehacks.devpost.com/details/dates).
- **Video**. Sube el MP4 a YouTube, Vimeo o Youku y pega el enlace público en Devpost. La página principal exige un video de máximo tres minutos. La página de reglas lo presenta como recomendado. Para la entrega se aplica el requisito de la página principal. Incluye también la demo y el repositorio públicos. [Requisitos de envío](https://icehacks.devpost.com/#requirements) · [Reglas de IceHacks](https://icehacks.devpost.com/rules).
- **Elegibilidad**. La página principal enumera estudiantes de 13 años en adelante y las reglas específicas indican estudiantes de secundaria. Confirma con la organización cuál se aplica a tu caso. [Página principal](https://icehacks.devpost.com/) · [Reglas de IceHacks](https://icehacks.devpost.com/rules).
- **Trabajo previo y atribución**. El primer commit del repositorio se registró el 9 de noviembre de 2026 a las 12:47 p. m. en Bogotá, dentro de la ventana oficial. Las reglas específicas prohíben partir de código de aplicación escrito antes del evento. Declara cualquier material o código previo relevante si lo hubo. [Primer commit](https://github.com/Alvaro-mendoza-12/F-nansi-/commit/3b5736a) · [Reglas de IceHacks](https://icehacks.devpost.com/rules).
- **Categorías**. Revisa **Best Design & UX** y **Best Deployed / Shipped App** en el formulario. La descripción de **Best AI Hack** acepta también el uso de herramientas de desarrollo con IA. Algunos créditos de patrocinadores tienen condiciones propias. [Categorías publicadas](https://icehacks.devpost.com/#prizes).
