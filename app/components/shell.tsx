"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Amphora, ArrowRight, BadgePercent, CreditCard, Heart, Home, LayoutGrid, Menu, PackageOpen, Rocket, RotateCcw, Search, ShoppingBag,
  Trash2, Truck, X,
} from "lucide-react";
import { FaCcAmex, FaCcMastercard, FaCcVisa, FaInstagram, FaPinterestP, FaWhatsapp } from "react-icons/fa6";
import { SiMercadopago } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Cantidad, Foto, Vacio, btnAcento, btnGlass } from "@/components/bits";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { CATEGORIAS, TIENDA, categoria, fmtMoney } from "@/lib/data";

const NAV = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/productos", label: "Tienda", icon: LayoutGrid },
  { href: "/panel", label: "Panel de lanzamiento", corto: "Panel", icon: Rocket },
];

const AVISOS = [
  { icon: Truck, texto: `Envío gratis desde ${fmtMoney(TIENDA.envioGratisDesde)}` },
  { icon: CreditCard, texto: "3 y 6 cuotas sin interés con todas las tarjetas" },
  { icon: BadgePercent, texto: `${TIENDA.descuentoTransferencia} % de descuento por transferencia` },
  { icon: RotateCcw, texto: "Cambios sin cargo dentro de los 30 días" },
];

const activo = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

function Marca() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="glow-acento flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-acento-claro to-acento text-tinta">
        <Amphora className="size-5" />
      </span>
      <span>
        <span className="block font-heading text-xl leading-none font-semibold">{TIENDA.nombre}</span>
        <span className="block text-[11px] text-white/70">Objetos con oficio</span>
      </span>
    </Link>
  );
}

