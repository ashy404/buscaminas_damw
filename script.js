
const ASSETS = {

  cesped: 'assets_buscagusanos/assets-png/tile-cesped.png',

  tierra: 'assets_buscagusanos/assets-png/tile-tierra.png',

  marca: 'assets_buscagusanos/assets-png/tile-marca-gusano.png',

  mina: 'assets_buscagusanos/assets-png/gusano-rosa.png',

  flores: {
    1: 'assets_buscagusanos/assets-png/tile-flor-1-amarillo.png',
    2: 'assets_buscagusanos/assets-png/tile-flor-2-naranja.png',
    3: 'assets_buscagusanos/assets-png/tile-flor-3-rojo.png',
    4: 'assets_buscagusanos/assets-png/tile-flor-4-lila.png',
    5: null,
    6: null,
    7: null,
    8: null,
  },
};

const DIFICULTADES = {
  facil:   { filas: 9,  columnas: 9,  minas: 10 },
  normal:  { filas: 16, columnas: 16, minas: 40 },
  dificil: { filas: 16, columnas: 30, minas: 99 },
};

const COLORES_NUMERO = {
  1: '#ecc23c', 2: '#e08a2a', 3: '#b23a2e', 4: '#9078c4',
  5: '#4a8f7a', 6: '#7a3a5a', 7: '#3a3a3a', 8: '#8a8a8a',
};


let filas, columnas, totalMinas;
let tablero = [];
let dificultadActual = 'normal';

let primerClic = true;
let partidaTerminada = false;
let marcasPuestas = 0;
let casillasDescubiertas = 0;

let segundos = 0;
let intervaloReloj = null;


const boardEl     = document.getElementById('board');
const timerEl     = document.getElementById('timer');
const mineCountEl = document.getElementById('mineCount');
const mineIconEl  = document.getElementById('mineIcon');
const overlayEl   = document.getElementById('overlay');
const statusTitle = document.getElementById('statusTitle');
const statusMsg   = document.getElementById('statusMsg');


function indice(fila, col) {
  return fila * columnas + col;
}

function elemento(fila, col) {
  return boardEl.children[indice(fila, col)];
}

function vecinas(fila, col) {
  const lista = [];
  for (let df = -1; df <= 1; df++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (df === 0 && dc === 0) continue;
      const f = fila + df;
      const c = col + dc;
      if (f >= 0 && f < filas && c >= 0 && c < columnas) lista.push([f, c]);
    }
  }
  return lista;
}

function ponerImagen(el, ruta) {
  el.style.backgroundImage = ruta ? `url('${ruta}')` : 'none';
}


function colocarMinas(filaSegura, colSegura) {
  tablero = Array.from({ length: filas * columnas }, () => ({
    mina: false,
    descubierta: false,
    marcada: false,
    numero: 0,
  }));

  let puestas = 0;
  while (puestas < totalMinas) {
    const f = Math.floor(Math.random() * filas);
    const c = Math.floor(Math.random() * columnas);

    // Zona segura alrededor del primer clic
    if (Math.abs(f - filaSegura) <= 1 && Math.abs(c - colSegura) <= 1) continue;

    const celda = tablero[indice(f, c)];
    if (!celda.mina) {
      celda.mina = true;
      puestas++;
    }
  }

  // Calcula cuántas minas tiene cada casilla alrededor
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const celda = tablero[indice(f, c)];
      if (celda.mina) continue;
      celda.numero = vecinas(f, c).filter(([vf, vc]) => tablero[indice(vf, vc)].mina).length;
    }
  }
}

/** Dibuja las casillas vacías (todas tapadas con césped) */
function dibujarTablero() {
  boardEl.style.gridTemplateColumns = `repeat(${columnas}, var(--cell-size))`;
  boardEl.innerHTML = '';

  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const div = document.createElement('div');
      div.className = 'cell covered';
      div.dataset.fila = f;
      div.dataset.col = c;

      ponerImagen(div, ASSETS.cesped);

      div.addEventListener('click', alHacerClic);
      div.addEventListener('contextmenu', alClicDerecho);

      boardEl.appendChild(div);
    }
  }
}


