// LISTA FIXA DE TODOS OS EQUIPAMENTOS
const TODOS_EQUIPAMENTOS = [
    "GE-02-50", "GE-03-40", "GE-06-115", "GE-07-06", "GE-10-25", "GE-11-75", "GE-13-500", "GE-15-170",
    "GE-16-40", "GE-18-100", "GE-19-81", "GE-20-54", "GE-22-54", "GE-23-54", "GE-24-54", "GE-25-60",
    "GE-26-75", "GE-30-105", "GE-31-105", "GE-32-115", "GE-33-115", "GE-34-115", "GE-35-150", "GE-36-150",
    "GE-37-180", "GE-41-220", "GE-42-450", "GE-44-260", "GE-45-40", "GE-46-25", "GE-47-115", "GE-48-15",
    "GE-50-55", "GE-51-550", "GE-52-212", "GE-53-140", "GE-57-55", "GE-59-180", "GE-60-180", "GE-61-230",
    "GE-63-40", "GE-64-55", "GE-66-80", "GE-68-50", "GE-70-40", "GE-72-140", "GE-73-260", "GE-74-375",
    "GE-75-25", "GE-80-81", "GE-81-50", "GE-83-140", "GE-84-81", "GE-85-140", "GE-89-55", "GE-90-20",
    "GE-91-70", "GE-92-80", "GE-95-460", "GE-96-27", "GE-97-33", "GE-99-36", "GE-100-125", "GE-102-55",
    "GE-103-150", "GE-104-65", "GE-106-500", "GE-108-125", "GE-110-80", "GE-113-360", "GE-114-360", "MTS-02-300"
];

async function carregarDados() {
    try {
        const response = await fetch('dados.csv');
        const data = await response.text();
        const linhas = data.split('\n').slice(1);
        
        const dadosAtuais = linhas
            .map(linha => {
                const [equipamento, local] = linha.split(',');
                return equipamento ? { equipamento: equipamento.trim(), local: local ? local.trim() : "" } : null;
            })
            .filter(item => item !== null);

        atualizarPainel(dadosAtuais);
    } catch (error) {
        console.error("Erro ao carregar CSV:", error);
    }
}

function obterClassePrazo(textoLocal) {
    if (!textoLocal.includes('| Prazo:')) return '';
    
    const partes = textoLocal.split('| Prazo:');
    const dataPrazoStr = partes[1].trim();
    const [dia, mes] = dataPrazoStr.split('/');
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataPrazo = new Date(hoje.getFullYear(), parseInt(mes) - 1, parseInt(dia));
    
    if (dataPrazo < hoje) return 'prazo-atrasado';
    if (dataPrazo.getTime() === hoje.getTime()) return 'prazo-hoje';
    return 'prazo-futuro';
}

function atualizarPainel(dadosAtuais) {
    const container = document.getElementById('equipamentos-container');
    const elementoTaxa = document.querySelector('.valor-taxa');
    container.innerHTML = '';

    // Cálculo da Taxa de Disponibilidade (Locados + Disponíveis) / Total
    const emManutencaoCount = dadosAtuais.filter(d => d.local.toUpperCase().includes('MANUTENCAO')).length;
    const totalReal = TODOS_EQUIPAMENTOS.length;
    const disponiveisSoma = totalReal - emManutencaoCount;
    
    const taxaDisponibilidade = (disponiveisSoma / totalReal) * 100;
    elementoTaxa.textContent = `${taxaDisponibilidade.toFixed(1)}%`;

    // Renderiza os cards
    TODOS_EQUIPAMENTOS.forEach(id => {
        const infoCsv = dadosAtuais.find(d => d.equipamento === id);
        const card = document.createElement('div');
        card.className = 'card';

        let statusClasse = 'disponivel';
        let localTexto = 'DISPONÍVEL NO PÁTIO';
        let prazoHtml = '';

        if (infoCsv) {
            if (infoCsv.local.toUpperCase().includes('MANUTENCAO')) {
                statusClasse = 'manutencao';
                localTexto = infoCsv.local;
                
                const classePrazo = obterClassePrazo(infoCsv.local);
                if (infoCsv.local.includes('| Prazo:')) {
                    const dataPrazo = infoCsv.local.split('| Prazo:')[1].trim();
                    prazoHtml = `<span class="prazo-card ${classePrazo}">${dataPrazo}</span>`;
                }
            } else {
                statusClasse = 'locado';
                localTexto = infoCsv.local;
            }
        }

        const partes = id.split('-');
        const kva = partes[2] || "";
        const modelo = partes[0];

        card.innerHTML = `
            ${prazoHtml}
            <div class="led led-${statusClasse}"></div>
            <div class="equip-id">${id}</div>
            <div class="equip-local">${localTexto}</div>
            <div class="equip-detalhes">
                ${modelo === 'GE' ? `<span class="badge-kva">${kva} KVA</span>` : ''}
                <span class="badge-status">${statusClasse.toUpperCase()}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

// Inicialização e atualização automática a cada 30 segundos
carregarDados();
setInterval(carregarDados, 30000);