import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { JsonLd, ORG_JSON_LD, WEBSITE_JSON_LD } from "@/components/json-ld";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={ORG_JSON_LD} />
      <JsonLd data={WEBSITE_JSON_LD} />
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </>
  );
}
