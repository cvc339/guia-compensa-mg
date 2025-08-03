const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log("Iniciando a operação de Carga Total e Correta no banco de dados.");

// Função para escapar aspas simples para evitar erros de SQL
const escape = (text) => text ? text.replace(/'/g, "''") : '';

db.serialize(() => {
    // Apaga os dados antigos para evitar duplicação
    console.log("1. Limpando tabelas existentes para uma carga nova...");
    db.run("DELETE FROM modalidades;");
    db.run("DELETE FROM tipos_compensacao;");
    db.run("DELETE FROM normas;");

    // Recomeça a contagem dos IDs
    db.run("DELETE FROM sqlite_sequence WHERE name IN ('modalidades', 'tipos_compensacao', 'normas');");
    console.log("   Tabelas limpas com sucesso.");

    // ---- CARGA DAS NORMAS ----
    const normasData = [
        [1, 'Lei Federal nº 11.428/2006', 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11428.htm', 'Dispõe sobre a utilização e proteção da vegetação nativa do Bioma Mata Atlântica.'],
        [2, 'Decreto Federal nº 6.660/2008', 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2008/decreto/d6660.htm', 'Regulamenta dispositivos da Lei nº 11.428.'],
        [3, 'Portaria IEF nº 30/2015', `https://www.google.com/search?q=Portaria+IEF+nº+30,+de+03+de+fevereiro+de+2015`, 'Define procedimentos para a compensação florestal.'],
        [4, 'Decreto Estadual nº 47.749/2019', `https://www.google.com/search?q=Decreto+Estadual+nº+47.749,+de+11+de+novembro+de+2019`, 'Dispõe sobre o licenciamento ambiental e estabelece procedimentos para a compensação ambiental.'],
        [5, 'Resolução Conjunta Semad/IEF nº 3.102/2021', `https://www.google.com/search?q=Resolução+Conjunta+Semad/IEF+nº+3.102,+de+26+de+outubro+de+2021`, 'Estabelece diretrizes para a compensação por supressão de vegetação.'],
        [6, 'Resolução CONAMA nº 369/2006', 'https://www.google.com/search?q=Resolução+CONAMA+nº+369,+de+28+de+março+de+2006', 'Dispõe sobre os casos excepcionais de intervenção em APP.'],
        [7, 'Instrução de Serviço SISEMA nº 02/2017', 'https://www.google.com/search?q=Instrução+de+Serviço+SISEMA+nº+02/2017', 'Instrução sobre Tabela de valoração de custos.']
    ];
    
    console.log("2. Inserindo Normas...");
    const stmtNormas = db.prepare("INSERT INTO normas (id, nome, link, preambulo) VALUES (?, ?, ?, ?)");
    normasData.forEach(data => stmtNormas.run(data));
    stmtNormas.finalize();
    console.log("   Normas inseridas com sucesso.");

    // ---- CARGA DOS TIPOS DE COMPENSAÇÃO ----
    const tiposData = [
        [1, 'Minerária', '3,4,5,7'],
        [2, 'Mata Atlântica', '1,2,4,5'],
        [3, 'APP', '4,5,6'],
        [4, 'Ameaçadas', '5'],
        [5, 'Imunes (Pequi e Ipê)', ''],
        [6, 'SNUC', '4'],
        [7, 'Reserva Legal', '']
    ];
    
    console.log("3. Inserindo Tipos de Compensação...");
    const stmtTipos = db.prepare("INSERT INTO tipos_compensacao (id, nome, norma_ids) VALUES (?, ?, ?)");
    tiposData.forEach(data => stmtTipos.run(data));
    stmtTipos.finalize();
    console.log("   Tipos de compensação inseridos com sucesso.");

    // ---- CARGA DAS MODALIDADES (Extraído da sua tabela Excel) ----
    const modalidadesData = [
        [1, 'Doação', '01:01:00', 'Regularização fundiária no interior de Unidade de Conservação', 'Apenas estar inserido em Unidade de Conservação de Proteção Integral Federal, Estadual ou Municipal, localizada no Estado de Minas Gerais.', 'Pode ser em qualquer unidade de conservação do estado, independente da bacia hidrográfica. Procedimento mais simples, e a obrigação do empreendedor se encerra com a transferência da titularidade do imóvel para o estado.', 'Precisa ser em área pendente de regularização fundiária no interior de Unidade de Conservação', 'Lembrar que tanto (MONAs) e Refúgios da Vida Silvestre podem ser constituídos por áreas particulares, desde que seja possível compatibilizar os objetivos da unidade com a utilização da terra e dos recursos naturais do local pelos proprietários, ficando a critério do órgão aceitar ou nao', ''],
        [1, 'Implantação e/ou manutenção', 'A área é convertida em valor pecuniário, conforme Tabela da IS 02.', 'Implantação e manutenção de UC de proteção integral', 'Em Unidade de Conservação de Proteção Integral Federal, Estadual ou Municipal, localizada no Estado de Minas Gerais.a ser indicada pelo IEF e conforme Plano de Trabalho a ser estabelecido pelo órgão gestor da Unidade de Conservação.', 'Em relação à modalidade de regularização fundiária, a única vantagem pode ser da demora na efetivação do cumprimento da compensação', 'Tende a ser mais cara que a modalidade de regularização fundiária (Cálculo é muito complexo). Cabe ao empreendedor buscar orçamentos para efetivação da melhoria na UC Por se tratar de obrigação de fazer, o empreendedor fica dependente de um aceite do órgão ambiental para dar quitação ao compromisso, o que pode depender de análise subjetiva.', '', ''],
        [2, 'Doação', '02:01:00', 'Regularização fundiária no interior de Unidade de Conservação', 'Área pendente de regularização fundiária, inserida nos limites geográficos do bioma Mata Atlântica e possuir vegetação nativa característica do bioma Mata Atlântica, independente de possuir as mesmas características ecológicas e de seu estágio de regeneração. Estar localizada na mesma bacia hidrográfica de rio federal, no Estado de Minas Gerais e, sempre que possível, na mesma sub-bacia hidrográfica.', 'Não precisa de vistoria na área. Não precisa de acompanhamento de plantio. Análise mais rápida (praticamente só documentação). A obrigação do empreendedor se encerra com a transferência da titularidade do imóvel para o estado.', 'A proposta de compensação precisa ser aprovada previamente pela CPB. A área deve está inserida no interior de Unidade de Conservação pendente de regularização fundiária.', 'Lembrar que tanto (MONAs) e Refúgios da Vida Silvestre podem ser constituídos por áreas particulares, desde que seja possível compatibilizar os objetivos da unidade com a utilização da terra e dos recursos naturais do local pelos proprietários, ficando a critério do órgão aceitar ou nao', ''],
        [2, 'Preservação', '02:01:00', 'Servidão Perpétua', 'Com as mesmas características ecológicas, inserida nos limites geográficos do Bioma Mata Atlântica, na mesma bacia hidrográfica de rio federal, sempre que possível na mesma sub-bacia hidrográfica.', 'Não precisa passar pela aprovação da CPB. Não precisa estar inserida no interior de Unidade de Conservação', 'Comprovar a similaridade da área compensada com a área suprimida. A manutenção e segurança da área ficam sob responsabilidade da empresa.', '', ''],
        [2, 'Recuperação, quando não localizada em áreas que atendam os critérios para doação e preservação.', '02:01:00', 'Plantio com espécies nativas', 'Na mesma bacia hidrográfica de rio federal, sempre que possível na mesma sub-bacia hidrográfica.', 'Não precisa passar pela aprovação da CPB.', 'Produção de mudas, plantio, acompanhamento do plantio, replantio quando necessário. Precisa de vistoria e aprovação da área pelo órgão ambiental.', '', ''],
        [3, 'Recuperação de APP', '01:01:00', 'Plantio com espécies nativas', 'Mesma sub-bacia hidrográfica e, prioritariamente, na área de influência do empreendimento ou nas cabeceiras dos rios', 'Possibilidade de fazer no próprio imóvel, sem a necessidade de adquirir novos imóveis', 'Elaboração de projeto tecnico de reconstituição da flora com monitoramento e replantio das mudas se necessário.', '', ''],
        [3, 'Recuperação de área degradada', '01:01:00', 'Plantio com espécies nativas', 'área degradada no interior de Unidade de Conservação de domínio público Federal, Estadual ou Municipal, localizada no Estado', 'Possibilidade de usar áreas já adquiridas no interior de UC, degradadas, em que não é possível usar como compensação de MA', 'Responsabilidade sobre a área (invação de pessoas e animais, além de manutenção contra incêndios)', '', ''],
        [3, 'Doação', '01:01:00', 'Destinação ao Poder Público de área no interior de Unidade de Conservação de domínio público, pendente de regularização fundiária', 'Mesma bacia hidrográfica de rio federal, no Estado de Minas Gerais e, sempre que possível, na mesma sub-bacia hidrográfica.', 'Não precisa de vistoria na área. Não precisa de acompanhamento de plantio. Análise mais rápida (praticamente só documentação). A obrigação do empreendedor se encerra com a transferência da titularidade do imóvel para o estado.', 'A área deve está inserida no interior de Unidade de Conservação pendente de regularização fundiária. Atentar para propostas em MONA e Refúgio, pois são Ucs que aceitam áreas de terceiros.', '', ''],
        [3, 'Implantação ou revitalização de área verde urbana', '01:01:00', '', 'Prioritariamente na mesma sub-bacia hidrográfica, demonstrado o ganho ambiental no projeto de recuperação ou revitalização da área', 'A manutenção e segurança da área ficam a cargo da prefeitura?', 'Articulação com o poder público para indicarem áreas com interesse de revitalização ou implantação de áreas verder urbanas', '', ''],
        [4, 'Plantio', 'dez a vinte e cinco mudas da espécie suprimida para cada exemplar autorizado', 'Plantio de mudas da espécie suprimida em APP, em Reserva Legal ou em corredores de vegetação para estabelecer conectividade a outro fragmento', 'Áreas de APP, Reserva Legal, Corredores de vegetação para estabelecer conectividade com outros fragmentos de vegetação. A proposta de compensação deve ser apresentada em termo de número de mudas e em termos de ÁREA RESULTANTE para o plantio.', 'Espécies com grau de ameaça menores (vulnerável) resultam em áreas de compensação menores', 'É muito dificil de ser aplicada para espécies campestres. Para isso, utilizar a resolução conama xxx de campos de altitude. Geralmente deve er associada ao plantio por enriquecimento, para não criar uma grande população de indivíduos da mesma espécie', 'A definição da proporção leva em consideração o grau de ameaça das espécies. Esse tipo de compensação deve ser feito mediante PLANTIO! Não há possibilidade de doar áreas. Apesar de poder ser realizada em APP, não pode ser feita em área de APP destinada a compensação, como "sobreposição" de compensações', ''],
        [4, 'Recuperação', '25:1', 'Plantio composto por espécies nativas típicas da região, preferencialmente do grupo de espécies que foi suprimido, em sua densidade populacional de ocorrência natural.', 'Áreas degradadas.', 'É uma boa alternativa para os casos de impossibilidade de conseguir mudas específicas das espécies suprimidas. A utilização de espécies nativas diversas não favorece a formação de monoculturas.', 'Resulta em quantitativos de mudas maiores, e consequentemente áreas maiores para o plantio.', '', ''],
        [5, 'Plantio', 'Definido pela legislação de proteção, caso a legislação não defina, aplica-se o critério de espécies ameaçadas', 'Definida pela legislação de proteção, caso a legislação não defina, aplica-se o critério de espécies ameaçadas', '', '', '', '', ''],
        [6, 'Pagamento', 'Até 0,5% do valor de investimento', 'depósito de recursos financeiros em conta específica do órgão gestor das UC beneficiárias em até 4 parcelas, mensais e sucessivas...', '', '', '', '', ''],
        [7, 'Relocação/Compensação Reserva Legal', 'Quantitativo necessário para compor 20% do imóvel original', '– aquisição de CRA;– arrendamento de área sob regime de servidão ambiental ou Reserva Legal;– doação ao poder público de área localizada no interior de Unidade de Conservação de domínio público pendente de regularização fundiária;– cadastramento de outra área equivalente e excedente à RL em imóvel de mesma titularidade ou adquirida em imóvel de terceiro, com vegetação nativa estabelecida, em regeneração ou recomposição, desde que localizada no mesmo bioma.', '– aquisição de CRA;– arrendamento de área sob regime de servidão ambiental ou Reserva Legal;– doação ao poder público de área localizada no interior de Unidade de Conservação de domínio público pendente de regularização fundiária;– cadastramento de outra área equivalente e excedente à RL em imóvel de mesma titularidade ou adquirida em imóvel de terceiro, com vegetação nativa estabelecida, em regeneração ou recomposição, desde que localizada no mesmo bioma.', '', '', '', '', '']
    ];
    
    console.log("4. Inserindo Modalidades...");
    const stmtModalidades = db.prepare("INSERT INTO modalidades (tipo_id, nome, proporcao, forma, especificidades, vantagens, desvantagens, observacao, documentos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    modalidadesData.forEach(data => stmtModalidades.run(data));
    stmtModalidades.finalize();
    console.log("   Modalidades inseridas com sucesso.");

    console.log("\nOperação de Carga Total e Correta foi concluída!");
});

db.close();