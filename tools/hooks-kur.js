/* İSG Takip Merkezi — Git kancalarını (hooks) kur
   Kullanım:
     npm install      # "prepare" betiği sayesinde kendiliğinden çalışır
     npm run hooks    # elle çalıştırmak için

   Depoyu klonlayan herkes, bağımlılıkları kurduğunda bu kancaları otomatik alır:
     .githooks/pre-commit   → ?v= damgalarını içerik özetiyle eşitler, sözdizimi denetler
     .githooks/pre-push     → testler yeşil değilse push'u engeller
     .githooks/post-commit  → commit'i origin'e otomatik gönderir (ISG_OTOMATIK_PUSH=0 ile kapanır)
*/
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const kok = path.resolve(__dirname, '..');
const kancaDizini = '.githooks';
const kancalar = ['pre-commit', 'pre-push', 'post-commit'];

function git(args) {
  return execFileSync('git', args, { cwd: kok, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

let depoKoku;
try {
  depoKoku = git(['rev-parse', '--show-toplevel']);
} catch (hata) {
  console.log('hooks: bu klasör bir git deposu değil, kurulum atlandı.');
  process.exit(0);
}

// Klonun kökü bu proje mi? (üst depoda yanlışlıkla hooksPath değiştirmeyelim)
if (path.resolve(depoKoku) !== kok) {
  console.log('hooks: proje git deposunun kökü değil (' + depoKoku + '), kurulum atlandı.');
  process.exit(0);
}

const dizin = path.join(kok, kancaDizini);
if (!fs.existsSync(dizin)) {
  console.log('hooks: ' + kancaDizini + '/ bulunamadı, kurulum atlandı.');
  process.exit(0);
}

git(['config', 'core.hooksPath', kancaDizini]);

const kurulan = [];
for (const ad of kancalar) {
  const dosya = path.join(dizin, ad);
  if (!fs.existsSync(dosya)) { continue; }
  try { fs.chmodSync(dosya, 0o755); } catch (hata) { /* Windows'ta yetki bayrağı yok sayılır */ }
  kurulan.push(ad);
}

console.log('hooks: core.hooksPath = ' + kancaDizini + ' (' + kurulan.join(', ') + ')');
console.log('hooks: kapatmak için  git config --unset core.hooksPath');
console.log("hooks: otomatik push'u kapatmak için  ISG_OTOMATIK_PUSH=0");
