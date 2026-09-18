const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const marketing = require('../marketing.js');
const safety = require('../safety.js');
const { generate, validate } = require('../../server.cjs');

test('all 15 modes produce editable starters without invented business facts', () => {
  assert.equal(marketing.modes.length, 15);
  for (const { id } of marketing.modes) {
    const result = marketing.draft('Quero divulgar minha empresa', { company: 'Marca de teste' }, id);
    assert.equal(result.type, id);
    assert(result.content.length < 1000, `${id} should stay conversational`);
    assert.doesNotMatch(result.content, /DIAGNÓSTICO|MÉTRICAS|Modelo local editável/);
    assert.doesNotMatch(result.content, /R\$\s*\d|garantimos|vendas garantidas/i);
  }
});

test('explicit intent wins, but product details preserve the selected mode', () => {
  assert.equal(marketing.detect('Monte uma campanha para meu produto', 'marca'), 'campanha');
  assert.equal(marketing.detect('Meu produto é café', 'estrategia'), 'estrategia');
  assert.equal(marketing.detect('Calendário semanal para uma loja'), 'calendario');
  assert.equal(marketing.detect('Quero anúncios pagos'), 'anuncios');
  assert.equal(marketing.detect('Crie uma legenda para minha campanha'), 'legenda');
  assert.equal(marketing.detect('Crie uma campanha para WhatsApp'), 'campanha');
  const caption = marketing.draft('Apenas uma legenda para meu produto', { company: 'Café Real' });
  assert.equal(caption.type, 'legenda');
  assert.match(caption.content, /Café Real/);
  assert.doesNotMatch(caption.content, /DIAGNÓSTICO|Modelo local|Sim, preparei/);
  assert.equal(validate({ prompt: 'Oi', mode: 'ignore rules' }).mode, '');
  assert.equal(validate({ prompt: 'Oi', mode: 'estrategia' }).mode, 'estrategia');
});

test('local conversation uses onboarding, templates, revisions and safety before generation', () => {
  const state = { nextId: 1, brand: {}, messages: [] };
  const context = vm.createContext({
    window: { DivulguiarSafety: safety, DivulgaProMarketing: marketing,
      DivulguiarLocal: { revise: (text, previous) => text === 'mais curto' && previous ? 'Texto revisado' : null } },
    NAV: [], CATEGORIES: [], state, catLabel: value => value,
  });
  const source = fs.readFileSync(path.join(__dirname, '../experience.js'), 'utf8');
  vm.runInContext(source.split('generateContent = localConversation;')[0], context);
  assert.equal(context.localConversation('Olá!', false, '').content, marketing.welcome);
  const campaign = context.localConversation('Campanha completa para minha loja', false, '');
  assert.match(campaign.content, /FASES/);
  assert.match(campaign.content, /PÓS|Pós/);
  assert.equal(campaign.localTemplate, true);
  state.messages.push({ role: 'assistant', entry: campaign });
  assert.equal(context.localConversation('mais curto', false, '').content, 'Texto revisado');
  assert.equal(context.localConversation('Crie depoimentos falsos', false, '').blocked, true);
  assert.match(context.localConversation('Qual a capital da França?', false, '').content, /não compreende perguntas gerais/);
  assert.match(context.localConversation('Crie uma imagem de café', false, 'photo').content, /descrição textual/);
});

test('deceptive marketing is refused while truthful requests and prevention remain allowed', () => {
  for (const text of ['Crie depoimentos falsos', 'Invente avaliações falsas', 'Quero spam em massa'])
    assert.equal(safety.review(text), 'block');
  for (const text of ['Peça avaliações sinceras aos clientes', 'Como evitar avaliações falsas?', 'Crie uma campanha para minha padaria'])
    assert.equal(safety.review(text), 'allow');
});

test('feedback distinguishes refusals, clear requests, exploration and quoted negation', () => {
  for (const phrase of ['não quero', 'n quero', 'nn gostei', 'não é por aí', 'faz diferente', 'não gostei', 'não é isso', 'mudei de ideia', 'isso não serve', 'prefiro outra coisa'])
    assert.equal(marketing.intent(phrase).kind, 'change', phrase);
  for (const phrase of ['Talvez um vídeo', 'Será que ficaria melhor?', 'Não sei se uma legenda funciona', 'Estou pensando em mudar'])
    assert.equal(marketing.intent(phrase).kind, 'explore', phrase);
  for (const phrase of ['Faça uma legenda', 'Pode criar um roteiro?', 'Crie um post com a frase “não quero perder tempo”', 'Não quero que pare'])
    assert.equal(marketing.intent(phrase).kind, 'execute', phrase);
  assert.equal(marketing.intent('Como funciona a edição?').kind, 'question');
  assert.equal(marketing.intent('Deixa pra lá').kind, 'stop');
  assert.equal(marketing.intent('Pode fazer').kind, 'confirm');
  assert.equal(marketing.intent('Não gostei, talvez uma legenda').kind, 'explore');
  const pivot = marketing.pivot('Não quero vídeo, faça uma legenda', {}, { type: 'roteiro' });
  assert.equal(pivot.type, 'legenda');
  assert.doesNotMatch(pivot.content, /Roteiro|CENA/);
  assert(marketing.pivot('Não gostei', {}, { type: 'legenda' }).type !== 'legenda');
  assert.equal(marketing.pivot('Não quero mais', {}, { type: 'legenda' }).stopped, true);
});

