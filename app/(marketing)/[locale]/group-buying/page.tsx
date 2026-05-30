import { Suspense } from "react";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { WaitlistIsland, WaitlistSkeleton } from "./waitlist-island";
import { LiveCountdown } from "./countdown";
import "./group-buying.css";

// Suspense-island the auth-dependent form to streamline FCP. See
// /subscription for the PPR limitation note.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn
      ? "Group buying — wholesale prices for independent pastry makers"
      : "Групповая закупка — оптовые цены для самозанятых кондитеров",
    description: isEn
      ? "Team up with 3–5 pastry chefs to buy a wholesale bucket of chocolate or a sack of flour — each takes their share at the wholesale price. The price is locked from the moment the group is created."
      : "Объединяйтесь с 3–5 кондитерами и купите оптовое ведро шоколада или мешок муки — каждый получит свою долю и оптовую цену. Цена защищена с момента создания группы.",
  };
}

export default async function GroupBuyingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ product?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";
  const sp = await searchParams;

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, brand: true, packLabel: true, sku: true },
    orderBy: [{ isGroupEligible: "desc" }, { name: "asc" }],
  });

  // Pre-select the product when arriving from a product-card link
  // (/group-buying?product=SKU).
  const initialProductIds = sp.product
    ? products.filter((p) => p.sku === sp.product).map((p) => p.id)
    : [];

  // Group ends 2d 14h 23m from now — countdown for the live group demo card.
  const groupEndsAt = new Date(Date.now() + (2 * 86400 + 14 * 3600 + 23 * 60) * 1000).toISOString();

  return (
    <>
      {/* === HERO === */}
      <section className="gb-hero">
        <div className="grid-bg" />
        <div className="glow" />

        <div className="gb-hero-top">
          <div className="container-x">
            <div className="gb-hero-top-inner">
              <span className="pill">{isEn ? "In pilot" : "В пилоте"}</span>
              <span>
                {isEn
                  ? "4 active groups · 28 participants · average savings −18%"
                  : "4 активные закупки · 28 участников · средняя экономия −18%"}
              </span>
              <span style={{ marginLeft: "auto" }} className="show-md">
                {isEn ? "Pilot access by request" : "Вход в пилот по запросу"}
              </span>
            </div>
          </div>
        </div>

        <div className="container-x gb-body">
          <div className="gb-grid">
            <div>
              <h1>
                {isEn ? (
                  <>
                    Wholesale <em>for five.</em>
                    <br />
                    No warehouse
                    <br />at your home.
                  </>
                ) : (
                  <>
                    Опт <em>на пятерых.</em>
                    <br />
                    Без склада
                    <br />у вас дома.
                  </>
                )}
              </h1>

              <p className="lede">
                {isEn
                  ? "Team up with 3–5 pastry chefs and buy a wholesale bucket of chocolate or a sack of flour — each takes their share at the wholesale price. The price is locked from the moment the group is created."
                  : "Объединитесь с 3–5 кондитерами и купите оптовое ведро шоколада или мешок муки — каждый получит свою долю и оптовую цену. Цена защищена с момента создания группы."}
              </p>

              <div className="ctas">
                <a href="#waitlist" className="btn btn-orange btn-lg">
                  {isEn ? "Join the pilot" : "Войти в пилот"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
                <a href="#how" className="btn btn-lg gb-ghost-btn">
                  {isEn ? "How it works" : "Как это работает"}
                </a>
              </div>

              <div className="meta">
                <span>
                  <b>−18%</b> {isEn ? "average savings" : "средняя экономия"}
                </span>
                <span>·</span>
                <span>
                  {isEn ? "Price locked " : "Цена защищена "}<b>{isEn ? "at group start" : "при старте группы"}</b>
                </span>
                <span>·</span>
                <span>
                  {isEn ? "No risk — " : "Без рисков — "}<b>{isEn ? "no fill = refund" : "не собралась = вернули"}</b>
                </span>
              </div>
            </div>

            {/* LIVE GROUP CARD with live countdown */}
            <div className="gb-card">
              <div className="gb-card-head">
                <div className="lt">
                  <span className="live-dot" />
                  <span className="nm">{isEn ? "Group active" : "Закупка активна"}</span>
                </div>
                <div className="sub">
                  {isEn ? "Creator: " : "Создатель: "}<b style={{ color: "#fff" }}>@aselya.cakes</b>
                </div>
              </div>

              <div className="gb-card-prod">
                <div className="img">
                  <img
                    src="https://static.tildacdn.com/stor3935-3966-4830-a661-366365656231/13115719.jpg"
                    alt={isEn ? "Chocolate" : "Шоколад"}
                  />
                </div>
                <div>
                  <div className="meta">{isEn ? "Veliche · 10 kg bucket" : "Veliche · ведро 10 кг"}</div>
                  <div className="nm">{isEn ? "White chocolate, 10 kg" : "Шоколад белый, 10 кг"}</div>
                  <div className="prices">
                    <span className="strike">{isEn ? "32,000 ₸" : "32 000 ₸"}</span>
                    <span className="new">{isEn ? "26,240 ₸" : "26 240 ₸"}</span>
                    <span className="save">−18%</span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.5)",
                      marginTop: 4,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {isEn ? "2,624 ₸/kg at group price" : "2 624 ₸/кг при цене в группе"}
                  </div>
                </div>
              </div>

              <div className="gb-progress">
                <div className="gb-progress-row">
                  <span className="lbl">{isEn ? "Progress" : "Прогресс"}</span>
                  <span className="val">{isEn ? "4 / 6 people" : "4 / 6 чел"}</span>
                </div>
                <div className="gb-bar">
                  <div className="fill" style={{ width: "67%" }} />
                </div>
                <div className="gb-progress-foot">
                  <span>
                    {isEn ? "Need " : "Нужно ещё "}<b style={{ color: "#fff" }}>{isEn ? "2 more people" : "2 человека"}</b>
                  </span>
                  <span>{isEn ? "67% filled" : "67% набрано"}</span>
                </div>
              </div>

              <div className="avatars">
                <div className="av-stack">
                  <span className="av b">{isEn ? "AS" : "АС"}</span>
                  <span className="av o">{isEn ? "MK" : "МК"}</span>
                  <span className="av g">{isEn ? "DA" : "ДА"}</span>
                  <span className="av p">{isEn ? "AN" : "АН"}</span>
                  <span className="av placeholder">+</span>
                  <span className="av placeholder">+</span>
                </div>
                <div className="av-info">
                  <b>{isEn ? "Asel, Madina, Dana, Anara" : "Asel, Мадина, Дана, Анара"}</b>
                  <br />{isEn ? "+ 2 open seats" : "+ 2 свободных места"}
                </div>
              </div>

              <LiveCountdown targetIso={groupEndsAt} />

              <div className="gb-card-foot">
                <a href="#waitlist" className="btn btn-orange btn-lg" style={{ width: "100%" }}>
                  {isEn ? "Join · 26,240 ₸" : "Присоединиться · 26 240 ₸"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="s" id="how">
        <div className="container-x">
          <div className="sec-head">
            <div className="sec-eyebrow">{isEn ? "How it works" : "Как это работает"}</div>
            <h2>{isEn ? "4 steps from an Instagram post to the wholesale price." : "4 шага от поста в Instagram до оптовой цены."}</h2>
            <p className="sub">
              {isEn
                ? "Create a group or join an existing one. Once combined volume hits the threshold — everyone gets the wholesale price automatically."
                : "Создайте группу или присоединитесь к существующей. Когда суммарный объём достигает порога — все получают оптовую цену автоматически."}
            </p>
          </div>

          <div className="steps">
            {(isEn
              ? [
                  {
                    title: "Create a group",
                    txt: 'Open a product marked "Group buying available". Set the threshold (4 / 6 / 8 people) and the deadline — usually 3–7 days.',
                    mock: (
                      <>
                        Product: <b>White chocolate 10 kg</b>
                        <br />
                        Group price: <b>26,240 ₸</b>
                        <br />
                        Threshold: <b>6 people</b> · deadline: <b>3 days</b>
                      </>
                    ),
                  },
                  {
                    title: "Share the link",
                    txt: "Drop the link into Instagram stories, your WhatsApp chat with colleagues, into Threads. The wider you spread — the faster it fills.",
                    mock: (
                      <>
                        Share: <b>horecom.kz/g/HC-0742</b>
                        <br />
                        Stories · WhatsApp · Threads
                        <br />
                        <b>Price locked</b> for everyone already in
                      </>
                    ),
                  },
                  {
                    title: "The group fills",
                    txt: "Pastry chefs join and reserve their share. Everyone sees the progress and how many seats are left.",
                    mock: (
                      <>
                        Now: <b>4 / 6 people</b>
                        <br />
                        Free: <b>2 seats</b>
                        <br />
                        Until deadline: <b>2 d 14 h</b>
                      </>
                    ),
                  },
                  {
                    title: "Wholesale activates automatically",
                    txt: "Once the threshold is hit — payment runs at the wholesale price. Delivery: to the group creator or to each person separately (V2).",
                    mock: (
                      <>
                        ✓ Threshold reached
                        <br />
                        ✓ Price locked <b>5,600 ₸</b>
                        <br />
                        ✓ Shipment <b>Thursday 10:00</b>
                      </>
                    ),
                    successMock: true,
                  },
                ]
              : [
                  {
                    title: "Создайте группу",
                    txt: "Откройте товар с пометкой «Доступна группа». Укажите порог (4 / 6 / 8 человек) и срок — обычно 3–7 дней.",
                    mock: (
                      <>
                        Товар: <b>Шоколад белый 10 кг</b>
                        <br />
                        Цена в группе: <b>26 240 ₸</b>
                        <br />
                        Порог: <b>6 человек</b> · срок: <b>3 дня</b>
                      </>
                    ),
                  },
                  {
                    title: "Поделитесь ссылкой",
                    txt: "Бросьте ссылку в Instagram stories, в WhatsApp-чат коллег, в Threads. Чем шире кинете — тем быстрее наберётся.",
                    mock: (
                      <>
                        Share: <b>horecom.kz/g/HC-0742</b>
                        <br />
                        Stories · WhatsApp · Threads
                        <br />
                        <b>Цена защищена</b> для тех кто уже вступил
                      </>
                    ),
                  },
                  {
                    title: "Закупка заполняется",
                    txt: "Кондитеры присоединяются и закрепляют за собой свою долю. Все видят прогресс и сколько ещё мест.",
                    mock: (
                      <>
                        Сейчас: <b>4 / 6 человек</b>
                        <br />
                        Свободно: <b>2 места</b>
                        <br />
                        До дедлайна: <b>2 дня 14 часов</b>
                      </>
                    ),
                  },
                  {
                    title: "Опт активируется автоматически",
                    txt: "Когда порог достигнут — оплата проходит по оптовой цене. Доставка: к создателю группы или каждому раздельно (V2).",
                    mock: (
                      <>
                        ✓ Порог достигнут
                        <br />
                        ✓ Цена зафиксирована <b>5 600 ₸</b>
                        <br />
                        ✓ Отгрузка <b>четверг 10:00</b>
                      </>
                    ),
                    successMock: true,
                  },
                ]
            ).map((s, i) => (
              <div key={s.title} className="step">
                <div className="n">{String(i + 1).padStart(2, "0")}</div>
                <h3>{s.title}</h3>
                <div className="txt">{s.txt}</div>
                <div
                  className="mock"
                  style={
                    s.successMock
                      ? {
                          background: "var(--c-success-bg)",
                          borderColor: "rgba(17,122,63,0.2)",
                          color: "var(--c-success)",
                        }
                      : undefined
                  }
                >
                  {s.mock}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === ECONOMICS / CALCULATOR === */}
      <section className="s eco-band">
        <div className="container-x">
          <div className="eco-grid">
            <div>
              <div className="sec-eyebrow" style={{ color: "var(--c-orange)" }}>
                {isEn ? "Why this works" : "Почему это работает"}
              </div>
              <h2>
                {isEn
                  ? "Suppliers give wholesale from 4 units. One pastry chef alone can't reach that."
                  : "Поставщики дают опт от 4 единиц. Один кондитер столько не возьмёт."}
              </h2>
              <p className="sub">
                {isEn
                  ? "Most brands — Barry Callebaut, IRCA, Sicao — only give the wholesale price from 4+ bags or buckets. For one small pastry shop that means overpaying at retail or locking capital in a month of warehouse stock."
                  : "Большинство брендов — Barry Callebaut, IRCA, Sicao — отдают оптовую цену только от 4+ мешков или ведер. Для одной маленькой кондитерской это значит переплачивать рознично или замораживать капитал в складе на месяц."}
              </p>
              <p className="sub" style={{ marginTop: 12 }}>
                {isEn
                  ? "Group buying solves this math: four pastry chefs with one bag each = wholesale. Each pays their share, takes their share, and nobody keeps extra stock on the shelf."
                  : "Групповая закупка решает эту арифметику: четыре кондитера по одному мешку = опт. Каждый платит свою долю, забирает свой объём, и никто не держит лишнее на полке."}
              </p>

              <div className="eco-bigstats">
                <div>
                  <div className="bignum orange">−18%</div>
                  <div className="lbl">{isEn ? "average savings" : "средняя экономия"}</div>
                </div>
                <div>
                  <div className="bignum">4–6</div>
                  <div className="lbl">{isEn ? "people per group" : "человек в группе"}</div>
                </div>
                <div>
                  <div className="bignum">{isEn ? "3 days" : "3 дня"}</div>
                  <div className="lbl">{isEn ? "typical group duration" : "типичный срок группы"}</div>
                </div>
              </div>
            </div>

            <div className="calc">
              <div className="calc-row head">
                <span className="lbl">
                  {isEn ? "Scenario: white chocolate 10 kg" : "Сценарий: шоколад белый 10 кг"}
                </span>
                <span className="lbl">{isEn ? "per bucket" : "за 1 ведро"}</span>
              </div>
              <div className="calc-row">
                <div className="lbl">
                  <b>{isEn ? "Retail price" : "Розничная цена"}</b>
                  <span className="sm">{isEn ? "if you buy alone" : "если покупаете в одиночку"}</span>
                </div>
                <span className="val">{isEn ? "32,000 ₸" : "32 000 ₸"}</span>
              </div>
              <div className="calc-row">
                <div className="lbl">
                  <b>{isEn ? "Wholesale (from 4 units)" : "Оптовая цена (от 4 шт)"}</b>
                  <span className="sm">{isEn ? "if your group has 4–6" : "если вас 4–6 в группе"}</span>
                </div>
                <span className="val">{isEn ? "26,240 ₸" : "26 240 ₸"}</span>
              </div>
              <div className="calc-row">
                <div className="lbl">{isEn ? "Savings per bucket" : "Экономия на 1 ведре"}</div>
                <span className="val save">{isEn ? "−5,760 ₸" : "−5 760 ₸"}</span>
              </div>
              <div className="calc-row">
                <div className="lbl">{isEn ? "If you take 2 buckets / month" : "Если берёте 2 ведра / месяц"}</div>
                <span className="val save">{isEn ? "−11,520 ₸" : "−11 520 ₸"}</span>
              </div>
              <div className="calc-row total">
                <div className="lbl">
                  <b>{isEn ? "Per year" : "В год"}</b>
                  <span className="sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {isEn ? "on chocolate alone" : "только на одном шоколаде"}
                  </span>
                </div>
                <span className="val">{isEn ? "−138,240 ₸" : "−138 240 ₸"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === WAITLIST FORM (V0 functional piece) === */}
      <section className="s" id="waitlist" style={{ scrollMarginTop: 80 }}>
        <div className="container-x" style={{ maxWidth: 760 }}>
          <div className="sec-head">
            <div className="sec-eyebrow">{isEn ? "Pilot waitlist" : "Запись в пилот"}</div>
            <h2>
              {isEn
                ? "Sign up — we'll assemble your first group."
                : "Запишитесь — соберём первую группу с вами."}
            </h2>
            <p className="sub">
              {isEn
                ? "We register interest so we can launch the first group with the right number of participants. We'll reach out once it fills."
                : "Регистрируем интерес чтобы запустить первую группу с нужным количеством участников. Свяжемся когда наберётся."}
            </p>
          </div>
          <Suspense fallback={<WaitlistSkeleton />}>
            <WaitlistIsland products={products} initialProductIds={initialProductIds} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
