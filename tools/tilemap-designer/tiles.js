/* Generated from the tile designer. */
(()=>{const TS=32;let cache={},cn=0;
const mk=(l,c,n,a,b,o)=>Object.assign({l,c,n,a,b,sm:0,s:0,d:0,sp:6,dn:50,vr:1,pr:0,bl:0,w:0,tr:0},o||{});
const DEF=[
// 0 background: priority decides who bleeds onto whom (higher bleeds over lower)
mk(0,'S','Sea','#1d5f8a','#14456a',{d:12,sp:8,dn:50,vr:2,w:1,pr:0}),
mk(0,'~','Waves','#2a7fb0','#1d5f8a',{d:5,dn:40,vr:3,w:1,pr:1,bl:6}),
mk(0,':','Pebble beach','#a8957a','#8a7860',{d:1,sp:4,dn:55,vr:4,pr:3,bl:8}),
mk(0,'=','Promenade','#7d8794','#646d79',{d:14,sp:8,vr:2,pr:5,bl:4}),
mk(0,'r','Road','#3b3f47','#2e3138',{d:6,dn:30,vr:3,pr:4}),
mk(0,'g','Grass','#3f7a4a','#2f5f39',{d:1,sp:4,dn:50,vr:4,pr:6,bl:8}),
// 1 middleground
mk(1,'H','House footprint','#c9b79c','#9a8468',{sm:5,d:6,dn:20}),
mk(1,'A','Arcade','#c94b6e','#8d2f4a',{sm:5,d:11,dn:35}),
mk(1,'i','i360 tower','#9fb3c8','#6c829a',{sm:6,d:7,sp:6}),
mk(1,'K','Kiosk','#e0b23e','#a8801f',{sm:5,d:2,sp:6}),
mk(1,'p','Pier deck','#8b6b4a','#6a4f35',{d:16,sp:8,vr:2}),
mk(1,'y','Playground','#d9703a','#a9531f',{d:1,sp:4,vr:3}),
// 2 foreground objects
mk(2,'T','Tree','#2f8f4e','#1f6a37',{sm:6,d:1,sp:4}),mk(2,'B','Bench','#8b5a2b','#5f3d1c',{d:16,sp:4}),mk(2,'C','Car / truck','#c0392b','#8a281d',{sm:5}),
mk(2,'L','Lamp post','#f1d36b','#b39a3c',{sm:6}),mk(2,'X','Crossing','#e8e8e8','#222222',{d:2,sp:8}),mk(2,'b','Bin','#4a5560','#323a42',{sm:6}),
// 3 collectables
mk(3,'f','Good friend','#3ecfb2','#2a9a84',{sm:6}),mk(3,'s','Spam filter','#e0b23e','#a8801f',{sm:6}),mk(3,'l','App lock','#9b7bd4','#6e52a6',{sm:6}),mk(3,'p','Phone shield','#4ea0e8','#2f74b4',{sm:6}),
// 4 npcs
mk(4,'1','Apex Aaron','#c94b6e','#8d2f4a',{sm:6}),mk(4,'2','Eco-Viral Vault','#e0b23e','#a8801f',{sm:6}),mk(4,'3','Shadow_K','#7a5cc9','#523b94',{sm:6}),mk(4,'4','Freebies Frank','#e8833a','#b35a1c',{sm:6}),
mk(4,'G','Seagull','#f2f2f2','#c8c8c8',{sm:6}),mk(4,'P','Police van','#3a6fd1','#254a94',{sm:5}),mk(4,'A','Ambulance','#e8e8e8','#d12f2f',{sm:5}),mk(4,'F','Fire engine','#d12f2f','#8f1f1f',{sm:5}),
// 5 colliders
mk(5,'#','Solid boundary','#e04a4a','#a02f2f',{d:7,sp:6}),mk(5,'T','Dialogue trigger','#3ecfb2','#2a9a84',{sm:5}),mk(5,'D','Death / water hazard','#4a7bd1','#2f5299',{d:12,sp:8}),
// ---- appended (ids 34+) ----
mk(0,'n','Sand','#d8c391','#b9a370',{d:6,dn:30,vr:4,pr:2,bl:9}),
mk(0,'w','Shallow water','#4aa3c8','#2a7fb0',{d:12,sp:8,dn:50,vr:2,w:1,pr:1,bl:7}),
mk(0,'-','Dirt path','#b08d5f','#8f6f45',{d:1,sp:4,dn:45,vr:4,pr:5,bl:5}),
// 6 walls
mk(6,'W','Brick wall','#a8553f','#7e3a2a',{d:13,sp:8,vr:2}),mk(6,'P','Pastel render','#e6a5b5','#c98799',{d:6,dn:25,vr:2}),
mk(6,'R','White render','#e8e2d4','#cfc8b6',{d:6,dn:20,vr:3}),mk(6,'F','Flint / stone','#7d7f7a','#5f625d',{d:14,sp:8,vr:3}),
mk(6,'G','Glass shopfront','#7fc4d6','#4f93a8',{sm:3,d:7,sp:8}),mk(6,'N','Window','#9fd0e8','#6b8fa0',{sm:5,d:7,sp:6}),
mk(6,'D','Door','#7a4a2a','#4f2f18',{sm:5,d:16,sp:4}),mk(6,'V','Pillar','#5e5e66','#46464d',{sm:5}),
// 7 pitched roofs (split = ridge line)
mk(7,'h','Red tile ridge ─','#c0553b','#8f3b27',{sm:1,d:15,sp:8,vr:2}),mk(7,'v','Red tile ridge │','#c0553b','#8f3b27',{sm:2,d:15,sp:8,vr:2}),
mk(7,'/','Red tile hip ╱','#c0553b','#8f3b27',{sm:4,d:15,sp:8}),mk(7,'\\','Red tile hip ╲','#c0553b','#8f3b27',{sm:3,d:15,sp:8}),
mk(7,'H','Slate ridge ─','#5b6577','#3f4757',{sm:1,d:15,sp:8,vr:2}),mk(7,'V','Slate ridge │','#5b6577','#3f4757',{sm:2,d:15,sp:8,vr:2}),
mk(7,'X','Slate hip ╱','#5b6577','#3f4757',{sm:4,d:15,sp:8}),mk(7,'Z','Slate hip ╲','#5b6577','#3f4757',{sm:3,d:15,sp:8}),
mk(7,'t','Thatch','#c9a95a','#8f7a3c',{d:7,sp:4,vr:3}),
// 8 flat roofs (frame = parapet)
mk(8,'f','Flat roof (felt)','#5d6068','#44464c',{sm:5,s:-30,d:6,dn:30,vr:2}),mk(8,'g','Gravel roof','#8a8780','#6a6862',{d:1,sp:4,dn:55,vr:4}),
mk(8,'l','Metal seam roof','#8ea0ab','#6c7d88',{sm:5,s:-35,d:3,sp:8}),mk(8,'p','Green roof','#6a9a52','#4d7a3a',{d:1,sp:4,dn:60,vr:4}),
mk(8,'v','Roof vent','#b8bcc4','#8b9099',{sm:6}),mk(8,'k','Skylight','#9fd8e8','#6aa3b8',{sm:5,d:7,sp:8}),
mk(8,'s','Solar panels','#2c3f6b','#1c2a4a',{sm:5,s:-40,d:4,sp:8}),
mk(7,'u','Red slope (lit)','#d0674d','#a24630',{d:15,sp:8,vr:2}),mk(7,'d','Red slope (dark)','#9c3f2a','#7a2e1d',{d:15,sp:8,vr:2}),
mk(7,'U','Slate slope (lit)','#6c7790','#4d586e',{d:15,sp:8,vr:2}),mk(7,'D','Slate slope (dark)','#454f63','#323a4a',{d:15,sp:8,vr:2}),
// ---- surfaces (bg) ----
mk(0,'o','Cobbles (grey)','#8a8e94','#676b72',{d:14,sp:8,vr:3,pr:5,bl:3}),
mk(0,'O','Cobbles (warm)','#a89880','#7f7260',{d:14,sp:6,vr:3,pr:5,bl:3}),
mk(0,'k','Red brick paving','#a85a45','#7a3d2e',{d:13,sp:8,vr:2,pr:5,bl:3}),
mk(0,'q','Block paving','#b9aaa6','#8f8380',{d:13,sp:12,vr:2,pr:5,bl:3}),
mk(0,'t','Tarmac','#2f3238','#23252a',{d:6,dn:18,vr:3,pr:4}),
mk(0,'T','Tarmac (worn)','#464a52','#33363c',{d:6,dn:38,vr:3,pr:4}),
mk(0,'P','Paving slabs','#b5b8bd','#8f9399',{d:14,sp:16,vr:2,pr:5,bl:2}),
mk(0,'m','Gravel path','#c4b494','#9d8f72',{d:5,dn:45,vr:4,pr:5,bl:4}),
mk(0,'e','Decking / boardwalk','#9a7650','#6f5436',{d:16,sp:8,vr:2,pr:5,bl:2}),
mk(0,'a','Pond water','#3f7f9f','#2f6483',{d:12,sp:8,vr:2,w:1,pr:2,bl:5}),
mk(0,'A','Pond rim (stone)','#8d9096','#6a6d73',{d:14,sp:8,vr:2,pr:5,bl:2}),
mk(0,'f','Flowers: pink','#3f7a4a','#e06b9a',{d:17,sp:6,dn:60,vr:4,pr:7,bl:4}),
mk(0,'y','Flowers: yellow','#3f7a4a','#f2d03b',{d:17,sp:6,dn:60,vr:4,pr:7,bl:4}),
mk(0,'v','Flowers: violet','#3f7a4a','#9b7bd4',{d:17,sp:6,dn:60,vr:4,pr:7,bl:4}),
mk(0,'W','Flowers: white daisies','#3f7a4a','#f4f4f0',{d:17,sp:6,dn:60,vr:4,pr:7,bl:4}),
mk(0,'x','Flowers: red poppies','#3f7a4a','#d6453a',{d:17,sp:6,dn:60,vr:4,pr:7,bl:4}),
mk(0,'h','Hedge','#2c6b3a','#1f4f2b',{d:1,sp:3,dn:65,vr:4,pr:8,bl:3}),
mk(0,'G','Cycle lane (green)','#3f8f5a','#2f6f45',{d:6,dn:25,vr:3,pr:5,bl:2}),
// ---- decals (layer 9, see-through): markings, railings ----
mk(9,'-','Dashed white ─','#000000','#f2f2f2',{sm:10,tr:1}),
mk(9,'|','Dashed white │','#000000','#f2f2f2',{sm:11,tr:1}),
mk(9,'c','Solid white ─','#000000','#f2f2f2',{sm:7,tr:1}),
mk(9,'C','Solid white │','#000000','#f2f2f2',{sm:8,tr:1}),
mk(9,'y','Double yellow ═','#000000','#e8c43a',{sm:12,tr:1,s:-20}),
mk(9,'Y','Double yellow ║','#000000','#e8c43a',{sm:13,tr:1,s:-20}),
mk(9,'z','Zebra (road runs ─)','#000000','#f2f2f2',{sm:15,tr:1}),
mk(9,'Z','Zebra (road runs │)','#000000','#f2f2f2',{sm:14,tr:1}),
mk(9,'p','Parking bay','#000000','#f2f2f2',{sm:5,tr:1,s:-40}),
mk(9,'B','Yellow box','#000000','#e8c43a',{sm:5,tr:1,s:-40}),
mk(9,'m','Manhole cover','#5a5d63','#000000',{sm:6,tr:2,d:4,sp:6,s:0}),
mk(9,'^','Railing top (navy)','#000000','#2d3a4a',{sm:16,tr:1,s:-10,d:10,sp:8}),
mk(9,'v','Railing bottom (navy)','#000000','#2d3a4a',{sm:17,tr:1,s:-10,d:10,sp:8}),
mk(9,'<','Railing left (navy)','#000000','#2d3a4a',{sm:18,tr:1,s:-10,d:10,sp:8}),
mk(9,'>','Railing right (navy)','#000000','#2d3a4a',{sm:19,tr:1,s:-10,d:10,sp:8}),
mk(9,'1','Railing corner TL','#000000','#2d3a4a',{sm:20,tr:1,s:-30,d:10,sp:8}),
mk(9,'2','Railing corner TR','#000000','#2d3a4a',{sm:21,tr:1,s:-30,d:10,sp:8}),
mk(9,'3','Railing corner BL','#000000','#2d3a4a',{sm:22,tr:1,s:-30,d:10,sp:8}),
mk(9,'4','Railing corner BR','#000000','#2d3a4a',{sm:23,tr:1,s:-30,d:10,sp:8}),
mk(9,'a','Pier rail top (white)','#000000','#eceff1',{sm:16,tr:1,s:-30,d:10,sp:8}),
mk(9,'b','Pier rail bottom (white)','#000000','#eceff1',{sm:17,tr:1,s:-30,d:10,sp:8}),
mk(9,'e','Pier rail left (white)','#000000','#eceff1',{sm:18,tr:1,s:-30,d:10,sp:8}),
mk(9,'f','Pier rail right (white)','#000000','#eceff1',{sm:19,tr:1,s:-30,d:10,sp:8}),
// ---- objects ----
mk(2,'i','Bicycle','#3ecfb2','#1f8a76',{sm:2,d:2,sp:4}),
mk(2,'k','Bike rack','#9aa4ae','#6c7782',{sm:2,d:3,sp:4}),
mk(2,'P','Planter (flowers)','#c0553b','#e06b9a',{sm:6,d:17,sp:4,dn:70}),
mk(2,'H','Beach hut','#e6a5b5','#c98799',{sm:1,d:2,sp:6}),
mk(2,'u','Parasol','#e84a5f','#f2f2f2',{sm:6,d:4,sp:6}),
mk(4,'c','Cyclist','#e8833a','#b35a1c',{sm:2})
];

// Shared map-overlay colours: soft pale terrain, dark solid rooftops.
for(const t of DEF){
 if(t.l===0){
  const water=/sea|waves|water/i.test(t.n),grass=/grass|hedge|cycle/i.test(t.n);
  const flower=t.n.startsWith('Flowers:');
  if(!flower)t.a=water?(t.n==='Sea'?'#66b9df':'#85c6e6'):grass?'#b9d4aa':t.n==='Road'?'#d2d6ce':t.n==='Pebble beach'?'#f9f1d9':'#e8ebdf';
  if(!flower)t.b=water?'#5aa6c9':grass?'#a6c797':'#c9cebf';t.bl=Math.max(6,t.bl);t.dn=Math.min(25,t.dn);
 }
 if([1,6,7,8].includes(t.l)&&!['Pier deck','Playground'].includes(t.n)){
  t.a=t.n.includes('Red')?'#b65a43':'#596773';t.b=t.n.includes('Red')?'#793b30':'#394754';t.bl=0;
 }
}


// Park artwork variants: stable appended tile positions.
DEF.push(
mk(2,"\u0391","Bush: round",'#4f7650','#31553c'),
mk(2,"\u0392","Bush: sage",'#4f7650','#31553c'),
mk(2,"\u0393","Bush: dark leafy",'#4f7650','#31553c'),
mk(2,"\u0394","Flower bed: yellow and white",'#4f7650','#31553c'),
mk(2,"\u0395","Flower bed: purple and blue",'#4f7650','#31553c'),
mk(2,"\u0396","Flower bed: red",'#4f7650','#31553c'),
mk(2,"\u0397","Flower bed: wildflowers",'#4f7650','#31553c'),
mk(2,"\u0398","Tree: small deciduous",'#4f7650','#31553c'),
mk(2,"\u0399","Tree: small conifer",'#4f7650','#31553c'),
mk(2,"\u039a","Tree: broad oak 2×2",'#4f7650','#31553c'),
mk(2,"\u039b","Tree: broad lime 2×1",'#4f7650','#31553c'),
mk(2,"\u039c","Tree: tall birch 1×2",'#4f7650','#31553c'),
mk(2,"\u039d","Tree: tall pine 1×2",'#4f7650','#31553c')
);

// Bird’s-eye rooftop fittings.
DEF.push(
mk(2,"\u03b1","Roof: air conditioning",'#89979d','#46545e'),
mk(2,"\u03b2","Roof: twin-fan air conditioning",'#89979d','#46545e'),
mk(2,"\u03b3","Roof: extractor vent",'#89979d','#46545e'),
mk(2,"\u03b4","Roof: ventilation grille",'#89979d','#46545e'),
mk(2,"\u03b5","Roof: straight pipe",'#89979d','#46545e'),
mk(2,"\u03b6","Roof: elbow pipe",'#89979d','#46545e'),
mk(2,"\u03b7","Roof: T-junction pipe",'#89979d','#46545e'),
mk(2,"\u03b9","Roof: double chimney",'#89979d','#46545e'),
mk(2,"\u03ba","Roof: oval satellite dish",'#89979d','#46545e'),
mk(2,"\u03bb","Roof: television aerial",'#89979d','#46545e'),
mk(2,"\u03bc","Roof: round satellite dish",'#89979d','#46545e')
);
// Non-blocking road furniture; mapped from explicit OSM tags.
DEF.push(
mk(2,'А','Crossing: zebra','#d2d6ce','#26343c'),
mk(2,'Б','Crossing: puffin','#d2d6ce','#26343c'),
mk(2,'В','Crossing: signal-controlled','#d2d6ce','#26343c'),
mk(2,'Г','Traffic signals: junction','#d2d6ce','#26343c'),
mk(2,'Д','Railway: signalised level crossing','#d2d6ce','#26343c'),
mk(2,'Е','Traffic light','#d2d6ce','#26343c')
);
DEF.push(
mk(2,'а','Roof: planted trough','#6e8d60','#344b3c'),
mk(2,'б','Roof: plant pots','#6e8d60','#344b3c'),
mk(2,'в','Roof: flowering planter','#6e8d60','#344b3c'),
mk(2,'г','Roof: green garden patch','#6e8d60','#344b3c'),
mk(2,'д','Street: postbox','#6e8d60','#344b3c'),
mk(2,'е','Street: public telephone','#6e8d60','#344b3c')
);
DEF.push(mk(2,'я','Signpost: school','#497596','#f0ead6'),mk(2,'ѐ','Signpost: hospital','#a74f53','#f0ead6'),mk(2,'ё','Signpost: leisure centre','#348c87','#f0ead6'));
DEF.push(mk(2,'ђ','Signpost: train station','#497596','#f0ead6'),mk(2,'ѓ','Signpost: bus station','#497596','#f0ead6'));
// Boundary-only colliders: connected edges, clear tile interiors.
DEF.push(
mk(2,"؀","Pier railing: north",'#89979a','#354751'),
mk(2,"؁","Pier railing: east",'#89979a','#354751'),
mk(2,"؂","Pier railing: north + east",'#89979a','#354751'),
mk(2,"؃","Pier railing: south",'#89979a','#354751'),
mk(2,"؄","Pier railing: north + south",'#89979a','#354751'),
mk(2,"؅","Pier railing: east + south",'#89979a','#354751'),
mk(2,"؆","Pier railing: north + east + south",'#89979a','#354751'),
mk(2,"؇","Pier railing: west",'#89979a','#354751'),
mk(2,"؈","Pier railing: north + west",'#89979a','#354751'),
mk(2,"؉","Pier railing: east + west",'#89979a','#354751'),
mk(2,"؊","Pier railing: north + east + west",'#89979a','#354751'),
mk(2,"؋","Pier railing: south + west",'#89979a','#354751'),
mk(2,"،","Pier railing: north + south + west",'#89979a','#354751'),
mk(2,"؍","Pier railing: east + south + west",'#89979a','#354751'),
mk(2,"؎","Pier railing: north + east + south + west",'#89979a','#354751'),
mk(2,"؏","Railway fence: north",'#89979a','#354751'),
mk(2,"ؐ","Railway fence: east",'#89979a','#354751'),
mk(2,"ؑ","Railway fence: north + east",'#89979a','#354751'),
mk(2,"ؒ","Railway fence: south",'#89979a','#354751'),
mk(2,"ؓ","Railway fence: north + south",'#89979a','#354751'),
mk(2,"ؔ","Railway fence: east + south",'#89979a','#354751'),
mk(2,"ؕ","Railway fence: north + east + south",'#89979a','#354751'),
mk(2,"ؖ","Railway fence: west",'#89979a','#354751'),
mk(2,"ؗ","Railway fence: north + west",'#89979a','#354751'),
mk(2,"ؘ","Railway fence: east + west",'#89979a','#354751'),
mk(2,"ؙ","Railway fence: north + east + west",'#89979a','#354751'),
mk(2,"ؚ","Railway fence: south + west",'#89979a','#354751'),
mk(2,"؛","Railway fence: north + south + west",'#89979a','#354751'),
mk(2,"؜","Railway fence: east + south + west",'#89979a','#354751'),
mk(2,"؝","Railway fence: north + east + south + west",'#89979a','#354751'),
mk(2,"؞","Stone fence: north",'#89979a','#354751'),
mk(2,"؟","Stone fence: east",'#89979a','#354751'),
mk(2,"ؠ","Stone fence: north + east",'#89979a','#354751'),
mk(2,"ء","Stone fence: south",'#89979a','#354751'),
mk(2,"آ","Stone fence: north + south",'#89979a','#354751'),
mk(2,"أ","Stone fence: east + south",'#89979a','#354751'),
mk(2,"ؤ","Stone fence: north + east + south",'#89979a','#354751'),
mk(2,"إ","Stone fence: west",'#89979a','#354751'),
mk(2,"ئ","Stone fence: north + west",'#89979a','#354751'),
mk(2,"ا","Stone fence: east + west",'#89979a','#354751'),
mk(2,"ب","Stone fence: north + east + west",'#89979a','#354751'),
mk(2,"ة","Stone fence: south + west",'#89979a','#354751'),
mk(2,"ت","Stone fence: north + south + west",'#89979a','#354751'),
mk(2,"ث","Stone fence: east + south + west",'#89979a','#354751'),
mk(2,"ج","Stone fence: north + east + south + west",'#89979a','#354751')
);
DEF.push(
mk(2,"ڀ","Railway track: north",'#8b8a7b','#ccd3cc'),
mk(2,"ځ","Railway track: east",'#8b8a7b','#ccd3cc'),
mk(2,"ڂ","Railway track: north + east",'#8b8a7b','#ccd3cc'),
mk(2,"ڃ","Railway track: south",'#8b8a7b','#ccd3cc'),
mk(2,"ڄ","Railway track: north + south",'#8b8a7b','#ccd3cc'),
mk(2,"څ","Railway track: east + south",'#8b8a7b','#ccd3cc'),
mk(2,"چ","Railway track: north + east + south",'#8b8a7b','#ccd3cc'),
mk(2,"ڇ","Railway track: west",'#8b8a7b','#ccd3cc'),
mk(2,"ڈ","Railway track: north + west",'#8b8a7b','#ccd3cc'),
mk(2,"ډ","Railway track: east + west",'#8b8a7b','#ccd3cc'),
mk(2,"ڊ","Railway track: north + east + west",'#8b8a7b','#ccd3cc'),
mk(2,"ڋ","Railway track: south + west",'#8b8a7b','#ccd3cc'),
mk(2,"ڌ","Railway track: north + south + west",'#8b8a7b','#ccd3cc'),
mk(2,"ڍ","Railway track: east + south + west",'#8b8a7b','#ccd3cc'),
mk(2,"ڎ","Railway track: north + east + south + west",'#8b8a7b','#ccd3cc')
);

// Shared transparent town scenery; IDs remain stable across exports.
DEF.push(mk(2,"\u1000","Bench \u00b7 green","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1001","Bench \u00b7 sage","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1002","Bench \u00b7 moss","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1003","Bench \u00b7 autumn","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1004","Bench \u00b7 rust","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1005","Bench \u00b7 frost","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1006","Bench \u00b7 olive","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1007","Bench \u00b7 lime","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1008","Bench \u00b7 emerald","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1009","Bench \u00b7 spring","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u100a","Bench \u00b7 gold","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u100b","Bench \u00b7 khaki","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u100c","Flower bed \u00b7 green","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u100d","Flower bed \u00b7 sage","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u100e","Flower bed \u00b7 moss","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u100f","Flower bed \u00b7 autumn","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1010","Flower bed \u00b7 rust","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1011","Flower bed \u00b7 frost","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1012","Flower bed \u00b7 olive","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1013","Flower bed \u00b7 lime","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1014","Flower bed \u00b7 emerald","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1015","Flower bed \u00b7 spring","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1016","Flower bed \u00b7 gold","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1017","Flower bed \u00b7 khaki","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1018","Grass tuft \u00b7 green","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1019","Grass tuft \u00b7 sage","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u101a","Grass tuft \u00b7 moss","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u101b","Grass tuft \u00b7 autumn","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u101c","Grass tuft \u00b7 rust","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u101d","Grass tuft \u00b7 frost","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u101e","Grass tuft \u00b7 olive","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u101f","Grass tuft \u00b7 lime","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1020","Grass tuft \u00b7 emerald","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1021","Grass tuft \u00b7 spring","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1022","Grass tuft \u00b7 gold","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1023","Grass tuft \u00b7 khaki","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1024","Bush: round \u00b7 green","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1025","Bush: round \u00b7 sage","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1026","Bush: round \u00b7 moss","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1027","Bush: round \u00b7 autumn","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1028","Bush: round \u00b7 rust","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1029","Bush: round \u00b7 frost","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u102a","Bush: round \u00b7 olive","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u102b","Bush: round \u00b7 lime","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u102c","Bush: round \u00b7 emerald","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u102d","Bush: round \u00b7 spring","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u102e","Bush: round \u00b7 gold","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u102f","Bush: round \u00b7 khaki","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1030","Bush: sage \u00b7 green","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1031","Bush: sage \u00b7 sage","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1032","Bush: sage \u00b7 moss","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1033","Bush: sage \u00b7 autumn","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1034","Bush: sage \u00b7 rust","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1035","Bush: sage \u00b7 frost","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1036","Bush: sage \u00b7 olive","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1037","Bush: sage \u00b7 lime","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1038","Bush: sage \u00b7 emerald","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1039","Bush: sage \u00b7 spring","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u103a","Bush: sage \u00b7 gold","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u103b","Bush: sage \u00b7 khaki","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u103c","Bush: dark leafy \u00b7 green","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u103d","Bush: dark leafy \u00b7 sage","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u103e","Bush: dark leafy \u00b7 moss","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u103f","Bush: dark leafy \u00b7 autumn","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1040","Bush: dark leafy \u00b7 rust","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1041","Bush: dark leafy \u00b7 frost","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1042","Bush: dark leafy \u00b7 olive","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1043","Bush: dark leafy \u00b7 lime","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1044","Bush: dark leafy \u00b7 emerald","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1045","Bush: dark leafy \u00b7 spring","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1046","Bush: dark leafy \u00b7 gold","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1047","Bush: dark leafy \u00b7 khaki","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1048","Flower bed: yellow and white \u00b7 green","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1049","Flower bed: yellow and white \u00b7 sage","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u104a","Flower bed: yellow and white \u00b7 moss","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u104b","Flower bed: yellow and white \u00b7 autumn","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u104c","Flower bed: yellow and white \u00b7 rust","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u104d","Flower bed: yellow and white \u00b7 frost","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u104e","Flower bed: yellow and white \u00b7 olive","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u104f","Flower bed: yellow and white \u00b7 lime","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1050","Flower bed: yellow and white \u00b7 emerald","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1051","Flower bed: yellow and white \u00b7 spring","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1052","Flower bed: yellow and white \u00b7 gold","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1053","Flower bed: yellow and white \u00b7 khaki","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1054","Flower bed: purple and blue \u00b7 green","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1055","Flower bed: purple and blue \u00b7 sage","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1056","Flower bed: purple and blue \u00b7 moss","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1057","Flower bed: purple and blue \u00b7 autumn","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1058","Flower bed: purple and blue \u00b7 rust","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1059","Flower bed: purple and blue \u00b7 frost","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u105a","Flower bed: purple and blue \u00b7 olive","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u105b","Flower bed: purple and blue \u00b7 lime","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u105c","Flower bed: purple and blue \u00b7 emerald","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u105d","Flower bed: purple and blue \u00b7 spring","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u105e","Flower bed: purple and blue \u00b7 gold","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u105f","Flower bed: purple and blue \u00b7 khaki","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1060","Flower bed: red \u00b7 green","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1061","Flower bed: red \u00b7 sage","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1062","Flower bed: red \u00b7 moss","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1063","Flower bed: red \u00b7 autumn","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1064","Flower bed: red \u00b7 rust","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1065","Flower bed: red \u00b7 frost","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1066","Flower bed: red \u00b7 olive","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1067","Flower bed: red \u00b7 lime","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1068","Flower bed: red \u00b7 emerald","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1069","Flower bed: red \u00b7 spring","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u106a","Flower bed: red \u00b7 gold","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u106b","Flower bed: red \u00b7 khaki","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u106c","Flower bed: wildflowers \u00b7 green","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u106d","Flower bed: wildflowers \u00b7 sage","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u106e","Flower bed: wildflowers \u00b7 moss","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u106f","Flower bed: wildflowers \u00b7 autumn","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1070","Flower bed: wildflowers \u00b7 rust","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1071","Flower bed: wildflowers \u00b7 frost","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1072","Flower bed: wildflowers \u00b7 olive","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1073","Flower bed: wildflowers \u00b7 lime","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1074","Flower bed: wildflowers \u00b7 emerald","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1075","Flower bed: wildflowers \u00b7 spring","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1076","Flower bed: wildflowers \u00b7 gold","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1077","Flower bed: wildflowers \u00b7 khaki","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1078","Tree: small deciduous \u00b7 green 1","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1079","Tree: small deciduous \u00b7 green 2","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u107a","Tree: small deciduous \u00b7 green 3","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u107b","Tree: small deciduous \u00b7 green 4","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u107c","Tree: small deciduous \u00b7 green 5","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u107d","Tree: small deciduous \u00b7 green 6","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u107e","Tree: small deciduous \u00b7 green 7","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u107f","Tree: small deciduous \u00b7 green 8","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1080","Tree: small deciduous \u00b7 green 9","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1081","Tree: small deciduous \u00b7 green 10","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1082","Tree: small deciduous \u00b7 green 11","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1083","Tree: small deciduous \u00b7 green 12","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1084","Tree: small conifer \u00b7 green 1","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1085","Tree: small conifer \u00b7 green 2","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1086","Tree: small conifer \u00b7 green 3","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1087","Tree: small conifer \u00b7 green 4","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1088","Tree: small conifer \u00b7 green 5","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1089","Tree: small conifer \u00b7 green 6","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u108a","Tree: small conifer \u00b7 green 7","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u108b","Tree: small conifer \u00b7 green 8","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u108c","Tree: small conifer \u00b7 green 9","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u108d","Tree: small conifer \u00b7 green 10","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u108e","Tree: small conifer \u00b7 green 11","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u108f","Tree: small conifer \u00b7 green 12","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1090","Tree pair: large + small \u00b7 birch 0","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1091","Tree pair: large + small \u00b7 birch 1","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1092","Tree pair: large + small \u00b7 birch 2","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1093","Tree pair: large + small \u00b7 birch 3","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1094","Tree pair: large + small \u00b7 birch 4","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1095","Tree pair: large + small \u00b7 birch 5","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1096","Tree pair: large + small \u00b7 birch 6","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1097","Tree pair: large + small \u00b7 birch 7","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1098","Tree pair: large + small \u00b7 birch 8","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u1099","Tree pair: large + small \u00b7 birch 9","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u109a","Tree pair: large + small \u00b7 birch 10","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u109b","Tree pair: large + small \u00b7 birch 11","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u109c","Tree pair: large + small \u00b7 pine 0","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u109d","Tree pair: large + small \u00b7 pine 1","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u109e","Tree pair: large + small \u00b7 pine 2","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u109f","Tree pair: large + small \u00b7 pine 3","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10a0","Tree pair: large + small \u00b7 pine 4","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10a1","Tree pair: large + small \u00b7 pine 5","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10a2","Tree pair: large + small \u00b7 pine 6","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10a3","Tree pair: large + small \u00b7 pine 7","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10a4","Tree pair: large + small \u00b7 pine 8","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10a5","Tree pair: large + small \u00b7 pine 9","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10a6","Tree pair: large + small \u00b7 pine 10","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10a7","Tree pair: large + small \u00b7 pine 11","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10a8","Tree pair: large + small \u00b7 lime 0","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10a9","Tree pair: large + small \u00b7 lime 1","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10aa","Tree pair: large + small \u00b7 lime 2","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10ab","Tree pair: large + small \u00b7 lime 3","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10ac","Tree pair: large + small \u00b7 lime 4","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10ad","Tree pair: large + small \u00b7 lime 5","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10ae","Tree group: 3 crowns \u00b7 oak 0","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10af","Tree group: 3 crowns \u00b7 oak 1","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10b0","Tree group: 4 crowns \u00b7 oak 2","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10b1","Tree group: 4 crowns \u00b7 oak 3","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10b2","Tree: broad oak 2\u00d72 \u00b7 green 5","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10b3","Tree: broad oak 2\u00d72 \u00b7 green 6","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10b4","Building planting: green \u00b7 west","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10b5","Building planting: green \u00b7 south","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10b6","Building planting: green \u00b7 east","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10b7","Building planting: green \u00b7 north","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10b8","Building planting: red flowers \u00b7 west","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10b9","Building planting: red flowers \u00b7 south","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10ba","Building planting: red flowers \u00b7 east","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10bb","Building planting: red flowers \u00b7 north","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10bc","Building planting: white flowers \u00b7 west","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10bd","Building planting: white flowers \u00b7 south","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10be","Building planting: white flowers \u00b7 east","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10bf","Building planting: white flowers \u00b7 north","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10c0","Building planting: blue flowers \u00b7 west","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10c1","Building planting: blue flowers \u00b7 south","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10c2","Building planting: blue flowers \u00b7 east","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10c3","Building planting: blue flowers \u00b7 north","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10c4","Building planting: mixed flowers \u00b7 west","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10c5","Building planting: mixed flowers \u00b7 south","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10c6","Building planting: mixed flowers \u00b7 east","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10c7","Building planting: mixed flowers \u00b7 north","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10c8","Building planting: gold flowers \u00b7 west","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10c9","Building planting: gold flowers \u00b7 south","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10ca","Building planting: gold flowers \u00b7 east","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10cb","Building planting: gold flowers \u00b7 north","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10cc","Building planting: lime \u00b7 west","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10cd","Building planting: lime \u00b7 south","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10ce","Building planting: lime \u00b7 east","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10cf","Building planting: lime \u00b7 north","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10d0","Building planting: autumn \u00b7 west","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10d1","Building planting: autumn \u00b7 south","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10d2","Building planting: autumn \u00b7 east","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10d3","Building planting: autumn \u00b7 north","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10d4","Car: red \u00b7 north","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10d5","Car: red \u00b7 east","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10d6","Car: red \u00b7 south","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10d7","Car: red \u00b7 west","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10d8","Car: blue \u00b7 north","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10d9","Car: blue \u00b7 east","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10da","Car: blue \u00b7 south","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10db","Car: blue \u00b7 west","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10dc","Car: cream \u00b7 north","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10dd","Car: cream \u00b7 east","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10de","Car: cream \u00b7 south","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10df","Car: cream \u00b7 west","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10e0","Car: silver \u00b7 north","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10e1","Car: silver \u00b7 east","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10e2","Car: silver \u00b7 south","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10e3","Car: silver \u00b7 west","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10e4","Car: green \u00b7 north","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10e5","Car: green \u00b7 east","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10e6","Car: green \u00b7 south","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10e7","Car: green \u00b7 west","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10e8","Car: mustard \u00b7 north","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10e9","Car: mustard \u00b7 east","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10ea","Car: mustard \u00b7 south","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10eb","Car: mustard \u00b7 west","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10ec","Car: teal \u00b7 north","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10ed","Car: teal \u00b7 east","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10ee","Car: teal \u00b7 south","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10ef","Car: teal \u00b7 west","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10f0","Car: charcoal \u00b7 north","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10f1","Car: charcoal \u00b7 east","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10f2","Car: charcoal \u00b7 south","#75946b","#cbd9bd"));
DEF.push(mk(2,"\u10f3","Car: charcoal \u00b7 west","#75946b","#cbd9bd"));

DEF.push(mk(2,"\u1200","Grass detail: 1","#78936a","#c9d4bd"));
DEF.push(mk(2,"\u1201","Grass detail: 2","#78936a","#c9d4bd"));
DEF.push(mk(2,"\u1202","Grass detail: 3","#78936a","#c9d4bd"));
DEF.push(mk(2,"\u1203","Grass detail: 4","#78936a","#c9d4bd"));
DEF.push(mk(2,"\u1204","Grass detail: 5","#78936a","#c9d4bd"));
DEF.push(mk(2,"\u1205","Grass detail: 6","#78936a","#c9d4bd"));
DEF.push(mk(2,"\u1206","Grass detail: 7","#78936a","#c9d4bd"));
DEF.push(mk(2,"\u1207","Grass detail: 8","#78936a","#c9d4bd"));
DEF.push(mk(2,"\u1208","Pavement detail: 1","#78936a","#c9d4bd"));
DEF.push(mk(2,"\u1209","Pavement detail: 2","#78936a","#c9d4bd"));
DEF.push(mk(2,"\u120a","Pavement detail: 3","#78936a","#c9d4bd"));
DEF.push(mk(2,"\u120b","Pavement detail: 4","#78936a","#c9d4bd"));
DEF.push(mk(2,"\u120c","Pavement detail: 5","#78936a","#c9d4bd"));
DEF.push(mk(2,"\u120d","Pavement detail: 6","#78936a","#c9d4bd"));
DEF.push(mk(2,"\u120e","Pavement detail: 7","#78936a","#c9d4bd"));
DEF.push(mk(2,"\u120f","Pavement detail: 8","#78936a","#c9d4bd"));
DEF.push(mk(2,'♣','Trees: 2 small crowns · 1','#3f7048','#173b2c'),mk(2,'♣','Trees: 2 small crowns · 2','#3f7048','#173b2c'),mk(2,'♣','Trees: 2 small crowns · 3','#3f7048','#173b2c'),mk(2,'♣','Trees: 3 small crowns · 1','#3f7048','#173b2c'),mk(2,'♣','Trees: 3 small crowns · 2','#3f7048','#173b2c'),mk(2,'♣','Trees: 3 small crowns · 3','#3f7048','#173b2c'),mk(2,'♣','Trees: woodland 3×3 · open quarter · 1','#3f7048','#173b2c'),mk(2,'♣','Trees: woodland 3×3 · open quarter · 2','#3f7048','#173b2c'),mk(2,'♣','Trees: woodland 3×3 · open quarter · 3','#3f7048','#173b2c'),mk(2,'♣','Trees: woodland 3×3 · open quarter · 4','#3f7048','#173b2c'));
DEF.push(mk(2,'♣','Trees: large tree and saplings 3×3 · 1','#3f7048','#173b2c'),mk(2,'♣','Trees: large tree and saplings 3×3 · 2','#3f7048','#173b2c'),mk(2,'♣','Trees: large tree and saplings 3×3 · 3','#3f7048','#173b2c'),mk(2,'♣','Trees: large tree and saplings 3×3 · 4','#3f7048','#173b2c'));
const T=DEF.map((t,i)=>(t.id=i+1,t));
const hash=(a,b,s)=>{const h=Math.sin(a*12.9898+b*78.233+s*37.719)*43758.5453;return h-Math.floor(h)};
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function on(t,px,py,v,off){
  const sp=t.sp,th=Math.max(1,Math.round(sp/6)),cs=Math.max(2,sp>>1),dn=t.dn/100,sd=v*17+t.id*5,ux=px+off;
  switch(t.d){
    case 1:return hash(Math.floor(ux/cs),Math.floor(py/cs),sd)<dn;
    case 2:return py%sp<th;
    case 3:return ux%sp<th;
    case 4:return py%sp<th||ux%sp<th;
    case 5:return hash(ux,py,sd)<dn;
    case 6:return hash(ux,py,sd)<dn*.35;
    case 7:return (ux+py)%sp<th;
    case 8:return (ux-py+512)%sp<th;
    case 9:{const c=Math.max(1,sp>>1);return ((Math.floor(ux/c)+Math.floor(py/c))&1)===0}
    case 10:return ux%sp<2&&py%sp<2;
    case 11:return BAYER[(py&3)*4+(ux&3)]/16<dn;
    case 12:return (((py+Math.round(Math.sin(ux/sp*6.283)*2))%sp)+sp)%sp<th;
    case 13:case 14:{const bh=t.d===13?Math.max(3,sp>>1):sp,bw=sp,row=Math.floor(py/bh);return py%bh===0||(ux+(row&1)*(bw>>1))%bw===0}
    case 15:{const bh=Math.max(3,sp>>1),row=Math.floor(py/bh);return py%bh===0||((py%bh)<bh/2&&(ux+(row&1)*(sp>>1))%sp===0)}
    case 16:return ux%sp===0||(py+(Math.floor(ux/sp)%3)*sp)%(sp*3)===0;
    case 17:{const cx=Math.floor(ux/sp),cy=Math.floor(py/sp);if(hash(cx,cy,sd)>=dn)return false;
      const jx=Math.floor(hash(cx,cy,sd+1)*(sp-1)),jy=Math.floor(hash(cx,cy,sd+2)*(sp-1)),lx=ux-cx*sp,ly=py-cy*sp;
      return (lx===jx||lx===jx+1)&&(ly===jy||ly===jy+1)}
  }
  return false;
}
function region(t,px,py){
  const k=(t.s+50)/100,pos=k*TS;
  switch(t.sm){
    case 1:return py<pos?0:1;
    case 2:return px<pos?0:1;
    case 3:return px+py<pos*2?0:1;
    case 4:return px+(TS-1-py)<pos*2?0:1;
    case 5:return Math.min(px,py,TS-1-px,TS-1-py)<k*TS*.4?1:0;
    case 6:return Math.hypot(px-15.5,py-15.5)<k*TS*.7?0:1;
  }
  if(t.sm>=7){
    const th=Math.round(2+k*4),h=th/2,bH=Math.abs(py-15.5)<h,bV=Math.abs(px-15.5)<h,T_=py<th,B_=py>=TS-th,L_=px<th,R_=px>=TS-th;
    switch(t.sm){
      case 7:return bH?1:0;case 8:return bV?1:0;case 9:return bH||bV?1:0;
      case 10:return bH&&px%16<10?1:0;case 11:return bV&&py%16<10?1:0;
      case 12:return Math.abs(py-11)<h||Math.abs(py-21)<h?1:0;case 13:return Math.abs(px-11)<h||Math.abs(px-21)<h?1:0;
      case 14:return px%8<5?1:0;case 15:return py%8<5?1:0;
      case 16:return T_?1:0;case 17:return B_?1:0;case 18:return L_?1:0;case 19:return R_?1:0;
      case 20:return T_||L_?1:0;case 21:return T_||R_?1:0;case 22:return B_||L_?1:0;case 23:return B_||R_?1:0;
    }
  }
  return 0;
}
const seam=(t,px,py)=>{const pos=(t.s+50)/100*TS;return t.sm===1?Math.abs(py-pos)<1.2:t.sm===2?Math.abs(px-pos)<1.2:t.sm===3?Math.abs(px+py-pos*2)<1.6:t.sm===4?Math.abs(px+(TS-1-py)-pos*2)<1.6:false};
function tex(t,v,f){
  const art=window.TownDecorations?.byLabel(t.n);if(art){const out=document.createElement('canvas');out.width=out.height=TS;const c=out.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(art,0,0,TS,TS);return out;}

  const k=t.id+'.'+v+'.'+(t.w?f:0);if(cache[k])return cache[k];
  const c=document.createElement('canvas');c.width=c.height=TS;const x=c.getContext('2d');
  const hid=(px,py)=>t.tr&&(t.tr===1?region(t,px,py)===0:region(t,px,py)===1);
  if(t.tr){for(let py=0;py<TS;py++)for(let px=0;px<TS;px++){if(hid(px,py))continue;x.fillStyle=region(t,px,py)?t.b:t.a;x.fillRect(px,py,1,1)}}
  else{
    x.fillStyle=t.a;x.fillRect(0,0,TS,TS);
    if(t.sm){x.fillStyle=t.b;for(let py=0;py<TS;py++)for(let px=0;px<TS;px++)if(region(t,px,py))x.fillRect(px,py,1,1)}
  }
  if(t.d){
    const off=t.w?Math.round(f*t.sp/4):0;
    for(let py=0;py<TS;py++)for(let px=0;px<TS;px++)if(!(t.tr&&hid(px,py))&&on(t,px,py,v,off)){
      if(t.sm)x.fillStyle=region(t,px,py)?'rgba(0,0,0,.32)':'rgba(255,255,255,.26)';
      else{x.fillStyle=t.b;x.globalAlpha=t.d===17?1:t.d>=13?.8:.6}
      x.fillRect(px,py,1,1);x.globalAlpha=1;
    }
  }
  if(t.sm>=1&&t.sm<=4&&!t.tr){x.fillStyle='rgba(0,0,0,.35)';for(let py=0;py<TS;py++)for(let px=0;px<TS;px++)if(seam(t,px,py))x.fillRect(px,py,1,1)}
  c._d=null;if(++cn>20000){cache={};cn=0}return cache[k]=c;
}

window.BrightonTiles={tiles:T,tex};})();
