const TODOS_EQUIPAMENTOS = [
  "GE-02-50","GE-03-40","GE-04-55","GE-05-55","GE-06-115","GE-09-170","GE-10-25",
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

const FAIXAS_KVA = [
  { id: '10-39',   min: 10,  max: 39  },
  { id: '40-65',   min: 40,  max: 65  },
  { id: '70-90',   min: 70,  max: 90  },
  { id: '100-130', min: 100, max: 130 },
  { id: '140-160', min: 140, max: 160 },
  { id: '170-190', min: 170, max: 190 },
  { id: '200-290', min: 200, max: 290 },
  { id: '300-600', min: 300, max: 600 },
];

const CSV_URL = 'dados.csv';
let contDisponivel = 0, contManutencao = 0, contLocado = 0;
let filtroStatusAtivo = 'todos';
let filtroKvaAtivo = 'todos';

function getKva(eq) {
  const partes = eq.split('-');
  return parseInt(partes[partes.length - 1]);
}

function getFaixaId(eq) {
  if (eq.startsWith('MTS') || eq.startsWith('TL')) return 'outros';
  const kva = getKva(eq);
  const faixa = FAIXAS_KVA.find(f => kva >= f.min && kva <= f.max);
  return faixa ? faixa.id : 'outros';
}

function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, '').trim();
  const linhas = clean.split(/\r?\n/).filter(l => l.trim() !== '');
  if (linhas.length === 0) return [];
  return linhas.slice(1).map(linha => {
    const idx = linha.indexOf(',');
    if (idx === -1) return { equipamento: linha.trim(), local: '' };
    return {
      equipamento: linha.substring(0, idx).trim(),
      local: linha.substring(idx + 1).trim()
    };
  });
}

// Compara prazo (dd/mm) com hoje
// Retorna: 'vencido', 'hoje' ou 'ok'
function classificarPrazo(prazoStr) {
  if (!prazoStr) return 'ok';

  const partes = prazoStr.trim().split('/');
  if (partes.length < 2) return 'ok';

  const hoje = new Date();
  const dia  = parseInt(partes[0]);
  const mes  = parseInt(partes[1]) - 1; // mês base 0
  const ano  = partes[2] ? parseInt(partes[2]) : hoje.getFullYear();

  const dataPrazo = new Date(ano, mes, dia);
  const dataHoje  = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  if (dataPrazo < dataHoje) return 'vencido';
  if (dataPrazo.getTime() === dataHoje.getTime()) return 'hoje';
  return 'ok';
}

function interpretarLocal(localBruto) {
  if (!localBruto) return { status: 'disponivel', cliente: '', obs: '', prazo: '' };

  const original = localBruto.trim();
  const texto = original.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Extrai prazo se existir (formato: | Prazo: dd/mm ou | Prazo: dd/mm/aaaa)
  let prazo = '';
  let semPrazo = original;

  const prazoMatch = original.match(/\|\s*[Pp]razo\s*:\s*([\d]{1,2}\/[\d]{1,2}(?:\/[\d]{2,4})?)/);
  if (prazoMatch) {
    prazo = prazoMatch[1];
    semPrazo = original.substring(0, original.indexOf('|')).trim();
  }

  const textoSemPrazo = semPrazo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (textoSemPrazo.includes('pesada')) {
    const obs = semPrazo
      .replace(/[Mm]anutencao\s*[Pp]esada/ig, '')
      .replace(/[Mm]anutenção\s*[Pp]esada/ig, '')
      .replace(/^[\s\-–—]+/, '')
      .trim();
    return { status: 'manutencao_pesada', cliente: '', obs, prazo };
  }

  if (textoSemPrazo.includes('manutencao') || textoSemPrazo.includes('leve')) {
    const obs = semPrazo
      .replace(/[Mm]anutencao\s*[Ll]eve/ig, '')
      .replace(/[Mm]anutenção\s*[Ll]eve/ig, '')
      .replace(/[Mm]anutencao/ig, '')
      .replace(/[Mm]anutenção/ig, '')
      .replace(/[Ll]eve/ig, '')
      .replace(/^[\s\-–—]+/, '')
      .trim();
    return { status: 'manutencao_leve', cliente: '', obs, prazo };
  }

  return { status: 'locado', cliente: original, obs: '', prazo: '' };
}

