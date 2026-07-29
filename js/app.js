/* ============================================================================
   app.js · Cancionero digital — índice, visor de diapositivas y lectura
   ----------------------------------------------------------------------------
   Tres pantallas, una sola página:

     #/               índice, ordenado alfabéticamente y con buscador
     #/c/12/3         proyección: la canción 12, diapositiva 3, pantalla completa
     #/letra/12       lectura: la letra entera, en vertical y con scroll normal

   Decisiones que explican el resto del archivo:

   · Solo hay una diapositiva en el DOM. Da igual que el repertorio tenga 7 o
     349 canciones de 22 estrofas: nunca se construyen 7.678 nodos, se cambia
     el texto de uno. La memoria y el tiempo de arranque no dependen del
     tamaño del cancionero.

   · El fondo se sortea al abrir la canción, no al cambiar de diapositiva, y se
     recuerdan los últimos elegidos para no repetir ambiente dentro de un culto.
     Ir a la letra y volver conserva el fondo: el sorteo va por canción.

   · El tamaño de letra se calcula por búsqueda binaria contra el alto real de
     la pantalla. Una estrofa de dos líneas se ve enorme; una de ocho encoge
     lo justo para caber. Nunca hay texto cortado.

   · Proyección y lectura son pantallas distintas a propósito. La proyección
     pide pantalla completa y va por diapositivas; la lectura es una página
     normal que se recorre con el dedo o la rueda, sin pantalla completa.
   ========================================================================== */

