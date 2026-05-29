#!/usr/bin/env bash
# scripts/demo-mcp.sh — demo flow для записи ролика про MCP.
#
# Запуск:
#   bash scripts/demo-mcp.sh           # вся последовательность
#   bash scripts/demo-mcp.sh 1         # только секция 1 (manifest)
#   bash scripts/demo-mcp.sh 2 3 4     # секции 2, 3, 4
#
# Идея: каждая секция — это отдельный кадр видео. AI-агент (Claude / GPT /
# Perplexity / любой MCP-клиент) видит ровно эти JSON-ответы.

set -e
BASE="${BASE_URL:-https://horecom-platform-eosin.vercel.app}"

# Pretty-print JSON с кириллицей as-is (без \u04XX escape), обрезает.
pj() {
  python3 -c "
import json, sys
try:
    print(json.dumps(json.load(sys.stdin), indent=2, ensure_ascii=False))
except Exception as e:
    print(f'(parse error: {e})')
" 2>&1 | head -"${1:-60}"
}

section() {
  printf '\n'
  printf '════════════════════════════════════════════════════════════════════════\n'
  printf '  %s\n' "$1"
  printf '════════════════════════════════════════════════════════════════════════\n'
  printf '%s\n\n' "$2"
}

run_1_manifest() {
  section "1. AI-агент находит сервер: GET /api/mcp/manifest.json" \
"Это «визитка» MCP-сервера. AI читает её первой — узнаёт что
есть в наличии, как с этим работать, нужна ли авторизация."
  echo "▸ curl ${BASE}/api/mcp/manifest.json"
  echo
  curl -sS "${BASE}/api/mcp/manifest.json" | pj 30
}

run_2_tools() {
  section "2. Список инструментов: GET /api/mcp/tools" \
"AI узнаёт что именно умеет сервер. Здесь — 6 инструментов:
поиск, детали товара, склад, объёмные цены, аналоги, заказ."
  echo "▸ curl ${BASE}/api/mcp/tools"
  echo
  curl -sS "${BASE}/api/mcp/tools" \
    | python3 -c "
import json,sys
d=json.load(sys.stdin)
for t in d['tools']:
    print(f'  • {t[\"name\"]:24} — {t[\"description\"][:78]}')
"
}

run_3_search() {
  section '3. Сценарий 1: «Найди шоколад Veliche»' \
'AI вызывает search_products. Возвращается список с реальными
ценами в тенге, остатками на складе, ссылками на карточку товара.'
  echo '▸ curl -X POST '"${BASE}"'/api/mcp/call \'
  echo '    -d {"tool_name":"search_products","arguments":{"query":"Veliche","max_results":3}}'
  echo
  curl -sS -X POST "${BASE}/api/mcp/call" \
    -H "Content-Type: application/json" \
    -d '{"tool_name":"search_products","arguments":{"query":"Veliche","max_results":3}}' \
    | pj 80
}

run_4_get_product() {
  section '4. Сценарий 2: «Покажи карточку этого товара»' \
'AI берёт slug из результата поиска и вызывает get_product —
получает полную инфу: бренд, упаковка, MOQ, описание.'
  SLUG=$(curl -sS -X POST "${BASE}/api/mcp/call" \
    -H "Content-Type: application/json" \
    -d '{"tool_name":"search_products","arguments":{"query":"Veliche","max_results":1}}' \
    | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['products'][0]['slug'])")
  echo "▸ curl -X POST ${BASE}/api/mcp/call \\"
  echo '    -d {"tool_name":"get_product","arguments":{"slug":"'"${SLUG}"'"}}'
  echo
  curl -sS -X POST "${BASE}/api/mcp/call" \
    -H "Content-Type: application/json" \
    -d "{\"tool_name\":\"get_product\",\"arguments\":{\"slug\":\"${SLUG}\"}}" \
    | pj 50
}

run_5_pricing() {
  section '5. Сценарий 3: «Какая цена при оптовой закупке?»' \
'get_volume_pricing — лестница оптовых цен. Чем больше берёшь,
тем дешевле за единицу. AI помогает агенту посчитать оптимум.'
  SKU=$(curl -sS -X POST "${BASE}/api/mcp/call" \
    -H "Content-Type: application/json" \
    -d '{"tool_name":"search_products","arguments":{"query":"Veliche","max_results":1}}' \
    | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['products'][0]['sku'])")
  echo "▸ get_volume_pricing for ${SKU}"
  echo
  curl -sS -X POST "${BASE}/api/mcp/call" \
    -H "Content-Type: application/json" \
    -d "{\"tool_name\":\"get_volume_pricing\",\"arguments\":{\"sku\":\"${SKU}\"}}" \
    | pj 40
}

run_6_similar() {
  section '6. Сценарий 4: «Этого нет — что предложишь?»' \
'find_similar — векторный поиск по embedding-ам. Используется
когда нужного товара нет на складе или клиент хочет альтернативу.'
  SKU=$(curl -sS -X POST "${BASE}/api/mcp/call" \
    -H "Content-Type: application/json" \
    -d '{"tool_name":"search_products","arguments":{"query":"Veliche","max_results":1}}' \
    | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['products'][0]['sku'])")
  echo "▸ find_similar для ${SKU} (top 3 аналога)"
  echo
  curl -sS -X POST "${BASE}/api/mcp/call" \
    -H "Content-Type: application/json" \
    -d "{\"tool_name\":\"find_similar\",\"arguments\":{\"sku\":\"${SKU}\",\"max_results\":3}}" \
    | pj 60
}

run_7_validation() {
  section '7. Структурная валидация: AI получает понятную ошибку' \
'Если AI отправит мусор — сервер вернёт 400 с указанием поля
и причины. AI самостоятельно поправит запрос.'
  echo '▸ POST max_results=999 (лимит 50)'
  echo
  BODY=$(curl -sS -X POST "${BASE}/api/mcp/call" \
    -H "Content-Type: application/json" \
    -d '{"tool_name":"search_products","arguments":{"query":"chocolate","max_results":999}}')
  STATUS=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "${BASE}/api/mcp/call" \
    -H "Content-Type: application/json" \
    -d '{"tool_name":"search_products","arguments":{"query":"chocolate","max_results":999}}')
  echo "HTTP ${STATUS}"
  echo
  echo "$BODY" | pj 20
}

# Selector: запускаем секции по номерам или все подряд.
if [ $# -eq 0 ]; then
  for n in 1 2 3 4 5 6 7; do "run_${n}_$(declare -F | grep -oE "run_${n}_[a-z_]+" | sed -E "s/run_${n}_//" | head -1)"; done
else
  for arg in "$@"; do
    case "$arg" in
      1) run_1_manifest ;;
      2) run_2_tools ;;
      3) run_3_search ;;
      4) run_4_get_product ;;
      5) run_5_pricing ;;
      6) run_6_similar ;;
      7) run_7_validation ;;
      *) echo "unknown section: $arg (use 1-7)"; exit 1 ;;
    esac
  done
fi
