// Datos de demostración con forma de backend: IDs, fechas ISO, relaciones y estados.
// Cada colección se puede sustituir por la API de Tienda Nube (products, orders, payment providers) sin tocar las pantallas.

export const HOY = "2026-10-13";

export const TIENDA = {
  nombre: "Casa Alba",
  lema: "Objetos para la mesa, el té y el verde de casa",
  locale: "es-AR",
  moneda: "ARS",
  whatsapp: "5491155550137",
  email: "hola@casaalba.com.ar",
  envioGratisDesde: 120000,
  descuentoTransferencia: 10,
  cuotasSinInteres: [3, 6],
};

export type CategoriaId = "te" | "mesa" | "verde" | "deco" | "textiles";

export interface Categoria {
  id: CategoriaId;
  nombre: string;
  descripcion: string;
  img: string;
}

export interface Variante {
  nombre: string;
  opciones: string[];
}

export interface Producto {
  id: string;
  slug: string;
  sku: string;
  nombre: string;
  categoria: CategoriaId;
  precio: number;
  precioAnterior: number | null;
  stock: number;
  img: string;
  galeria: string[];
  descripcion: string;
  material: string;
  medidas: string;
  pesoGr: number;
  variante: Variante | null;
  rating: number;
  resenas: number;
  nuevo: boolean;
  publicado: boolean;
  creado: string;
}

export interface ItemCarrito {
  productoId: string;
  cantidad: number;
  opcion: string | null;
}

export interface MedioPago {
  id: string;
  nombre: string;
  detalle: string;
  activo: boolean;
  comision: string;
}

export interface MetodoEnvio {
  id: string;
  nombre: string;
  detalle: string;
  activo: boolean;
}

export type Etapa = "Configuración" | "Catálogo" | "Pagos y envíos" | "Diseño" | "Lanzamiento";

export interface Tarea {
  id: string;
  etapa: Etapa;
  titulo: string;
  detalle: string;
  hecha: boolean;
}

export interface Pedido {
  id: string;
  fecha: string;
  cliente: string;
  email: string;
  items: ItemCarrito[];
  subtotal: number;
  envio: number;
  descuento: number;
  total: number;
  medio: string;
  entrega: string;
  estado: "pagado" | "pendiente" | "enviado";
}

export const CATEGORIAS: Categoria[] = [
  { id: "te", nombre: "Té y café", descripcion: "Teteras, tazas y todo el ritual", img: "/img/tetera-porcelana.jpg" },
  { id: "mesa", nombre: "Mesa", descripcion: "Gres, madera y tablas de servir", img: "/img/cena.jpg" },
  { id: "verde", nombre: "Verde", descripcion: "Macetas, canastos y cúpulas", img: "/img/verde.jpg" },
  { id: "deco", nombre: "Deco y luz", descripcion: "Jarrones, floreros y bronce", img: "/img/flores.jpg" },
  { id: "textiles", nombre: "Textiles", descripcion: "Lana y lino para el living", img: "/img/sala.jpg" },
];

const p = (
  id: number, slug: string, nombre: string, categoria: CategoriaId, precio: number, stock: number, img: string, extra: string[],
  descripcion: string, material: string, medidas: string, pesoGr: number, rating: number, resenas: number, creado: string,
  o: Partial<Pick<Producto, "precioAnterior" | "variante" | "nuevo" | "publicado">> = {},
): Producto => ({
  id: `p${id}`, slug, sku: `CA-${categoria.slice(0, 2).toUpperCase()}-${String(100 + id)}`, nombre, categoria, precio, stock,
  img: `/img/${img}.jpg`, galeria: [img, ...extra].map((x) => `/img/${x}.jpg`), descripcion, material, medidas, pesoGr, rating, resenas,
  creado, precioAnterior: null, variante: null, nuevo: false, publicado: true, ...o,
});

