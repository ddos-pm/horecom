import Image from "next/image";
import { MessageCircle, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { COMPANY } from "@/lib/company";
import { StatusStrip } from "@/components/marketing/status-strip";
import { formatUnit } from "@/lib/units";
import "./home.css";

// ISR — Tyler/grant reviewers should never wait on a cold start. Marketing
// home re-renders in the background every 10 min; stale-while-revalidate
// keeps the cached page warm for any concurrent visitors.
export const revalidate = 600;

const CAT_ICONS: Record<string, React.ReactNode> = {
  "chocolate-glazes": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 4v16M16 4v16M4 8h16M4 16h16" />
    </svg>
  ),
  syrups: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 2h8v4l2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8l2-2V2Z" />
    </svg>
  ),
  ingredients: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  ),
  fillings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8h16l-1.5 11a2 2 0 0 1-2 2H7.5a2 2 0 0 1-2-2L4 8Z" />
      <path d="M9 5a3 3 0 0 1 6 0v3H9V5Z" />
    </svg>
  ),
  "food-colorings": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2a10 10 0 1 0 10 10H12V2Z" />
      <circle cx="9" cy="7" r="1.5" fill="currentColor" />
    </svg>
  ),
  dairy: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 2h8v4l2 4v9a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-9l2-4V2Z" />
    </svg>
  ),
  frozen: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" />
    </svg>
  ),
  "sauces-canned": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 2h12v3H6zM7 5h10v17H7z" />
      <path d="M10 12h4" />
    </svg>
  ),
  "parchment-foil": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16v14H4zM4 6l4-4h8l4 4" />
    </svg>
  ),
  "bakery-staples": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8a8 4 0 1 0 16 0M4 8v8a8 4 0 0 0 16 0V8M4 12a8 4 0 0 0 16 0" />
    </svg>
  ),
  sprinkles: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="7" cy="8" r="1.5" />
      <circle cx="13" cy="6" r="1.5" />
      <circle cx="17" cy="11" r="1.5" />
      <circle cx="9" cy="14" r="1.5" />
      <circle cx="15" cy="17" r="1.5" />
      <circle cx="6" cy="18" r="1.5" />
    </svg>
  ),
};

