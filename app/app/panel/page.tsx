"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Banknote, Check, CreditCard, Download, ExternalLink, Landmark, Loader2, Package, PackageSearch, Palette, Pencil, Plus, Receipt, Rocket,
  Search, ShoppingBag, Trash2, Truck, Wallet, type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Campo, Chip, Foto, Pick, TarjetaProducto, Vacio, btnAcento, btnGlass, useCargando } from "@/components/bits";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import {
  ACENTOS, CATEGORIAS, HOY, PRODUCTOS, categoria, fmtFecha, fmtMoney, slugify,
  type CategoriaId, type Etapa, type Pedido, type Producto,
} from "@/lib/data";

const TABS = [
  { id: "lanzamiento", label: "Lanzamiento", icon: Rocket },
  { id: "catalogo", label: "Catálogo", icon: Package },
  { id: "pagos", label: "Pagos y envíos", icon: CreditCard },
  { id: "diseno", label: "Diseño", icon: Palette },
  { id: "pedidos", label: "Pedidos", icon: Receipt },
];
const ETAPAS: Etapa[] = ["Configuración", "Catálogo", "Pagos y envíos", "Diseño", "Lanzamiento"];
const ICONO_MEDIO: Record<string, LucideIcon> = { mercadopago: Wallet, tarjeta: CreditCard, transferencia: Landmark, efectivo: Banknote };
const ESTADO: Record<Pedido["estado"], { label: string; cls: string }> = {
  pagado: { label: "Pagado", cls: "border-ok/50 bg-ok/15 text-ok" },
  pendiente: { label: "Esperando el pago", cls: "border-warn/50 bg-warn/15 text-warn" },
  enviado: { label: "Enviado", cls: "border-salvia/50 bg-salvia/15 text-salvia" },
};
const FOTOS = [...new Set(PRODUCTOS.map((x) => x.img))].map((src) => ({ value: src, label: src.replace("/img/", "").replace(".jpg", "").replaceAll("-", " ") }));
const OPC_CAT = CATEGORIAS.map((c) => ({ value: c.id, label: c.nombre }));
const tabCls = "h-10 flex-none gap-2 rounded-xl px-4 text-sm font-semibold text-white/75 data-active:bg-acento data-active:text-tinta dark:data-active:border-transparent dark:data-active:bg-acento dark:data-active:text-tinta";
const dialogCls = "glass-deep scroll-thin max-h-[92dvh] overflow-y-auto border-0 p-6 text-white sm:max-w-2xl";

const VACIO = { nombre: "", categoria: "te" as CategoriaId, precio: "", precioAnterior: "", stock: "", pesoGr: "", img: FOTOS[0].value, material: "", medidas: "", descripcion: "", publicado: true };
type Form = typeof VACIO;

