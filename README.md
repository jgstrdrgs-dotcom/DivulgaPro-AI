# Divulguiar

Aplicativo de marketing sem login obrigatório, com identidade palha e laranja, chat progressivo, cadastro de marca, biblioteca, histórico, favoritos, modelos, produtos, calendário editorial e calculadora de margem.

## Executar

Abra `index.html` na raiz (encaminha para `divulgaia/index.html`) ou sirva o projeto com um servidor estático. As fontes são locais. Nenhuma dependência de runtime é necessária.

## Produção

Com Node.js 18 ou superior: `npm run build` ou `node divulgaia/scripts/build.cjs`. Publique o conteúdo de `dist/`. O build valida a sintaxe JavaScript e empacota o aplicativo e as fontes.

## Verificação

`node divulgaia/scripts/verify-agent.cjs <caminho-do-modulo-playwright> <executavel-chromium>`

Execute após o build. O teste verifica o artefato de produção, fluxos do chat, persistência, anexos, teclado, calculadora e larguras de 320, 360, 390 e 430px. Capturas ficam em `qa-output/`.

## Dados e geração

Os dados ficam no localStorage deste navegador. Não há sincronização nem serviço de IA configurado. A geração usa modelos locais adaptados ao briefing e aos dados da marca, com apresentação progressiva. Imagens podem ser anexadas como referência, mas não são reconhecidas automaticamente; artes são entregues como direção de arte textual. O campo informa essa modalidade ao usuário. Revise os rascunhos antes de publicar.

Os arquivos antigos foram preservados em `divulgaia/`. O ponto de entrada atual usa `agent.css` e `agent.js`, mantendo as telas de biblioteca, favoritos e modelos do index existente.