function Buscador({ className }: { className?: string }) {
  const router = useRouter();
  const { productos } = useStore();
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState(false);
  const res = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return productos
      .filter((x) => x.publicado && (x.nombre.toLowerCase().includes(t) || x.material.toLowerCase().includes(t) || categoria(x.categoria).nombre.toLowerCase().includes(t)))
      .slice(0, 5);
  }, [q, productos]);
  const ir = (href: string) => { router.push(href); setQ(""); setAbierto(false); };

  return (
    <form role="search" className={cn("relative min-w-0", className)} onSubmit={(e) => { e.preventDefault(); if (q.trim()) ir(`/productos?q=${encodeURIComponent(q.trim())}`); }}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/65" />
      <Input value={q} onChange={(e) => { setQ(e.target.value); setAbierto(true); }} onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)} aria-label="Buscar productos" placeholder="Buscar teteras, macetas, mantas"
        className="field h-11 pr-9 pl-10" />
      {q && (
        <button type="button" aria-label="Limpiar búsqueda" onClick={() => setQ("")} className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 text-white/70 hover:bg-white/15">
          <X className="size-4" />
        </button>
      )}
      {abierto && q.trim().length >= 2 && (
        <div className="glass-deep absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl p-1.5">
          {res.length === 0 ? (
            <p className="px-3 py-4 text-sm text-white/75">Sin resultados para “{q}”.</p>
          ) : (
            <>
              {res.map((x) => (
                <button key={x.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => ir(`/productos/${x.slug}`)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/12">
                  <Foto src={x.img} alt="" className="size-11 rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{x.nombre}</span>
                    <span className="block text-xs text-white/70">{categoria(x.categoria).nombre}</span>
                  </span>
                  <span className="tabular text-sm font-semibold">{fmtMoney(x.precio)}</span>
                </button>
              ))}
              <button type="submit" onMouseDown={(e) => e.preventDefault()} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-acento-claro hover:bg-white/12">
                Ver todos los resultados<ArrowRight className="size-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );
}

function Carrito() {
  const router = useRouter();
  const { lineas, subtotal, unidades, carritoAbierto, abrirCarrito, cambiarCantidad, quitar } = useStore();
  const falta = Math.max(0, TIENDA.envioGratisDesde - subtotal);
  return (
    <Sheet open={carritoAbierto} onOpenChange={abrirCarrito}>
      <SheetContent side="right" className="glass-deep w-full gap-0 border-0 p-0 text-white data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b border-white/15 p-5">
          <SheetTitle className="font-heading text-2xl font-semibold text-white">Tu carrito</SheetTitle>
          <SheetDescription className="text-white/75">
            {unidades === 0 ? "Todavía no hay productos." : `${unidades} ${unidades === 1 ? "producto" : "productos"} listos para comprar.`}
          </SheetDescription>
        </SheetHeader>
        {lineas.length === 0 ? (
          <Vacio icono={PackageOpen} titulo="El carrito está vacío" texto="Las piezas que se agreguen quedan guardadas aquí, incluso si se cierra la página.">
            <Button className={btnAcento} onClick={() => { abrirCarrito(false); router.push("/productos"); }}>Ver la tienda</Button>
          </Vacio>
        ) : (
          <>
            <div className="border-b border-white/15 px-5 py-3.5">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Truck className="size-4 text-acento-claro" />
                {falta > 0 ? <>Faltan <b className="tabular">{fmtMoney(falta)}</b> para el envío gratis</> : "Este pedido tiene envío gratis"}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(100, (subtotal / TIENDA.envioGratisDesde) * 100))}>
                <div className="h-full rounded-full bg-gradient-to-r from-salvia to-acento transition-[width] duration-500" style={{ width: `${Math.min(100, (subtotal / TIENDA.envioGratisDesde) * 100)}%` }} />
              </div>
            </div>
            <ul className="scroll-thin flex-1 divide-y divide-white/12 overflow-y-auto px-5">
              {lineas.map((l) => (
                <li key={`${l.productoId}-${l.opcion}`} className="flex gap-3.5 py-4">
                  <Link href={`/productos/${l.producto.slug}`} onClick={() => abrirCarrito(false)} className="shrink-0 overflow-hidden rounded-2xl border border-white/20">
                    <Foto src={l.producto.img} alt={l.producto.nombre} className="size-20" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm leading-snug font-semibold">{l.producto.nombre}</p>
                    {l.opcion && <p className="mt-0.5 text-xs text-white/70">{l.producto.variante?.nombre}: {l.opcion}</p>}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Cantidad compacto valor={l.cantidad} max={l.producto.stock} onChange={(n) => cambiarCantidad(l.productoId, l.opcion, n)} />
                      <p className="tabular font-heading text-lg font-semibold">{fmtMoney(l.importe)}</p>
                    </div>
                  </div>
                  <button type="button" aria-label={`Quitar ${l.producto.nombre}`} onClick={() => { quitar(l.productoId, l.opcion); toast("Producto quitado del carrito", { description: l.producto.nombre }); }}
                    className="self-start rounded-xl p-2 text-white/70 transition hover:bg-white/15 hover:text-white">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-white/15 p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-white/80">Subtotal</span>
                <span className="tabular font-heading text-2xl font-semibold">{fmtMoney(subtotal)}</span>
              </div>
              <p className="flex items-center justify-between rounded-2xl bg-white/10 px-3.5 py-2.5 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-salvia"><BadgePercent className="size-4" />Con transferencia</span>
                <span className="tabular text-sm font-bold">{fmtMoney(subtotal * (1 - TIENDA.descuentoTransferencia / 100))}</span>
              </p>
              <Button className={cn(btnAcento, "h-12 w-full text-base")} onClick={() => { abrirCarrito(false); router.push("/checkout"); }}>
                Iniciar compra<ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" className={cn(btnGlass, "w-full")} onClick={() => abrirCarrito(false)}>Seguir mirando</Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Pie() {
  return (
    <footer className="mx-auto mt-14 max-w-[1320px] px-3 pb-28 sm:px-5 lg:pb-8">
      <div className="glass grid gap-8 rounded-[1.75rem] p-6 sm:p-8 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Marca />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">
            Piezas de cerámica, madera, bronce y lino elegidas una por una en talleres pequeños. Enviamos a todo el país desde Buenos Aires.
          </p>
          <div className="mt-4 flex gap-2">
            {[{ I: FaInstagram, l: "Instagram", h: "https://www.instagram.com" }, { I: FaPinterestP, l: "Pinterest", h: "https://www.pinterest.com" }, { I: FaWhatsapp, l: "WhatsApp", h: `https://wa.me/${TIENDA.whatsapp}` }].map(({ I, l, h }) => (
              <a key={l} href={h} target="_blank" rel="noreferrer" aria-label={l} className="glass-soft flex size-10 items-center justify-center rounded-2xl transition hover:bg-white/20"><I className="size-[18px]" /></a>
            ))}
          </div>
        </div>
        <nav aria-label="Categorías">
          <p className="text-xs font-bold tracking-[0.2em] text-acento-claro uppercase">Categorías</p>
          <ul className="mt-3 grid gap-2 text-sm">
            {CATEGORIAS.map((c) => <li key={c.id}><Link href={`/productos?cat=${c.id}`} className="text-white/85 hover:text-white hover:underline">{c.nombre}</Link></li>)}
          </ul>
        </nav>
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-acento-claro uppercase">Medios de pago</p>
          <div className="mt-3 flex flex-wrap items-center gap-2.5 text-white/90">
            <span className="glass-soft flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold"><SiMercadopago className="size-5" />Mercado Pago</span>
            {[FaCcVisa, FaCcMastercard, FaCcAmex].map((I, i) => <span key={i} className="glass-soft flex h-10 items-center rounded-xl px-2.5"><I className="size-7" aria-hidden /></span>)}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-white/70">
            Compra protegida con certificado SSL. Atención por correo en <a href={`mailto:${TIENDA.email}`} className="font-semibold text-white hover:underline">{TIENDA.email}</a>
          </p>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-white/65">© 2026 Casa Alba. Maqueta navegable de la tienda, lista para montarse en Tienda Nube.</p>
    </footer>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { unidades, favoritos, abrirCarrito } = useStore();
  const [menu, setMenu] = useState(false);
  const iconBtn = "relative size-11 rounded-2xl border-white/25 bg-white/10 dark:border-white/25 dark:bg-white/10 dark:hover:bg-white/20";

  return (
    <div className="min-h-dvh">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-acento focus:px-3 focus:py-2 focus:text-tinta">
        Saltar al contenido
      </a>

      <div className="overflow-hidden border-b border-white/15 bg-musgo/55 py-2 text-xs font-semibold backdrop-blur-md" aria-label="Beneficios de la tienda">
        <div className="animate-marquee flex w-max gap-10 pr-10 hover:[animation-play-state:paused]">
          {[...AVISOS, ...AVISOS, ...AVISOS, ...AVISOS].map((a, i) => (
            <span key={i} className="flex items-center gap-2 whitespace-nowrap" aria-hidden={i >= AVISOS.length}>
              <a.icon className="size-4 text-acento-claro" />{a.texto}
            </span>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
        <div className="glass-nav mx-auto flex max-w-[1320px] items-center gap-2.5 rounded-[1.4rem] p-2 sm:gap-3 sm:pl-3.5">
          <Button variant="outline" size="icon-lg" aria-label="Abrir menú" onClick={() => setMenu(true)} className={cn(iconBtn, "lg:hidden")}>
            <Menu className="size-5" />
          </Button>
          <Marca />
          <nav aria-label="Principal" className="ml-3 hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={activo(pathname, n.href) ? "page" : undefined}
                className={cn("flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  activo(pathname, n.href) ? "bg-white/20 text-white shadow-[inset_0_1px_0_rgb(255_255_255/35%)]" : "text-white/80 hover:bg-white/10 hover:text-white")}>
                <n.icon className={cn("size-4", activo(pathname, n.href) && "text-acento-claro")} />{n.label}
              </Link>
            ))}
          </nav>
          <Buscador className="ml-auto hidden flex-1 md:block md:max-w-sm" />
          <Button variant="outline" size="icon-lg" aria-label={`Favoritos: ${favoritos.length}`} nativeButton={false} render={<Link href="/productos?fav=1" />} className={cn(iconBtn, "ml-auto md:ml-0")}>
            <Heart className="size-5" />
            {favoritos.length > 0 && <span className="tabular absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-musgo">{favoritos.length}</span>}
          </Button>
          <Button variant="outline" aria-label={`Abrir carrito: ${unidades} productos`} onClick={() => abrirCarrito(true)}
            className={cn(iconBtn, "w-auto gap-2 px-3.5 font-semibold")}>
            <ShoppingBag className="size-5" />
            <span className="hidden sm:inline">Carrito</span>
            {unidades > 0 && <span key={unidades} className="animate-pop tabular flex size-5 items-center justify-center rounded-full bg-acento text-[11px] font-bold text-tinta">{unidades}</span>}
          </Button>
        </div>
        <div className="mx-auto mt-2 max-w-[1320px] md:hidden"><div className="glass-nav rounded-2xl p-1.5"><Buscador /></div></div>
      </header>

      <main id="contenido" key={pathname} className="mx-auto max-w-[1320px] space-y-12 px-3 pt-5 sm:px-5">
        <Suspense>{children}</Suspense>
      </main>
      <Pie />

      <a href={`https://wa.me/${TIENDA.whatsapp}?text=${encodeURIComponent("Hola, tengo una consulta sobre un producto de Casa Alba.")}`} target="_blank" rel="noreferrer"
        aria-label="Consultar por WhatsApp"
        className="animate-pulse-ring fixed right-4 bottom-24 z-30 flex size-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_14px_30px_-10px_rgb(0_0_0/60%)] transition hover:scale-105 lg:bottom-6">
        <FaWhatsapp className="size-7" />
      </a>

      <nav aria-label="Navegación móvil" className="glass-nav fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-[1.4rem] p-1.5 lg:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={activo(pathname, n.href) ? "page" : undefined}
            className={cn("flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition", activo(pathname, n.href) ? "bg-white/20 text-acento-claro" : "text-white/80")}>
            <n.icon className="size-5" />{n.corto ?? n.label}
          </Link>
        ))}
        <button type="button" onClick={() => abrirCarrito(true)} className="relative flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold text-white/80">
          <ShoppingBag className="size-5" />Carrito
          {unidades > 0 && <span className="tabular absolute top-1 right-1/4 flex size-4 items-center justify-center rounded-full bg-acento text-[10px] font-bold text-tinta">{unidades}</span>}
        </button>
      </nav>

      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="glass-deep w-72 border-0 p-4 text-white">
          <SheetHeader className="p-1.5 pb-4">
            <SheetTitle className="sr-only">Menú</SheetTitle>
            <SheetDescription className="sr-only">Navegación principal de Casa Alba</SheetDescription>
            <Marca />
          </SheetHeader>
          <nav aria-label="Menú" className="grid gap-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setMenu(false)}
                className={cn("flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold", activo(pathname, n.href) ? "bg-white/20" : "text-white/85 hover:bg-white/10")}>
                <n.icon className="size-4 text-acento-claro" />{n.label}
              </Link>
            ))}
            <p className="mt-4 px-3.5 text-xs font-bold tracking-[0.2em] text-acento-claro uppercase">Categorías</p>
            {CATEGORIAS.map((c) => (
              <Link key={c.id} href={`/productos?cat=${c.id}`} onClick={() => setMenu(false)} className="rounded-2xl px-3.5 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10">{c.nombre}</Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <Carrito />
    </div>
  );
}