function mapStatus(s) {
  if (s === 'locado')            return { classe: 'status-locado',            texto: 'Locado' };
  if (s === 'manutencao_leve')   return { classe: 'status-manutencao_leve',   texto: 'Manutenção Leve' };
  if (s === 'manutencao_pesada') return { classe: 'status-manutencao_pesada', texto: 'Manutenção Pesada' };
  return { classe: 'status-disponivel', texto: 'Disponível' };
}

function aplicarFiltros() {
  document.querySelectorAll('.card').forEach(card => {
    const statusOk = filtroStatusAtivo === 'todos'
      || (filtroStatusAtivo === 'manutencao'
          ? card.classList.contains('status-manutencao_leve') || card.classList.contains('status-manutencao_pesada')
          : card.classList.contains(`status-${filtroStatusAtivo}`));
    const kvaOk = filtroKvaAtivo === 'todos' || card.dataset.faixa === filtroKvaAtivo;
    card.style.display = (statusOk && kvaOk) ? '' : 'none';
  });
}

function filtrarStatus(tipo, elemento) {
  filtroStatusAtivo = tipo;
  document.querySelectorAll('.resumo-card').forEach(r => r.classList.remove('ativo'));
  elemento.classList.add('ativo');
  aplicarFiltros();
}

function filtrarKva(faixa, elemento) {
  filtroKvaAtivo = faixa;
  document.querySelectorAll('.btn-kva').forEach(b => b.classList.remove('ativo'));
  elemento.classList.add('ativo');
  aplicarFiltros();
}

fetch(CSV_URL + '?v=' + Date.now(), { cache: 'no-store' })
  .then(res => res.text())
  .then(text => {
    const dados = parseCSV(text);
    const mapa = {};
    dados.forEach(d => {
      const eq = (d.equipamento || '').trim();
      if (eq && TODOS_EQUIPAMENTOS.includes(eq)) mapa[eq] = interpretarLocal(d.local);
    });

    const painel = document.getElementById('painel');

    TODOS_EQUIPAMENTOS.forEach(eq => {
      const info = mapa[eq] || { status: 'disponivel', cliente: '', obs: '', prazo: '' };
      const { classe, texto } = mapStatus(info.status);
      const kva = getKva(eq);
      const faixaId = getFaixaId(eq);

      if (info.status === 'disponivel') contDisponivel++;
      else if (info.status === 'locado') contLocado++;
      else contManutencao++;

      // Classifica prazo para cor
      const statusPrazo = classificarPrazo(info.prazo);
      const classePrazo = statusPrazo === 'vencido' ? 'vencido'
                        : statusPrazo === 'hoje'    ? 'hoje'
                        : '';

      const card = document.createElement('div');
      card.className = `card ${classe}`;
      card.dataset.faixa = faixaId;

      card.innerHTML = `
        <div class="card-header">
          <div class="card-titulo">${eq}</div>
          ${info.prazo ? `<div class="prazo ${classePrazo}">⏱️ ${info.prazo}</div>` : ''}
        </div>
        <div class="card-kva">${isNaN(kva) ? '' : kva + ' kVA'}</div>
        <div class="status-linha ${classe}">
          <div class="led"></div>
          <span>${texto}</span>
        </div>
        ${info.cliente ? `<div class="cliente">Cliente: ${info.cliente}</div>` : ''}
        ${info.obs ? `<div class="obs">📋 ${info.obs}</div>` : ''}
      `;

      painel.appendChild(card);
    });

    document.getElementById('cont-disponivel').textContent = contDisponivel;
    document.getElementById('cont-manutencao').textContent = contManutencao;
    document.getElementById('cont-locado').textContent = contLocado;
    document.getElementById('cont-total').textContent = contDisponivel + contManutencao + contLocado;
  });
