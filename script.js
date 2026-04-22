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

const CATEGORIAS = [
  { nome: "Geradores 10kVA a 30kVA", min: 10, max: 30 },
  { nome: "Geradores 40kVA a 65kVA", min: 40, max: 65 },
  { nome: "Geradores 70kVA a 90kVA", min: 70, max: 90 },
  { nome: "Geradores 100kVA a 130kVA", min: 100, max: 130 },
  { nome: "Geradores 140kVA a 160kVA", min: 140, max: 160 },
  { nome: "Geradores 170kVA a 190kVA", min: 170, max: 190 },
  { nome: "Geradores 200kVA a 290kVA", min: 200, max: 290 },
  { nome: "Geradores 300kVA a 600kVA", min: 300, max: 600 },
  { nome: "Outros Equipamentos", especial: true }
];

const CSV_URL = 'dados.csv';
let contDisponivel = 0, contManutencao = 0, contLocado = 0;

function parseCSV(text) {
  const linhas = text.trim().split('\n');
  const cabecalho = linhas[0].split(',').map(h => h.trim().toLowerCase());
  return linhas.slice(1).map(linha => {
    const colunas = linha.split(',').map(c => c.trim());
    const obj = {};
    cabecalho.forEach((col, idx) => obj[col] = colunas[idx] || '');
    return obj;
  });
}

function identificarCategoria(eq) {
  if (eq.startsWith("MTS") || eq.startsWith("TL")) return "Outros Equipamentos";
  const partes = eq.split('-');
  const kva = parseInt(partes[partes.length - 1]);
  const catFound = CATEGORIAS.find(c => !c.especial && kva >= c.min && kva <= c.max);
  return catFound ? catFound.nome : "Outros Equipamentos";
}

function interpretarLocal(localBruto) {
  if (!localBruto) return { status: 'locado', cliente: '' };
  const texto = localBruto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (texto.includes('pesada')) return { status: 'manutencao_pesada', cliente: '' };
  if (texto.includes('manutencao') || texto.includes('leve')) return { status: 'manutencao_leve', cliente: '' };
  return { status: 'locado', cliente: localBruto };
}

function criarCard(eq, info) {
  const { classe, texto } = mapStatus(info.status);
  const partes = eq.split('-');
  const kvaText = partes.length >= 3 ? partes[partes.length - 1] + ' kVA' : '';

  if (info.status === 'disponivel') contDisponivel++;
  else if (info.status === 'locado') contLocado++;
  else contManutencao++;

  const div = document.createElement('div');
  div.className = `card status-${info.status}`;
  div.innerHTML = `
    <div class="card-titulo">${eq}</div>
    <div class="card-kva">${kvaText}</div>
    <div class="status-linha ${classe}">
      <div class="led"></div>
      <span class="status-texto">${texto}</span>
    </div>
    ${info.cliente ? `<div class="cliente">Cliente: ${info.cliente}</div>` : ''}
  `;
  return div;
}

function mapStatus(s) {
  if (s === 'locado') return { classe: 'status-locado', texto: 'Locado' };
  if (s === 'manutencao_leve') return { classe: 'status-manutencao_leve', texto: 'Manutenção Leve' };
  if (s === 'manutencao_pesada') return { classe: 'status-manutencao_pesada', texto: 'Manutenção Pesada' };
  return { classe: 'status-disponivel', texto: 'Disponível' };
}

function filtrar(tipo, elemento) {
  document.querySelectorAll('.resumo-card').forEach(r => r.classList.remove('ativo'));
  elemento.classList.add('ativo');

  document.querySelectorAll('.card').forEach(card => {
    if (tipo === 'todos') card.style.display = '';
    else if (tipo === 'manutencao') {
      const isM = card.classList.contains('status-manutencao_leve') || card.classList.contains('status-manutencao_pesada');
      card.style.display = isM ? '' : 'none';
    } else {
      card.style.display = card.classList.contains(`status-${tipo}`) ? '' : 'none';
    }
  });

  // Esconde títulos de categorias vazias após o filtro
  document.querySelectorAll('.categoria-secao').forEach(secao => {
    const temCardVisivel = Array.from(secao.querySelectorAll('.card')).some(c => c.style.display !== 'none');
    secao.style.display = temCardVisivel ? '' : 'none';
  });
}

fetch(CSV_URL).then(res => res.text()).then(text => {
  const dados = parseCSV(text);
  const mapa = {};
  dados.forEach(d => {
    const eq = d.equipamento;
    if (eq && TODOS_EQUIPAMENTOS.includes(eq)) mapa[eq] = interpretarLocal(d.local);
  });

  const container = document.getElementById('categorias-container');
  
  CATEGORIAS.forEach(cat => {
    const secao = document.createElement('div');
    secao.className = 'categoria-secao';
    secao.innerHTML = `<div class="categoria-titulo">${cat.nome}</div><div class="painel" id="painel-${cat.nome.replace(/\s+/g, '')}"></div>`;
    container.appendChild(secao);

    const painel = secao.querySelector('.painel');
    TODOS_EQUIPAMENTOS.forEach(eq => {
      if (identificarCategoria(eq) === cat.nome) {
        const info = mapa[eq] || { status: 'disponivel', cliente: '' };
        painel.appendChild(criarCard(eq, info));
      }
    });

    if (painel.children.length === 0) secao.remove();
  });

  document.getElementById('cont-disponivel').textContent = contDisponivel;
  document.getElementById('cont-manutencao').textContent = contManutencao;
  document.getElementById('cont-locado').textContent = contLocado;
  document.getElementById('cont-total').textContent = contDisponivel + contManutencao + contLocado;
});