export const PRODUCTOS: Producto[] = [
  p(1, "tetera-hierro-kuro", "Tetera de hierro fundido Kuro", "te", 89900, 7, "tetera-hierro", ["tetera-vidrio", "cena"],
    "Hierro fundido con interior esmaltado y filtro de acero. Mantiene el calor casi una hora y mejora con el uso.",
    "Hierro fundido esmaltado", "16 cm de diámetro · 800 ml", 1900, 4.9, 38, "2026-08-04", { precioAnterior: 104900 }),
  p(2, "tetera-porcelana-nube", "Tetera de porcelana Nube", "te", 54900, 12, "tetera-porcelana", ["taza-gris", "sala"],
    "Porcelana blanca de pared fina, con pico que no gotea y tapa con traba. Apta para lavavajillas.",
    "Porcelana", "14 cm de alto · 900 ml", 720, 4.7, 24, "2026-07-18"),
  p(3, "tetera-vidrio-infusor", "Tetera de vidrio con infusor", "te", 46900, 9, "tetera-vidrio", ["tetera-roja", "cena"],
    "Vidrio borosilicato resistente al calor, con infusor desmontable para hebras. Se ve cómo el té toma color.",
    "Vidrio borosilicato y acero", "13 cm de alto · 1 litro", 540, 4.6, 19, "2026-09-02", { nuevo: true }),
  p(4, "tetera-esmaltada-roja", "Tetera esmaltada Amapola", "te", 61900, 4, "tetera-roja", ["tetera-porcelana", "taza-rayada"],
    "Gres esmaltado a mano en rojo amapola. Cada pieza sale del horno con un tono apenas distinto.",
    "Gres esmaltado", "15 cm de alto · 750 ml", 880, 4.8, 15, "2026-06-11"),
  p(5, "taza-gres-sol", "Taza de gres rayada Sol", "te", 18900, 26, "taza-rayada", ["taza-gris", "tetera-roja"],
    "Taza torneada con rayas pintadas a pincel. El esmalte interior es liso para que no se manche con el café.",
    "Gres esmaltado", "9 cm de alto · 320 ml", 340, 4.9, 61, "2026-05-22",
    { variante: { nombre: "Color", opciones: ["Amarillo sol", "Azul tinta", "Verde musgo"] } }),
  p(6, "taza-gres-niebla", "Taza de gres Niebla", "te", 16900, 0, "taza-gris", ["taza-rayada", "tetera-porcelana"],
    "Esmalte mate en gris niebla y asa amplia. Pensada para el primer café del día.",
    "Gres esmaltado mate", "10 cm de alto · 350 ml", 360, 4.5, 27, "2026-04-30"),
  p(7, "set-platos-gres-humo", "Set de platos de gres Humo", "mesa", 72900, 8, "platos-gres", ["cena", "hero"],
    "Plato playo, plato de postre y cuenco en gres color humo con borde irregular. El set es para una persona.",
    "Gres de alta temperatura", "27 cm · 21 cm · 12 cm", 1650, 4.8, 44, "2026-08-21",
    { precioAnterior: 84900, variante: { nombre: "Presentación", opciones: ["Set x 1", "Set x 2", "Set x 4"] } }),
  p(8, "cuenco-madera-algarrobo", "Cuenco de madera de algarrobo", "mesa", 39900, 11, "cuenco-madera", ["tabla-servir", "cena"],
    "Torneado en una sola pieza de algarrobo y curado con aceite mineral. Para frutas, ensaladas o pan.",
    "Algarrobo macizo", "26 cm de diámetro · 7 cm de alto", 690, 4.7, 22, "2026-07-03"),
  p(9, "tabla-servir-mango", "Tabla de servir con mango", "mesa", 32900, 14, "tabla-servir", ["tabla-pan", "cuenco-madera"],
    "Tabla de lenga con mango y ojal para colgar. Viene con un cuenco de cerámica blanca para salsas.",
    "Lenga y cerámica", "38 x 18 cm", 820, 4.8, 33, "2026-09-10", { nuevo: true }),
  p(10, "tabla-pan-lenga", "Tabla de pan de lenga", "mesa", 44900, 6, "tabla-pan", ["tabla-servir", "hero"],
    "Tabla grande para pan y quesos, con canal perimetral y correa de cuero para colgar.",
    "Lenga maciza y cuero", "45 x 30 cm", 1400, 4.6, 17, "2026-06-27"),
  p(11, "maceta-esfera-grafito", "Maceta esfera Grafito", "verde", 24900, 18, "maceta-esfera", ["verde", "macetas-terracota"],
    "Maceta esférica en gres negro mate con orificio de drenaje. Ideal para suculentas y cactus.",
    "Gres mate", "14 cm de diámetro", 610, 4.9, 52, "2026-05-09",
    { variante: { nombre: "Tamaño", opciones: ["Chica 10 cm", "Mediana 14 cm", "Grande 20 cm"] } }),
  p(12, "macetas-terracota-x3", "Macetas de terracota x 3", "verde", 28900, 10, "macetas-terracota", ["verde", "maceta-esfera"],
    "Tres macetas de terracota cocida en tamaños escalonados, con sus platos. La arcilla respira y cuida la raíz.",
    "Terracota", "12, 15 y 18 cm de diámetro", 2100, 4.7, 29, "2026-07-29"),
  p(13, "cupula-vidrio-base", "Cúpula de vidrio con base", "verde", 36900, 5, "cupula-vidrio", ["maceta-esfera", "sala"],
    "Campana de vidrio soplado sobre base de madera clara. Para armar un terrario o proteger una pieza.",
    "Vidrio soplado y madera", "22 cm de alto · 12 cm de diámetro", 780, 4.6, 12, "2026-09-18", { nuevo: true }),
  p(14, "canasto-mimbre-planta", "Canasto de mimbre para planta", "verde", 21900, 15, "canasto-mimbre", ["canasto-flores", "verde"],
    "Cubremaceta tejido a mano en mimbre natural, con interior impermeable.",
    "Mimbre natural", "16 cm de alto · 15 cm de diámetro", 260, 4.5, 21, "2026-06-05"),
  p(15, "canasto-recolector", "Canasto recolector con asa", "deco", 34900, 7, "canasto-flores", ["canasto-mimbre", "flores"],
    "Canasto bajo con asa alta, tejido en mimbre. Para flores, pan o para dejar en la entrada.",
    "Mimbre natural", "38 x 26 cm · 30 cm con asa", 520, 4.7, 14, "2026-08-13"),
  p(16, "jarron-botella-musgo", "Jarrón botella Musgo", "deco", 42900, 9, "jarron-musgo", ["flores", "florero-cobre"],
    "Jarrón de cuello angosto en esmalte verde profundo. Con una sola rama ya arma el rincón.",
    "Cerámica esmaltada", "24 cm de alto", 930, 4.9, 31, "2026-08-30", { precioAnterior: 49900 }),
  p(17, "florero-vidrio-cobre", "Florero de vidrio y cobre", "deco", 38900, 13, "florero-cobre", ["flores", "jarron-musgo"],
    "Botella de vidrio con base bañada en cobre. Queda bien sola o con peonías recién cortadas.",
    "Vidrio y baño de cobre", "21 cm de alto", 480, 4.6, 18, "2026-07-12"),
  p(18, "candelabro-bronce", "Candelabro de bronce con plato", "deco", 47900, 6, "candelabro", ["palmatoria", "sala"],
    "Candelabro de bronce macizo con plato recolector y regulador de altura. Incluye dos velas de cera.",
    "Bronce macizo", "19 cm de alto", 640, 4.8, 23, "2026-05-17"),
  p(19, "palmatoria-bronce", "Palmatoria de bronce con apagavelas", "deco", 52900, 3, "palmatoria", ["candelabro", "sala"],
    "Palmatoria circular con asa y apagavelas a juego. El bronce toma pátina con el tiempo.",
    "Bronce", "15 cm de diámetro", 710, 4.7, 9, "2026-09-24", { nuevo: true }),
  p(20, "lampara-escritorio-tiza", "Lámpara de escritorio Tiza", "deco", 78900, 5, "lampara", ["dormitorio", "sala"],
    "Lámpara de brazo flexible en acabado tiza, con cable textil y luz cálida regulable.",
    "Acero pintado y cable textil", "46 cm de alto", 1300, 4.5, 16, "2026-06-19"),
  p(21, "manta-lana-escocesa", "Manta de lana a cuadros", "textiles", 94900, 8, "manta", ["sala", "dormitorio"],
    "Manta tejida en lana merino con flecos, cuadros en crudo y rosa viejo. Abriga sin pesar.",
    "Lana merino", "130 x 170 cm", 1100, 4.9, 47, "2026-04-14", { precioAnterior: 112900 }),
  p(22, "almohadones-lino-x2", "Almohadones de lino x 2", "textiles", 58900, 10, "sala", ["dormitorio", "manta"],
    "Par de fundas de lino lavado con relleno de vellón siliconado. Cierre invisible y costura francesa.",
    "Lino lavado", "45 x 45 cm", 900, 4.6, 26, "2026-07-08",
    { variante: { nombre: "Color", opciones: ["Petróleo", "Gris perla", "Crudo"] } }),
  p(23, "juego-sabanas-lino", "Juego de sábanas de lino", "textiles", 164900, 4, "dormitorio", ["sala", "manta"],
    "Sábana ajustable, sábana plana y dos fundas en lino lavado. Fresco en verano y tibio en invierno.",
    "Lino lavado 160 g", "Queen 160 x 200 cm", 2300, 4.8, 11, "2026-09-05", { publicado: false }),
];

