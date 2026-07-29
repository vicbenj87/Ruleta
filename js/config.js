/* ============================================================================
   config.js · Ajustes del cancionero
   ----------------------------------------------------------------------------
   Este es el único archivo que hace falta tocar para cambiar el aspecto o el
   comportamiento de la app. Las letras van aparte, en js/data/canciones.js,
   que se regenera desde el editor y se sustituye sin tocar nada más.
   ========================================================================== */

window.CANCIONERO_CONFIG = {

  /* --- Identidad ------------------------------------------------------- */
  app: {
    nombre: 'Cancionero',
    subtitulo: 'IBM El Vivero',
    /* Límites del formato. Cambiarlos aquí y en el editor a la vez. */
    maxDiapositivas: 22,
    maxCanciones: 349
  },

  /* --- Fondos ----------------------------------------------------------- */
  fondos: {
    /**
     * Estrategia de elección al abrir cada canción:
     *   'css'    → solo los 35 fondos animados en CSS (recomendado: 0 descargas)
     *   'imagen' → solo imágenes de media/imagenes/
     *   'video'  → solo vídeos de media/videos/
     *   'mixto'  → sortea entre los tres según `pesos`
     */
    estrategia: 'css',

    /* Probabilidad relativa de cada familia cuando estrategia = 'mixto'. */
    pesos: { css: 60, imagen: 30, video: 10 },

    /* Cuántas clases .fondo--NN hay en css/backgrounds.css. */
    totalCss: 35,

    /**
     * Evita repetir fondo en las N canciones siguientes. Con 35 fondos, un
     * valor de 10 hace que un culto de 6 canciones nunca repita ambiente.
     */
    memoriaSinRepetir: 10,

    /* Rutas de los fondos de imagen (mínimo 35, se generan más abajo). */
    imagenes: [],

    /* Rutas de los fondos de vídeo (mínimo 35, se generan más abajo). */
    videos: [],

    /**
     * Si una imagen o un vídeo no existe o tarda demasiado, la app cae a un
     * fondo CSS al azar en vez de dejar la pantalla negra.
     */
    respaldoCss: true,

    /* Milisegundos de espera antes de dar por fallida una imagen o un vídeo. */
    tiempoEsperaMedio: 2500
  },

  /* --- Comportamiento del visor ----------------------------------------- */
  visor: {
    /* Pide pantalla completa al abrir una canción. */
    pantallaCompletaAuto: true,
    /* Intenta bloquear la orientación horizontal (solo Android/Chrome). */
    bloquearHorizontal: true,
    /**
     * Diapositivas en bucle: al pasar de la última se vuelve a la primera, y
     * al retroceder desde la primera se salta a la última. Con `false`, las
     * flechas se apagan en los extremos.
     */
    cicloDiapositivas: true,
    /* Oculta flechas y barra tras este tiempo sin actividad (0 = nunca). */
    ocultarControlesTrasMs: 3500,

    /**
     * Guiño de bienvenida. Al abrir la canción a pantalla completa, las dos
     * flechas parpadean unas cuantas veces para que se vea dónde están; solo
     * cuando terminan empieza a contar el tiempo de ocultarlo todo.
     * Con repeticiones: 0 se desactiva y los controles se ocultan sin más.
     */
    parpadeoInicial: { repeticiones: 3, duracionMs: 750 },

    /* Permite pasar diapositiva deslizando el dedo. */
    gestosTactiles: true,
    /* Tamaño de letra de proyección, en píxeles, para el autoajuste. */
    tipografia: { min: 20, max: 160 }
  },

  /* --- Índice ------------------------------------------------------------ */
  indice: {
    /* Filtro activo al cargar: 0 = todas, 1 = dominical, 2 = santa cena. */
    filtroInicial: 0,

    /**
     * Orden de la lista:
     *   'alfabetico' → por título, ignorando tildes y mayúsculas
     *   'numero'     → por el número de canción del archivo de datos
     * El número que se ve a la izquierda es siempre el del archivo de datos,
     * ordene como ordene la lista: es el que usan los enlaces y el editor.
     */
    orden: 'alfabetico',

    /**
     * El buscador mira el título desde la primera letra, pero dentro de las
     * letras solo a partir de este número de caracteres: con menos, media
     * lista coincidiría y el resultado no diría nada.
     */
    minCaracteresLetra: 3,

    /* Etiquetas de la columna TIPO del editor. */
    tipos: {
      1: { nombre: 'Dominical',  abrev: 'Dominical' },
      2: { nombre: 'Santa Cena', abrev: 'Santa Cena' },
      3: { nombre: 'Ambas',      abrev: 'Ambas' }
    }
  }
};

/* ----------------------------------------------------------------------------
   Rutas de medios
   ----------------------------------------------------------------------------
   Se generan 35 nombres correlativos para no escribirlos a mano. Coloca los
   archivos con estos nombres exactos y funcionarán sin tocar código:

       media/imagenes/fondo-01.jpg … fondo-35.jpg
       media/videos/fondo-01.mp4   … fondo-35.mp4

   Si prefieres otros nombres o formatos, sustituye estos bucles por tu propia
   lista de rutas.
-------------------------------------------------------------------------- */
(function generarRutasDeMedios(config) {
  'use strict';
  var TOTAL = 35;
  for (var i = 1; i <= TOTAL; i++) {
    var n = String(i).padStart(2, '0');
    config.fondos.imagenes.push('media/imagenes/fondo-' + n + '.jpg');
    config.fondos.videos.push('media/videos/fondo-' + n + '.mp4');
  }
})(window.CANCIONERO_CONFIG);