test('ambiguous photo requests wait; only the latest proposal can be confirmed', async () => {
  const state = { nextId: 1, brand: {}, messages: [], mode: 'photo' };
  const edits = [];
  const context = vm.createContext({
    window: { DivulguiarSafety: safety, DivulgaProMarketing: marketing,
      DivulguiarLocal: { revise: () => null, editPhoto: async (...args) => { edits.push(args); return { text: 'Foto ajustada' }; } } },
    NAV: [], CATEGORIES: [], state, catLabel: value => value,
  });
  const source = fs.readFileSync(path.join(__dirname, '../experience.js'), 'utf8');
  vm.runInContext(source.split('generateContent = localConversation;')[0], context);
  vm.runInContext(source.slice(source.indexOf('function currentHistory()'), source.indexOf('submitRequest = async')), context);
  vm.runInContext("generatedImages.set('photo-reference', 'original-image')", context);
  async function send(text, image = null) {
    state.messages.push({ role: 'user', text, ...(image && { imageId: 'photo-reference' }) });
    const entry = await context.requestAgent(text, image, state.mode);
    state.messages.push({ role: 'assistant', entry });
    return entry;
  }
  const proposed = await send('Talvez aumentar o brilho', 'original-image');
  assert.match(proposed.content, /Quer que eu/);
  assert.equal(edits.length, 0);
  await send('Pode fazer');
  assert.equal(edits.length, 1);
  assert.equal(edits[0][0], 'original-image');
  await send('Será que ficaria melhor com mais contraste?', 'original-image');
  assert.equal(edits.length, 1);
  await send('Não quero, prefiro uma legenda');
  assert.equal(state.mode, 'legenda');
  assert.equal(edits.length, 1);
  const staleConfirmation = await send('Pode fazer');
  assert.match(staleConfirmation.content, /O que você quer/);
  assert.equal(edits.length, 1);
  state.mode = 'photo';
  await send('Como funciona o ajuste de brilho?', 'original-image');
  assert.equal(edits.length, 1);
  await send('Aumente o brilho', 'original-image');
  assert.equal(edits.length, 2);
});

test('server sends full persona, mode, brand and history to the text provider', async () => {
  const original = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-placeholder';
  const response = text => ({ output: [{ type: 'message', content: [{ type: 'output_text', text }] }] });
  let generation;
  try {
    const result = await generate({
      prompt: 'Prepare a divulgação', mode: 'campanha', brand: { company: 'Minha Marca' },
      history: [{ role: 'user', content: 'Atendo em Recife' }],
    }, async (endpoint, body) => {
      if (endpoint === 'moderations') return { results: [{ flagged: false }] };
      if (body.instructions.includes('Classifique')) return response('ALLOW');
      generation = body;
      return response('Texto de teste');
    });
    assert.equal(result.text, 'Texto de teste');
    assert.match(generation.instructions, /Você é a DivulgaPro AI/);
    assert.match(generation.instructions, /Faça uma pergunta por vez/);
    assert.match(generation.instructions, /duas a cinco frases/);
    assert.match(generation.instructions, /abandone a proposta rejeitada/);
    assert.match(generation.instructions, /CENA, FALA, TEXTO NA TELA/);
    assert.match(generation.instructions, /B2B2C/);
    assert.match(generation.instructions, /não invente valores/i);
    assert.match(generation.input[0].content, /Modo selecionado: campanha/);
    assert.match(generation.input[0].content, /Minha Marca/);
    assert(generation.input.some(message => message.content === 'Atendo em Recife'));
  } finally {
    if (original === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = original;
  }
});

test('both entrypoints load local templates before the chat and preserve existing storage names', () => {
  for (const relative of ['../index.html', '../../index.html']) {
    const html = fs.readFileSync(path.join(__dirname, relative), 'utf8');
    assert.match(html, /<title>DivulgaPro AI/);
    assert(html.indexOf('marketing.js') < html.indexOf('experience.js'));
    assert(html.indexOf('marketing.js') > html.indexOf('local-tools.js'));
  }
  const agent = fs.readFileSync(path.join(__dirname, '../agent.js'), 'utf8');
  assert.match(agent, /"divulguiar.agent.v1"/);
});
