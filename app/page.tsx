import Link from "next/link";
import { ArrowRight, Boxes, Clock, RefreshCcw, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, stockStatusInfo } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 min ISR (when dynamic = auto)

export default async function HomePage() {
  // Fetch categories + featured products
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });

  const featuredProducts = await prisma.product.findMany({
    where: { isActive: true },
    take: 6,
    orderBy: { createdAt: "asc" },
    include: {
      prices: { take: 1, orderBy: { createdAt: "desc" } },
      inventorySnapshot: true,
      category: true,
    },
  });

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="container-tight py-12 md:py-16">
          <div className="max-w-3xl">
            <Badge variant="info" className="mb-4">
              10 лет на рынке · 50+ B2B-клиентов · Астана
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              Оптовая закупка ингредиентов для кондитерских и HoReCa
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Шоколад, бакалея, начинки, упаковка. Оптовые цены, доставка по Астане,
              подписка для регулярных закупок. Минимальный заказ 5 000 ₸.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/catalog">
                <Button size="lg">
                  Открыть каталог <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/subscription">
                <Button size="lg" variant="outline">
                  Как работает подписка
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border bg-background">
        <div className="container-tight grid gap-6 py-8 md:grid-cols-4">
          <TrustItem
            icon={<Clock className="h-5 w-5" />}
            title="Доставка каждые 3 часа"
            description="По Астане в день заказа"
          />
          <TrustItem
            icon={<Boxes className="h-5 w-5" />}
            title="50 поставщиков"
            description="Прямые контракты, без посредников"
          />
          <TrustItem
            icon={<RefreshCcw className="h-5 w-5" />}
            title="Подписка"
            description="Регулярная доставка с предсказанием"
          />
          <TrustItem
            icon={<Users className="h-5 w-5" />}
            title="76 000 подписчиков"
            description="Сообщество кондитеров КЗ"
          />
        </div>
      </section>

      {/* Segment-first onboarding (THE thing missing from current Tilda site) */}
      <section className="container-tight py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Что вам нужно?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Один каталог, три способа работать — выберите ваш сценарий.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SegmentCard
            href="/catalog?segment=enterprise"
            color="border-l-segment-s1"
            badge="Для ресторанов и кафе"
            title="Быстрый оптовый заказ"
            description="Каталог из 500+ SKU. Сохранённые корзины, повтор заказа, оптовые цены."
            features={["Поиск и фильтры", "Сохранённые заказы", "История и документы", "Доставка к утру"]}
          />
          <SegmentCard
            href="/subscription"
            color="border-l-segment-s2"
            badge="Для кондитерских"
            title="Подписка на ингредиенты"
            description="Регулярная доставка с предсказанием когда что закончится."
            features={["Гибкий график", "Уведомления за день", "Подтверждение в WhatsApp", "Edit / Skip / Pause"]}
          />
          <SegmentCard
            href="/group-buying"
            color="border-l-segment-s3"
            badge="Для самозанятых · скоро"
            title="Групповые закупки"
            description="Объединяйтесь для оптовых цен без необходимости держать склад."
            features={["Оптовые цены", "Фиксация цены при старте", "Защищённая экономика", "Без рисков"]}
            soon
          />
        </div>
      </section>

      {/* Categories */}
      <section className="container-tight py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Категории</h2>
            <p className="mt-2 text-muted-foreground">Всё что нужно для кондитерской и HoReCa</p>
          </div>
          <Link href="/catalog" className="hidden text-sm font-medium text-primary hover:underline md:inline">
            Весь каталог →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalog/${cat.slug}`}
              className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-accent/50"
            >
              <div className="text-sm font-medium group-hover:text-primary">{cat.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{cat._count.products} товаров</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container-tight py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Популярное</h2>
          <p className="mt-2 text-muted-foreground">Топ-SKU за последний год</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {featuredProducts.map((product) => {
            const price = product.prices[0];
            const stock = product.inventorySnapshot;
            const stockInfo = stock ? stockStatusInfo(stock.stockStatus) : null;

            return (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group flex flex-col rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex aspect-square items-center justify-center rounded-md bg-muted">
                  <span className="text-4xl">📦</span>
                </div>
                <div className="mb-1 text-xs text-muted-foreground">{product.brand} · {product.packLabel}</div>
                <h3 className="mb-2 line-clamp-2 text-sm font-medium group-hover:text-primary">
                  {product.name}
                </h3>
                <div className="mt-auto flex items-end justify-between">
                  {price && (
                    <div>
                      <div className="tabular text-lg font-semibold">{formatPrice(price.basePrice.toString())}</div>
                      <div className="text-xs text-muted-foreground">{price.unitLabel}</div>
                    </div>
                  )}
                  {stockInfo && <Badge variant={stockInfo.tone}>{stockInfo.label}</Badge>}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Мин. заказ: {product.minOrderQty} {product.unitType === "kg" ? "шт" : "уп"}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-border bg-muted/40">
        <div className="container-tight py-12 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Не нашли что искали?</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Напишите в WhatsApp — поможем подобрать аналог, оформить срочный заказ или
            подключить подписку под ваши нужды.
          </p>
          <a
            href="https://api.whatsapp.com/send/?phone=77078607779"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex"
          >
            <Button size="lg">Написать в WhatsApp</Button>
          </a>
        </div>
      </section>
    </>
  );
}

// ============================================================
// Sub-components
// ============================================================

function TrustItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}

function SegmentCard({
  href,
  color,
  badge,
  title,
  description,
  features,
  soon = false,
}: {
  href: string;
  color: string;
  badge: string;
  title: string;
  description: string;
  features: string[];
  soon?: boolean;
}) {
  const Inner = (
    <div className={`relative h-full rounded-lg border border-l-4 ${color} border-border bg-card p-6 transition-all ${soon ? "opacity-75" : "hover:shadow-md hover:border-l-primary"}`}>
      <Badge variant={soon ? "outline" : "secondary"} className="mb-3">{badge}</Badge>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      <ul className="space-y-1 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {!soon && (
        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
          Подробнее <ArrowRight className="h-3 w-3" />
        </div>
      )}
    </div>
  );

  if (soon) return Inner;
  return <Link href={href}>{Inner}</Link>;
}
