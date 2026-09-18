/* Shared metadata and editable offline starters. These are templates, not AI. */
(function (root) {
  const welcome = 'Oi! Sou a DivulgaPro AI. O que você quer divulgar hoje?';
  const modes = [
    ['estrategia', 'Estratégia'], ['conteudo', 'Conteúdo'], ['campanha', 'Campanhas'],
    ['anuncios', 'Anúncios pagos'], ['vendas', 'Vendas'], ['marca', 'Marca'],
    ['analise', 'Análise'], ['lancamento', 'Lançamento'], ['local', 'Marketing local'],
    ['produto', 'Produto'], ['servico', 'Serviço'], ['ideia', 'Ideias'],
    ['melhoria', 'Melhoria'], ['calendario', 'Calendário'], ['diagnostico', 'Diagnóstico'],
  ].map(([id, label]) => ({ id, label }));
  const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const feedbackText = text => normalize(text).trim().replace(/^(?:n|nn|naum)\b/, 'nao');
  function changeOfDirection(text) {
    const value = feedbackText(text);
    // Only interpret conversational feedback, never a negation inside requested copy.
    if (/^nao (?:quero|precisa) (?:que (?:voce )?)?(?:par|desist|cancel)/.test(value)) return null;
    if (!/^(?:(?:obrigad[oa]|valeu|hmm?|ok|olha)[,!. ]+)?(?:nao(?:[.!?\s]*$|,| (?:quero|gostei|curti|era|e isso|e por ai|desse jeito|to afim|estou afim|precisa|funciona|serve))|melhor nao|muda isso|faz diferente|tenta de outro jeito|outra ideia|desisti|mudei de ideia|deixa (?:pra|para) la|esquece|pare\b|para\b|cancela|chega\b|prefiro\b|(?:quero|tente|me de) outra|(?:isso|essa ideia|esse texto) nao)/.test(value)) return null;
    const alternative = text.match(/(?:^|[,;.!?]\s*|\s+(?:mas|e sim)\s+)((?:agora\s+)?(?:prefiro|quero|faça|faca|crie|monte|vamos|escreva|tente|mude para|me d[eêaá]|pode fazer)\s+.+)$/i);
    const request = alternative?.[1]?.trim() || null;
    if (!request && /^(?:nao quero mais|nao precisa(?: mais)?|deixa (?:pra|para) la|esquece(?: isso)?|pare|para|cancela(?:r)?|chega|desisti)[.!\s]*$/.test(value))
      return { stop: true, request: null, declined: '' };
    return { stop: false, request, declined: detect(value.split(/[,;.!?]|\bmas\b/)[0], '') };
  }
  function intent(text) {
    const value = feedbackText(text);
    const change = changeOfDirection(text);
    const tentativeAlternative = text.match(/(?:[,;.!?]\s*|\s+mas\s+)((?:talvez|quem sabe|ser[aá] que|estou pensando|acho que).+)$/i);
    if (change && tentativeAlternative) return { kind: 'explore', request: tentativeAlternative[1] };
    if (change) return { kind: change.stop ? 'stop' : 'change', ...change };
    if (/^(?:sim|pode(?: fazer| executar| seguir)?|faz isso|faca isso|isso mesmo|manda|vamos nessa|segue|ok|claro)[.!\s]*$/.test(value)) return { kind: 'confirm' };
    if (/^(?:talvez|quem sabe|acho que|sera que|e se\b|estou pensando|penso em|nao sei|(?:voce |vc )?acha|o que (?:voce |vc )?acha)/.test(value)) return { kind: 'explore' };
    if (/^(?:como|qual|quais|por que|porque|o que|voce consegue|vc consegue|da (?:pra|para))\b/.test(value)) return { kind: 'question' };
    return { kind: 'execute' };
  }
  function pivot(text, brand, previous) {
    const change = changeOfDirection(text);
    if (!change) return null;
    if (change.stop) return { type: 'ideia', content: 'Tudo bem, deixamos isso de lado.', stopped: true };
    if (change.request) {
      const result = draft(change.request, brand);
      return result && { ...result, content: `Certo, vamos por esse caminho.\n\n${result.content}` };
    }
    if (!previous) return { type: 'ideia', content: 'Tudo bem. O que você prefere fazer?' };
    const alternatives = ['legenda', 'stories', 'whatsapp', 'ideia'];
    const index = alternatives.indexOf(previous.type);
    const type = [...alternatives.slice(index + 1), ...alternatives.slice(0, index + 1)]
      .find(candidate => candidate !== previous.type && candidate !== change.declined) || 'ideia';
    const result = draft('Uma nova abordagem', brand, type);
    return { ...result, content: `Vamos mudar a ideia.\n\n${result.content}` };
  }
  function detect(text, fallback = '') {
    const value = normalize(text);
    // Prefer the requested deliverable over a channel or subject mentioned later.
    const deliverable = value.match(/^(?:(?:crie|criar|monte|montar|faca|quero|preciso de|prepare)\s+)?(?:(?:um|uma|o|a|apenas|somente)\s+)*(legenda|campanha|roteiro|stories|calendario|anuncios?|estrategia|ideias?)\b/);
    if (deliverable) return ({ anuncio: 'anuncios', ideias: 'ideia' })[deliverable[1]] || deliverable[1];
    const rules = [
      ['melhoria', /melhor[ea]|reescrev|revis[ea]|mais curto|mais formal|mais informal|troque/],
      ['calendario', /calendario|cronograma/], ['diagnostico', /diagnostic|nao funcion|nao vend/],
      ['analise', /analis[ea]|avalie|concorrente/], ['lancamento', /lancamento|lancar|carrinho/],
      ['anuncios', /anuncio|trafego pago|meta ads|google ads|tiktok ads/],
      ['campanha', /campanha/], ['local', /marketing local|bairro|negocio local/],
      ['marca', /slogan|posicionamento|identidade verbal|manifesto|biografia|\bbio\b/],
      ['roteiro', /roteiro|reels|shorts|video/], ['stories', /stories|\bstory\b/],
      ['legenda', /legenda/], ['whatsapp', /whatsapp|\bwhats\b/],
      ['vendas', /follow.?up|objec|atendimento|orcamento|pos.venda/],
      ['estrategia', /estrategia|plano de divulg|plano de marketing/],
      ['conteudo', /carrossel|\bpost\b|conteudo/], ['ideia', /ideias|inspirac/],
      ['oferta', /oferta|promocao/],
    ];
    return rules.find(([, rule]) => rule.test(value))?.[0] || fallback ||
      (/servico/.test(value) ? 'servico' : /produto/.test(value) ? 'produto' : 'ideia');
  }
  function draft(text, brand = {}, mode = '') {
    const type = detect(text, mode);
    const name = brand.company || brand.name || '[INSIRA O NOME DA MARCA]';
    const audience = '[INSIRA O PÚBLICO]';
    const product = '[INSIRA O PRODUTO/SERVIÇO]';
    const benefit = '[INSIRA UM BENEFÍCIO REAL]';
    const cta = 'Envie QUERO para [INSIRA O WHATSAPP] e conheça as opções.';
    const seconds = Number(text.match(/\b(15|30|60)\s*(?:s\b|segundos?)/i)?.[1] || 15);
    const caption = `Antes de escolher ${product}, veja este detalhe: [INSIRA UM DIFERENCIAL COMPROVÁVEL].\nCom ${name}, você pode ${benefit}.\n${cta}`;
    const whatsapp = `Olá, [NOME]! Aqui é da ${name}. Você gostaria de conhecer ${product} e entender como pode ajudar com [INSIRA A NECESSIDADE]? Posso enviar as opções?`;
    const assumptions = `Modelo local editável, sem análise por IA. Pedido de referência: “${text}”.\nPreencha os campos antes de publicar. Hipótese inicial: gerar conversas qualificadas com ${audience}; valide o canal com seus clientes. Tom inicial: ${brand.tone || 'claro e acolhedor'}.`;
    const strategy = `DIAGNÓSTICO\nFaltam dados de público, oferta e resultados para avaliar o negócio. Este é um ponto de partida para ${name}.\n\nOBJETIVO\nGerar conversas sobre ${product}. Defina uma meta após medir sua situação atual.\n\nESTRATÉGIA\nHipótese: mostrar uma demonstração no Instagram, responder dúvidas nos Stories e atender interessados pelo WhatsApp. Confirme se ${audience} usa esses canais.\n\nEXECUÇÃO\n1. Grave o produto ou serviço em uso e mostre ${benefit}.\n2. Publique uma dúvida real com resposta demonstrável.\n3. Convide interessados a conversar e registre a origem dos contatos.\n\nMATERIAIS PRONTOS\n${caption}\n\nCTA\n${cta}\n\nMÉTRICAS\nConte conversas qualificadas e pedidos. Taxa de conversão = vendas ÷ conversas qualificadas × 100; se não houver conversas, ainda não há taxa para calcular.\n\nPRÓXIMO PASSO\nPreencha público, benefício e contato; grave a primeira demonstração.`;
    const campaign = `NOME DA CAMPANHA\nConheça de perto\n\nOBJETIVO\nGerar conversas qualificadas sobre ${product}.\n\nPÚBLICO\n${audience}, em [INSIRA A REGIÃO].\n\nCONCEITO\nMostrar o que o cliente precisa saber antes de escolher.\n\nMENSAGEM PRINCIPAL\nVeja como ${product} funciona na prática.\n\nPROMESSA\n${benefit}, somente se comprovável.\n\nOFERTA\n${product} por [INSIRA O PREÇO]. Condições: [INSIRA AS CONDIÇÕES REAIS].\n\nCANAIS\nHipótese: Instagram para descoberta e WhatsApp para atendimento.\n\nFASES\n1. Preparação: confirme oferta e produza fotos reais.\n2. Aquecimento: publique uma dúvida do público.\n3. Lançamento: apresente a demonstração e a oferta.\n4. Intensificação: responda objeções recebidas.\n5. Encerramento: comunique prazo somente se existir.\n6. Pós-campanha: acompanhe clientes e peça avaliação sincera.\nDistribua essas fases em [INSIRA O PERÍODO], conforme sua disponibilidade.\n\nCONTEÚDOS\nReel: demonstração de um benefício.\nCarrossel: três critérios para escolher.\nStories: perguntas e respostas sobre a oferta.\n\nANÚNCIOS\nSe houver orçamento, teste demonstração versus dúvida frequente, mantendo a mesma oferta.\n\nWHATSAPP\n${whatsapp}\nEnvie somente a quem aceitou receber contato.\n\nCTA\n${cta}\n\nMÉTRICAS\nConversas qualificadas, pedidos, taxa de conversão e custo por conversa se houver mídia paga.\n\nRISCOS\nOferta pouco clara, falta de material real ou demora no atendimento. Não use escassez inventada.\n\nPRÓXIMOS PASSOS\nConfirme público, preço, período e capacidade de atendimento antes de publicar.`;
    const video = `OBJETIVO E FORMATO\nConsideração: vídeo vertical de 30 segundos mostrando ${product}.\n\nCENA 1 · 0–3s\nFALA: “Antes de escolher, veja este detalhe.”\nTEXTO NA TELA: “O que observar antes de comprar”\nIMAGEM OU AÇÃO: close de um detalhe real.\nDURAÇÃO: 3 segundos.\n\nCENA 2 · 3–12s\nFALA: “Se você procura [INSIRA A NECESSIDADE], observe [INSIRA O CRITÉRIO].”\nTEXTO NA TELA: “[INSIRA O CRITÉRIO]”\nIMAGEM OU AÇÃO: demonstre o uso com enquadramento estável.\nDURAÇÃO: 9 segundos.\n\nCENA 3 · 12–23s\nFALA: “Aqui você pode ver [DESCREVA O QUE A DEMONSTRAÇÃO COMPROVA].”\nTEXTO NA TELA: “${benefit}”\nIMAGEM OU AÇÃO: mostre o processo real, sem simular resultado.\nDURAÇÃO: 11 segundos.\n\nCENA 4 · 23–30s\nFALA: “Quer saber se combina com o que você procura? Fale com a gente.”\nTEXTO NA TELA: “[INSIRA O WHATSAPP]”\nIMAGEM OU AÇÃO: produto e contato legível.\nDURAÇÃO: 7 segundos.\n\nLEGENDA\n${caption}\n\nCAPA\n“Antes de escolher ${product}”`;
    const post = `OBJETIVO\nAjudar ${audience} a avaliar ${product}. Etapa: consideração.\n\nFORMATO E IDEIA VISUAL\nCarrossel de três telas com fotos reais.\n\nTEXTO DA ARTE\n1. “Antes de escolher ${product}, confira isso.”\n2. “[INSIRA UM CRITÉRIO DE ESCOLHA]”: demonstre com uma foto.\n3. “Tire suas dúvidas com ${name}.”\n\nLEGENDA\n${caption}\n\nCTA\n${cta}\n\nPALAVRAS-CHAVE\n[INSIRA O PRODUTO], [INSIRA A CIDADE], [INSIRA A NECESSIDADE].\n\nHORÁRIO\nHipótese para teste: 12h versus 19h, em publicações comparáveis. Confirme a escolha nas métricas da conta.\n\nALTERNATIVA\nTroque a abertura por “Qual detalhe você observa antes de escolher?” e compare salvamentos e conversas.`;
    const analysis = `Ainda não recebi material ou métricas suficientes para uma análise específica. Cole o texto, descreva o perfil ou informe alcance, cliques, mensagens, vendas, investimento e período.\n\nO QUE ESTÁ BOM / FRACO / FALTANDO\nNão é possível concluir sem o material. Verifique se a primeira frase identifica público e benefício; se a oferta tem condições claras; e se há um único próximo passo.\n\nO QUE PODE IMPEDIR RESULTADOS\nHipóteses a verificar: poucos cliques podem indicar mensagem pouco relevante; cliques sem conversas podem indicar dificuldade no destino; conversas sem vendas podem indicar objeções à oferta ou ao atendimento. Não são diagnósticos confirmados.\n\nCOMO CORRIGIR\nRegistre os números de cada etapa e escolha o ponto com maior perda antes de mudar a campanha.\n\nVERSÃO PARA PREENCHER\n${caption}\n\nPRÓXIMO TESTE\nCompare duas aberturas mantendo público, oferta e CTA; acompanhe conversas qualificadas no mesmo período.`;
    const templates = {
      estrategia: strategy, campanha: campaign, conteudo: post, roteiro: video,
      legenda: caption, whatsapp,
      stories: `Etapas: descoberta → consideração → conversão.\n\nSTORY 1\nArte: “Qual sua maior dúvida sobre ${product}?”\nVisual: foto real e caixa de perguntas.\n\nSTORY 2\nArte: “[INSIRA UMA RESPOSTA VERIFICÁVEL]”\nVisual: demonstração do benefício.\n\nSTORY 3\nArte: “Conheça as opções de ${name}.”\nVisual: produto e contato legível.\nCTA: ${cta}`,
      anuncios: `OBJETIVO\nConversas qualificadas sobre ${product}.\n\nPLATAFORMA E PÚBLICO\nHipótese: Meta Ads, para ${audience} em [INSIRA A REGIÃO ATENDIDA]. Idade, interesses, comportamentos e posicionamentos: definir com dados do negócio e opções permitidas da plataforma.\n\nORÇAMENTO\n[INSIRA O ORÇAMENTO] por [INSIRA O PERÍODO]. Defina um limite compatível com a margem; não há retorno garantido.\n\nÂNGULO E CRIATIVO\nDemonstração de um benefício verificável, usando fotos ou vídeo reais.\n\nTEXTO PRINCIPAL\n${caption}\n\nTÍTULO\nConheça ${product}\n\nDESCRIÇÃO\nConfira opções, valores e condições com ${name}.\n\nCTA E DESTINO\nEnviar mensagem → [INSIRA O WHATSAPP].\n\nEVENTO E MÉTRICA\nConversa iniciada; registre também quantas são qualificadas e quantas viram pedidos. Custo por conversa = gasto ÷ conversas, quando houver conversas.\n\nTESTE E OTIMIZAÇÃO\nSe houver orçamento, compare abertura com pergunta versus demonstração, mantendo a oferta. Defina o limite de custo com base na margem e conversão reais. Antes de ampliar gasto, confira destino e atendimento.`,
      vendas: `MENSAGEM INICIAL\n${whatsapp}\n\nORÇAMENTO\n“Para [INSIRA A NECESSIDADE], a opção é ${product}, por [INSIRA O PREÇO], com [INSIRA O ESCOPO/CONDIÇÕES]. Ficou alguma dúvida sobre o que está incluído?”\n\nFOLLOW-UP\n“Olá, [NOME]! Ficou alguma dúvida sobre a proposta? Se não for o momento, sem problema.”\n\nPÓS-VENDA\n“Olá, [NOME]! Como foi sua experiência com ${product}? Posso ajudar em algo?”\n\nPRÓXIMO PASSO\nUse apenas o trecho adequado à conversa e respeite quem não quiser novos contatos.`,
      marca: `POSICIONAMENTO\n“${name} ajuda ${audience} a ${benefit} por meio de [INSIRA UM DIFERENCIAL REAL].”\n\nSLOGAN — PROPOSTA\n“Mais clareza para a sua escolha.”\nValide se representa seu negócio antes de adotar.\n\nBIO\n${product} para ${audience}.\n[INSIRA UM DIFERENCIAL REAL].\n[INSIRA A CIDADE OU REGIÃO].\nFale com a gente: [INSIRA O LINK].\n\nTOM DE VOZ\nHipótese: claro e acolhedor. Use frases diretas, explique benefícios e evite superlativos sem prova.\n\nPRÓXIMO PASSO\nDefina o diferencial que um cliente consegue comprovar.`,
      analise: analysis, diagnostico: analysis,
      melhoria: `Cole o texto que deseja melhorar e indique o canal. Sem o original, não consigo fazer uma revisão específica.\n\nEstrutura editável para começar:\n${caption}\n\nDepois de preencher, corte repetições, comprove o benefício e mantenha uma única chamada para ação.`,
      lancamento: `PLANO DE LANÇAMENTO — PREENCHA AS DATAS\n\nPREPARAÇÃO\nConfirme público, oferta, preço, capacidade e [INSIRA A DATA DE LANÇAMENTO]. Produza uma demonstração real.\n\nAQUECIMENTO\nPublique a dúvida “O que você considera antes de escolher ${product}?” e reúna perguntas.\n\nLANÇAMENTO\nTexto: “Conheça ${product} da ${name}: ${benefit}. Veja condições em [INSIRA O LINK].”\n\nACOMPANHAMENTO\nMostre o processo e responda às dúvidas recebidas. Só anuncie encerramento ou limite de vagas se forem reais.\n\nPÓS-LANÇAMENTO\nAcompanhe a experiência dos clientes e peça avaliações sinceras.\n\nMÉTRICAS E PRÓXIMO PASSO\nRegistre interessados, conversas e pedidos por fase. Confirme datas e oferta antes de iniciar.`,
      local: `OBJETIVO\nAtrair pessoas de [INSIRA A CIDADE/BAIRROS] para ${name}.\n\nEXECUÇÃO\n1. Confira endereço, horários e contato do Google Perfil da Empresa.\n2. Publique fotos reais e uma demonstração de ${product}.\n3. Proponha parceria a um negócio complementar do bairro.\n4. Peça avaliações sinceras a clientes atendidos.\n\nTEXTO PRONTO\n“Você está em [INSIRA A CIDADE]? Conheça ${product} da ${name}. [INSIRA UM DIFERENCIAL REAL]. Consulte horários e condições em [INSIRA O WHATSAPP].”\n\nMÉTRICAS\nPergunte como o cliente encontrou a empresa e registre visitas e pedidos por origem.\n\nPRÓXIMO PASSO\nConfirme região atendida, horários, entrega ou retirada.`,
      produto: `APRESENTAÇÃO\n“${product} da ${name}: uma opção para ${audience} que busca ${benefit}.”\n\nOFERTA\n[INSIRA O PRODUTO], [INSIRA VARIAÇÕES], [INSIRA O PREÇO], [INSIRA CONDIÇÕES DE ENTREGA].\n\nPREÇO\nReúna custo, taxas, impostos, despesas e margem desejada antes de propor um valor. Compare alternativas equivalentes sem copiar preços sem conhecer seus custos.\n\nDEMONSTRAÇÃO E CTA\nMostre um uso real e um diferencial comprovável. ${cta}\n\nPRÓXIMO PASSO\nPreencha as informações e prepare uma foto real do produto.`,
      servico: `OFERTA DO SERVIÇO\n“Ajudo ${audience} com [INSIRA O PROBLEMA], por meio de [INSIRA O SERVIÇO E PROCESSO].”\n\nESCOPO\nInclui: [INSIRA AS ENTREGAS].\nPrazo: [INSIRA UM PRAZO VIÁVEL].\nInvestimento: [INSIRA O PREÇO].\nCondições e limites: [INSIRA AS CONDIÇÕES].\n\nTEXTO PRONTO\n“Precisa de [INSIRA A NECESSIDADE]? Conheça o serviço de ${name}. Entenda o processo e o que está incluído antes de contratar. Conte o que você precisa em [INSIRA O WHATSAPP].”\n\nPRÓXIMO PASSO\nDefina entregas verificáveis; não prometa resultados fora do seu controle.`,
      ideia: `1. EDUCATIVA · Antes de escolher\nComo: explique um critério real em carrossel. Pode ajudar porque reduz uma dúvida de compra.\nExemplo: “O que observar em ${product}?”\nCTA: salve para consultar. Dificuldade: baixa. Funil: descoberta.\n\n2. DEMONSTRAÇÃO · Veja em uso\nComo: grave uma aplicação real em vídeo. Pode ajudar porque torna o benefício visível.\nExemplo: “Veja como funciona [INSIRA UMA FUNÇÃO].”\nCTA: envie sua dúvida. Dificuldade: média. Funil: consideração.\n\n3. BASTIDORES · O cuidado que você não vê\nComo: fotografe uma etapa real do trabalho nos Stories. Pode ajudar porque explica o processo.\nExemplo: “[INSIRA UMA ETAPA] faz parte do nosso trabalho.”\nCTA: pergunte sobre o processo. Dificuldade: baixa. Funil: relacionamento.\n\n4. OFERTA · Escolha com clareza\nComo: apresente o que está incluído, preço e condições confirmados. Pode ajudar porque facilita a decisão.\nExemplo: “${product}: [INSIRA O PREÇO E AS CONDIÇÕES].”\nCTA: ${cta}\nDificuldade: baixa. Funil: conversão.`,
      calendario: `PLANO BÁSICO · UMA SEMANA\nHipótese: três publicações e Stories simples, ajustáveis à sua capacidade.\n\nSEGUNDA · Instagram · Carrossel\nTema: critérios para escolher ${product}. Objetivo: atrair público interessado.\nGancho: “Antes de escolher, observe isso.”\nCTA: salve para consultar.\nLegenda: “[INSIRA UM CRITÉRIO REAL] ajuda você a escolher com mais clareza.”\nVisual: foto real e um critério por tela. Funil: descoberta.\n\nQUARTA · Instagram · Reel\nTema: demonstração. Objetivo: explicar um benefício.\nGancho: “Veja como funciona na prática.”\nCTA: envie sua dúvida.\nLegenda: “Veja [INSIRA O PROCESSO REAL] e entenda ${benefit}.”\nVisual: produto em uso, com texto legível. Funil: consideração.\n\nSEXTA · Instagram · Foto + Stories\nTema: oferta. Objetivo: gerar conversas.\nGancho: “Conheça as opções de ${name}.”\nCTA: ${cta}\nLegenda: “${product} por [INSIRA O PREÇO]. [INSIRA AS CONDIÇÕES].”\nVisual: foto original e contato. Funil: conversão.\n\nAVALIAÇÃO\nAo final da semana, registre salvamentos, dúvidas, conversas e pedidos. Só aumente a frequência se conseguir produzir e atender.`,
      oferta: `OFERTA EDITÁVEL\n${product} para ${audience}.\nBenefício: ${benefit}.\nDiferencial: [INSIRA UM DIFERENCIAL REAL].\nPreço: [INSIRA O PREÇO].\nCondições: [INSIRA AS CONDIÇÕES].\nPrazo ou garantia: inclua somente se existirem.\n\nTEXTO PRONTO\n${caption}\n\nPRÓXIMO PASSO\nConfirme preço, condições e capacidade antes de divulgar.`,
    };
    const concise = {
      estrategia: `Eu começaria com uma demonstração de ${product} e um convite para conversar.\n\nTexto: “Veja como ${product} pode ajudar a ${benefit}. Quer saber mais? Fale com ${name} em [INSIRA O WHATSAPP].”\n\nAcompanhe quantas conversas viram pedidos.`,
      campanha: `Vamos usar a ideia “Conheça de perto”: mostre o produto, responda uma dúvida e convide para conversar.\n\n“Conheça ${product} da ${name}: ${benefit}. Confira as opções em [INSIRA O WHATSAPP].”\n\nComece com uma foto real e esse texto.`,
      conteudo: `Faça um carrossel de três telas:\n1. “Antes de escolher ${product}, veja isso.”\n2. “[INSIRA UM DIFERENCIAL COMPROVÁVEL].”\n3. “Tire suas dúvidas com ${name}.”\n\nLegenda: ${caption}`,
      anuncios: `Use uma foto real com este texto:\n\n${caption}\n\nTítulo: “Conheça ${product}”. Botão: “Enviar mensagem”.\n\nSe houver orçamento, teste uma segunda abertura: “Procurando ${product}?” Compare o custo por conversa qualificada.`,
      vendas: whatsapp,
      marca: `Uma frase para apresentar sua marca:\n\n“${name} ajuda ${audience} a ${benefit}, com [INSIRA UM DIFERENCIAL REAL].”\n\nUse um tom claro e acolhedor.`,
      analise: 'Cole o texto ou os resultados que você quer analisar. Eu começo pelo ponto que mais precisa de ajuste.',
      diagnostico: 'Onde está a dificuldade: alcançar pessoas, receber mensagens ou fechar vendas? Se tiver os números, envie também.',
      melhoria: 'Cole o texto que você quer mudar. Eu devolvo uma versão mais direta.',
      lancamento: `Comece com uma dúvida do público, depois mostre a novidade em uso. No lançamento, publique:\n\n“Conheça ${product} da ${name}: ${benefit}. Veja as condições em [INSIRA O LINK].”\n\nUse prazo de encerramento só se ele for real.`,
      local: `Publique uma foto real com esta chamada:\n\n“Está em [INSIRA A CIDADE]? Conheça ${product} da ${name}. Tire suas dúvidas em [INSIRA O WHATSAPP].”\n\nConfira se endereço e horários estão atualizados no Google Perfil da Empresa.`,
      produto: `“Conheça ${product} da ${name}: ${benefit}. Por [INSIRA O PREÇO], com [INSIRA AS CONDIÇÕES]. ${cta}”`,
      servico: `“Precisa de [INSIRA A NECESSIDADE]? A ${name} oferece [INSIRA O SERVIÇO], incluindo [INSIRA AS ENTREGAS]. Conte o que você precisa em [INSIRA O WHATSAPP].”`,
      ideia: `Mostre um bastidor que o cliente não costuma ver. Fotografe uma etapa real e publique:\n\n“Antes de chegar até você, ${product} passa por [INSIRA UMA ETAPA REAL]. Esse cuidado faz parte do trabalho da ${name}.”`,
      calendario: `Para esta semana:\n• Segunda: foto de ${product} com um benefício real.\n• Quarta: bastidor com uma etapa do trabalho.\n• Sexta: oferta com preço confirmado e convite para conversar.\n\nChamada de sexta: “Conheça as opções da ${name}: [INSIRA O LINK].”`,
      roteiro: `Roteiro de ${seconds} segundos:\n\n0–3s: mostre ${product}. “Olha este detalhe.”\n3–${seconds - 5}s: demonstre [INSIRA UM BENEFÍCIO REAL].\n${seconds - 5}–${seconds}s: “Quer conhecer as opções? Fale com ${name}.”\n\nNa tela: [INSIRA O WHATSAPP].`,
      stories: `Três Stories simples:\n1. Foto: “Você conhece ${product}?”\n2. Detalhe real: “[INSIRA UM BENEFÍCIO COMPROVÁVEL].”\n3. Convite: “Quer saber mais? Responda aqui.”`,
      oferta: `“${product} por [INSIRA O PREÇO]. [INSIRA AS CONDIÇÕES REAIS]. ${cta}”`,
      legenda: caption, whatsapp,
    };
    const detailed = /\b(?:complet[oa]|detalhad[oa]|aprofunde|passo a passo)\b/.test(normalize(text)) && !/\b(?:nao|sem)\b.{0,30}\b(?:complet[oa]|detalhad[oa]|passo a passo)\b/.test(normalize(text));
    const content = detailed ? templates[type] : concise[type];
    if (!content) return null;
    const textOnly = type === 'legenda' || type === 'whatsapp' || /(?:apenas|somente|so) (?:o |a )?(?:texto|legenda|mensagem)|sem explicacao/.test(normalize(text));
    return { type, content: !detailed || textOnly ? content : `${assumptions}\n\n${content}` };
  }
  const api = { welcome, modes, detect, draft, changeOfDirection, pivot, intent };
  if (typeof module !== 'undefined') module.exports = api;
  else root.DivulgaProMarketing = api;
})(globalThis);