/* ---------------------------------------------------------
   INTERACCIÓN DEL JUGADOR
   --------------------------------------------------------- */

/** Clic izquierdo: descubrir una casilla */
function alHacerClic() {
  if (partidaTerminada) return;

  const f = Number(this.dataset.fila);
  const c = Number(this.dataset.col);

  // En el primer clic se genera el tablero y arranca el reloj
  if (primerClic) {
    colocarMinas(f, c);
    primerClic = false;
    arrancarReloj();
  }

  const celda = tablero[indice(f, c)];
  if (celda.marcada || celda.descubierta) return;

  if (celda.mina) {
    descubrirTodasLasMinas(f, c);
    terminarPartida(false);
    return;
  }

  descubrirEnCadena(f, c);
  comprobarVictoria();
}

/** Clic derecho: poner o quitar la marca (gusano) */
function alClicDerecho(evento) {
  evento.preventDefault();               // evita el menú del navegador
  if (partidaTerminada || primerClic) return;

  const f = Number(this.dataset.fila);
  const c = Number(this.dataset.col);
  const celda = tablero[indice(f, c)];
  if (celda.descubierta) return;

  celda.marcada = !celda.marcada;
  marcasPuestas += celda.marcada ? 1 : -1;
  actualizarContador();

  const el = elemento(f, c);
  el.classList.toggle('flagged', celda.marcada);
  ponerImagen(el, celda.marcada ? ASSETS.marca : ASSETS.cesped);
}


/* ---------------------------------------------------------
   DESCUBRIR CASILLAS
   --------------------------------------------------------- */

/**
 * Descubre una casilla y, si está vacía (0 minas alrededor),
 * sigue descubriendo las de al lado automáticamente.
 * Usa una pila en vez de recursión para no desbordar en tableros grandes.
 */
function descubrirEnCadena(filaInicial, colInicial) {
  const pila = [[filaInicial, colInicial]];

  while (pila.length) {
    const [f, c] = pila.pop();
    const celda = tablero[indice(f, c)];
    if (celda.descubierta || celda.marcada) continue;

    celda.descubierta = true;
    casillasDescubiertas++;

    const el = elemento(f, c);
    el.classList.remove('covered');
    el.classList.add('revealed');

    if (celda.numero > 0) {
      // Tiene minas alrededor: se muestra la flor correspondiente
      pintarNumero(el, celda.numero);
    } else {
      // Casilla vacía: tierra pelada y seguimos abriendo alrededor
      ponerImagen(el, ASSETS.tierra);
      for (const [vf, vc] of vecinas(f, c)) {
        const vecina = tablero[indice(vf, vc)];
        if (!vecina.descubierta && !vecina.mina && !vecina.marcada) {
          pila.push([vf, vc]);
        }
      }
    }
  }
}

/**
 * Muestra la flor del número indicado.
 * Si no hay imagen para ese número, escribe el número de color.
 */
function pintarNumero(el, numero) {
  const flor = ASSETS.flores[numero];

  if (flor) {
    ponerImagen(el, flor);
    return;
  }

  // Respaldo sin imagen: tierra + número
  ponerImagen(el, ASSETS.tierra);
  el.textContent = numero;
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.fontWeight = '700';
  el.style.color = COLORES_NUMERO[numero];
}

/** Al perder: descubre todas las minas que no estaban marcadas */
function descubrirTodasLasMinas(filaTocada, colTocada) {
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const celda = tablero[indice(f, c)];
      if (!celda.mina || celda.marcada) continue;

      const el = elemento(f, c);
      el.classList.remove('covered');
      el.classList.add('revealed');
      if (f === filaTocada && c === colTocada) el.classList.add('mine-hit');

      // Si no hay imagen específica de mina, se reutiliza la de la marca
      ponerImagen(el, ASSETS.mina || ASSETS.marca);
    }
  }
}


