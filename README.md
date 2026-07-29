# Cancionero digital

Dos piezas que funcionan por separado y se comunican por un solo archivo:

- **`index.html`** — la web pública: índice de canciones, vista de diapositivas para proyectar y pantalla de lectura.
- **`editor.html`** — la herramienta local para escribir las letras y generar el archivo de datos.

El puente entre las dos es **`js/data/canciones.js`**. Actualizar el repertorio consiste
en exportarlo desde el editor y subirlo a GitHub encima del antiguo. Nada más cambia.

```
cancionero/
├── index.html              La app: índice + diapositivas
├── editor.html             El editor (se abre en local, no hace falta subirlo)
├── css/
│   ├── app.css             Estilos del índice y del visor
│   ├── backgrounds.css     Los 35 fondos animados
│   └── editor.css          Estilos del editor
├── js/
│   ├── config.js           Ajustes (fondos, límites, comportamiento)
│   ├── app.js              Lógica del índice y del visor
│   ├── editor.js           Lógica del editor
│   └── data/
│       └── canciones.js    ← EL ÚNICO ARCHIVO QUE SE SUSTITUYE
└── media/
    ├── imagenes/           fondo-01.jpg … fondo-35.jpg (opcional)
    └── videos/             fondo-01.mp4 … fondo-35.mp4 (opcional)
```

---

## Puesta en marcha

**En local:** abre `index.html` con doble clic. Funciona sin servidor.
**En GitHub Pages:** sube la carpeta al repositorio y activa Pages sobre la rama principal.

> Los datos van en un `.js` y no en un `.json` a propósito: `fetch()` está bloqueado
> bajo el protocolo `file://`, así que un `.json` no se podría leer al abrir la web
> con doble clic. Un `.js` cargado con `<script>` funciona en los dos sitios.

---

## Flujo de trabajo con las letras

1. Abre `editor.html` en el navegador (doble clic, en tu ordenador).
2. Pulsa **Importar canciones** y carga el `js/data/canciones.js` actual, para partir de lo ya publicado.
3. Escribe o pega las letras.
4. Pulsa **Revisar** para ver avisos (canciones sin título, estrofas demasiado largas, títulos repetidos).
5. Pulsa **Exportar canciones.js** y sustituye con él `js/data/canciones.js` en GitHub.

El editor guarda un borrador automático en el navegador cada pocos segundos y lo
recupera al volver a abrirlo. Aun así, **la copia buena es el archivo exportado**:
el borrador vive en ese navegador y ese ordenador, y no en ningún otro sitio.

### La tabla

350 filas: la primera es la cabecera y las otras 349 son las canciones.
24 columnas:

| Columna | Contenido |
|---------|-----------|
| A | Título |
| B – W | Diapositiva 1 … Diapositiva 22 |
| X | TIPO — `1` Dominical · `2` Santa Cena · `3` Ambas |

**La columna TIPO no se edita.** Llega del archivo de datos y se conserva tal cual,
para que una tanda de correcciones de letras no cambie por descuido en qué culto se
canta algo. Si de verdad hay que tocarla, activa **Editar TIPO** en la barra superior.

### Formas de meter una letra

- **Escribir en la celda.** Cada celda admite varias líneas: `Intro` hace salto de línea dentro de la estrofa.
- **Pegar la letra entera.** Pulsa `⋯` en la fila, luego **Pegar letra y repartirla**. Se trocea por
  línea en blanco, cada N líneas o por una marca `---`. Si salen más de 22 bloques, avisa y une el sobrante en la última.
- **Pegar desde Excel o Google Sheets.** Si el texto copiado lleva tabuladores, se reparte por celdas
  a partir de donde estés. Si no los lleva, entra entero en la celda: así una letra con saltos de línea
  no se desparrama por la fila.

### Atajos del editor

`Intro` en el buscador salta a la siguiente coincidencia · `Esc` sale de la celda o cierra el panel

---

## Fondos

Al abrir una canción se sortea un fondo, y no cambia mientras se pasan sus diapositivas:
cada canción tiene su ambiente. Se recuerdan los últimos usados para que en un culto de
seis canciones no se repita ninguno.

Todo se controla en `js/config.js`:

```js
fondos: {
  estrategia: 'css',           // 'css' | 'imagen' | 'video' | 'mixto'
  pesos: { css: 60, imagen: 30, video: 10 },   // solo para 'mixto'
  totalCss: 35,
  memoriaSinRepetir: 10
}
```

**Fondos CSS (35).** Están en `css/backgrounds.css`, uno por clase `.fondo--01` … `.fondo--35`.
No descargan nada y funcionan sin conexión. Para añadir el 36: escribe la regla y sube `totalCss` a 36.

**Imágenes y vídeos.** Deja los archivos con estos nombres exactos y ya funcionan:

```
media/imagenes/fondo-01.jpg … fondo-35.jpg
media/videos/fondo-01.mp4   … fondo-35.mp4
```

Debajo siempre se pinta antes un fondo CSS, y la imagen o el vídeo solo aparece cuando ha
cargado. Si un archivo falta o tarda más de lo previsto, se queda el fondo CSS: nunca se ve
una pantalla negra esperando.

