# Turns "MadeFor" (Onest SemiBold) + "SriLanka" (Onest Regular) into one SVG path, so the logo needs no font.
import sys,json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
def run(font,text,x0,size,track):
    f=TTFont(font);gs=f.getGlyphSet();cmap=f.getBestCmap();upm=f['head'].unitsPerEm;s=size/upm
    # simple pair kerning from GPOS is skipped; tracking applied per letter
    out=[];x=x0
    for ch in text:
        g=cmap[ord(ch)];pen=SVGPathPen(gs)
        tp=TransformPen(pen,(s,0,0,-s,x,0));gs[g].draw(tp);out.append(pen.getCommands())
        x+=f['hmtx'][g][0]*s+track*size
    return " ".join(out),x,f
for fn in ["font/onest-400.ttf","font/onest-600.ttf"]:
    f=TTFont(fn);print(fn,f['OS/2'].usWeightClass,f['name'].getDebugName(4),file=sys.stderr)
size=100;track=-0.02
a,x,f=run("font/onest-600.ttf","MadeFor",0,size,track)
b,x2,_=run("font/onest-400.ttf","SriLanka",x+0.01*size,size,track)
f=TTFont("font/onest-600.ttf");asc=f['OS/2'].sCapHeight*size/f['head'].unitsPerEm
json.dump({"made":a,"sri":b,"width":round(x2,2),"cap":round(asc,2)},open("wordmark.json","w"))
print("width",round(x2,1),"cap",round(asc,1))
