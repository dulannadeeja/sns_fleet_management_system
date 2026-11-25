# Writes the final Kotiya Tile logo files (SVG). PNG/ICO are rendered afterwards.
import json,math
W=json.load(open('wordmark.json'))
INK,OCH,LIME,STONE="#14140F","#E3A13B","#BEFF50","#F5F5EB"
def ros(x,y,r,c):
    a0=(x*37+y*13)%90;out=""
    for d,s in [(0,.56),(92,.44),(178,.52),(268,.38)]:
        a=math.radians(a0+d);cx=x+math.cos(a)*r;cy=y+math.sin(a)*r
        out+=f'<ellipse cx="{cx:.2f}" cy="{cy:.2f}" rx="{r*s:.2f}" ry="{r*.3:.2f}" fill="{c}" transform="rotate({a0+d+90:.1f} {cx:.2f} {cy:.2f})"/>'
    return out
def tile(t=LIME,e=OCH,i=INK,small=False,ei=None):
    ei=ei or i
    out=(f'<circle cx="16.5" cy="15" r="9" fill="{e}"/><circle cx="47.5" cy="15" r="9" fill="{e}"/>'
     f'<circle cx="16.5" cy="15.6" r="4.4" fill="{ei}"/><circle cx="47.5" cy="15.6" r="4.4" fill="{ei}"/>'
     f'<rect x="6" y="13" width="52" height="47" rx="16" fill="{t}"/>'
     f'<circle cx="23.5" cy="35" r="3.6" fill="{i}"/><circle cx="40.5" cy="35" r="3.6" fill="{i}"/>'
     f'<path d="M28.2 42.4h7.6l-3.8 4.8z" fill="{i}" stroke="{i}" stroke-width="1.8" stroke-linejoin="round"/>')
    if not small: out+=ros(32,24,3.4,i)+ros(14.5,46.5,3.2,i)+ros(49.5,46.5,3.2,i)
    return out
def svg(inner,vb,title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-labelledby="t"><title id="t">{title}</title>{inner}</svg>\n'
def lockup(mark,made,sri,op=1):
    s=32/W['cap'];w=W['width']*s;tx=74
    return svg(mark+f'<g transform="translate({tx} 44) scale({s:.4f})"><path d="{W["made"]}" fill="{made}"/><path d="{W["sri"]}" fill="{sri}" opacity="{op}"/></g>',f'0 0 {math.ceil(tx+w+2)} 64','MadeForSriLanka')
files={
 'logo.svg':lockup(tile(small=True),INK,INK),
 'logo-white.svg':lockup(tile(small=True),"#FFFFFF","#FFFFFF",.8),
 'logo-mono.svg':lockup(tile(INK,INK,"#FFFFFF",True),INK,INK),
 'logo-mark.svg':svg(tile(),'0 0 64 64','MadeForSriLanka'),
 'favicon.svg':svg(tile(small=True),'0 0 64 64','MadeForSriLanka'),
 # app icon: full-bleed lime (phones round the corners themselves)
 'app-icon.svg':svg(f'<rect width="64" height="64" fill="{LIME}"/><g transform="translate(5 9) scale(.84)">{tile(small=False)}</g>','0 0 64 64','MadeForSriLanka'),
 'og-avatar.svg':svg(f'<rect width="64" height="64" fill="{LIME}"/><g transform="translate(12 14) scale(.625)">{tile(small=False)}</g>','0 0 64 64','MadeForSriLanka'),
}
for n,c in files.items(): open('files/'+n,'w').write(c)
print(list(files))
