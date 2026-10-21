import html, math, sys
out=sys.argv[1]
MOD={'usr':('#1d4ed8','#dbeafe','Usuarios'),'cur':('#047857','#d1fae5','Cursos, grupos y participantes'),'apr':('#6d28d9','#ede9fe','Aprendizaje'),'eva':('#b45309','#fef3c7','Evaluaciones'),'cer':('#b91c1c','#fee2e2','Certificaciones')}
W=360; STEP=410; X0=40
C=[X0+i*STEP for i in range(7)]
HEAD=34; LINE=18; PADS=10
K={}
def cls(k,name,mod,col,row,attrs,ops):
    h=HEAD+PADS+LINE*len(attrs)+PADS+LINE*max(1,len(ops))+PADS
    K[k]=dict(name=name,mod=mod,col=col,row=row,attrs=attrs,ops=ops,h=h)
cls('ROL','Rol','usr',0,0,['nombre: String','descripcion: String'],[])
cls('USU','Usuario','usr',0,1,['nombre: String','apellidos: String','correo: String','contrasenaHash: String','activo: Boolean','fechaRegistro: DateTime','ultimoAcceso: DateTime'],['verificarContrasena(texto): Boolean','tieneRol(nombre): Boolean','activar()','desactivar()'])
cls('TOK','TokenRecuperacion','usr',0,2,['tokenHash: String','fechaExpiracion: DateTime','usado: Boolean'],['estaVigente(): Boolean','marcarUsado()'])
cls('AUD','Auditoria','usr',0,3,['fechaHora: DateTime','accion: String','entidadAfectada: String','idRegistroAfectado: Integer','detalle: String'],['registrar(usuario, accion, entidad, id)'])
cls('CON','ConsultaMaterial','apr',1,0,['fechaPrimeraConsulta: DateTime','fechaUltimaConsulta: DateTime'],['registrarConsulta()'])
cls('PAR','Participante','cur',1,1,['telefono: String','curp: String','empresaProcedencia: String','origenRegistro: OrigenRegistro'],['historial(): List<Inscripcion>'])
cls('DOP','DocumentoParticipante','cur',1,2,['tipoDocumento: TipoDocumento','nombreArchivo: String','rutaArchivo: String','fechaCarga: DateTime'],[])
cls('MAT','Material','apr',2,0,['titulo: String','tipo: TipoMaterial','rutaArchivo: String','urlVideo: String','orden: Integer','fechaCarga: DateTime'],['esEnlace(): Boolean'])
cls('INS','Inscripcion','cur',2,1,['fechaInscripcion: DateTime','estatus: EstatusInscripcion','esRefuerzo: Boolean'],['concluirCapacitacion()','darDeBaja()','siguienteNumeroIntento(): Integer'])
cls('ASI','Asistencia','cur',2,2,['asistio: Boolean','observaciones: String'],[])
cls('CUR','Curso','cur',3,0,['nombre: String','descripcion: String','activo: Boolean'],['desactivar()'])
cls('GRU','Grupo','cur',3,1,['clave: String','fechaInicio: Date','fechaFin: Date','cupo: Integer','modalidad: Modalidad','estatus: EstatusGrupo','enlaceVideoconferencia: String','/cupoDisponible: Integer'],['tieneCupo(): Boolean','asignarInstructor(u: Usuario)','asignarEvaluador(u: Usuario)','cambiarEstatus(nuevo: EstatusGrupo)'])
cls('SES','Sesion','cur',3,2,['fecha: Date','horaInicio: Time','horaFin: Time','tema: String'],['duracion(): Integer'])
cls('EST','EstandarCompetencia','cur',4,0,['codigo: String','nombre: String','descripcion: String','activo: Boolean'],['desactivar()'])
cls('EVA','Evaluacion','eva',4,1,['nombre: String','descripcion: String','tipoInstrumento: TipoInstrumento','calificacionMinima: Decimal','activa: Boolean'],['esAprobatoria(calificacion): Boolean'])
cls('INT','IntentoEvaluacion','eva',4,2,['numeroIntento: Integer','fechaAplicacion: Date','calificacion: Decimal','estatus: EstatusIntento','dictamen: Dictamen','observaciones: String'],['registrarResultado(calificacion, evaluador)','emitirDictamen(d: Dictamen)','esCompetente(): Boolean'])
cls('DOC','DocumentoCertificacion','cer',5,0,['folioConocer: String','tipoDocumento: String','fechaEmision: Date','vigencia: Date','entidadCertificacion: String','rutaArchivo: String'],['estaVigente(): Boolean'])
cls('TRA','TramiteCertificacion','cer',5,1,['folioInterno: String','fechaSolicitud: Date','estatus: EstatusTramite'],['avanzarEstatus(nuevo: EstatusTramite)','adjuntarDocumento(doc: DocumentoCertificacion)'])
cls('EVI','Evidencia','eva',5,2,['descripcion: String','rutaArchivo: String','fechaCarga: DateTime'],[])
cls('HIS','HistorialTramite','cer',6,1,['estatus: EstatusTramite','fechaCambio: DateTime','observaciones: String'],[])
rowh={r:max(v['h'] for v in K.values() if v['row']==r) for r in (0,1,2)}
R0=70; R1=R0+rowh[0]+120; R2=R1+rowh[1]+110
for k,v in K.items():
    v['x']=C[v['col']]; v['y']={0:R0,1:R1,2:R2}.get(v['row'])
