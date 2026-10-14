import html, math

W = 240; HEAD = 32; ROW = 21; PAD = 8
C = [50, 400, 750, 1100, 1450, 1800, 2150]
R0, R1, R2 = 40, 330, 650

MOD = {
    'usr': ('#1d4ed8', '#dbeafe', 'Usuarios'),
    'cur': ('#047857', '#d1fae5', 'Cursos, grupos y participantes'),
    'apr': ('#6d28d9', '#ede9fe', 'Aprendizaje'),
    'eva': ('#b45309', '#fef3c7', 'Evaluaciones'),
    'cer': ('#b91c1c', '#fee2e2', 'Certificaciones'),
}

# attr: (name, flag) flag: 'PK','U','V' (validar), '' normal
E = {}
def ent(key, title, mod, x, y, attrs):
    h = HEAD + ROW * len(attrs) + PAD
    E[key] = dict(title=title, mod=mod, x=x, y=y, w=W, h=h, attrs=attrs)

ent('ROL', 'ROL', 'usr', C[0], R0, [('id_rol','PK'),('nombre','U'),('descripcion','')])
ent('USU', 'USUARIO', 'usr', C[0], R1, [('id_usuario','PK'),('nombre',''),('apellidos',''),('correo','U'),('contrasena_hash',''),('activo',''),('fecha_registro',''),('ultimo_acceso','')])
ent('TOK', 'TOKEN_RECUPERACION', 'usr', C[0], R2, [('id_token','PK'),('token_hash',''),('fecha_expiracion',''),('usado','')])
ent('AUD', 'AUDITORIA', 'usr', C[0], 814, [('id_auditoria','PK'),('fecha_hora',''),('accion',''),('entidad_afectada',''),('id_registro_afectado',''),('detalle','')])
ent('PAR', 'PARTICIPANTE', 'cur', C[1], R1, [('id_participante','PK'),('telefono',''),('curp','U'),('empresa_procedencia',''),('origen_registro',''),('fecha_registro','')])
ent('DOP', 'DOCUMENTO_PARTICIPANTE', 'cur', C[1], R2, [('id_documento','PK'),('tipo_documento',''),('nombre_archivo',''),('ruta_archivo',''),('fecha_carga','')])
ent('CON', 'CONSULTA_MATERIAL', 'apr', C[1], R0, [('id_consulta','PK'),('fecha_primera_consulta',''),('fecha_ultima_consulta','')])
ent('MAT', 'MATERIAL', 'apr', C[2], R0, [('id_material','PK'),('titulo',''),('tipo',''),('ruta_archivo',''),('url_video',''),('orden',''),('fecha_carga','')])
ent('INS', 'INSCRIPCION', 'cur', C[2], R1, [('id_inscripcion','PK'),('fecha_inscripcion',''),('estatus',''),('es_refuerzo','')])
ent('ASI', 'ASISTENCIA', 'cur', C[2], R2, [('id_asistencia','PK'),('asistio',''),('observaciones','')])
ent('CUR', 'CURSO', 'cur', C[3], R0, [('id_curso','PK'),('nombre',''),('descripcion',''),('activo','')])
ent('GRU', 'GRUPO', 'cur', C[3], R1, [('id_grupo','PK'),('clave','U'),('fecha_inicio',''),('fecha_fin',''),('cupo',''),('modalidad',''),('estatus',''),('horario',''),('enlace_videoconferencia','')])
ent('SES', 'SESION', 'cur', C[3], R2, [('id_sesion','PK'),('fecha',''),('hora_inicio',''),('hora_fin',''),('tema','')])
ent('EST', 'ESTANDAR_COMPETENCIA', 'cur', C[4], R0, [('id_estandar','PK'),('codigo','U'),('nombre',''),('descripcion',''),('activo','')])
ent('EVA', 'EVALUACION', 'eva', C[4], R1, [('id_evaluacion','PK'),('nombre',''),('descripcion',''),('tipo_instrumento',''),('calificacion_minima',''),('activa','')])
ent('INT', 'INTENTO_EVALUACION', 'eva', C[4], R2, [('id_intento','PK'),('numero_intento',''),('fecha_aplicacion',''),('calificacion',''),('estatus',''),('dictamen',''),('observaciones','')])
ent('EVI', 'EVIDENCIA', 'eva', C[5], R2, [('id_evidencia','PK'),('descripcion',''),('ruta_archivo',''),('fecha_carga','')])
ent('TRA', 'TRAMITE_CERTIFICACION', 'cer', C[5], R1, [('id_tramite','PK'),('folio_interno','U'),('fecha_solicitud',''),('estatus','')])
ent('HIS', 'HISTORIAL_TRAMITE', 'cer', C[6], R1, [('id_historial','PK'),('estatus',''),('fecha_cambio',''),('observaciones','')])
ent('DOC', 'DOCUMENTO_CERTIFICACION', 'cer', C[5], R0, [('id_doc_cert','PK'),('folio_conocer','U'),('tipo_documento',''),('fecha_emision',''),('vigencia',''),('entidad_certificacion',''),('ruta_archivo','')])

