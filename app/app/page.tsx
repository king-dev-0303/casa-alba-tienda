"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, ArrowUpRight, BadgePercent, CreditCard, Loader2, Mail, ShieldCheck, ShoppingBag, Sparkles, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Estrellas, Foto, TarjetaProducto, Titulo, btnAcento, btnGlass } from "@/components/bits";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { CATEGORIAS, TIENDA, descuentoPct, fmtMoney } from "@/lib/data";

const BENEFICIOS = [
  { icon: Truck, titulo: "Envíos a todo el país", texto: `Gratis desde ${fmtMoney(TIENDA.envioGratisDesde)}` },
  { icon: CreditCard, titulo: "3 y 6 cuotas sin interés", texto: "Con todas las tarjetas" },
  { icon: BadgePercent, titulo: `${TIENDA.descuentoTransferencia} % por transferencia`, texto: "Se aplica solo en el pago" },
  { icon: ShieldCheck, titulo: "Compra protegida", texto: "Cambios dentro de los 30 días" },
];

const FILTROS = [
  { id: "vendidos", label: "Más vendidos" },
  { id: "nuevos", label: "Novedades" },
  { id: "ofertas", label: "Ofertas" },
] as const;

export default function Inicio() {
  const { productos, agregar, abrirCarrito } = useStore();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["id"]>("vendidos");
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const visibles = productos.filter((x) => x.publicado);
  const estrella = visibles.find((x) => x.id === "p1") ?? visibles[0];
  const destacados = (
    filtro === "nuevos" ? visibles.filter((x) => x.nuevo)
    : filtro === "ofertas" ? visibles.filter((x) => descuentoPct(x) > 0)
    : [...visibles].sort((a, b) => b.resenas - a.resenas)
  ).slice(0, 4);

  const suscribir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo.trim())) return setError("Ese correo no parece válido. Revisa que tenga @ y dominio.");
    setEnviando(true);
    await new Promise((r) => setTimeout(r, 800));
    setEnviando(false);
    setCorreo("");
    toast.success("Suscripción confirmada", { description: "El cupón ALBA10 llega en unos minutos al correo indicado." });
  };

  return (
    <>
      <section className="relative isolate min-h-[560px] overflow-hidden rounded-[2rem] border border-white/25 shadow-[0_40px_90px_-45px_rgb(18_30_28/95%)] lg:min-h-[600px]">
        <Foto prioridad src="/img/hero.jpg" alt="Mesa de madera puesta con platos de gres, cubiertos y ramas verdes" className="animate-kenburns absolute inset-0 -z-20 size-full" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgb(40_62_56/94%)_0%,rgb(46_70_66/80%)_38%,rgb(60_80_76/22%)_72%,rgb(120_84_66/30%)_100%)]" />
        <div className="grid min-h-[560px] items-end gap-8 p-6 sm:p-10 lg:min-h-[600px] lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div className="animate-rise max-w-xl">
            <p className="chip-dark inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold tracking-[0.14em] uppercase">
              <Sparkles className="size-3.5 text-acento-claro" />Colección primavera 2026
            </p>
            <h1 className="mt-5 text-[2.6rem] leading-[1.04] font-semibold text-balance sm:text-6xl">
              La mesa puesta, el té servido y <span className="text-degrade italic">algo verde</span> en la ventana.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">
              Cerámica, madera, bronce y lino hechos en talleres pequeños. Piezas para usar todos los días, no para guardar.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button className={cn(btnAcento, "h-12 px-6 text-base")} nativeButton={false} render={<Link href="/productos" />}>Ver la tienda<ArrowRight className="size-4" /></Button>
              <Button variant="outline" className={cn(btnGlass, "h-12 px-5")} nativeButton={false} render={<Link href="/productos?orden=nuevos" />}>Novedades</Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/85">
              <span className="flex items-center gap-2"><Estrellas valor={4.8} /> en 1.240 reseñas</span>
              <span className="flex items-center gap-2"><Truck className="size-4 text-acento-claro" />Despacho en 24 h</span>
            </div>
          </div>

          {estrella && (
            <div className="relative hidden h-full min-h-[440px] lg:block">
              <div className="glass animate-float absolute top-6 right-4 w-72 rounded-[1.75rem] p-3">
                <Link href={`/productos/${estrella.slug}`} className="relative block overflow-hidden rounded-[1.25rem]">
                  <Foto src={estrella.img} alt={estrella.nombre} className="aspect-[4/3] w-full transition duration-700 hover:scale-105" />
                  <span className="absolute top-2.5 left-2.5 rounded-full bg-acento px-2.5 py-0.5 text-xs font-bold text-tinta">{descuentoPct(estrella)} % OFF</span>
                </Link>
                <div className="flex items-end justify-between gap-2 p-2 pt-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold tracking-[0.16em] text-acento-claro uppercase">La más elegida</p>
                    <p className="truncate font-heading text-lg font-semibold">{estrella.nombre}</p>
                    <p className="tabular text-sm font-semibold">{fmtMoney(estrella.precio)} <span className="ml-1 font-normal text-white/60 line-through">{estrella.precioAnterior && fmtMoney(estrella.precioAnterior)}</span></p>
                  </div>
                  <button type="button" aria-label={`Agregar ${estrella.nombre} al carrito`}
                    onClick={() => { agregar(estrella.id, 1, null); abrirCarrito(true); }}
                    className="glow-acento flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-acento-claro to-acento text-tinta transition hover:brightness-105">
                    <ShoppingBag className="size-5" />
                  </button>
                </div>
              </div>
              <div className="glass animate-float absolute bottom-6 left-0 flex w-64 items-center gap-3 rounded-3xl p-3 [animation-delay:-3.5s]">
                <Foto src="/img/macetas-terracota.jpg" alt="Macetas de terracota con suculentas" className="size-16 rounded-2xl" />
                <div>
                  <p className="text-xs text-white/75">Recién llegado</p>
                  <p className="font-heading leading-tight font-semibold">Macetas de terracota x 3</p>
                  <Link href="/productos/macetas-terracota-x3" className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-acento-claro hover:underline">Ver pieza<ArrowUpRight className="size-3.5" /></Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section aria-label="Beneficios" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {BENEFICIOS.map((b, i) => (
          <div key={b.titulo} className="glass sheen animate-rise flex items-center gap-3.5 rounded-3xl p-4 sm:p-5" style={{ animationDelay: `${i * 70}ms` }}>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-acento/22 text-acento-claro"><b.icon className="size-5" /></span>
            <div className="min-w-0">
              <p className="text-sm leading-tight font-bold">{b.titulo}</p>
              <p className="mt-0.5 text-xs text-white/75">{b.texto}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <Titulo sobre="Categorías" titulo="Cada rincón de la casa" texto="Cinco familias de productos, con filtros por precio y stock dentro de cada una." />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2">
          {CATEGORIAS.map((c, i) => (
            <Link key={c.id} href={`/productos?cat=${c.id}`}
              className={cn("group relative isolate block min-h-44 overflow-hidden rounded-3xl border border-white/25 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-52",
                i === 0 && "col-span-2 lg:row-span-2 lg:min-h-[26rem]")}>
              <Foto src={c.img} alt={c.descripcion} className="absolute inset-0 -z-10 size-full transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-musgo/90 via-musgo/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
                <div>
                  <h3 className={cn("font-semibold", i === 0 ? "text-3xl sm:text-4xl" : "text-2xl")}>{c.nombre}</h3>
                  <p className="mt-0.5 text-sm text-white/80">{c.descripcion} · {visibles.filter((x) => x.categoria === c.id).length} piezas</p>
                </div>
                <span className="chip-dark flex size-10 shrink-0 items-center justify-center rounded-full transition group-hover:bg-acento group-hover:text-tinta"><ArrowUpRight className="size-5" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <Titulo sobre="Selección" titulo="Lo que más se lleva">
          <div className="glass-soft flex rounded-2xl p-1" role="tablist" aria-label="Filtrar destacados">
            {FILTROS.map((f) => (
              <button key={f.id} type="button" role="tab" aria-selected={filtro === f.id} onClick={() => setFiltro(f.id)}
                className={cn("rounded-xl px-3.5 py-2 text-sm font-semibold transition", filtro === f.id ? "bg-acento text-tinta shadow-[inset_0_1px_0_rgb(255_255_255/50%)]" : "text-white/80 hover:text-white")}>
                {f.label}
              </button>
            ))}
          </div>
        </Titulo>
        <div key={filtro} className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {destacados.map((x, i) => <TarjetaProducto key={x.id} producto={x} delay={i * 70} />)}
        </div>
        <div className="flex justify-center">
          <Button variant="outline" className={btnGlass} nativeButton={false} render={<Link href="/productos" />}>Ver los {visibles.length} productos<ArrowRight className="size-4" /></Button>
        </div>
      </section>

      <section className="glass grid overflow-hidden rounded-[2rem] lg:grid-cols-2">
        <div className="relative min-h-72 overflow-hidden">
          <Foto src="/img/taller.jpg" alt="Manos de una ceramista torneando una pieza de arcilla" className="absolute inset-0 size-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-musgo/40" />
        </div>
        <div className="flex flex-col justify-center gap-5 p-6 sm:p-10">
          <p className="text-xs font-bold tracking-[0.2em] text-acento-claro uppercase">El oficio</p>
          <h2 className="text-3xl leading-tight font-semibold text-balance sm:text-4xl">Cada pieza pasa por las manos de quien la hizo.</h2>
          <p className="text-[15px] leading-relaxed text-white/85">
            Trabajamos con once talleres de cerámica, carpintería y telar. Compramos series cortas, por eso el stock que se ve en la tienda es el real y se actualiza con cada venta.
          </p>
          <dl className="grid grid-cols-3 gap-3">
            {[["11", "talleres"], [String(visibles.length), "piezas activas"], ["24 h", "para despachar"]].map(([n, l]) => (
              <div key={l} className="glass-soft rounded-2xl p-3.5">
                <dt className="sr-only">{l}</dt>
                <dd className="font-heading text-3xl font-semibold text-acento-claro">{n}</dd>
                <dd className="text-xs text-white/75">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="relative isolate overflow-hidden rounded-[2rem] border border-white/25">
        <Foto src="/img/dormitorio.jpg" alt="Dormitorio luminoso con ropa de cama de lino" className="absolute inset-0 -z-20 size-full" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(40_62_56/92%),rgb(46_70_66/72%)_55%,rgb(46_70_66/35%))]" />
        <div className="grid gap-6 p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <h2 className="text-3xl leading-tight font-semibold sm:text-4xl">10 % en la primera compra</h2>
            <p className="mt-2 max-w-md text-[15px] text-white/85">Una carta por mes con las piezas nuevas y el cupón de bienvenida. Sin correos de relleno.</p>
          </div>
          <form onSubmit={suscribir} noValidate className="glass rounded-3xl p-3">
            <label htmlFor="correo-boletin" className="sr-only">Correo electrónico</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/65" />
                <Input id="correo-boletin" type="email" required value={correo} aria-invalid={!!error} placeholder="nombre@correo.com"
                  onChange={(e) => { setCorreo(e.target.value); setError(""); }} className="field h-12 pl-10" />
              </div>
              <Button type="submit" disabled={enviando} className={cn(btnAcento, "h-12")}>
                {enviando ? <Loader2 className="size-4 animate-spin" /> : null}{enviando ? "Enviando" : "Quiero el cupón"}
              </Button>
            </div>
            {error && <p role="alert" className="px-1 pt-2 text-xs font-medium text-bad">{error}</p>}
          </form>
        </div>
      </section>
    </>
  );
}