K['AUD']['y']=R2+K['TOK']['h']+50
def T(k): return K[k]['y']
def B(k): return K[k]['y']+K[k]['h']
def X(k): return K[k]['x']
LB=max(B('INT'),B('SES'),B('DOP'),B('ASI'),B('EVI'))+40
H=max(B('AUD'),LB)+170
LANE1=B('GRU')+30; LANE2=B('GRU')+52   # under row 1 (GRU is the tallest)
E=[]
def e(pts,m1,m2,label=None,lpos=None,comp=None):
    E.append((pts,m1,m2,label,lpos,comp))
e([(X("ROL")+172,B('ROL')),(X("ROL")+172,T('USU'))],'1','*')
e([(X('USU')+W,T('USU')+70),(X('PAR'),T('PAR')+70)],'1','0..1')
e([(X('USU')+80,B('USU')),(X('USU')+80,T('TOK'))],'1','*',comp=0)
e([(X('USU'),T('USU')+80),(18,T('USU')+80),(18,T('AUD')+50),(X('AUD'),T('AUD')+50)],'1','*')
e([(X('USU')+200,T('USU')),(X('USU')+200,R1-48),(X('GRU')+100,R1-48),(X('GRU')+100,T('GRU'))],'0..1','*','instructor',(C[2]+140,R1-48))
e([(X('USU')+235,T('USU')),(X('USU')+235,R1-28),(X('GRU')+65,R1-28),(X('GRU')+65,T('GRU'))],'0..1','*','evaluador',(C[2]+140,R1-28))
e([(X('PAR')+W,T('PAR')+70),(X('INS'),T('INS')+70)],'1','*')
e([(X('GRU'),T('GRU')+70),(X('INS')+W,T('INS')+70)],'1','*')
e([(X('CUR')+210,B('CUR')),(X('CUR')+210,T('GRU'))],'1','*')
e([(X('CUR'),R0+60),(X('MAT')+W,R0+60)],'1','*')
e([(X('MAT'),R0+60),(X('CON')+W,R0+60)],'1','*')
e([(X('PAR')+60,T('PAR')),(X('PAR')+60,B('CON'))],'1','*')
e([(X('EST'),R0+60),(X('CUR')+W,R0+60)],'1','*')
e([(X('EST')+145,B('EST')),(X('EST')+145,T('EVA'))],'1','*')
e([(X('PAR')+230,T('PAR')),(X('PAR')+230,R1-70),(X('CUR')+40,R1-70),(X('CUR')+40,B('CUR'))],'*','0..1','curso de interés',(C[2]+140,R1-70))
e([(X('GRU')+145,B('GRU')),(X('GRU')+145,T('SES'))],'1','*')
e([(X('SES'),R2+60),(X('ASI')+W,R2+60)],'1','*')
e([(X('INS')+120,B('INS')),(X('INS')+120,T('ASI'))],'1','*')
e([(X('INS')+230,B('INS')),(X('INS')+230,LANE1),(X('INT')+60,LANE1),(X('INT')+60,T('INT'))],'1','*')
e([(X('EVA')+170,B('EVA')),(X('EVA')+170,T('INT'))],'1','*')
lx=X('USU')+W+27
e([(X('USU')+W,T('USU')+170),(lx,T('USU')+170),(lx,LB),(X('INT')+145,LB),(X('INT')+145,B('INT'))],'0..1','*','evaluador',(C[2]+140,LB))
e([(X('INT')+W,R2+60),(X('EVI'),R2+60)],'1','*',comp=0)
e([(X('INT')+240,T('INT')),(X('INT')+240,LANE2),(X('TRA')+60,LANE2),(X('TRA')+60,B('TRA'))],'1','0..1')
e([(X('TRA')+W,T('TRA')+60),(X('HIS'),T('HIS')+60)],'1','1..*',comp=0)
e([(X('TRA')+145,T('TRA')),(X('TRA')+145,B('DOC'))],'1','0..1')

