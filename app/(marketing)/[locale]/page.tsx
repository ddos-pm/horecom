import Image from "next/image";
import { MessageCircle, ArrowRight } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { COMPANY } from "@/lib/company";
import { getHomePageData } from "@/lib/home-loader";
import { StatusStrip } from "@/components/marketing/status-strip";
import { SuppliersMarquee } from "@/components/marketing/suppliers-marquee";
import { TopMonthList } from "@/components/marketing/top-month-list";
import { formatUnit } from "@/lib/units";
import { localizePackLabel } from "@/lib/format-pack";
import { pickLocalized } from "@/lib/i18n-field";
import "./home.css";

// ISR — Tyler/grant reviewers should never wait on a cold start. Marketing
// home re-renders in the background every 10 min; stale-while-revalidate
// keeps the cached page warm for any concurrent visitors.
export const revalidate = 600;

const CAT_ICONS: Record<string, React.ReactNode> = {
  "chocolate-glazes": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 4v16M16 4v16M4 8h16M4 16h16" />
    </svg>
  ),
  syrups: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 2h8v4l2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8l2-2V2Z" />
    </svg>
  ),
  ingredients: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  ),
  fillings: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8h16l-1.5 11a2 2 0 0 1-2 2H7.5a2 2 0 0 1-2-2L4 8Z" />
      <path d="M9 5a3 3 0 0 1 6 0v3H9V5Z" />
    </svg>
  ),
  "food-colorings": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2a10 10 0 1 0 10 10H12V2Z" />
      <circle cx="9" cy="7" r="1.5" fill="currentColor" />
    </svg>
  ),
  dairy: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 2h8v4l2 4v9a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-9l2-4V2Z" />
    </svg>
  ),
  frozen: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" />
    </svg>
  ),
  "sauces-canned": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 2h12v3H6zM7 5h10v17H7z" />
      <path d="M10 12h4" />
    </svg>
  ),
  "parchment-foil": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16v14H4zM4 6l4-4h8l4 4" />
    </svg>
  ),
  "bakery-staples": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8a8 4 0 1 0 16 0M4 8v8a8 4 0 0 0 16 0V8M4 12a8 4 0 0 0 16 0" />
    </svg>
  ),
  sprinkles: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="7" cy="8" r="1.5" />
      <circle cx="13" cy="6" r="1.5" />
      <circle cx="17" cy="11" r="1.5" />
      <circle cx="9" cy="14" r="1.5" />
      <circle cx="15" cy="17" r="1.5" />
      <circle cx="6" cy="18" r="1.5" />
    </svg>
  ),
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";

  // Cached for 10 min — first visitor pays for the 4 Tokyo Supabase trips,
  // everyone else hits the warm cache. See lib/home-loader.ts for why we
  // don't rely on Next's SSG here despite the build output labelling it ●.
  const { categories, heroProduct, featured, skuCount } = await getHomePageData();
  const hero = heroProduct ?? featured[0] ?? null;

  return (
    <>
      {/* === HERO === */}
      <section className="hero">
        <div className="grid-bg" />
        <div className="hero-glow" />
        <div className="hero-glow-2" />

        <StatusStrip />

        <div className="container-x hero-body">
          <div className="hero-layout">
            <div>
              {isEn ? (
                <>
                  <h1>Wholesale supply for bakeries, cafes, and pastry chefs in&nbsp;Astana.</h1>
                  <p className="hero-subhead">wholesale and in stock.</p>

                  <p className="lede">
                    Smart procurement: we keep an eye on your stock, guarantee reliable supply
                    and fast delivery. Three procurement modes — for HoReCa, for independent
                    pastry makers, and group buying for individual customers.
                  </p>

                  <div className="hero-ctas">
                    <Link href="/catalog" className="btn btn-orange btn-lg cta-arrow">
                      Open catalog · {skuCount} products
                      <ArrowRight className="h-3.5 w-3.5 cta-arrow-icon" />
                    </Link>
                    <a
                      href={COMPANY.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-lg hero-wa-btn"
                    >
                      <MessageCircle className="h-4 w-4" style={{ color: "#25D366" }} />
                      Message on WhatsApp
                    </a>
                  </div>

                  <div className="min-fact">
                    <span>
                      <b>Free delivery from 20,000 ₸</b>
                    </span>
                    <span className="show-md">·</span>
                    <span>Bank transfer, KaspiPay link, or invoice — bookkeeping-ready documents</span>
                  </div>
                </>
              ) : (
                <>
                  <h1>Поставки для пекарен, кофеен и кондитеров в&nbsp;Астане.</h1>
                  <p className="hero-subhead">оптом и в наличии.</p>

                  <p className="lede">
                    Умные закупки: помогаем следить за остатками, обеспечиваем стабильные поставки и быструю
                    доставку. 3 сценария закупок: для HoReCa, домашнего кондитера, групповые закупки для
                    физических лиц.
                  </p>

                  <div className="hero-ctas">
                    <Link href="/catalog" className="btn btn-orange btn-lg cta-arrow">
                      Открыть каталог · {skuCount} товаров
                      <ArrowRight className="h-3.5 w-3.5 cta-arrow-icon" />
                    </Link>
                    <a
                      href={COMPANY.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-lg hero-wa-btn"
                    >
                      <MessageCircle className="h-4 w-4" style={{ color: "#25D366" }} />
                      Написать в WhatsApp
                    </a>
                  </div>

                  <div className="min-fact">
                    <span>
                      <b>Бесплатная доставка от 20 000 ₸</b>
                    </span>
                    <span className="show-md">·</span>
                    <span>Безнал, ссылка KaspiPay или счёт на оплату, документы для бухгалтерии</span>
                  </div>
                </>
              )}
            </div>

            {/* Hero right: live product card preview */}
            <div className="hero-card-wrap">
              <div className="hero-card">
                <div className="hero-card-head">
                  <span className="pill" style={{ height: 20, padding: "0 8px", borderRadius: 6 }}>
                    {isEn ? "What a product card looks like" : "Так выглядит карточка"}
                  </span>
                  <span style={{ marginLeft: "auto" }}>PDP · {hero?.sku ?? "HC-DAIRY-0067"}</span>
                </div>
                <div className="hero-card-body">
                  <Link
                    href={`/product/${hero?.slug ?? "maslo-rogachev-82-5-5kg"}`}
                    className="hero-card-img"
                    aria-label={hero?.name ?? (isEn ? "Open product card" : "Открыть карточку товара")}
                  >
                    {hero?.imageUrl && (
                      <Image
                        src={hero.imageUrl}
                        alt={hero.name}
                        fill
                        sizes="(max-width: 768px) 132px, 240px"
                        priority
                        style={{ objectFit: "contain" }}
                      />
                    )}
                  </Link>
                  <div className="hero-card-info">
                    <div className="meta">
                      {hero?.brand ?? "Рогачёв"} · {hero?.category ? pickLocalized(hero.category, locale, "name") : isEn ? "Dairy" : "Молочная"}
                    </div>
                    <div className="name">{hero?.name ?? (isEn ? 'Butter "Rogachev" 82.5% 5 kg' : 'Масло "Рогачев" 82,5% 5кг')}</div>
                    <div className="price">
                      <b>
                        {hero?.prices[0]
                          ? Number(hero.prices[0].basePrice).toLocaleString(isEn ? "en-US" : "ru-RU")
                          : (isEn ? "33,800" : "33 800")}{" "}
                        ₸
                      </b>
                      <span>/ {hero?.packLabel ? localizePackLabel(hero.packLabel, locale) : isEn ? "pack" : "упак"}</span>
                    </div>
                  </div>
                </div>
                <div className="hero-card-data">
                  <div>
                    <div className="k">MOQ</div>
                    <div className="v">{hero?.minOrderQty ?? 1} {isEn ? "pack" : "уп."}</div>
                  </div>
                  <div>
                    <div className="k">{isEn ? "In stock" : "В наличии"}</div>
                    <div className="v green">
                      {hero?.inventorySnapshot?.availableQty ?? 47} {formatUnit(hero?.unitType) || "кг"}
                    </div>
                  </div>
                  <div>
                    <div className="k">{isEn ? "Delivery" : "Доставка"}</div>
                    <div className="v">{isEn ? "tomorrow by 12:00" : "завтра до 12:00"}</div>
                  </div>
                </div>
                <div className="hero-card-foot">
                  <Link href={`/product/${hero?.slug ?? "maslo-rogachev-82-5-5kg"}`} className="btn btn-primary" style={{ flex: 1 }}>
                    {isEn ? "Add to cart" : "В корзину"}
                  </Link>
                  <a
                    href={COMPANY.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost hero-card-wa-btn"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === TRUST === */}
      <section className="trust">
        <div className="container-x">
          <div className="trust-grid">
            <div className="trust-item">
              <div className="num">10<span className="u">{isEn ? "yrs" : "лет"}</span></div>
              <div className="lbl"><b>{isEn ? "on the market" : "на рынке"}</b><br />{isEn ? "since 2016" : "с 2016 года"}</div>
            </div>
            <div className="trust-item">
              <div className="num">50<span className="u">+</span></div>
              <div className="lbl"><b>{isEn ? "B2B customers" : "B2B-клиентов"}</b><br />{isEn ? "recurring orders" : "регулярные заказы"}</div>
            </div>
            <div className="trust-item">
              <div className="num">{skuCount}<span className="u">{isEn ? "SKUs" : "товаров"}</span></div>
              <div className="lbl"><b>{isEn ? "in the catalog" : "в каталоге"}</b><br />{isEn ? "11 categories, live stock levels" : "11 категорий, реальные остатки"}</div>
            </div>
            <div className="trust-item">
              <div className="num">76<span className="u">K</span></div>
              <div className="lbl"><b>{isEn ? "followers" : "подписчиков"}</b><br />{isEn ? "@horecom.kz on Instagram" : "@horecom.kz в Instagram"}</div>
            </div>
            <div className="trust-item">
              <div className="num">3<span className="u">{isEn ? "h" : "ч"}</span></div>
              <div className="lbl"><b>{isEn ? "delivery window" : "окно доставки"}</b><br />{isEn ? "across Astana" : "по Астане"}</div>
            </div>
          </div>

          <div className="src-strip">
            <b>{isEn ? "Direct contracts:" : "Прямые контракты:"}</b>
            <div className="src-list">
              <span>Barry&nbsp;Callebaut</span><span>·</span>
              <span>IRCA</span><span>·</span>
              <span>Sicao</span><span>·</span>
              <span>1883</span><span>·</span>
              <span>AmeriColor</span><span>·</span>
              <span>Andros</span><span>·</span>
              <span className="show-md">Berybert</span>
              <span className="show-md">·</span>
              <span className="show-md">{isEn ? "Lyubimo" : "Любимо"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* === SEGMENTS === */}
      <section className="s">
        <div className="container-x">
          <div className="s-head">
            <div className="eyebrow">
              {isEn ? "One catalog · three workflows" : "Один каталог · три сценария"}
            </div>
            <h2>{isEn ? "How to buy?" : "Как закупиться?"}</h2>
            <p className="sub">
              {isEn
                ? "Restaurants, pastry shops, and independent pastry makers each buy differently. We built three workflows on one warehouse — pick yours."
                : "Ресторан, кондитерская и домашний кондитер закупают по-разному. Мы построили три рабочих процесса на одной складской инфраструктуре — выберите свой."}
            </p>
          </div>

          <div className="segs">
            <Link href="/catalog?segment=enterprise" className="seg seg-1">
              <div className="seg-top">
                <span className="pill pill-blue">{isEn ? "Restaurants and cafes" : "Рестораны и кафе"}</span>
                <span className="seg-num">01</span>
              </div>
              <h3>{isEn ? "Fast wholesale order" : "Быстрый оптовый заказ"}</h3>
              <div className="who">
                {isEn ? (
                  <><b>For teams with a warehouse and a buyer.</b> Build a cart in 3 minutes, repeat last week's order, download the waybill.</>
                ) : (
                  <><b>Для тех у кого есть склад и закупщик.</b> Собрать корзину за 3 минуты, повторить заказ прошлой недели, скачать накладную.</>
                )}
              </div>
              <div className="seg-mock">
                <div className="seg-mock-row"><span>{isEn ? "Repeat order #1247" : "Повтор заказа #1247"}</span><b>{isEn ? "74 items · 285,400 ₸" : "74 позиции · 285 400 ₸"}</b></div>
                <div className="seg-mock-row"><span>{isEn ? "Substitution: Cocoa JB → Sicao" : "Замена: Какао JB → Sicao"}</span><b style={{ color: "var(--c-orange)" }}>{isEn ? "awaiting reply" : "ждёт ответа"}</b></div>
                <div className="seg-mock-row"><span>{isEn ? "Shipping tomorrow" : "К отгрузке завтра"}</span><b>11:00–14:00</b></div>
              </div>
              <ul className="ul-clean seg-feat">
                <li>{isEn ? `Search and filters across ${skuCount} SKUs` : `Поиск и фильтры по ${skuCount} товаров`}</li>
                <li>{isEn ? "Saved carts · order repeat" : "Сохранённые корзины · повтор заказа"}</li>
                <li>{isEn ? "Waybills, invoices, contracts inside the dashboard" : "Накладные, СФ, договоры в ЛК"}</li>
              </ul>
              <span className="seg-cta">{isEn ? "Open the catalog" : "Перейти в каталог"}</span>
            </Link>

            <Link href="/subscription" className="seg seg-2">
              <div className="seg-top">
                <span className="pill pill-orange">{isEn ? "Bakeries without storage" : "Кондитерские без склада"}</span>
                <span className="seg-num">02</span>
              </div>
              <h3>{isEn ? "Supply subscription" : "Подписка на поставку"}</h3>
              <div className="who">
                {isEn ? (
                  <><b>For small bakeries that can't store stock.</b> We deliver weekly — the day before shipment we ask what to bring.</>
                ) : (
                  <><b>Для маленьких пекарен где негде хранить.</b> Доставляем каждую неделю — за день до отгрузки спросим, что подвезти.</>
                )}
              </div>
              <div className="seg-mock">
                <div className="seg-mock-row"><span>{isEn ? "Next delivery" : "Следующая доставка"}</span><b>{isEn ? "Wed, 10:30" : "среда, 10:30"}</b></div>
                <div className="seg-mock-row"><span>{isEn ? "12 items in basket" : "Состав 12 позиций"}</span><b>{isEn ? "187,200 ₸" : "187 200 ₸"}</b></div>
                <div className="seg-mock-row"><span>{isEn ? "WhatsApp confirmation" : "WhatsApp с подтверждением"}</span><b style={{ color: "var(--c-success)" }}>{isEn ? "tomorrow 09:00" : "завтра 09:00"}</b></div>
              </div>
              <ul className="ul-clean seg-feat">
                <li>{isEn ? "Flexible schedule: day and time" : "Гибкий график: дни и время"}</li>
                <li>{isEn ? "Predictive replenishment engine" : "Предиктивный движок дозакупа"}</li>
                <li>{isEn ? "Edit · Skip · Pause in one tap" : "Edit · Skip · Pause в один тап"}</li>
              </ul>
              <span className="seg-cta" style={{ color: "var(--c-orange-700)" }}>{isEn ? "How the supply subscription works" : "Как работает подписка на поставку"}</span>
            </Link>

            <Link href="/group-buying" className="seg seg-3">
              <div className="seg-top">
                <span className="pill pill-dark">{isEn ? "Independent pastry makers" : "Самозанятые кондитеры"}</span>
                <span className="seg-num">03</span>
              </div>
              <h3>{isEn ? "Group buying" : "Групповая закупка"}</h3>
              <div className="who">
                {isEn ? (
                  <><b>For home pastry chefs.</b> Team up with 3–5 colleagues to unlock the wholesale price — without your own warehouse or a tonne of flour to yourself.</>
                ) : (
                  <><b>Для домашних кондитеров.</b> Объединитесь с 3–5 коллегами и получите оптовую цену — без склада и тонны муки в одиночку.</>
                )}
              </div>
              <div className="seg-mock">
                <div className="seg-mock-row"><span>{isEn ? "Group · Flour 25 kg" : "Закупка · Мука 25 кг"}</span><b>{isEn ? "4 / 6 people" : "4 / 6 чел"}</b></div>
                <div className="seg-mock-row"><span>{isEn ? "Until deadline" : "До дедлайна"}</span><b>{isEn ? "2 d 14 h" : "2 дня 14 часов"}</b></div>
                <div className="seg-mock-row"><span>{isEn ? "Wholesale vs retail" : "Цена опт vs розница"}</span><b style={{ color: "var(--c-success)" }}>−18%</b></div>
              </div>
              <ul className="ul-clean seg-feat">
                <li>{isEn ? "Price locked at group start" : "Цена защищена при старте группы"}</li>
                <li>{isEn ? "Share link via Instagram / WhatsApp" : "Share-ссылка в Instagram / WhatsApp"}</li>
                <li>{isEn ? "No risk if the group doesn't fill" : "Без рисков если группа не собралась"}</li>
              </ul>
              <span className="seg-cta">
                <span className="pill pill-orange" style={{ fontSize: 10 }}>{isEn ? "Soon" : "Скоро"}</span>
                <span style={{ marginLeft: 8 }}>{isEn ? "Join the pilot" : "Войти в пилот"}</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      <SuppliersMarquee />

      {/* === CATEGORIES === */}
      <section className="s" style={{ paddingTop: 0 }}>
        <div className="container-x">
          <div className="s-head cats-head">
            <div>
              <div className="eyebrow">{isEn ? "Catalog" : "Каталог"}</div>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)" }}>
                {isEn ? `11 categories · ${skuCount} products` : `11 категорий · ${skuCount} товаров`}
              </h2>
            </div>
            <Link href="/catalog" className="btn btn-ghost show-md">
              {isEn ? "Open the full catalog →" : "Открыть полный каталог →"}
            </Link>
          </div>

          <div className="cats">
            {categories.map((c) => (
              <Link key={c.id} href={`/catalog?category=${c.slug}`} className="cat">
                <div className="cat-icon">
                  {CAT_ICONS[c.slug] ?? CAT_ICONS["ingredients"]}
                </div>
                <div className="cat-name">{pickLocalized(c, locale, "name")}</div>
                <div className="cat-count">
                  <b>{c._count.products}</b>{" "}
                  {isEn
                    ? (c._count.products === 1 ? "item" : "items")
                    : plural(c._count.products, "позиция", "позиции", "позиций")}
                </div>
              </Link>
            ))}
            <Link href="/catalog" className="cat cat-dark">
              <div className="cat-icon">
                <ArrowRight className="h-7 w-7" />
              </div>
              <div className="cat-name">
                {isEn ? <>Full<br />catalog</> : <>Весь<br />каталог</>}
              </div>
              <div className="cat-count"><b>{skuCount}</b> {isEn ? "products" : "товаров"}</div>
            </Link>
          </div>
        </div>
      </section>

      {/* === FEATURED PRODUCTS === */}
      <section className="s" style={{ paddingTop: 0 }}>
        <div className="container-x">
          <div className="s-head cats-head">
            <div>
              <div className="eyebrow">{isEn ? "Top of the month" : "Топ за месяц"}</div>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)" }}>
                {isEn ? "Most-ordered SKUs" : "Что заказывают чаще всего"}
              </h2>
            </div>
            <Link href="/catalog" className="btn btn-ghost show-md">
              {isEn ? "All products →" : "Все товары →"}
            </Link>
          </div>

          <TopMonthList products={featured} />
        </div>
      </section>

      {/* === OPERATIONS BAND === */}
      <section className="ops-band s">
        <div className="container-x">
          <div className="ops-grid">
            <div>
              <div className="eyebrow ops-eyebrow">
                <span className="ops-eyebrow-line" /> {isEn ? "How an order flows" : "Как работает заказ"}
              </div>
              <h2 className="ops-h2">
                {isEn ? "Fast checkout." : "Быстрое оформление."}
              </h2>
              <p className="ops-p">
                {isEn
                  ? "No phone calls, no waiting. Our chat bot processes your order in a minute. Add products to the cart → confirm on WhatsApp → receive the waybill."
                  : "Без звонков и ожидания. Наш чат-бот оформит ваш заказ за минуту. Добавьте товары в корзину → подтвердите заявку в WhatsApp → получите накладную."}
              </p>

              <div className="flow">
                {(isEn
                  ? [
                      { state: "done", n: "1", ttl: "Built the cart in the catalog", sub: "14 items · 187,200 ₸ · MOQ respected", time: "10:24" },
                      { state: "done", n: "2", ttl: "Confirmed on WhatsApp", sub: "\"Confirmed · ship tomorrow 11:00\"", time: "10:28" },
                      { state: "active", n: "3", ttl: "KaspiPay link or invoice on request", sub: "Bank transfer — invoice already in your inbox", time: "now" },
                      { state: "", n: "4", ttl: "Shipment and delivery", sub: "Every 3 hours · pickup or courier", time: "tomorrow" },
                      { state: "", n: "5", ttl: "Waybill and invoice inside the dashboard", sub: "Automatically after delivery", time: "+0 h" },
                    ]
                  : [
                      { state: "done", n: "1", ttl: "Собрали корзину в каталоге", sub: "14 позиций · 187 200 ₸ · мин. заказ соблюдён", time: "10:24" },
                      { state: "done", n: "2", ttl: "Подтвердили в WhatsApp", sub: "«Подтверждено · отгрузка завтра 11:00»", time: "10:28" },
                      { state: "active", n: "3", ttl: "Ссылка на KaspiPay или счёт на оплату по запросу", sub: "Безнал по реквизитам — счёт уже на почте", time: "сейчас" },
                      { state: "", n: "4", ttl: "Отгрузка и доставка", sub: "Каждые 3 часа · самовывоз или курьер", time: "завтра" },
                      { state: "", n: "5", ttl: "Накладная и СФ в личный кабинет", sub: "Автоматически после доставки", time: "+0 ч" },
                    ]
                ).map((s) => (
                  <div key={s.n} className={`flow-step${s.state ? ` ${s.state}` : ""}`}>
                    <div className="n">{s.n}</div>
                    <div>
                      <div className="ttl">{s.ttl}</div>
                      <div className="sub">{s.sub}</div>
                    </div>
                    <div className="time">{s.time}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="eyebrow ops-eyebrow">
                <span className="ops-eyebrow-line" /> {isEn ? "What we get right" : "То что у нас правильно"}
              </div>
              <h2 className="ops-h2">
                {isEn
                  ? "No marketing promises — just systemic processes."
                  : "Без маркетинговых обещаний — только системные процессы."}
              </h2>
              <p className="ops-p">
                {isEn
                  ? "10 years in this business taught us exactly which small things ruin a pastry chef's day. We fixed them in the product."
                  : "10 лет работы научили нас, какие именно мелочи ломают день кондитера. Мы их пофиксили в продукте."}
              </p>

              <div className="ops-list">
                {(isEn
                  ? [
                      { ttl: "No silent substitution", txt: "If a product is out of stock — a separate proposal of an alternative on WhatsApp with the price delta. We wait for your \"ok\"." },
                      { ttl: "Real-time price and availability.", txt: "Minimum order, pack size, and wholesale prices are visible up front — before adding the item to the cart." },
                      { ttl: "Documents-ready for accounting", txt: "Invoice, waybill, contract. Sole proprietor without VAT or LLC with VAT — both formats." },
                      { ttl: "50 direct supplier contracts", txt: "Barry Callebaut, IRCA, Sicao, 1883 — no middlemen. That's how we hold wholesale prices." },
                    ]
                  : [
                      { ttl: "Без молчаливой замены", txt: "Если товара нет — отдельное предложение аналога в WhatsApp с разницей в цене. Ждём вашего «ок»." },
                      { ttl: "Цена и наличие — в реальном времени.", txt: "Минимальный заказ, упаковка и оптовые цены видны сразу — ещё до добавления товара в корзину." },
                      { ttl: "Documents-ready для бухгалтерии", txt: "Счёт-фактура, накладная, договор. ИП без НДС или ТОО с НДС — оба формата." },
                      { ttl: "50 поставщиков напрямую", txt: "Barry Callebaut, IRCA, Sicao, 1883 — без посредников. Поэтому держим оптовые цены." },
                    ]
                ).map((row) => (
                  <div key={row.ttl} className="ops-row">
                    <div className="ic">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    </div>
                    <div>
                      <div className="ttl">{row.ttl}</div>
                      <div className="txt">{row.txt}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === PROOF === */}
      <section className="s">
        <div className="container-x">
          <div className="s-head" style={{ marginBottom: 32 }}>
            <div className="eyebrow">{isEn ? "10 years in Astana" : "10 лет в Астане"}</div>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)" }}>
              {isEn
                ? "~$0.6M turnover over 14 months. 50+ recurring customers."
                : "~ $0.6M оборота за 14 месяцев. 50+ постоянных клиентов."}
            </h2>
          </div>

          <div className="proof">
            <div className="quote">
              <div>
                {isEn
                  ? "\"I used to spend an hour every Monday calling suppliers — who's got flour, who's got shrimp briquettes. Now I put together an order on Horecom in 5 minutes and the waybill is in my inbox right away. The important part — if something's missing they offer a substitution instead of quietly swapping in something else.\""
                  : "«Раньше каждый понедельник час уходил на обзвон поставщиков — у кого мука, у кого креветочные брикеты. Теперь собираю заказ в Horecom за 5 минут, накладная сразу на почте. Что важно — если чего-то нет, мне предлагают замену, а не вписывают тихо что-то другое.»"}
              </div>
              <div className="who">
                <div className="av">{isEn ? "AM" : "АН"}</div>
                <div>
                  <div className="nm">{isEn ? "Anara Myrzabekova" : "Анара Мырзабекова"}</div>
                  <div className="ti">
                    {isEn ? 'Pastry chef, "Kust" coffee shop, Astana' : "Шеф-кондитер, кофейня «Куст», Астана"}
                  </div>
                </div>
              </div>
            </div>

            <div className="stats">
              <div className="it">
                <div className="n">$0.6<span className="u">M</span></div>
                <div className="l">{isEn ? "Turnover over 14 months" : "Оборот за 14 месяцев"}</div>
              </div>
              <div className="it">
                <div className="n">40K<span className="u">₸</span></div>
                <div className="l">{isEn ? "Average order value" : "Средний чек заказа"}</div>
              </div>
              <div className="it">
                <div className="n">10<span className="u">+</span></div>
                <div className="l">{isEn ? "Bakeries on subscription" : "Кондитерских на подписке"}</div>
              </div>
              <div className="it">
                <div className="n">5,000<span className="u" /></div>
                <div className="l">{isEn ? "Unique WhatsApp contacts" : "Уникальных WhatsApp-контактов"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === FINAL CTA === */}
      <section className="cta-strip">
        <div className="cta-glow" />
        <div className="container-x">
          <div className="inner">
            <div>
              <h2>
                {isEn ? (
                  <>Ready to try?<br />The catalog is open right now.</>
                ) : (
                  <>Готовы попробовать?<br />Каталог открыт прямо сейчас.</>
                )}
              </h2>
              <p>
                {isEn
                  ? "No registration, no minimum commitment. One-time order — no subscription required. Like it — set up scheduled delivery or a group buy."
                  : "Без регистрации, без минимальных обязательств. Один заказ — без подписки. Понравится — настроите регулярную доставку или групповую закупку."}
              </p>
            </div>
            <div className="ctas">
              <Link href="/catalog" className="btn btn-orange btn-lg">
                {isEn ? "Open catalog" : "Открыть каталог"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a
                href={COMPANY.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-lg cta-wa-btn"
              >
                <MessageCircle className="h-4 w-4" style={{ color: "#25D366" }} />
                {isEn ? "Message on WhatsApp" : "Написать в WhatsApp"}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