export default async function HomePage() {
  const FEATURED_INCLUDE = {
    prices: { take: 1, orderBy: { createdAt: "desc" } },
    inventorySnapshot: true,
    category: true,
  } as const;

  // The hero card uses Масло Рогачёв as the visual example (the team's pick).
  // Pin it explicitly so the hero stays stable regardless of seed-order
  // changes; if it's ever delisted, we fall back to the rest of `featured`.
  const [categories, heroProduct, featured, skuCount] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    }),
    prisma.product.findFirst({
      where: { slug: "maslo-rogachev-82-5-5kg", isActive: true },
      include: FEATURED_INCLUDE,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      take: 8,
      orderBy: { createdAt: "asc" },
      include: FEATURED_INCLUDE,
    }),
    prisma.product.count({ where: { isActive: true } }),
  ]);
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
              <h1>
                Поставки для пекарен, кофеен и кондитеров в&nbsp;Астане.{" "}
                <span className="em-orange" style={{ fontSize: "0.55em", fontWeight: 600, display: "block", marginTop: 8 }}>
                  оптом и в наличии.
                </span>
              </h1>

              <p className="lede">
                Умные закупки: помогаем следить за остатками, обеспечиваем стабильные поставки и быструю
                доставку. 3 сценария закупок: для HoReCa, домашнего кондитера, групповые закупки для
                физических лиц.
              </p>

              <div className="hero-ctas">
                <Link href="/catalog" className="btn btn-orange btn-lg">
                  Открыть каталог · {skuCount} товаров
                  <ArrowRight className="h-3.5 w-3.5" />
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
            </div>

            {/* Hero right: live product card preview */}
            <div className="hero-card-wrap">
              <div className="hero-card">
                <div className="hero-card-head">
                  <span className="pill" style={{ height: 20, padding: "0 8px", borderRadius: 6 }}>
                    Так выглядит карточка
                  </span>
                  <span style={{ marginLeft: "auto" }}>PDP · {hero?.sku ?? "HC-DAIRY-0067"}</span>
                </div>
                <div className="hero-card-body">
                  <Link
                    href={`/product/${hero?.slug ?? "maslo-rogachev-82-5-5kg"}`}
                    className="hero-card-img"
                    aria-label={hero?.name ?? "Открыть карточку товара"}
                  >
                    {hero?.imageUrl && (
                      <img src={hero.imageUrl} alt={hero.name} />
                    )}
                  </Link>
                  <div className="hero-card-info">
                    <div className="meta">
                      {hero?.brand ?? "Рогачёв"} · {hero?.category.name ?? "Молочная"}
                    </div>
                    <div className="name">{hero?.name ?? 'Масло "Рогачев" 82,5% 5кг'}</div>
                    <div className="price">
                      <b>
                        {hero?.prices[0]
                          ? Number(hero.prices[0].basePrice).toLocaleString("ru-RU")
                          : "33 800"}{" "}
                        ₸
                      </b>
                      <span>/ {hero?.packLabel ?? "упак"}</span>
                    </div>
                  </div>
                </div>
                <div className="hero-card-data">
                  <div>
                    <div className="k">MOQ</div>
                    <div className="v">{hero?.minOrderQty ?? 1} уп.</div>
                  </div>
                  <div>
                    <div className="k">В наличии</div>
                    <div className="v green">
                      {hero?.inventorySnapshot?.availableQty ?? 47} {formatUnit(hero?.unitType) || "кг"}
                    </div>
                  </div>
                  <div>
                    <div className="k">Доставка</div>
                    <div className="v">завтра до 12:00</div>
                  </div>
                </div>
                <div className="hero-card-foot">
                  <Link href={`/product/${hero?.slug ?? "maslo-rogachev-82-5-5kg"}`} className="btn btn-primary" style={{ flex: 1 }}>
                    В корзину
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
              <div className="num">10<span className="u">лет</span></div>
              <div className="lbl"><b>на рынке</b><br />с 2016 года</div>
            </div>
            <div className="trust-item">
              <div className="num">50<span className="u">+</span></div>
              <div className="lbl"><b>B2B-клиентов</b><br />регулярные заказы</div>
            </div>
            <div className="trust-item">
              <div className="num">{skuCount}<span className="u">товаров</span></div>
              <div className="lbl"><b>в каталоге</b><br />11 категорий, реальные остатки</div>
            </div>
            <div className="trust-item">
              <div className="num">76<span className="u">K</span></div>
              <div className="lbl"><b>подписчиков</b><br />@horecom.kz в Instagram</div>
            </div>
            <div className="trust-item">
              <div className="num">3<span className="u">ч</span></div>
              <div className="lbl"><b>окно доставки</b><br />по Астане</div>
            </div>
          </div>

          <div className="src-strip">
            <b>Прямые контракты:</b>
            <div className="src-list">
              <span>Barry&nbsp;Callebaut</span><span>·</span>
              <span>IRCA</span><span>·</span>
              <span>Sicao</span><span>·</span>
              <span>1883</span><span>·</span>
              <span>AmeriColor</span><span>·</span>
              <span>Andros</span><span>·</span>
              <span className="show-md">Berybert</span>
              <span className="show-md">·</span>
              <span className="show-md">Любимо</span>
            </div>
          </div>
        </div>
      </section>

      {/* === SEGMENTS === */}
      <section className="s">
        <div className="container-x">
          <div className="s-head">
            <div className="eyebrow">Один каталог · три сценария</div>
            <h2>Как закупиться?</h2>
            <p className="sub">
              Ресторан, кондитерская и домашний кондитер закупают по-разному. Мы построили три рабочих
              процесса на одной складской инфраструктуре — выберите свой.
            </p>
          </div>

          <div className="segs">
            <Link href="/catalog?segment=enterprise" className="seg seg-1">
              <div className="seg-top">
                <span className="pill pill-blue">Рестораны и кафе</span>
                <span className="seg-num">01</span>
              </div>
              <h3>Быстрый оптовый заказ</h3>
              <div className="who">
                <b>Для тех у кого есть склад и закупщик.</b> Собрать корзину за 3 минуты, повторить заказ
                прошлой недели, скачать накладную.
              </div>
              <div className="seg-mock">
                <div className="seg-mock-row"><span>Повтор заказа #1247</span><b>74 позиции · 285&nbsp;400 ₸</b></div>
                <div className="seg-mock-row"><span>Замена: Какао JB → Sicao</span><b style={{ color: "var(--c-orange)" }}>ждёт ответа</b></div>
                <div className="seg-mock-row"><span>К отгрузке завтра</span><b>11:00–14:00</b></div>
              </div>
              <ul className="ul-clean seg-feat">
                <li>Поиск и фильтры по {skuCount} товаров</li>
                <li>Сохранённые корзины · повтор заказа</li>
                <li>Накладные, СФ, договоры в ЛК</li>
              </ul>
              <span className="seg-cta">Перейти в каталог</span>
            </Link>

            <Link href="/subscription" className="seg seg-2">
              <div className="seg-top">
                <span className="pill pill-orange">Кондитерские без склада</span>
                <span className="seg-num">02</span>
              </div>
              <h3>Подписка на поставку</h3>
              <div className="who">
                <b>Для маленьких пекарен где негде хранить.</b> Доставляем каждую неделю — за день до отгрузки
                спросим, что подвезти.
              </div>
              <div className="seg-mock">
                <div className="seg-mock-row"><span>Следующая доставка</span><b>среда, 10:30</b></div>
                <div className="seg-mock-row"><span>Состав 12 позиций</span><b>187&nbsp;200 ₸</b></div>
                <div className="seg-mock-row"><span>WhatsApp с подтверждением</span><b style={{ color: "var(--c-success)" }}>завтра 09:00</b></div>
              </div>
              <ul className="ul-clean seg-feat">
                <li>Гибкий график: дни и время</li>
                <li>Предиктивный движок дозакупа</li>
                <li>Edit · Skip · Pause в один тап</li>
              </ul>
              <span className="seg-cta" style={{ color: "var(--c-orange-700)" }}>Как работает подписка на поставку</span>
            </Link>

            <Link href="/group-buying" className="seg seg-3">
              <div className="seg-top">
                <span className="pill pill-dark">Самозанятые кондитеры</span>
                <span className="seg-num">03</span>
              </div>
              <h3>Групповая закупка</h3>
              <div className="who">
                <b>Для домашних кондитеров.</b> Объединитесь с 3–5 коллегами и получите оптовую цену — без
                склада и тонны муки в одиночку.
              </div>
              <div className="seg-mock">
                <div className="seg-mock-row"><span>Закупка · Мука 25 кг</span><b>4 / 6 чел</b></div>
                <div className="seg-mock-row"><span>До дедлайна</span><b>2 дня 14 часов</b></div>
                <div className="seg-mock-row"><span>Цена опт vs розница</span><b style={{ color: "var(--c-success)" }}>−18%</b></div>
              </div>
              <ul className="ul-clean seg-feat">
                <li>Цена защищена при старте группы</li>
                <li>Share-ссылка в Instagram / WhatsApp</li>
                <li>Без рисков если группа не собралась</li>
              </ul>
              <span className="seg-cta">
                <span className="pill pill-orange" style={{ fontSize: 10 }}>Скоро</span>
                <span style={{ marginLeft: 8 }}>Войти в пилот</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* === CATEGORIES === */}
      <section className="s" style={{ paddingTop: 0 }}>
        <div className="container-x">
          <div className="s-head cats-head">
            <div>
              <div className="eyebrow">Каталог</div>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)" }}>11 категорий · {skuCount} товаров</h2>
            </div>
            <Link href="/catalog" className="btn btn-ghost show-md">Открыть полный каталог →</Link>
          </div>

          <div className="cats">
            {categories.map((c) => (
              <Link key={c.id} href={`/catalog?category=${c.slug}`} className="cat">
                <div className="cat-icon">
                  {CAT_ICONS[c.slug] ?? CAT_ICONS["ingredients"]}
                </div>
                <div className="cat-name">{c.name}</div>
                <div className="cat-count">
                  <b>{c._count.products}</b>{" "}
                  {plural(c._count.products, "позиция", "позиции", "позиций")}
                </div>
              </Link>
            ))}
            <Link href="/catalog" className="cat cat-dark">
              <div className="cat-icon">
                <ArrowRight className="h-5 w-5" />
              </div>
              <div className="cat-name">Весь<br />каталог</div>
              <div className="cat-count"><b>{skuCount}</b> товаров</div>
            </Link>
          </div>
        </div>
      </section>

      {/* === FEATURED PRODUCTS === */}
      <section className="s" style={{ paddingTop: 0 }}>
        <div className="container-x">
          <div className="s-head cats-head">
            <div>
              <div className="eyebrow">Топ за месяц</div>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)" }}>Что заказывают чаще всего</h2>
            </div>
            <Link href="/catalog" className="btn btn-ghost show-md">Все товары →</Link>
          </div>

          <div className="prods">
            {featured.map((p) => {
              const price = p.prices[0];
              const stock = p.inventorySnapshot;
              return (
                <Link key={p.id} href={`/product/${p.slug}`} className="prod">
                  <div className="prod-img">
                    {p.imageUrl && (
                      <Image src={p.imageUrl} alt={p.name} fill sizes="200px" style={{ objectFit: "contain" }} />
                    )}
                    {(p.isSubscriptionEligible || p.isGroupEligible) && (
                      <div className="prod-badges">
                        {p.isSubscriptionEligible && <span className="pill pill-orange">Подписка на поставку</span>}
                        {p.isGroupEligible && <span className="pill pill-blue">Групповая закупка</span>}
                      </div>
                    )}
                  </div>
                  <div className="prod-info">
                    <div className="prod-meta">
                      {p.brand ? `${p.brand} · ` : ""}{p.packLabel}
                    </div>
                    <div className="prod-name">{p.name}</div>
                    <div className="prod-bot">
                      <div>
                        <div className="prod-price tabular">
                          {price ? Number(price.basePrice).toLocaleString("ru-RU") : "—"} ₸
                        </div>
                        <div className="prod-unit">{price?.unitLabel ?? `за ${p.packLabel}`}</div>
                      </div>
                      {stock && stock.availableQty > 0 && (
                        <div className={`prod-stock${stock.stockStatus === "LOW_STOCK" ? " low" : ""}`}>
                          <span className="live-dot" />
                          {stock.availableQty} {formatUnit(p.unitType)}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* === OPERATIONS BAND === */}
      <section className="ops-band s">
        <div className="container-x">
          <div className="ops-grid">
            <div>
              <div className="eyebrow ops-eyebrow">
                <span className="ops-eyebrow-line" /> Как работает заказ
              </div>
              <h2 className="ops-h2">
                Быстрое оформление.
              </h2>
              <p className="ops-p">
                Без звонков и ожидания. Наш чат-бот оформит ваш заказ за минуту. Добавьте товары в корзину
                → подтвердите заявку в WhatsApp → получите накладную.
              </p>

              <div className="flow">
                <div className="flow-step done">
                  <div className="n">1</div>
                  <div>
                    <div className="ttl">Собрали корзину в каталоге</div>
                    <div className="sub">14 позиций · 187 200 ₸ · мин. заказ соблюдён</div>
                  </div>
                  <div className="time">10:24</div>
                </div>
                <div className="flow-step done">
                  <div className="n">2</div>
                  <div>
                    <div className="ttl">Подтвердили в WhatsApp</div>
                    <div className="sub">«Подтверждено · отгрузка завтра 11:00»</div>
                  </div>
                  <div className="time">10:28</div>
                </div>
                <div className="flow-step active">
                  <div className="n">3</div>
                  <div>
                    <div className="ttl">Ссылка на KaspiPay или счёт на оплату по запросу</div>
                    <div className="sub">Безнал по реквизитам — счёт уже на почте</div>
                  </div>
                  <div className="time">сейчас</div>
                </div>
                <div className="flow-step">
                  <div className="n">4</div>
                  <div>
                    <div className="ttl">Отгрузка и доставка</div>
                    <div className="sub">Каждые 3 часа · самовывоз или курьер</div>
                  </div>
                  <div className="time">завтра</div>
                </div>
                <div className="flow-step">
                  <div className="n">5</div>
                  <div>
                    <div className="ttl">Накладная и СФ в личный кабинет</div>
                    <div className="sub">Автоматически после доставки</div>
                  </div>
                  <div className="time">+0 ч</div>
                </div>
              </div>
            </div>

            <div>
              <div className="eyebrow ops-eyebrow">
                <span className="ops-eyebrow-line" /> То что у нас правильно
              </div>
              <h2 className="ops-h2">
                Без маркетинговых обещаний — только системные процессы.
              </h2>
              <p className="ops-p">
                10 лет работы научили нас, какие именно мелочи ломают день кондитера. Мы их пофиксили в
                продукте.
              </p>

              <div className="ops-list">
                {[
                  { ttl: "Без молчаливой замены", txt: "Если товара нет — отдельное предложение аналога в WhatsApp с разницей в цене. Ждём вашего «ок»." },
                  { ttl: "Цена и наличие — в реальном времени.", txt: "Минимальный заказ, упаковка и оптовые цены видны сразу — ещё до добавления товара в корзину." },
                  { ttl: "Documents-ready для бухгалтерии", txt: "Счёт-фактура, накладная, договор. ИП без НДС или ТОО с НДС — оба формата." },
                  { ttl: "50 поставщиков напрямую", txt: "Barry Callebaut, IRCA, Sicao, 1883 — без посредников. Поэтому держим оптовые цены." },
                ].map((row) => (
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
            <div className="eyebrow">10 лет в Астане</div>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)" }}>
              ~ $0.6M оборота за 14 месяцев. 50+ постоянных клиентов.
            </h2>
          </div>

          <div className="proof">
            <div className="quote">
              <div>
                «Раньше каждый понедельник час уходил на обзвон поставщиков — у кого мука, у кого
                креветочные брикеты. Теперь собираю заказ в Horecom за 5 минут, накладная сразу на почте.
                Что важно — если чего-то нет, мне предлагают замену, а не вписывают тихо что-то другое.»
              </div>
              <div className="who">
                <div className="av">АН</div>
                <div>
                  <div className="nm">Анара Мырзабекова</div>
                  <div className="ti">Шеф-кондитер, кофейня «Куст», Астана</div>
                </div>
              </div>
            </div>

            <div className="stats">
              <div className="it">
                <div className="n">$0.6<span className="u">M</span></div>
                <div className="l">Оборот за 14 месяцев</div>
              </div>
              <div className="it">
                <div className="n">40K<span className="u">₸</span></div>
                <div className="l">Средний чек заказа</div>
              </div>
              <div className="it">
                <div className="n">10<span className="u">+</span></div>
                <div className="l">Кондитерских на подписке</div>
              </div>
              <div className="it">
                <div className="n">5,000<span className="u" /></div>
                <div className="l">Уникальных WhatsApp-контактов</div>
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
              <h2>Готовы попробовать?<br />Каталог открыт прямо сейчас.</h2>
              <p>
                Без регистрации, без минимальных обязательств. Один заказ — без подписки. Понравится —
                настроите регулярную доставку или групповую закупку.
              </p>
            </div>
            <div className="ctas">
              <Link href="/catalog" className="btn btn-orange btn-lg">
                Открыть каталог
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a
                href={COMPANY.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-lg cta-wa-btn"
              >
                <MessageCircle className="h-4 w-4" style={{ color: "#25D366" }} />
                Написать в WhatsApp
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
