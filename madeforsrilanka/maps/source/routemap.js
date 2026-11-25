/* MadeForSriLanka RouteMap: a real map (OpenStreetMap data via Protomaps, rendered by MapLibre) that draws any route from the places list.
   Needs: maplibregl, pmtiles, basemaps globals; files map/lka.wasm (map data), map/routes.json (places, routes, road legs), map/fonts/<font>/<range>.bin.
   Nothing is drawn by hand: a route is a list of place ids. */
window.RouteMap=(()=>{
  const base=new URL(".",location.href).href;
  let ready=null,DATA=null;
  class BufSource{constructor(buf){this.buf=buf}getKey(){return "lka"}async getBytes(o,l){return {data:this.buf.slice(o,o+l)}}}
  function init(){
    if(ready)return ready;
    ready=(async()=>{
      const [buf,data]=await Promise.all([fetch(base+"map/lka.wasm").then(r=>r.arrayBuffer()),fetch(base+"map/routes.json").then(r=>r.json())]);
      DATA=data;
      const protocol=new pmtiles.Protocol();protocol.add(new pmtiles.PMTiles(new BufSource(buf)));
      maplibregl.addProtocol("pmtiles",protocol.tile);
      return data})();
    return ready}
  function style(){
    const fl=Object.assign({},basemaps.namedFlavor("light"),{
      background:"#EEF1E6",earth:"#F5F5EB",water:"#BFD8DC",park_a:"#DCE8CC",park_b:"#D3E2C2",wood_a:"#D6E4C8",wood_b:"#CCDDBB",
      scrub_a:"#E3EBD5",scrub_b:"#DCE6CB",beach:"#F2E8CC",sand:"#F2E8CC",highway:"#FFFFFF",major:"#FFFFFF",
      ocean_label:"#5E8C92",city_label:"#3A3A32",city_label_halo:"#F5F5EB",subplace_label:"#6E6E64",state_label:"#9A9A8C"});
    const layers=JSON.parse(JSON.stringify(basemaps.layers("protomaps",fl,{lang:"en"}).filter(l=>!(l.layout&&l.layout["icon-image"]))).replace(/"Noto Sans (Regular|Medium|Italic)"/g,(m,w)=>'"noto-sans-'+w.toLowerCase()+'"'));
    return {version:8,glyphs:base+"map/fonts/{fontstack}/{range}.wasm",
      sources:{protomaps:{type:"vector",url:"pmtiles://lka",attribution:'<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a> · <a href="https://protomaps.com">Protomaps</a>'}},layers}}
  const fontFix=u=>({url:u.replace(/Noto%20Sans%20(Regular|Medium|Italic)/,(m,w)=>"noto-sans-"+w.toLowerCase())});
  function features(ids,visited){
    const P=DATA.places,loop=ids.length>1&&ids[0]===ids[ids.length-1],uniq=loop?ids.slice(0,-1):ids;
    const lineDone=[],lineTodo=[];
    for(let i=1;i<ids.length;i++){const leg=DATA.legs[ids[i-1]+"|"+ids[i]];const c=leg?leg.line:[[P[ids[i-1]][1],P[ids[i-1]][0]],[P[ids[i]][1],P[ids[i]][0]]];(i<=visited?lineDone:lineTodo).push(c)}
    return {
      route:{type:"FeatureCollection",features:[...lineTodo.map(c=>({type:"Feature",properties:{done:0},geometry:{type:"LineString",coordinates:c}})),...lineDone.map(c=>({type:"Feature",properties:{done:1},geometry:{type:"LineString",coordinates:c}}))]},
      stops:{type:"FeatureCollection",features:uniq.map((id,i)=>({type:"Feature",properties:{n:String(i+1),name:(DATA.names&&DATA.names[id])||id,done:i<visited?1:0},geometry:{type:"Point",coordinates:[P[id][1],P[id][0]]}}))}}}
  function bounds(ids){const P=DATA.places,b=new maplibregl.LngLatBounds();ids.forEach(id=>b.extend([P[id][1],P[id][0]]));return b}
  // mount(el, ids, {visited, interactive}) -> {set(ids,visited), focus(i), map}
  async function mount(el,ids,o={}){
    await init();
    const map=new maplibregl.Map({container:el,style:style(),bounds:bounds(ids),fitBoundsOptions:{padding:48},attributionControl:{compact:true},
      dragRotate:false,pitchWithRotate:false,cooperativeGestures:o.cooperative!==false,maxBounds:[[78.6,5.2],[82.9,10.3]],minZoom:6});
    map.touchZoomRotate.disableRotation();
    if(o.interactive!==false)map.addControl(new maplibregl.NavigationControl({showCompass:false}),"top-right");
    let cur={ids,visited:o.visited||0};
    map.on("load",()=>{
      const f=features(cur.ids,cur.visited);
      map.addSource("route",{type:"geojson",data:f.route});map.addSource("stops",{type:"geojson",data:f.stops});
      map.addLayer({id:"route-case",type:"line",source:"route",layout:{"line-join":"round","line-cap":"round"},paint:{"line-color":"#14140F","line-width":7,"line-opacity":o.mode==="trip"?["case",["==",["get","done"],1],0.9,0.5]:0.85}});
      map.addLayer({id:"route",type:"line",source:"route",layout:{"line-join":"round","line-cap":"round"},paint:{"line-color":o.mode==="trip"?["case",["==",["get","done"],1],"#BEFF50","#FFFFFF"]:"#BEFF50","line-width":3.8}});
      map.addLayer({id:"stop",type:"circle",source:"stops",paint:{"circle-radius":11,"circle-color":["case",["==",["get","done"],1],"#BEFF50","#FFFFFF"],"circle-stroke-color":"#14140F","circle-stroke-width":2}});
      map.addLayer({id:"stop-n",type:"symbol",source:"stops",layout:{"text-field":["get","n"],"text-font":["noto-sans-medium"],"text-size":11.5,"text-allow-overlap":true,"text-ignore-placement":true},paint:{"text-color":"#14140F"}});
      map.addLayer({id:"stop-name",type:"symbol",source:"stops",layout:{"text-field":["get","name"],"text-font":["noto-sans-medium"],"text-size":13.5,"text-variable-anchor":["left","right","top","bottom"],"text-radial-offset":1.25,"text-justify":"auto"},paint:{"text-color":"#14140F","text-halo-color":"#FFFFFF","text-halo-width":2}});
      if(o.onStop){map.on("click","stop",e=>o.onStop(+e.features[0].properties.n-1));map.on("mouseenter","stop",()=>map.getCanvas().style.cursor="pointer");map.on("mouseleave","stop",()=>map.getCanvas().style.cursor="")}
    });
    return {map,
      set(ids2,visited2=0){cur={ids:ids2,visited:visited2};const f=features(ids2,visited2);const go=()=>{map.getSource("route").setData(f.route);map.getSource("stops").setData(f.stops);map.fitBounds(bounds(ids2),{padding:48,duration:matchMedia("(prefers-reduced-motion: reduce)").matches?0:800})};map.loaded()&&map.getSource("route")?go():map.once("load",go)},
      focus(i){const id=(cur.ids[i]);if(!id)return;const P=DATA.places[id];map.flyTo({center:[P[1],P[0]],zoom:Math.max(map.getZoom(),9.5),duration:matchMedia("(prefers-reduced-motion: reduce)").matches?0:900})},
      fit(){map.fitBounds(bounds(cur.ids),{padding:48})}}}
  function legInfo(a,b){return DATA&&DATA.legs[a+"|"+b]}
  function gmaps(ids){const P=DATA.places,ll=id=>P[id][0]+","+P[id][1],w=ids.slice(1,-1).map(ll).join("|");return `https://www.google.com/maps/dir/?api=1&origin=${ll(ids[0])}&destination=${ll(ids[ids.length-1])}${w?`&waypoints=${encodeURIComponent(w)}`:""}&travelmode=driving`}
  return {init,mount,legInfo,gmaps,data:()=>DATA}})();
