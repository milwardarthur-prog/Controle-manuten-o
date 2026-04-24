const TODOS_EQUIPAMENTOS = [
  "GE-01-02","GE-02-50","GE-03-40","GE-04-55","GE-05-55","GE-06-115","GE-07-06","GE-08-06","GE-09-170","GE-10-25",
  "GE-11-75","GE-12-75","GE-13-500","GE-14-140","GE-15-170","GE-16-40","GE-17-81",
  "GE-18-100","GE-19-81","GE-20-54","GE-21-54","GE-22-54","GE-23-54","GE-24-54",
  "GE-25-60","GE-26-75","GE-27-180","GE-28-81","GE-29-85","GE-30-105","GE-31-105",
  "GE-32-115","GE-33-115","GE-34-115","GE-35-150","GE-36-150","GE-37-180","GE-38-180",
  "GE-39-180","GE-40-180","GE-41-220","GE-42-450","GE-43-450","GE-44-260","GE-45-40",
  "GE-46-25","GE-47-115","GE-48-15","GE-49-55","GE-50-55","GE-51-550","GE-52-212",
  "GE-53-140","GE-54-55","GE-55-55","GE-56-55","GE-57-55","GE-58-81","GE-59-180",
  "GE-60-180","GE-61-230","GE-62-81","GE-63-40","GE-64-55","GE-65-230","GE-66-80",
  "GE-67-100","GE-68-50","GE-69-260","GE-70-40","GE-71-81","GE-72-140","GE-73-260",
  "GE-74-375","GE-75-25","GE-76-81","GE-77-140","GE-78-81","GE-79-81","GE-80-81",
  "GE-81-50","GE-82-100","GE-83-140","GE-84-81","GE-85-140","GE-86-81","GE-87-81",
  "GE-88-55","GE-89-55","GE-90-20","GE-91-70","GE-92-80","GE-93-85","GE-94-200",
  "GE-95-460","GE-96-27","GE-97-33","GE-98-250","GE-99-36","GE-100-125","GE-101-12",
  "GE-102-55","GE-103-150","GE-104-65","GE-105-45","GE-106-500","GE-107-230",
  "GE-108-125","GE-109-25","GE-110-80","GE-111-125","GE-112-125","GE-113-360",
  "GE-114-360","MTS-01-300","MTS-02-300","TL-01-4000"
];

const CSV_URL = 'dados.csv';

let contDisponivel = 0;
let contManutencao = 0;
let contLocado = 0;
let filtroStatus = 'total';
let filtroKva = 'todos';

// Extrai a potência do nome do equipamento (ex: GE-64-55 => 55)
function extrairKva(nome) {
  const partes = nome.split('-');
  const kva = parseInt(partes[partes.length - 1]);
  return isNaN(kva) ? 0 : kva;
}

// Verifica se a potência se encaixa na faixa selecionada
function dentroFaixaKva(kva, faixa) {
  if (faixa === 'todos')   return true;
  if (faixa === '10-39')   return kva >= 10  && kva <= 39;
  if (faixa === '40-65')   return kva >= 40  && kva <= 65;
  if (faixa === '70-90')   return kva >= 70  && kva <= 90;
  if (faixa === '100-130') return kva >= 100 && kva <= 130;
  if (faixa === '140-180') return kva >= 140 && kva <= 180;
  if (faixa === '200plus') return kva >= 200;
  return true;
}

function parseCSV(text) {
  const linhas = text.trim().split('\n');
  const cabecalho = linhas[0].split(',').map(h => h.trim().toLowerCase());
  const dados = [];
  for (let i = 1; i < linhas.length; i++) {
    const colunas = linhas[i].split(',').map(c => c.trim());
    const obj = {};
    cabecalho.forEach((col, idx) => { obj[col] = colunas[idx] || ''; });
    dados.push(obj);
  }
  return dados;
}

function interpretarLocal(localBruto) {
  if (!localBruto) return { status: 'locado', cliente: '' };
  const texto = localBruto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (texto.includes('pesada')) return { status: 'manutencao_pesada', cliente: '' };
  if (texto.includes('manutencao') || texto.includes('oficina')) return { status: 'manutencao_leve', cliente: '' };
  return { status: 'locado', cliente: localBruto };
}