export default function Panel() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const s = useStore();
  const cargando = useCargando();
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab")! : "lanzamiento";

  const hechas = s.tareas.filter((t) => t.hecha).length;
  const avance = Math.round((hechas / s.tareas.length) * 100);
  const publicados = s.productos.filter((x) => x.publicado).length;
  const vendido = s.pedidos.reduce((n, x) => n + x.total, 0);

  // ---------- catálogo ----------
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("todas");
  const [form, setForm] = useState<Form | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [borrar, setBorrar] = useState<Producto | null>(null);
  const [verPedido, setVerPedido] = useState<Pedido | null>(null);
  const [estado, setEstado] = useState("todos");

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return s.productos.filter((x) => (cat === "todas" || x.categoria === cat) && (!t || x.nombre.toLowerCase().includes(t) || x.sku.toLowerCase().includes(t)));
  }, [s.productos, q, cat]);
  const pedidos = s.pedidos.filter((x) => estado === "todos" || x.estado === estado);

  const abrirNuevo = () => { setEditId(null); setErr({}); setForm(VACIO); };
  const abrirEditar = (x: Producto) => {
    setEditId(x.id); setErr({});
    setForm({ nombre: x.nombre, categoria: x.categoria, precio: String(x.precio), precioAnterior: x.precioAnterior ? String(x.precioAnterior) : "", stock: String(x.stock), pesoGr: String(x.pesoGr), img: x.img, material: x.material, medidas: x.medidas, descripcion: x.descripcion, publicado: x.publicado });
  };
  const campo = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setForm((f) => (f ? { ...f, [k]: e.target.value } : f)); setErr((x) => ({ ...x, [k]: "" })); };

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const er: Record<string, string> = {};
    const precio = Number(form.precio), antes = Number(form.precioAnterior), stock = Number(form.stock), peso = Number(form.pesoGr);
    if (form.nombre.trim().length < 4) er.nombre = "El nombre necesita al menos 4 letras.";
    else if (s.productos.some((x) => x.id !== editId && slugify(x.nombre) === slugify(form.nombre))) er.nombre = "Ya existe un producto con ese nombre.";
    if (!(precio > 0)) er.precio = "Indicar un precio mayor a cero.";
    if (form.precioAnterior && !(antes > precio)) er.precioAnterior = "Debe ser mayor al precio actual.";
    if (form.stock === "" || !Number.isInteger(stock) || stock < 0) er.stock = "El stock es un número entero, cero o más.";
    if (!(peso > 0)) er.pesoGr = "El peso define el costo de envío.";
    if (form.descripcion.trim().length < 20) er.descripcion = "La descripción necesita al menos 20 letras.";
    setErr(er);
    if (Object.keys(er).length) { toast.error("Revisar los campos marcados"); return; }
    setGuardando(true);
    window.setTimeout(() => {
      const previo = editId ? s.producto(editId) : undefined;
      const id = previo?.id ?? `p${Date.now()}`;
      s.guardarProducto({
        id, slug: previo?.slug ?? slugify(form.nombre), sku: previo?.sku ?? `CA-${form.categoria.slice(0, 2).toUpperCase()}-${String(Date.now()).slice(-3)}`,
        nombre: form.nombre.trim(), categoria: form.categoria, precio, precioAnterior: form.precioAnterior ? antes : null, stock, img: form.img,
        galeria: previo && previo.img === form.img ? previo.galeria : [form.img], descripcion: form.descripcion.trim(), material: form.material.trim() || "Sin especificar",
        medidas: form.medidas.trim() || "Sin especificar", pesoGr: peso, variante: previo?.variante ?? null, rating: previo?.rating ?? 5, resenas: previo?.resenas ?? 0,
        nuevo: previo?.nuevo ?? true, publicado: form.publicado, creado: previo?.creado ?? HOY,
      });
      setGuardando(false); setForm(null);
      toast.success(previo ? "Producto actualizado" : "Producto creado", { description: form.nombre.trim() });
    }, 600);
  };

  const exportar = () => {
    const filas = [["SKU", "Nombre", "Categoría", "Precio", "Stock", "Peso (g)", "Publicado"], ...lista.map((x) => [x.sku, x.nombre, categoria(x.categoria).nombre, x.precio, x.stock, x.pesoGr, x.publicado ? "Sí" : "No"])];
    const url = URL.createObjectURL(new Blob(["﻿" + filas.map((f) => f.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(";")).join("\n")], { type: "text/csv;charset=utf-8" }));
    Object.assign(document.createElement("a"), { href: url, download: "catalogo-casa-alba.csv" }).click();
    URL.revokeObjectURL(url);
    toast.success("Planilla descargada", { description: `${lista.length} productos con el formato de importación de Tienda Nube.` });
  };

  const muestra = s.productos.find((x) => x.publicado && x.precioAnterior) ?? s.productos[0];

  return (
    <>
      <section className="animate-rise relative overflow-hidden rounded-[2rem] border border-white/20">
        <Foto src="/img/taller.jpg" alt="Mesa de trabajo de un taller de cerámica" prioridad className="animate-kenburns absolute inset-0 size-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-musgo/92 via-musgo/70 to-musgo/25" />
        <div className="relative grid gap-6 p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-xl">
            <p className="text-xs font-bold tracking-[0.2em] text-acento-claro uppercase">Panel de lanzamiento</p>
            <h1 className="mt-2 text-4xl leading-[1.05] font-semibold text-balance sm:text-5xl">La tienda, <span className="text-degrade">lista para salir</span></h1>
            <p className="mt-3 text-[15px] leading-relaxed text-white/85">
              Lo que se configura en Tienda Nube, en un solo lugar: catálogo, medios de pago, envíos y diseño. Cada cambio se ve al instante en la tienda.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button className={btnAcento} onClick={() => { router.replace(`${pathname}?tab=catalogo`, { scroll: false }); abrirNuevo(); }}><Plus className="size-4" />Nuevo producto</Button>
              <Button variant="outline" className={btnGlass} nativeButton={false} render={<Link href="/productos" />}><ExternalLink className="size-4" />Ver la tienda</Button>
            </div>
          </div>
          <div className="glass flex items-center gap-5 rounded-3xl p-5">
            <div className="relative flex size-28 shrink-0 items-center justify-center rounded-full transition-all duration-700" role="img" aria-label={`Avance del lanzamiento: ${avance} %`}
              style={{ background: `conic-gradient(var(--acento) ${avance * 3.6}deg, rgb(255 255 255 / 16%) 0)` }}>
              <div className="flex size-[5.4rem] flex-col items-center justify-center rounded-full bg-musgo/90">
                <span className="tabular font-heading text-3xl leading-none font-semibold">{avance}%</span>
                <span className="mt-0.5 text-[10px] font-bold tracking-widest text-white/70 uppercase">avance</span>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[["Tareas", `${hechas} de ${s.tareas.length}`], ["Publicados", String(publicados)], ["Medios activos", String(s.medios.filter((m) => m.activo).length)], ["Vendido", fmtMoney(vendido)]].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-white/70">{k}</dt><dd className="tabular font-heading text-lg font-semibold">{v}</dd></div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <Tabs value={tab} onValueChange={(v) => router.replace(`${pathname}?tab=${v}`, { scroll: false })} className="gap-6">
        <TabsList className="glass no-scrollbar h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-transparent p-1.5 group-data-horizontal/tabs:h-auto lg:w-fit">
          {TABS.map((t) => <TabsTrigger key={t.id} value={t.id} className={tabCls}><t.icon className="size-4" />{t.label}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="lanzamiento" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ETAPAS.map((etapa, i) => {
            const ts = s.tareas.filter((t) => t.etapa === etapa);
            const ok = ts.filter((t) => t.hecha).length;
            return (
              <section key={etapa} className="glass animate-rise rounded-3xl p-5" style={{ animationDelay: `${i * 70}ms` }}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2.5 text-xl font-semibold">
                    <span className="tabular flex size-8 items-center justify-center rounded-xl bg-white/15 font-sans text-sm font-bold text-acento-claro">{i + 1}</span>{etapa}
                  </h2>
                  <Chip className={ok === ts.length ? "border-ok/50 bg-ok/15 text-ok" : "border-white/25 bg-white/10 text-white/85"}>{ok} de {ts.length}</Chip>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-gradient-to-r from-salvia to-acento transition-[width] duration-500" style={{ width: `${(ok / ts.length) * 100}%` }} /></div>
                <ul className="mt-3 grid gap-1">
                  {ts.map((t) => (
                    <li key={t.id}>
                      <button type="button" role="checkbox" aria-checked={t.hecha} onClick={() => { s.toggleTarea(t.id); toast(t.hecha ? "Tarea reabierta" : "Tarea completada", { description: t.titulo }); }}
                        className="rowlink flex w-full items-start gap-3 rounded-2xl p-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border transition", t.hecha ? "border-transparent bg-acento text-tinta" : "border-white/40 bg-white/5")}>
                          {t.hecha && <Check className="animate-pop size-4" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                          <span className={cn("block text-sm font-semibold", t.hecha && "text-white/65 line-through decoration-white/40")}>{t.titulo}</span>
                          <span className="block text-xs leading-relaxed text-white/70">{t.detalle}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          <aside className="glass animate-rise relative overflow-hidden rounded-3xl" style={{ animationDelay: "350ms" }}>
            <Foto src="/img/cena.jpg" alt="Mesa servida con vajilla de gres" className="absolute inset-0 size-full opacity-55" />
            <div className="absolute inset-0 bg-gradient-to-t from-musgo/95 via-musgo/60 to-transparent" />
            <div className="relative flex h-full min-h-56 flex-col justify-end p-5">
              <p className="text-xs font-bold tracking-[0.2em] text-acento-claro uppercase">Antes de abrir</p>
              <p className="mt-1.5 font-heading text-xl leading-snug font-semibold">Una compra real por cada medio de pago, de punta a punta.</p>
              <Button className={cn(btnAcento, "mt-4 w-fit")} nativeButton={false} render={<Link href="/productos" />}><ShoppingBag className="size-4" />Hacer la compra de prueba</Button>
            </div>
          </aside>
        </TabsContent>

        <TabsContent value="catalogo" className="glass rounded-3xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-52 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/65" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar en el catálogo" placeholder="Buscar por nombre o SKU" className="field pl-10" />
            </div>
            <Pick label="Categoría" value={cat} onChange={setCat} options={[{ value: "todas", label: "Todas las categorías" }, ...OPC_CAT]} className="w-52" />
            <Button variant="outline" className={btnGlass} onClick={exportar} disabled={lista.length === 0}><Download className="size-4" />Exportar CSV</Button>
            <Button className={btnAcento} onClick={abrirNuevo}><Plus className="size-4" />Nuevo producto</Button>
          </div>
          <p className="mt-3 text-xs text-white/70" aria-live="polite">{lista.length} de {s.productos.length} productos · {publicados} publicados</p>

          {cargando ? (
            <div className="mt-3 grid gap-2" aria-busy>{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-[4.5rem] animate-pulse rounded-2xl bg-white/10" />)}</div>
          ) : lista.length === 0 ? (
            <Vacio icono={PackageSearch} titulo="Ningún producto coincide" texto="Probar con otra palabra o quitar el filtro de categoría.">
              <Button variant="outline" className={btnGlass} onClick={() => { setQ(""); setCat("todas"); }}>Quitar filtros</Button>
            </Vacio>
          ) : (
            <ul className="mt-3 grid gap-2">
              {lista.map((x) => (
                <li key={x.id} className="glass-soft rowlink grid grid-cols-[auto_1fr_auto] items-center gap-x-3.5 gap-y-2 rounded-2xl p-2.5 md:grid-cols-[auto_minmax(0,1.6fr)_1fr_0.7fr_auto_auto]">
                  <Foto src={x.img} alt="" className="size-14 rounded-xl" />
                  <div className="min-w-0">
                    <Link href={`/productos/${x.slug}`} className="block truncate text-sm font-semibold hover:underline">{x.nombre}</Link>
                    <p className="truncate text-xs text-white/65">{x.sku} · {categoria(x.categoria).nombre}</p>
                  </div>
                  <p className="tabular hidden font-heading text-lg font-semibold md:block">{fmtMoney(x.precio)}</p>
                  <div className="hidden md:block">
                    <Chip className={x.stock === 0 ? "border-bad/50 bg-bad/15 text-bad" : x.stock <= 5 ? "border-warn/50 bg-warn/15 text-warn" : "border-white/25 bg-white/10 text-white/85"}>
                      {x.stock === 0 ? "Sin stock" : `${x.stock} en stock`}
                    </Chip>
                  </div>
                  <label className="col-start-2 flex items-center gap-2 text-xs font-semibold text-white/80 md:col-start-auto">
                    <Switch checked={x.publicado} onCheckedChange={(v) => { s.guardarProducto({ ...x, publicado: v }); toast(v ? "Producto publicado" : "Producto oculto de la tienda", { description: x.nombre }); }} aria-label={`Publicar ${x.nombre}`} />
                    <span className="w-16">{x.publicado ? "Publicado" : "Oculto"}</span>
                  </label>
                  <div className="col-start-3 row-start-1 flex gap-1 md:col-start-auto md:row-start-auto">
                    <button type="button" aria-label={`Editar ${x.nombre}`} onClick={() => abrirEditar(x)} className="rounded-xl p-2.5 text-white/80 transition hover:bg-white/15 hover:text-white"><Pencil className="size-4" /></button>
                    <button type="button" aria-label={`Eliminar ${x.nombre}`} onClick={() => setBorrar(x)} className="rounded-xl p-2.5 text-white/80 transition hover:bg-bad/20 hover:text-bad"><Trash2 className="size-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="pagos" className="grid gap-4 lg:grid-cols-2">
          {[
            { titulo: "Medios de pago", texto: "Lo que se active aquí aparece como opción en el último paso de la compra.", icono: CreditCard, items: s.medios.map((m) => ({ ...m, I: ICONO_MEDIO[m.id] ?? Wallet, pie: m.comision })), toggle: s.toggleMedio },
            { titulo: "Formas de entrega", texto: "Se cotizan con el código postal y el peso real de cada producto.", icono: Truck, items: s.envios.map((m) => ({ ...m, I: Truck, pie: "" })), toggle: s.toggleEnvio },
          ].map((g) => (
            <section key={g.titulo} className="glass animate-rise rounded-3xl p-5">
              <h2 className="flex items-center gap-2.5 text-2xl font-semibold"><g.icono className="size-5 text-acento-claro" />{g.titulo}</h2>
              <p className="mt-1 text-sm text-white/75">{g.texto}</p>
              <ul className="mt-4 grid gap-2">
                {g.items.map((m) => (
                  <li key={m.id} className={cn("glass-soft flex items-center gap-3.5 rounded-2xl p-3.5 transition", !m.activo && "opacity-65")}>
                    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", m.activo ? "bg-acento text-tinta" : "bg-white/12 text-white/80")}><m.I className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{m.nombre}</p>
                      <p className="text-xs leading-relaxed text-white/70">{m.detalle}</p>
                      {m.pie && <p className="mt-0.5 text-[11px] font-semibold text-acento-claro">{m.pie}</p>}
                    </div>
                    <Switch checked={m.activo} aria-label={`Activar ${m.nombre}`} onCheckedChange={(v) => { g.toggle(m.id); toast(v ? "Activado" : "Desactivado", { description: m.nombre }); }} />
                  </li>
                ))}
              </ul>
              {g.items.every((m) => !m.activo) && <p role="alert" className="mt-3 rounded-2xl border border-bad/40 bg-bad/15 px-4 py-3 text-sm">Sin ninguna opción activa no se puede terminar una compra.</p>}
            </section>
          ))}
        </TabsContent>

        <TabsContent value="diseno" className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <section className="glass animate-rise rounded-3xl p-5">
            <h2 className="flex items-center gap-2.5 text-2xl font-semibold"><Palette className="size-5 text-acento-claro" />Color de la marca</h2>
            <p className="mt-1 text-sm text-white/75">El acento pinta botones, precios en cuotas y etiquetas en toda la tienda. Queda guardado en este navegador.</p>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4" role="radiogroup" aria-label="Color de acento">
              {ACENTOS.map((a) => (
                <button key={a.id} type="button" role="radio" aria-checked={s.acento === a.id} onClick={() => { s.setAcento(a.id); toast.success(`Acento ${a.nombre} aplicado`); }}
                  className={cn("glass-soft relative rounded-2xl p-3 text-left transition outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-ring", s.acento === a.id && "ring-2 ring-white")}>
                  <span className="block h-16 rounded-xl shadow-[inset_0_1px_0_rgb(255_255_255/50%)]" style={{ background: `linear-gradient(135deg, ${a.claro}, ${a.color})` }} />
                  <span className="mt-2 block text-sm font-semibold">{a.nombre}</span>
                  <span className="tabular block text-xs text-white/65 uppercase">{a.color}</span>
                  {s.acento === a.id && <span className="animate-pop absolute top-5 right-5 flex size-6 items-center justify-center rounded-full bg-white text-musgo"><Check className="size-4" strokeWidth={3} /></span>}
                </button>
              ))}
            </div>
            <h3 className="mt-6 text-lg font-semibold">Tipografías</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="glass-soft rounded-2xl p-4"><p className="font-heading text-3xl font-semibold">Fraunces</p><p className="mt-1 text-xs text-white/70">Títulos y precios</p></div>
              <div className="glass-soft rounded-2xl p-4"><p className="text-3xl font-semibold">Manrope</p><p className="mt-1 text-xs text-white/70">Textos, botones y formularios</p></div>
            </div>
            <h3 className="mt-6 text-lg font-semibold">Fotos de portada</h3>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {["hero", "sala", "cena", "verde"].map((f) => <Foto key={f} src={`/img/${f}.jpg`} alt={`Foto de portada: ${f}`} className="aspect-square w-full rounded-2xl border border-white/20" />)}
            </div>
          </section>
          <section className="animate-rise" style={{ animationDelay: "90ms" }} aria-label="Vista previa">
            <p className="mb-2 text-xs font-bold tracking-[0.2em] text-acento-claro uppercase">Vista previa en vivo</p>
            <div className="mx-auto max-w-sm">{muestra && <TarjetaProducto producto={muestra} />}</div>
            <div className="glass mx-auto mt-3 flex max-w-sm flex-wrap items-center gap-2 rounded-3xl p-4">
              <Button className={btnAcento} nativeButton={false} render={<Link href="/" />}>Ver la portada</Button>
              <Chip className="border-transparent bg-acento text-tinta">15 % OFF</Chip>
              <span className="text-sm text-white/80">6 cuotas de <b className="text-acento-claro">{fmtMoney(14983)}</b></span>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="pedidos" className="glass rounded-3xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <h2 className="text-2xl font-semibold">Pedidos recibidos</h2>
            <Pick label="Estado" value={estado} onChange={setEstado} className="w-56" options={[{ value: "todos", label: "Todos los estados" }, ...Object.entries(ESTADO).map(([value, e]) => ({ value, label: e.label }))]} />
          </div>
          {pedidos.length === 0 ? (
            <Vacio icono={Receipt} titulo="No hay pedidos en este estado" texto="Cuando entre una compra con ese estado, aparece en esta lista.">
              <Button variant="outline" className={btnGlass} onClick={() => setEstado("todos")}>Ver todos</Button>
            </Vacio>
          ) : (
            <ul className="mt-3 grid gap-2">
              {pedidos.map((x) => (
                <li key={x.id}>
                  <button type="button" onClick={() => setVerPedido(x)} className="glass-soft rowlink grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-2xl p-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[5rem_1.4fr_1fr_auto_7rem]">
                    <span className="tabular font-heading text-lg font-semibold">{x.id}</span>
                    <span className="order-3 col-span-2 min-w-0 md:order-none md:col-span-1"><span className="block truncate text-sm font-semibold">{x.cliente}</span><span className="block truncate text-xs text-white/65">{fmtFecha(x.fecha)} · {x.medio}</span></span>
                    <span className="hidden truncate text-xs text-white/75 md:block">{x.entrega}</span>
                    <Chip className={cn("justify-self-end md:justify-self-start", ESTADO[x.estado].cls)}>{ESTADO[x.estado].label}</Chip>
                    <span className="tabular order-4 col-span-2 font-heading text-lg font-semibold md:order-none md:col-span-1 md:text-right">{fmtMoney(x.total)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!form} onOpenChange={(o) => { if (!o && !guardando) setForm(null); }}>
        <DialogContent className={dialogCls}>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-semibold">{editId ? "Editar producto" : "Nuevo producto"}</DialogTitle>
            <DialogDescription className="text-white/75">Los mismos campos que pide la importación de Tienda Nube. El peso se usa para cotizar el envío.</DialogDescription>
          </DialogHeader>
          {form && (
            <form onSubmit={guardar} noValidate className="grid gap-3.5 sm:grid-cols-2">
              <Campo label="Nombre *" htmlFor="p-nombre" error={err.nombre} className="sm:col-span-2"><Input id="p-nombre" required value={form.nombre} onChange={campo("nombre")} placeholder="Jarra de gres Arena" aria-invalid={!!err.nombre} className="field" /></Campo>
              <Campo label="Categoría" htmlFor="p-cat"><Pick id="p-cat" label="Categoría" value={form.categoria} onChange={(v) => setForm({ ...form, categoria: v as CategoriaId })} options={OPC_CAT} /></Campo>
              <Campo label="Foto principal" htmlFor="p-img">
                <div className="flex items-center gap-2"><Foto src={form.img} alt="" className="size-11 shrink-0 rounded-xl border border-white/25" /><Pick id="p-img" label="Foto principal" value={form.img} onChange={(v) => setForm({ ...form, img: v })} options={FOTOS} className="capitalize" /></div>
              </Campo>
              <Campo label="Precio en pesos *" htmlFor="p-precio" error={err.precio}><Input id="p-precio" required inputMode="numeric" value={form.precio} onChange={campo("precio")} placeholder="48900" aria-invalid={!!err.precio} className="field tabular" /></Campo>
              <Campo label="Precio anterior" htmlFor="p-antes" error={err.precioAnterior} hint="Opcional. Muestra el porcentaje de descuento."><Input id="p-antes" inputMode="numeric" value={form.precioAnterior} onChange={campo("precioAnterior")} placeholder="56900" aria-invalid={!!err.precioAnterior} className="field tabular" /></Campo>
              <Campo label="Stock *" htmlFor="p-stock" error={err.stock}><Input id="p-stock" required inputMode="numeric" value={form.stock} onChange={campo("stock")} placeholder="12" aria-invalid={!!err.stock} className="field tabular" /></Campo>
              <Campo label="Peso en gramos *" htmlFor="p-peso" error={err.pesoGr}><Input id="p-peso" required inputMode="numeric" value={form.pesoGr} onChange={campo("pesoGr")} placeholder="850" aria-invalid={!!err.pesoGr} className="field tabular" /></Campo>
              <Campo label="Material" htmlFor="p-mat"><Input id="p-mat" value={form.material} onChange={campo("material")} placeholder="Gres esmaltado" className="field" /></Campo>
              <Campo label="Medidas" htmlFor="p-med"><Input id="p-med" value={form.medidas} onChange={campo("medidas")} placeholder="18 cm de alto · 1,2 litros" className="field" /></Campo>
              <Campo label="Descripción *" htmlFor="p-desc" error={err.descripcion} className="sm:col-span-2">
                <Textarea id="p-desc" required rows={3} value={form.descripcion} onChange={campo("descripcion")} placeholder="Qué es, de qué está hecho y cómo se usa." aria-invalid={!!err.descripcion} className="field h-auto min-h-20 py-2.5" />
              </Campo>
              <label className="glass-soft flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold sm:col-span-2">
                Publicar en la tienda al guardar<Switch checked={form.publicado} onCheckedChange={(v) => setForm({ ...form, publicado: v })} />
              </label>
              <div className="flex flex-col-reverse gap-2 pt-1 sm:col-span-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" className={btnGlass} disabled={guardando} onClick={() => setForm(null)}>Cancelar</Button>
                <Button type="submit" className={cn(btnAcento, "min-w-40")} disabled={guardando}>{guardando ? <><Loader2 className="size-4 animate-spin" />Guardando</> : editId ? "Guardar cambios" : "Crear producto"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!borrar} onOpenChange={(o) => !o && setBorrar(null)}>
        <DialogContent className={cn(dialogCls, "sm:max-w-md")}>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-semibold">Eliminar este producto</DialogTitle>
            <DialogDescription className="text-white/75">{borrar?.nombre} sale del catálogo y de los carritos abiertos. Para sacarlo solo de la vista conviene ocultarlo.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className={btnGlass} onClick={() => setBorrar(null)}>Cancelar</Button>
            <Button className="h-11 rounded-2xl bg-bad px-5 text-sm font-bold text-[#3d1410] hover:bg-bad/90" onClick={() => { if (borrar) { s.eliminarProducto(borrar.id); toast.success("Producto eliminado", { description: borrar.nombre }); } setBorrar(null); }}>
              <Trash2 className="size-4" />Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!verPedido} onOpenChange={(o) => !o && setVerPedido(null)}>
        <DialogContent className={cn(dialogCls, "sm:max-w-lg")}>
          {verPedido && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2.5 font-heading text-2xl font-semibold">Pedido {verPedido.id}<Chip className={ESTADO[verPedido.estado].cls}>{ESTADO[verPedido.estado].label}</Chip></DialogTitle>
                <DialogDescription className="text-white/75">{verPedido.cliente} · {verPedido.email} · {fmtFecha(verPedido.fecha)}</DialogDescription>
              </DialogHeader>
              <ul className="divide-y divide-white/12">
                {verPedido.items.map((i) => {
                  const x = s.producto(i.productoId);
                  return (
                    <li key={`${i.productoId}-${i.opcion}`} className="flex items-center gap-3 py-2.5">
                      {x ? <Foto src={x.img} alt="" className="size-12 rounded-xl" /> : <span className="size-12 rounded-xl bg-white/10" />}
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{x?.nombre ?? "Producto eliminado del catálogo"}</span><span className="block text-xs text-white/65">{i.cantidad} {i.cantidad === 1 ? "unidad" : "unidades"}{i.opcion ? ` · ${i.opcion}` : ""}</span></span>
                      {x && <span className="tabular text-sm font-semibold">{fmtMoney(x.precio * i.cantidad)}</span>}
                    </li>
                  );
                })}
              </ul>
              <dl className="glass-soft grid gap-1.5 rounded-2xl p-4 text-sm">
                {[["Subtotal", fmtMoney(verPedido.subtotal)], ["Descuento", verPedido.descuento ? `- ${fmtMoney(verPedido.descuento)}` : "Sin descuento"], [verPedido.entrega, verPedido.envio ? fmtMoney(verPedido.envio) : "Sin costo"], ["Pago", verPedido.medio]].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3"><dt className="text-white/75">{k}</dt><dd className="tabular font-semibold">{v}</dd></div>
                ))}
                <div className="mt-1.5 flex items-baseline justify-between border-t border-white/15 pt-2.5"><dt className="font-semibold">Total</dt><dd className="tabular font-heading text-2xl font-semibold">{fmtMoney(verPedido.total)}</dd></div>
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