def unit(a,b):
    dx,dy=b[0]-a[0],b[1]-a[1]; n=math.hypot(dx,dy); return dx/n,dy/n
svg=[]; txt=[]
for pts,m1,m2,label,lpos,comp in E:
    svg.append('<polyline points="'+' '.join(f'{x},{y}' for x,y in pts)+'" fill="none" stroke="#374151" stroke-width="1.5"/>')
    for (P,Q,m,idx) in ((pts[0],pts[1],m1,0),(pts[-1],pts[-2],m2,1)):
        dx,dy=unit(P,Q); px,py=-dy,dx
        if comp is not None and comp==idx:
            a=(P[0],P[1]); b=(P[0]+dx*11+px*7,P[1]+dy*11+py*7); c=(P[0]+dx*22,P[1]+dy*22); d=(P[0]+dx*11-px*7,P[1]+dy*11-py*7)
            svg.append(f'<polygon points="{a[0]},{a[1]} {b[0]:.1f},{b[1]:.1f} {c[0]:.1f},{c[1]:.1f} {d[0]:.1f},{d[1]:.1f}" fill="#374151"/>')
            off=30
        else: off=14
        tx,ty=P[0]+dx*off+px*11,P[1]+dy*off+py*11
        txt.append(f'<text x="{tx:.1f}" y="{ty+4:.1f}" text-anchor="middle" font-size="13" font-weight="600" fill="#111827" style="paint-order:stroke" stroke="#fff" stroke-width="4">{m}</text>')
    if label:
        txt.append(f'<text x="{lpos[0]}" y="{lpos[1]-5}" text-anchor="middle" font-size="12.5" font-style="italic" fill="#374151" style="paint-order:stroke" stroke="#fff" stroke-width="4">{html.escape(label)}</text>')
box=[]
for k,v in K.items():
    col,bg,_=MOD[v['mod']]; x,y,h=v['x'],v['y'],v['h']
    box.append(f'<rect x="{x}" y="{y}" width="{W}" height="{h}" rx="5" fill="#fff" stroke="{col}" stroke-width="1.8"/>')
    box.append(f'<rect x="{x}" y="{y}" width="{W}" height="{HEAD}" rx="5" fill="{bg}" stroke="{col}" stroke-width="1.8"/>')
    box.append(f'<text x="{x+W/2}" y="{y+22}" text-anchor="middle" font-size="14.5" font-weight="700" fill="{col}">{v["name"]}</text>')
    yy=y+HEAD+PADS
    for a in v['attrs']:
        box.append(f'<text x="{x+10}" y="{yy+13}" font-size="12.3" font-family="DejaVu Sans Mono, Consolas, monospace" fill="#1f2937">{"+ " if not a.startswith("/") else "  "}{html.escape(a)}</text>'); yy+=LINE
    yy+=PADS/2
    box.append(f'<line x1="{x}" y1="{yy}" x2="{x+W}" y2="{yy}" stroke="{col}" stroke-width="1.2"/>')
    yy+=PADS/2
    for o in v['ops']:
        box.append(f'<text x="{x+10}" y="{yy+13}" font-size="12.3" font-family="DejaVu Sans Mono, Consolas, monospace" fill="#1f2937">+ {html.escape(o)}</text>'); yy+=LINE
