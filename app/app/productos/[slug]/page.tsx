"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BadgePercent, Check, ChevronRight, CreditCard, Layers, Loader2, MapPin, PackageCheck, RotateCcw, Ruler, SearchX, ShieldCheck,
  ShoppingBag, Truck, Weight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BotonFavorito, Cantidad, Chip, Estrellas, Foto, Precio, TarjetaProducto, Titulo, Vacio, btnAcento, btnGlass } from "@/components/bits";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { TIENDA, categoria, cotizarEnvio, cpValido, cuota, descuentoPct, fmtMoney, type Cotizacion } from "@/lib/data";

const tab = "h-10 flex-none rounded-xl px-4 text-sm font-semibold text-white/75 data-active:bg-acento data-active:text-tinta dark:data-active:bg-acento dark:data-active:text-tinta dark:data-active:border-transparent";

export default function Ficha() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { productos, envios, agregar, abrirCarrito } = useStore();
  const producto = productos.find((x) => x.slug === slug && x.publicado);

  const [foto, setFoto] = useState(0);
  const [opcion, setOpcion] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [faltaOpcion, setFaltaOpcion] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [cp, setCp] = useState("");
  const [cpError, setCpError] = useState("");
  const [cotizando, setCotizando] = useState(false);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[] | null>(null);

  if (!producto) {
    return (
      <div className="glass rounded-3xl">
        <Vacio icono={SearchX} titulo="Este producto ya no está disponible" texto="Puede que se haya agotado la serie o que el enlace esté mal escrito.">
          <Button className={btnAcento} nativeButton={false} render={<Link href="/productos" />}>Volver a la tienda</Button>
        </Vacio>
      </div>
    );
  }

  const cat = categoria(producto.categoria);
  const agotado = producto.stock === 0;
  const off = descuentoPct(producto);
  const relacionados = productos.filter((x) => x.publicado && x.categoria === producto.categoria && x.id !== producto.id).slice(0, 4);

  const validar = () => {
    if (producto.variante && !opcion) { setFaltaOpcion(true); return false; }
    return true;
  };

  const sumar = async (comprar: boolean) => {
    if (!validar()) return;
    setAgregando(true);
    await new Promise((r) => setTimeout(r, 450));
    agregar(producto.id, cantidad, opcion);
    setAgregando(false);
    if (comprar) return router.push("/checkout");
    toast.success("Agregado al carrito", { description: `${cantidad} × ${producto.nombre}${opcion ? ` · ${opcion}` : ""}` });
    abrirCarrito(true);
  };

  const cotizar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpValido(cp)) return setCpError("El código postal tiene 4 números, por ejemplo 1425.");
    setCotizando(true);
    setCotizaciones(null);
    await new Promise((r) => setTimeout(r, 700));
    setCotizaciones(cotizarEnvio(cp, producto.precio * cantidad, producto.pesoGr * cantidad, envios));
    setCotizando(false);
  };

  return (
    <>
      <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 text-sm text-white/75">
        <Link href="/" className="hover:text-white hover:underline">Inicio</Link><ChevronRight className="size-3.5" />
        <Link href="/productos" className="hover:text-white hover:underline">Tienda</Link><ChevronRight className="size-3.5" />
        <Link href={`/productos?cat=${cat.id}`} className="hover:text-white hover:underline">{cat.nombre}</Link><ChevronRight className="size-3.5" />
        <span className="font-semibold text-white">{producto.nombre}</span>
      </nav>

      <div className="!mt-5 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
        <section aria-label="Fotos del producto" className="animate-rise grid gap-3 self-start sm:grid-cols-[5.5rem_1fr] lg:sticky lg:top-24">
          <div className="no-scrollbar order-2 flex gap-2.5 overflow-x-auto sm:order-1 sm:flex-col">
            {producto.galeria.map((g, i) => (
              <button key={g} type="button" onClick={() => setFoto(i)} aria-label={`Ver foto ${i + 1}`} aria-pressed={foto === i}
                className={cn("shrink-0 overflow-hidden rounded-2xl border-2 transition", foto === i ? "border-acento shadow-[0_0_0_4px_rgb(255_255_255/12%)]" : "border-white/20 opacity-75 hover:opacity-100")}>
                <Foto src={g} alt="" className="size-20 sm:size-[5.5rem]" />
              </button>
            ))}
          </div>
          <div className="glass group relative order-1 overflow-hidden rounded-[2rem] p-2 sm:order-2">
            <div className="relative overflow-hidden rounded-[1.6rem]">
              <Foto key={foto} prioridad src={producto.galeria[foto]} alt={producto.nombre} className="animate-rise aspect-square w-full transition duration-700 group-hover:scale-105" />
              <div className="absolute top-3 left-3 flex gap-1.5">
                {off > 0 && <Chip className="border-transparent bg-acento text-tinta">{off} % OFF</Chip>}
                {producto.nuevo && <Chip className="border-transparent bg-salvia text-[#143220]">Nuevo</Chip>}
              </div>
              <BotonFavorito producto={producto} className="absolute top-3 right-3" />
            </div>
          </div>
        </section>

        <section className="glass animate-rise space-y-5 rounded-[2rem] p-5 sm:p-7" style={{ animationDelay: "90ms" }}>
          <div>
            <div className="flex items-center justify-between gap-3">
              <Link href={`/productos?cat=${cat.id}`} className="text-xs font-bold tracking-[0.2em] text-acento-claro uppercase hover:underline">{cat.nombre}</Link>
              <span className="text-xs text-white/65">SKU {producto.sku}</span>
            </div>
            <h1 className="mt-2 text-3xl leading-tight font-semibold text-balance sm:text-4xl">{producto.nombre}</h1>
            <div className="mt-2 flex items-center gap-3">
              <Estrellas valor={producto.rating} resenas={producto.resenas} />
              <span className={cn("flex items-center gap-1.5 text-xs font-semibold", agotado ? "text-bad" : producto.stock <= 5 ? "text-warn" : "text-ok")}>
                <span className="size-1.5 rounded-full bg-current" />
                {agotado ? "Sin stock" : producto.stock <= 5 ? `Quedan ${producto.stock}` : "En stock"}
              </span>
            </div>
          </div>

          <Precio producto={producto} grande />

          <div className="grid gap-2 sm:grid-cols-2">
            <p className="glass-soft flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-sm">
              <BadgePercent className="size-5 shrink-0 text-salvia" />
              <span><b className="tabular">{fmtMoney(producto.precio * (1 - TIENDA.descuentoTransferencia / 100))}</b> con transferencia</span>
            </p>
            <p className="glass-soft flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-sm">
              <CreditCard className="size-5 shrink-0 text-acento-claro" />
              <span>3 cuotas de <b className="tabular">{fmtMoney(cuota(producto.precio, 3))}</b></span>
            </p>
          </div>

          {producto.variante && (
            <fieldset>
              <legend className="text-sm font-semibold">{producto.variante.nombre}{opcion && <span className="font-normal text-white/75">: {opcion}</span>}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {producto.variante.opciones.map((o) => (
                  <button key={o} type="button" aria-pressed={opcion === o} onClick={() => { setOpcion(o); setFaltaOpcion(false); }}
                    className={cn("flex items-center gap-1.5 rounded-2xl border px-3.5 py-2.5 text-sm font-semibold transition",
                      opcion === o ? "border-acento bg-acento/25 text-acento-claro" : "border-white/25 bg-white/8 hover:bg-white/16")}>
                    {opcion === o && <Check className="size-4" />}{o}
                  </button>
                ))}
              </div>
              {faltaOpcion && <p role="alert" className="mt-2 text-xs font-medium text-bad">Falta elegir {producto.variante.nombre.toLowerCase()} antes de agregar.</p>}
            </fieldset>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Cantidad valor={cantidad} max={Math.max(1, producto.stock)} onChange={setCantidad} />
            <Button className={cn(btnAcento, "h-12 flex-1 text-base")} disabled={agotado || agregando} onClick={() => sumar(false)}>
              {agregando ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}
              {agotado ? "Sin stock" : agregando ? "Agregando" : "Agregar al carrito"}
            </Button>
          </div>
          <Button variant="outline" className={cn(btnGlass, "h-12 w-full")} disabled={agotado || agregando} onClick={() => sumar(true)}>Comprar ahora</Button>

          <form onSubmit={cotizar} noValidate className="glass-soft rounded-3xl p-4">
            <label htmlFor="cp" className="flex items-center gap-2 text-sm font-semibold"><Truck className="size-4 text-acento-claro" />Calcular envío</label>
            <div className="mt-2.5 flex gap-2">
              <div className="relative flex-1">
                <MapPin className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/65" />
                <Input id="cp" inputMode="numeric" maxLength={4} value={cp} aria-invalid={!!cpError} placeholder="Código postal"
                  onChange={(e) => { setCp(e.target.value.replace(/\D/g, "")); setCpError(""); }} className="field tabular pl-10" />
              </div>
              <Button type="submit" variant="outline" className={btnGlass} disabled={cotizando}>{cotizando ? <Loader2 className="size-4 animate-spin" /> : "Calcular"}</Button>
            </div>
            {cpError && <p role="alert" className="mt-2 text-xs font-medium text-bad">{cpError}</p>}
            {cotizando && <div className="mt-3 grid gap-2">{[0, 1].map((i) => <div key={i} className="h-12 animate-pulse rounded-2xl bg-white/12" />)}</div>}
            {cotizaciones && (
              <ul className="mt-3 grid gap-2" aria-live="polite">
                {cotizaciones.map((c) => (
                  <li key={c.id} className="animate-rise flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-3.5 py-2.5">
                    <span><span className="block text-sm font-semibold">{c.nombre}</span><span className="block text-xs text-white/70">{c.plazo}</span></span>
                    <span className={cn("tabular text-sm font-bold", c.costo === 0 && "text-ok")}>{c.costo === 0 ? "Gratis" : fmtMoney(c.costo)}</span>
                  </li>
                ))}
              </ul>
            )}
          </form>

          <ul className="grid grid-cols-3 gap-2 text-center text-xs font-medium text-white/85">
            {[{ I: ShieldCheck, t: "Compra protegida" }, { I: PackageCheck, t: "Despacho en 24 h" }, { I: RotateCcw, t: "30 días de cambio" }].map(({ I, t }) => (
              <li key={t} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/8 px-2 py-3"><I className="size-5 text-acento-claro" />{t}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="glass rounded-[2rem] p-5 sm:p-7">
        <Tabs defaultValue="descripcion" className="gap-5">
          <TabsList className="glass-soft h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-transparent p-1 group-data-horizontal/tabs:h-auto sm:w-fit">
            <TabsTrigger value="descripcion" className={tab}>Descripción</TabsTrigger>
            <TabsTrigger value="medidas" className={tab}>Medidas y cuidado</TabsTrigger>
            <TabsTrigger value="envios" className={tab}>Envíos y cambios</TabsTrigger>
          </TabsList>
          <TabsContent value="descripcion" className="max-w-3xl text-[15px] leading-relaxed text-white/85">
            <p>{producto.descripcion}</p>
            <p className="mt-3">Al ser una pieza hecha a mano, puede tener pequeñas diferencias de tono o textura respecto de la foto. Son parte del proceso y no un defecto.</p>
          </TabsContent>
          <TabsContent value="medidas">
            <dl className="grid gap-3 sm:grid-cols-3">
              {[{ I: Layers, k: "Material", v: producto.material }, { I: Ruler, k: "Medidas", v: producto.medidas }, { I: Weight, k: "Peso", v: `${(producto.pesoGr / 1000).toLocaleString("es-AR")} kg` }].map(({ I, k, v }) => (
                <div key={k} className="glass-soft flex items-center gap-3 rounded-2xl p-4">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-acento/22 text-acento-claro"><I className="size-5" /></span>
                  <div><dt className="text-xs text-white/70">{k}</dt><dd className="text-sm font-semibold">{v}</dd></div>
                </div>
              ))}
            </dl>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/80">Limpiar con paño húmedo y jabón neutro. La madera se cura con aceite mineral cada dos meses; el bronce recupera el brillo con un paño seco.</p>
          </TabsContent>
          <TabsContent value="envios" className="max-w-3xl space-y-3 text-[15px] leading-relaxed text-white/85">
            <p>Despachamos en 24 horas hábiles por Andreani o Correo Argentino, con seguimiento por correo. El envío es gratis desde {fmtMoney(TIENDA.envioGratisDesde)}.</p>
            <p>Si la pieza llega dañada, se repone sin costo enviando una foto dentro de las 72 horas. Los cambios se hacen dentro de los 30 días con el empaque original.</p>
          </TabsContent>
        </Tabs>
      </section>

      {relacionados.length > 0 && (
        <section className="space-y-6">
          <Titulo sobre="Combina con" titulo={`Más de ${cat.nombre.toLowerCase()}`} />
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {relacionados.map((x, i) => <TarjetaProducto key={x.id} producto={x} delay={i * 70} />)}
          </div>
        </section>
      )}
    </>
  );
}
