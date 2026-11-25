# Road route for each leg (OSRM public demo server, OpenStreetMap data). Saved once, so pages never call the server.
import json,urllib.request,time
P={"airport":[7.180,79.884],"sigiriya":[7.957,80.760],"polonnaruwa":[7.940,81.000],"anuradhapura":[8.311,80.404],"trinco":[8.587,81.215],
 "kandy":[7.291,80.634],"nuwara":[6.970,80.783],"ella":[6.867,81.046],"yala":[6.300,81.420],"arugam":[6.840,81.836],"mirissa":[5.948,80.458],
 "galle":[6.033,80.217],"hikkaduwa":[6.140,80.103],"elpitiya":[6.293,80.160]}
R={"quick":["airport","sigiriya","kandy","galle"],"classic":["airport","sigiriya","kandy","ella","yala","galle"],
 "deep":["airport","sigiriya","polonnaruwa","kandy","nuwara","ella","yala","elpitiya","galle"],
 "full":["airport","anuradhapura","sigiriya","trinco","kandy","nuwara","ella","arugam","yala","mirissa","elpitiya"],
 "yaladay":["mirissa","yala","mirissa"],"falls":["hikkaduwa","elpitiya","hikkaduwa"]}
legs={}
for r in R.values():
  for a,b in zip(r,r[1:]):
    k=a+"|"+b
    if k in legs:continue
    u=f"https://router.project-osrm.org/route/v1/driving/{P[a][1]},{P[a][0]};{P[b][1]},{P[b][0]}?overview=simplified&geometries=geojson"
    req=urllib.request.Request(u,headers={"User-Agent":"mfsl-mockup/1.0 (one-time route prep)"})
    d=json.load(urllib.request.urlopen(req,timeout=60));rt=d["routes"][0]
    coords=[[round(x,4),round(y,4)] for x,y in rt["geometry"]["coordinates"]]
    legs[k]={"km":round(rt["distance"]/1000),"min":round(rt["duration"]/60),"line":coords}
    print(k,legs[k]["km"],"km",legs[k]["min"],"min",len(coords),"pts",flush=True);time.sleep(1.1)
json.dump({"places":P,"routes":R,"legs":legs},open("routes.json","w"),separators=(",",":"))
import os;print("routes.json",os.path.getsize("routes.json"))
