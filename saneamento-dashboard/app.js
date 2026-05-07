const fmt = new Intl.NumberFormat('pt-BR');
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const API_URL = 'http://localhost:8001/api/dashboard';
const FALLBACK_URL = './data/mock-data.json';

const stateTableState = { page: 1, perPage: 10, sortKey: 'municipio', sortDir: 'asc' };
const criticalState = { page: 1, perPage: 10, sortKey: 'municipio', sortDir: 'asc', query: '' };

let store = null;
let charts = {};

function makeKpis(containerId, items) {
  document.getElementById(containerId).innerHTML = items
    .map(i => `<div class="kpi"><h4>${i.label}</h4><p>${i.value}</p></div>`)
    .join('');
}

function paginate(rows, state) {
  const start = (state.page - 1) * state.perPage;
  return rows.slice(start, start + state.perPage);
}

function sortRows(rows, key, dir) {
  return [...rows].sort((a, b) => {
    const av = a[key]; const bv = b[key];
    if (typeof av === 'string') return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return dir === 'asc' ? av - bv : bv - av;
  });
}

function renderPagination(elId, totalRows, state, onPage) {
  const totalPages = Math.max(1, Math.ceil(totalRows / state.perPage));
  if (state.page > totalPages) state.page = totalPages;
  document.getElementById(elId).innerHTML = Array.from({ length: totalPages }, (_, i) => i + 1)
    .map(p => `<button class="${p === state.page ? 'active' : ''}" data-page="${p}">${p}</button>`).join('');
  document.querySelectorAll(`#${elId} button`).forEach(btn => {
    btn.addEventListener('click', () => onPage(Number(btn.dataset.page)));
  });
}

function attachSort(tableId, state, renderFn) {
  document.querySelectorAll(`#${tableId} th`).forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.key;
      state.sortDir = state.sortKey === key && state.sortDir === 'asc' ? 'desc' : 'asc';
      state.sortKey = key;
      state.page = 1;
      renderFn();
    });
  });
}

function buildCharts(data) {
  if (charts.invest) charts.invest.destroy();
  if (charts.esgoto) charts.esgoto.destroy();
  if (charts.aguaDist) charts.aguaDist.destroy();

  charts.invest = new Chart(document.getElementById('investChart'), {
    type: 'bar',
    data: {
      labels: data.top_investimento_estados.map(x => x.sigla_uf),
      datasets: [{ label: 'Investimento (R$)', data: data.top_investimento_estados.map(x => x.investimento_total), backgroundColor: '#0a6e72' }]
    },
    options: { indexAxis: 'y', plugins: { tooltip: { callbacks: { label: (ctx) => money.format(ctx.parsed.x) } } } }
  });

  charts.esgoto = new Chart(document.getElementById('esgotoChart'), {
    type: 'bar',
    data: {
      labels: data.estados.map(x => x.sigla_uf),
      datasets: [{ label: 'Cobertura de Esgoto (%)', data: data.estados.map(x => x.media_cobertura_esgoto), backgroundColor: '#2d9c7f' }]
    },
    options: { plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y.toFixed(1)}%` } } } }
  });

  charts.aguaDist = new Chart(document.getElementById('aguaDistChart'), {
    type: 'bar',
    data: {
      labels: data.distribuicao_acesso_agua.map(x => x.faixa),
      datasets: [{ label: 'Municípios', data: data.distribuicao_acesso_agua.map(x => x.quantidade), backgroundColor: '#4ea3d5' }]
    },
    options: { plugins: { tooltip: { callbacks: { label: (ctx) => `${fmt.format(ctx.parsed.y)} municípios` } } } }
  });
}

function renderStateSection() {
  const uf = document.getElementById('stateSelect').value;
  const state = store.estados.find(x => x.sigla_uf === uf);
  makeKpis('state-kpis', [
    { label: 'Investimento Total (Água e Esgoto)', value: money.format(state.investimento_total) },
    { label: 'Média de Acesso à Água', value: `${state.media_acesso_agua.toFixed(1)}%` },
    { label: 'Média de Cobertura de Esgoto', value: `${state.media_cobertura_esgoto.toFixed(1)}%` },
  ]);

  const rows = sortRows(store.municipios.filter(m => m.sigla_uf === uf), stateTableState.sortKey, stateTableState.sortDir);
  const pageRows = paginate(rows, stateTableState);
  document.querySelector('#stateTable tbody').innerHTML = pageRows
    .map(r => `<tr><td>${r.municipio}</td><td>${r.acesso_agua.toFixed(1)}</td><td>${r.cobertura_esgoto.toFixed(1)}</td></tr>`).join('');

  renderPagination('statePagination', rows.length, stateTableState, (p) => { stateTableState.page = p; renderStateSection(); });
}

function renderCriticalTable() {
  const q = criticalState.query.trim().toLowerCase();
  let rows = store.municipios_criticos.filter(r => !q || r.municipio.toLowerCase().includes(q) || r.sigla_uf.toLowerCase().includes(q));
  rows = sortRows(rows, criticalState.sortKey, criticalState.sortDir);
  const pageRows = paginate(rows, criticalState);
  document.querySelector('#criticalTable tbody').innerHTML = pageRows
    .map(r => `<tr><td>${r.municipio}</td><td>${r.sigla_uf}</td><td>${money.format(r.investimento_total)}</td><td>${r.cobertura_esgoto.toFixed(1)}</td></tr>`).join('');
  renderPagination('criticalPagination', rows.length, criticalState, (p) => { criticalState.page = p; renderCriticalTable(); });
}

async function loadDashboardData() {
  try {
    const apiRes = await fetch(API_URL);
    if (!apiRes.ok) throw new Error(`API status ${apiRes.status}`);
    return await apiRes.json();
  } catch (_) {
    const fallbackRes = await fetch(FALLBACK_URL);
    if (!fallbackRes.ok) throw new Error('Falha ao carregar fallback local.');
    return await fallbackRes.json();
  }
}

async function init() {
  store = await loadDashboardData();

  makeKpis('kpi-grid', [
    { label: 'Total de Estados Analisados', value: fmt.format(store.kpis.total_estados) },
    { label: 'Total de Municípios Analisados', value: fmt.format(store.kpis.total_municipios) },
    { label: 'Média Nacional de Acesso à Água', value: `${store.kpis.media_nacional_acesso_agua.toFixed(1)}%` },
    { label: 'Média Nacional de Cobertura de Esgoto', value: `${store.kpis.media_nacional_cobertura_esgoto.toFixed(1)}%` },
  ]);

  buildCharts(store);

  const select = document.getElementById('stateSelect');
  select.innerHTML = store.estados.map(e => `<option value="${e.sigla_uf}">${e.sigla_uf} - ${e.estado}</option>`).join('');
  select.addEventListener('change', () => { stateTableState.page = 1; renderStateSection(); });

  attachSort('stateTable', stateTableState, renderStateSection);
  attachSort('criticalTable', criticalState, renderCriticalTable);

  document.getElementById('criticalSearch').addEventListener('input', (e) => {
    criticalState.query = e.target.value;
    criticalState.page = 1;
    renderCriticalTable();
  });

  renderStateSection();
  renderCriticalTable();
}

init().catch(err => {
  console.error(err);
  alert('Falha ao carregar dados do dashboard.');
});
