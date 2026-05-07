# Dashboard Interativo de Saneamento

Frontend em HTML, CSS e JavaScript puro para visualizar indicadores de saneamento básico no Brasil com gráficos Chart.js e dados mockados.

## Estrutura

- `index.html`: layout e seções do dashboard
- `styles.css`: tema visual responsivo
- `app.js`: carregamento assíncrono, gráficos, filtros e tabelas
- `data/mock-data.json`: base mockada para os indicadores
- `api/main.py`: API FastAPI com endpoints do dashboard
- `api/requirements.txt`: dependências da API

## Como rodar localmente

### 1) Backend (API)

1. Entre na pasta da API:
   ```bash
   cd saneamento-dashboard/api
   ```
2. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
3. Inicie o servidor:
   ```bash
   uvicorn main:app --reload --port 8001
   ```
4. Teste no navegador:
   - `http://localhost:8001/api/health`
   - `http://localhost:8001/api/dashboard`

### 2) Frontend

1. Em outro terminal, vá para a pasta do dashboard:
   ```bash
   cd saneamento-dashboard
   ```
2. Suba um servidor estático:
   ```bash
   python -m http.server 8000
   ```
3. Abra:
   - `http://localhost:8000`

## Endpoints da API

- `GET /api/health`: status da API
- `GET /api/dashboard`: payload completo para o dashboard
- `GET /api/estados/{uf}`: dados agregados e municípios de um estado
- `GET /api/municipios-criticos?q=texto`: busca de municípios críticos

## Funcionalidades

- KPIs nacionais de estados, municípios, acesso à água e cobertura de esgoto
- Gráfico de barras horizontal com top investimentos por estado
- Gráfico de cobertura de esgoto por estado
- Distribuição de acesso à água por faixa percentual
- Filtro por estado com KPIs específicos
- Tabela de municípios por estado com ordenação e paginação
- Tabela de municípios críticos com busca, ordenação e paginação

## Fonte dos dados

Os dados são mockados para simular os resultados da análise do script `pandas/01_analise.py` e foram estruturados para permitir evolução futura para backend real.

Observação: o frontend tenta primeiro a API em `http://localhost:8001/api/dashboard`. Se a API não estiver disponível, ele usa fallback automático para `data/mock-data.json`.
