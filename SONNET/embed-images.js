// embed-images.js
// Descarga las 19 imágenes que el HTML referencia desde Figma y las convierte
// a base64, incrustándolas directamente en el archivo. Después de esto, el
// archivo ya no depende de ningún link externo — nunca se va a romper.

const fs = require('fs');
const https = require('https');

const HTML_FILE = 'sonnet-product-page.html';       // el archivo que ya tienes
const OUTPUT_FILE = 'sonnet-product-page-final.html'; // el archivo nuevo, ya arreglado

function fetchAsBase64(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Error ${res.statusCode} al descargar la imagen`));
        return;
      }
      const contentType = res.headers['content-type'] || 'image/png';
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString('base64');
        resolve(`data:${contentType};base64,${base64}`);
      });
    }).on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(HTML_FILE)) {
    console.log(`No encuentro el archivo "${HTML_FILE}" en esta carpeta.`);
    console.log('Asegúrate de que este script y el HTML estén en la misma carpeta.');
    return;
  }

  let html = fs.readFileSync(HTML_FILE, 'utf-8');

  const regex = /https:\/\/www\.figma\.com\/api\/mcp\/asset\/[a-f0-9-]+/g;
  const urls = [...new Set(html.match(regex) || [])];

  if (urls.length === 0) {
    console.log('No encontré ninguna imagen de Figma en el archivo. ¿Ya estará arreglado?');
    return;
  }

  console.log(`Encontré ${urls.length} imágenes. Descargando una por una...\n`);

  let ok = 0;
  let fallidas = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    process.stdout.write(`  [${i + 1}/${urls.length}] ... `);
    try {
      const dataUri = await fetchAsBase64(url);
      html = html.split(url).join(dataUri);
      console.log('lista ✓');
      ok++;
    } catch (err) {
      console.log('ERROR:', err.message);
      fallidas++;
    }
  }

  fs.writeFileSync(OUTPUT_FILE, html, 'utf-8');

  console.log(`\n${ok} imágenes incrustadas correctamente.`);
  if (fallidas > 0) console.log(`${fallidas} fallaron — revisa el mensaje de error de cada una.`);
  console.log(`\nArchivo final guardado como: ${OUTPUT_FILE}`);
  console.log('Ese es el que subes a GitHub — ya no depende de ningún link externo.');
}

main();
