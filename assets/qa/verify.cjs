/* DOM/asset verification, not a replacement for a visual browser review.
   Run: node assets/qa/verify.cjs (requires linkedom in qa/runtime). */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {parseHTML} = require('./runtime/node_modules/linkedom');
const base = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(base, 'design_system.html'), 'utf8');
const {document, window} = parseHTML(source);
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const report = [];
const check = (label, action) => { action(); report.push(`PASS ${label}`); };

check('Unique IDs and valid anchors, SVG references and accessible descriptions', () => {
  const ids = $$('[id]').map(el => el.id);
  assert.equal(ids.length, new Set(ids).size);
  for (const el of $$('[href^="#"]')) assert.ok(document.getElementById(el.getAttribute('href').slice(1)), el.outerHTML);
  for (const el of $$('[aria-controls], [aria-describedby], [aria-labelledby]')) {
    for (const attr of ['aria-controls', 'aria-describedby', 'aria-labelledby']) {
      for (const id of (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean)) assert.ok(document.getElementById(id), `${attr}: ${id}`);
    }
  }
});
check('Every linked local asset and all four local font files exist', () => {
  for (const el of $$('[src],link[href]')) {
    const ref = el.getAttribute('src') || el.getAttribute('href');
    if (!/^(https?:|data:|#)/.test(ref)) assert.ok(fs.existsSync(path.join(base, ref)), ref);
  }
  for (const font of fs.readdirSync(path.join(base, 'fonts')).filter(name=>name.endsWith('.woff2'))) assert.equal(fs.readFileSync(path.join(base, 'fonts', font)).subarray(0,4).toString(), 'wOF2');
  const css = fs.readFileSync(path.join(base, 'design_system.css'),'utf8');
  for (const [,ref] of css.matchAll(/url\("([^"\n]+)"\)/g)) if (!ref.startsWith('data:')) assert.ok(fs.existsSync(path.join(base,ref)),ref);
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
  assert.ok(css.includes('-webkit-text-fill-color:transparent'));
});
check('Labels and non-submit demo controls have accessible names', () => {
  for (const input of $$('input,textarea,select')) assert.ok(document.querySelector(`label[for="${input.id}"]`) || input.closest('label'), input.id);
  for (const button of $$('button')) assert.ok(button.textContent.trim() || button.getAttribute('aria-label'), button.outerHTML);
  for (const image of $$('img')) assert.ok(image.hasAttribute('alt'), image.outerHTML);
});

check('Cream, forest and navy reading pairs meet AA; colored folds alternate with paper', () => {
  const css=fs.readFileSync(path.join(base,'design_system.css'),'utf8');
  const tokens=Object.fromEntries([...css.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})\b/gi)].map(m=>[m[1],m[2]]));
  const luminance=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const ratio=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
  for(const [fg,bg] of [
    [tokens['--ink'],tokens['--paper']],
    [tokens['--ink-mute'],tokens['--paper']],
    [tokens['--primary-hover'],tokens['--paper']],
    [tokens['--paper'],tokens['--forest']],
    [tokens['--paper'],tokens['--secondary']],
    [tokens['--accent'],tokens['--forest']],
    [tokens['--accent'],tokens['--secondary']],
    ['#E9E3D5',tokens['--forest']],
    ['#E9E3D5',tokens['--secondary']],
    ['#FFFFFF',tokens['--primary']]
  ]) assert.ok(ratio(fg,bg)>=4.5,`${fg} / ${bg}: ${ratio(fg,bg)}`);
  assert.ok(ratio(tokens['--line-strong'],tokens['--paper'])>=3);
  const sections=$$('main > section');
  assert.equal(sections.filter(el=>el.classList.contains('section-dark')).length,4);
  sections.forEach((el,i)=>assert.ok(el.classList.contains(i%2?'section-dark':'section-cream')));
  assert.ok($('.section-forest .lettering-transparent'));
  assert.ok($('.section-navy .lettering-transparent'));
  assert.ok(!source.includes('60 / 25 / 10 / 5'));
});

