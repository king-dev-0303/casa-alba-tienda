import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Shell } from "@/components/shell";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Casa Alba - objetos para la mesa, el té y el verde de casa",
  description:
    "Tienda online de cerámica, madera, bronce y textiles para el hogar. Cuotas sin interés, envíos a todo el país y retiro en el showroom.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`dark ${manrope.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <StoreProvider>
          <TooltipProvider>
            <Shell>{children}</Shell>
            <Toaster position="bottom-left" theme="dark" />
          </TooltipProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
