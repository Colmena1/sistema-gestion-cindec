import math, html, sys
INK='#1f2937'; EDGE='#374151'; QUIET='#6b7280'
def esc(s): return html.escape(s)
class D:
    def __init__(s,title,W,H,box,boxtitle):
        s.title=title; s.W=W; s.H=H; s.box=box; s.boxtitle=boxtitle; s.A={}; s.U={}; s.el=[]; s.top=[]
    def actor(s,k,x,y,label,ext=False):
        s.A[k]=(x,y,label,ext)
    def uc(s,k,cx,cy,lines,w=230,h=None):
        h=h or (44+16*len(lines))
        s.U[k]=(cx,cy,w/2,h/2,lines)
    def ellpt(s,k,px,py):
        cx,cy,a,b,_=s.U[k]; dx,dy=px-cx,py-cy
        t=1/math.sqrt((dx/a)**2+(dy/b)**2); return cx+dx*t, cy+dy*t
    def anchor(s,k,tx):
        x,y,_,_=s.A[k]; return (x+22 if tx>x else x-22, y+30)
    def assoc(s,a,u):
        ax,ay=s.anchor(a,s.U[u][0]); ex,ey=s.ellpt(u,ax,ay)
        s.el.append(f'<line x1="{ax:.1f}" y1="{ay:.1f}" x2="{ex:.1f}" y2="{ey:.1f}" stroke="{EDGE}" stroke-width="1.4"/>')
    def dep(s,frm,to,label,lx=0,ly=0):
        fx,fy=s.U[frm][0],s.U[frm][1]; tx,ty=s.U[to][0],s.U[to][1]
        x1,y1=s.ellpt(frm,tx,ty); x2,y2=s.ellpt(to,fx,fy)
        s.el.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{EDGE}" stroke-width="1.3" stroke-dasharray="7 5" marker-end="url(#open)"/>')
        mx,my=(x1+x2)/2+lx,(y1+y2)/2+ly
        s.top.append(f'<text x="{mx:.1f}" y="{my:.1f}" text-anchor="middle" font-size="12.5" fill="{QUIET}" style="paint-order:stroke" stroke="#fff" stroke-width="4">«{label}»</text>')
    def gen(s,child,parent):
        cx,cy,_,_=s.A[child]; px,py,pl,_=s.A[parent]
        y2=py+95+14*(pl.count('\n'))
        s.el.append(f'<line x1="{cx}" y1="{cy-15}" x2="{px}" y2="{y2+14}" stroke="{EDGE}" stroke-width="1.4"/>')
        s.el.append(f'<path d="M{px-9} {y2+14} L{px} {y2} L{px+9} {y2+14} Z" fill="#fff" stroke="{EDGE}" stroke-width="1.4"/>')
    def note(s,x,y,lines,w):
        h=14+18*len(lines)
        s.top.append(f'<path d="M{x} {y} h{w-12} l12 12 v{h-12} h{-w} Z" fill="#fffbeb" stroke="#d97706" stroke-width="1"/>')
        for i,l in enumerate(lines): s.top.append(f'<text x="{x+10}" y="{y+20+18*i}" font-size="12" fill="{INK}">{esc(l)}</text>')
    def svg(s):
        o=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{s.W}" height="{s.H}" viewBox="0 0 {s.W} {s.H}" font-family="Segoe UI, DejaVu Sans, Arial, sans-serif">',
           '<defs><marker id="open" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="11" markerHeight="11" orient="auto"><path d="M1 1 L11 6 L1 11" fill="none" stroke="#374151" stroke-width="1.4"/></marker></defs>',
           f'<rect width="{s.W}" height="{s.H}" fill="#fff"/>',
           f'<text x="20" y="30" font-size="17" font-weight="700" fill="{INK}">{esc(s.title)}</text>']
        x0,y0,x1,y1=s.box
        o.append(f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" rx="6" fill="#f8fafc" stroke="{EDGE}" stroke-width="1.6"/>')
        o.append(f'<text x="{(x0+x1)/2}" y="{y0+24}" text-anchor="middle" font-size="14" font-weight="700" fill="{INK}">{esc(s.boxtitle)}</text>')
        o+=s.el
        for k,(cx,cy,a,b,lines) in s.U.items():
            o.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{a}" ry="{b}" fill="#eef4ff" stroke="#1d4ed8" stroke-width="1.5"/>')
            n=len(lines); top=cy-(16*(n))/2+2
            o.append(f'<text x="{cx}" y="{top}" text-anchor="middle" font-size="12" font-weight="700" fill="#1d4ed8">{esc(k)}</text>')
            for i,l in enumerate(lines): o.append(f'<text x="{cx}" y="{top+17+16*i}" text-anchor="middle" font-size="13.5" fill="{INK}">{esc(l)}</text>')
        for k,(x,y,label,ext) in s.A.items():
            c='#7c2d12' if ext else INK
            o.append(f'<g stroke="{c}" stroke-width="1.8" fill="none"><circle cx="{x}" cy="{y}" r="12" fill="#fff"/><line x1="{x}" y1="{y+12}" x2="{x}" y2="{y+45}"/><line x1="{x-20}" y1="{y+24}" x2="{x+20}" y2="{y+24}"/><line x1="{x}" y1="{y+45}" x2="{x-15}" y2="{y+70}"/><line x1="{x}" y1="{y+45}" x2="{x+15}" y2="{y+70}"/></g>')
            for i,l in enumerate(label.split('\n')):
                o.append(f'<text x="{x}" y="{y+90+14*i}" text-anchor="middle" font-size="{13.5 if i==0 else 11.5}" font-weight="{600 if i==0 else 400}" fill="{c if i==0 else QUIET}">{esc(l)}</text>')
        o+=s.top
        o.append('</svg>'); return '\n'.join(o)

out=sys.argv[1]
# ---------- D1 Usuarios
d=D('Figura 7. Diagrama de casos de uso — Módulo Usuarios',1000,520,(230,50,780,490),'Sistema CINDEC — Usuarios')
d.actor('U',115,170,'Usuario\n(cualquiera de los 5 roles)')
d.actor('ADM',115,340,'Administrador')
d.actor('MAIL',885,260,'Servidor de correo\n«actor externo»',ext=True)
d.uc('CU-01',440,130,['Iniciar sesión'])
d.uc('CU-02',440,250,['Recuperar contraseña'])
d.uc('CU-03',420,400,['Gestionar usuarios y roles','(alta, edición, activar/desactivar)'],w=270)
d.uc('CU-21',640,330,['Enviar notificación','por correo'],w=220)
d.assoc('U','CU-01'); d.assoc('U','CU-02'); d.assoc('ADM','CU-03'); d.assoc('MAIL','CU-21')
d.dep('CU-02','CU-21','include',lx=-48,ly=26)
open(out+'/fig7-cu-usuarios.svg','w').write(d.svg())
# ---------- D2 Cursos
d=D('Figura 8. Diagrama de casos de uso — Módulo Cursos, grupos y participantes',1040,760,(240,50,800,720),'Sistema CINDEC — Cursos, grupos y participantes')
d.actor('CO',115,180,'Coordinador')
d.actor('ADM',115,420,'Administrador')
d.actor('IN',925,110,'Instructor')
d.actor('PA',925,330,'Participante')
d.actor('MAIL',925,560,'Servidor de correo\n«actor externo»',ext=True)
d.uc('CU-04',400,120,['Gestionar estándares','y cursos'],w=220)
d.uc('CU-05',400,230,['Gestionar grupos','y sesiones'],w=220)
d.uc('CU-07',400,345,['Inscribir participante','en un grupo'],w=230)
d.uc('CU-08',515,485,['Validar cupo','del grupo'],w=190)
d.uc('CU-10',400,610,['Consultar historial de','participante, instructor','o evaluador'],w=240)
d.uc('CU-09',655,130,['Registrar asistencia'],w=220)
d.uc('CU-11',655,250,['Consultar mi historial'],w=220)
d.uc('CU-06',655,370,['Autorregistrarse'],w=210)
d.uc('CU-21',655,580,['Enviar notificación','por correo'],w=210)
for u in ['CU-04','CU-05','CU-07','CU-10']: d.assoc('CO',u)
d.assoc('IN','CU-09'); d.assoc('PA','CU-11'); d.assoc('PA','CU-06'); d.assoc('MAIL','CU-21')
d.gen('ADM','CO')
d.dep('CU-07','CU-08','include',lx=-52,ly=6)
d.dep('CU-06','CU-21','include',lx=42)
d.note(250,665,['El Administrador puede realizar todos los','casos de uso del Coordinador (herencia).'],290)
open(out+'/fig8-cu-cursos.svg','w').write(d.svg())
# ---------- D3 Aprendizaje
d=D('Figura 9. Diagrama de casos de uso — Módulo Aprendizaje',1000,360,(230,50,770,320),'Sistema CINDEC — Aprendizaje')
d.actor('IN',115,130,'Instructor')
d.actor('PA',885,130,'Participante')
d.uc('CU-12',500,130,['Gestionar materiales','del curso'],w=230)
d.uc('CU-13',500,245,['Consultar y descargar','materiales'],w=230)
d.assoc('IN','CU-12'); d.assoc('PA','CU-13')
d.note(455,282,['Cada consulta queda registrada (RF-APR-03).'],295)
open(out+'/fig9-cu-aprendizaje.svg','w').write(d.svg())
# ---------- D4 Evaluaciones
d=D('Figura 10. Diagrama de casos de uso — Módulo Evaluaciones',1000,480,(230,50,770,450),'Sistema CINDEC — Evaluaciones')
d.actor('CO',115,110,'Coordinador')
d.actor('ADM',115,320,'Administrador')
d.actor('EV',885,220,'Evaluador')
d.uc('CU-14',480,140,['Gestionar instrumentos de','evaluación (tipo y','calificación mínima)'],w=250)
d.uc('CU-15',560,265,['Registrar resultado','y dictamen'],w=220)
d.uc('CU-16',560,385,['Registrar evidencias'],w=210)
d.assoc('CO','CU-14'); d.assoc('EV','CU-15')
d.gen('ADM','CO')
d.dep('CU-15','CU-16','include',lx=42)
open(out+'/fig10-cu-evaluaciones.svg','w').write(d.svg())
# ---------- D5 Certificaciones y reportes
d=D('Figura 11. Diagrama de casos de uso — Módulos Certificaciones y Reportes',1040,630,(240,50,800,590),'Sistema CINDEC — Certificaciones y Reportes')
d.actor('CO',115,180,'Coordinador')
d.actor('ADM',115,430,'Administrador')
d.actor('PA',925,120,'Participante')
d.actor('MAIL',925,270,'Servidor de correo\n«actor externo»',ext=True)
d.actor('U',925,430,'Usuario\n(cualquier rol)')
d.uc('CU-17',395,170,['Gestionar trámite','de certificación'],w=220)
d.uc('CU-18',395,325,['Resguardar documento','oficial de CONOCER'],w=230)
d.uc('CU-22',395,500,['Generar y exportar','reportes (PDF/Excel)'],w=230)
d.uc('CU-19',650,150,['Descargar mis','documentos de','certificación'],w=210)
d.uc('CU-21',650,300,['Enviar notificación','por correo'],w=210)
d.uc('CU-20',650,455,['Verificar certificación','por folio'],w=220)
d.assoc('CO','CU-17'); d.assoc('CO','CU-22'); d.assoc('PA','CU-19'); d.assoc('MAIL','CU-21'); d.assoc('U','CU-20')
d.gen('ADM','CO')
d.dep('CU-18','CU-17','extend',lx=48)
d.dep('CU-17','CU-21','include',ly=-12)
d.note(255,543,['«extend»: solo cuando el trámite','llega a "emitido".'],230)
open(out+'/fig11-cu-certificaciones-reportes.svg','w').write(d.svg())
print('ok')
