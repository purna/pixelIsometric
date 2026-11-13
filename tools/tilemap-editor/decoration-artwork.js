/* Local PNG folder gallery. Exports embed artwork, never machine-specific paths. */
(()=>{
 const $=id=>document.getElementById(id),catalog=window.BRIGHTON_TILE_CATALOG;
 let selected=null,mappings={},images=new Map(),refresh=()=>{};
 const message=text=>$('decorationImageStatus').textContent=text;
 const decode=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Could not decode PNG image'));image.src=src;});
 const read=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Could not read image'));reader.readAsDataURL(file);});
 function selection(){const tile=catalog.find(t=>t[0]+1===selected);$('removeDecorationImage').disabled=!tile||!mappings[tile[1]];return tile;}
 async function choose(files){
  $('decorationImageGallery').replaceChildren();let count=0,skipped=0;
  for(const file of Array.from(files).slice(0,256)){
   if(!/\.png$/i.test(file.name)||file.size>2*1024*1024){skipped++;continue;}
   try{
    const original=await decode(await read(file));if(original.width>512||original.height>512)throw Error('Image too large');
    const canvas=document.createElement('canvas');canvas.width=canvas.height=24;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    const scale=Math.min(24/original.width,24/original.height),w=Math.max(1,Math.round(original.width*scale)),h=Math.max(1,Math.round(original.height*scale));ctx.drawImage(original,Math.floor((24-w)/2),Math.floor((24-h)/2),w,h);
    const data=canvas.toDataURL('image/png'),image=await decode(data),button=document.createElement('button');button.type='button';button.title=`Assign ${file.name} to the selected decoration`;button.setAttribute('aria-label',`Assign ${file.name}`);
    const preview=image.cloneNode();preview.alt=file.name;button.appendChild(preview);
    button.onclick=()=>{const tile=selection();if(!tile||tile[5]!==2){message('Select a tile in the Decorations group, then choose an image.');return;}mappings[tile[1]]=data;images.set(tile[1],image);selection();refresh();message(`${file.name} assigned to ${tile[2]}. Export your edits to use it in the game.`);};
    $('decorationImageGallery').appendChild(button);count++;
   }catch{skipped++;}
  }
  message(`${count} PNG icons loaded${skipped?`; ${skipped} unsupported files skipped`:''}. Select a decoration tile, then click its image. Images are fitted to 24 × 24 pixels.`);
 }
 $('chooseDecorationFolder').onclick=()=>$('decorationFolder').click();
 $('chooseDecorationFiles').onclick=()=>$('decorationFiles').click();
 for(const id of ['decorationFolder','decorationFiles'])$(id).onchange=e=>{void choose(e.target.files);e.target.value='';};
 $('removeDecorationImage').onclick=()=>{const tile=selection();if(!tile)return;delete mappings[tile[1]];images.delete(tile[1]);selection();refresh();message(`Default artwork restored for ${tile[2]}.`);};
 window.DecorationArtwork={
  configure(callback){refresh=callback;},select(gid){selected=gid;selection();},get(name){return images.get(name);},export(){return {...mappings};},
  async restore(data={}){const next={},decoded=new Map();for(const [name,src] of Object.entries(data)){if(!catalog.some(t=>t[1]===name)||typeof src!=='string'||!src.startsWith('data:image/png;base64,')||src.length>200000)throw Error('Invalid decoration image');const image=await decode(src);if(image.width!==24||image.height!==24)throw Error('Decoration images must be 24 × 24');next[name]=src;decoded.set(name,image);}mappings=next;images=decoded;selection();}
 };
})();
