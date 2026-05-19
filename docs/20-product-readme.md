# Horecom · Context Pack for External LLM

Этот пакет описывает весь ключевой контекст о Horecom, который нужен сторонней LLM‑модели для подготовки:
- презентаций (deck)
- писем (cold emails, investor updates)
- питча (EV application, устный питч)
- сценариев видео
- текстов для сайта и лендингов

Файлы написаны так, чтобы их можно было скормить модели целиком или по частям.

## Структура пакета

1. `01-company-story-market.md`  
   Контекст о компании, сегментах, проблемах клиентов и рынке.

2. `02-product-vision-roadmap.md`  
   Видение продукта, три value‑mode, roadmap V1/V1.5/V2 и отличия от конкурентов.

3. `03-traction-metrics.md`  
   Все текущие метрики: трафик, заявки, выручка, соцсети, операционные цифры.

4. `04-founders-story.md`  
   История фаундеров: the team, co-founder, (redacted), (redacted); why this team.

5. `05-ev-grant-angle.md`  
   Конкретно под Emergent Ventures: one‑liner, why now, why EV, use of funds, counterfactual.

## Как использовать этот пакет

- Для **слайдов**: начинать с `01-company-story-market.md` и `02-product-vision-roadmap.md`, затем подкреплять цифрами из `03-traction-metrics.md`.
- Для **EV‑заявки и писем Tyler Cowen**: использовать `05-ev-grant-angle.md` + фактуру из `03-traction-metrics.md` и биографию из `04-founders-story.md`.
- Для **скриптов видео и сторис**: брать конкретные истории ((redacted), co-founder, кейсы клиентов) из `04-founders-story.md` и проблематику сегментов из `01-company-story-market.md`.

Все факты соответствуют состоянию на май 2026.