Wd=C[6]+W+40
leg_y=H-120
legend=[f'<rect x="{C[2]}" y="{leg_y}" width="1300" height="96" rx="6" fill="#f9fafb" stroke="#d1d5db"/>',
 f'<text x="{C[2]+16}" y="{leg_y+24}" font-size="13.5" font-weight="700" fill="#111827">Notación UML</text>',
 f'<line x1="{C[2]+16}" y1="{leg_y+48}" x2="{C[2]+76}" y2="{leg_y+48}" stroke="#374151" stroke-width="1.5"/><text x="{C[2]+86}" y="{leg_y+52}" font-size="12.5" fill="#1f2937">Asociación, con multiplicidad en cada extremo (1, 0..1, *, 1..*)</text>',
 f'<polygon points="{C[2]+16},{leg_y+76} {C[2]+27},{leg_y+69} {C[2]+38},{leg_y+76} {C[2]+27},{leg_y+83}" fill="#374151"/><line x1="{C[2]+38}" y1="{leg_y+76}" x2="{C[2]+76}" y2="{leg_y+76}" stroke="#374151" stroke-width="1.5"/><text x="{C[2]+86}" y="{leg_y+80}" font-size="12.5" fill="#1f2937">Composición: la parte no existe sin el todo (rombo del lado del todo)</text>',
 f'<text x="{C[2]+620}" y="{leg_y+52}" font-size="12.5" fill="#1f2937">+ público · /atributo = derivado (se calcula, no se guarda)</text>',
 f'<text x="{C[2]+620}" y="{leg_y+80}" font-size="12.5" fill="#1f2937">Tipos en mayúscula inicial (Modalidad, Dictamen…) = enumeraciones (figura 13)</text>']
for i,(col,bg,n) in enumerate(MOD.values()):
    legend.append(f'<rect x="{C[2]+1340+0}" y="{leg_y+6+i*18}" width="14" height="12" fill="{bg}" stroke="{col}"/><text x="{C[2]+1362}" y="{leg_y+16+i*18}" font-size="12" fill="#1f2937">{n}</text>')
page=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{Wd}" height="{H}" viewBox="0 0 {Wd} {H}" font-family="Segoe UI, DejaVu Sans, Arial, sans-serif">
<rect width="{Wd}" height="{H}" fill="#fff"/>
<text x="40" y="38" font-size="22" font-weight="700" fill="#111827">Figura 12. Diagrama de clases del dominio — Sistema CINDEC</text>
{''.join(svg)}{''.join(box)}{''.join(txt)}{''.join(legend)}</svg>'''
open(out+'/fig12-diagrama-clases.svg','w').write(page)

# ---------- enumeraciones
ENUMS=[('Modalidad',['presencial','en_linea','mixta']),('EstatusGrupo',['planeado','en_curso','concluido','cancelado']),('OrigenRegistro',['autorregistro','alta_coordinador']),
 ('TipoDocumento',['ine','cartilla_militar','cedula_profesional','pasaporte','fotografia','ficha_registro','identificacion_tutor']),('EstatusInscripcion',['inscrito','capacitacion_concluida','baja']),
 ('TipoMaterial',['manual','presentacion','pdf','ejercicio','video']),('TipoInstrumento',['guia_observacion','lista_cotejo','cuestionario']),('EstatusIntento',['pendiente','aprobada','no_aprobada']),
 ('Dictamen',['competente','todavia_no_competente']),('EstatusTramite',['solicitado','pagado','en_tramite','emitido'])]
EW=250; cols=5; parts=[]; y0=70; rowmax=[]
hs=[56+18*len(v)+10 for _,v in ENUMS]
r0=max(hs[:5]); r1=max(hs[5:])
for i,(n,vals) in enumerate(ENUMS):
    x=40+(i%5)*(EW+30); y=y0+(0 if i<5 else r0+40); h=hs[i]
    parts.append(f'<rect x="{x}" y="{y}" width="{EW}" height="{h}" rx="5" fill="#fff" stroke="#475569" stroke-width="1.6"/><rect x="{x}" y="{y}" width="{EW}" height="46" rx="5" fill="#f1f5f9" stroke="#475569" stroke-width="1.6"/>')
    parts.append(f'<text x="{x+EW/2}" y="{y+18}" text-anchor="middle" font-size="11.5" fill="#475569">«enumeration»</text><text x="{x+EW/2}" y="{y+36}" text-anchor="middle" font-size="14.5" font-weight="700" fill="#111827">{n}</text>')
    for j,v in enumerate(vals): parts.append(f'<text x="{x+12}" y="{y+64+18*j}" font-size="12.5" font-family="DejaVu Sans Mono, Consolas, monospace" fill="#1f2937">{v}</text>')
EWd=40+5*(EW+30)+10; EH=y0+r0+40+r1+40
open(out+'/fig13-enumeraciones.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{EWd}" height="{EH}" viewBox="0 0 {EWd} {EH}" font-family="Segoe UI, DejaVu Sans, Arial, sans-serif"><rect width="{EWd}" height="{EH}" fill="#fff"/><text x="40" y="40" font-size="19" font-weight="700" fill="#111827">Figura 13. Enumeraciones del modelo (valores permitidos; corresponden a los ENUM de la base de datos)</text>{"".join(parts)}</svg>')
print('ok',Wd,H)
