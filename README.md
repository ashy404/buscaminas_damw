# Buscaminas del jardín

## Estructura del proyecto

```
buscaminas-jardin/
├── index.html      → estructura (cabecera, marcadores, botones, tablero)
├── styles.css      → todos los estilos y la paleta de colores
├── script.js       → lógica del juego + configuración de imágenes
└── assets/         → AQUÍ van tus imágenes
```

## Dónde poner el nombre de tus imágenes

Abre **`script.js`** y mira las primeras líneas. Hay un bloque marcado así:

```
⬇⬇⬇  AQUÍ PONES EL NOMBRE DE TUS IMÁGENES  ⬇⬇⬇
```

Dentro está el objeto `ASSETS`. Solo tienes que cambiar la ruta de cada línea
por el nombre real de tu archivo:

```js
const ASSETS = {
  cesped: 'assets/cesped.png',
  tierra: 'assets/tierra.png',
  marca:  'assets/marca.png',
  mina:   'assets/mina.png',
  flores: {
    1: 'assets/flor-1.png',
    2: 'assets/flor-2.png',
    3: 'assets/flor-3.png',
    4: 'assets/flor-4.png',
    5: null,
    6: null,
    7: null,
    8: null,
  },
};
```

Es el **único sitio** donde hay que tocar nombres de archivo.

## Qué imagen es cada una

| Clave | Qué es | Cuándo se ve |
|---|---|---|
| `cesped` | Cuadrado verde | Casilla sin descubrir |
| `tierra` | Cuadrado marrón | Casilla descubierta sin minas alrededor |
| `marca` | Verde con el gusano rosa | Casilla marcada con clic derecho |
| `mina` | Gusano sobre tierra | Minas reveladas al perder |
| `flores[1..8]` | Flor de color sobre tierra | Número de minas adyacentes |

## Cómo deben ser las imágenes

- Cada imagen es una **casilla completa, con su fondo incluido** (igual que en tu
  hoja de assets), no un icono suelto.
- Cuadradas. Recomendado **64×64 px** o **128×128 px** (se escalan solas).
- Formatos válidos: `.png`, `.jpg`, `.svg`, `.webp`.
- El nombre debe coincidir **exactamente**, incluidas mayúsculas y extensión.
  `Cesped.PNG` no es lo mismo que `cesped.png`.

## Si te falta alguna imagen

- `mina` en `null` → usa la imagen de `marca`.
- Una flor en `null` → esa casilla se ve como tierra con el número escrito en color.
- Cualquier imagen que falte → la casilla se ve con su color de respaldo, definido
  en `styles.css` dentro de `:root`.

Es decir: el juego funciona aunque todavía no hayas puesto ninguna imagen.

## Cómo jugar

Abre `index.html` con doble clic en el navegador.

- **Clic izquierdo**: descubrir casilla
- **Clic derecho**: poner o quitar la marca

La primera casilla que pulses nunca es mina.

## Personalizar

**Colores** → `styles.css`, bloque `:root` del principio.

**Tamaño de las casillas** → `styles.css`, variable `--cell-size` (32px por defecto).

**Dificultades** → `script.js`, objeto `DIFICULTADES`:

```js
const DIFICULTADES = {
  facil:   { filas: 9,  columnas: 9,  minas: 10 },
  normal:  { filas: 16, columnas: 16, minas: 40 },
  dificil: { filas: 16, columnas: 30, minas: 99 },
};
```
