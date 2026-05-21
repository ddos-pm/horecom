# Horecom MCP Server — Integration Guide

> Tyler / любой AI клиент может подключиться к Horecom за 30 секунд и
> искать товары, проверять наличие, создавать draft-заказы через стандартный
> MCP-протокол.

## Endpoints (production)

| Endpoint | Method | Описание |
| --- | --- | --- |
| `/api/mcp/manifest.json` | GET | Server metadata, schema_version, описание для AI |
| `/api/mcp/tools` | GET | Каталог из 6 tools с JSON Schema для каждого |
| `/api/mcp/call` | POST | Выполнить tool: `{ "tool_name": "...", "arguments": {...} }` |

**Base URL (production):**
`https://horecom-platform-eosin.vercel.app`

## 6 tools

1. **`search_products`** — full-text search каталога с фильтрами (категория, бренд, наличие).
2. **`get_product`** — детальная карточка товара по slug.
3. **`check_inventory`** — проверка наличия SKU + альтернативы если нет.
4. **`get_volume_pricing`** — оптовые тиры с recommendation.
5. **`find_similar`** — похожие товары (pgvector embeddings когда настроены, иначе category+brand+price heuristic).
6. **`create_draft_order`** — создаёт `DRAFT_PENDING_CONFIRMATION` заказ + WhatsApp deep-link для подтверждения клиентом. Без авто-подтверждения.

## Подключение через Claude Desktop

1. **Claude Desktop → Settings → Developer → Edit Config**
2. Вставить:

```json
{
  "mcpServers": {
    "horecom": {
      "url": "https://horecom-platform-eosin.vercel.app/api/mcp"
    }
  }
}
```

3. **Restart Claude Desktop**
4. В чате напечатать: «Найди мне сгущёнку в Horecom».
5. Claude автоматически вызовет `search_products`, вернёт реальные товары из БД.

## Quick curl tests

```bash
BASE="https://horecom-platform-eosin.vercel.app/api/mcp"

# 1. Manifest
curl -s "$BASE/manifest.json" | jq

# 2. Tools catalog
curl -s "$BASE/tools" | jq

# 3. Search
curl -s -X POST "$BASE/call" \
  -H 'Content-Type: application/json' \
  -d '{"tool_name":"search_products","arguments":{"query":"сгущёнка","max_results":3}}' | jq

# 4. Product detail
curl -s -X POST "$BASE/call" \
  -H 'Content-Type: application/json' \
  -d '{"tool_name":"get_product","arguments":{"slug":"sguschennoe-moloko-gost-lyubimo-20kg"}}' | jq

# 5. Inventory check
curl -s -X POST "$BASE/call" \
  -H 'Content-Type: application/json' \
  -d '{"tool_name":"check_inventory","arguments":{"sku":"HC-DAIRY-0067","quantity":3}}' | jq

# 6. Find similar
curl -s -X POST "$BASE/call" \
  -H 'Content-Type: application/json' \
  -d '{"tool_name":"find_similar","arguments":{"sku":"HC-DAIRY-0067","max_results":3}}' | jq

# 7. Create draft order
curl -s -X POST "$BASE/call" \
  -H 'Content-Type: application/json' \
  -d '{
    "tool_name": "create_draft_order",
    "arguments": {
      "items": [{"sku":"HC-DAIRY-0067","quantity":2}],
      "delivery_address": "Астана, ул. Сейфуллина 14",
      "customer_name": "Тестовый клиент",
      "customer_phone": "+77777777777"
    }
  }' | jq
```

## Безопасность V0

- **Auth: none.** Read tools (search/get/check/pricing/similar) — публичные.
- **`create_draft_order`** создаёт заказ со status `DRAFT_PENDING_CONFIRMATION`
  и не запускает fulfillment. Клиент должен открыть WhatsApp-ссылку и подтвердить
  через менеджер. **AI агент не может автоматически закупиться.**
- **Rate limit:** 60 req/мин/IP (in-memory).
- **Все вызовы логируются** в `McpCall` (toolName, input, output, error,
  durationMs, ip, userAgent) — для аналитики и threat detection.

## Embedding-based `find_similar` (опционально)

Сейчас `find_similar` использует heuristic (category + brand + price proximity).
Чтобы перейти на семантические embeddings (pgvector + OpenAI text-embedding-3-small):

```bash
# 1. В Supabase Dashboard → Database → Extensions → enable "vector"
# 2. Применить SQL миграцию:
psql "$DIRECT_URL" -f scripts/enable-pgvector.sql
# 3. Сгенерировать embeddings (одноразово, ~$0.001 для 190 SKU):
OPENAI_API_KEY=sk-... npx tsx scripts/generate-product-embeddings.ts
```

`find_similar` начнёт автоматически использовать pgvector. Если embedding нет —
fallback на текущий heuristic, ничего не ломается.

## Product enrichment (опционально, улучшает MCP responses)

`scripts/enrich-products.ts` использует Claude API для дополнения товаров:
`brandResolved`, `descriptionExtended`, `useCases`, `composition`, `storageInfo`.
Эти поля повышают качество `get_product` для AI-клиентов и используются для
embeddings.

```bash
# Dry-run на одном SKU:
ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/enrich-products.ts --sku HC-DAIRY-0067 --dry

# Полный прогон по всем неenriched продуктам (~$0.60, ~15 мин):
ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/enrich-products.ts
```

## Что в репо

```
app/api/mcp/
  manifest.json/route.ts   — GET manifest
  tools/route.ts            — GET tools catalog
  call/route.ts             — POST execute

lib/mcp/
  tools.ts                  — 6 tool implementations, Zod schemas, TOOL_REGISTRY
  rate-limit.ts             — in-memory 60 req/min/IP
  logger.ts                 — best-effort McpCall persistence

scripts/
  enrich-products.ts        — Claude-driven product enrichment
  generate-product-embeddings.ts — OpenAI embeddings for find_similar
  enable-pgvector.sql       — manual SQL for Supabase (one-time)

prisma/schema.prisma
  - OrderStatus.DRAFT_PENDING_CONFIRMATION (new value)
  - Order.agentMetadata Json? (agent name/IP, customer details)
  - Order.source = "MCP_AGENT" for agent-initiated orders
  - McpCall model (analytics log)
  - Product.{brandResolved, descriptionExtended, useCases, composition,
    storageInfo, enrichedAt, embedding}
```

---

**co-founder:** для demo Tyler'у — открой Claude Desktop, добавь JSON выше в config,
restart, напечатай в чате «Search Horecom for сгущёнка» — получишь живой ответ
с реальными SKU из Supabase. Это и есть «agentic infrastructure» в действии.
