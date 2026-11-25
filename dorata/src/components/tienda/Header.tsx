import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/Logo";
import { CartButton, MenuButton } from "./HeaderActions";
import { getLegalPages, getNavCategories, getStoreSettings } from "@/server/catalog";

export async function Header() {
  const [t, categories, settings, legal] = await Promise.all([getTranslations("nav"), getNavCategories(), getStoreSettings(), getLegalPages()]);
  const help = legal.filter((p) => ["warranty", "shipping", "returns", "contact"].includes(p.kind));
  const labels = {
    menu: t("menu"), close: t("close"), categories: t("categories"), help: t("help"), shop: t("shop"), home: t("home"),
    cart: t("cart"), cartWithCount: t("cartWithCount", { count: 999 }).replace("999", "#"),
  };
  return (
    <header className="velvet sticky top-0 z-30 border-b border-velvet-line">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[48px_1fr_48px] items-center px-2">
        <MenuButton categories={categories.map(({ slug, name }) => ({ slug, name }))} help={help} settings={settings} labels={labels} />
        <Link href="/" aria-label={t("home")} className="justify-self-center">
          <Logo logoUrl={settings.logoUrl} tone="dark" size="sm" />
        </Link>
        <div className="justify-self-end"><CartButton labels={labels} /></div>
      </div>
    </header>
  );
}
