const {chromium}=require(process.argv[2]||'playwright');
const assert=require('node:assert/strict');
const {createServer}=require('../../server.cjs');
const server=createServer();
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:900}});
    let posts=0;page.on('request',request=>{if(request.method()==='POST')posts++;});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.locator('.topbar').hover({position:{x:300,y:25}});
    assert.equal(await page.locator('.page-pointer-glow').evaluate(e=>e.classList.contains('visible')),true);
    await page.waitForTimeout(400);
    assert.equal(await page.locator('.page-pointer-glow').evaluate(e=>e.classList.contains('visible')),false);
    await page.mouse.move(650,100);
    assert.equal(await page.locator('.page-pointer-glow').evaluate(e=>e.classList.contains('visible')),true);
    await page.locator('.drawer-head').hover();
    assert.equal(await page.locator('.page-pointer-glow').evaluate(e=>e.classList.contains('visible')),false);
    const edits=await page.evaluate(async()=>{
      const before={content:'Conheça o café especial. Entre em contato para saber mais. A entrega está disponível.',type:'legenda'};
      const shorter=DivulguiarLocal.revise('deixe mais curto',before);
      const replace=DivulguiarLocal.revise('troque café por chá',before);
      const informal=DivulguiarLocal.revise('mais informal',before);
      const fixture=document.createElement('canvas');fixture.width=120;fixture.height=80;
      const ctx=fixture.getContext('2d');ctx.fillStyle='#804020';ctx.fillRect(0,0,120,80);
      const source=fixture.toDataURL('image/png');
      const result=await DivulguiarLocal.editPhoto(source,'Clareie e aumente o contraste','photo',{});
      const ad=await DivulguiarLocal.editPhoto(source,'Título "Café especial" R$ 18','ad',{name:'Aurora'});
      const dimensions=await new Promise(resolve=>{const image=new Image();image.onload=()=>resolve([image.width,image.height]);image.src=ad.image;});
      const unsupported=await DivulguiarLocal.editPhoto(source,'Troque o fundo para uma praia','environment',{});
      return{original:before.content,shorter,replace,informal,changed:result.image!==source,dimensions,unsupported:!!unsupported.image};
    });
    assert(edits.shorter.length<edits.original.length);assert.match(edits.replace,/chá especial/);assert.doesNotMatch(edits.replace,/café/);assert.match(edits.informal,/Me chama/);assert(edits.changed);assert.deepEqual(edits.dimensions,[1080,1350]);assert.equal(edits.unsupported,false);assert.equal(posts,0);assert.deepEqual(errors,[]);
    console.log('PASS: idle spotlight, movement resume, sidebar exclusion; context edits, real canvas pixel changes, 1080x1350 ad, unsupported scenery handled honestly; zero POST requests.');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