export const MEDIOS_PAGO: MedioPago[] = [
  { id: "mercadopago", nombre: "Mercado Pago", detalle: "Tarjetas, dinero en cuenta y cuotas sin interés", activo: true, comision: "Acreditación en 10 días" },
  { id: "tarjeta", nombre: "Tarjeta de crédito o débito", detalle: "Visa, Mastercard, Amex y Cabal en 3 y 6 cuotas", activo: true, comision: "Pago Nube" },
  { id: "transferencia", nombre: "Transferencia bancaria", detalle: `${TIENDA.descuentoTransferencia} % de descuento, se confirma con el comprobante`, activo: true, comision: "Sin comisión" },
  { id: "efectivo", nombre: "Efectivo en puntos de pago", detalle: "Cupón para pagar en Rapipago o Pago Fácil", activo: false, comision: "Acreditación en 48 h" },
];

export const METODOS_ENVIO: MetodoEnvio[] = [
  { id: "andreani", nombre: "Andreani a domicilio", detalle: "Cotiza por código postal y peso", activo: true },
  { id: "correo", nombre: "Correo Argentino a sucursal", detalle: "La opción más económica al interior", activo: true },
  { id: "retiro", nombre: "Retiro en el showroom", detalle: "Lunes a viernes de 10 a 18 h, sin costo", activo: true },
  { id: "moto", nombre: "Moto en el día", detalle: "Solo dentro de la ciudad, pedidos hasta las 14 h", activo: false },
];

