"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Heart, SearchX, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Foto, Pick, TarjetaEsqueleto, TarjetaProducto, Vacio, btnAcento, btnGlass, useCargando } from "@/components/bits";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { CATEGORIAS, descuentoPct, fmtMoney, type CategoriaId } from "@/lib/data";

const ORDENES = [
  { value: "vendidos", label: "Más vendidos" },
  { value: "nuevos", label: "Más nuevos" },
  { value: "menor", label: "Menor precio" },
  { value: "mayor", label: "Mayor precio" },
  { value: "valorados", label: "Mejor valorados" },
];

export default function Tienda() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { productos, favoritos } = useStore();
  const cargando = useCargando();

  const q = params.get("q") ?? "";
  const cat = (params.get("cat") ?? "") as CategoriaId | "";
  const soloFav = params.get("fav") === "1";
  const orden = params.get("orden") ?? "vendidos";

  const visibles = useMemo(() => productos.filter((x) => x.publicado), [productos]);
  const tope = Math.ceil(Math.max(...visibles.map((x) => x.precio), 1) / 10000) * 10000;
  const [precioMax, setPrecioMax] = useState<number | null>(null);
  const [conStock, setConStock] = useState(false);
  const [ofertas, setOfertas] = useState(false);
  const [filtros, setFiltros] = useState(false);
  const max = precioMax ?? tope;

  const poner = (cambios: Record<string, string | null>) => {
    const p = new URLSearchParams(params.toString());
    Object.entries(cambios).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    router.replace(`${pathname}${p.size ? `?${p}` : ""}`, { scroll: false });
  };
  const limpiar = () => { setPrecioMax(null); setConStock(false); setOfertas(false); router.replace(pathname, { scroll: false }); };

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    const r = visibles.filter(
      (x) =>
        (!cat || x.categoria === cat) && (!soloFav || favoritos.includes(x.id)) && x.precio <= max && (!conStock || x.stock > 0) &&
        (!ofertas || descuentoPct(x) > 0) && (!t || `${x.nombre} ${x.material} ${x.descripcion}`.toLowerCase().includes(t)),
    );
    const por: Record<string, (a: (typeof r)[number], b: (typeof r)[number]) => number> = {
      vendidos: (a, b) => b.resenas - a.resenas,
      nuevos: (a, b) => b.creado.localeCompare(a.creado),
      menor: (a, b) => a.precio - b.precio,
      mayor: (a, b) => b.precio - a.precio,
      valorados: (a, b) => b.rating - a.rating,
    };
    return [...r].sort(por[orden] ?? por.vendidos);
  }, [visibles, q, cat, soloFav, favoritos, max, conStock, ofertas, orden]);

  const activos = [
    q && { k: "q", label: `“${q}”`, quitar: () => poner({ q: null }) },
    soloFav && { k: "fav", label: "Favoritos", quitar: () => poner({ fav: null }) },
    max < tope && { k: "precio", label: `Hasta ${fmtMoney(max)}`, quitar: () => setPrecioMax(null) },
    conStock && { k: "stock", label: "Con stock", quitar: () => setConStock(false) },
    ofertas && { k: "ofertas", label: "En oferta", quitar: () => setOfertas(false) },
  ].filter(Boolean) as { k: string; label: string; quitar: () => void }[];

  const actual = CATEGORIAS.find((c) => c.id === cat);

  const Panel = (
    <div className="grid gap-6">
      <div>
        <p className="text-xs font-bold tracking-[0.2em] text-acento-claro uppercase">Categoría</p>
        <div className="mt-3 grid gap-1">
          {[{ id: "", nombre: "Todo el catálogo" }, ...CATEGORIAS].map((c) => {
            const n = c.id ? visibles.filter((x) => x.categoria === c.id).length : visibles.length;
            return (
              <button key={c.id || "todo"} type="button" aria-pressed={cat === c.id} onClick={() => poner({ cat: c.id || null })}
                className={cn("flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-left text-sm font-semibold transition",
                  cat === c.id ? "bg-white/20 text-white shadow-[inset_0_1px_0_rgb(255_255_255/35%)]" : "text-white/80 hover:bg-white/10 hover:text-white")}>
                {c.nombre}<span className={cn("tabular rounded-full px-2 py-0.5 text-[11px]", cat === c.id ? "bg-acento text-tinta" : "bg-white/12")}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="precio-max" className="text-xs font-bold tracking-[0.2em] text-acento-claro uppercase">Precio máximo</label>
          <span className="tabular text-sm font-semibold">{fmtMoney(max)}</span>
        </div>
        <input id="precio-max" type="range" min={10000} max={tope} step={5000} value={max} onChange={(e) => setPrecioMax(Number(e.target.value))}
          className="mt-3 w-full accent-[var(--acento)]" />
      </div>
      <div className="grid gap-3">
        {[{ id: "f-stock", label: "Solo con stock", v: conStock, set: setConStock }, { id: "f-ofertas", label: "Solo en oferta", v: ofertas, set: setOfertas }].map((s) => (
          <label key={s.id} htmlFor={s.id} className="glass-soft flex cursor-pointer items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-semibold">
            {s.label}<Switch id={s.id} checked={s.v} onCheckedChange={s.set} />
          </label>
        ))}
      </div>
      <button type="button" aria-pressed={soloFav} onClick={() => poner({ fav: soloFav ? null : "1" })}
        className={cn("flex items-center justify-center gap-2 rounded-2xl border px-3.5 py-3 text-sm font-semibold transition", soloFav ? "border-acento bg-acento/25 text-acento-claro" : "border-white/25 bg-white/8 hover:bg-white/15")}>
        <Heart className={cn("size-4", soloFav && "fill-current")} />Mis favoritos ({favoritos.length})
      </button>
    </div>
  );

  return (
    <>
      <section className="relative isolate min-h-56 overflow-hidden rounded-[2rem] border border-white/25">
        <Foto prioridad src={actual?.img ?? "/img/cena.jpg"} alt={actual?.descripcion ?? "Mesa servida con platos de gres"} className="animate-kenburns absolute inset-0 -z-20 size-full" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgb(40_62_56/93%),rgb(46_70_66/72%)_50%,rgb(60_80_76/25%))]" />
        <div className="animate-rise flex min-h-56 flex-col justify-end p-6 sm:p-9">
          <p className="text-xs font-bold tracking-[0.2em] text-acento-claro uppercase">Tienda{actual ? ` · ${actual.nombre}` : ""}</p>
          <h1 className="mt-1.5 text-4xl font-semibold sm:text-5xl">{soloFav ? "Mis favoritos" : actual ? actual.nombre : "Todo el catálogo"}</h1>
          <p className="mt-2 max-w-xl text-[15px] text-white/85">{actual ? actual.descripcion : "Piezas de taller con stock real, cuotas sin interés y envío a todo el país."}</p>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[17rem_1fr]">
        <aside className="glass sticky top-24 hidden self-start rounded-3xl p-5 lg:block" aria-label="Filtros">{Panel}</aside>

        <section aria-label="Productos" className="min-w-0 space-y-4">
          <div className="glass flex flex-wrap items-center gap-2.5 rounded-3xl p-2.5 pl-4">
            <p className="mr-auto text-sm font-semibold" aria-live="polite">
              <span className="tabular">{cargando ? "…" : lista.length}</span> {lista.length === 1 ? "producto" : "productos"}
            </p>
            <Button variant="outline" className={cn(btnGlass, "lg:hidden")} onClick={() => setFiltros(true)}><SlidersHorizontal className="size-4" />Filtros</Button>
            <Pick label="Ordenar productos" value={orden} onChange={(v) => poner({ orden: v === "vendidos" ? null : v })} options={ORDENES} className="w-48" />
          </div>

          {activos.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activos.map((a) => (
                <button key={a.k} type="button" onClick={a.quitar} aria-label={`Quitar filtro ${a.label}`}
                  className="chip-dark flex items-center gap-1.5 rounded-full py-1.5 pr-2 pl-3 text-xs font-semibold transition hover:bg-white/20">
                  {a.label}<X className="size-3.5" />
                </button>
              ))}
              <button type="button" onClick={limpiar} className="text-xs font-bold text-acento-claro hover:underline">Limpiar todo</button>
            </div>
          )}

          {cargando ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <TarjetaEsqueleto key={i} />)}</div>
          ) : lista.length === 0 ? (
            <div className="glass rounded-3xl">
              <Vacio icono={soloFav && favoritos.length === 0 ? Heart : SearchX}
                titulo={soloFav && favoritos.length === 0 ? "Todavía no hay favoritos" : "Nada coincide con esos filtros"}
                texto={soloFav && favoritos.length === 0 ? "El corazón de cada tarjeta guarda la pieza para verla después." : "Probar con otra categoría, subir el precio máximo o quitar algún filtro."}>
                <Button className={btnAcento} onClick={limpiar}>Ver todo el catálogo</Button>
              </Vacio>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {lista.map((x, i) => <TarjetaProducto key={x.id} producto={x} delay={Math.min(i, 8) * 50} />)}
            </div>
          )}
        </section>
      </div>

      <Sheet open={filtros} onOpenChange={setFiltros}>
        <SheetContent side="bottom" className="glass-deep max-h-[85dvh] overflow-y-auto rounded-t-[1.75rem] border-0 p-5 text-white">
          <SheetHeader className="p-0 pb-2">
            <SheetTitle className="font-heading text-2xl font-semibold text-white">Filtros</SheetTitle>
            <SheetDescription className="text-white/75">Los cambios se aplican al instante.</SheetDescription>
          </SheetHeader>
          {Panel}
          <Button className={cn(btnAcento, "mt-2 w-full")} onClick={() => setFiltros(false)}>Ver {lista.length} productos</Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
