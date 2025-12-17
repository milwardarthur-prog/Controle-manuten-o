// 1. Lista fixa de todos os equipamentos que você quer controlar
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

const CSV_URL = 'dados.csv';

// Lê o CSV simples (espera cabeçalho: equipamento;local)
function parseCSV(text) {
  const linhas = text.trim().split('\n');
  const cabecalho = linhas[0].split(';').map(h => h.trim().toLowerCase());
  // Se o CSV usar vírgula:
  // const cabecalho = linhas[0].split(',').map(h => h.trim().toLowerCase());

  const dados = [];

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;

    const colunas = linha.split(';').map(c => c.trim());
    // Se o CSV usar vírgula:
    // const colunas = linha.split(',').map(c => c.trim());

    const obj = {};
    cabecalho.forEach((col, idx) => {
      obj[col] = colunas[idx] || '';
    });

    dados.push(obj);
  }

  return dados;
}

// Converte o campo "local" em { status, cliente }
function interpretarLocal(localBruto) {
  if (!localBruto) {
    // Se veio na planilha mas sem local, considera locado sem cliente definido
    return { status: 'locado', cliente: '' };
  }

  const texto = localBruto.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // remove acentos

  // Regras de exemplo — ajuste depois para o seu padrão real

  // Manutenção pesada
  if (texto.includes('pesada')) {
    return { status: 'manutencao_pesada', cliente: '' };
  }

  // Manutenção leve / oficina
  if (
    texto.includes('oficina') ||
    texto.includes('manutencao') ||
    texto.includes('manutencao leve') ||
    texto.includes('manut ') // genérico
  ) {
    return { status: 'manutencao_leve', cliente: '' };
  }

  // Se não se encaixa em manutenção, considera LOCADO
  // e usa o texto do local como nome do cliente/obra
  return { status: 'locado', cliente: localBruto };
}

// Mapeia status -> classe CSS + texto
function mapStatus(statusBruto) {
  if (!statusBruto) {
    return { classe: 'status-disponivel', texto: 'Disponível' };
  }

  const s = statusBruto.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  switch (s) {
    case 'locado':
      return { classe: 'status-locado', texto: 'Locado' };
    case 'disponivel':
      return { classe: 'status-disponivel', texto: 'Disponível' };
    case 'manutencao_leve':
      return { classe: 'status-manutencao_leve', texto: 'Manutenção leve' };
    case 'manutencao_pesada':
      return { classe: 'status-manutencao_pesada', texto: 'Manutenção pesada' };
    default:
      return { classe: 'status-disponivel', texto: statusBruto || 'Disponível' };
  }
}

function criarCard(equipamento, status, cliente) {
  const painel = document.getElementById('painel');
  const { classe, texto } = mapStatus(status);

  const card = document.createElement('div');
  card.className = `card ${classe}`;

  const titulo = document.createElement('div');
  titulo.className = 'card-titulo';
  titulo.textContent = equipamento;

  const statusLinha = document.createElement('div');
  statusLinha.className = `status-linha ${classe}`;

  const led = document.createElement('div');
  led.className = 'led';

  const statusTexto = document.createElement('span');
  statusTexto.className = 'status-texto';
  statusTexto.textContent = texto;

  statusLinha.appendChild(led);
  statusLinha.appendChild(statusTexto);

  card.appendChild(titulo);
  card.appendChild(statusLinha);

  if (cliente && cliente.trim() !== '') {
    const clienteDiv = document.createElement('div');
    clienteDiv.className = 'cliente';
    clienteDiv.textContent = `Cliente: ${cliente}`;
    card.appendChild(clienteDiv);
  }

  painel.appendChild(card);
}

// Carrega o CSV, filtra pelos equipamentos de interesse e monta o painel
fetch(CSV_URL)
  .then(res => {
    if (!res.ok) {
      throw new Error('Não foi possível carregar o arquivo dados.csv');
    }
    return res.text();
  })
  .then(text => {
    const linhas = parseCSV(text);

    // Mapa com apenas os equipamentos que você quer controlar
    const mapa = {};

    linhas.forEach(linha => {
      // alguns relatórios usam "equipamento" ou "nome", tentamos os dois
      const eq = (linha['equipamento'] || linha['nome'] || '').trim();
      const local = (linha['local'] || '').trim();

      if (!eq) return;

      // Só considera se estiver na lista fixa
      if (!TODOS_EQUIPAMENTOS.includes(eq)) return;

      const { status, cliente } = interpretarLocal(local);
      mapa[eq] = { status, cliente };
    });

    // Para cada equipamento da lista fixa, cria o card
    TODOS_EQUIPAMENTOS.forEach(eq => {
      const info = mapa[eq];

      if (!info) {
        // Não veio na planilha => disponível
        criarCard(eq, 'disponivel', '');
      } else {
        criarCard(eq, info.status, info.cliente);
      }
    });
  })
  .catch(err => {
    console.error(err);
    const painel = document.getElementById('painel');
    painel.innerHTML = '<p>Erro ao carregar dados. Verifique o arquivo dados.csv.</p>';
  });