// A DOM-only harness: native focus, dialog, media queries and input validity
// are represented by minimal adapters. Browser rendering is not simulated.
const clipboard = [];
const media = {matches:false, addEventListener() {}};
const observers = [];
class Observer { constructor(cb) { this.cb=cb; this.targets=[]; observers.push(this); } observe(el) { this.targets.push(el); } unobserve() {} disconnect() {} }
window.IntersectionObserver = Observer;
window.HTMLElement.prototype.focus = function() { document._active = this; };
Object.defineProperty(document, 'activeElement', {get:() => document._active || document.body});
for (const input of $$('input')) input.checkValidity = function() {
  if (this.type === 'checkbox') return !!this.checked;
  if (this.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value);
  return !this.required || !!this.value;
};
const modal = $('#welcome-modal');
modal.showModal = () => modal.setAttribute('open','');
modal.close = () => { modal.removeAttribute('open'); modal.dispatchEvent(new window.Event('close')); };
const context = vm.createContext({
  document, window, navigator:{clipboard:{writeText:async text => clipboard.push(text)}},
  matchMedia:query => query.includes('pointer:fine') ? {matches:true} : media,
  IntersectionObserver:Observer, HTMLElement:window.HTMLElement,
  requestAnimationFrame:cb => cb(), addEventListener:window.addEventListener.bind(window),
  innerWidth:1440, innerHeight:900, scrollY:0, setTimeout:() => 1, clearTimeout() {}, console
});
window.isSecureContext = true;
const script = fs.readFileSync(path.join(base,'design_system.js'),'utf8');
vm.runInContext(script, context, {filename:'design_system.js'});
const emit = (el, type, props={}) => { const event = new window.Event(type, {bubbles:true,cancelable:true}); Object.assign(event,props); el.dispatchEvent(event); };