/* ---------------------------------------------------------
   RELOJ Y CONTADOR
   --------------------------------------------------------- */

function arrancarReloj() {
  segundos = 0;
  timerEl.textContent = '00:00';
  clearInterval(intervaloReloj);

  intervaloReloj = setInterval(() => {
    segundos++;
    const m = String(Math.floor(segundos / 60)).padStart(2, '0');
    const s = String(segundos % 60).padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
  }, 1000);
}

function pararReloj() {
  clearInterval(intervaloReloj);
}

/** Minas que quedan = total − marcas puestas */
function actualizarContador() {
  mineCountEl.textContent = totalMinas - marcasPuestas;
}


/* ---------------------------------------------------------
   FIN DE PARTIDA
   --------------------------------------------------------- */

/** Has ganado cuando has descubierto todo lo que no es mina */
function comprobarVictoria() {
  if (casillasDescubiertas === filas * columnas - totalMinas) {
    terminarPartida(true);
  }
}

function terminarPartida(haGanado) {
  partidaTerminada = true;
  pararReloj();
  overlayEl.classList.add('show');

  if (haGanado) {
    statusTitle.textContent = '¡Ganaste el jardín!';
    statusMsg.textContent = `Despejaste todo en ${timerEl.textContent}.`;
  } else {
    statusTitle.textContent = '¡Boom!';
    statusMsg.textContent = 'Un gusano estaba escondido bajo el césped.';
  }
}


/* ---------------------------------------------------------
   NUEVA PARTIDA
   --------------------------------------------------------- */
function nuevaPartida() {
  const conf = DIFICULTADES[dificultadActual];
  filas      = conf.filas;
  columnas   = conf.columnas;
  totalMinas = conf.minas;

  primerClic = true;
  partidaTerminada = false;
  marcasPuestas = 0;
  casillasDescubiertas = 0;

  pararReloj();
  timerEl.textContent = '00:00';
  actualizarContador();
  overlayEl.classList.remove('show');

  // Tablero vacío hasta el primer clic (las minas se colocan entonces)
  tablero = Array.from({ length: filas * columnas }, () => ({
    mina: false, descubierta: false, marcada: false, numero: 0,
  }));

  dibujarTablero();
}


/* ---------------------------------------------------------
   BOTONES
   --------------------------------------------------------- */
document.querySelectorAll('.diff').forEach(boton => {
  boton.addEventListener('click', () => {
    document.querySelectorAll('.diff').forEach(b => b.classList.remove('active'));
    boton.classList.add('active');
    dificultadActual = boton.dataset.diff;
    nuevaPartida();
  });
});

document.getElementById('restartBtn').addEventListener('click', nuevaPartida);
document.getElementById('overlayRestart').addEventListener('click', nuevaPartida);


/* ---------------------------------------------------------
   DECORACIÓN: puntitos de colores del fondo
   --------------------------------------------------------- */
function crearPuntitos(cantidad = 16) {
  const colores = ['var(--dot-red)', 'var(--dot-purple)', 'var(--dot-yellow)'];

  for (let i = 0; i < cantidad; i++) {
    const punto = document.createElement('div');
    punto.className = 'dot';

    const tam = 6 + Math.random() * 6;
    punto.style.width  = `${tam}px`;
    punto.style.height = `${tam}px`;
    punto.style.left   = `${Math.random() * 100}vw`;
    punto.style.top    = `${Math.random() * 100}vh`;
    punto.style.background = colores[i % colores.length];

    document.body.appendChild(punto);
  }
}


/* ---------------------------------------------------------
   ARRANQUE
   --------------------------------------------------------- */
mineIconEl.src = ASSETS.marca;   // icono del contador de minas
crearPuntitos();
nuevaPartida();
