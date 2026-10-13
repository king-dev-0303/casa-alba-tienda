"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ACENTOS, HOY, MEDIOS_PAGO, METODOS_ENVIO, PEDIDOS, PRODUCTOS, TAREAS,
  type AcentoId, type ItemCarrito, type MedioPago, type MetodoEnvio, type Pedido, type Producto, type Tarea,
} from "@/lib/data";

export interface Linea extends ItemCarrito {
  producto: Producto;
  importe: number;
}

interface Store {
  productos: Producto[];
  carrito: ItemCarrito[];
  lineas: Linea[];
  unidades: number;
  subtotal: number;
  pesoGr: number;
  favoritos: string[];
  medios: MedioPago[];
  envios: MetodoEnvio[];
  tareas: Tarea[];
  pedidos: Pedido[];
  acento: AcentoId;
  carritoAbierto: boolean;
  abrirCarrito: (v: boolean) => void;
  producto: (id: string) => Producto | undefined;
  agregar: (productoId: string, cantidad: number, opcion: string | null) => void;
  cambiarCantidad: (productoId: string, opcion: string | null, cantidad: number) => void;
  quitar: (productoId: string, opcion: string | null) => void;
  toggleFavorito: (productoId: string) => boolean;
  guardarProducto: (prod: Producto) => void;
  eliminarProducto: (id: string) => void;
  toggleMedio: (id: string) => void;
  toggleEnvio: (id: string) => void;
  toggleTarea: (id: string) => void;
  crearPedido: (d: Omit<Pedido, "id" | "fecha" | "items" | "subtotal" | "estado">) => Pedido;
  setAcento: (id: AcentoId) => void;
}

const Ctx = createContext<Store | null>(null);
const CLAVE = "casa-alba";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [productos, setProductos] = useState(PRODUCTOS);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [medios, setMedios] = useState(MEDIOS_PAGO);
  const [envios, setEnvios] = useState(METODOS_ENVIO);
  const [tareas, setTareas] = useState(TAREAS);
  const [pedidos, setPedidos] = useState(PEDIDOS);
  const [acento, setAcento] = useState<AcentoId>("arcilla");
  const [carritoAbierto, abrirCarrito] = useState(false);
  const [listo, setListo] = useState(false);

  // El carrito y los favoritos sobreviven a una recarga, como en una tienda real.
  /* eslint-disable react-hooks/set-state-in-effect -- lectura única de localStorage tras hidratar */
  useEffect(() => {
    try {
      const g = JSON.parse(window.localStorage.getItem(CLAVE) ?? "{}");
      if (Array.isArray(g.carrito)) setCarrito(g.carrito);
      if (Array.isArray(g.favoritos)) setFavoritos(g.favoritos);
      if (ACENTOS.some((a) => a.id === g.acento)) setAcento(g.acento);
    } catch {
      // sin almacenamiento disponible: se sigue con el estado en memoria
    }
    setListo(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!listo) return;
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify({ carrito, favoritos, acento }));
    } catch {
      // idem
    }
  }, [carrito, favoritos, acento, listo]);

  useEffect(() => {
    const a = ACENTOS.find((x) => x.id === acento)!;
    const s = document.documentElement.style;
    s.setProperty("--acento", a.color);
    s.setProperty("--acento-claro", a.claro);
    s.setProperty("--acento-tinta", a.tinta);
  }, [acento]);

  const producto = (id: string) => productos.find((x) => x.id === id);

  const lineas = useMemo(
    () =>
      carrito.flatMap((i) => {
        const prod = productos.find((x) => x.id === i.productoId);
        return prod ? [{ ...i, producto: prod, importe: prod.precio * i.cantidad }] : [];
      }),
    [carrito, productos],
  );
  const unidades = lineas.reduce((s, l) => s + l.cantidad, 0);
  const subtotal = lineas.reduce((s, l) => s + l.importe, 0);
  const pesoGr = lineas.reduce((s, l) => s + l.producto.pesoGr * l.cantidad, 0);

  const mismo = (i: ItemCarrito, id: string, opcion: string | null) => i.productoId === id && i.opcion === opcion;

  const agregar: Store["agregar"] = (productoId, cantidad, opcion) => {
    const tope = producto(productoId)?.stock ?? 0;
    setCarrito((list) => {
      const ya = list.find((i) => mismo(i, productoId, opcion));
      if (!ya) return [...list, { productoId, opcion, cantidad: Math.min(cantidad, tope) }];
      return list.map((i) => (mismo(i, productoId, opcion) ? { ...i, cantidad: Math.min(i.cantidad + cantidad, tope) } : i));
    });
  };

  const cambiarCantidad: Store["cambiarCantidad"] = (productoId, opcion, cantidad) => {
    const tope = producto(productoId)?.stock ?? 0;
    setCarrito((list) =>
      list.map((i) => (mismo(i, productoId, opcion) ? { ...i, cantidad: Math.max(1, Math.min(cantidad, tope)) } : i)),
    );
  };

  const quitar: Store["quitar"] = (productoId, opcion) => setCarrito((list) => list.filter((i) => !mismo(i, productoId, opcion)));

  const toggleFavorito = (productoId: string) => {
    const estaba = favoritos.includes(productoId);
    setFavoritos((list) => (estaba ? list.filter((x) => x !== productoId) : [...list, productoId]));
    return !estaba;
  };

  const guardarProducto = (prod: Producto) =>
    setProductos((list) => (list.some((x) => x.id === prod.id) ? list.map((x) => (x.id === prod.id ? prod : x)) : [prod, ...list]));

  const eliminarProducto = (id: string) => {
    setProductos((list) => list.filter((x) => x.id !== id));
    setCarrito((list) => list.filter((i) => i.productoId !== id));
  };

  const toggleMedio = (id: string) => setMedios((list) => list.map((m) => (m.id === id ? { ...m, activo: !m.activo } : m)));
  const toggleEnvio = (id: string) => setEnvios((list) => list.map((m) => (m.id === id ? { ...m, activo: !m.activo } : m)));
  const toggleTarea = (id: string) => setTareas((list) => list.map((t) => (t.id === id ? { ...t, hecha: !t.hecha } : t)));

  const crearPedido: Store["crearPedido"] = (d) => {
    const pedido: Pedido = {
      ...d, id: `#${1043 + (pedidos.length - PEDIDOS.length)}`, fecha: HOY, items: carrito, subtotal,
      estado: d.medio === "Transferencia bancaria" ? "pendiente" : "pagado",
    };
    setPedidos((list) => [pedido, ...list]);
    setProductos((list) =>
      list.map((x) => {
        const n = carrito.filter((i) => i.productoId === x.id).reduce((s, i) => s + i.cantidad, 0);
        return n ? { ...x, stock: Math.max(0, x.stock - n) } : x;
      }),
    );
    setCarrito([]);
    return pedido;
  };

  return (
    <Ctx.Provider
      value={{
        productos, carrito, lineas, unidades, subtotal, pesoGr, favoritos, medios, envios, tareas, pedidos, acento, carritoAbierto,
        abrirCarrito, producto, agregar, cambiarCantidad, quitar, toggleFavorito, guardarProducto, eliminarProducto, toggleMedio,
        toggleEnvio, toggleTarea, crearPedido, setAcento,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore fuera de StoreProvider");
  return s;
}
