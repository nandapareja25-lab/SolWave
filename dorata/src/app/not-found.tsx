import Link from "next/link";
import "./globals.css";

// 404 fuera de cualquier idioma (rutas que no pasan por el middleware).
export default function GlobalNotFound() {
  return (
    <html lang="es">
      <body className="grid min-h-dvh place-items-center bg-ivory p-6 text-center">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-gold-deep">404</p>
          <h1 className="mt-2 text-[28px]">No encontramos esta página</h1>
          <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-6 text-on-dark">Volver al inicio</Link>
        </div>
      </body>
    </html>
  );
}