check('Catalogue boots: 16 text roles, 14 colors, 8 full component specs, 12 icons', () => {
  assert.equal($$('#type-rows tr').length, 16);
  assert.equal($$('#color-grid .ds-sw').length, 14);
  assert.equal($$('.component-spec').length, 8);
  assert.equal($$('#icon-grid button').length, 12);
  assert.equal($$('.section-ribbon').length, $$('.section').length);
});
check('Reveal observer exposes entered content', () => {
  const observer = observers[0];
  observer.cb(observer.targets.map(target => ({target,isIntersecting:true})));
  assert.equal($$('[data-reveal]:not([data-revealed])').length,0);
});
check('Typography editor and range update safely as text', () => {
  $('#type-preview').value='<img src=x> Olá!'; emit($('#type-preview'),'input');
  assert.equal($('#type-live').textContent,'<img src=x> Olá!');
  assert.equal($('#type-live').children.length,0);
  $('#type-size').value='72';emit($('#type-size'),'input');
  assert.equal($('#type-live').style.fontSize,'72px');
  emit($('[data-reset-type]'),'click');
  assert.equal($('#type-live').textContent,'Que bom ter você aqui.');
  assert.equal($('#type-size').value,'54');
});
check('Form rejects empty/malformed values, focuses invalid field, accepts valid values locally', () => {
  emit($('#demo-form'),'submit');
  assert.equal($('#demo-name').getAttribute('aria-invalid'),'true');
  assert.equal($('#demo-email').getAttribute('aria-invalid'),'true');
  assert.equal(document.activeElement,$('#demo-name'));
  $('#demo-name').value='Lia';$('#demo-email').value='lia@';emit($('#demo-form'),'submit');
  assert.equal($('#demo-email').getAttribute('aria-invalid'),'true');
  $('#demo-email').value='lia@exemplo.com';$('#demo-check').checked=true;emit($('#demo-form'),'submit');
  assert.ok($('#form-feedback').textContent.includes('Lia'));
  assert.ok($('#form-feedback').textContent.includes('Nenhum dado foi enviado'));
  assert.equal($('#demo-email').getAttribute('aria-invalid'),'false');
});
check('Tabs support click, arrow keys, selection and panel association', () => {
  const tabs=$$('.sample-links button');
  emit(tabs[1],'click');assert.equal(tabs[1].getAttribute('aria-selected'),'true');
  assert.equal($('#nav-panel').getAttribute('aria-labelledby'),tabs[1].id);
  emit(tabs[1],'keydown',{key:'ArrowRight'});
  assert.equal(tabs[2].getAttribute('aria-selected'),'true');
  assert.equal(document.activeElement,tabs[2]);
  emit(tabs[2],'keydown',{key:'Home'});assert.equal(tabs[0].getAttribute('aria-selected'),'true');
});
check('Modal opens, locks background scroll, closes and restores the opener focus', () => {
  const opener=$('[data-open-modal]');emit(opener,'click');assert.ok(modal.hasAttribute('open'));
  assert.ok(document.documentElement.classList.contains('modal-open'));
  emit($('[data-close-modal]'),'click');assert.ok(!modal.hasAttribute('open'));
  assert.ok(!document.documentElement.classList.contains('modal-open'));
  assert.equal(document.activeElement,opener);
});
check('Mobile menu semantics and Escape close state', () => {
  const button=$('[data-nav-toggle]');emit(button,'click');
  assert.equal(button.getAttribute('aria-expanded'),'true');
  emit(document,'keydown',{key:'Escape'});
  assert.equal(button.getAttribute('aria-expanded'),'false');
  assert.equal(document.activeElement,button);
});
check('Word card, favorite and tooltip actions respond', () => {
  emit($('#word-button'),'click');assert.equal($('.word-of-day em').textContent,'saudade');
  emit($('[data-like]'),'click');assert.equal($('[data-like]').getAttribute('aria-pressed'),'true');
  const tip=$('.tooltip');emit($('button',tip),'click');assert.ok(tip.classList.contains('is-open'));
  emit($('button',tip),'click');assert.ok(!tip.classList.contains('is-open'));assert.ok(tip.classList.contains('is-dismissed'));
  emit($('button',tip),'click');assert.ok(tip.classList.contains('is-open'));
  emit(document,'keydown',{key:'Escape'});assert.ok(tip.classList.contains('is-dismissed'));assert.ok(!tip.classList.contains('is-open'));
});
check('Pause control stops decoration and exposes its pressed state', () => {
  emit($('#motion-toggle'),'click');
  assert.ok(document.documentElement.classList.contains('motion-paused'));
  assert.equal($('#motion-toggle').getAttribute('aria-pressed'),'true');
  emit($('#motion-toggle'),'click');
  assert.ok(!document.documentElement.classList.contains('motion-paused'));
});
check('Generated IDs, SVGs and descriptions still resolve after all interactions', () => {
  for (const el of $$('use[href^="#"]')) assert.ok(document.getElementById(el.getAttribute('href').slice(1)));
  const ids=$$('[id]').map(el=>el.id);assert.equal(ids.length,new Set(ids).size);
});
async function finish() {
  emit($('[data-copy]'),'click');
  emit($('[data-copy-icon]'),'click');
  await new Promise(resolve=>setImmediate(resolve));
  check('Copy buttons emit the selected hex and a standalone SVG',()=>{assert.equal(clipboard[0],'#00854A');assert.ok(clipboard[1].startsWith('<svg xmlns='));assert.ok(clipboard[1].includes('<rect'));});
  const output=`${report.join('\n')}\n\n${report.length} checks passed.\nBrowser rendering, native validation and native dialog focus-trapping were not tested in this DOM-only environment.\n`;
  fs.writeFileSync(path.join(__dirname,'verification.txt'),output);
  console.log(output);
}
finish().catch(e=>{console.error(e);process.exitCode=1;});