function mapStatus(status) {
  switch (status) {
    case 'locado':            return { classe: 'status-locado',            texto: 'Locado' };
    case 'manutencao_leve':   return { classe: 'status-manutencao_leve',   texto: 'Manutenção Leve' };
    case 'manutencao_pesada': return { classe: 'status-manutencao_pesada', texto: 'Manutenção Pesada' };
    default:                  return { classe: 'status-disponivel',         texto: 'Disponível' };
  }
}

function corSemaforo(taxa) {
  if (taxa <= 40) return 'ocupacao-vermelho';
  if (taxa <= 70) return 'ocupacao-amarelo';
  return 'ocupacao-verde';
}

function aplicarFiltros() {
  document.querySelectorAll('.card[data-status]').forEach(card => {
    const status = card.getAttribute('data-status');
    const kva    = parseInt(card.getAttribute('data-kva'));

    const passaStatus =
      filtroStatus === 'total' ||
      (filtroStatus === 'manutencao' && (status === 'manutencao_leve' || status === 'manutencao_pesada')) ||
      status === filtroStatus;

    const passaKva = dentroFaixaKva(kva, filtroKva);

    card.classList.toggle('card-oculto', !(passaStatus && passaKva));
  });
}

function aplicarFiltroStatus(filtro) {
  if (filtroStatus === filtro && filtro !== 'total') filtro = 'total';
  filtroStatus = filtro;

  document.querySelectorAll('.btn-filtro').forEach(btn => {
    btn.classList.remove('ativo-total','ativo-disponivel','ativo-manutencao','ativo-locado');
  });
  document.getElementById('btn-' + filtro).classList.add('ativo-' + filtro);

  aplicarFiltros();
}

function aplicarFiltroKva(faixa, btn) {
  filtroKva = faixa;
  document.querySelectorAll('.btn-kva').forEach(b => b.classList.remove('ativo'));
  btn.classList.add('ativo');
  aplicarFiltros();
}

fetch(CSV_URL + '?v=' + Date.now(), { cache: 'no-store' })
  .then(res => {
    const lastMod = res.headers.get('Last-Modified');
    const dataDisplay = lastMod
      ? new Date(lastMod).toLocaleString('pt-BR')
      : new Date().toLocaleString('pt-BR');
    document.getElementById('info-atualizacao').textContent = 'Dados atualizados em: ' + dataDisplay;
    return res.text();
  })
  .then(text => {
    const linhas = parseCSV(text);
    const mapa = {};

    linhas.forEach(linha => {
      const eq = (linha['equipamento'] || '').trim();
      const local = (linha['local'] || '').trim();
      if (!eq || !TODOS_EQUIPAMENTOS.includes(eq)) return;
      mapa[eq] = interpretarLocal(local);
    });

    const painel = document.getElementById('painel');

    TODOS_EQUIPAMENTOS.forEach(eq => {
      const info = mapa[eq] || { status: 'disponivel', cliente: '' };
      const { classe, texto } = mapStatus(info.status);
      const kva = extrairKva(eq);

      if (info.status === 'disponivel') contDisponivel++;
      else if (info.status === 'locado') contLocado++;
      else contManutencao++;

      const card = document.createElement('div');
      card.className = `card ${classe}`;
      card.setAttribute('data-status', info.status);
      card.setAttribute('data-kva', kva);
      card.innerHTML = `
        <div class="card-titulo">${eq}</div>
        <div class="status-linha ${classe}">
          <div class="led"></div>
          <span>${texto}</span>
        </div>
        ${info.cliente ? `<div class="cliente">Cliente: ${info.cliente}</div>` : ''}
      `;
      painel.appendChild(card);
    });

    const total = contDisponivel + contManutencao + contLocado;
    const taxaOcupacao = total > 0 ? (contLocado / total * 100) : 0;

    document.getElementById('cont-disponivel').textContent = contDisponivel;
    document.getElementById('cont-manutencao').textContent = contManutencao;
    document.getElementById('cont-locado').textContent = contLocado;
    document.getElementById('cont-total').textContent = total;

    const valorEl = document.getElementById('taxa-ocupacao');
    valorEl.textContent = taxaOcupacao.toFixed(1) + '%';
    valorEl.className = 'ocupacao-valor ' + corSemaforo(taxaOcupacao);

    // Ativa botão Total por padrão
    document.getElementById('btn-total').classList.add('ativo-total');
  });
