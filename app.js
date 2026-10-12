/* MOGIBARA COLOR LIBRARY — color engine + page logic */

/* ---------- conversions ---------- */
function clamp(v, a, b){ return Math.min(b, Math.max(a, v)); }
function hsvToRgb(h, s, v){
  h = ((h % 360) + 360) % 360; s = clamp(s,0,100)/100; v = clamp(v,0,100)/100;
  const c = v*s, x = c*(1-Math.abs((h/60)%2-1)), m = v-c;
  let r=0,g=0,b=0;
  if (h<60){r=c;g=x;b=0;} else if (h<120){r=x;g=c;b=0;}
  else if (h<180){r=0;g=c;b=x;} else if (h<240){r=0;g=x;b=c;}
  else if (h<300){r=x;g=0;b=c;} else {r=c;g=0;b=x;}
  return { r: Math.round((r+m)*255), g: Math.round((g+m)*255), b: Math.round((b+m)*255) };
}
function hexToRgb(hex){
  hex = (hex||'').trim().replace(/^#/,'');
  if (hex.length===3) hex = hex.split('').map(c=>c+c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const num = parseInt(hex,16);
  return { r:(num>>16)&255, g:(num>>8)&255, b:num&255 };
}
function rgbToCmyk(r,g,b){
  r/=255; g/=255; b/=255;
  const k = 1-Math.max(r,g,b);
  if (k>=1) return { c:0,m:0,y:0,k:100 };
  const c = (1-r-k)/(1-k), m = (1-g-k)/(1-k), y = (1-b-k)/(1-k);
  return { c:Math.round(c*100), m:Math.round(m*100), y:Math.round(y*100), k:Math.round(k*100) };
}
function rgbToHsv(r,g,b){
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
  let h=0;
  if (d!==0){
    if (max===r) h = 60*(((g-b)/d)%6);
    else if (max===g) h = 60*((b-r)/d+2);
    else h = 60*((r-g)/d+4);
  }
  if (h<0) h+=360;
  const s = max===0 ? 0 : d/max;
  return { h: Math.round(h), s: Math.round(s*100), v: Math.round(max*100) };
}
function rgbToHsl(r,g,b){
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h=0,s=0; const l=(max+min)/2; const d = max-min;
  if (d!==0){
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    if (max===r) h = 60*(((g-b)/d)%6);
    else if (max===g) h = 60*((b-r)/d+2);
    else h = 60*((r-g)/d+4);
  }
  if (h<0) h+=360;
  return { h:Math.round(h), s:Math.round(s*100), l:Math.round(l*100) };
}
function isDark(r,g,b){ return (0.299*r + 0.587*g + 0.114*b) < 140; }

/* ---------- named colours ---------- */
const NAMED_COLORS = [
["Black","#000000"],["White","#FFFFFF"],["Red","#FF0000"],["Lime","#00FF00"],["Blue","#0000FF"],
["Yellow","#FFFF00"],["Cyan","#00FFFF"],["Magenta","#FF00FF"],["Silver","#C0C0C0"],["Gray","#808080"],
["Maroon","#800000"],["Olive","#808000"],["Green","#008000"],["Purple","#800080"],["Teal","#008080"],
["Navy","#000080"],["Orange","#FFA500"],["Pink","#FFC0CB"],["Hot Pink","#FF69B4"],["Deep Pink","#FF1493"],
["Crimson","#DC143C"],["Firebrick","#B22222"],["Dark Red","#8B0000"],["Indian Red","#CD5C5C"],
["Light Coral","#F08080"],["Salmon","#FA8072"],["Dark Salmon","#E9967A"],["Light Salmon","#FFA07A"],
["Tomato","#FF6347"],["Coral","#FF7F50"],["Orange Red","#FF4500"],["Dark Orange","#FF8C00"],
["Gold","#FFD700"],["Khaki","#F0E68C"],["Dark Khaki","#BDB76B"],["Peach Puff","#FFDAB9"],
["Moccasin","#FFE4B5"],["Sandy Brown","#F4A460"],["Goldenrod","#DAA520"],["Dark Goldenrod","#B8860B"],
["Chocolate","#D2691E"],["Peru","#CD853F"],["Sienna","#A0522D"],["Brown","#A52A2A"],["Saddle Brown","#8B4513"],
["Tan","#D2B48C"],["Wheat","#F5DEB3"],["Beige","#F5F5DC"],["Ivory","#FFFFF0"],
["Honeydew","#F0FFF0"],["Mint Cream","#F5FFFA"],["Azure","#F0FFFF"],["Alice Blue","#F0F8FF"],
["Lavender","#E6E6FA"],["Lavender Blush","#FFF0F5"],["Misty Rose","#FFE4E1"],["Snow","#FFFAFA"],
["Linen","#FAF0E6"],["Old Lace","#FDF5E6"],["Seashell","#FFF5EE"],["Cornsilk","#FFF8DC"],
["Lemon Chiffon","#FFFACD"],["Light Yellow","#FFFFE0"],["Light Goldenrod","#FAFAD2"],
["Pale Goldenrod","#EEE8AA"],["Yellow Green","#9ACD32"],["Chartreuse","#7FFF00"],["Lawn Green","#7CFC00"],
["Green Yellow","#ADFF2F"],["Spring Green","#00FF7F"],["Medium Spring Green","#00FA9A"],
["Light Green","#90EE90"],["Pale Green","#98FB98"],["Dark Sea Green","#8FBC8F"],["Sea Green","#2E8B57"],
["Medium Sea Green","#3CB371"],["Forest Green","#228B22"],["Dark Green","#006400"],["Lime Green","#32CD32"],
["Olive Drab","#6B8E23"],["Dark Olive Green","#556B2F"],["Medium Aquamarine","#66CDAA"],
["Aquamarine","#7FFFD4"],["Turquoise","#40E0D0"],["Medium Turquoise","#48D1CC"],["Dark Turquoise","#00CED1"],
["Light Sea Green","#20B2AA"],["Cadet Blue","#5F9EA0"],["Dark Cyan","#008B8B"],["Powder Blue","#B0E0E6"],
["Light Blue","#ADD8E6"],["Sky Blue","#87CEEB"],["Light Sky Blue","#87CEFA"],["Deep Sky Blue","#00BFFF"],
["Dodger Blue","#1E90FF"],["Cornflower Blue","#6495ED"],["Steel Blue","#4682B4"],["Royal Blue","#4169E1"],
["Medium Blue","#0000CD"],["Dark Blue","#00008B"],["Midnight Blue","#191970"],["Slate Blue","#6A5ACD"],
["Medium Slate Blue","#7B68EE"],["Dark Slate Blue","#483D8B"],["Light Slate Gray","#778899"],
["Slate Gray","#708090"],["Dark Slate Gray","#2F4F4F"],["Light Steel Blue","#B0C4DE"],
["Thistle","#D8BFD8"],["Plum","#DDA0DD"],["Violet","#EE82EE"],["Orchid","#DA70D6"],
["Medium Orchid","#BA55D3"],["Dark Orchid","#9932CC"],["Dark Violet","#9400D3"],["Blue Violet","#8A2BE2"],
["Medium Purple","#9370DB"],["Rebecca Purple","#663399"],["Indigo","#4B0082"],["Dark Magenta","#8B008B"],
["Pale Violet Red","#DB7093"],["Medium Violet Red","#C71585"],["Rosy Brown","#BC8F8F"],
["Light Pink","#FFB6C1"],["Gainsboro","#DCDCDC"],["Light Gray","#D3D3D3"],["Dark Gray","#A9A9A9"],
["Dim Gray","#696969"],["Charcoal","#36454F"],["Emerald","#50C878"],["Jade","#00A86B"],
["Sapphire","#0F52BA"],["Amber","#FFBF00"],["Ruby","#E0115F"],["Mint","#98FF98"],
["Peach","#FFE5B4"],["Apricot","#FBCEB1"],["Mauve","#E0B0FF"],["Burgundy","#800020"],
["Cerulean","#007BA7"],["Cobalt Blue","#0047AB"],["Mustard","#FFDB58"],["Periwinkle","#CCCCFF"],
["Antique White","#FAEBD7"],["Aqua","#00FFFF"],["Baby Blue","#89CFF0"],["Blush","#DE5D83"],
["Bronze","#CD7F32"],["Camel","#C19A6B"],["Carmine","#960018"],["Cream","#FFFDD0"],
["Denim","#1560BD"],["Flax","#EEDC82"],["Lilac","#C8A2C8"],["Ochre","#CC7722"],
["Platinum","#E5E4E2"],["Russet","#80461B"],["Scarlet","#FF2400"],["Taupe","#483C32"],
["Vermilion","#E34234"],["Wisteria","#C9A0DC"],["Fuchsia","#FF00FF"],["Rose Gold","#B76E79"]
];

/* ---------- extra generated swatches across the hue wheel, so the
   library has as many colours as possible. Unnamed ones fall back
   to their own HEX code as the display name. ---------- */
function buildExtraSwatches(){
  const out = [];
  const shades = [86, 68, 50, 32];
  for (let hue = 0; hue < 360; hue += 15){
    shades.forEach(v => {
      const rgb = hsvToRgb(hue, 68, v);
      const hex = ('#'+[rgb.r,rgb.g,rgb.b].map(n=>n.toString(16).padStart(2,'0')).join('')).toUpperCase();
      out.push([hex, hex]);
    });
  }
  return out;
}
const ALL_COLORS = NAMED_COLORS.concat(buildExtraSwatches());

/* ---------- toast + copy ---------- */
function toast(msg){
  let t = document.getElementById('mgToast');
  if (!t){ t = document.createElement('div'); t.id='mgToast'; t.className='mg-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 1400);
}
function copyText(text, label){
  const done = () => toast((label ? label + ' ' : '') + 'Copied!');
  if (navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(text).then(done).catch(()=>fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}
function fallbackCopy(text, done){
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch(e){}
  document.body.removeChild(ta);
  done();
}

/* ================= page logic ================= */
const grid = document.getElementById('grid');
const countEl = document.getElementById('count');

/* each colour's searchable text covers its name, hex, rgb(), cmyk(), hsv(), hsl() —
   so typing "#3fa7d6" matches hex, "rgb(11" matches rgb, "hsl(198" matches hsl, etc. */
function searchText(name, hex){
  const rgb = hexToRgb(hex);
  const c = rgbToCmyk(rgb.r, rgb.g, rgb.b);
  const v = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const l = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return [
    name, hex,
    `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    `cmyk(${c.c}%, ${c.m}%, ${c.y}%, ${c.k}%)`,
    `hsv(${v.h}°, ${v.s}%, ${v.v}%)`,
    `hsl(${l.h}°, ${l.s}%, ${l.l}%)`
  ].join(' ').toLowerCase();
}

function buildGrid(list){
  grid.innerHTML = '';
  const frag = document.createDocumentFragment();
  list.forEach(([name, hex]) => {
    const rgb = hexToRgb(hex);
    const tile = document.createElement('div');
    tile.className = 'color-tile';
    tile.style.background = hex;
    tile.innerHTML = `<div class="tile-name" style="color:${isDark(rgb.r,rgb.g,rgb.b) ? '#fff' : '#111'}">${name}</div>`;
    tile.addEventListener('click', () => openModal(name, hex));
    frag.appendChild(tile);
  });
  grid.appendChild(frag);
  countEl.textContent = list.length + ' colours';
}

buildGrid(ALL_COLORS);

document.getElementById('search').addEventListener('input', (e)=>{
  const q = e.target.value.trim().toLowerCase();
  buildGrid(q ? ALL_COLORS.filter(([n,h]) => searchText(n,h).includes(q)) : ALL_COLORS);
});

/* ---- modal ---- */
const backdrop = document.getElementById('modalBackdrop');

function openModal(name, hex){
  const rgb = hexToRgb(hex);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  document.getElementById('modalSwatch').style.background = hex;
  document.getElementById('modalTitle').textContent = name;
  document.getElementById('mHex').value = hex.toUpperCase();
  document.getElementById('mRgb').value = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  document.getElementById('mCmyk').value = `${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`;
  document.getElementById('mHsv').value = `${hsv.h}°, ${hsv.s}%, ${hsv.v}%`;
  document.getElementById('mHsl').value = `${hsl.h}°, ${hsl.s}%, ${hsl.l}%`;
  document.getElementById('mOpenPicker').href = '../picker/index.html?hex=' + hex.replace('#','');

  backdrop.classList.add('show');
}
document.getElementById('modalClose').addEventListener('click', ()=> backdrop.classList.remove('show'));
backdrop.addEventListener('click', (e)=>{ if (e.target===backdrop) backdrop.classList.remove('show'); });

document.querySelectorAll('[data-mcopy]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const type = btn.dataset.mcopy;
    const map = { hex:'mHex', rgb:'mRgb', cmyk:'mCmyk', hsv:'mHsv', hsl:'mHsl' };
    copyText(document.getElementById(map[type]).value, type.toUpperCase());
  });
});

/* ---- scroll buttons ---- */
document.getElementById('toTop').addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
document.getElementById('toBottom').addEventListener('click', ()=> window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'}));