(function () {
  'use strict';

  var CFG = window.CANCIONERO_CONFIG;
  var DATOS = window.CANCIONERO_DATA;

  /* ======================================================================
     Utilidades
     ====================================================================== */

  function $(sel) { return document.querySelector(sel); }

  /** Quita acentos y pasa a minúsculas: "Canción" y "cancion" buscan igual. */
  function normalizar(txt) {
    return String(txt)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function dosDigitos(n) { return String(n).padStart(2, '0'); }

  function retardar(fn, ms) {
    var id;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(id);
      id = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  function aleatorio(max) { return Math.floor(Math.random() * max); }

  /* Comparador con reglas del español: la ñ va tras la n y las tildes no cuentan. */
  var comparadorTitulos = (typeof Intl !== 'undefined' && Intl.Collator)
    ? new Intl.Collator('es', { sensitivity: 'base', numeric: true }).compare
    : function (a, b) { return normalizar(a) < normalizar(b) ? -1 : 1; };

  /* ======================================================================
     Estado
     ====================================================================== */

  var estado = {
    canciones: [],        // repertorio saneado y ordenado
    visibles: [],         // resultado del filtro + búsqueda
    filtro: CFG.indice.filtroInicial,
    consulta: '',         // búsqueda ya normalizada
    cancion: null,        // canción abierta en el visor
    indice: 0,            // diapositiva actual (0-based)
    fondosRecientes: [],  // claves de los últimos fondos usados
    fondoElegido: null,   // { familia, indice, clase, ruta }
    fondoCancionId: null, // para qué canción se sorteó
    origenLectura: '#/',  // a dónde vuelve el botón de la pantalla de lectura
    enTransicion: false
  };

  var dom = {};
  var temporizadorInactividad = null;
  var temporizadorParpadeo = null;
  var temporizadorMedio = null;

  /* ======================================================================
     Carga y saneado de datos
     ----------------------------------------------------------------------
     El archivo de datos lo genera una persona con un editor: hay que asumir
     celdas vacías, tipos raros y estrofas de más. Se limpia una sola vez, al
     arrancar, y a partir de ahí el resto del código confía en la estructura.
     ====================================================================== */

  function cargarCanciones() {
    var crudas = (DATOS && Array.isArray(DATOS.canciones)) ? DATOS.canciones : [];
    var limpias = [];
    var maxDiapos = CFG.app.maxDiapositivas;

    for (var i = 0; i < crudas.length && limpias.length < CFG.app.maxCanciones; i++) {
      var c = crudas[i] || {};
      var titulo = String(c.titulo || '').trim();
      if (!titulo) { continue; }                       // sin título no hay canción

      var diapos = Array.isArray(c.diapositivas) ? c.diapositivas : [];
      diapos = diapos
        .map(function (d) { return String(d == null ? '' : d).replace(/\r\n/g, '\n').trim(); })
        .slice(0, maxDiapos)
        .filter(function (d) { return d.length > 0; });

      var tipo = parseInt(c.tipo, 10);
      if (tipo !== 1 && tipo !== 2 && tipo !== 3) { tipo = 1; }

      var clavesDiapositivas = diapos.map(normalizar);

      limpias.push({
        id: parseInt(c.id, 10) || (limpias.length + 1),
        titulo: titulo,
        tipo: tipo,
        diapositivas: diapos,
        /* Campos precalculados: buscar es comparar cadenas, no normalizar 349
           títulos y 7.678 estrofas en cada pulsación de tecla. */
        clave: normalizar(titulo),
        clavesDiapositivas: clavesDiapositivas,
        claveLetra: clavesDiapositivas.join('\n')
      });
    }

    /* El número que se ve en la lista es el del archivo de datos y no cambia;
       lo que cambia es el orden en que se muestran. */
    if (CFG.indice.orden === 'alfabetico') {
      limpias.sort(function (a, b) { return comparadorTitulos(a.titulo, b.titulo); });
    } else {
      limpias.sort(function (a, b) { return a.id - b.id; });
    }

    estado.canciones = limpias;
  }

  function buscarPorId(id) {
    for (var i = 0; i < estado.canciones.length; i++) {
      if (estado.canciones[i].id === id) { return estado.canciones[i]; }
    }
    return null;
  }

  /* ======================================================================
     Índice
     ====================================================================== */

  function filtrarCanciones() {
    var q = estado.consulta;
    var f = estado.filtro;
    var buscaEnLetra = CFG.indice.buscarEnLetra !== false &&
                       q.length >= (CFG.indice.minCaracteresLetra || 3);

    estado.visibles = estado.canciones.filter(function (c) {
      // Tipo 3 ("Ambas") aparece en los dos filtros.
      var pasaTipo = (f === 0) || (c.tipo === f) || (c.tipo === 3);
      if (!pasaTipo) { return false; }
      if (!q) { return true; }

      if (c.clave.indexOf(q) !== -1 || String(c.id) === q) { return true; }
      return buscaEnLetra && c.claveLetra.indexOf(q) !== -1;
    });
  }

  /**
   * Cuando la coincidencia está en la letra y no en el título, hay que
   * enseñarla: si no, el resultado aparece sin motivo visible.
   * Devuelve la línea donde cae, con su número de diapositiva.
   *
   * Primero localiza la estrofa con las claves ya calculadas y solo entonces
   * normaliza sus tres o cuatro líneas. Buscar una palabra común en las 349
   * canciones pasa así de ~23.000 normalizaciones por tecla a poco más de mil.
   */
  function fragmentoCoincidente(cancion, q) {
    if (!q || cancion.clave.indexOf(q) !== -1) { return null; }

    for (var i = 0; i < cancion.clavesDiapositivas.length; i++) {
      if (cancion.clavesDiapositivas[i].indexOf(q) === -1) { continue; }

      var lineas = cancion.diapositivas[i].split('\n');
      for (var j = 0; j < lineas.length; j++) {
        if (normalizar(lineas[j]).indexOf(q) !== -1) {
          return { texto: lineas[j].trim(), diapositiva: i + 1 };
        }
      }
      // La coincidencia cae a caballo entre dos líneas: se enseña la estrofa.
      return { texto: lineas.join(' ').trim(), diapositiva: i + 1 };
    }
    return null;
  }

  /**
   * Tira de 22 marcas con las primeras `cantidad` llenas.
   * Es un solo nodo: el dibujo lo hace el CSS a partir de dos variables.
   */
  function crearMedidor(cantidad) {
    var PASO = 5;                              // píxeles por marca, igual que en app.css
    var medidor = document.createElement('span');
    medidor.className = 'medidor';
    medidor.setAttribute('aria-hidden', 'true');
    medidor.style.setProperty('--marcas', CFG.app.maxDiapositivas);
    medidor.style.setProperty('--llenado', (cantidad * PASO) + 'px');
    medidor.title = cantidad + ' de ' + CFG.app.maxDiapositivas + ' diapositivas';
    return medidor;
  }

  function crearFilaCancion(c) {
    var li = document.createElement('li');
    li.className = 'fila-cancion';

    /* Botón principal: proyectar. */
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cancion';
    btn.dataset.id = c.id;

    var num = document.createElement('span');
    num.className = 'cancion__numero';
    num.textContent = dosDigitos(c.id);

    var texto = document.createElement('span');
    texto.className = 'cancion__texto';

    var titulo = document.createElement('span');
    titulo.className = 'cancion__titulo';
    titulo.textContent = c.titulo;
    texto.appendChild(titulo);

    var fragmento = fragmentoCoincidente(c, estado.consulta);
    if (fragmento) {
      var pista = document.createElement('span');
      pista.className = 'cancion__fragmento';
      pista.textContent = 'Diapositiva ' + fragmento.diapositiva + ' · ' + fragmento.texto;
      texto.appendChild(pista);
    }

    var tipo = document.createElement('span');
    tipo.className = 'etiqueta-tipo etiqueta-tipo--' + c.tipo;
    tipo.textContent = CFG.indice.tipos[c.tipo].abrev;

    btn.appendChild(num);
    btn.appendChild(texto);
    btn.appendChild(crearMedidor(c.diapositivas.length));
    btn.appendChild(tipo);
    btn.setAttribute('aria-label',
      'Proyectar «' + c.titulo + '», ' + c.diapositivas.length + ' diapositivas, ' +
      CFG.indice.tipos[c.tipo].nombre);

    /* Botón secundario: leer la letra sin proyectar nada. */
    var leer = document.createElement('button');
    leer.type = 'button';
    leer.className = 'ver-letra';
    leer.dataset.letra = c.id;
    leer.textContent = 'Letra';
    leer.setAttribute('aria-label', 'Leer la letra completa de «' + c.titulo + '»');

    li.appendChild(btn);
    li.appendChild(leer);
    return li;
  }

  function renderIndice() {
    filtrarCanciones();

    var fragmento = document.createDocumentFragment();
    estado.visibles.forEach(function (c) { fragmento.appendChild(crearFilaCancion(c)); });

    dom.lista.innerHTML = '';
    dom.lista.appendChild(fragmento);

    var hayResultados = estado.visibles.length > 0;
    dom.vacio.hidden = hayResultados;
    dom.lista.hidden = !hayResultados;
    dom.vacioTitulo.textContent = estado.canciones.length === 0
      ? 'Todavía no hay canciones'
      : 'Ninguna canción coincide';
    dom.vacioTexto.innerHTML = estado.canciones.length === 0
      ? 'Abre <code>editor.html</code>, escribe el repertorio y exporta <code>js/data/canciones.js</code>.'
      : 'Prueba con otras palabras del título o de la letra, o cambia el filtro.';

    dom.cifraTotal.textContent = estado.canciones.length;
  }

  /* ======================================================================
     Fondos
     ----------------------------------------------------------------------
     Siempre se pinta primero un fondo CSS. Si toca imagen o vídeo, se carga
     encima y solo se muestra cuando está listo: así jamás se ve una pantalla
     negra esperando un archivo que quizá ni exista.
     ====================================================================== */

  function elegirFamilia() {
    var estrategia = CFG.fondos.estrategia;
    if (estrategia !== 'mixto') { return estrategia; }

    var pesos = CFG.fondos.pesos;
    var total = pesos.css + pesos.imagen + pesos.video;
    var tirada = aleatorio(total);
    if (tirada < pesos.css) { return 'css'; }
    if (tirada < pesos.css + pesos.imagen) { return 'imagen'; }
    return 'video';
  }

  /**
   * Devuelve un índice de la familia evitando los últimos usados.
   * Si todos están "recientes" (repertorio corto), acepta cualquiera.
   */
  function elegirIndiceSinRepetir(familia, longitud) {
    if (longitud <= 0) { return -1; }
    var memoria = Math.min(CFG.fondos.memoriaSinRepetir, longitud - 1);
    for (var intento = 0; intento < 40; intento++) {
      var i = aleatorio(longitud);
      if (estado.fondosRecientes.indexOf(familia + ':' + i) === -1) {
        estado.fondosRecientes.push(familia + ':' + i);
        while (estado.fondosRecientes.length > memoria) { estado.fondosRecientes.shift(); }
        return i;
      }
    }
    return aleatorio(longitud);
  }

  /** Sortea el ambiente de una canción. No toca el DOM: solo decide. */
  function sortearFondo() {
    var eleccion = {
      clase: 'fondo--' + dosDigitos(elegirIndiceSinRepetir('css', CFG.fondos.totalCss) + 1),
      familia: 'css',
      ruta: null
    };

    var familia = elegirFamilia();
    if (familia === 'css') { return eleccion; }

    var lista = familia === 'imagen' ? CFG.fondos.imagenes : CFG.fondos.videos;
    var i = elegirIndiceSinRepetir(familia, lista.length);
    if (i >= 0) {
      eleccion.familia = familia;
      eleccion.ruta = lista[i];
    }
    return eleccion;
  }

  function limpiarMedios() {
    clearTimeout(temporizadorMedio);
    dom.fondoImagen.removeAttribute('data-activo');
    dom.fondoImagen.removeAttribute('src');
    dom.fondoVideo.removeAttribute('data-activo');
    dom.fondoVideo.pause();
    dom.fondoVideo.removeAttribute('src');
    dom.fondoVideo.load();
  }

  function pintarFondo(eleccion) {
    limpiarMedios();
    dom.capaFondo.className = 'capa-fondo ' + eleccion.clase;   // base garantizada
    if (eleccion.familia === 'css' || !eleccion.ruta) { return; }

    var ruta = eleccion.ruta;
    var caducado = false;
    temporizadorMedio = setTimeout(function () { caducado = true; }, CFG.fondos.tiempoEsperaMedio);

    if (eleccion.familia === 'imagen') {
      var precarga = new Image();
      precarga.onload = function () {
        if (caducado) { return; }
        clearTimeout(temporizadorMedio);
        dom.fondoImagen.src = ruta;
        dom.fondoImagen.setAttribute('data-activo', 'true');
      };
      precarga.onerror = function () { /* se queda el fondo CSS */ };
      precarga.src = ruta;
    } else {
      dom.fondoVideo.src = ruta;
      dom.fondoVideo.addEventListener('canplay', function alListo() {
        dom.fondoVideo.removeEventListener('canplay', alListo);
        if (caducado) { return; }
        clearTimeout(temporizadorMedio);
        dom.fondoVideo.setAttribute('data-activo', 'true');
        var promesa = dom.fondoVideo.play();
        if (promesa && promesa.catch) { promesa.catch(function () {}); }
      });
      dom.fondoVideo.load();
    }
  }

  /** Sortea solo si la canción es otra; si es la misma, repite el ambiente. */
  function asegurarFondo(cancion) {
    if (estado.fondoCancionId !== cancion.id || !estado.fondoElegido) {
      estado.fondoElegido = sortearFondo();
      estado.fondoCancionId = cancion.id;
    }
    pintarFondo(estado.fondoElegido);
  }

  /* ======================================================================
     Ajuste tipográfico
     ----------------------------------------------------------------------
     Búsqueda binaria del mayor tamaño que cabe. Nueve pasadas bastan para
     acertar con menos de 1 px de error entre 20 y 160 px.
     ====================================================================== */

  function ajustarTipografia() {
    var el = dom.diapositiva;
    var min = CFG.visor.tipografia.min;
    var max = CFG.visor.tipografia.max;
    var mejor = min;

    for (var paso = 0; paso < 9; paso++) {
      var medio = (min + max) / 2;
      el.style.fontSize = medio + 'px';
      var cabe = (el.scrollHeight <= el.clientHeight + 1) &&
                 (el.scrollWidth <= el.clientWidth + 1);
      if (cabe) { mejor = medio; min = medio; } else { max = medio; }
    }

    el.style.fontSize = Math.floor(mejor) + 'px';
  }

  /* ======================================================================
     Cambio de pantalla
     ====================================================================== */

  function mostrarVista(nombre) {
    document.body.setAttribute('data-vista', nombre);
    dom.visor.setAttribute('data-abierto', String(nombre === 'visor'));
    dom.visor.setAttribute('aria-hidden', String(nombre !== 'visor'));
    dom.lectura.setAttribute('data-abierto', String(nombre === 'lectura'));
    dom.lectura.setAttribute('aria-hidden', String(nombre !== 'lectura'));
  }

  /* ======================================================================
     Visor de diapositivas
     ====================================================================== */

  function abrirCancion(id, indiceDiapositiva) {
    var cancion = buscarPorId(id);
    if (!cancion) { location.hash = '#/'; return; }

    estado.cancion = cancion;
    estado.indice = Math.min(Math.max(indiceDiapositiva || 0, 0),
                             Math.max(cancion.diapositivas.length - 1, 0));

    asegurarFondo(cancion);
    mostrarVista('visor');
    dom.visorTitulo.textContent = cancion.titulo;

    pintarDiapositiva(false);
    iniciarParpadeo();

    if (CFG.visor.pantallaCompletaAuto) { entrarPantallaCompleta(); }

    // El foco va donde sirva: a "siguiente" si hay más estrofas, si no a "salir".
    var destino = dom.btnSiguiente.disabled ? dom.btnSalir : dom.btnSiguiente;
    destino.focus({ preventScroll: true });
  }

  function pintarDiapositiva(conTransicion) {
    var cancion = estado.cancion;
    if (!cancion) { return; }

    var total = cancion.diapositivas.length;
    var texto = total ? cancion.diapositivas[estado.indice] : '(Esta canción todavía no tiene letra)';

    function pintar() {
      dom.diapositiva.textContent = texto;
      ajustarTipografia();
      dom.visor.removeAttribute('data-transicion');
      estado.enTransicion = false;
    }

    if (conTransicion) {
      estado.enTransicion = true;
      dom.visor.setAttribute('data-transicion', 'true');
      setTimeout(pintar, 200);
    } else {
      pintar();
    }

    dom.contador.textContent = total ? (estado.indice + 1) + ' / ' + total : '—';

    /* En bucle las flechas nunca se apagan salvo que haya una sola diapositiva:
       si se apagaran, la de "siguiente" no podría devolver a la primera. */
    if (CFG.visor.cicloDiapositivas) {
      dom.btnAnterior.disabled = total <= 1;
      dom.btnSiguiente.disabled = total <= 1;
    } else {
      dom.btnAnterior.disabled = estado.indice <= 0;
      dom.btnSiguiente.disabled = estado.indice >= total - 1;
    }
  }

  /** Mueve `paso` diapositivas; con ciclo activo, da la vuelta por los extremos. */
  function desplazar(paso) {
    var total = estado.cancion ? estado.cancion.diapositivas.length : 0;
    if (total <= 1 || estado.enTransicion) { return; }

    var destino = estado.indice + paso;
    if (CFG.visor.cicloDiapositivas) {
      destino = ((destino % total) + total) % total;     // -1 → última
    } else if (destino < 0 || destino > total - 1) {
      return;
    }
    irADiapositiva(destino);
  }

  function irADiapositiva(nuevo) {
    var total = estado.cancion ? estado.cancion.diapositivas.length : 0;
    if (nuevo < 0 || nuevo > total - 1 || nuevo === estado.indice || estado.enTransicion) { return; }
    estado.indice = nuevo;
    pintarDiapositiva(true);
    actualizarHash();
  }

  function siguiente() { desplazar(1); }
  function anterior() { desplazar(-1); }

  /* ======================================================================
     Pantalla de lectura
     ----------------------------------------------------------------------
     Es una página normal: sin pantalla completa, sin diapositivas y sin
     flechas. Solo el texto entero y el scroll de siempre.
     ====================================================================== */

  function irALectura(id, origen) {
    estado.origenLectura = origen || '#/';
    location.hash = '#/letra/' + id;
  }

  function abrirLectura(id) {
    var cancion = buscarPorId(id);
    if (!cancion) { location.hash = '#/'; return; }

    /* Al leer se sale de la proyección: nada de pantalla completa forzada. */
    limpiarMedios();
    salirPantallaCompleta();
    detenerTemporizadores();

    dom.lecturaTitulo.textContent = cancion.titulo;
    dom.lecturaTituloBarra.textContent = cancion.titulo;
    dom.lecturaMeta.textContent = cancion.diapositivas.length + ' ' +
      (cancion.diapositivas.length === 1 ? 'diapositiva' : 'diapositivas') +
      ' · ' + CFG.indice.tipos[cancion.tipo].nombre;
    dom.btnProyectar.dataset.id = cancion.id;

    var cuerpo = dom.lecturaCuerpo;
    cuerpo.innerHTML = '';

    if (!cancion.diapositivas.length) {
      var aviso = document.createElement('p');
      aviso.className = 'estrofa';
      aviso.textContent = 'Esta canción todavía no tiene letra.';
      cuerpo.appendChild(aviso);
    }

    cancion.diapositivas.forEach(function (texto, i) {
      var bloque = document.createElement('p');
      bloque.className = 'estrofa';

      var num = document.createElement('span');
      num.className = 'estrofa__numero';
      num.textContent = dosDigitos(i + 1);

      bloque.appendChild(num);
      bloque.appendChild(document.createTextNode(texto));
      cuerpo.appendChild(bloque);
    });

    mostrarVista('lectura');
    window.scrollTo(0, 0);
    dom.volverLectura.focus({ preventScroll: true });
  }

  /* ======================================================================
     Salida
     ====================================================================== */

  function detenerTemporizadores() {
    clearTimeout(temporizadorInactividad);
    clearTimeout(temporizadorParpadeo);
    dom.visor.removeAttribute('data-inactivo');
    dom.visor.removeAttribute('data-presentando');
  }

  function cerrarVisor() {
    limpiarMedios();
    detenerTemporizadores();
    dom.visor.removeAttribute('data-negro');
    estado.cancion = null;
    salirPantallaCompleta();
  }

  function volverAlIndice() {
    if (location.hash && location.hash !== '#/') {
      location.hash = '#/';                  // el router se encarga de cerrar
    } else {
      cerrarVisor();
      mostrarVista('indice');
    }
  }

  /* ======================================================================
     Pantalla completa y orientación
     ====================================================================== */

  function entrarPantallaCompleta() {
    var el = document.documentElement;
    var pedir = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (!pedir || document.fullscreenElement) { bloquearOrientacion(); return; }
    try {
      var p = pedir.call(el);
      if (p && p.then) { p.then(bloquearOrientacion).catch(function () {}); }
      else { bloquearOrientacion(); }
    } catch (e) { /* algunos navegadores lo prohíben; seguimos en ventana */ }
  }

  function salirPantallaCompleta() {
    try { if (screen.orientation && screen.orientation.unlock) { screen.orientation.unlock(); } } catch (e) {}
    var salir = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (salir && document.fullscreenElement) {
      try { salir.call(document); } catch (e) {}
    }
  }

  function bloquearOrientacion() {
    if (!CFG.visor.bloquearHorizontal) { return; }
    try {
      if (screen.orientation && screen.orientation.lock) {
        var p = screen.orientation.lock('landscape');
        if (p && p.catch) { p.catch(function () {}); }   // iOS no lo permite: da igual
      }
    } catch (e) {}
  }

  function alternarPantallaCompleta() {
    if (document.fullscreenElement) { salirPantallaCompleta(); } else { entrarPantallaCompleta(); }
  }

  /* ======================================================================
     Guiño de las flechas y ocultado por inactividad
     ----------------------------------------------------------------------
     Al abrir la canción las flechas parpadean para decir "estamos aquí". Solo
     cuando terminan arranca la cuenta atrás que lo esconde todo, y así el
     guiño nunca se corta a la mitad.
     ====================================================================== */

  function iniciarParpadeo() {
    var p = CFG.visor.parpadeoInicial;
    clearTimeout(temporizadorInactividad);
    clearTimeout(temporizadorParpadeo);
    dom.visor.removeAttribute('data-inactivo');

    if (!p || !p.repeticiones) { reiniciarInactividad(); return; }

    dom.visor.style.setProperty('--parpadeo', p.duracionMs + 'ms');
    dom.visor.style.setProperty('--repeticiones', p.repeticiones);

    /* Reiniciar la animación aunque ya estuviera puesta (canción tras canción). */
    dom.visor.removeAttribute('data-presentando');
    void dom.visor.offsetWidth;
    dom.visor.setAttribute('data-presentando', 'true');

    temporizadorParpadeo = setTimeout(terminarParpadeo, p.repeticiones * p.duracionMs + 120);
  }

  function terminarParpadeo() {
    clearTimeout(temporizadorParpadeo);
    if (dom.visor.getAttribute('data-presentando') !== 'true') { return; }
    dom.visor.removeAttribute('data-presentando');
    reiniciarInactividad();
  }

  function reiniciarInactividad() {
    dom.visor.removeAttribute('data-inactivo');
    clearTimeout(temporizadorInactividad);

    // Mientras guiña no se cuenta: los botones tienen que verse hasta el final.
    if (dom.visor.getAttribute('data-presentando') === 'true') { return; }

    var espera = CFG.visor.ocultarControlesTrasMs;
    if (!espera) { return; }
    temporizadorInactividad = setTimeout(function () {
      dom.visor.setAttribute('data-inactivo', 'true');
    }, espera);
  }

  /* ======================================================================
     Enrutado por hash
     ====================================================================== */

  function actualizarHash() {
    if (!estado.cancion) { return; }
    var nuevo = '#/c/' + estado.cancion.id + '/' + (estado.indice + 1);
    if (location.hash !== nuevo) {
      history.replaceState(null, '', nuevo);   // pasar estrofa no llena el historial
    }
  }

  function leerRuta() {
    var partes = (location.hash || '').replace(/^#\/?/, '').split('/');

    if (partes[0] === 'c' && partes[1]) {
      abrirCancion(parseInt(partes[1], 10), (parseInt(partes[2], 10) || 1) - 1);
      return;
    }

    if (partes[0] === 'letra' && partes[1]) {
      abrirLectura(parseInt(partes[1], 10));
      return;
    }

    cerrarVisor();
    mostrarVista('indice');
  }

  /* ======================================================================
     Eventos
     ====================================================================== */

  function conectarEventos() {

    /* --- Índice --------------------------------------------------------- */
    dom.lista.addEventListener('click', function (ev) {
      var leer = ev.target.closest('.ver-letra');
      if (leer) { irALectura(parseInt(leer.dataset.letra, 10), '#/'); return; }

      var btn = ev.target.closest('.cancion');
      if (btn) { location.hash = '#/c/' + btn.dataset.id + '/1'; }
    });

    dom.busqueda.addEventListener('input', retardar(function (ev) {
      estado.consulta = normalizar(ev.target.value);
      renderIndice();
    }, 120));

    dom.filtros.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.filtro');
      if (!btn) { return; }
      estado.filtro = parseInt(btn.dataset.filtro, 10);
      Array.prototype.forEach.call(dom.filtros.querySelectorAll('.filtro'), function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      renderIndice();
    });

    /* --- Visor ---------------------------------------------------------- */
    dom.btnSiguiente.addEventListener('click', siguiente);
    dom.btnAnterior.addEventListener('click', anterior);
    dom.btnPantalla.addEventListener('click', alternarPantallaCompleta);
    dom.btnSalir.addEventListener('click', volverAlIndice);

    dom.btnLetra.addEventListener('click', function () {
      if (!estado.cancion) { return; }
      irALectura(estado.cancion.id, '#/c/' + estado.cancion.id + '/' + (estado.indice + 1));
    });

    /* Mover el ratón despierta los controles, pero no corta el guiño: quien
       aún no ha tocado nada sigue necesitando ver dónde están las flechas. */
    ['mousemove', 'wheel'].forEach(function (evt) {
      dom.visor.addEventListener(evt, reiniciarInactividad, { passive: true });
    });

    /* Un clic o una tecla sí lo cortan: ya se han encontrado. */
    ['pointerdown', 'keydown'].forEach(function (evt) {
      dom.visor.addEventListener(evt, function () {
        terminarParpadeo();
        reiniciarInactividad();
      }, { passive: true });
    });

    /* --- Lectura --------------------------------------------------------- */
    dom.volverLectura.addEventListener('click', function () {
      location.hash = estado.origenLectura || '#/';
    });

    dom.btnProyectar.addEventListener('click', function () {
      location.hash = '#/c/' + dom.btnProyectar.dataset.id + '/1';
    });

    /* --- Teclado -------------------------------------------------------- */
    document.addEventListener('keydown', function (ev) {
      var vista = document.body.getAttribute('data-vista');

      if (vista === 'indice') {
        // "/" enfoca el buscador sin escribir la barra.
        if (ev.key === '/' && document.activeElement !== dom.busqueda) {
          ev.preventDefault();
          dom.busqueda.focus();
        }
        return;
      }

      if (vista === 'lectura') {
        // Aquí solo se lee: el scroll lo maneja el navegador.
        if (ev.key === 'Escape') { location.hash = estado.origenLectura || '#/'; }
        return;
      }

      switch (ev.key) {
        case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
          ev.preventDefault(); siguiente(); break;
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
          ev.preventDefault(); anterior(); break;
        case 'Home':
          ev.preventDefault(); irADiapositiva(0); break;
        case 'End':
          ev.preventDefault(); irADiapositiva(estado.cancion.diapositivas.length - 1); break;
        case 'Escape':
          volverAlIndice(); break;
        case 'l': case 'L':
          ev.preventDefault();
          if (estado.cancion) {
            irALectura(estado.cancion.id, '#/c/' + estado.cancion.id + '/' + (estado.indice + 1));
          }
          break;
        case 'f': case 'F':
          ev.preventDefault(); alternarPantallaCompleta(); break;
        case 'b': case 'B': case '.':
          // Pantalla en negro: para orar o para hablar sin distracción.
          ev.preventDefault();
          dom.visor.setAttribute('data-negro',
            dom.visor.getAttribute('data-negro') === 'true' ? 'false' : 'true');
          break;
      }
    });

    /* --- Gestos táctiles ------------------------------------------------ */
    if (CFG.visor.gestosTactiles) {
      var inicioX = 0, inicioY = 0, tocando = false;

      dom.escena.addEventListener('touchstart', function (ev) {
        if (ev.touches.length !== 1) { return; }
        tocando = true;
        inicioX = ev.touches[0].clientX;
        inicioY = ev.touches[0].clientY;
      }, { passive: true });

      dom.escena.addEventListener('touchend', function (ev) {
        if (!tocando) { return; }
        tocando = false;
        var dx = ev.changedTouches[0].clientX - inicioX;
        var dy = ev.changedTouches[0].clientY - inicioY;
        // Solo cuenta como paso si el gesto es claramente horizontal.
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) { return; }
        if (dx < 0) { siguiente(); } else { anterior(); }
      }, { passive: true });
    }

    /* --- Reajustes ------------------------------------------------------ */
    var reajustar = retardar(function () {
      if (document.body.getAttribute('data-vista') === 'visor') { ajustarTipografia(); }
    }, 120);

    window.addEventListener('resize', reajustar);
    window.addEventListener('orientationchange', reajustar);
    document.addEventListener('fullscreenchange', reajustar);

    window.addEventListener('hashchange', leerRuta);
  }

  /* ======================================================================
     Arranque
     ====================================================================== */

  function iniciar() {
    dom = {
      lista:        $('#lista'),
      vacio:        $('#vacio'),
      vacioTitulo:  $('#vacio-titulo'),
      vacioTexto:   $('#vacio-texto'),
      busqueda:     $('#busqueda'),
      filtros:      $('#filtros'),
      cifraTotal:   $('#cifra-total'),
      cifraFondos:  $('#cifra-fondos'),

      visor:        $('#visor'),
      capaFondo:    $('#capa-fondo'),
      fondoImagen:  $('#fondo-imagen'),
      fondoVideo:   $('#fondo-video'),
      escena:       $('#escena'),
      diapositiva:  $('#diapositiva'),
      visorTitulo:  $('#visor-titulo'),
      contador:     $('#contador'),
      btnAnterior:  $('#btn-anterior'),
      btnSiguiente: $('#btn-siguiente'),
      btnLetra:     $('#btn-letra'),
      btnPantalla:  $('#btn-pantalla'),
      btnSalir:     $('#btn-salir'),

      lectura:          $('#lectura'),
      lecturaTitulo:    $('#lectura-titulo'),
      lecturaTituloBarra: $('#lectura-titulo-barra'),
      lecturaMeta:      $('#lectura-meta'),
      lecturaCuerpo:    $('#lectura-cuerpo'),
      volverLectura:    $('#volver-lectura'),
      btnProyectar:     $('#btn-proyectar')
    };

    if (!CFG || !DATOS) {
      console.error('Falta config.js o js/data/canciones.js.');
      return;
    }

    cargarCanciones();
    dom.cifraFondos.textContent = CFG.fondos.totalCss;

    // Deja marcado el filtro inicial que diga la configuración.
    Array.prototype.forEach.call(dom.filtros.querySelectorAll('.filtro'), function (b) {
      b.setAttribute('aria-pressed', String(parseInt(b.dataset.filtro, 10) === estado.filtro));
    });

    renderIndice();
    conectarEventos();
    leerRuta();                                // respeta un enlace directo
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
