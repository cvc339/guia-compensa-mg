document.addEventListener('DOMContentLoaded', async () => {
    const tipoSelect = document.getElementById('tipo-compensacao');
    const modalidadesList = document.getElementById('lista-modalidades');
    const detalhesDiv = document.getElementById('detalhes-modalidade');
    const normasDiv = document.getElementById('normas-relacionadas');

    if (!tipoSelect) {
        console.error("ERRO CRÍTICO: Elemento 'tipo-compensacao' não encontrado no HTML.");
        return;
    }

    const API_URL = 'http://localhost:3000/api/v2';
    let tipos = [], modalidades = [], normas = [];

    const fetchData = async (endpoint) => {
        try {
            const response = await fetch(`${API_URL}/${endpoint}`);
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            return (await response.json()).data;
        } catch (error) {
            console.error(`Falha ao buscar ${endpoint}:`, error);
            modalidadesList.innerHTML = `<li>Erro ao carregar dados. Verifique o console.</li>`;
            return [];
        }
    };

    const loadInitialData = async () => {
        [tipos, modalidades, normas] = await Promise.all([fetchData('tipos'), fetchData('modalidades'), fetchData('normas')]);
        tipoSelect.innerHTML = '<option value="">-- Selecione um Tipo --</option>';
        tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id;
            option.textContent = tipo.nome;
            tipoSelect.appendChild(option);
        });
    };

    const displayModalidades = (tipoId) => {
        modalidadesList.innerHTML = '';
        detalhesDiv.style.display = 'none';
        
        // ALTERAÇÃO 1: A linha que escondia as normas foi removida daqui
        // A linha 'normasDiv.style.display = 'none';' foi apagada.

        const filteredModalidades = modalidades.filter(m => m.tipo_id == tipoId);
        if (filteredModalidades.length === 0) {
            if (tipoId) modalidadesList.innerHTML = '<li>Nenhuma modalidade encontrada para este tipo.</li>';
        } else {
            filteredModalidades.forEach(modalidade => {
                const li = document.createElement('li');
                li.textContent = modalidade.nome;
                li.dataset.id = modalidade.id;
                li.addEventListener('click', () => {
                    document.querySelectorAll('#lista-modalidades li').forEach(item => item.classList.remove('active'));
                    li.classList.add('active');
                    displayDetalhes(modalidade.id);
                });
                modalidadesList.appendChild(li);
            });
        }

        // ==========================================================================================
        // ALTERAÇÃO 2: LÓGICA PARA EXIBIR NORMAS DO TIPO FOI ADICIONADA AQUI
        // ==========================================================================================
        // Se nenhum tipo for selecionado (ex: "-- Selecione --"), esconde as normas e para a função.
        if (!tipoId) {
            normasDiv.style.display = 'none';
            return;
        }

        const tipo = tipos.find(t => t.id == tipoId);
        if (!tipo) return; // Segurança extra

        const normasIds = tipo.norma_ids ? tipo.norma_ids.split(',').map(id => id.trim()) : [];
        const normasRelacionadas = normas.filter(n => normasIds.includes(n.id.toString()));
        const normasListUl = normasDiv.querySelector('ul');
        normasListUl.innerHTML = '';
        
        if (normasRelacionadas.length > 0) {
            normasRelacionadas.forEach(norma => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = norma.link;
                a.textContent = norma.nome;
                a.target = '_blank';
                li.appendChild(a);
                normasListUl.appendChild(li);
            });
            normasDiv.style.display = 'block';
        } else {
            normasDiv.style.display = 'none';
        }
        // ==========================================================================================
        // FIM DA ALTERAÇÃO 2
        // ==========================================================================================
    };

    const displayDetalhes = (modalidadeId) => {
        const modalidade = modalidades.find(m => m.id == modalidadeId);
        // A lógica de normas em displayDetalhes continua aqui.
        // Embora redundante, ela garante que as normas corretas sejam mostradas
        // caso a lógica mude no futuro. Não causa nenhum problema.
        const tipo = tipos.find(t => t.id == modalidade.tipo_id);
        if (!modalidade || !tipo) return;

        let detalhesHtml = `<h3>${modalidade.nome}</h3>`;
        const campos = { 'Proporção': modalidade.proporcao, 'Forma': modalidade.forma, 'Especificidades da Área': modalidade.especificidades, 'Vantagens': modalidade.vantagens, 'Desvantagens': modalidade.desvantagens, 'Documentos Necessários': modalidade.documentos, 'Observações': modalidade.observacao };
        for (const [chave, valor] of Object.entries(campos)) {
            if (valor && valor.trim() !== '') detalhesHtml += `<strong>${chave}:</strong><p>${valor.replace(/\n/g, '<br>')}</p>`;
        }
        detalhesDiv.innerHTML = detalhesHtml;
        detalhesDiv.style.display = 'block';

        const normasIds = tipo.norma_ids ? tipo.norma_ids.split(',').map(id => id.trim()) : [];
        const normasRelacionadas = normas.filter(n => normasIds.includes(n.id.toString()));
        const normasListUl = normasDiv.querySelector('ul');
        normasListUl.innerHTML = '';
        if (normasRelacionadas.length > 0) {
            normasRelacionadas.forEach(norma => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = norma.link;
                a.textContent = norma.nome;
                a.target = '_blank';
                li.appendChild(a);
                normasListUl.appendChild(li);
            });
            normasDiv.style.display = 'block';
        } else {
            normasDiv.style.display = 'none';
        }
    };

    tipoSelect.addEventListener('change', () => displayModalidades(tipoSelect.value));
    
    await loadInitialData();
});
