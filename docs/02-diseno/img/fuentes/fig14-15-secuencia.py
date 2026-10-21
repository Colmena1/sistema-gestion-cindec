import html, sys
esc=html.escape
class Seq:
    def __init__(s,title,parts,accent,tint,gap=225):
        s.title=title; s.parts=parts; s.accent=accent; s.tint=tint; s.gap=gap
        s.X={k:90+i*gap for i,(k,*_) in enumerate(parts)}
        s.ev=[]
    def m(s,a,b,t,ret=False): s.ev.append(('msg',a,b,t,ret))
    def frag(s,kind,guard,a,b): s.ev.append(('fs',kind,guard,a,b))
    def els(s,guard): s.ev.append(('fe',guard))
    def end(s): s.ev.append(('fx',))
    def note(s,a,b,t): s.ev.append(('note',a,b,t))
    def sep(s,t): s.ev.append(('sep',t))
    def render(s,path):
        S=[];T=[];F=[];A=[];N=[]
        y=150; stack=[]; act={}; segs=[]
        def touch(k,yy):
            if k==s.parts[0][0]: return
            a,b=act.get(k,(yy,yy)); act[k]=(min(a,yy),max(b,yy))
        def flush():
            for k,(a,b) in act.items(): segs.append((k,a-6,b+8))
            act.clear()
        W=90+(len(s.parts)-1)*s.gap+150
        for e in s.ev:
            if e[0]=='msg':
                _,a,b,t,ret=e; lines=t.split('\n'); y+=14*len(lines)+10
                xa,xb=s.X[a],s.X[b]
                if a==b:
                    x=xa+6
                    S.append(f'<polyline points="{x},{y} {x+38},{y} {x+38},{y+22} {x+2},{y+22}" fill="none" stroke="#1f2937" stroke-width="1.4"/>')
                    S.append(f'<polygon points="{x+2},{y+22} {x+12},{y+17} {x+12},{y+27}" fill="#1f2937"/>')
                    for i,l in enumerate(lines):
                        T.append(f'<text x="{x+46}" y="{y+14-(len(lines)-1)*7+i*14}" font-size="12.5" fill="#111827" style="paint-order:stroke" stroke="#fff" stroke-width="4">{esc(l)}</text>')
                    touch(a,y); touch(a,y+22); y+=30
                else:
                    d=1 if xb>xa else -1
                    x1=xa+6*d; x2=xb-6*d
                    dash=' stroke-dasharray="6 4"' if ret else ''
                    S.append(f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="#1f2937" stroke-width="1.4"{dash}/>')
                    if ret: S.append(f'<polyline points="{x2-10*d},{y-5} {x2},{y} {x2-10*d},{y+5}" fill="none" stroke="#1f2937" stroke-width="1.4"/>')
                    else: S.append(f'<polygon points="{x2},{y} {x2-11*d},{y-5} {x2-11*d},{y+5}" fill="#1f2937"/>')
                    cx=(x1+x2)/2; col='#4b5563' if ret else '#111827'; ital=' font-style="italic"' if ret else ''
                    for i,l in enumerate(lines):
                        T.append(f'<text x="{cx}" y="{y-6-(len(lines)-1-i)*14}" text-anchor="middle" font-size="12.5" fill="{col}"{ital} style="paint-order:stroke" stroke="#fff" stroke-width="4">{esc(l)}</text>')
                    touch(a,y); touch(b,y); y+=8
            elif e[0]=='fs':
                _,kind,g,a,b=e; y+=14; lvl=len(stack)
                stack.append(dict(kind=kind,y=y,x1=s.X[a]-70+lvl*8,x2=s.X[b]+80-lvl*8,els=[],g=g)); y+=30
            elif e[0]=='fe':
                y+=10; stack[-1]['els'].append((y,e[1])); y+=24
            elif e[0]=='fx':
                y+=12; f=stack.pop()
                F.append(f'<rect x="{f["x1"]}" y="{f["y"]}" width="{f["x2"]-f["x1"]}" height="{y-f["y"]}" fill="none" stroke="#6b7280" stroke-width="1.3"/>')
                F.append(f'<path d="M{f["x1"]},{f["y"]} h52 v14 l-8,8 h-44 z" fill="#f3f4f6" stroke="#6b7280" stroke-width="1.3"/><text x="{f["x1"]+8}" y="{f["y"]+16}" font-size="12.5" font-weight="700" fill="#111827">{f["kind"]}</text>')
                F.append(f'<text x="{f["x1"]+62}" y="{f["y"]+16}" font-size="12.5" font-weight="600" fill="#374151" style="paint-order:stroke" stroke="#fff" stroke-width="4">[{esc(f["g"])}]</text>')
                for yy,g in f['els']:
                    F.append(f'<line x1="{f["x1"]}" y1="{yy}" x2="{f["x2"]}" y2="{yy}" stroke="#6b7280" stroke-width="1.2" stroke-dasharray="7 4"/><text x="{f["x1"]+10}" y="{yy+16}" font-size="12.5" font-weight="600" fill="#374151" style="paint-order:stroke" stroke="#fff" stroke-width="4">[{esc(g)}]</text>')
                y+=6
            elif e[0]=='note':
                _,a,b,t=e; lines=t.split('\n'); y+=12
                x1=s.X[a]-60; x2=max(s.X[b]+60,x1+30+max(len(l) for l in lines)*6.9); h=12+16*len(lines)
                N.append(f'<path d="M{x1},{y} H{x2-12} L{x2},{y+12} V{y+h} H{x1} Z" fill="#fffbeb" stroke="#d97706" stroke-width="1.2"/>')
                for i,l in enumerate(lines): N.append(f'<text x="{x1+10}" y="{y+19+i*16}" font-size="12.3" fill="#78350f">{esc(l)}</text>')
                y+=h+6
            elif e[0]=='sep':
                flush(); y+=26
                A.append(f'<rect x="20" y="{y-16}" width="{W-40}" height="24" fill="{s.tint}" opacity=".85"/><text x="34" y="{y+1}" font-size="13.5" font-weight="700" fill="{s.accent}">{esc(e[1])}</text>')
                y+=14
        flush(); H=y+60
        L=[]
        for i,(k,name,ster) in enumerate(s.parts):
            x=s.X[k]
            L.append(f'<line x1="{x}" y1="{118}" x2="{x}" y2="{H-30}" stroke="#9ca3af" stroke-width="1.2" stroke-dasharray="5 5"/>')
            if ster=='actor':
                L.append(f'<circle cx="{x}" cy="62" r="9" fill="#fff" stroke="#1f2937" stroke-width="1.6"/><path d="M{x},71 v20 M{x-14},78 h28 M{x},91 l-11,15 M{x},91 l11,15" stroke="#1f2937" stroke-width="1.6" fill="none"/><text x="{x}" y="122" text-anchor="middle" font-size="13" font-weight="700" fill="#111827">{esc(name)}</text>')
            else:
                L.append(f'<rect x="{x-95}" y="58" width="190" height="52" rx="5" fill="{s.tint}" stroke="{s.accent}" stroke-width="1.6"/><text x="{x}" y="78" text-anchor="middle" font-size="11.3" fill="#4b5563">{esc(ster)}</text><text x="{x}" y="98" text-anchor="middle" font-size="13.3" font-weight="700" fill="#111827">{esc(name)}</text>')
        for k,a,b in segs:
            x=s.X[k]; L.append(f'<rect x="{x-6}" y="{a}" width="12" height="{b-a}" fill="#fff" stroke="#374151" stroke-width="1.2"/>')
        leg=f'<text x="{W-20}" y="{H-14}" text-anchor="end" font-size="12" fill="#4b5563">─── mensaje (llamada) · - - - respuesta · rectángulo = activación</text>'
        svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="Segoe UI, DejaVu Sans, Arial, sans-serif"><rect width="{W}" height="{H}" fill="#fff"/><text x="24" y="36" font-size="20" font-weight="700" fill="#111827">{esc(s.title)}</text>{leg}{"".join(A)}{"".join(L)}{"".join(F)}{"".join(S)}{"".join(T)}{"".join(N)}</svg>'
        open(path,'w').write(svg)

# ---------------- Figura 14: inscripción con control de cupo
P=[('U',':Coordinador','actor'),('FE',':Frontend','React · vista Inscripciones'),('MW',':Rutas / Middlewares','Express · auth JWT y rol'),('CT',':InscripcionController','módulo cursos · controlador'),('SV',':InscripcionService','módulo cursos · servicio'),('MO',':Grupo / Inscripcion','modelos Sequelize'),('DB',':MySQL','cindec_db')]
d=Seq('Figura 14. Diagrama de secuencia — Inscribir participante en un grupo con control de cupo (CU-07 + CU-08)',P,'#047857','#d1fae5',gap=255)
d.m('U','FE','elige participante y grupo,\nclic en "Inscribir"')
d.m('FE','MW','POST /api/v1/grupos/:id/inscripciones\n{ idParticipante } + token JWT')
d.m('MW','MW','verificarToken()\nverificarRol(coordinador, administrador)')
d.m('MW','CT','inscribir(req, res)')
d.m('CT','CT','validar datos de entrada')
d.m('CT','SV','inscribir(idParticipante, idGrupo, usuario)')
d.m('SV','MO','iniciar transacción\nGrupo.findByPk(idGrupo, { lock })')
d.m('MO','DB','SELECT … FROM grupo\nWHERE id_grupo = ? FOR UPDATE')
d.m('DB','MO','fila del grupo',True)
d.m('MO','SV','grupo',True)
d.m('SV','MO','Inscripcion.count({ idGrupo,\nestatus ≠ baja })')
d.m('MO','DB','SELECT COUNT(*) FROM inscripcion …')
d.m('DB','MO','n',True)
d.m('MO','SV','inscritos activos',True)
d.m('SV','SV','grupo.tieneCupo()\nestatus ∈ {planeado, en_curso}')
d.frag('alt','hay cupo y el grupo está abierto','U','DB')
d.m('SV','MO','Inscripcion.create({ estatus: inscrito })\nAuditoria.registrar(…)')
d.m('MO','DB','INSERT INTO inscripcion …\nINSERT INTO auditoria …')
d.m('DB','MO','OK',True)
d.m('SV','MO','commit')
d.m('SV','CT','inscripción creada',True)
d.m('CT','FE','201 Created { inscripcion }',True)
d.m('FE','U','"Participante inscrito"',True)
d.els('sin cupo, o el grupo no está planeado ni en curso')
d.m('SV','MO','rollback')
d.m('SV','CT','error GRUPO_SIN_CUPO',True)
d.m('CT','FE','409 Conflict { mensaje }',True)
d.m('FE','U','"El grupo no tiene cupo disponible"',True)
d.end()
d.note('MW','SV','Sin token válido → 401 Unauthorized; rol sin permiso → 403 Forbidden (la petición no llega al controlador).\nFOR UPDATE bloquea la fila del grupo durante la transacción: si dos coordinadores inscriben al último lugar\nal mismo tiempo, el segundo espera y luego ve el cupo lleno.')
d.note('MO','DB','Si el participante ya estaba inscrito, uq_inscripcion\nrechaza el INSERT (error 1062) → 409 Conflict.')
d.render(sys.argv[1]+'/fig14-secuencia-inscripcion.svg')

# ---------------- Figura 15: trámite de certificación
P=[('U',':Coordinador','actor'),('FE',':Frontend','React · vista Certificaciones'),('MW',':Rutas / Middlewares','Express · JWT, rol, multer'),('CT',':TramiteController','módulo certificaciones'),('SV',':TramiteService','módulo certificaciones'),('MO',':Modelos','Sequelize'),('DB',':MySQL','cindec_db'),('NO',':NotificacionService','módulo notificaciones'),('SM',':Servidor SMTP','correo externo')]
d=Seq('Figura 15. Diagrama de secuencia — Trámite de certificación: crear, dar seguimiento, resguardar documento y notificar (CU-17 + CU-18 + CU-21)',P,'#b91c1c','#fee2e2',gap=250)
d.sep('1. Crear el trámite a partir de un intento evaluado (CU-17)')
d.m('U','FE','clic en "Iniciar trámite"\nsobre un intento')
d.m('FE','MW','POST /api/v1/tramites\n{ idIntento } + token JWT')
d.m('MW','MW','verificarToken()\nverificarRol(coordinador, administrador)')
d.m('MW','CT','crear(req, res)')
d.m('CT','SV','crearTramite(idIntento, usuario)')
d.m('SV','MO','IntentoEvaluacion.findByPk(idIntento)')
d.m('MO','DB','SELECT … FROM intento_evaluacion')
d.m('DB','MO','fila',True)
d.m('MO','SV','intento',True)
d.m('SV','SV','intento.esCompetente()')
d.frag('alt','dictamen = competente','U','DB')
d.m('SV','MO','transacción: TramiteCertificacion.create(\n{ folioInterno, estatus: solicitado })\n+ HistorialTramite.create({ solicitado })')
d.m('MO','DB','INSERT INTO tramite_certificacion …\nINSERT INTO historial_tramite …\nCOMMIT')
d.m('DB','MO','OK',True)
d.m('SV','CT','trámite (folio CINDEC-2026-0001)',True)
d.m('CT','FE','201 Created { tramite }',True)
d.m('FE','U','"Trámite creado: solicitado"',True)
d.els('todavía no competente, o el intento ya tiene trámite')
d.m('SV','CT','error INTENTO_NO_CERTIFICABLE',True)
d.m('CT','FE','422 / 409 { mensaje }',True)
d.m('FE','U','muestra el motivo',True)
d.end()
d.sep('2. Dar seguimiento: pagado → en trámite (CU-17)')
d.frag('loop','por cada cambio de estatus','U','DB')
d.m('U','FE','elige el nuevo estatus')
d.m('FE','MW','PATCH /api/v1/tramites/:id/estatus\n{ estatus } + token JWT')
d.m('MW','CT','cambiarEstatus(req, res)')
d.m('CT','SV','avanzarEstatus(id, nuevo, usuario)')
d.m('SV','SV','validar orden: solicitado → pagado\n→ en_tramite → emitido (no se salta ni regresa)')
d.m('SV','MO','transacción: tramite.update({ estatus })\n+ HistorialTramite.create(…)')
d.m('MO','DB','UPDATE tramite_certificacion …\nINSERT INTO historial_tramite …\nCOMMIT')
d.m('DB','MO','OK',True)
d.m('SV','CT','trámite actualizado',True)
d.m('CT','FE','200 OK',True)
d.end()
d.sep('3. Resguardar el documento oficial de CONOCER y notificar (CU-18 + CU-21)')
d.m('U','FE','sube el PDF y captura folio CONOCER,\nfecha de emisión y vigencia')
d.m('FE','MW','POST /api/v1/tramites/:id/documento\n(multipart/form-data) + token JWT')
d.m('MW','MW','verificarToken() · verificarRol()\nmulter: valida PDF y lo guarda en uploads/')
d.m('MW','CT','adjuntar(req, res)')
d.m('CT','SV','adjuntarDocumento(id, datos, rutaArchivo)')
d.m('SV','MO','transacción: DocumentoCertificacion.create(…)\n+ tramite.avanzarEstatus(emitido)\n+ HistorialTramite.create({ emitido })')
d.m('MO','DB','INSERT INTO documento_certificacion …\nUPDATE tramite_certificacion …\nINSERT INTO historial_tramite … · COMMIT')
d.m('DB','MO','OK',True)
d.m('MO','SV','documento',True)
d.m('SV','NO','notificarEmision(participante, folio)')
d.m('NO','SM','sendMail(correo del participante)')
d.m('SM','NO','250 OK',True)
d.m('NO','SV','enviado',True)
d.m('SV','CT','documento resguardado',True)
d.m('CT','FE','201 Created',True)
d.m('FE','U','"Certificado emitido;\nse avisó al participante"',True)
d.note('SV','SM','El correo se envía DESPUÉS del COMMIT: si el servidor SMTP falla, el certificado\nya quedó resguardado; el error se registra y la notificación se puede reenviar.')
d.note('SV','DB','Estatus y historial siempre se guardan en la misma transacción: se guardan los dos o ninguno\n(excepción documentada en la normalización, sección 5.3).')
d.render(sys.argv[1]+'/fig15-secuencia-tramite.svg')
print('ok')
