import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { COMPANY } from "@/lib/company";
import { SubscriptionRequestForm } from "./request-form";
import "./subscription.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Подписка на поставку — предиктивный движок",
  description:
    "Подписка на поставку с предиктивным движком и WhatsApp-напоминаниями. За 24 часа до отгрузки — подтвердить/изменить/пропустить в один тап. Edit/Skip/Pause всегда доступны. Бесплатно.",
};

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, brand: true, packLabel: true, sku: true },
    orderBy: [{ isSubscriptionEligible: "desc" }, { name: "asc" }],
  });

  return (
    <>
      {/* === HERO + PREDICTIVE CHART === */}
      <section className="sub-hero">
        <div className="container-x">
          <div className="sub-hero-grid">
            <div>
              <div className="sub-eyebrow">
                <span className="dot" />
                <span>Для кондитерских без склада</span>
              </div>

              <h1>
                Доставляем <em>до того</em> как
                <br />у&nbsp;вас закончилось.
              </h1>

              <p className="lede">
                Подписка на поставку с предиктивным движком: считаем рост заказов и сами предлагаем что подвезти. За день до
                отгрузки — WhatsApp с составом. Подтверждаете в один тап.
              </p>

              <div className="ctas">
                <a href="#request" className="btn btn-orange btn-lg">
                  Подать запрос
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
                <a
                  href={COMPANY.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-lg"
                >
                  Спросить менеджера
                </a>
              </div>

              <div className="meta">
                <span>
                  <b>Бесплатно</b> · платите только за товары
                </span>
                <span>·</span>
                <span>
                  <b>10+</b> кондитерских уже на подписке
                </span>
                <span>·</span>
                <span>
                  Edit / Skip / Pause <b>в один тап</b>
                </span>
              </div>
            </div>

            {/* Predictive timeline — "Кофейня Куст" example */}
            <div className="pred">
              <div className="pred-head">
                <div className="ttl">
                  <span className="live-dot" />
                  План подписки · Кофейня «Куст»
                </div>
                <div className="sub">
                  12 позиций · следующая доставка <b style={{ color: "var(--c-fg)" }}>ср, 27 мая · 10:30</b>
                </div>
              </div>
              <div className="pred-body">
                <div className="pred-chart">
                  <svg
                    viewBox="0 0 600 240"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <g stroke="#E8E5DD" strokeWidth="1">
                      <line x1="40" y1="40" x2="600" y2="40" />
                      <line x1="40" y1="100" x2="600" y2="100" />
                      <line x1="40" y1="160" x2="600" y2="160" />
                      <line x1="40" y1="200" x2="600" y2="200" />
                    </g>
                    <g fontFamily="Inter, sans-serif" fontSize="10" fill="#A19D93" textAnchor="end">
                      <text x="34" y="44">100%</text>
                      <text x="34" y="104">66%</text>
                      <text x="34" y="164">33%</text>
                      <text x="34" y="204">0%</text>
                    </g>
                    <line
                      x1="40"
                      y1="170"
                      x2="600"
                      y2="170"
                      stroke="#F18007"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      opacity="0.5"
                    />
                    <text
                      x="600"
                      y="166"
                      fontFamily="Inter, sans-serif"
                      fontSize="10"
                      fill="#C86400"
                      textAnchor="end"
                      fontWeight="600"
                    >
                      порог дозакупа · 20%
                    </text>
                    <g stroke="#F18007" strokeWidth="1" strokeDasharray="2 3" opacity="0.4">
                      <line x1="100" y1="20" x2="100" y2="220" />
                      <line x1="220" y1="20" x2="220" y2="220" />
                      <line x1="340" y1="20" x2="340" y2="220" />
                      <line x1="460" y1="20" x2="460" y2="220" />
                    </g>
                    <path
                      d="M 40 60 L 100 165 L 100 50 L 160 130 L 220 175 L 220 55 L 280 130 L 340 178 L 340 52"
                      stroke="#394AD4"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 340 52 L 400 130 L 460 175 L 460 55 L 520 132 L 580 178"
                      stroke="#394AD4"
                      strokeWidth="2.5"
                      fill="none"
                      strokeDasharray="5 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.55"
                    />
                    <g>
                      <circle cx="100" cy="50" r="5" fill="#F18007" />
                      <circle cx="220" cy="55" r="5" fill="#F18007" />
                      <circle cx="340" cy="52" r="5" fill="#F18007" />
                      <circle cx="460" cy="55" r="6" fill="#F18007" stroke="#fff" strokeWidth="2" />
                    </g>
                    <path
                      d="M 340 52 L 400 110 L 460 160 L 460 50 L 520 110 L 580 160 L 580 200 L 520 150 L 460 95 L 400 150 L 340 95 Z"
                      fill="#394AD4"
                      opacity="0.08"
                    />
                    <g>
                      <line x1="460" y1="35" x2="460" y2="50" stroke="#F18007" strokeWidth="1.5" />
                      <rect x="386" y="14" width="148" height="22" rx="11" fill="#F18007" />
                      <text
                        x="460"
                        y="29"
                        fontFamily="Inter, sans-serif"
                        fontSize="11"
                        fill="#fff"
                        textAnchor="middle"
                        fontWeight="700"
                      >
                        Следующая · ср 27 мая
                      </text>
                    </g>
                    <g fontFamily="Inter, sans-serif" fontSize="10" fill="#6F6B62" textAnchor="middle">
                      <text x="40" y="232">3 нед назад</text>
                      <text x="100" y="232">2 нед</text>
                      <text x="220" y="232">1 нед</text>
                      <text x="340" y="232" fontWeight="700" fill="#0A0A0A">
                        сегодня
                      </text>
                      <text x="460" y="232" fontWeight="600" fill="#C86400">
                        +1 нед
                      </text>
                      <text x="580" y="232">+2 нед</text>
                    </g>
                  </svg>
                </div>

                <div className="pred-legend">
                  <div className="it">
                    <span className="sw b" /> Уровень запасов
                  </div>
                  <div className="it">
                    <span className="sw o" /> Доставка по подписке
                  </div>
                  <div className="it">
                    <span
                      className="sw"
                      style={{
                        background: "none",
                        border: "1px dashed var(--c-blue)",
                        height: 0,
                        width: 14,
                        marginTop: 5,
                      }}
                    />{" "}
                    Прогноз
                  </div>
                </div>
              </div>

              <div className="pred-foot">
                <div>
                  <span className="k">Частота</span>
                  <span className="v">1 раз / неделя</span>
                </div>
                <div>
                  <span className="k">Сред. чек</span>
                  <span className="v">187 200 ₸</span>
                </div>
                <div>
                  <span className="k">Экономия</span>
                  <span className="v green">−14% / мес</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === WHATSAPP FLOW === */}
      <section className="s">
        <div className="container-x">
          <div className="sec-head">
            <div className="sec-eyebrow">За 24 часа до отгрузки</div>
            <h2>WhatsApp вместо звонков и таблиц.</h2>
            <p className="sub">
              За день до доставки приходит сообщение с составом следующего заказа. Подтверждаете, меняете
              количество или пропускаете эту неделю — без открытия приложения, без логинов.
            </p>
          </div>

          <div className="wa-flow">
            <div className="wa-window">
              <div className="wa-bar">
                <div className="av">
                  <Image
                    src="/logos/logo-mark.png"
                    alt="Horecom"
                    width={36}
                    height={36}
                    style={{ background: "#000", padding: 4 }}
                    unoptimized
                  />
                </div>
                <div>
                  <div className="nm">Horecom</div>
                  <div className="st">онлайн · отвечает за ≈ 4 мин</div>
                </div>
              </div>

              <div className="wa-thread">
                <div className="day-sep">вторник, 26 мая · 09:00</div>

                <div className="wa-bub btns-card">
                  <div className="body">
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>📦 Доставка завтра, ср 27 мая</div>
                    <div style={{ color: "#666", marginBottom: 8 }}>10:30–12:30 · ул. Сейфуллина 14</div>

                    <div
                      style={{
                        background: "#f7f7f5",
                        borderRadius: 8,
                        padding: "10px 12px",
                        fontSize: 12,
                        lineHeight: 1.6,
                        fontVariantNumeric: "tabular-nums",
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Сгущёнка ГОСТ 20 кг</span>
                        <b>1 уп · 33 800 ₸</b>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Сироп карамель 1883 1 л</span>
                        <b>4 уп · 16 800 ₸</b>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Конфитюр Абрикос 12 кг</span>
                        <b>2 уп · 46 800 ₸</b>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>+ 9 позиций</span>
                        <b>89 800 ₸</b>
                      </div>
                      <div
                        style={{
                          borderTop: "1px solid #ddd",
                          marginTop: 6,
                          paddingTop: 6,
                          display: "flex",
                          justifyContent: "space-between",
                          fontWeight: 700,
                        }}
                      >
                        <span>Итого</span>
                        <span style={{ color: "#117A3F" }}>187 200 ₸</span>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <button type="button">✅ Подтвердить</button>
                    <button type="button">✏️ Изменить</button>
                    <button type="button">⏭ Пропустить</button>
                  </div>
                </div>

                <div className="wa-bub me">
                  ✅ Подтвердить
                  <div className="time">
                    09:12 <span className="ck">✓✓</span>
                  </div>
                </div>

                <div className="wa-bub">
                  Отлично! Заказ зафиксирован. Курьер выезжает завтра в 10:00. Счёт уже на почте: <b>kust@gmail.com</b>
                  <div className="time">09:13</div>
                </div>

                <div className="day-sep">среда, 27 мая · 10:18</div>

                <div className="wa-bub">
                  🚚 Курьер в пути, ETA 10:34
                  <div className="time">10:18</div>
                </div>
              </div>
            </div>

            <div className="wa-explain">
              {[
                {
                  n: 1,
                  ttl: "За 24 часа — состав следующей доставки",
                  txt: (
                    <>
                      WhatsApp со списком позиций и итогом. <b>Если цена изменилась</b> — отметим красным, можно
                      отказаться. <b>Если товара нет</b> — предложим аналог.
                    </>
                  ),
                },
                {
                  n: 2,
                  ttl: "Три кнопки: Подтвердить · Изменить · Пропустить",
                  txt: (
                    <>
                      Прямо в WhatsApp, без открытия сайта. Если <b>не ответили за 2 часа до cutoff</b> —
                      отменяем доставку, не списываем (default-fallback в вашу пользу).
                    </>
                  ),
                },
                {
                  n: 3,
                  ttl: "Изменяете состав в одно сообщение",
                  txt: "«Уберите конфитюр, добавьте 2 муки» — менеджер пересчитает и пришлёт обновлённый счёт. Можно и через ЛК, кому удобнее.",
                },
                {
                  n: 4,
                  ttl: "Курьер в пути — уведомление с ETA",
                  txt: (
                    <>
                      В день доставки приходит сообщение со временем выезда и ETA. <b>После доставки</b> — фото и
                      накладная сразу в чат.
                    </>
                  ),
                },
                {
                  n: 5,
                  ttl: "Edit / Skip / Pause — без штрафов и контрактов",
                  txt: "Уехали в отпуск? Поставьте на паузу. Сменили рецепт? Уберите товар. Совсем не нужно? Отмените — никаких неустоек.",
                },
              ].map((s) => (
                <div key={s.n} className="wa-step">
                  <div className="n">{s.n}</div>
                  <div>
                    <div className="ttl">{s.ttl}</div>
                    <div className="txt">{s.txt}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* === COMPARISON === */}
      <section className="s cmp-band">
        <div className="container-x">
          <div className="sec-head">
            <div className="sec-eyebrow" style={{ color: "var(--c-blue)" }}>
              Подписка на поставку vs Разовый заказ
            </div>
            <h2>Сколько вы сэкономите за месяц.</h2>
            <p className="sub">
              Сравнение на реальном чеке: 12 позиций, 4 доставки в месяц, типовая корзина небольшой кондитерской.
            </p>
          </div>

          <div className="cmp">
            <div className="cmp-card">
              <div className="cmp-h">
                <div className="name">Разовый заказ</div>
                <div className="price">
                  <span className="tabular">218 400</span> ₸<span className="per">/ месяц</span>
                </div>
              </div>
              {[
                { ok: true, label: "Самостоятельный сбор корзины каждую неделю", v: <><b>~15 мин</b> × 4</> },
                { ok: false, label: "Без напоминания за день", v: "" },
                { ok: false, label: "Без оптовой ступеньки на регулярные товары", v: "" },
                { ok: true, label: "Бесплатная доставка", v: <>от <b>20 000 ₸</b></> },
                { ok: false, label: "Без предиктивных дозакупов", v: "" },
                { ok: true, label: "Документы для бухгалтерии", v: "все форматы" },
              ].map((row, idx) => (
                <div key={idx} className={`cmp-row${row.ok ? "" : " dim"}`}>
                  <div className={`ic${row.ok ? "" : " x"}`}>{row.ok ? "✓" : "×"}</div>
                  <div className="label">{row.label}</div>
                  <div className="v">{row.v}</div>
                </div>
              ))}
            </div>

            <div className="cmp-card hi">
              <div className="cmp-h">
                <div className="name" style={{ color: "var(--c-orange-700)" }}>Подписка на поставку</div>
                <div className="price">
                  <span className="tabular">187 200</span> ₸<span className="per">/ месяц</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: "var(--c-success)", fontWeight: 700 }}>
                  −31 200 ₸ / месяц · экономия 14.3%
                </div>
              </div>
              {[
                { label: "Корзина собирается автоматически", v: <><b>~30 сек</b> на подтверждение</> },
                { label: "WhatsApp за 24 часа до отгрузки", v: <><b>Confirm / Edit / Skip</b></> },
                { label: "Оптовая ступенька на регулярные товары", v: <span className="badge">−7%</span> },
                { label: "Бесплатная доставка", v: <>от <b>7 000 ₸</b></> },
                { label: "Предиктивный движок: что закончится", v: "после 2 доставок" },
                { label: "Документы для бухгалтерии", v: "все форматы" },
              ].map((row, idx) => (
                <div key={idx} className="cmp-row">
                  <div className="ic">✓</div>
                  <div className="label">{row.label}</div>
                  <div className="v">{row.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              textAlign: "center",
              fontSize: 13,
              color: "var(--c-fg-3)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Сценарий: 12 позиций · 4 доставки / мес · средняя корзина 50 000 ₸ · апрель–май 2026
          </div>
        </div>
      </section>

      {/* === REQUEST FORM (V0 functional piece) === */}
      <section className="s" id="request" style={{ scrollMarginTop: 80 }}>
        <div className="container-x" style={{ maxWidth: 760 }}>
          <div className="sec-head">
            <div className="sec-eyebrow">Подать запрос</div>
            <h2>Подключите подписку прямо сейчас.</h2>
            <p className="sub">
              Мы свяжемся в WhatsApp в течение дня, уточним детали и подтвердим. После этого подписка станет
              активной.
            </p>
          </div>
          <SubscriptionRequestForm products={products} isAuthed={!!user} />
        </div>
      </section>
    </>
  );
}
