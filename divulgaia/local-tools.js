(function () {
  'use strict';
  function revise(request, previous) {
    if (!previous || previous.imageId) return null;
    const text = request.toLowerCase();
    const substitution = request.match(/(?:troque|substitua|mude)\s+["“']?(.+?)["”']?\s+(?:por|para)\s+["“']?(.+?)["”']?\s*[.!]?$/i);
    if (substitution) {
      const from=substitution[1].trim().replace(/["“”']/g,''), to=substitution[2].trim().replace(/["“”']/g,'');
      const escaped=from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      const matcher=new RegExp(escaped,'gi');
      if(!matcher.test(previous.content))return `Não encontrei “${from}” no último texto. Qual trecho você quer substituir?`;
      return previous.content.replace(matcher,to);
    }
    let body=previous.content.replace(/^(?:Sim[, .]|Claro[.,]|Posso te ajudar)[^\n]*\n\n/i,'').replace(/\n\n(?:Quer que|Eu usaria|Se a pessoa|Eu manteria)[\s\S]*$/,'');
    if (/mais curt|resum|menos texto|enxut/.test(text)) {
      const sentences=body.match(/[^.!?\n]+[.!?]?/g)||[body];
      const shortened=sentences.filter(s=>s.trim()).slice(0,Math.max(1,Math.ceil(sentences.length/2))).join(' ').trim();
      return shortened===previous.content ? 'Esse texto já está bem curto. Qual informação você quer manter como prioridade?' : shortened;
    }
    if (/sem emoji|retir[ae].*emoji|remov[ae].*emoji/.test(text)) return body.replace(/\p{Extended_Pictographic}|\uFE0F/gu,'').trim();
    if (/mais formal|profissional/.test(text)) return body.replace(/me chama/gi,'Entre em contato').replace(/pra\b/gi,'para').replace(/\boi\b/gi,'Olá').replace(/a gente/gi,'nossa equipe').replace(/\bte\b/g,'lhe');
    if (/mais descontra[ií]d|mais informal/.test(text)) return body.replace(/Entre em contato/gi,'Me chama').replace(/Conheça/gi,'Vem conhecer').replace(/nossa equipe/gi,'a gente').replace(/\bpara\b/g,'pra');
    if (/mais dire[tto]|sem introdu[cç][aã]o|s[oó] o texto/.test(text)) return body;
    if (/outra (?:vers[aã]o|op[cç][aã]o)|diferente|n[aã]o gostei|repete|repetindo/.test(text)) return 'Vamos mudar a abordagem. Você prefere destacar o benefício do produto, responder a uma dúvida do cliente ou fazer uma oferta? Com essa escolha, consigo ajustar o texto em vez de repetir a mesma versão.';
    return null;
  }
  function load(source) { return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Não consegui abrir essa foto. Tente outro arquivo.'));image.src=source;}); }
  function fitText(ctx,text,x,y,width,size,maxLines=3){
    ctx.font=`500 ${size}px Inter, system-ui, sans-serif`;
    const lines=[];let line='';
    for(const word of text.split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width&&line){lines.push(line);line=word;}else line=next;}
    if(line)lines.push(line);
    if(lines.length>maxLines) lines[maxLines-1]=lines[maxLines-1].slice(0,-3)+'…';
    lines.slice(0,maxLines).forEach((value,index)=>ctx.fillText(value,x,y+index*size*1.3,width));
  }
  async function editPhoto(source,request,mode,brand){
    const text=request.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const ad=mode==='ad'||/anuncio|banner|publicidade/.test(text);
    if ((mode==='environment'||/troq\w*.*(?:fundo|cenario|ambiente)|(?:praia|floresta|restaurante|mesa de|estudio)/.test(text)) && !ad) return {text:'Não consigo reconstruir o cenário nem recortar o produto automaticamente com este editor local. Posso clarear, aumentar o contraste, girar, enquadrar ou montar um anúncio com a foto original. Diga, por exemplo, “clareie e aumente o contraste” ou escolha “Criar anúncio”.'};
    const image=await load(source);
    const square=/quadrad|1:1/.test(text), story=/stor(y|ies)|9:16/.test(text);
    const rotate=/gire|girar|rotacion/.test(text);
    const degrees=rotate?(Number(text.match(/(?:gire|girar|rotacione)\s*(90|180|270)/)?.[1])||90):0;
    const swap=degrees===90||degrees===270;
    const naturalW=swap?image.naturalHeight:image.naturalWidth,naturalH=swap?image.naturalWidth:image.naturalHeight;
    const scale=Math.min(1,1600/Math.max(naturalW,naturalH));
    const canvas=document.createElement('canvas');
    canvas.width=ad||square||story?1080:Math.max(1,Math.round(naturalW*scale));
    canvas.height=ad?1350:story?1920:square?1080:Math.max(1,Math.round(naturalH*scale));
    const ctx=canvas.getContext('2d');
    const brighter=/clare|ilumin|brilho|luz/.test(text), darker=/escure/.test(text), contrast=/contraste/.test(text), gray=/preto e branco|cinza|monocrom/.test(text), saturated=/satura|cores vivas/.test(text);
    const changes=[];
    const filters=[];
    if(brighter){filters.push('brightness(1.15)');changes.push('clareei a foto');}
    if(darker){filters.push('brightness(.85)');changes.push('reduzi a luminosidade');}
    if(contrast){filters.push('contrast(1.15)');changes.push('aumentei o contraste');}
    if(gray){filters.push('grayscale(1)');changes.push('apliquei preto e branco');}
    if(saturated){filters.push('saturate(1.2)');changes.push('realcei as cores');}
    if(rotate)changes.push(`girei ${degrees}°`);
    if(square||story)changes.push(`enquadrei em ${story?'Stories':'formato quadrado'}`);
    const title=request.match(/(?:t[ií]tulo|texto|escreva|coloque a frase)\s*[:=]?\s*["“]([^"”]+)["”]/i)?.[1];
    if(!ad&&!changes.length&&!title)return{text:'Qual ajuste você quer aplicar? Posso clarear, escurecer, aumentar contraste, realçar cores, girar 90°, deixar quadrada, preparar para Stories ou adicionar um título entre aspas. Tudo é feito aqui, sem enviar sua foto.'};
    ctx.fillStyle='#faf8f5';ctx.fillRect(0,0,canvas.width,canvas.height);
    const frame=ad?{x:54,y:100,w:972,h:820}:{x:0,y:0,w:canvas.width,h:canvas.height};
    // Rotate in a separate local canvas, then crop or contain without stretching the product.
    const rotated=document.createElement('canvas');rotated.width=Math.max(1,Math.round(naturalW*scale));rotated.height=Math.max(1,Math.round(naturalH*scale));
    const rctx=rotated.getContext('2d');rctx.translate(rotated.width/2,rotated.height/2);rctx.rotate(degrees*Math.PI/180);rctx.filter=filters.join(' ')||'none';rctx.drawImage(image,-image.naturalWidth*scale/2,-image.naturalHeight*scale/2,image.naturalWidth*scale,image.naturalHeight*scale);
    const factor=ad?Math.min(frame.w/rotated.width,frame.h/rotated.height):Math.max(frame.w/rotated.width,frame.h/rotated.height);
    ctx.save();ctx.beginPath();ctx.rect(frame.x,frame.y,frame.w,frame.h);ctx.clip();ctx.drawImage(rotated,frame.x+(frame.w-rotated.width*factor)/2,frame.y+(frame.h-rotated.height*factor)/2,rotated.width*factor,rotated.height*factor);ctx.restore();
    await document.fonts.ready;
    if(ad){
      ctx.fillStyle='#27251e';fitText(ctx,(brand.name||brand.company||'').slice(0,70),54,58,972,25,1);
      fitText(ctx,title||'Conheça os detalhes',54,1000,972,56,2);
      const price=request.match(/R\$\s*\d+(?:[.,]\d{2})?/i)?.[0];if(price)fitText(ctx,price,54,1175,972,42,1);
      ctx.fillStyle='#ff682c';ctx.fillRect(54,1230,972,64);ctx.fillStyle='#27251e';fitText(ctx,'Fale com a gente',78,1272,924,26,1);
      changes.push('montei um anúncio com a foto original e os textos informados');
    }else if(title){ctx.fillStyle='#27251ecc';ctx.fillRect(0,canvas.height*.72,canvas.width,canvas.height*.28);ctx.fillStyle='#faf8f5';fitText(ctx,title,canvas.width*.05,canvas.height*.8,canvas.width*.9,Math.max(16,canvas.width*.045),3);changes.push('adicionei o título');}
    return {image:canvas.toDataURL('image/png'),text:`Pronto: ${changes.join(', ')}. Fiz a edição no seu navegador, sem enviar a foto. Você pode baixar a imagem ou pedir outro ajuste.`};
  }
  window.DivulguiarLocal={revise,editPhoto};
})();
