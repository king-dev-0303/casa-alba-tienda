"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Heart, Minus, Plus, ShoppingBag, Star, type LucideIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { TIENDA, categoria, cuota, descuentoPct, fmtMoney, type Producto } from "@/lib/data";

export const btnAcento =
  "glow-acento sheen relative h-11 rounded-2xl bg-gradient-to-b from-acento-claro to-acento px-5 text-sm font-bold text-tinta hover:brightness-105 active:translate-y-px";
export const btnGlass =
  "h-11 rounded-2xl border-white/30 bg-white/12 px-4 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/22 dark:border-white/30 dark:bg-white/12 dark:hover:bg-white/22";

export function useCargando(ms = 450) {
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setCargando(false), ms);
    return () => window.clearTimeout(t);
  }, [ms]);
  return cargando;
}

/** Imagen con respaldo: si el archivo falla, queda un degradado de la paleta y nunca un ícono roto. */
export function Foto({ src, alt, className, prioridad }: { src: string; alt: string; className?: string; prioridad?: boolean }) {
  const [fallo, setFallo] = useState(false);
  if (fallo) return <div role="img" aria-label={alt} className={cn("bg-gradient-to-br from-salvia/40 to-acento/40", className)} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={prioridad ? "eager" : "lazy"} onError={() => setFallo(true)} className={cn("object-cover", className)} />;
}

export function Chip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", className)}>
      {children}
    </span>
  );
}

export function Estrellas({ valor, resenas, className }: { valor: number; resenas?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold text-white/85", className)} aria-label={`${valor} de 5 estrellas`}>
      <Star className="size-3.5 fill-miel text-miel" />
      {valor.toFixed(1)}
      {resenas !== undefined && <span className="font-medium text-white/65">({resenas})</span>}
    </span>
  );
}

export function Precio({ producto, grande }: { producto: Producto; grande?: boolean }) {
  const n = TIENDA.cuotasSinInteres[TIENDA.cuotasSinInteres.length - 1];
  return (
    <div>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className={cn("tabular font-heading font-semibold", grande ? "text-4xl" : "text-xl")}>{fmtMoney(producto.precio)}</span>
        {producto.precioAnterior && <span className={cn("tabular text-white/60 line-through", grande ? "text-lg" : "text-sm")}>{fmtMoney(producto.precioAnterior)}</span>}
      </p>
      <p className={cn("text-white/75", grande ? "mt-1 text-sm" : "text-xs")}>
        {n} cuotas sin interés de <span className="tabular font-semibold text-acento-claro">{fmtMoney(cuota(producto.precio, n))}</span>
      </p>
    </div>
  );
}

export function Cantidad({ valor, max, onChange, compacto }: { valor: number; max: number; onChange: (n: number) => void; compacto?: boolean }) {
  const b = cn("flex items-center justify-center rounded-xl text-white transition hover:bg-white/18 disabled:opacity-40", compacto ? "size-8" : "size-10");
  return (
    <div className="glass-soft inline-flex items-center gap-1 rounded-2xl p-1" role="group" aria-label="Cantidad">
      <button type="button" className={b} aria-label="Restar una unidad" disabled={valor <= 1} onClick={() => onChange(valor - 1)}><Minus className="size-4" /></button>
      <span className={cn("tabular text-center font-semibold", compacto ? "w-6 text-sm" : "w-8")} aria-live="polite">{valor}</span>
      <button type="button" className={b} aria-label="Sumar una unidad" disabled={valor >= max} onClick={() => onChange(valor + 1)}><Plus className="size-4" /></button>
    </div>
  );
}

export function BotonFavorito({ producto, className }: { producto: Producto; className?: string }) {
  const { favoritos, toggleFavorito } = useStore();
  const activo = favoritos.includes(producto.id);
  return (
    <button type="button" aria-pressed={activo} aria-label={activo ? `Quitar ${producto.nombre} de favoritos` : `Guardar ${producto.nombre} en favoritos`}
      onClick={(e) => {
        e.preventDefault();
        const quedo = toggleFavorito(producto.id);
        toast(quedo ? "Guardado en favoritos" : "Quitado de favoritos", { description: producto.nombre });
      }}
      className={cn("chip-dark flex size-10 items-center justify-center rounded-full transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", className)}>
      <Heart className={cn("size-[18px] transition", activo ? "animate-pop fill-acento text-acento" : "text-white")} />
    </button>
  );
}

