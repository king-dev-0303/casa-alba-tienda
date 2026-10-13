"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowRight, BadgePercent, Banknote, Check, CircleCheck, CreditCard, Landmark, Loader2, Lock, Mail, PackageOpen, Pencil, Receipt, Tag,
  Truck, Wallet, type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Campo, Foto, Pick, Vacio, btnAcento, btnGlass } from "@/components/bits";
import { cn } from "@/lib/utils";
import { useStore, type Linea } from "@/lib/store";
import { TIENDA, cotizarEnvio, cpValido, cuota, fmtMoney, type Pedido } from "@/lib/data";

const PROVINCIAS = ["Ciudad de Buenos Aires", "Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Entre Ríos", "Salta", "Neuquén", "Río Negro"].map((x) => ({ value: x, label: x }));
const ICONO_MEDIO: Record<string, LucideIcon> = { mercadopago: Wallet, tarjeta: CreditCard, transferencia: Landmark, efectivo: Banknote };
const PASOS = ["Datos", "Entrega", "Pago"];
const CUPON = { codigo: "ALBA10", pct: 10 };

type Errores = Record<string, string>;

export default function Checkout() {
  const { lineas, subtotal, pesoGr, medios, envios, crearPedido } = useStore();
  const [paso, setPaso] = useState(0);
  const [f, setF] = useState({ email: "", nombre: "", telefono: "", dni: "", cp: "", calle: "", depto: "", ciudad: "", provincia: PROVINCIAS[0].value, tarjeta: "", vence: "", cvv: "" });
  const [err, setErr] = useState<Errores>({});
  const [envioId, setEnvioId] = useState("");
  const [medioId, setMedioId] = useState("");
  const [cuotas, setCuotas] = useState("1");
  const [cupon, setCupon] = useState("");
  const [cuponOk, setCuponOk] = useState(false);
  const [cuponErr, setCuponErr] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [hecho, setHecho] = useState<{ pedido: Pedido; lineas: Linea[] } | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => { setF((x) => ({ ...x, [k]: e.target.value })); setErr((x) => ({ ...x, [k]: "" })); };

  const cotizaciones = useMemo(() => (cpValido(f.cp) ? cotizarEnvio(f.cp, subtotal, pesoGr, envios) : []), [f.cp, subtotal, pesoGr, envios]);
  const envio = cotizaciones.find((c) => c.id === envioId);
  const mediosActivos = medios.filter((m) => m.activo);
  const medio = mediosActivos.find((m) => m.id === medioId);
  const dCupon = cuponOk ? (subtotal * CUPON.pct) / 100 : 0;
  const dTransfer = medio?.id === "transferencia" ? ((subtotal - dCupon) * TIENDA.descuentoTransferencia) / 100 : 0;
  const total = subtotal - dCupon - dTransfer + (envio?.costo ?? 0);

  const validar = (n: number) => {
    const e: Errores = {};
    if (n === 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Escribir un correo válido para recibir el comprobante.";
      if (f.nombre.trim().split(/\s+/).length < 2) e.nombre = "Hace falta nombre y apellido.";
      if (f.telefono.replace(/\D/g, "").length < 8) e.telefono = "El teléfono debe tener al menos 8 números.";
      if (!/^\d{7,8}$/.test(f.dni.trim())) e.dni = "El DNI tiene 7 u 8 números, sin puntos.";
    }
    if (n === 1) {
      if (!cpValido(f.cp)) e.cp = "El código postal tiene 4 números.";
      else if (!envio) e.envio = "Falta elegir una forma de entrega.";
      if (envio && envio.id !== "retiro") {
        if (f.calle.trim().length < 4) e.calle = "Indicar calle y número.";
        if (f.ciudad.trim().length < 2) e.ciudad = "Indicar la localidad.";
      }
    }
    if (n === 2) {
      if (!medio) e.medio = "Falta elegir un medio de pago.";
      if (medio?.id === "tarjeta") {
        if (f.tarjeta.replace(/\s/g, "").length !== 16) e.tarjeta = "La tarjeta tiene 16 números.";
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(f.vence)) e.vence = "Formato MM/AA.";
        if (!/^\d{3,4}$/.test(f.cvv)) e.cvv = "3 o 4 números.";
      }
    }
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const seguir = () => validar(paso) && setPaso((n) => n + 1);

  const aplicarCupon = () => {
    if (cupon.trim().toUpperCase() !== CUPON.codigo) return setCuponErr("Ese cupón no existe o ya venció.");
    setCuponOk(true);
    setCuponErr("");
    toast.success(`Cupón ${CUPON.codigo} aplicado`, { description: `${CUPON.pct} % de descuento sobre los productos.` });
  };

  const confirmar = async () => {
    if (!validar(2) || !medio || !envio) return;
    setProcesando(true);
    await new Promise((r) => setTimeout(r, 1400));
    const copia = lineas;
    const pedido = crearPedido({ cliente: f.nombre.trim(), email: f.email.trim(), envio: envio.costo, descuento: dCupon + dTransfer, total, medio: medio.nombre, entrega: envio.nombre });
    setProcesando(false);
    setHecho({ pedido, lineas: copia });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (hecho) {
    const { pedido } = hecho;
    return (
      <section className="glass animate-rise mx-auto max-w-2xl rounded-[2rem] p-6 text-center sm:p-10">
        <span className="animate-pop mx-auto flex size-16 items-center justify-center rounded-full bg-ok/25 text-ok"><CircleCheck className="size-9" /></span>
        <p className="mt-5 text-xs font-bold tracking-[0.2em] text-acento-claro uppercase">Pedido {pedido.id}</p>
        <h1 className="mt-1.5 text-4xl font-semibold">Gracias, {pedido.cliente.split(" ")[0]}.</h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/85">
          {pedido.estado === "pendiente"
            ? "El pedido queda reservado 48 horas. Los datos para la transferencia ya están en el correo."
            : "El pago fue aprobado. El comprobante y el seguimiento del envío llegan al correo."}
        </p>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm font-semibold"><Mail className="size-4 text-acento-claro" />{pedido.email}</p>
        <ul className="mt-6 divide-y divide-white/12 rounded-3xl bg-white/8 px-4 text-left">
          {hecho.lineas.map((l) => (
            <li key={`${l.productoId}-${l.opcion}`} className="flex items-center gap-3 py-3">
              <Foto src={l.producto.img} alt="" className="size-12 rounded-xl" />
              <span className="min-w-0 flex-1 text-sm"><span className="block truncate font-semibold">{l.producto.nombre}</span><span className="text-xs text-white/70">{l.cantidad} unidad{l.cantidad > 1 ? "es" : ""}{l.opcion ? ` · ${l.opcion}` : ""}</span></span>
              <span className="tabular text-sm font-semibold">{fmtMoney(l.importe)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 grid gap-2 text-left text-sm sm:grid-cols-3">
          {[["Entrega", pedido.entrega], ["Pago", pedido.medio], ["Total", fmtMoney(pedido.total)]].map(([k, v]) => (
            <div key={k} className="glass-soft rounded-2xl p-3.5"><dt className="text-xs text-white/70">{k}</dt><dd className="font-semibold">{v}</dd></div>
          ))}
        </dl>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button className={btnAcento} nativeButton={false} render={<Link href="/productos" />}>Seguir mirando</Button>
          <Button variant="outline" className={btnGlass} nativeButton={false} render={<Link href="/panel?tab=pedidos" />}><Receipt className="size-4" />Ver el pedido en el panel</Button>
        </div>
      </section>
    );
  }

  if (lineas.length === 0) {
    return (
      <div className="glass rounded-3xl">
        <Vacio icono={PackageOpen} titulo="No hay nada para pagar todavía" texto="El carrito está vacío. Al agregar una pieza, la compra se completa aquí en tres pasos.">
          <Button className={btnAcento} nativeButton={false} render={<Link href="/productos" />}>Ir a la tienda</Button>
        </Vacio>
      </div>
    );
  }

  const Seccion = ({ n, titulo, resumen, children }: { n: number; titulo: string; resumen: string; children: React.ReactNode }) => (
    <section className={cn("glass rounded-3xl p-5 transition sm:p-6", paso < n && "opacity-60")} aria-current={paso === n ? "step" : undefined}>
      <div className="flex items-center gap-3">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", paso > n ? "bg-ok/25 text-ok" : paso === n ? "bg-acento text-tinta" : "bg-white/12")}>
          {paso > n ? <Check className="size-4" /> : n + 1}
        </span>
        <h2 className="text-xl font-semibold">{titulo}</h2>
        {paso > n && <button type="button" onClick={() => setPaso(n)} className="ml-auto flex items-center gap-1.5 text-xs font-bold text-acento-claro hover:underline"><Pencil className="size-3.5" />Cambiar</button>}
      </div>
      {paso > n && <p className="mt-2 pl-12 text-sm text-white/80">{resumen}</p>}
      {paso === n && <div className="animate-rise mt-5 grid gap-4">{children}</div>}
    </section>
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-acento-claro uppercase">Finalizar compra</p>
          <h1 className="mt-1.5 text-4xl font-semibold">Tres pasos y listo</h1>
        </div>
        <ol className="glass-soft flex items-center gap-1 rounded-2xl p-1 text-sm font-semibold">
          {PASOS.map((p, i) => (
            <li key={p} className={cn("flex items-center gap-2 rounded-xl px-3 py-2", i === paso ? "bg-acento text-tinta" : i < paso ? "text-ok" : "text-white/65")}>
              {i < paso ? <Check className="size-4" /> : <span className="tabular">{i + 1}</span>}{p}
            </li>
          ))}
        </ol>
      </div>

      <div className="!mt-6 grid gap-5 lg:grid-cols-[1fr_24rem]">
        <form noValidate onSubmit={(e) => e.preventDefault()} className="grid content-start gap-4">
          {Seccion({ n: 0, titulo: "Datos de contacto", resumen: `${f.nombre} · ${f.email}`, children: (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Correo electrónico" htmlFor="c-email" error={err.email} hint="Aquí llegan el comprobante y el seguimiento."><Input id="c-email" type="email" autoComplete="email" required className="field" placeholder="nombre@correo.com" value={f.email} onChange={set("email")} aria-invalid={!!err.email} /></Campo>
                <Campo label="Nombre y apellido" htmlFor="c-nombre" error={err.nombre}><Input id="c-nombre" autoComplete="name" required className="field" placeholder="Lucía Ferreyra" value={f.nombre} onChange={set("nombre")} aria-invalid={!!err.nombre} /></Campo>
                <Campo label="Teléfono" htmlFor="c-tel" error={err.telefono}><Input id="c-tel" type="tel" autoComplete="tel" required className="field tabular" placeholder="11 5555 0137" value={f.telefono} onChange={set("telefono")} aria-invalid={!!err.telefono} /></Campo>
                <Campo label="DNI" htmlFor="c-dni" error={err.dni} hint="Se usa solo para la factura."><Input id="c-dni" inputMode="numeric" required className="field tabular" placeholder="30123456" value={f.dni} onChange={set("dni")} aria-invalid={!!err.dni} /></Campo>
              </div>
              <Button type="button" className={cn(btnAcento, "justify-self-end")} onClick={seguir}>Continuar con la entrega<ArrowRight className="size-4" /></Button>
            </>
          ) })}

          {Seccion({ n: 1, titulo: "Entrega", resumen: envio ? `${envio.nombre} · ${envio.costo === 0 ? "Gratis" : fmtMoney(envio.costo)}` : "", children: (
            <>
              <Campo label="Código postal" htmlFor="c-cp" error={err.cp} hint="Con el código postal aparecen las opciones y su costo." className="max-w-xs">
                <Input id="c-cp" inputMode="numeric" maxLength={4} required className="field tabular" placeholder="1425" value={f.cp} aria-invalid={!!err.cp}
                  onChange={(e) => { setF((x) => ({ ...x, cp: e.target.value.replace(/\D/g, "") })); setErr((x) => ({ ...x, cp: "", envio: "" })); setEnvioId(""); }} />
              </Campo>
              {cotizaciones.length > 0 && (
                <fieldset className="grid gap-2">
                  <legend className="sr-only">Forma de entrega</legend>
                  {cotizaciones.map((c) => (
                    <label key={c.id} className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition", envioId === c.id ? "border-acento bg-acento/20" : "border-white/20 bg-white/8 hover:bg-white/14")}>
                      <input type="radio" name="envio" className="size-4 accent-[var(--acento)]" checked={envioId === c.id} onChange={() => { setEnvioId(c.id); setErr((x) => ({ ...x, envio: "" })); }} />
                      <Truck className="size-5 shrink-0 text-acento-claro" />
                      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{c.nombre}</span><span className="block text-xs text-white/70">{c.plazo}</span></span>
                      <span className={cn("tabular text-sm font-bold", c.costo === 0 && "text-ok")}>{c.costo === 0 ? "Gratis" : fmtMoney(c.costo)}</span>
                    </label>
                  ))}
                  {err.envio && <p role="alert" className="text-xs font-medium text-bad">{err.envio}</p>}
                </fieldset>
              )}
              {envio && envio.id !== "retiro" && (
                <div className="animate-rise grid gap-4 sm:grid-cols-2">
                  <Campo label="Calle y número" htmlFor="c-calle" error={err.calle}><Input id="c-calle" autoComplete="address-line1" className="field" placeholder="Gorriti 4850" value={f.calle} onChange={set("calle")} aria-invalid={!!err.calle} /></Campo>
                  <Campo label="Piso y departamento (opcional)" htmlFor="c-depto"><Input id="c-depto" className="field" placeholder="3 B" value={f.depto} onChange={set("depto")} /></Campo>
                  <Campo label="Localidad" htmlFor="c-ciudad" error={err.ciudad}><Input id="c-ciudad" className="field" placeholder="Palermo" value={f.ciudad} onChange={set("ciudad")} aria-invalid={!!err.ciudad} /></Campo>
                  <Campo label="Provincia" htmlFor="c-prov"><Pick id="c-prov" label="Provincia" value={f.provincia} onChange={(v) => setF((x) => ({ ...x, provincia: v }))} options={PROVINCIAS} /></Campo>
                </div>
              )}
              <Button type="button" className={cn(btnAcento, "justify-self-end")} onClick={seguir}>Continuar con el pago<ArrowRight className="size-4" /></Button>
            </>
          ) })}

          {Seccion({ n: 2, titulo: "Pago", resumen: "", children: (
            <>
              {mediosActivos.length === 0 ? (
                <p role="alert" className="rounded-2xl border border-bad/40 bg-bad/15 px-4 py-3 text-sm">No hay medios de pago activos. Se activan desde el <Link href="/panel?tab=pagos" className="font-bold underline">panel de lanzamiento</Link>.</p>
              ) : (
                <fieldset className="grid gap-2">
                  <legend className="sr-only">Medio de pago</legend>
                  {mediosActivos.map((m) => {
                    const I = ICONO_MEDIO[m.id] ?? Wallet;
                    return (
                      <label key={m.id} className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition", medioId === m.id ? "border-acento bg-acento/20" : "border-white/20 bg-white/8 hover:bg-white/14")}>
                        <input type="radio" name="medio" className="size-4 accent-[var(--acento)]" checked={medioId === m.id} onChange={() => { setMedioId(m.id); setErr({}); }} />
                        <I className="size-5 shrink-0 text-acento-claro" />
                        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{m.nombre}</span><span className="block text-xs text-white/70">{m.detalle}</span></span>
                        {m.id === "transferencia" && <span className="rounded-full bg-salvia px-2 py-0.5 text-[11px] font-bold text-[#143220]">-{TIENDA.descuentoTransferencia} %</span>}
                      </label>
                    );
                  })}
                  {err.medio && <p role="alert" className="text-xs font-medium text-bad">{err.medio}</p>}
                </fieldset>
              )}
              {medio?.id === "tarjeta" && (
                <div className="animate-rise grid gap-4 sm:grid-cols-4">
                  <Campo label="Número de tarjeta" htmlFor="c-tarjeta" error={err.tarjeta} className="sm:col-span-2">
                    <Input id="c-tarjeta" inputMode="numeric" autoComplete="cc-number" className="field tabular" placeholder="4509 9535 6623 3704" value={f.tarjeta} aria-invalid={!!err.tarjeta}
                      onChange={(e) => { setF((x) => ({ ...x, tarjeta: e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim() })); setErr((x) => ({ ...x, tarjeta: "" })); }} />
                  </Campo>
                  <Campo label="Vencimiento" htmlFor="c-vence" error={err.vence}><Input id="c-vence" autoComplete="cc-exp" className="field tabular" placeholder="08/29" maxLength={5} value={f.vence} onChange={set("vence")} aria-invalid={!!err.vence} /></Campo>
                  <Campo label="Código" htmlFor="c-cvv" error={err.cvv}><Input id="c-cvv" inputMode="numeric" autoComplete="cc-csc" className="field tabular" placeholder="123" maxLength={4} value={f.cvv} onChange={set("cvv")} aria-invalid={!!err.cvv} /></Campo>
                  <Campo label="Cuotas" htmlFor="c-cuotas" className="sm:col-span-4">
                    <Pick id="c-cuotas" label="Cuotas" value={cuotas} onChange={setCuotas}
                      options={[1, ...TIENDA.cuotasSinInteres].map((n) => ({ value: String(n), label: n === 1 ? `1 pago de ${fmtMoney(total)}` : `${n} cuotas sin interés de ${fmtMoney(cuota(total, n))}` }))} />
                  </Campo>
                </div>
              )}
              {medio?.id === "mercadopago" && <p className="animate-rise rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/85">Al confirmar se abre Mercado Pago para completar el pago y después se vuelve a la tienda con el pedido aprobado.</p>}
              {medio?.id === "transferencia" && <p className="animate-rise rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/85">El descuento ya está aplicado en el total. El pedido se reserva 48 horas hasta recibir el comprobante.</p>}
              <Button type="button" className={cn(btnAcento, "h-12 text-base")} disabled={procesando || mediosActivos.length === 0} onClick={confirmar}>
                {procesando ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                {procesando ? "Procesando el pago" : `Confirmar y pagar ${fmtMoney(total)}`}
              </Button>
            </>
          ) })}
        </form>

        <aside className="glass sticky top-24 self-start rounded-3xl p-5" aria-label="Resumen del pedido">
          <h2 className="text-xl font-semibold">Resumen</h2>
          <ul className="mt-3 divide-y divide-white/12">
            {lineas.map((l) => (
              <li key={`${l.productoId}-${l.opcion}`} className="flex items-center gap-3 py-3">
                <span className="relative shrink-0">
                  <Foto src={l.producto.img} alt="" className="size-14 rounded-2xl border border-white/20" />
                  <span className="tabular absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-acento text-[11px] font-bold text-tinta">{l.cantidad}</span>
                </span>
                <span className="min-w-0 flex-1"><span className="line-clamp-2 text-sm leading-snug font-semibold">{l.producto.nombre}</span>{l.opcion && <span className="text-xs text-white/70">{l.opcion}</span>}</span>
                <span className="tabular text-sm font-semibold">{fmtMoney(l.importe)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2">
            <label htmlFor="cupon" className="sr-only">Cupón de descuento</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/65" />
                <Input id="cupon" className="field pl-10 uppercase" placeholder="Cupón" value={cupon} disabled={cuponOk} aria-invalid={!!cuponErr} onChange={(e) => { setCupon(e.target.value); setCuponErr(""); }} />
              </div>
              <Button type="button" variant="outline" className={btnGlass} disabled={cuponOk || !cupon.trim()} onClick={aplicarCupon}>{cuponOk ? <Check className="size-4" /> : "Aplicar"}</Button>
            </div>
            {cuponErr ? <p role="alert" className="mt-1.5 text-xs font-medium text-bad">{cuponErr}</p> : !cuponOk && <p className="mt-1.5 text-xs text-white/65">El cupón de bienvenida es ALBA10.</p>}
          </div>
          <dl className="mt-4 grid gap-2 border-t border-white/15 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-white/80">Subtotal</dt><dd className="tabular font-semibold">{fmtMoney(subtotal)}</dd></div>
            {cuponOk && <div className="flex justify-between text-salvia"><dt className="flex items-center gap-1.5"><Tag className="size-3.5" />Cupón {CUPON.codigo}</dt><dd className="tabular font-semibold">-{fmtMoney(dCupon)}</dd></div>}
            {dTransfer > 0 && <div className="flex justify-between text-salvia"><dt className="flex items-center gap-1.5"><BadgePercent className="size-3.5" />Transferencia</dt><dd className="tabular font-semibold">-{fmtMoney(dTransfer)}</dd></div>}
            <div className="flex justify-between"><dt className="text-white/80">Envío</dt><dd className={cn("tabular font-semibold", envio?.costo === 0 && "text-ok")}>{envio ? (envio.costo === 0 ? "Gratis" : fmtMoney(envio.costo)) : "Se calcula en el paso 2"}</dd></div>
            <div className="mt-1 flex items-baseline justify-between border-t border-white/15 pt-3"><dt className="font-semibold">Total</dt><dd className="tabular font-heading text-3xl font-semibold">{fmtMoney(total)}</dd></div>
          </dl>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-white/70"><Lock className="size-3.5" />Pago cifrado. No guardamos los datos de la tarjeta.</p>
        </aside>
      </div>
    </>
  );
}
