# Finansi: sistema de diseño provisional

El sistema se propone para comparar conceptos. Los colores y el tipo final se afinan tras elegir uno. El símbolo es una F abierta con un punto que marca el dato que permite decidir; funciona en un solo color como sello.

| Token | A · Fintech Premium | B · Emprendedor Moderno | C · AI-First |
| --- | --- | --- | --- |
| Lienzo | Niebla #F2F5F9 | Papel #F7F7F0 | Tinta #141223 |
| Superficie | Blanco #FFFFFF | Blanco #FFFFFF | Ciruela #211D35 |
| Texto primario | Tinta #172640 | Bosque #21392F | Marfil #F5F2FF |
| Acción | Verde petróleo #116451 | Bosque #245444 | Lavanda #D2C3FF sobre tinta |
| Acento informativo | Verde agua #E5F2EE | Ámbar pálido #F3E8C8 | Lila #B9A3FF |
| Advertencia | Texto oscuro sobre ámbar claro | Texto oscuro sobre ámbar claro | Ámbar claro sobre ciruela |

**Tipografía.** Manrope para titulares y cifras principales; Inter para texto, navegación y datos. B prueba Fraunces solo en el saludo y el saldo editorial. Cifras con ancho tabular donde se comparan; soles en formato local (S/ 3,480.00). Escala orientativa: 12 px para ayudas breves, 14 para interfaz, 16 para contenido, 20/24 para títulos de sección, 28/36 para títulos y 36/48 para el importe principal según ancho. Altura de línea 1.45–1.6 en texto.

**Composición.** Base de 4 px: 4, 8, 12, 16, 20, 24, 32 y 40. Márgenes de 16–20 en teléfono y 32–40 en escritorio. Radios de 8–12 para controles y 14–20 para paneles. Bordes de 1 px para separar áreas; sombras suaves en la galería y superficies elevadas cuando expresen jerarquía. Contenido principal alineado a la izquierda; cantidades comparables alineadas a la derecha en tablas.

| Componente | Regla |
| --- | --- |
| Botón y enlace | Verbo y objeto (“Revisar precio”); un primario por área. Foco con contorno visible. Meta táctil de 44 × 44 px. |
| Campos | Etiqueta persistente, unidad junto al campo, ejemplo breve y error debajo. Ayuda contextual al distinguir margen de recargo. El avance de pasos conserva valores. |
| Indicador y tarjeta | Nombre, importe, período y definición cuando haya ambigüedad. “Dinero disponible” representa caja registrada; “Ganancia estimada” excluye aportes y retiros. |
| Tabla y lista | Encabezados semánticos, importes alineados, estado con texto. Pasar a lista etiquetada en móvil cuando la comparación horizontal no sea necesaria. |
| Gráficos | Dos series como máximo en el resumen; leyenda, escala en soles y marcas diferenciables además del color. Dar datos en tabla. No sugerir causalidad con una tendencia. |
| Navegación | Estado actual por color y forma; en móvil, acceso táctil a Inicio, Productos, Ventas y Más. Mantener detalle alcanzable con teclado. |
| Asistente y diagnóstico | Etiqueta visible de explicación, datos utilizados y su fecha, recomendación concreta, fuente interna y enlace a revisar. Mostrar falta de datos o incertidumbre de forma explícita. |
| Carga, vacío y error | Conservar el espacio de la información, explicar el estado con texto y dar una acción. Evitar movimiento obligatorio. Tras error, el foco va al mensaje y los valores se conservan. |

**Accesibilidad objetivo.** [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/): 4.5:1 para texto normal, 3:1 para texto grande y para indicadores visuales relevantes; no depender del color, mantener foco visible, permitir reflujo y dar una alternativa textual a gráficos. La maqueta ofrece navegación por teclado y tabla de datos. La evaluación manual con usuarios y lector de pantalla queda para el diseño aprobado; no se declara conformidad del producto.