def b(k): return E[k]['y'] + E[k]['h']
def t(k): return E[k]['y']

# edges: (points, symStart, symEnd, label, (lx, ly))
G = []
def edge(pts, s1, s2, label, lpos):
    G.append((pts, s1, s2, label, lpos))

edge([(C[0]+120, b('ROL')), (C[0]+120, R1)], 'one', 'zmany', 'tiene', (C[0]+120, (b('ROL')+R1)/2))
edge([(C[0]+W, R1+50), (C[1], R1+50)], 'one', 'zone', 'es', ((C[0]+W+C[1])/2, R1+38))
edge([(C[0]+80, b('USU')), (C[0]+80, R2)], 'one', 'zmany', 'solicita', (C[0]+80, (b('USU')+R2)/2))
edge([(C[0], R1+60), (25, R1+60), (25, t('AUD')+40), (C[0], t('AUD')+40)], 'one', 'zmany', 'genera', (25, 760))
edge([(C[0]+180, R1), (C[0]+180, 290), (C[3]+90, 290), (C[3]+90, R1)], 'zone', 'zmany', 'imparte (instructor)', (C[2]+120, 290))
edge([(C[0]+210, R1), (C[0]+210, 310), (C[3]+60, 310), (C[3]+60, R1)], 'zone', 'zmany', 'evalúa (evaluador)', (C[2]+120, 310))
edge([(C[1]+120, b('PAR')), (C[1]+120, R2)], 'one', 'zmany', 'entrega', (C[1]+120, (b('PAR')+R2)/2))
edge([(C[1]+W, R1+50), (C[2], R1+50)], 'one', 'zmany', 'se inscribe', ((C[1]+W+C[2])/2, R1+38))
edge([(C[3], R1+50), (C[2]+W, R1+50)], 'one', 'zmany', 'recibe', ((C[3]+C[2]+W)/2, R1+38))
edge([(C[3]+170, b('CUR')), (C[3]+170, R1)], 'one', 'zmany', 'se oferta en', (C[3]+170, 235))
edge([(C[3], R0+50), (C[2]+W, R0+50)], 'one', 'zmany', 'contiene', ((C[3]+C[2]+W)/2, R0+38))
edge([(C[2], R0+50), (C[1]+W, R0+50)], 'one', 'zmany', 'registra', ((C[2]+C[1]+W)/2, R0+38))
edge([(C[1]+60, R1), (C[1]+60, b('CON'))], 'one', 'zmany', 'realiza', (C[1]+60, 205))
edge([(C[4], R0+50), (C[3]+W, R0+50)], 'one', 'zmany', 'se basa en', ((C[4]+C[3]+W)/2, R0+38))
edge([(C[4]+120, b('EST')), (C[4]+120, R1)], 'one', 'zmany', 'define', (C[4]+120, (b('EST')+R1)/2))
edge([(C[1]+200, R1), (C[1]+200, 265), (C[3]+40, 265), (C[3]+40, b('CUR'))], 'zmany', 'zone', 'se interesa en', (C[2]+120, 265))
edge([(C[3]+120, b('GRU')), (C[3]+120, R2)], 'one', 'zmany', 'programa', (C[3]+120, 585))
edge([(C[3], R2+50), (C[2]+W, R2+50)], 'one', 'zmany', 'registra', ((C[3]+C[2]+W)/2, R2+38))
edge([(C[2]+120, b('INS')), (C[2]+120, R2)], 'one', 'zmany', 'acumula', (C[2]+120, 540))
edge([(C[2]+200, b('INS')), (C[2]+200, 612), (C[4]+60, 612), (C[4]+60, R2)], 'one', 'zmany', 'presenta', (C[3]+200, 612))
edge([(C[4]+150, b('EVA')), (C[4]+150, R2)], 'one', 'zmany', 'se aplica en', (C[4]+150, 560))
edge([(C[0]+W, R1+150), (C[0]+W+55, R1+150), (C[0]+W+55, 880), (C[4]+120, 880), (C[4]+120, b('INT'))], 'one', 'zmany', 'registra resultado (evaluador)', (C[2]+120, 880))
edge([(C[4]+W, R2+50), (C[5], R2+50)], 'one', 'zmany', 'se respalda con', ((C[4]+W+C[5])/2, R2+38))
edge([(C[4]+210, R2), (C[4]+210, 625), (C[5]+60, 625), (C[5]+60, b('TRA'))], 'one', 'zone', 'origina (si es competente)', (C[5]+60, 590))
edge([(C[5]+W, R1+50), (C[6], R1+50)], 'one', 'many', 'registra cambios', ((C[5]+W+C[6])/2, R1+38))
edge([(C[5]+120, R1), (C[5]+120, b('DOC'))], 'one', 'zone', 'resguarda', (C[5]+120, (R1+b('DOC'))/2))

