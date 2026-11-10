# Finansi en IceHacks 2026

[Aplicación pública](https://alvaro-mendoza-12.github.io/F-nansi-/) · [Repositorio público](https://github.com/Alvaro-mendoza-12/F-nansi-) · [Video aprobado de 2:18](https://alvaro-mendoza-12.github.io/F-nansi-/docs/icehacks/finansi-demo.mp4?v=3) · [Auditoría final](../design/09-auditoria-final.md)

## Texto para Devpost

**Project name** · Finansi

**Tagline** · Turn a handmade recipe into a price you can explain.

### Inspiration

Small-batch makers often set prices from memory or from a competitor’s listing. Leaving out part of a material purchase, labor or packaging makes it hard to tell what a sale actually earns. Finansi gives makers a way to see those costs before they choose a price.

### What it does

Enter the materials, labor, packaging and yield for a batch. Finansi calculates cost per unit and lets you try a target margin, a markup on cost or a price you set yourself. Compare two prices at the same sales quantity, then save the recipe and the price you choose. You can record a sale, mark a pending payment as collected and see your totals on Home. A sample candle recipe is available to edit and calculate before creating your own.

### How it was built

The static site runs on GitHub Pages using HTML, CSS and JavaScript modules. The pricing engine represents costs as exact fractions of a cent and rounds derived prices up to the next cent when needed. IndexedDB stores business data, products and sales locally. Each sale stores the unit cost recorded at the time, so editing a recipe later preserves the historical profit estimate. Settings store language, appearance and preferred pricing method in the browser. Validated JSON backups can move the business data to another browser.

### Challenges and learning

Buying materials in kilograms and using them in grams requires a unit conversion before pricing. We kept that calculation in one module and verified it separately from the interface. We also learned that a 20% margin and a 20% markup produce different prices, so the interface shows both with clear labels and examples.

### What works today

A two-unit batch with S/ 12 and S/ 8 of materials, S/ 15 of labor and S/ 5 of packaging costs S/ 40. The unit cost is S/ 20. A 20% margin gives S/ 25, a 20% markup gives S/ 24, and a manual price of S/ 30 gives an estimated S/ 10 per unit. A new user can calculate, compare, save, reload and then record a sale. The interface supports Spanish and English, light and dark themes, and five currencies (PEN, USD, MXN, COP and EUR).

### Scope and what’s next

The app runs without an account. Records live in the current browser profile and can be exported and restored as JSON. A business uses one currency for its saved records. Estimated profit reflects the costs entered, so it may exclude expenses the maker has yet to record. The next priorities are observing first-time makers using the app and reviewing the journey with a screen reader.

### Built with and AI disclosure

HTML, CSS, JavaScript, IndexedDB, `Intl.NumberFormat`, GitHub Pages, Node.js and Playwright. ChatGPT helped organize requirements. OpenAI Codex assisted with implementation, testing and documentation. OpenAI image generation produced the illustrative candle images. Kokoro generated the English voiceover locally. FFmpeg was used to assemble the video. The pricing engine runs deterministic arithmetic in the browser.

### Try it as a judge

Open the public app. Choose **Calculate my first price** to use your own figures or **Try a sample recipe** to practice with an editable candle recipe. Pick a price in the comparison, save it and reopen the product from Products. Then record a sale. The approved video shows the same core workflow in an earlier interface revision with English narration. The records shown in the video were entered for the recording.

## Publicación del video

1. Usa el [MP4 aprobado](finansi-demo.mp4) de **2:18**. En YouTube Studio elige **Crear**, **Subir vídeos** y selecciona el archivo. En **Visibilidad** elige **Público** y publica. También puedes subirlo a Vimeo o Youku y elegir acceso público. [Instrucciones de YouTube](https://support.google.com/youtube/answer/57407) · [Requisitos de IceHacks](https://icehacks.devpost.com/#requirements)
2. Abre el enlace del reproductor en una ventana privada. Comprueba que inicia sin iniciar sesión y que el audio y los subtítulos se reproducen. Usa ese enlace en Devpost. El enlace al MP4 de GitHub Pages sirve para descargar el archivo.

## Originalidad y atribuciones

El primer commit de este repositorio es del 9 de noviembre de 2026 a las 12:47 p. m. en Bogotá, dentro del período oficial del 8 al 15 de noviembre. La revisión del historial cubre el repositorio y sus fechas registradas. El equipo debe confirmar si hubo trabajo fuera del repositorio, declarar las contribuciones de IA y atribuir herramientas, fuentes e insumos externos. Las reglas permiten herramientas y bibliotecas de código abierto, y prohíben partir de una aplicación escrita antes del evento. [Primer commit](https://github.com/Alvaro-mendoza-12/F-nansi-/commit/3b5736a) · [Reglas oficiales](https://icehacks.devpost.com/rules) · [Fuentes y licencias](../design/prototipo/fonts/) · [Créditos del video](produccion-video.md)

## Checklist de envío

- [ ] Confirmar elegibilidad e inscripción. La portada anuncia 13+ y las reglas específicas hablan de estudiantes de secundaria. El equipo debe aclarar con la organización cualquier caso dudoso. [Portada](https://icehacks.devpost.com/) · [Reglas](https://icehacks.devpost.com/rules)
- [ ] Subir el video aprobado a YouTube, Vimeo o Youku como público y comprobarlo sin sesión. La portada del evento exige el enlace, aunque la página de reglas describe el video como recomendado. [Requisitos](https://icehacks.devpost.com/#requirements)
- [ ] Pegar el texto, tecnologías, contribuciones de IA, enlaces de la aplicación y repositorio. Confirmar originalidad y elegir las categorías que apliquen en el formulario.
- [ ] Revisar la vista previa y enviar manualmente antes del **15 de noviembre de 2026 a las 9:00 p. m. en Bogotá** (6:00 p. m. PST). Guardar la confirmación. [Calendario oficial](https://icehacks.devpost.com/details/dates)
