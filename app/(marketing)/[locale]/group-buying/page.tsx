import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { COMPANY } from "@/lib/company";
import { GroupBuyWaitlistForm } from "./waitlist-form";
import { LiveCountdown } from "./countdown";
import "./group-buying.css";

// ISR (5 min). See /subscription rationale — same shape (auth check +
// products list + optional ?product=SKU pre-select).
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Групповая закупка — оптовые цены для самозанятых кондитеров",
  description:
    "Объединяйтесь с 3–5 кондитерами и купите оптовое ведро шоколада или мешок муки — каждый получит свою долю и оптовую цену. Цена защищена с момента создания группы.",
};

export default async function GroupBuyingPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
              <span className="pill">В&nbsp;пилоте</span>
              <span>4 активные закупки · 28 участников · средняя экономия −18%</span>
              <span style={{ marginLeft: "auto" }} className="show-md">
                Вход в пилот по запросу
              </span>
            </div>
          </div>
        </div>

        <div className="container-x gb-body">
          <div className="gb-grid">
            <div>
              <h1>
                Опт <em>на пятерых.</em>
                <br />
                Без склада
                <br />у вас дома.
              </h1>

              <p className="lede">
                Объединитесь с 3–5 кондитерами и купите оптовое ведро шоколада или мешок муки — каждый получит
                свою долю и оптовую цену. Цена защищена с момента создания группы.
              </p>

              <div className="ctas">
                <a href="#waitlist" className="btn btn-orange btn-lg">
                  Войти в пилот
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
                <a href="#how" className="btn btn-lg gb-ghost-btn">
                  Как это работает
                </a>
              </div>

              <div className="meta">
                <span>
                  <b>−18%</b> средняя экономия
                </span>
                <span>·</span>
                <span>
                  Цена защищена <b>при старте группы</b>
                </span>
                <span>·</span>
                <span>
                  Без рисков — <b>не собралась = вернули</b>
                </span>
              </div>
            </div>

            {/* LIVE GROUP CARD with live countdown */}
            <div className="gb-card">
              <div className="gb-card-head">
                <div className="lt">
                  <span className="live-dot" />
                  <span className="nm">Закупка активна</span>
                </div>
                <div className="sub">
                  Создатель: <b style={{ color: "#fff" }}>@aselya.cakes</b>
                </div>
              </div>

              <div className="gb-card-prod">
                <div className="img">
                  <img
                    src="https://static.tildacdn.com/stor3935-3966-4830-a661-366365656231/13115719.jpg"
                    alt="Шоколад"
                  />
                </div>
                <div>
                  <div className="meta">Veliche · ведро 10 кг</div>
                  <div className="nm">Шоколад белый, 10 кг</div>
                  <div className="prices">
                    <span className="strike">32 000 ₸</span>
                    <span className="new">26 240 ₸</span>
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
                    2 624 ₸/кг при цене в группе
                  </div>
                </div>
              </div>

              <div className="gb-progress">
                <div className="gb-progress-row">
                  <span className="lbl">Прогресс</span>
                  <span className="val">4 / 6 чел</span>
                </div>
                <div className="gb-bar">
                  <div className="fill" style={{ width: "67%" }} />
                </div>
                <div className="gb-progress-foot">
                  <span>
                    Нужно ещё <b style={{ color: "#fff" }}>2 человека</b>
                  </span>
                  <span>67% набрано</span>
                </div>
              </div>

              <div className="avatars">
                <div className="av-stack">
                  <span className="av b">АС</span>
                  <span className="av o">МК</span>
                  <span className="av g">ДА</span>
                  <span className="av p">АН</span>
                  <span className="av placeholder">+</span>
                  <span className="av placeholder">+</span>
                </div>
                <div className="av-info">
                  <b>Asel, Мадина, Дана, Анара</b>
                  <br />+ 2 свободных места
                </div>
              </div>

              <LiveCountdown targetIso={groupEndsAt} />

              <div className="gb-card-foot">
                <a href="#waitlist" className="btn btn-orange btn-lg" style={{ width: "100%" }}>
                  Присоединиться · 26 240 ₸
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
            <div className="sec-eyebrow">Как это работает</div>
            <h2>4 шага от поста в Instagram до оптовой цены.</h2>
            <p className="sub">
              Создайте группу или присоединитесь к существующей. Когда суммарный объём достигает порога — все
              получают оптовую цену автоматически.
            </p>
          </div>

          <div className="steps">
            {[
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
            ].map((s, i) => (
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
                Почему это работает
              </div>
              <h2>Поставщики дают опт от 4 единиц. Один кондитер столько не возьмёт.</h2>
              <p className="sub">
                Большинство брендов — Barry Callebaut, IRCA, Sicao — отдают оптовую цену только от 4+ мешков
                или ведер. Для одной маленькой кондитерской это значит переплачивать рознично или замораживать
                капитал в складе на месяц.
              </p>
              <p className="sub" style={{ marginTop: 12 }}>
                Групповая закупка решает эту арифметику: четыре кондитера по одному мешку = опт. Каждый платит
                свою долю, забирает свой объём, и никто не держит лишнее на полке.
              </p>

              <div className="eco-bigstats">
                <div>
                  <div className="bignum orange">−18%</div>
                  <div className="lbl">средняя экономия</div>
                </div>
                <div>
                  <div className="bignum">4–6</div>
                  <div className="lbl">человек в группе</div>
                </div>
                <div>
                  <div className="bignum">3 дня</div>
                  <div className="lbl">типичный срок группы</div>
                </div>
              </div>
            </div>

            <div className="calc">
              <div className="calc-row head">
                <span className="lbl">Сценарий: шоколад белый 10 кг</span>
                <span className="lbl">за 1 ведро</span>
              </div>
              <div className="calc-row">
                <div className="lbl">
                  <b>Розничная цена</b>
                  <span className="sm">если покупаете в одиночку</span>
                </div>
                <span className="val">32 000 ₸</span>
              </div>
              <div className="calc-row">
                <div className="lbl">
                  <b>Оптовая цена (от 4 шт)</b>
                  <span className="sm">если вас 4–6 в группе</span>
                </div>
                <span className="val">26 240 ₸</span>
              </div>
              <div className="calc-row">
                <div className="lbl">Экономия на 1 ведре</div>
                <span className="val save">−5 760 ₸</span>
              </div>
              <div className="calc-row">
                <div className="lbl">Если берёте 2 ведра / месяц</div>
                <span className="val save">−11 520 ₸</span>
              </div>
              <div className="calc-row total">
                <div className="lbl">
                  <b>В год</b>
                  <span className="sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                    только на одном шоколаде
                  </span>
                </div>
                <span className="val">−138 240 ₸</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === WAITLIST FORM (V0 functional piece) === */}
      <section className="s" id="waitlist" style={{ scrollMarginTop: 80 }}>
        <div className="container-x" style={{ maxWidth: 760 }}>
          <div className="sec-head">
            <div className="sec-eyebrow">Запись в пилот</div>
            <h2>Запишитесь — соберём первую группу с вами.</h2>
            <p className="sub">
              Регистрируем интерес чтобы запустить первую группу с нужным количеством участников. Свяжемся
              когда наберётся.
            </p>
          </div>
          <GroupBuyWaitlistForm
            products={products}
            defaultEmail={user?.email ?? null}
            initialProductIds={initialProductIds}
          />
        </div>
      </section>
    </>
  );
}
