import html,sys
E=html.escape
AZ='#02258B'; AC='#AED4FB'; GR='#E7E6EB'; TX='#4C4B55'; NI='#EEF5FE'; FO='#F6F6F9'; GM='#6B6A75'
W=1640; s=[]
def box(x,y,w,h,t,sub=None,fill='#fff',stroke=GR,col=TX,bold=False,star=False,r=10,fs=14):
    s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="1.6"/>')
    ty=y+h/2+5 if not sub else y+h/2-3
    s.append(f'<text x="{x+14}" y="{ty}" font-size="{fs}" font-weight="{700 if bold else 600}" fill="{col}">{E(t)}</text>')
    if sub: s.append(f'<text x="{x+14}" y="{y+h/2+15}" font-size="11.5" fill="{GM}">{E(sub)}</text>')
    c1,c2=(('#fff',AZ) if fill==AZ else (AZ,'#fff'))
    if star: s.append(f'<circle cx="{x+w-16}" cy="{y+16}" r="8" fill="{c1}"/><text x="{x+w-16}" y="{y+20}" text-anchor="middle" font-size="11" font-weight="700" fill="{c2}">★</text>')
def arrow(x1,y1,x2,y2,dash=False,col=GM):
    d=' stroke-dasharray="6 4"' if dash else ''
    s.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{col}" stroke-width="1.6"{d} marker-end="url(#ar)"/>')
s.append(f'<text x="40" y="44" font-size="22" font-weight="700" fill="{AZ}">Figura 16. Mapa de navegación por rol — Sistema CINDEC</text>')
s.append(f'<text x="40" y="70" font-size="13.5" fill="{GM}">Cada rol ve solo su menú (máximo 3 niveles: menú → lista → detalle). ★ = pantalla que se dibuja como prototipo.</text>')
# zona pública
s.append(f'<rect x="40" y="92" width="{W-80}" height="128" rx="14" fill="{FO}" stroke="{GR}"/>')
s.append(f'<text x="60" y="118" font-size="13" font-weight="700" fill="{GM}">SIN SESIÓN (acceso público)</text>')
box(560,132,300,64,'P-01 Inicio de sesión','CU-01',fill='#fff',stroke=AZ,col=AZ,bold=True,star=True)
box(140,132,300,64,'P-02 Recuperar contraseña','CU-02 · llega un enlace por correo')
box(980,132,330,64,'P-03 Autorregistro (3 pasos)','CU-06 · datos, CURP, documentos',star=True)
arrow(560,164,442,164); arrow(860,164,978,164)
s.append(f'<text x="470" y="156" font-size="11.5" fill="{GM}">¿olvidaste…?</text><text x="880" y="156" font-size="11.5" fill="{GM}">crear cuenta</text>')
arrow(1145,198,1145,214,dash=True); s.append(f'<text x="1160" y="212" font-size="11.5" fill="{GM}">al terminar → inicio de sesión</text>')
# panel
arrow(710,198,710,250)
box(520,252,380,62,'P-04 Panel de inicio','resumen y accesos según el rol · RNF-11',fill=AZ,stroke=AZ,col='#fff',bold=True,star=True)
s[-2]=s[-2].replace(f'fill="{GM}"','fill="#dbe4ff"')
# columnas
roles=[('Administrador',[('Usuarios','P-05 · CU-03',[]),('+ todo el menú del Coordinador','hereda sus permisos',[])]),
('Coordinador',[('Cursos y estándares','P-06 · CU-04',[]),('Grupos','P-07 · CU-05',[('Detalle del grupo','P-08 · sesiones e inscritos',True),('Inscribir participante','P-09 · CU-07/08 (ventana)',True)]),
  ('Participantes','P-10 · lista',[('Expediente e historial','P-11 · CU-10',False)]),('Instrumentos de evaluación','P-12 · CU-14',[]),('Trámites','P-13 · lista por estatus',[('Detalle del trámite','P-14 · CU-17/18',True)]),('Reportes','P-15 · CU-22',[])]),
('Instructor',[('Mis grupos','P-16 · grupos asignados',[('Asistencia por sesión','P-17 · CU-09',True),('Materiales del curso','P-18 · CU-12',False)])]),
('Evaluador',[('Por evaluar','P-19 · grupos asignados',[('Resultado y dictamen','P-20 · CU-15/16',True)])]),
('Participante',[('Mis cursos','P-21 · grupos inscritos',[('Materiales del curso','P-22 · CU-13',True)]),('Mi historial','P-23 · CU-11',[]),('Mis certificados','P-24 · CU-19',[])])]
cw=300; gap=(W-80-5*cw)/4; top=372; ymax=0
for i,(r,items) in enumerate(roles):
    x=40+i*(cw+gap)
    arrow(710,316,x+cw/2,top-4,col=AZ)
    box(x,top,cw,46,r,fill=NI,stroke=AZ,col=AZ,bold=True,fs=15)
    y=top+62
    for t,sub,ch in items:
        box(x,y,cw,52,t,sub); yb=y+52; y+=60
        for ct,csub,st in ch:
            s.append(f'<path d="M{x+20},{yb} V{y+26} H{x+38}" fill="none" stroke="{GM}" stroke-width="1.5" marker-end="url(#ar)"/>')
            box(x+40,y,cw-40,52,ct,csub,fill=FO,star=st); yb=y+52; y+=60
    y+=4
    box(x,y,cw,46,'Verificar certificación por folio','P-25 · CU-20 · en todos los menús',fill='#fff',stroke=AC,star=(i==1)); ymax=max(ymax,y+46)
H=ymax+60
s.append(f'<text x="40" y="{H-20}" font-size="12.5" fill="{GM}">Barra superior en todas las pantallas con sesión: logo CINDEC · nombre del usuario · rol · Cerrar sesión. En celular el menú lateral se convierte en menú desplegable (RNF-02).</text>')
H+=0
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" font-family="Segoe UI, DejaVu Sans, Arial"><defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="{GM}"/></marker></defs><rect width="{W}" height="{H}" fill="#fff"/>{"".join(s)}</svg>'''
open('fig16-mapa-navegacion.svg','w').write(svg)
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(device_scale_factor=2); pg.set_content('<body style="margin:0">'+svg+'</body>'); pg.locator('svg').screenshot(path='fig16-mapa-navegacion.png')
print(H)