def sym(P, d, kind):
    x, y = P; dx, dy = d; px, py = -dy, dx
    out = []
    def line(a, c): out.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{c[0]:.1f}" y2="{c[1]:.1f}"/>')
    def bar(o):
        cx, cy = x+dx*o, y+dy*o; line((cx+px*7, cy+py*7), (cx-px*7, cy-py*7))
    def circ(o):
        cx, cy = x+dx*o, y+dy*o; out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="5" fill="#fff"/>')
    def crow():
        tip = (x+dx*14, y+dy*14)
        line((x+px*8, y+py*8), tip); line((x-px*8, y-py*8), tip)
    if kind == 'one': bar(8); bar(14)
    elif kind == 'zone': bar(8); circ(20)
    elif kind == 'zmany': crow(); circ(21)
    elif kind == 'many': crow(); bar(19)
    return ''.join(out)

def unit(a, c):
    dx, dy = c[0]-a[0], c[1]-a[1]; n = math.hypot(dx, dy); return (dx/n, dy/n)

svg = []
for pts, s1, s2, label, lp in G:
    svg.append('<polyline points="' + ' '.join(f'{x},{y}' for x, y in pts) + '" fill="none"/>')
    svg.append(sym(pts[0], unit(pts[0], pts[1]), s1))
    svg.append(sym(pts[-1], unit(pts[-1], pts[-2]), s2))
labels = []
for pts, s1, s2, label, (lx, ly) in G:
    labels.append(f'<div class="rl" style="left:{lx}px;top:{ly}px">{html.escape(label)}</div>')

boxes = []
for k, e in E.items():
    col, bg, _ = MOD[e['mod']]
    rows = []
    for name, flag in e['attrs']:
        tag = ''
        cls = ''
        if flag == 'PK': tag = '<span class="tg pk">PK</span>'; cls = 'pkn'
        elif flag == 'U': tag = '<span class="tg u">U</span>'
        elif flag == 'V': tag = '<span class="tg v">validar</span>'
        rows.append(f'<div class="at"><span class="{cls}">{name}</span>{tag}</div>')
    boxes.append(f'<div class="en" style="left:{e["x"]}px;top:{e["y"]}px;width:{e["w"]}px;height:{e["h"]}px;border-color:{col}">'
                 f'<div class="hd" style="background:{bg};color:{col};border-color:{col}">{e["title"]}</div>{"".join(rows)}</div>')