export const TAREAS: Tarea[] = [
  { id: "t1", etapa: "Configuración", titulo: "Cuenta de Tienda Nube y plan", detalle: "Alta de la cuenta a nombre del negocio y elección del plan según volumen.", hecha: true },
  { id: "t2", etapa: "Configuración", titulo: "Datos fiscales y de contacto", detalle: "CUIT, razón social, correo de atención y políticas de cambio.", hecha: true },
  { id: "t3", etapa: "Configuración", titulo: "Dominio propio y certificado", detalle: "Dominio .com.ar apuntado a la tienda con HTTPS activo.", hecha: false },
  { id: "t4", etapa: "Catálogo", titulo: "Planilla maestra de productos", detalle: "Nombre, SKU, precio, stock, peso y medidas en una sola planilla.", hecha: true },
  { id: "t5", etapa: "Catálogo", titulo: "Carga masiva y variantes", detalle: "Importación por CSV con colores y tamaños como variantes.", hecha: true },
  { id: "t6", etapa: "Catálogo", titulo: "Fotos optimizadas y textos", detalle: "Fotos a 1200 px, fondo parejo y descripción propia por producto.", hecha: false },
  { id: "t7", etapa: "Pagos y envíos", titulo: "Medios de pago y cuotas", detalle: "Mercado Pago o Pago Nube con cuotas sin interés y transferencia con descuento.", hecha: true },
  { id: "t8", etapa: "Pagos y envíos", titulo: "Envíos por código postal", detalle: "Andreani y Correo Argentino cotizando con peso y medidas reales.", hecha: false },
  { id: "t9", etapa: "Diseño", titulo: "Plantilla adaptada a la marca", detalle: "Colores, tipografías, logo y portada sobre una plantilla oficial.", hecha: true },
  { id: "t10", etapa: "Diseño", titulo: "Revisión en celular", detalle: "Menú, buscador, ficha y carrito probados en pantallas chicas.", hecha: false },
  { id: "t11", etapa: "Lanzamiento", titulo: "Compra de prueba completa", detalle: "Un pedido real por cada medio de pago, con su correo y su envío.", hecha: false },
  { id: "t12", etapa: "Lanzamiento", titulo: "Medición y catálogo de anuncios", detalle: "Google Analytics, píxel de Meta y catálogo sincronizado.", hecha: false },
];