export function TarjetaProducto({ producto, delay = 0 }: { producto: Producto; delay?: number }) {
  const { agregar, abrirCarrito } = useStore();
  const off = descuentoPct(producto);
  const agotado = producto.stock === 0;
  return (
    <article className="glass group animate-rise flex flex-col overflow-hidden rounded-3xl" style={{ animationDelay: `${delay}ms` }}>
      <Link href={`/productos/${producto.slug}`} className="relative block aspect-[4/5] overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Foto src={producto.img} alt={producto.nombre} className={cn("size-full transition duration-700 group-hover:scale-110", agotado && "opacity-60 grayscale-[35%]")} />
        <div className="absolute inset-0 bg-gradient-to-t from-musgo/75 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {agotado && <Chip className="chip-dark border-white/35 text-white">Sin stock</Chip>}
          {!agotado && off > 0 && <Chip className="border-transparent bg-acento text-tinta">{off} % OFF</Chip>}
          {!agotado && producto.nuevo && <Chip className="border-transparent bg-salvia text-[#143220]">Nuevo</Chip>}
        </div>
        <p className="absolute bottom-3 left-3 text-[11px] font-bold tracking-[0.16em] text-white/85 uppercase">{categoria(producto.categoria).nombre}</p>
      </Link>
      <BotonFavorito producto={producto} className="absolute top-3 right-3" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/productos/${producto.slug}`} className="line-clamp-2 font-heading text-[17px] leading-snug font-semibold hover:underline">{producto.nombre}</Link>
          <Estrellas valor={producto.rating} className="mt-1 shrink-0" />
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <Precio producto={producto} />
          {producto.variante ? (
            <Link href={`/productos/${producto.slug}`} aria-label={`Elegir ${producto.variante.nombre.toLowerCase()} de ${producto.nombre}`}
              className="flex h-10 shrink-0 items-center rounded-2xl border border-white/30 bg-white/12 px-3 text-xs font-bold transition hover:bg-white/22">
              Opciones
            </Link>
          ) : (
            <button type="button" disabled={agotado} aria-label={`Agregar ${producto.nombre} al carrito`}
              onClick={() => {
                agregar(producto.id, 1, null);
                toast.success("Agregado al carrito", { description: producto.nombre, action: { label: "Ver carrito", onClick: () => abrirCarrito(true) } });
              }}
              className="glow-acento flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-acento-claro to-acento text-tinta transition hover:brightness-105 active:translate-y-px disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none">
              <ShoppingBag className="size-[18px]" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function TarjetaEsqueleto() {
  return (
    <div className="glass overflow-hidden rounded-3xl" aria-hidden>
      <div className="aspect-[4/5] animate-pulse bg-white/12" />
      <div className="space-y-2.5 p-4">
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-white/15" />
        <div className="h-6 w-2/5 animate-pulse rounded-full bg-white/15" />
        <div className="h-3 w-3/5 animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  );
}

export function Vacio({ icono: Icono, titulo, texto, children }: { icono: LucideIcon; titulo: string; texto: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="glass-soft flex size-14 items-center justify-center rounded-2xl text-acento"><Icono className="size-6" /></span>
      <h3 className="text-xl font-semibold">{titulo}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-white/75">{texto}</p>
      {children}
    </div>
  );
}

export function Campo({ label, htmlFor, error, hint, children, className }: { label: string; htmlFor: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-semibold text-white/85">{label}</label>
      {children}
      {error ? <p role="alert" className="text-xs font-medium text-bad">{error}</p> : hint ? <p className="text-xs text-white/65">{hint}</p> : null}
    </div>
  );
}

export interface Opcion { value: string; label: string }

export function Pick({ value, onChange, options, label, className, id }: { value: string; onChange: (v: string) => void; options: Opcion[]; label: string; className?: string; id?: string }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(String(v))} items={options}>
      <SelectTrigger id={id} aria-label={label} className={cn("field w-full", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="glass-deep" alignItemWithTrigger={false}>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function Titulo({ sobre, titulo, texto, children }: { sobre: string; titulo: React.ReactNode; texto?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="text-xs font-bold tracking-[0.2em] text-acento-claro uppercase">{sobre}</p>
        <h2 className="mt-1.5 text-3xl leading-tight font-semibold text-balance sm:text-4xl">{titulo}</h2>
        {texto && <p className="mt-2 text-[15px] leading-relaxed text-white/80">{texto}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
