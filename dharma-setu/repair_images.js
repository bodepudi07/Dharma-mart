import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';

function wikiUrl(filename) {
  const md5 = createHash('md5').update(filename).digest('hex');
  return `https://upload.wikimedia.org/wikipedia/commons/${md5[0]}/${md5.slice(0,2)}/${filename}`;
}

const PLACEHOLDER = 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Brihadeeswarar_Temple_Thanjavur.jpg';
const KASHI_PLACEHOLDER = 'https://upload.wikimedia.org/wikipedia/commons/2/29/Kashi_Vishwanath_Temple_Banaras.jpg';

// Temple ID -> correct Wikimedia Commons filename
const templeImageMap = {
  1:   'Mahakaleshwar_Temple_Ujjain.jpg',
  2:   'Somnath_temple_2024-1.jpg',
  3:   'Baidyanath_temple.jpg',
  5:   'Omkareshwar.jpg',
  6:   'Bhimashankar_temple_01.jpg',
  7:   'Srisailam_temple_view.jpg',
  8:   'Trimbakeshwar_Shiva_Temple,_Trimbak.jpg',
  9:   'Nageshwar_Jyotirlinga_temple.jpg',
  10:  'Kedarnath_Temple_-_October_2022.jpg',
  11:  'Rameswaram_Temple.jpg',
  12:  'Ghrishneshwar_temple_front_view.jpg',
  13:  'Badrinath_Temple,_Uttarakhand.jpg',
  15:  'Dwarkadhish_Temple.jpg',
  19:  'Harsiddhi_temple_Ujjain.jpg',
  105: 'Hinglaj_Mata_temple.jpg',
  106: 'Kamakhya_Temple.jpg',
  107: 'Jwala_Ji_Temple.jpg',
  108: 'Kalighat_Kali_Temple.jpg',
  111: 'Dwarka_Sharada_Peetham.jpg',
  112: 'Govardhan_Math.jpg',
  113: 'Guruvayur_Temple.jpg',
  114: 'Jyotir_Math.jpg',
  115: 'Krishna_Janmabhoomi.jpg',
  117: 'Padmanabhaswamy_Temple.jpg',
  118: 'Prem_Mandir_-_Vrindavan_2013-02-22_4800.jpg',
  119: 'Shankaranarayanan_Temple.jpg',
  120: 'Ramanathaswamy_Temple_Rameswaram.jpg',
  122: 'Kamakshi_Amman_Temple.jpg',
  123: 'Jogulamba_Temple.jpg',
  124: 'Pashupatinath_Temple_Kathmandu.jpg',
  125: 'Kanchi_Kamakoti_Peetham.jpg',
  126: 'Ambaji_temple_Gujarat.jpg',
  127: 'Konark_Sun_Temple.jpg',
  128: 'Ranakpur_Jain_Temple.jpg',
  129: 'Vaishno_Devi_Temple.jpg',
  130: 'Vindhyachal_Temple.jpg',
  132: 'Chandranath_Temple.jpg',
  133: 'Arunachalesvara_temple.jpg',
  134: 'Jambukeswarar_Temple_Thiruvanaikaval.jpg',
  135: 'Ekambareswarar_Temple.jpg',
  136: 'Srikalahasti_temple_1.jpg',
  137: 'Nataraja_temple.jpg',
  139: 'Gangotri_Temple_2013.jpg',
  140: 'Yamunotri_temple.jpg',
  142: 'Amarnath_Temple.jpg',
};

// ---- Fix temple images ----
const dataDir = './frontend/public/data/';

const temples = JSON.parse(readFileSync(dataDir + 'temples.json', 'utf-8'));
let fixedCount = 0;
temples.forEach(t => {
  if (templeImageMap[t.id]) {
    const newUrl = wikiUrl(templeImageMap[t.id]);
    if (t.imageUrl === PLACEHOLDER || t.imageUrl === KASHI_PLACEHOLDER) {
      t.imageUrl = newUrl;
      fixedCount++;
    }
  }
});
writeFileSync(dataDir + 'temples.json', JSON.stringify(temples, null, 2));
console.log(`Fixed ${fixedCount} temple images.`);

// ---- Also fix backend temples.json ----
const backendTemples = JSON.parse(readFileSync('./backend/database/temples.json', 'utf-8'));
let backendFixed = 0;
backendTemples.forEach(t => {
  if (templeImageMap[t.id]) {
    const newUrl = wikiUrl(templeImageMap[t.id]);
    if (t.imageUrl === PLACEHOLDER || t.imageUrl === KASHI_PLACEHOLDER) {
      t.imageUrl = newUrl;
      backendFixed++;
    }
  }
});
writeFileSync('./backend/database/temples.json', JSON.stringify(backendTemples, null, 2));
console.log(`Fixed ${backendFixed} backend temple images.`);

console.log('Done! Temple images updated.');