Para vídeo, formato **MP4 (H.264)**, sin audio, de menos de 20 s en bucle y unos 6–10 MB.
Más peso que eso y el primer arranque en la proyección se nota.

---

## El índice

La lista sale **ordenada alfabéticamente** por título, con las reglas del español: las
tildes no cuentan y la ñ va detrás de la n. El número de la izquierda sigue siendo el del
archivo de datos, ordene como ordene la lista: es el que usan los enlaces y el editor.
Para volver al orden por número, cambia `indice.orden` a `'numero'` en `js/config.js`.

El **buscador mira el título y también dentro de las estrofas**. Cuando la coincidencia
está en la letra y no en el título, debajo del título aparece la línea donde cae y en qué
diapositiva está, para que se vea por qué ha salido ese resultado. Dentro de las letras
solo busca a partir de tres caracteres (`indice.minCaracteresLetra`): con menos, media
lista coincidiría y el resultado no diría nada.

Cada fila tiene dos acciones: pulsar la canción la **proyecta**, y el botón **Letra**
lleva a leerla sin encender nada.

---

## Proyectar

Al pulsar una canción se abre a pantalla completa, en horizontal.

| Acción | Cómo |
|--------|------|
| Pasar diapositiva | Flechas de la pantalla · `→` `←` · `Espacio` · `AvPág` `RePág` · deslizar el dedo |
| Primera / última | `Inicio` / `Fin` |
| Leer la letra completa | Botón **Letra completa** · tecla `L` |
| Pantalla en negro | `B` o `.` |
| Pantalla completa | `F` |
| Volver al índice | `Esc` |

**Las diapositivas van en bucle.** De la última, la flecha de siguiente vuelve a la
primera; de la primera, la de anterior salta a la última. Así ninguna flecha se queda
muerta al repetir un coro. Se desactiva con `visor.cicloDiapositivas: false`.

**Al abrir la canción las dos flechas parpadean** unas cuantas veces para que se vea dónde
están, y solo cuando terminan empieza a contar el tiempo que lo esconde todo: el guiño
nunca se corta a la mitad. Un clic o una tecla lo cortan antes, porque ya se han
encontrado. Se ajusta en `visor.parpadeoInicial` (`repeticiones: 0` lo desactiva).

Después, las flechas y la barra superior se desvanecen tras unos segundos sin actividad y
vuelven al mover el ratón. El tiempo se ajusta en `visor.ocultarControlesTrasMs`.

El tamaño de la letra se calcula para cada estrofa contra el alto real de la pantalla: una
estrofa de dos líneas se ve enorme y una de ocho encoge lo justo. Nunca queda texto cortado.

En móvil en vertical aparece un aviso para girar el dispositivo. En Android se intenta
bloquear la orientación; iOS no lo permite y el aviso se queda como recordatorio.

---

## Leer la letra completa

Es una **pantalla aparte, no una diapositiva grande**. Al entrar se sale de pantalla
completa, no hay flechas y el texto se recorre con la rueda, la barra espaciadora o el
dedo, como cualquier otra web. El fondo es liso a propósito: aquí se lee, no se proyecta.

Cada estrofa lleva su número de diapositiva, así que quien lee sabe por dónde irá el
proyector. Se llega desde el botón **Letra** del índice, desde **Letra completa** dentro
de la proyección, o por enlace directo. El botón **Volver** regresa exactamente a donde
se estaba —a la diapositiva que se proyectaba o al índice— y **Proyectar** abre la
canción desde la primera diapositiva.

---

## Sobre el tamaño del repertorio

Está probado con 349 canciones × 22 diapositivas × 35 fondos:

- El visor tiene **una sola diapositiva en el DOM**; el texto se reemplaza al navegar.
  Da igual que el cancionero tenga 7 canciones o 349.
- La cuadrícula del editor está **virtualizada**: de las 8.376 celdas solo existen las
  ~500 que se ven. Los datos viven en memoria, no en el HTML.
- El archivo de datos completo ronda los 300–500 KB, que se cargan una vez.
- El buscador trabaja con el título y las estrofas ya normalizados al arrancar, así que
  teclear no vuelve a recorrer las 7.678 estrofas letra a letra.

---

## Enlaces directos

La dirección refleja lo que hay en pantalla, así que se puede guardar en marcadores
o dejar preparada antes del culto:

```
index.html#/            el índice
index.html#/c/12/3      proyección: la canción 12, diapositiva 3
index.html#/letra/12    lectura: la letra entera de la canción 12
```

---

## Una aclaración sobre el sitio de referencia

Las letras no se pueden traer solas desde el cancionero publicado en Google Sites: esa
página no ofrece los datos en un formato que un script pueda leer, y raspar contenido
ajeno además tiene sus implicaciones. El editor está pensado justo para eso: pegar cada
letra una vez, exportar, y a partir de ahí ya todo vive en tu repositorio.

---

## Accesibilidad y compatibilidad

Navegadores con soporte de CSS Grid, `position: sticky` y la API de pantalla completa
(Chrome, Edge, Firefox y Safari recientes). Quien tenga activado *reducir movimiento*
en su sistema ve los fondos quietos, sin animación. Todo se puede manejar con teclado
y el foco es siempre visible.
