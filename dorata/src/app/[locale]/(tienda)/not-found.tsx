import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/tienda/ProductImage";

export default async function StoreNotFound() {
  const t = await getTranslations("system");
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
      <div className="filete-doble grid size-28 place-items-center rounded-full bg-surface"><ProductImage image={{ url: null, illustration: "clover", alt: "" }} className="size-20 rounded-full" /></div>
      <h1 className="mt-6 font-display text-[28px]">{t("notFoundTitle")}</h1>
      <p className="mt-2 text-[15px] text-ink-2">{t("notFoundBody")}</p>
      <Link href="/" className="press mt-6 flex h-12 items-center rounded-full bg-ink px-6 text-[15px] font-semibold text-on-dark">{t("notFoundCta")}</Link>
    </div>
  );
}
