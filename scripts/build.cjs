/* Gera a versão publicada da página em dist/, sem tocar nos arquivos legíveis.
   - O CSS da página (design_system.css + pagina.css) é minificado e vai inline no <head>,
     para a primeira dobra não esperar folhas de estilo externas.
   - Os scripts são minificados em assets/min/ com um hash na URL, para o cache longo do vercel.json.
   Rodar: npm run build (a Vercel roda o mesmo comando a cada deploy). */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const hash = text => crypto.createHash('sha256').update(text).digest('hex').slice(0, 10);

function copy(from, to = from) {
  const source = path.join(root, from);
  const target = path.join(out, to);
  if (fs.statSync(source).isDirectory()) {
    for (const entry of fs.readdirSync(source)) copy(path.join(from, entry), path.join(to, entry));
    return;
  }
  fs.mkdirSync(path.dirname(target), {recursive:true});
  fs.copyFileSync(source, target);
}

fs.rmSync(out, {recursive:true, force:true});
fs.mkdirSync(out);

// Tudo o que a página e o catálogo do design system usam; testes e extras ficam de fora.
for (const file of ['404.html', 'favicon.ico', 'favicon.svg', 'apple-touch-icon.png']) copy(file);
for (const entry of fs.readdirSync(path.join(root, 'assets'))) {
  if (['qa', 'extras'].includes(entry)) continue;
  copy(path.join('assets', entry));
}

// CSS: minificado e com os caminhos relativos a assets/ reescritos para a raiz.
const css = ['assets/design_system.css', 'assets/pagina.css'].map(file => {
  const minified = esbuild.transformSync(read(file), {loader:'css', minify:true}).code;
  return minified.replace(/url\((["']?)(?!data:|https?:|\/|#)([^"')]+)\1\)/g, (match, quote, ref) => `url(${quote}assets/${ref}${quote})`);
}).join('');

// JS: minificado, com hash na URL.
const scripts = {};
for (const name of ['design_system', 'pagina']) {
  const code = esbuild.transformSync(read(`assets/${name}.js`), {loader:'js', minify:true}).code;
  const file = `assets/min/${name}.js`;
  fs.mkdirSync(path.join(out, 'assets/min'), {recursive:true});
  fs.writeFileSync(path.join(out, file), code);
  scripts[name] = `${file}?v=${hash(code)}`;
}

let html = read('index.html');
const swap = (from, to) => {
  if (html.split(from).length !== 2) throw new Error(`Trecho não encontrado no index.html: ${from}`);
  html = html.replace(from, () => to);
};
swap('  <link rel="stylesheet" href="assets/design_system.css">\n  <link rel="stylesheet" href="assets/pagina.css">\n', `  <style>${css}</style>\n`);
swap('<script src="assets/design_system.js" defer></script>', `<script src="${scripts.design_system}" defer></script>`);
swap('<script src="assets/pagina.js" defer></script>', `<script src="${scripts.pagina}" defer></script>`);
fs.writeFileSync(path.join(out, 'index.html'), html);

const size = file => (fs.statSync(path.join(out, file)).size / 1024).toFixed(1) + ' KB';
console.log(`dist/index.html ${size('index.html')} (CSS inline ${(css.length / 1024).toFixed(1)} KB)`);
for (const name of Object.keys(scripts)) console.log(`dist/assets/min/${name}.js ${size(`assets/min/${name}.js`)}`);
