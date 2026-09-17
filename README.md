# Divulguiar

Aplicativo de marketing sem login obrigatório, com identidade palha e laranja, chat progressivo, cadastro de marca, biblioteca, histórico, favoritos, modelos, produtos, calendário editorial e calculadora de margem.

## Executar

Abra `index.html` na raiz para a edição local de fotos e o assistente de texto limitado. Para conversa com IA e busca de tendências, use Node.js 22 ou superior e execute `npm start`. Abra `http://localhost:3000`. Não há dependências npm de runtime.

Copie `.env.example` para `.env` e configure `OPENAI_API_KEY` apenas nesse arquivo do servidor. Nunca coloque a chave no HTML, JavaScript público ou em uma conversa. Os modelos de texto e imagem são configuráveis em `OPENAI_TEXT_MODEL` e `OPENAI_IMAGE_MODEL`. É necessário ter acesso e saldo nos modelos escolhidos. O site continua abrindo sem login; sem chave, informa que está em prévia local e não simula fotos editadas.

## Produção

`npm run build` valida a sintaxe e empacota a interface em `dist/`. Hospedagem puramente estática oferece somente a prévia local. Para IA, hospede o projeto com `server.cjs` e variáveis de ambiente. O servidor usa localhost por padrão; a exposição pública deve passar por HTTPS e controles de acesso/limites do operador, sem colocar a chave no navegador.

## Verificação

`node divulgaia/scripts/verify-agent.cjs <caminho-do-modulo-playwright> <executavel-chromium>`

Execute após o build. O teste verifica o artefato de produção, fluxos do chat, persistência, anexos, teclado, calculadora e larguras de 320, 360, 390 e 430px. Capturas ficam em `qa-output/`.

`node --test divulgaia/scripts/verify-server.cjs` verifica validação, moderação, contratos do provedor, origem e arquivos privados com respostas simuladas, sem usar a API paga.

`node divulgaia/scripts/verify-live-flow.cjs <caminho-do-modulo-playwright> <executavel-chromium>` verifica navegador → servidor → provedor simulado, incluindo imagem, download, persistência e bloqueio.

## Dados e geração

Conversas e marca ficam no localStorage; imagens editadas ficam no IndexedDB do mesmo navegador. Sem sincronização entre dispositivos. Com conversa online ativada, apenas o pedido textual e contexto recente são enviados à OpenAI. As fotos são processadas localmente. A imagem pode ser baixada ou reutilizada em outra edição; o original não é sobrescrito. Reconstrução de ambientes não está disponível no editor local.

A política solicitada está em `divulgaia/safety.js`. O servidor aplica moderação multimodal e classificação semântica antes da geração e verifica a saída antes de mostrá-la. Falhas de moderação impedem a geração; recusas não reproduzem o pedido. A apresentação progressiva começa depois da checagem, não é transmissão direta de tokens não moderados. Os filtros não têm garantia de detecção perfeita e precisam ser avaliados com casos reais. A prévia local usa modelos de texto limitados e uma checagem preliminar, não substitui o servidor.

Não foi executada geração paga real neste ambiente: a chave não está configurada. Os testes do contrato usam um provedor simulado.

## Referências de implementação

- [Geração e edição de imagens — OpenAI](https://developers.openai.com/api/docs/guides/image-generation)
- [Moderação — OpenAI](https://developers.openai.com/api/docs/guides/moderation)
- [Busca web — OpenAI](https://developers.openai.com/api/docs/guides/tools-web-search)
- [Guia criativo — TikTok](https://ads.tiktok.com/business/en/guides/what-is-ad-creative-guide)

Os arquivos antigos foram preservados em `divulgaia/`. A interface usa `agent.css`, `agent.js`, `safety.js`, `local-tools.js` e `experience.js`, mantendo biblioteca, favoritos e modelos.

## Edição local e limitações da conversa

As fotos agora são editadas no navegador com Canvas, mesmo quando a conversa online está configurada. O fluxo de edição não envia a imagem ao servidor: brilho, contraste, saturação, preto e branco, rotação, enquadramento e composição de anúncio com título entre aspas e preço informado. Os anúncios usam a foto original; o editor não segmenta o produto nem cria cenários novos. A rota de edição com IA permanece no servidor para integração futura, mas não é usada pelo fluxo de fotos da interface.

O modo sem modelo de linguagem é limitado. Agora os comandos “mais curto”, “mais informal”, “mais formal” e “troque X por Y” modificam o texto anterior, em vez de selecionar novamente a mesma resposta. Isso não equivale a uma conversa aberta com ChatGPT. Para compreensão geral e geração contextual, é preciso configurar um modelo online ou instalar e integrar um modelo local; nenhum modelo local foi instalado automaticamente.

O efeito laranja desaparece após 140 ms sem movimento, com transição de opacidade, e retorna ao mover o ponteiro. A lateral permanece excluída.

Teste específico: `node divulgaia/scripts/verify-local.cjs <playwright> <chromium>` verifica edição real de pixels, dimensões do anúncio, revisões de texto e ausência de requisições POST durante edição local.

## Interface premium

A camada visual está em `divulgaia/premium.css` e os controles de apresentação em `divulgaia/premium.js`, carregados pela página principal `divulgaia/index.html`. A arquitetura existente e os provedores de conteúdo são preservados. O servidor e o build incluem os dois novos arquivos.

O menu mostra Identidade da marca, Configurações, Modelos, Favoritos e Calendário. As outras rotas continuam registradas. Conversas recentes e Nova conversa ficam na lateral recolh?vel. O fundo e os cards usam palha (#ebe6dd). O t?tulo reutiliza a faixa animada do bot?o Enviar, com destaque laranja e respeito ? prefer?ncia de movimento reduzido. O seletor visual reutiliza todas as opções e eventos do seletor original. Ao digitar, o editor fica compacto na parte inferior; Enter envia e Shift+Enter insere uma quebra de linha. As animações respeitam a preferência de movimento reduzido.

Verificação visual e funcional: `node divulgaia/scripts/verify-premium.cjs <caminho-do-modulo-playwright> <executavel-chromium>`. Esse teste sobe um servidor local e verifica hover, foco, teclado, histórico, seleção, persistência, navegação, larguras de 320 a 1440px e ausência de erros no console. As capturas são gravadas em `qa-output/`. Os demais testes de regressão continuam em `divulgaia/scripts/`.