legend_mod = ''.join(f'<span class="lm"><i style="background:{bg};border-color:{col}"></i>{n}</span>' for col, bg, n in MOD.values())
def legsym(kind):
    return f'<svg width="60" height="20"><g stroke="#374151" stroke-width="1.6" fill="none"><line x1="0" y1="10" x2="60" y2="10"/>{sym((60,10),(-1,0),kind)}</g></svg>'
legend = f'''<div class="lg" style="left:{C[2]}px;top:925px">
<div class="lt">Notación (pata de gallo / crow's foot) — se lee desde la entidad del lado opuesto</div>
<div class="ls"><span>{legsym('one')} exactamente uno</span><span>{legsym('zone')} cero o uno</span><span>{legsym('zmany')} cero o muchos</span><span>{legsym('many')} uno o muchos</span></div>
<div class="ls" style="margin-top:6px">{legend_mod}</div>
<div class="ls" style="margin-top:6px"><span><span class="tg pk">PK</span> identificador</span><span><span class="tg u">U</span> valor único</span></div>
</div>'''

W_CANVAS = C[6] + W + 40
H_CANVAS = 1050
page = f'''<html><head><meta charset="utf-8"><style>
* {{ box-sizing:border-box; margin:0; padding:0 }}
body {{ font-family:"Segoe UI","DejaVu Sans",Arial,sans-serif; background:#fff; color:#1f2937; width:{W_CANVAS}px }}
.ti {{ padding:24px 50px 0; }} .ti h1 {{ font-size:24px }} .ti p {{ font-size:13.5px; color:#6b7280; margin-top:4px }}
.cv {{ position:relative; width:{W_CANVAS}px; height:{H_CANVAS}px }}
svg.ln {{ position:absolute; left:0; top:0 }}
svg.ln g {{ stroke:#374151; stroke-width:1.6 }}
.en {{ position:absolute; background:#fff; border:2px solid; border-radius:7px; overflow:hidden; box-shadow:0 1px 2px rgba(0,0,0,.06) }}
.hd {{ height:{HEAD}px; line-height:{HEAD-2}px; font-weight:700; font-size:13px; text-align:center; border-bottom:1.5px solid; letter-spacing:.02em }}
.at {{ height:{ROW}px; line-height:{ROW}px; font-size:12.5px; padding:0 10px; display:flex; justify-content:space-between; align-items:center; font-family:"DejaVu Sans Mono",Consolas,monospace }}
.at:first-of-type {{ margin-top:4px }}
.pkn {{ font-weight:700; text-decoration:underline }}
.tg {{ font-family:"Segoe UI","DejaVu Sans",Arial,sans-serif; font-size:10px; font-weight:700; padding:0 5px; border-radius:3px; line-height:15px }}
.tg.pk {{ background:#111827; color:#fff }} .tg.u {{ background:#e5e7eb; color:#374151 }} .tg.v {{ background:#fde68a; color:#92400e }}
.rl {{ position:absolute; transform:translate(-50%,-50%); background:#fff; font-size:11.5px; font-style:italic; color:#374151; padding:0 4px; white-space:nowrap; border-radius:3px }}
.lg {{ position:absolute; width:1150px; border:1.5px solid #d1d5db; border-radius:8px; padding:10px 14px; background:#f9fafb; font-size:12.5px }}
.lt {{ font-weight:700; margin-bottom:6px }}
.ls {{ display:flex; gap:22px; flex-wrap:wrap; align-items:center }} .ls > span {{ display:flex; align-items:center; gap:6px }}
.lm {{ display:flex; align-items:center; gap:6px }} .lm i {{ display:inline-block; width:16px; height:12px; border:1.5px solid; border-radius:2px }}
</style></head><body>
<div class="ti"><h1>Figura 4. Modelo entidad-relación (conceptual) — alcance V1</h1>
<p>Sistema Integral de Gestión de Capacitación y Certificación Digital — CINDEC · 20 entidades · las llaves foráneas se agregan en el diseño de la base de datos (paso 3)</p></div>
<div class="cv">
<svg class="ln" width="{W_CANVAS}" height="{H_CANVAS}"><g fill="none">{''.join(svg)}</g></svg>
{''.join(boxes)}
{''.join(labels)}
{legend}
</div></body></html>'''
open('er.html', 'w', encoding='utf-8').write(page)
print('ok', W_CANVAS)