export const PEDIDOS: Pedido[] = [
  { id: "#1042", fecha: "2026-10-12", cliente: "Lucía Ferreyra", email: "lucia.ferreyra@gmail.com", items: [{ productoId: "p1", cantidad: 1, opcion: null }, { productoId: "p5", cantidad: 2, opcion: "Amarillo sol" }], subtotal: 127700, envio: 0, descuento: 0, total: 127700, medio: "Mercado Pago", entrega: "Andreani a domicilio", estado: "pagado" },
  { id: "#1041", fecha: "2026-10-11", cliente: "Tomás Aguirre", email: "taguirre@outlook.com", items: [{ productoId: "p21", cantidad: 1, opcion: null }], subtotal: 94900, envio: 7800, descuento: 9490, total: 93210, medio: "Transferencia bancaria", entrega: "Correo Argentino a sucursal", estado: "pendiente" },
  { id: "#1040", fecha: "2026-10-10", cliente: "Carolina Méndez", email: "caro.mendez@gmail.com", items: [{ productoId: "p11", cantidad: 3, opcion: "Mediana 14 cm" }, { productoId: "p14", cantidad: 1, opcion: null }], subtotal: 96600, envio: 4900, descuento: 0, total: 101500, medio: "Tarjeta de crédito o débito", entrega: "Andreani a domicilio", estado: "enviado" },
  { id: "#1039", fecha: "2026-10-09", cliente: "Federico Sosa", email: "fede.sosa@yahoo.com.ar", items: [{ productoId: "p7", cantidad: 1, opcion: "Set x 2" }], subtotal: 72900, envio: 0, descuento: 0, total: 72900, medio: "Mercado Pago", entrega: "Retiro en el showroom", estado: "enviado" },
];

export const ACENTOS = [
  { id: "arcilla", nombre: "Arcilla", color: "#f2a876", claro: "#ffd9b8", tinta: "#3b1f10" },
  { id: "salvia", nombre: "Salvia", color: "#a9dcae", claro: "#d9f5dc", tinta: "#143220" },
  { id: "miel", nombre: "Miel", color: "#f4cf72", claro: "#ffecb8", tinta: "#3a2a05" },
  { id: "rosa", nombre: "Rosa viejo", color: "#f0a6b4", claro: "#ffd6dd", tinta: "#3d1420" },
] as const;

export type AcentoId = (typeof ACENTOS)[number]["id"];

// ---------- utilidades ----------
const moneda = new Intl.NumberFormat(TIENDA.locale, { style: "currency", currency: TIENDA.moneda, maximumFractionDigits: 0 });
export const fmtMoney = (n: number) => moneda.format(Math.round(n));

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const fmtFecha = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]}`;
};

export const categoria = (id: CategoriaId) => CATEGORIAS.find((c) => c.id === id)!;
export const cuota = (precio: number, n: number) => precio / n;
export const descuentoPct = (x: Pick<Producto, "precio" | "precioAnterior">) =>
  x.precioAnterior ? Math.round((1 - x.precio / x.precioAnterior) * 100) : 0;

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export interface Cotizacion {
  id: string;
  nombre: string;
  plazo: string;
  costo: number;
}

/** Cotización de demostración: zona por primer dígito del código postal y recargo por peso. */
export function cotizarEnvio(cp: string, subtotal: number, pesoGr: number, metodos: MetodoEnvio[]): Cotizacion[] {
  const cerca = cp.startsWith("1");
  const extra = Math.max(0, Math.ceil((pesoGr - 2000) / 1000)) * 900;
  const gratis = subtotal >= TIENDA.envioGratisDesde;
  const activos = new Set(metodos.filter((m) => m.activo).map((m) => m.id));
  const lista: Cotizacion[] = [];
  if (activos.has("andreani")) lista.push({ id: "andreani", nombre: "Andreani a domicilio", plazo: cerca ? "Llega en 2 a 3 días hábiles" : "Llega en 4 a 6 días hábiles", costo: gratis ? 0 : (cerca ? 4900 : 7800) + extra });
  if (activos.has("correo")) lista.push({ id: "correo", nombre: "Correo Argentino a sucursal", plazo: cerca ? "Llega en 3 a 4 días hábiles" : "Llega en 5 a 8 días hábiles", costo: gratis ? 0 : (cerca ? 3600 : 5900) + extra });
  if (activos.has("moto") && cerca) lista.push({ id: "moto", nombre: "Moto en el día", plazo: "Hoy, si el pedido entra antes de las 14 h", costo: 6500 });
  if (activos.has("retiro")) lista.push({ id: "retiro", nombre: "Retiro en el showroom", plazo: "Listo en 24 h · Gorriti 4850, Palermo", costo: 0 });
  return lista;
}

export const cpValido = (cp: string) => /^\d{4}$/.test(cp.trim());
