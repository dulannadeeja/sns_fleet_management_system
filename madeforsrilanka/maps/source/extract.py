# Cut Sri Lanka out of the Protomaps world build (OpenStreetMap data, ODbL) using HTTP range reads.
import sys,math,json,urllib.request,functools
from concurrent.futures import ThreadPoolExecutor
from pmtiles.reader import Reader
from pmtiles.writer import Writer
from pmtiles.tile import zxy_to_tileid,Compression,TileType
URL="https://build.protomaps.com/20261122.pmtiles"
W,S,E,N=79.45,5.80,82.05,9.95
MAXZ=int(sys.argv[1]) if len(sys.argv)>1 else 11
@functools.lru_cache(maxsize=4096)
def get_bytes(offset,length):
    req=urllib.request.Request(URL,headers={"Range":f"bytes={offset}-{offset+length-1}","User-Agent":"mockup-extract/1.0"})
    for i in range(4):
        try:
            with urllib.request.urlopen(req,timeout=60) as r:return r.read()
        except Exception as e:err=e
    raise err
rd=Reader(get_bytes);hdr=rd.header();meta=rd.metadata()
def tiles():
    for z in range(MAXZ+1):
        n=2**z
        x0=int((W+180)/360*n);x1=int((E+180)/360*n)
        def ty(lat):r=math.radians(lat);return int((1-math.log(math.tan(r)+1/math.cos(r))/math.pi)/2*n)
        y0=ty(N);y1=ty(S)
        for x in range(x0,x1+1):
            for y in range(y0,y1+1):yield z,x,y
T=list(tiles());print("tiles",len(T),flush=True)
def fetch(t):
    z,x,y=t;return t,rd.get(z,x,y)
out={}
with ThreadPoolExecutor(12) as ex:
    for t,d in ex.map(fetch,T):
        if d:out[zxy_to_tileid(*t)]=d
size=sum(len(v) for v in out.values());print("found",len(out),"bytes",size,flush=True)
with open(f"lka-z{MAXZ}.pmtiles","wb") as f:
    w=Writer(f)
    for tid in sorted(out):w.write_tile(tid,out[tid])
    h=dict(hdr);h.update({"min_zoom":0,"max_zoom":MAXZ,"min_lon_e7":int(W*1e7),"min_lat_e7":int(S*1e7),"max_lon_e7":int(E*1e7),"max_lat_e7":int(N*1e7),"center_zoom":7,"center_lon_e7":int(80.7*1e7),"center_lat_e7":int(7.8*1e7)})
    meta2=dict(meta);meta2["attribution"]='<a href="https://openstreetmap.org/copyright">© OpenStreetMap</a> · <a href="https://protomaps.com">Protomaps</a>'
    w.finalize(h,meta2)
import os;print("file",os.path.getsize(f"lka-z{MAXZ}.pmtiles"))
