let siteData = {};
let selectedTag = "TODAS";
let searchQuery = "";
let isNewestFirst = true; // Inicia mostrando os mais recentes primeiro

const tagColorPalette = {
    "TECNOLOGIA": "#DCA855",
    "CARREIRA": "#8ECAE6",
    "CLOUD": "#D8B4E2",
    "DEVOPS": "#B7E4C7",
    "IA & ML": "#FFB5A7",
    "INOVAÇÃO": "#DCA855",
    "FRONTEND": "#E2ECE9",
    "UI/UX": "#8ECAE6",
    "SEGURANÇA": "#FFE6A7",
    "REMOTO": "#D8B4E2",
    "ARQUITETURA": "#D8B4E2",
    "DEVSECOPS": "#B7E4C7",
    "PESQUISA": "#FFB5A7",
    "DESIGN": "#E2ECE9",
    "GLOBAL": "#8ECAE6"
};

document.addEventListener('DOMContentLoaded', async () => {
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    
    try {
        const response = await fetch('config.json');
        if (!response.ok) throw new Error('Falha ao carregar config.json');
        siteData = await response.json();
        
        initApp();
    } catch (error) {
        console.error("Erro na inicialização:", error);
        const grid = document.getElementById('grid-eventos');
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 2rem; border: 2px solid black; background: #fff; border-radius: 12px; box-shadow: 4px 4px 0 #000;">
                    <h3 style="font-family: 'Archivo Black', sans-serif;">Erro ao carregar dados</h3>
                    <p style="font-family: monospace; margin-top: 10px;">Verifique se você está rodando o projeto através de um servidor local (Live Server) e se o arquivo config.json existe.</p>
                </div>
            `;
        }
    }

    // Monitoramento da barra de busca
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderCards();
        });
    }

    // Monitoramento do botão de ordenação
    const sortBtn = document.getElementById('sort-btn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            isNewestFirst = !isNewestFirst;
            
            if (isNewestFirst) {
                sortBtn.textContent = "↑ RECENTES";
                sortBtn.style.background = "#000000";
                sortBtn.style.color = "#FFFFFF";
            } else {
                sortBtn.textContent = "↓ TODOS";
                sortBtn.style.background = "#FFFFFF";
                sortBtn.style.color = "#000000";
            }
            
            renderCards();
        });
    }
});

function initApp() {
    const meta = siteData.site_metadata || {};
    
    if (meta.titulo_pagina) {
        document.title = meta.titulo_pagina;
        const pageTitleEl = document.getElementById('page-title');
        if (pageTitleEl) pageTitleEl.textContent = meta.titulo_pagina;
    }
    if (meta.hero_titulo) {
        const heroTitleEl = document.getElementById('hero-title');
        if (heroTitleEl) heroTitleEl.textContent = meta.hero_titulo;
    }
    if (meta.subtitulo) {
        const subtitleEl = document.getElementById('page-subtitle');
        if (subtitleEl) subtitleEl.textContent = meta.subtitulo;
    }
    if (meta.semestre) {
        const periodoEl = document.getElementById('header-periodo');
        if (periodoEl) periodoEl.textContent = meta.semestre;
    }
    if (meta.instituicao) {
        const instEl = document.getElementById('header-instituicao');
        if (instEl) instEl.textContent = meta.instituicao;
    }
    if (meta.local) {
        const localEl = document.getElementById('hero-local');
        if (localEl) localEl.textContent = '📍 ' + meta.local;
    }

    renderTagFilters();
    renderCards();
}

function renderTagFilters() {
    const container = document.getElementById('tags-container');
    if (!container) return;

    const tagSet = new Set();
    
    (siteData.palestras || []).forEach(p => {
        (p.tags || []).forEach(t => tagSet.add(t.toUpperCase().trim()));
    });
    
    const uniqueTags = ["TODAS", ...Array.from(tagSet).sort()];
    container.innerHTML = "";
    
    uniqueTags.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = `tag-filter-btn ${selectedTag === tag ? 'active' : ''}`;
        btn.textContent = tag;
        btn.onclick = () => {
            selectedTag = tag;
            renderTagFilters();
            renderCards();
        };
        container.appendChild(btn);
    });
}

function renderCards() {
    const grid = document.getElementById('grid-eventos');
    if (!grid) return;
    
    grid.innerHTML = "";
    
    const palestras = siteData.palestras || [];
    const query = searchQuery.trim().toLowerCase();
    
    // 1. Aplica Filtros (Tags e Busca)
    let filtradas = palestras.filter(p => {
        const matchTag = selectedTag === "TODAS" || (p.tags && p.tags.some(t => t.toUpperCase() === selectedTag));
        if (!matchTag) return false;
        
        if (!query) return true;
        const matchTitle = (p.titulo || '').toLowerCase().includes(query);
        const matchSpeaker = (p.palestrante && p.palestrante.nome ? p.palestrante.nome : '').toLowerCase().includes(query);
        return matchTitle || matchSpeaker;
    });

    // 2. Aplica Ordenação
    if (isNewestFirst) {
        // Ordem Decrescente (Maior ID para Menor ID = Mais recentes primeiro)
        filtradas.sort((a, b) => Number(b.id) - Number(a.id));
    } else {
        // Ordem Crescente (Menor ID para Maior ID = Todos)
        filtradas.sort((a, b) => Number(a.id) - Number(b.id));
    }

    // 3. Renderiza Estado Vazio
    if (filtradas.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; background:#fff; border:2px solid #000; border-radius:12px; padding:32px; text-align:center; box-shadow:4px 4px 0 #000;">
                <h3 style="font-family:'Archivo Black',sans-serif; text-transform:uppercase;">Nenhuma palestra encontrada</h3>
                <p style="font-size:12px; font-family:monospace; margin-top:8px; color:#555;">Nenhum evento corresponde à busca atual.</p>
            </div>
        `;
        return;
    }

    // 4. Monta os Cards
    filtradas.forEach(palestra => {
        const card = document.createElement('article');
        card.className = 'lecture-card';
        
        const tagsHtml = (palestra.tags || []).map(tag => {
            const cleanTag = tag.toUpperCase().trim();
            const color = tagColorPalette[cleanTag] || '#DCA855';
            return `<span class="tag-badge" style="background-color: ${color};">${cleanTag}</span>`;
        }).join('');

        // Tratamento de Links (Inscrição)
        const inscricaoUrl = (palestra.links && palestra.links.inscricao) ? palestra.links.inscricao.trim() : "";
        const inscricaoBtn = inscricaoUrl === "" 
            ? `<button disabled class="btn btn-primary btn-disabled" title="Inscrição encerrada">Inscrição</button>`
            : `<a href="${inscricaoUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Inscrição</a>`;

        // Tratamento de Links (Material)
        const materialUrl = (palestra.links && palestra.links.material) ? palestra.links.material.trim() : "";
        const materialBtn = materialUrl === ""
            ? `<button disabled class="btn btn-secondary btn-disabled" title="Material não disponível">Material</button>`
            : `<a href="${materialUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Material</a>`;

        // Imagem de fallback
        const fotoUrl = (palestra.palestrante && palestra.palestrante.foto_url) ? palestra.palestrante.foto_url : "";
        const palestranteNome = (palestra.palestrante && palestra.palestrante.nome) ? palestra.palestrante.nome : "Convidado";

        card.innerHTML = `
            <div class="card-photo-wrapper">
                <img class="card-photo" src="${fotoUrl}" alt="${palestranteNome}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80'" />
                <div class="card-number">Nº ${palestra.id}</div>
                <div class="card-tags">${tagsHtml}</div>
            </div>
            <div class="card-info-section">
                <h3 class="card-title">${palestra.titulo}</h3>
                <div class="card-speaker">${palestranteNome}</div>
            </div>
            <div class="ticket-table">
                <div class="ticket-col">
                    <span class="ticket-label">Data</span>
                    <span class="ticket-value">${palestra.data}</span>
                </div>
                <div class="ticket-col" style="background:#FFFFFF;">
                    <span class="ticket-label">Dia</span>
                    <span class="ticket-value">${palestra.dia_semana}</span>
                </div>
                <div class="ticket-col">
                    <span class="ticket-label">Horário</span>
                    <span class="ticket-value">${palestra.horario}</span>
                </div>
            </div>
            <div class="card-actions">
                <div class="card-buttons-row">
                    ${inscricaoBtn}
                    ${materialBtn}
                </div>
                <div class="calendar-actions">
                    <button class="btn btn-calendar" onclick="downloadIcs('${palestra.id}')" title="Baixar arquivo de agenda">Salvar (.ics)</button>
                    <button class="btn btn-google-cal" onclick="addToGoogleCalendar('${palestra.id}')" title="Adicionar no Google Agenda">+ Google Agenda</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function getPalestraById(id) {
    return (siteData.palestras || []).find(p => String(p.id) === String(id));
}

window.downloadIcs = function(id) {
    const p = getPalestraById(id);
    if (!p) return;
    
    const title = "Palestra IFG: " + p.titulo;
    const speakerName = (p.palestrante && p.palestrante.nome) ? p.palestrante.nome : "Convidado";
    const description = `Palestrante: ${speakerName} | Horário: ${p.horario || "19:00"} | Disciplina de Gestão de Carreira em TI - IFG`;
    const location = p.local || "Auditório Demartin Bizerra - IFG Câmpus Goiânia";
    
    const icsLines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//IFG//BSI Palestras 2026//PT",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        "SUMMARY:" + title.replace(/\n/g, " "),
        "DESCRIPTION:" + description.replace(/\n/g, " "),
        "LOCATION:" + location,
        "STATUS:CONFIRMED",
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsLines], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `palestra-ifg-${p.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

window.addToGoogleCalendar = function(id) {
    const p = getPalestraById(id);
    if (!p) return;
    
    const title = encodeURIComponent("Palestra IFG: " + p.titulo);
    const speakerName = (p.palestrante && p.palestrante.nome) ? p.palestrante.nome : "Convidado";
    const details = encodeURIComponent(`Palestrante: ${speakerName} | Horário: ${p.horario || "19:00"} | IFG Sistemas de Informação`);
    const location = encodeURIComponent(p.local || "Auditório Demartin Bizerra - IFG Câmpus Goiânia");
    
    const meses = {
        "JAN":"01", "FEV":"02", "MAR":"03", "ABR":"04", "MAI":"05", "JUN":"06",
        "JUL":"07", "AGO":"08", "SET":"09", "OUT":"10", "NOV":"11", "DEZ":"12"
    };
    
    let startParam = "20261120T190000";
    let endParam = "20261120T210000";
    
    if (p.data) {
        const parts = p.data.trim().split(" ");
        if (parts.length >= 2) {
            const dia = parts[0].padStart(2, "0");
            const mesStr = parts[1].toUpperCase();
            const mes = meses[mesStr] || "11";
            const ano = mesStr === "JAN" ? "2027" : "2026";
            const horaLimpa = (p.horario || "19:00").replace(":", "").padStart(4, "0");
            
            startParam = `${ano}${mes}${dia}T${horaLimpa}00`;
            
            // Calcula fim (estimativa de 2h de duração)
            const horaFimNum = (parseInt(horaLimpa.substring(0, 2), 10) + 2).toString().padStart(2, "0");
            endParam = `${ano}${mes}${dia}T${horaFimNum}${horaLimpa.substring(2, 4)}00`;
        }
    }
    
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startParam}/${endParam}`;
    window.open(googleUrl, "_blank", "noopener,noreferrer");
};
