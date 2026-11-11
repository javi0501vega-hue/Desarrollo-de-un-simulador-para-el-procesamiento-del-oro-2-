/* ============================================================================
 * ui.js — Interfaz del simulador (SPA sin dependencias).
 * Estado único: state.params → GS.run() → state.r → render de cada página.
 * ========================================================================== */
(function (root) {
  const GS = root.GS, C = GS.charts, doc = root.document;
  const KEY_P = 'gs_params_v1', KEY_S = 'gs_scenarios_v1';
  const nf = (x, d) => (isFinite(x) ? Number(x).toLocaleString('es-CO', { minimumFractionDigits: d == null ? 1 : d, maximumFractionDigits: d == null ? 1 : d }) : '–');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (s, el) => (el || doc).querySelector(s);
  const $$ = (s, el) => Array.from((el || doc).querySelectorAll(s));
  const PB = GS.PARAM_BY_ID;
  const clamp = (v, p) => Math.min(p.max != null ? p.max : Infinity, Math.max(p.min != null ? p.min : -Infinity, v));
  const store = {
    get(k, d) { try { const v = root.localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { root.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  };

  const state = {
    params: Object.assign(GS.defaults(), store.get(KEY_P, {})),
    page: 'inicio', sel: { kind: 'n', id: 14 }, labelMode: 'solids', dtab: 'res',
    scenarios: store.get(KEY_S, []), compare: [], opt: null, optObj: 'oro', optMin: 85, cur: null, ccy: 'USD',
  };
  Object.keys(state.params).forEach((k) => { if (!PB[k]) delete state.params[k]; });
  let R = null, VAL = [];

  const PAGES = [
    ['inicio', 'Inicio', 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10'],
    ['flujo', 'Diagrama de flujo', 'M4 5h6v5H4zM14 14h6v5h-6zM10 7.5h4a3 3 0 013 3V14'],
    ['variables', 'Variables', 'M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6'],
    ['resultados', 'Resultados', 'M4 20V10M10 20V4M16 20v-8M22 20H2'],
    ['graficos', 'Gráficos', 'M3 20h18M5 16l4-5 4 3 6-8'],
    ['costos', 'Costos y rentabilidad', 'M12 3a9 9 0 100 18 9 9 0 000-18zM14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1 1.8 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5V8M12 16v1.5'],
    ['escenarios', 'Escenarios', 'M4 5h7v7H4zM13 12h7v7h-7zM11 8.5h3a2 2 0 012 2V12'],
    ['equipos', 'Equipos', 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2'],
    ['modelo', 'Modelo y datos', 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7'],
  ];
  const PRESETS = [
    ['Diseño del Proyecto', 'Valores del Proyecto §3 (50 t/d, 24 h, 400 ppm NaCN).', {}],
    ['Alimentación +30 % (65 t/d)', 'Más mineral con los mismos tanques: baja el tiempo de residencia.', { feedTpd: 65 }],
    ['Molienda gruesa (P80 150 µm)', 'Menos energía de molienda, menor liberación del oro.', { p80: 150 }],
    ['Molienda fina (P80 60 µm)', 'Más energía de molienda, mayor recuperación.', { p80: 60 }],
    ['8 tanques (≈ 32 h)', 'Más tiempo de residencia con dos tanques adicionales.', { nTanks: 8 }],
    ['NaCN 300 ppm', 'Límite bajo del rango del Proyecto §3.1.', { nacn: 300 }],
    ['NaCN 500 ppm', 'Límite alto del rango del Proyecto §3.1.', { nacn: 500 }],
    ['Oxígeno (DO 20 mg/L)', 'Oxígeno en lugar de aire; no modela el efecto del nitrato de plomo.', { oxidant: 'oxígeno', dox: 20 }],
  ];

  /* ------------------------------ cálculo ------------------------------ */
  let valCache = null;
  function compute() {
    R = GS.run(state.params);
    VAL = GS.validate(state.params, R);
    valCache = null;
  }
  function counts() {
    let e = 0, w = 0;
    VAL.forEach((v) => { if (v.lvl === 'error') e++; else if (v.lvl === 'warn') w++; });
    R.flags.forEach((v) => { if (v.lvl === 'error') e++; else if (v.lvl === 'warn') w++; });
    return { e, w };
  }
  let saveT = 0;
  function persist() { clearTimeout(saveT); saveT = setTimeout(() => store.set(KEY_P, state.params), 250); }

  /* ------------------------------ piezas ------------------------------- */
  const badge = (s) => `<span class="badge b-${s}" title="${esc(GS.SRC_LABEL[s])}">${esc(GS.SRC_LABEL[s])}</span>`;
  const tile = (l, v, u, d, hero) => `<div class="tile${hero ? ' hero' : ''}"><small>${l}</small><b>${v}</b><u>${u || ''}</u>${d ? `<div class="d">${d}</div>` : ''}</div>`;
  /* pistas calculadas por el motor: reemplazan supuestos por dimensionamiento */
  const HINT = {
    crushCap: () => `Calculado: la trituradora procesa ${nf(R.crush.tph, 1)} t/h (con carga circulante) · utilización ${nf(R.crush.util * 100, 0)} %`,
    millPower: () => `Calculado (Bond): se requieren ${nf(R.mill.kWreq, 1)} kW · utilización ${nf(R.mill.util * 100, 0)} %`,
    wi: () => `Energía de molienda resultante: ${nf(R.mill.kWhd / state.params.feedTpd, 1)} kWh/t`,
    carbonXfer: () => `Carga del carbón resultante: ${nf(R.cil.loading, 1)} kg Au/t C`,
    kFre: () => `Carga actual ${nf(R.cil.loading, 1)} kg/t = ${nf(100 * R.cil.loading / (state.params.kFre * Math.max(1e-6, R.cil.solutionMgL[R.cil.s0])), 0)} % del equilibrio con la solución del primer tanque con carbón`,
    cnSideFrac: () => `Consumo total de NaCN: ${nf(R.reag.nacnSpec, 2)} kg/t (la tesis reporta 0,51–0,55 kg/t)`,
  };
  function ctl(id) {
    const p = PB[id], v = state.params[id], ed = v !== p.def;
    let inp;
    if (p.choices) inp = `<span></span><select data-p="${id}" aria-label="${esc(p.label)}">${p.choices.map((c) => `<option${c === v ? ' selected' : ''}>${c}</option>`).join('')}</select>`;
    else inp = `<input type="range" data-p="${id}" min="${p.min}" max="${p.max}" step="${p.step}" value="${v}" aria-label="${esc(p.label)}"><input type="number" data-p="${id}" min="${p.min}" max="${p.max}" step="${p.step}" value="${v}" aria-label="${esc(p.label)}">`;
    const why = p.src !== 'DOC' && GS.WHY[id] ? ` <button class="why" data-why="${id}" title="Pepita y sus amigos te explican este dato">¿por qué?</button>` : '';
    const hint = HINT[id] ? `<small class="hint" data-hint="${id}">${HINT[id]()}</small>` : '';
    return `<div class="prow${ed ? ' ed' : ''}" data-row="${id}"><div class="lb"><b>${esc(p.label)}</b> ${badge(p.src)}${why}<small>${esc(p.ref || '')}</small>${hint}</div>${inp}<div class="un"><span>${esc(p.unit)}</span><button data-reset="${id}" title="Valor inicial: ${esc(p.def)}" aria-label="Restablecer">↺</button></div></div>`;
  }
  const flagHtml = (fl) => fl.map((f) => `<div class="flg ${f.lvl}"><b>${f.lvl === 'error' ? 'Error' : f.lvl === 'warn' ? 'Advertencia' : 'Nota'}:</b> ${esc(f.msg)}</div>`).join('');
  function table(head, rows, cls) {
    return `<div class="tw"><table class="${cls || ''}"><thead><tr>${head.map((h, i) => `<th${h[0] === '#' ? ' class="num"' : ''}>${esc(h.replace(/^#/, ''))}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td${head[i] && head[i][0] === '#' ? ' class="num"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function kv(list) { return `<div class="kvl">${list.map((x) => `<span>${x[0]}</span><span>${x[1]}</span>`).join('')}</div>`; }
  const sweep = (id, vals, fn, base) => GS.sweep(Object.assign({}, state.params, base || {}), id, vals, fn).map((o) => [o.x, o.y]);
  const range = (a, b, n) => Array.from({ length: n }, (_, i) => +(a + ((b - a) * i) / (n - 1)).toFixed(4));

  /* ------------------------------ barra superior ------------------------ */
  function topbar() {
    const c = counts(), cls = c.e ? 'error' : c.w ? 'warn' : 'ok';
    const txt = c.e ? `${c.e} error${c.e > 1 ? 'es' : ''}` : c.w ? `${c.w} advertencia${c.w > 1 ? 's' : ''}` : 'Balances cerrados';
    $('#top').innerHTML = [
      ['Recuperación global', nf(R.au.recGlobal, 1), '%'], ['Oro en doré', nf(R.au.dore, 0), 'g/d'], ['Alimentación', nf(state.params.feedTpd, 1), 't/d'],
      ['NaCN', nf(R.reag.nacn, 1), 'kg/d'], ['Energía', nf(R.energy.perT, 1), 'kWh/t'], ['Cash cost', nf(GS.costs(state.params, R).cash, 0), 'USD/oz'],
    ].map((k) => `<div class="kp"><small>${k[0]}</small><b>${k[1]}</b><u>${k[2]}</u></div>`).join('') +
      `<span class="sp"></span><button class="chip ${cls}" data-go="resultados" title="Ver validación">${cls === 'ok' ? '✓' : '!'} ${txt}</button>`;
  }

  /* ------------------------------ INICIO -------------------------------- */
  function pInicio() {
    const sup = GS.PARAMS.filter((p) => p.src === 'SUP').length;
    return `<h1>Simulador de planta de beneficio de oro</h1>
    <p class="lead">Planta de 50 t/d con lixiviación por cianuración en carbón (CIL), reconstruida a partir de <b>Proyecto.pdf</b> y completada con la tesis de Srithammavut (2008), Yahya et al. (2020) y Ray &amp; Ray. Cada valor muestra su origen: documento, rango del documento, bibliografía, calibrado o supuesto.</p>
    <div class="tiles">
      ${tile('Recuperación global', nf(R.au.recGlobal, 1), '%', 'Proyecto: 90 % en el CIL', true)}
      ${tile('Oro en doré', nf(R.au.dore, 0), 'g/d', nf(R.au.byYear_kg, 0) + ' kg/año (' + state.params.opDays + ' d)', true)}
      ${tile('Ley del relave', nf(R.au.tailGrade, 2), 'g/t', 'Proyecto: 1 g/t')}
      ${tile('Tiempo de residencia', nf(R.cil.tauTot, 1), 'h', R.cil.N + ' tanques de ' + nf(R.cil.Veff, 1) + ' m³')}
      ${tile('Agua fresca', nf(R.water.fresh, 1), 'm³/d', nf(R.water.freshPerT, 2) + ' m³/t')}
      ${tile('NaCN', nf(R.reag.nacn, 1), 'kg/d', nf(R.reag.nacnSpec, 2) + ' kg/t')}
    </div>
    <div class="grid2">
      <div class="card"><h2>Cómo usarlo</h2>
        <ol class="note" style="padding-left:18px;margin:0;line-height:1.7">
          <li>En <b>Diagrama de flujo</b> haga clic en un equipo o una corriente para ver sus datos y cambiar sus variables.</li>
          <li>En <b>Variables</b> ajuste alimentación, conminución, lixiviación y recuperación; el resultado se recalcula al instante.</li>
          <li>En <b>Resultados</b> revise balances, pérdidas y la validación de coherencia.</li>
          <li>En <b>Costos y rentabilidad</b> vea ingresos, OPEX, VPN, TIR, cash cost y los precios de equilibrio.</li>
          <li>Toque <b>¿por qué?</b> junto a cualquier dato que no venga del Proyecto: los personajes explican su origen.</li>
          <li>En <b>Escenarios</b> guarde casos, compárelos y busque las mejores condiciones dentro de los límites.</li>
        </ol>
        <h3>Escenarios rápidos</h3><div class="pill-row">${PRESETS.map((p, i) => `<button class="btn sm" data-preset="${i}" title="${esc(p[1])}">${esc(p[0])}</button>`).join('')}</div></div>
      <div class="card"><h2>Estado del modelo</h2>
        ${kv([['Operaciones unitarias', '20'], ['Corrientes calculadas', R.streams.length], ['Parámetros editables', GS.PARAMS.length], ['Parámetros que son supuesto', sup], ['Cierre de sólidos / agua / oro', 'sí / sí / sí']])}
        <div class="note" style="margin-top:10px">Lo que el Proyecto no entrega se tomó de la literatura con fuente y fecha (<b>Literatura externa</b>, p. ej. Wi, valor K del carbón, precios y normas) o se calcula (potencia del molino, capacidad de la trituradora). Lo que ningún documento da queda como <b>Supuesto</b> editable, con su explicación. La lista completa está en <a href="#modelo" data-go="modelo">Modelo y datos</a>.</div>
        ${flagHtml(R.flags.filter((f) => f.lvl !== 'info').slice(0, 3))}</div>
    </div>`;
  }

  /* ------------------------------ FLUJO --------------------------------- */
  function pFlujo() {
    const modes = [['solids', 'Sólidos'], ['water', 'Agua'], ['pct', '% sólidos'], ['au', 'Oro']];
    return `<div class="fsbar"><h1 style="margin:0 12px 0 0">Diagrama de flujo</h1>
      <div class="seg2" role="group" aria-label="Dato en las corrientes">${modes.map((m) => `<button data-mode="${m[0]}" class="${state.labelMode === m[0] ? 'on' : ''}">${m[1]}</button>`).join('')}</div>
      <div class="lgd">${Object.entries(GS.flow.TYPENAME).map(([k, n]) => `<span><i style="background:${GS.flow.TYPECOL[k]}"></i>${esc(n)}</span>`).join('')}</div></div>
      <div class="fsw" id="fs"></div><div class="drawer" id="drw" style="margin-top:14px"></div>`;
  }
  function drawFlow() { const h = $('#fs'); if (h) GS.flow.render(h, R, { mode: state.labelMode, sel: state.sel }); }
  function streamList(nid) {
    const ins = R.streams.filter((s) => s.to === nid), outs = R.streams.filter((s) => s.from === nid);
    const row = (s) => `<tr data-sel-s="${s.id}" style="cursor:pointer"><td>${esc(s.name)}</td><td class="num">${nf(s.solids, 2)}</td><td class="num">${nf(s.water, 1)}</td><td class="num">${nf(s.au, 1)}</td></tr>`;
    const t = (l, a) => `<h4>${l}</h4>${a.length ? `<table><thead><tr><th>Corriente</th><th class="num">t/d</th><th class="num">m³/d</th><th class="num">g Au/d</th></tr></thead><tbody>${a.map(row).join('')}</tbody></table>` : '<div class="note">Sin corrientes.</div>'}`;
    return t('Entradas', ins) + t('Salidas', outs);
  }
  function reveal() { const d = $('#drw'); if (d) { const b = d.getBoundingClientRect(), m = $('#main').getBoundingClientRect(); if (b.top > m.bottom - 120) d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } }
  function drawer() {
    const host = $('#drw'); if (!host) return;
    if (state.sel.kind === 's') {
      const s = R.streams.find((x) => x.id === state.sel.id);
      const f = GS.flow.NODE[s.from], t = GS.flow.NODE[s.to];
      host.innerHTML = `<header><b>${esc(s.name)}</b><small>${esc(s.id)} · ${f ? f.id + '. ' + esc(f.name) : 'Origen externo'} → ${t ? t.id + '. ' + esc(t.name) : 'Destino externo'}</small></header><div class="bd">${kv([
        ['Tipo', esc(GS.flow.TYPENAME[s.type] || s.type)], ['Sólidos', nf(s.solids, 3) + ' t/d'], ['Agua', nf(s.water, 2) + ' m³/d'], ['Sólidos en pulpa', s.water > 0 ? nf(s.pct, 1) + ' %' : '—'],
        ['Oro', nf(s.au, 2) + ' g/d'], ['Ley', s.solids > 0 ? nf(s.gt, 2) + ' g/t' : '—']])}</div>`;
      return;
    }
    const n = GS.flow.NODE[state.sel.id], st = GS.flow.status(n, R);
    const tabs = [['res', 'Resumen'], ['esp', 'Especificaciones'], ['var', 'Variables'], ['str', 'Corrientes']];
    let body = '';
    if (state.dtab === 'res') body = kv(n.kpi(R).map((k) => [k[0], `${k[1]} ${k[2]}`])) + flagHtml(R.flags.filter((f) => GS.flow.status({ id: n.id }, { flags: [f] }) !== 'ok'));
    else if (state.dtab === 'esp') body = table(['Dato', 'Valor', 'Origen'], n.specs.map((s) => [esc(s[0]), esc(s[1]), badge(s[2])]));
    else if (state.dtab === 'var') body = n.vars && n.vars.length ? n.vars.map(ctl).join('').replace(/class="prow/g, 'style="grid-template-columns:1fr;padding:8px 0" class="prow') : '<div class="note">Este equipo no tiene variables propias.</div>';
    else body = streamList(n.id);
    host.innerHTML = `<header><b>${n.id}. ${esc(n.name)}</b><small>${esc(n.tag)} · ${esc(n.sub)} · <span class="chip ${st}" style="padding:0 8px">${st === 'ok' ? 'Normal' : st === 'warn' ? 'Advertencia' : 'Error'}</span></small></header>
      <div class="tabs">${tabs.map((t) => `<button data-dtab="${t[0]}" class="${state.dtab === t[0] ? 'on' : ''}">${t[1]}</button>`).join('')}</div><div class="bd">${body}</div>`;
  }

  /* ------------------------------ VARIABLES ----------------------------- */
  function pVariables() {
    return `<div class="fsbar"><h1 style="margin:0 12px 0 0">Variables de operación</h1><span class="note">Los valores iniciales salen del Proyecto; el distintivo indica el origen de cada dato.</span><span class="sp" style="flex:1"></span><button class="btn" data-resetall>Restablecer todo</button></div>
    <div class="split"><div>${GS.GROUPS.map((g, i) => { const ps = GS.PARAMS.filter((p) => p.group === g); return `<details class="grp"${i < 4 ? ' open' : ''}><summary>${esc(g)}<span class="cnt">${ps.length} variables</span></summary>${ps.map((p) => ctl(p.id)).join('')}</details>`; }).join('')}</div>
    <div class="stick"><div class="drawer"><header><b>Resultado en vivo</b><small>Se actualiza con cada cambio</small></header><div class="bd" id="live"></div></div></div></div>`;
  }
  function live() {
    const h = $('#live'); if (!h) return;
    $$('[data-hint]').forEach((el) => { el.textContent = HINT[el.dataset.hint](); });
    h.innerHTML = kv([['Recuperación CIL', nf(R.au.recCIL, 1) + ' %'], ['Recuperación global', nf(R.au.recGlobal, 1) + ' %'], ['Oro en doré', nf(R.au.dore, 0) + ' g/d'], ['Ley del relave', nf(R.au.tailGrade, 2) + ' g/t'],
      ['Tiempo de residencia', nf(R.cil.tauTot, 1) + ' h'], ['P80 / −75 µm', nf(state.params.p80, 0) + ' µm / ' + nf(R.pass75, 0) + ' %'], ['NaCN', nf(R.reag.nacn, 1) + ' kg/d'], ['Cal', nf(R.reag.lime, 1) + ' kg/d'],
      ['Agua fresca', nf(R.water.fresh, 1) + ' m³/d'], ['Energía', nf(R.energy.total, 0) + ' kWh/d']]) + '<h4>Alertas</h4>' +
      (flagHtml(R.flags) || '<div class="flg ok">Sin alertas de equipo ni de proceso.</div>');
  }

  /* ------------------------------ RESULTADOS ---------------------------- */
  function pResultados() {
    const a = R.au, rg = R.reag;
    const dist = [['Oro en doré', a.dore], ['Relave: oro no lixiviado', a.tailsSolids], ['Relave: oro disuelto', a.tailsSol], ['Finos de carbón', a.tailsFines], ['Pérdidas aguas abajo', a.downLoss]].filter((x) => x[1] > 1e-9);
    const cols = [C.COL[2], C.COL[1], C.COL[3], C.COL[5], C.COL[6]];
    const sanity = GS.sanity(state.params);
    const cats = {}; VAL.forEach((v) => (cats[v.cat] = cats[v.cat] || []).push(v));
    const vrow = (v) => `<div class="vrow"><span class="ic ${v.lvl}">${v.lvl === 'ok' ? '✓' : v.lvl === 'warn' ? '!' : '×'}</span><div>${esc(v.title)}<small>${esc(v.detail)}</small></div></div>`;
    return `<h1>Resultados</h1><p class="lead">Todo se recalcula con las variables actuales. Las ecuaciones están en Modelo y datos.</p>
    <div class="tiles">
      ${tile('Recuperación global', nf(a.recGlobal, 2), '%', 'Oro en doré ÷ oro de cabeza', true)}
      ${tile('Recuperación de lixiviación', nf(a.recLeach, 2), '%', 'Oro disuelto ÷ oro alimentado')}
      ${tile('Recuperación en carbón (CIL)', nf(a.recCIL, 2), '%', 'Oro adsorbido ÷ oro alimentado')}
      ${tile('Oro en solución (tanque 1)', nf(R.cil.solutionMgL[0], 2), 'mg/L', 'Último tanque: ' + nf(R.cil.solutionMgL[R.cil.N - 1], 3) + ' mg/L')}
      ${tile('Producción de doré', nf(a.dore, 1), 'g Au/d', nf(a.doreKg, 3) + ' kg Au/d · ' + nf(a.oz_d, 1) + ' oz/d', true)}
      ${tile('Producción anual', nf(a.byYear_kg, 1), 'kg Au', 'Barra doré de ' + nf(a.dore / (state.params.doreFine / 100) / 1000, 3) + ' kg/d')}
      ${tile('Ley de relave', nf(a.tailGrade, 3), 'g/t', 'Alimentación: ' + nf(state.params.headGrade, 2) + ' g/t')}
      ${tile('Carga del carbón', nf(R.cil.loading, 2), 'kg Au/t C', 'Máx.: ' + state.params.qMax)}
    </div>
    <div class="grid2">
      <div class="card"><h2>Distribución del oro</h2><div id="c-dist"></div></div>
      <div class="card"><h2>Pérdidas metalúrgicas</h2>${table(['Pérdida', '#g Au/d', '#% de la cabeza'], [
        ['Oro no lixiviado en el relave (sólidos)', nf(a.tailsSolids, 2), nf((100 * a.tailsSolids) / a.head, 2)],
        ['Oro disuelto no adsorbido (solución)', nf(a.tailsSol, 2), nf((100 * a.tailsSol) / a.head, 2)],
        ['Finos de carbón perdidos', nf(a.tailsFines, 2), nf((100 * a.tailsFines) / a.head, 2)],
        ['Pérdidas en desorción, EW y fundición', nf(a.downLoss, 2), nf((100 * a.downLoss) / a.head, 2)],
        ['<b>Total</b>', '<b>' + nf(a.tails + a.downLoss, 2) + '</b>', '<b>' + nf((100 * (a.tails + a.downLoss)) / a.head, 2) + '</b>']])}
        <div class="note" style="margin-top:8px">La mayor parte de la pérdida es oro que no se disuelve: baja con más tiempo, más cianuro, más oxígeno o molienda más fina.</div></div>
    </div>
    <div class="grid3">
      <div class="card"><h2>Reactivos</h2>${kv([['NaCN', nf(rg.nacn, 2) + ' kg/d (' + nf(rg.nacnSpec, 2) + ' kg/t)'], ['… estequiométrico', nf(R.cn.stoich * 1000, 0) + ' g/d'], ['… cianicidas', nf(R.cn.side, 2) + ' kg/d'], ['… con la solución', nf(R.cn.out, 2) + ' kg/d'],
        ['Cal (CaO)', nf(rg.lime, 1) + ' kg/d'], ['Carbón de reposición', nf(rg.carbon, 2) + ' kg/d'], ['O₂ estequiométrico', nf(rg.stoichO2 * 1000, 1) + ' g/d'], ['SO₂ (destrucción)', nf(R.detox.so2, 1) + ' kg/d'], ['Metabisulfito', nf(R.detox.smbs, 1) + ' kg/d'], ['NaOH elución', nf(R.elu.naoh_kg, 1) + ' kg/d'], ['Xantato / MIBC', nf(rg.xanthate, 2) + ' / ' + nf(rg.mibc, 2) + ' kg/d'], ['Floculante', nf(rg.floc, 2) + ' kg/d']])}</div>
      <div class="card"><h2>Agua</h2>${kv([['Demanda total', nf(R.water.demand, 1) + ' m³/d'], ['Recuperable', nf(R.water.recov, 1) + ' m³/d'], ['Recirculada', nf(R.water.recycled, 1) + ' m³/d'], ['Agua fresca', nf(R.water.fresh, 1) + ' m³/d'], ['Fresca por tonelada', nf(R.water.freshPerT, 2) + ' m³/t'], ['Purga', nf(R.water.purge, 1) + ' m³/d'], ['Humedad del mineral', nf(R.water.Wore, 2) + ' m³/d'], ['Agua en el relave', nf(R.water.Wtc, 2) + ' m³/d'], ['Cierre del balance', nf(R.water.closure, 6) + ' m³/d']])}</div>
      <div class="card"><h2>Energía</h2><div class="tw">${table(['Etapa', '#kWh/d'], R.energy.items.map((e) => [esc(e.k) + ' ' + badge(e.src), nf(e.v, 0)]).concat([['<b>Total</b>', '<b>' + nf(R.energy.total, 0) + '</b>']]))}</div>
        <div class="note" style="margin-top:6px">${nf(R.energy.perT, 1)} kWh/t · ${nf(R.energy.perOz, 0)} kWh/oz</div></div>
    </div>
    <div class="card"><h2>Corrientes de proceso</h2>${table(['Corriente', 'Origen → destino', '#Sólidos t/d', '#Agua m³/d', '#% sólidos', '#Oro g/d', '#Ley g/t'], R.streams.map((s) => {
      const f = GS.flow.NODE[s.from], t = GS.flow.NODE[s.to];
      return [`<b>${s.id}</b> ${esc(s.name)}`, `${f ? f.id : 'ext.'} → ${t ? t.id : 'ext.'}`, nf(s.solids, 3), nf(s.water, 2), s.water > 0 && s.solids > 0 ? nf(s.pct, 1) : '–', nf(s.au, 2), s.solids > 0 ? nf(s.gt, 2) : '–'];
    }))}</div>
    <div class="card"><h2>Validación</h2><p class="note" style="margin-top:0">Verifica cierres de balance, conservación del oro, unidades, capacidades y rangos del Proyecto.</p>
      ${flagHtml(R.flags)}<div class="grid2">${Object.entries(cats).map(([k, v]) => `<div><h3>${esc(k)}</h3>${v.map(vrow).join('')}</div>`).join('')}
      <div><h3>Prueba de dirección (cada variable +10 %)</h3>${sanity.map((s) => `<div class="vrow"><span class="ic ${s.ok ? 'ok' : 'error'}">${s.ok ? '✓' : '×'}</span><div>${esc(s.text)}<small>Δ = ${nf(s.delta, 3)}</small></div></div>`).join('')}</div></div></div>`;
  }
  function afterResultados() {
    const a = R.au, cols = [C.COL[2], C.COL[1], C.COL[3], C.COL[5], C.COL[6]];
    const dist = [['Oro en doré', a.dore], ['Relave: oro no lixiviado', a.tailsSolids], ['Relave: oro disuelto', a.tailsSol], ['Finos de carbón', a.tailsFines], ['Pérdidas aguas abajo', a.downLoss]];
    C.stack($('#c-dist'), { items: dist.map((d, i) => ({ name: d[0], val: d[1], color: cols[i] })), unit: 'g/d', d: 2 });
  }

  /* ------------------------------ GRÁFICOS ------------------------------ */
  const CH = [];
  function pGraficos() {
    CH.length = 0;
    const p = state.params, P = (id) => PB[id];
    const mk = (title, cfg) => { CH.push(cfg); return `<div class="card"><div class="cbox" id="ch${CH.length - 1}"></div></div>`; };
    const rec = (r) => r.au.recGlobal;
    const taus = range(6, 48, 15), nac = range(150, 700, 12), p80s = range(P('p80').min, P('p80').max, 12), feeds = range(10, 100, 16);
    const bT = { tauMode: 'objetivo' };
    CH.push({ type: 'line', title: 'Recuperación global vs. tiempo de residencia', xlab: 'Tiempo de residencia total (h)', ylab: 'Recuperación global (%)', series: [{ name: 'Recuperación global', color: C.COL[0], pts: sweep('tauTarget', taus, rec, bT) }], marker: { x: R.cil.tauTot, y: R.au.recGlobal, label: 'Punto actual' }, bands: [{ x0: 24, x1: 48, label: 'Rango del Proyecto' }], yfmt: (v) => nf(v, 1), xfmt: (v) => nf(v, 0) });
    CH.push({ type: 'line', title: 'Recuperación global vs. concentración de NaCN', xlab: 'NaCN (ppm = g/m³)', ylab: 'Recuperación global (%)', series: [{ name: 'Recuperación global', color: C.COL[1], pts: sweep('nacn', nac, rec) }], marker: { x: p.nacn, y: R.au.recGlobal, label: 'Punto actual' }, bands: [{ x0: 300, x1: 500, label: 'Rango §3.1' }], yfmt: (v) => nf(v, 1), xfmt: (v) => nf(v, 0) });
    CH.push({ type: 'line', title: 'Efecto de la granulometría (P80)', xlab: 'P80 de molienda (µm)', ylab: 'Recuperación global (%)', series: [{ name: 'Recuperación global', color: C.COL[2], pts: sweep('p80', p80s, rec) }], marker: { x: p.p80, y: R.au.recGlobal, label: 'Punto actual' }, bands: [{ x0: 75, x1: 150, label: 'Rango del Proyecto' }], yfmt: (v) => nf(v, 1), xfmt: (v) => nf(v, 0) });
    CH.push({ type: 'line', title: 'Energía de molienda vs. P80', xlab: 'P80 de molienda (µm)', ylab: 'Energía de molienda (kWh/t)', series: [{ name: 'Molienda (Bond)', color: C.COL[3], pts: sweep('p80', p80s, (r) => r.mill.kWhd / r.p.feedTpd) }], marker: { x: p.p80, y: R.mill.kWhd / p.feedTpd, label: 'Punto actual' }, yfmt: (v) => nf(v, 1), xfmt: (v) => nf(v, 0) });
    CH.push({ type: 'line', title: 'Producción de oro vs. alimentación', xlab: 'Alimentación (t/d)', ylab: 'Oro en doré (g/d)', series: [{ name: 'Oro en doré', color: C.COL[0], pts: sweep('feedTpd', feeds, (r) => r.au.dore) }], marker: { x: p.feedTpd, y: R.au.dore, label: 'Punto actual' }, yfmt: (v) => nf(v, 0), xfmt: (v) => nf(v, 0) });
    CH.push({ type: 'line', title: 'Recuperación global vs. alimentación (tanques instalados)', xlab: 'Alimentación (t/d)', ylab: 'Recuperación global (%)', series: [{ name: 'Recuperación global', color: C.COL[4], pts: sweep('feedTpd', feeds, rec) }], marker: { x: p.feedTpd, y: R.au.recGlobal, label: 'Punto actual' }, yfmt: (v) => nf(v, 1), xfmt: (v) => nf(v, 0) });
    CH.push({ type: 'line', title: 'Recuperación vs. oxígeno disuelto', xlab: 'O₂ disuelto (mg/L)', ylab: 'Recuperación global (%)', series: [{ name: 'Aire (21 % O₂)', color: C.COL[0], pts: sweep('dox', range(2, 8.2, 10), rec, { oxidant: 'aire' }) }, { name: 'Oxígeno (' + p.o2Purity + ' %)', color: C.COL[1], pts: sweep('dox', range(2, 20, 10), rec, { oxidant: 'oxígeno' }) }], marker: { x: p.dox, y: R.au.recGlobal, label: 'Punto actual' }, yfmt: (v) => nf(v, 1), xfmt: (v) => nf(v, 0) });
    CH.push({ type: 'line', title: 'Consumo de NaCN vs. concentración', xlab: 'NaCN (ppm = g/m³)', ylab: 'NaCN consumido (kg/d)', series: [{ name: 'NaCN', color: C.COL[3], pts: sweep('nacn', nac, (r) => r.reag.nacn) }], marker: { x: p.nacn, y: R.reag.nacn, label: 'Punto actual' }, yfmt: (v) => nf(v, 0), xfmt: (v) => nf(v, 0) });
    CH.push({ type: 'line', title: 'Avance de la lixiviación por tanque', xlab: 'Tanque (número)', ylab: 'Oro lixiviado acumulado (%)', series: [{ name: 'Oro lixiviado', color: C.COL[2], pts: R.cil.Cs.map((c, i) => [i, 100 * (1 - c / R.cil.Cs[0])]) }], xfmt: (v) => nf(v, 0), yfmt: (v) => nf(v, 0), h: 300 });
    const ps = R.psd.classes; let acc = 0;
    CH.push({ type: 'line', title: 'Distribución granulométrica del molino', xlab: 'Tamaño (µm)', ylab: '% pasante acumulado', series: [{ name: 'Pasante', color: C.COL[5], pts: ps.map((c) => { acc += c.w; return [c.hi, 100 * acc]; }) }], yfmt: (v) => nf(v, 0), xfmt: (v) => nf(v, 0), ymin: 0, ymax: 100 });
    CH.push({ type: 'stack' });
    return `<h1>Gráficos</h1><p class="lead">Cada curva corre el modelo completo variando una sola variable; el resto queda en los valores actuales. El punto marca la condición actual y la banda sombreada, el rango del Proyecto.</p>
      <div class="grid2">${CH.map((c, i) => `<div class="card"><div class="cbox" id="ch${i}"></div></div>`).join('')}</div>`;
  }
  function afterGraficos() {
    const a = R.au, cols = [C.COL[2], C.COL[1], C.COL[3], C.COL[5], C.COL[6]];
    CH.forEach((c, i) => {
      const h = $('#ch' + i); if (!h) return;
      if (c.type === 'line') C.line(h, c);
      else C.stack(h, { title: 'Distribución del oro entre corrientes', unit: 'g/d', d: 2, items: [['Doré', a.dore], ['Relave (sólidos)', a.tailsSolids], ['Relave (solución)', a.tailsSol], ['Finos de carbón', a.tailsFines], ['Pérdidas aguas abajo', a.downLoss]].map((d, k) => ({ name: d[0], val: d[1], color: cols[k] })) });
    });
  }

  /* ------------------------------ ESCENARIOS ---------------------------- */
  const METRICS = [
    ['Recuperación global', '%', (r) => r.au.recGlobal, 2, 1], ['Recuperación CIL', '%', (r) => r.au.recCIL, 2, 1], ['Oro en doré', 'g/d', (r) => r.au.dore, 1, 1],
    ['Producción anual', 'kg/año', (r) => r.au.byYear_kg, 1, 1], ['Ley del relave', 'g/t', (r) => r.au.tailGrade, 3, -1], ['Tiempo de residencia', 'h', (r) => r.cil.tauTot, 1, 0],
    ['NaCN', 'kg/d', (r) => r.reag.nacn, 1, -1], ['NaCN por oro producido', 'kg/g Au', (r) => r.reag.nacn / Math.max(1e-9, r.au.dore), 3, -1], ['Cal', 'kg/d', (r) => r.reag.lime, 1, -1],
    ['Agua fresca', 'm³/d', (r) => r.water.fresh, 1, -1], ['Energía total', 'kWh/d', (r) => r.energy.total, 0, -1], ['Energía por onza', 'kWh/oz', (r) => r.energy.perOz, 0, -1],
    ['VPN del proyecto', 'M USD', (r) => GS.costs(r.p, r).npv / 1e6, 1, 1], ['Cash cost', 'USD/oz', (r) => GS.costs(r.p, r).cash, 0, -1], ['AISC', 'USD/oz', (r) => GS.costs(r.p, r).aisc, 0, -1], ['OPEX de planta', 'USD/t', (r) => GS.costs(r.p, r).opexProcPerT, 1, -1],
    ['Utilización del molino', '%', (r) => r.mill.util * 100, 0, 0], ['Utilización de la trituradora', '%', (r) => r.crush.util * 100, 0, 0],
  ];
  const full = (sc) => Object.assign(GS.defaults(), sc.params);
  const cols = () => [{ id: '__cur', name: 'Actual (sin guardar)', params: state.params }].concat(state.scenarios.filter((s) => state.compare.includes(s.id)));
  function diffs(p) { return Object.keys(PB).filter((k) => p[k] !== PB[k].def).map((k) => `${PB[k].label}: ${p[k]} ${PB[k].unit}`); }
  function pEscenarios() {
    const sc = state.scenarios;
    return `<h1>Escenarios</h1><p class="lead">Guarde las variables actuales como escenario, compare varios y busque las mejores condiciones. Los escenarios quedan en este navegador; use Exportar para llevarlos a otro equipo.</p>
    <div class="grid2"><div class="card"><h2>Casos de partida</h2><div class="pill-row">${PRESETS.map((p, i) => `<button class="btn sm" data-preset="${i}" title="${esc(p[1])}">${esc(p[0])}</button>`).join('')}</div>
      <h3>Guardar el estado actual</h3><div class="pill-row"><input id="scn-name" placeholder="Nombre del escenario" style="padding:6px 9px;border:1px solid var(--line);border-radius:7px;min-width:220px"><button class="btn pri" data-save>Guardar escenario</button></div>
      <h3>Escenarios guardados (${sc.length})</h3>${sc.length ? sc.map((s) => `<div class="scn${s.id === state.cur ? ' cur' : ''}"><input type="checkbox" data-cmp="${s.id}" ${state.compare.includes(s.id) ? 'checked' : ''} aria-label="Comparar ${esc(s.name)}"><div><b>${esc(s.name)}</b><div class="note">${esc(s.preset || diffs(full(s)).slice(0, 3).join(' · ') || 'Valores de diseño')}</div></div>
        <div class="pill-row"><button class="btn sm" data-load="${s.id}">Cargar</button><button class="btn sm" data-ren="${s.id}">Renombrar</button><button class="btn sm" data-dup="${s.id}">Duplicar</button><button class="btn sm" data-del="${s.id}">Borrar</button></div></div>`).join('') : '<div class="empty">Aún no hay escenarios guardados.</div>'}
      <div class="pill-row" style="margin-top:10px"><button class="btn sm" data-exp>Exportar JSON</button><label class="btn sm" style="cursor:pointer">Importar JSON<input type="file" id="imp" accept=".json,application/json" hidden></label></div></div>
    <div class="card"><h2>Buscar mejores condiciones</h2><p class="note" style="margin-top:0">Recorre NaCN, pH, P80, sólidos del CIL y O₂ disuelto dentro de los rangos del Proyecto. Descarta casos con errores de equipo, sin saturación de O₂ o con CNWAD sobre el límite.</p>
      <div class="pill-row"><select id="opt-obj"><option value="oro"${state.optObj === 'oro' ? ' selected' : ''}>Maximizar oro producido</option><option value="cn"${state.optObj === 'cn' ? ' selected' : ''}>Minimizar NaCN por oro</option><option value="energy"${state.optObj === 'energy' ? ' selected' : ''}>Maximizar oro por energía</option><option value="vpn"${state.optObj === 'vpn' ? ' selected' : ''}>Maximizar VPN</option></select>
      <label class="note">Recuperación mínima <input id="opt-min" type="number" value="${state.optMin}" min="50" max="99" style="width:64px;padding:4px"> %</label><button class="btn pri" data-opt>Buscar</button></div>
      <div id="opt-out" style="margin-top:10px">${optHtml()}</div></div></div>
    <div class="card"><h2>Comparación</h2><div id="cmp"></div></div>`;
  }
  function optHtml() {
    if (!state.opt) return '<div class="note">Elija un objetivo y pulse Buscar.</div>';
    if (!state.opt.length) return '<div class="flg warn">Ninguna combinación cumple los límites; reduzca la recuperación mínima.</div>';
    return table(['Variables', '#Rec. global %', '#Oro g/d', '#NaCN kg/d', ''], state.opt.map((o, i) => [esc(`NaCN ${o.vars.nacn} · pH ${o.vars.ph} · P80 ${o.vars.p80} · ${o.vars.cilSolids} % sól. · DO ${o.vars.dox}`), nf(o.r.au.recGlobal, 2), nf(o.r.au.dore, 1), nf(o.r.reag.nacn, 1), `<button class="btn sm" data-optap="${i}">Aplicar</button> <button class="btn sm" data-optsv="${i}">Guardar</button>`]));
  }
  function afterEscenarios() {
    const cs = cols(), host = $('#cmp'); if (!host) return;
    const rs = cs.map((c) => GS.run(Object.assign(GS.defaults(), c.params)));
    if (cs.length < 2) { host.innerHTML = '<div class="empty">Marque uno o más escenarios guardados para compararlos con el estado actual.</div>'; return; }
    const head = ['Indicador'].concat(cs.map((c) => c.name));
    const dlt = (m, v, b) => { if (v === b) return ''; const d = v - b, good = m[4] === 0 ? null : (d > 0) === (m[4] > 0); return ` <small class="dl ${good === null ? 'z' : good ? '' : 'neg'}">${d > 0 ? '+' : ''}${nf(d, m[3])}</small>`; };
    const rows = METRICS.map((m) => [`${m[0]} <span class="tag">${m[1]}</span>`].concat(rs.map((r, i) => nf(m[2](r), m[3]) + (i ? dlt(m, m[2](r), m[2](rs[0])) : ''))));
    rows.push(['Variables distintas del diseño'].concat(cs.map((c) => `<span class="note">${esc(diffs(full(c)).join('; ') || 'ninguna')}</span>`)));
    rows.push(['Alertas'].concat(rs.map((r) => (r.flags.filter((f) => f.lvl !== 'info').map((f) => esc(f.id)).join(', ') || '—'))));
    host.innerHTML = `<div id="cmp-t">${table(head, rows)}</div><div class="grid2" style="margin-top:12px"><div class="cbox" id="cmp-a"></div><div class="cbox" id="cmp-b"></div></div>`;
    const names = cs.map((c) => c.name);
    C.bars($('#cmp-a'), { title: 'Recuperación global (%)', cats: names, series: [{ name: 'Recuperación global', color: C.COL[0], vals: rs.map((r) => r.au.recGlobal) }], yfmt: (v) => nf(v, 1), h: 260 });
    C.bars($('#cmp-b'), { title: 'Oro en doré (g/d)', cats: names, series: [{ name: 'Oro en doré', color: C.COL[2], vals: rs.map((r) => r.au.dore) }], yfmt: (v) => nf(v, 0), h: 260 });
  }
  function addScenario(name, params, preset) {
    const s = { id: 's' + Date.now().toString(36) + Math.floor(Math.random() * 1e3), name, params: Object.assign({}, params), ts: Date.now(), preset };
    state.scenarios.push(s); state.compare.push(s.id); store.set(KEY_S, state.scenarios); return s;
  }

  /* ------------------------------ EQUIPOS ------------------------------- */
  function pEquipos() {
    const N = GS.flow.NODES.slice().sort((a, b) => a.id - b.id);
    return `<h1>Equipos</h1><p class="lead">Las 20 operaciones del Proyecto (Fig. 1). Haga clic en una fila para abrirla en el diagrama.</p>
      ${table(['N.º', 'Equipo', 'Código', 'Estado', 'Indicadores', 'Especificaciones del documento'], N.map((n) => {
        const st = GS.flow.status(n, R);
        return [`<b>${n.id}</b>`, `<a href="#flujo" data-node="${n.id}"><b>${esc(n.name)}</b></a><div class="note">${esc(n.sub)}</div>`, `<span class="tag">${esc(n.tag)}</span>`, `<span class="chip ${st}" style="padding:0 8px">${st === 'ok' ? 'Normal' : st === 'warn' ? 'Advertencia' : 'Error'}</span>`,
          n.kpi(R).map((k) => `${esc(k[0])} <b>${esc(k[1])}</b> ${esc(k[2])}`).join('<br>'), n.specs.map((s) => `${esc(s[0])}: ${esc(s[1])} ${badge(s[2])}`).join('<br>')];
      }))}`;
  }

  /* ------------------------------ MODELO Y DATOS ------------------------ */
  function pModelo() {
    const D = GS.DOCS, ver = GS.verifyDesign();
    return `<h1>Modelo y datos</h1><p class="lead">Qué dicen los documentos, qué falta, qué se contradice y con qué ecuaciones se calcula. Ningún valor de recuperación se fija a mano: la cinética se calibra con el único punto del Proyecto (90 % a 24 h) y responde a las variables.</p>
    <div class="card"><h2>Documentos usados</h2>${table(['Documento', 'Aporte'], D.sources.map((s) => [`<b>${esc(s[0])}</b>`, esc(s[1])]))}</div>
    <div class="card"><h2>Comprobación contra el diseño del Proyecto</h2>${table(['Magnitud', '#Proyecto', '#Modelo', 'Unidad', '#Error', 'Estado'], ver.map((v) => [esc(v.name), nf(v.doc, 2), nf(v.model, 2), esc(v.unit), nf(v.err * 100, 2) + ' %', `<span class="chip ${v.ok ? 'ok' : 'warn'}" style="padding:0 8px">${v.ok ? 'Coincide' : 'Revisar'}</span>`]))}</div>
    <div class="card"><h2>Contradicciones entre documentos</h2>${table(['Tema', 'Qué dicen', 'Cómo se resolvió'], D.contradictions.map((c) => [`<b>${esc(c[0])}</b>`, esc(c[1]), esc(c[2])]))}</div>
    <div class="grid2"><div class="card"><h2>Datos que faltan</h2><ul class="note" style="padding-left:18px;line-height:1.6;margin:0">${D.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>
    <div class="card"><h2>Limitaciones conocidas</h2><ul class="note" style="padding-left:18px;line-height:1.6;margin:0">
      <li>Con oxígeno el modelo llega a ≈ 93 %, no a 96 %: el efecto del nitrato de plomo no se modela porque los documentos no dan datos cinéticos.</li>
      <li>La constante cinética K se calibra a un punto; fuera del rango 24–48 h, 300–500 ppm y 75–150 µm las tendencias son cualitativas.</li>
      <li>La adsorción usa la cinética de Nicol–Fleming con el valor K de los fabricantes de carbón (isoterma lineal por defecto, Freundlich si m &lt; 1); la constante de velocidad k<sub>ads</sub> se calibra, no se mide.</li>
      <li>Los costos son una estimación de clase 5: el CAPEX se escala desde una planta de 610 t/d, no hay cotización de una planta de 50 t/d, y la mina no está incluida.</li>
      <li>Gravimetría y flotación quedan en cero por defecto (caso fiel al Proyecto); se activan con las fracciones de oro libre y en sulfuros.</li></ul></div></div>
    <div class="card"><h2>Supuestos que quedan y por qué</h2><p class="note">Se redujeron los supuestos: lo que tenía fuente se reemplazó por dato de literatura (etiqueta <b>Literatura externa</b>, con fecha) y lo que se puede calcular ahora se dimensiona (potencia del molino, capacidad de la trituradora). Lo que sigue es lo que ningún documento entrega.</p>${table(['Parámetro', '#Valor', 'Unidad', 'Origen', 'Por qué'], GS.PARAMS.filter((p) => p.src === 'SUP').map((p) => [esc(p.label), nf(p.def, 2), esc(p.unit), badge(p.src), esc(GS.WHY[p.id] || p.ref || '')]))}</div>
    <div class="card"><h2>Datos de literatura externa y calibrados</h2>${table(['Parámetro', '#Valor', 'Unidad', 'Origen', 'Fuente y razón'], GS.PARAMS.filter((p) => p.src === 'LIT' || p.src === 'CAL').map((p) => [esc(p.label), nf(p.def, 3), esc(p.unit), badge(p.src), esc(p.ref || '')]))}</div>
    <div class="card"><h2>Ecuaciones</h2>${D.eqs.map((g) => `<h3>${esc(g.sec)}</h3>${g.items.map((it) => `<div style="margin-bottom:12px"><b>${esc(it.t)}</b><div class="eq">${esc(it.e)}</div><div class="note"><b>Fuente:</b> ${esc(it.s)}<br><b>Nota:</b> ${esc(it.a)}</div></div>`).join('')}`).join('')}</div>`;
  }

  /* ------------------------------ COSTOS -------------------------------- */
  const kM = () => (state.ccy === 'COP' ? state.params.trm / 1e6 : 1 / 1e6); // USD → M de la moneda activa
  const mU = () => (state.ccy === 'COP' ? 'M COP' : 'M USD');
  const mv = (usd, d) => nf(usd * kM(), d == null ? 2 : d);
  function pCostos() {
    const econ = GS.PARAMS.filter((p) => p.group === 'Economía');
    return `<div class="fsbar"><h1 style="margin:0 12px 0 0">Costos y rentabilidad</h1><span class="note">Ingresos, costos, impuestos, VPN, TIR y puntos de equilibrio calculados con el balance de la planta.</span><span class="sp" style="flex:1"></span>
      <div class="seg2" role="group" aria-label="Moneda"><button data-ccy="USD" class="${state.ccy === 'USD' ? 'on' : ''}">USD</button><button data-ccy="COP" class="${state.ccy === 'COP' ? 'on' : ''}">COP</button></div></div>
    <div id="cost-out"></div>
    <details class="grp" open><summary>Supuestos económicos<span class="cnt">${econ.length} variables</span></summary>
      <div class="note" style="padding:8px 2px">Cada precio y norma lleva su fuente y fecha. Lo marcado <b>Supuesto</b> no tiene dato público verificable: reemplácelo con una cotización. Toque «¿por qué?» para que Don Peso se lo explique.</div>${econ.map((p) => ctl(p.id)).join('')}</details>`;
  }
  const torHtml = (t) => {
    const mx = Math.max(1, ...t.rows.map((r) => Math.max(Math.abs(r.lo), Math.abs(r.hi))));
    const bar = (v) => `<i class="${v < 0 ? 'neg' : 'pos'}" style="${v < 0 ? 'right' : 'left'}:50%;width:${(Math.abs(v) / mx) * 50}%"></i>`;
    return `<div class="tor">${t.rows.map((r) => `<div class="tr"><span class="tl">${esc(r.label)}</span><div class="tb">${bar(r.lo)}${bar(r.hi)}<s></s></div><span class="tv">${r.lo > 0 ? '+' : ''}${mv(r.lo, 1)} / ${r.hi > 0 ? '+' : ''}${mv(r.hi, 1)}</span></div>`).join('')}</div>
      <div class="note">Cambio del VPN (${mU()}) respecto al caso actual al mover cada variable. Rojo = baja el VPN; verde = lo sube.</div>`;
  };
  function afterCostos() {
    const host = $('#cost-out'); if (!host) return;
    const p = state.params, c = GS.costs(p, R), sc = GS.priceScenarios(p, R), tor = GS.tornado(p, R);
    const beP = GS.breakEven(p, R, 'price', 'npv'), beC = GS.breakEven(p, R, 'price', 'cash'), beG = GS.breakEven(p, R, 'grade', 'npv'), mm = GS.maxMiningCost(p, R);
    const pc = GS.priceCurve(p, R, 24), trm = p.trm;
    const T = (l, v, u, d, h) => tile(l, v, u, d, h);
    const warn = p.miningCost === 0 ? `<div class="flg warn"><b>Alcance:</b> el Proyecto sólo cubre la planta, por eso el costo de mina es 0 USD/t. Con ese supuesto el VPN y la TIR son optimistas. El proyecto soporta hasta <b>${nf(mm, 0)} USD/t</b> de mina y transporte antes de que el VPN sea cero.</div>` : '';
    const flagsC = [];
    if (c.opexProcPerT < 7) flagsC.push('El OPEX de planta es menor que el de Robex (7,38 USD/t, planta mayor): revise los supuestos de personal y energía.');
    if (c.irr != null && c.irr > 1) flagsC.push('TIR > 100 %: señal de que falta el costo de mina o de que el CAPEX escalado se quedó corto.');
    const rows = [
      ['Ingreso bruto', c.gross, 1], ['Regalía (' + nf(p.royalty, 1) + ' %)', -c.royalty, 0], ...c.reag.map((x) => ['Reactivos · ' + x.k.toLowerCase() + ' (' + nf(x.q, 1) + ' ' + x.u + ')', -x.v, 0]),
      ['Energía (' + nf(R.energy.total, 0) + ' kWh/d)', -c.energy, 0], ['Mano de obra', -c.labor, 0], ['Mantenimiento', -c.maint, 0], ['Otros costos fijos', -c.fixedOther, 0], ['Mina y transporte', -c.mining, 0],
      ['EBITDA', c.ebitda, 1], ['Depreciación (línea recta, ' + p.lifeYears + ' años)', -c.dep, 0], ['Utilidad antes de impuestos', c.ebt, 1], ['Impuesto de renta (' + nf(p.taxRate, 0) + ' %)', -c.tax, 0], ['Utilidad neta', c.net, 1],
      ['Capital de sostenimiento', -c.sust, 0], ['Flujo de caja libre anual', c.fcf, 1],
    ];
    host.innerHTML = `${warn}${flagsC.map((m) => `<div class="flg info"><b>Nota:</b> ${esc(m)}</div>`).join('')}
    <div class="tiles">
      ${T('Ingreso anual', mv(c.gross, 2), mU(), nf(c.ozYear, 0) + ' oz/año recuperadas · ' + nf(c.sold, 0) + ' oz vendidas', true)}
      ${T('VPN a ' + nf(p.discount, 1) + ' %', mv(c.npv, 1), mU(), p.lifeYears + ' años · CAPEX ' + mv(c.capex, 2) + ' ' + mU(), true)}
      ${T('TIR', c.irr == null ? '–' : nf(c.irr * 100, 0), '%', c.payback == null ? 'sin recuperación' : 'Recuperación de la inversión: ' + nf(c.payback * 12, 1) + ' meses')}
      ${T('Cash cost', nf(c.cash, 0), 'USD/oz', 'AISC ' + nf(c.aisc, 0) + ' USD/oz')}
      ${T('OPEX de planta', nf(c.opexProcPerT, 1), 'USD/t', 'Total con mina: ' + nf(c.opexPerT, 1) + ' USD/t')}
      ${T('Margen EBITDA', nf(c.margin * 100, 0), '%', 'EBITDA ' + mv(c.ebitda, 2) + ' ' + mU() + '/año')}
    </div>
    <div class="grid2">
      <div class="card"><div class="cbox" id="cc0"></div></div>
      <div class="card"><div class="cbox" id="cc1"></div></div>
      <div class="card"><div class="cbox" id="cc2"></div><div class="note">Precio de equilibrio con VPN = 0: <b>${beP ? nf(beP * p.goldPrice, 0) : '–'} USD/oz</b> · con EBITDA = 0: <b>${beC ? nf(beC * p.goldPrice, 0) : '–'} USD/oz</b> · ley de equilibrio (VPN = 0): <b>${beG ? nf(beG * p.headGrade, 2) : '–'} g/t</b>.</div></div>
      <div class="card"><h2>¿Qué mueve el VPN?</h2>${torHtml(tor)}</div>
    </div>
    <div class="grid2">
      <div class="card"><h2>Escenarios de precio</h2>${table(['Escenario', '#Precio USD/oz', '#EBITDA ' + mU(), '#VPN ' + mU(), '#TIR %'], sc.map((s) => [esc(s.name), nf(s.price, 0), mv(s.ebitda, 2), mv(s.npv, 1), s.irr == null ? '–' : nf(s.irr * 100, 0)]))}
        <div class="note">Bajo/alto = ∓25 % sobre el precio actual (rango sugerido de ∓20–25 %). Referencia de banco: Goldman Sachs 4.150 USD/oz a fin de 2026.</div></div>
      <div class="card"><h2>Control contra referencias</h2>${table(['Referencia', '#Valor', 'Nota'], [
        ['Su planta, procesamiento', nf(c.opexProcPerT, 1) + ' USD/t', '50 t/d'],
        ['Robex (planta mayor)', '7,38 USD/t', 'NI 43-101'],
        ['Gourbassi/Barani (≈ 610 t/d)', '16,30 USD/t · CAPEX 15 M USD', 'Otra versión: 13,90 USD/t · 20,4 M USD'],
        ['Pequeña escala, Filipinas (IMPC 2024)', '2.803–2.852 PhP/t', 'No convertido a USD aquí'],
        ['Proyecto CIL de 1.500 t/d', 'cash 792 · AISC 794 USD/oz', 'Costo operativo 688 USD/oz'],
        ['Su planta, cash cost / AISC', nf(c.cash, 0) + ' / ' + nf(c.aisc, 0) + ' USD/oz', 'Más bajo por la ley de ' + nf(p.headGrade, 1) + ' g/t y sin mina'],
      ])}<div class="note">Las referencias vienen de los datos aportados por el usuario y no se verificaron en los informes NI 43-101 originales; úselas sólo como orden de magnitud.</div></div>
    </div>
    <div class="card"><h2>Estado de resultados anual (año de operación normal)</h2>${table(['Concepto', '#' + mU()], rows.map((r) => [r[2] ? '<b>' + esc(r[0]) + '</b>' : esc(r[0]), r[2] ? '<b>' + mv(r[1], 3) + '</b>' : mv(r[1], 3)]))}
      <div class="note">TRM ${nf(trm, 0)} COP/USD. Depreciación en línea recta; sin inflación, sin capital de trabajo y sin recuperación de salvamento.</div></div>`;
    const k = kM();
    const cols = [C.COL[0], C.COL[1], C.COL[2], C.COL[3], C.COL[4], C.COL[5], C.COL[6]];
    C.stack($('#cc0'), { title: 'Costo anual de operación (OPEX)', unit: mU() + '/año', d: 3, items: [
      ...c.reag.map((x) => [x.k, x.v]), ['Energía', c.energy], ['Mano de obra', c.labor], ['Mantenimiento', c.maint], ['Otros fijos', c.fixedOther], ['Mina y transporte', c.mining],
    ].map((d, i) => ({ name: d[0], val: d[1] * k, color: C.COL[i % C.COL.length] })) });
    C.line($('#cc1'), { title: 'Flujo de caja acumulado', xlab: 'Año', ylab: 'Acumulado (' + mU() + ')', series: [{ name: 'Acumulado', color: C.COL[2], pts: c.cumulative.map((v, i) => [i, v * k]) }], xfmt: (v) => nf(v, 0), yfmt: (v) => nf(v, 0), h: 280 });
    C.line($('#cc2'), { title: 'VPN según el precio del oro', xlab: 'Precio del oro (USD/oz)', ylab: 'VPN (' + mU() + ')', series: [{ name: 'VPN', color: C.COL[1], pts: pc.map((q) => [q.price, q.npv * k]) }], marker: { x: p.goldPrice, y: c.npv * k, label: 'Precio actual' }, xfmt: (v) => nf(v, 0), yfmt: (v) => nf(v, 0), h: 280 });
  }

  /* ------------------------------ GUÍA ILUSTRADA ------------------------ */
  const guide = { on: store.get('gs_guide_on', true), i: 0, msg: null, ch: null };
  function dynTips() {
    const t = [], a = R.au;
    if (state.page === 'variables' || state.page === 'inicio' || state.page === 'resultados') {
      if (a.recGlobal < 80) t.push(`La recuperación global está en ${nf(a.recGlobal, 1)} %. Revisa tiempo de residencia, P80 y concentración de cianuro.`);
      if (R.cil.loading > 10) t.push(`Carbonín dice: llevo ${nf(R.cil.loading, 1)} kg de oro por tonelada, ¡demasiado para el rango del Proyecto (1–10)! Sube el carbón transferido.`);
      if (R.flags.some((f) => f.id === 'do_sat')) t.push('El oxígeno disuelto pedido supera lo que el aire puede dar a esa altitud y temperatura. Prueba con oxígeno o baja el valor.');
      if (state.params.ph < 10) t.push('Con pH menor de 10 parte del cianuro se pierde como gas HCN. ¡Sube el pH con cal!');
    }
    if (state.page === 'costos') {
      const c = GS.costs(state.params, R);
      if (c.npv < 0) t.push('Con estos supuestos el VPN es negativo: revisa el precio, la ley o el CAPEX.');
      if (state.params.miningCost === 0) t.push('Todavía no has cobrado la mina. Escribe un costo en «Costo de mina y transporte» para ver una rentabilidad más realista.');
    }
    return t;
  }
  function renderGuide() {
    let el = $('#guide'); if (!el) { el = doc.createElement('aside'); el.id = 'guide'; el.setAttribute('aria-label', 'Guía ilustrada'); doc.body.appendChild(el); }
    // anclada en la barra lateral si cabe; flotante en pantallas pequeñas
    const dock = root.innerWidth > 1100 && root.innerHeight >= 720, side = $('.side'), foot = $('.side .foot');
    if (dock && side && el.parentNode !== side) { side.insertBefore(el, foot); el.classList.add('docked'); }
    else if (!dock && el.parentNode !== doc.body) { doc.body.appendChild(el); el.classList.remove('docked'); }
    const k = guide.ch || GS.PAGE_CHAR[state.page] || 'pepita', ch = GS.CHARS[k];
    if (!guide.on) { el.innerHTML = `<button class="gshow" data-gshow title="Mostrar a ${esc(ch.name)}" aria-label="Mostrar guía">${GS.charSVG(k, 44)}</button>`; return; }
    const tips = dynTips().concat(GS.PAGE_TIPS[state.page] || []);
    const text = guide.msg != null ? guide.msg : tips[guide.i % tips.length];
    el.innerHTML = `<div class="gwrap"><div class="gbub"><div class="gh"><b>${esc(ch.name)}</b><small>${esc(ch.role)}</small></div><p>${esc(text)}</p><div class="gact"><button data-gnext>${guide.msg != null ? 'Volver a los consejos' : 'Otro dato'}</button><button data-ghide>Ocultar</button></div></div><div class="gchar">${GS.charSVG(k, 66)}</div></div>`;
  }
  function say(ch, msg) { guide.on = true; guide.ch = ch; guide.msg = msg; store.set('gs_guide_on', true); renderGuide(); }

  /* ------------------------------ render -------------------------------- */
  const VIEW = { costos: [pCostos, afterCostos], inicio: [pInicio], flujo: [pFlujo, () => { drawFlow(); drawer(); }], variables: [pVariables, live], resultados: [pResultados, afterResultados], graficos: [pGraficos, afterGraficos], escenarios: [pEscenarios, afterEscenarios], equipos: [pEquipos], modelo: [pModelo] };
  function nav() {
    $('#nav').innerHTML = PAGES.map((p) => `<button data-go="${p[0]}" class="${state.page === p[0] ? 'on' : ''}" ${state.page === p[0] ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24"><path d="${p[2]}"/></svg><span>${p[1]}</span></button>`).join('');
  }
  function render() {
    const m = $('#main'), sc = m.scrollTop, v = VIEW[state.page];
    m.innerHTML = v[0](); if (v[1]) v[1](); nav(); topbar();
    m.scrollTop = sc;
    if (guide.page !== state.page) { guide.page = state.page; guide.i = 0; guide.msg = null; guide.ch = null; }
    renderGuide();
  }
  function go(page) { state.page = page; if (root.location.hash !== '#' + page) root.history.replaceState(null, '', '#' + page); render(); $('#main').scrollTop = 0; }
  /* actualización parcial mientras se arrastra un control */
  let raf = 0;
  function onParam() {
    if (raf) return;
    raf = root.requestAnimationFrame(() => {
      raf = 0; compute(); topbar();
      if (state.page === 'variables') live();
      else if (state.page === 'flujo') { drawFlow(); if (state.dtab !== 'var') drawer(); }
      else if (state.page === 'costos') afterCostos();
      else if (state.page === 'inicio' || state.page === 'equipos') render();
    });
  }
  function setParam(id, v) {
    const p = PB[id]; if (!p) return;
    state.params[id] = v;
    $$(`[data-row="${id}"]`).forEach((row) => row.classList.toggle('ed', v !== p.def));
    $$(`[data-p="${id}"]`).forEach((el) => { if (el !== doc.activeElement && el.value !== String(v)) el.value = v; });
    persist(); onParam();
  }
  function applySet(set, name) {
    state.params = Object.assign(GS.defaults(), set); persist(); compute();
    state.cur = null; render(); toast(name ? 'Cargado: ' + name : 'Valores aplicados');
  }
  function toast(t) {
    let e = $('#toast'); if (!e) { e = doc.createElement('div'); e.id = 'toast'; e.setAttribute('role', 'status'); e.style.cssText = 'position:fixed;right:18px;bottom:18px;background:#1b2430;color:#fff;padding:9px 14px;border-radius:8px;font-size:13px;z-index:50;transition:opacity .3s'; doc.body.appendChild(e); }
    e.textContent = t; e.style.opacity = 1; clearTimeout(e._t); e._t = setTimeout(() => (e.style.opacity = 0), 2200);
  }

  /* ------------------------------ eventos ------------------------------- */
  function bind() {
    doc.addEventListener('input', (e) => {
      const el = e.target, id = el.dataset && el.dataset.p; if (!id) return;
      if (el.tagName === 'SELECT') return;
      const v = parseFloat(el.value); if (!isFinite(v)) return;
      const p = PB[id]; setParam(id, p.int ? Math.round(clamp(v, p)) : clamp(v, p));
    });
    doc.addEventListener('change', (e) => {
      const el = e.target;
      if (el.dataset && el.dataset.p) { const p = PB[el.dataset.p]; if (el.tagName === 'SELECT') { setParam(p.id, el.value); render(); } else { const v = clamp(parseFloat(el.value) || p.def, p); setParam(p.id, p.int ? Math.round(v) : v); el.value = state.params[p.id]; } }
      else if (el.id === 'imp') importJson(el.files[0]);
      else if (el.dataset && el.dataset.cmp) { const i = state.compare.indexOf(el.dataset.cmp); if (el.checked && i < 0) state.compare.push(el.dataset.cmp); else if (!el.checked && i >= 0) state.compare.splice(i, 1); afterEscenarios(); }
      else if (el.id === 'opt-obj') state.optObj = el.value;
      else if (el.id === 'opt-min') state.optMin = parseFloat(el.value) || 85;
    });
    doc.addEventListener('click', (e) => {
      const t = e.target.closest('[data-go],[data-why],[data-gnext],[data-ghide],[data-gshow],[data-ccy],[data-mode],[data-dtab],[data-reset],[data-resetall],[data-preset],[data-save],[data-load],[data-ren],[data-dup],[data-del],[data-exp],[data-opt],[data-optap],[data-optsv],[data-node],[data-sel-s],.node,.strm');
      if (!t) return;
      const d = t.dataset;
      if (d.go) { e.preventDefault(); go(d.go); }
      else if (d.why) { const p = PB[d.why]; say(p.group === 'Economía' ? 'peso' : ['kAds', 'kFre', 'mFre', 'qMax', 'carbonXfer'].includes(d.why) ? 'carbonin' : ['wi', 'millPower', 'crushCap', 'crushHours', 'romF80', 'rrN'].includes(d.why) ? 'moli' : 'cianita', `${p.label} (${GS.SRC_LABEL[p.src]}): ${GS.WHY[d.why]}`); }
      else if (d.gnext !== undefined) { if (guide.msg != null) { guide.msg = null; guide.ch = null; } else guide.i++; renderGuide(); }
      else if (d.ghide !== undefined) { guide.on = false; store.set('gs_guide_on', false); renderGuide(); }
      else if (d.gshow !== undefined) { guide.on = true; guide.msg = null; store.set('gs_guide_on', true); renderGuide(); }
      else if (d.ccy) { state.ccy = d.ccy; render(); }
      else if (d.node) { e.preventDefault(); state.sel = { kind: 'n', id: +d.node }; state.dtab = 'res'; go('flujo'); }
      else if (d.mode) { state.labelMode = d.mode; $$('[data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === d.mode)); drawFlow(); }
      else if (d.dtab) { state.dtab = d.dtab; drawer(); }
      else if (d.selS) { state.sel = { kind: 's', id: d.selS }; drawFlow(); drawer(); }
      else if (t.classList.contains('node')) { state.sel = { kind: 'n', id: +t.dataset.n }; drawFlow(); drawer(); reveal(); const nt = GS.NODE_TIPS[+t.dataset.n]; if (nt && guide.on) say(nt[0], nt[1]); }
      else if (t.classList.contains('strm')) { state.sel = { kind: 's', id: t.dataset.s }; drawFlow(); drawer(); reveal(); }
      else if (d.reset) { const p = PB[d.reset]; setParam(p.id, p.def); $$(`[data-p="${p.id}"]`).forEach((el) => (el.value = p.def)); if (p.choices) render(); }
      else if (d.resetall !== undefined) applySet({}, 'valores de diseño');
      else if (d.preset) { const p = PRESETS[+d.preset]; applySet(p[2], p[0]); state.presetName = p[0]; }
      else if (d.save !== undefined) { const n = ($('#scn-name').value || '').trim() || 'Escenario ' + (state.scenarios.length + 1); const s = addScenario(n, state.params); state.cur = s.id; render(); toast('Guardado: ' + n); }
      else if (d.load) { const s = state.scenarios.find((x) => x.id === d.load); applySet(s.params, s.name); state.cur = s.id; render(); }
      else if (d.ren) { const s = state.scenarios.find((x) => x.id === d.ren), n = root.prompt('Nuevo nombre', s.name); if (n && n.trim()) { s.name = n.trim(); store.set(KEY_S, state.scenarios); render(); } }
      else if (d.dup) { const s = state.scenarios.find((x) => x.id === d.dup); addScenario(s.name + ' (copia)', s.params); render(); }
      else if (d.del) { const s = state.scenarios.find((x) => x.id === d.del); if (root.confirm('¿Borrar "' + s.name + '"?')) { state.scenarios = state.scenarios.filter((x) => x.id !== d.del); state.compare = state.compare.filter((x) => x !== d.del); store.set(KEY_S, state.scenarios); render(); } }
      else if (d.exp !== undefined) exportJson();
      else if (d.opt !== undefined) { state.opt = GS.optimize(Object.assign({}, state.params, { __minRec: state.optMin }), state.optObj); $('#opt-out').innerHTML = optHtml(); }
      else if (d.optap) { const o = state.opt[+d.optap]; applySet(Object.assign({}, state.params, o.vars), 'resultado de la búsqueda'); }
      else if (d.optsv) { const o = state.opt[+d.optsv]; addScenario('Óptimo ' + (state.optObj === 'oro' ? 'oro' : state.optObj === 'cn' ? 'NaCN' : 'energía') + ' ' + (+d.optsv + 1), Object.assign({}, state.params, o.vars)); render(); toast('Escenario guardado'); }
    });
    doc.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('node')) { e.preventDefault(); e.target.dispatchEvent(new root.MouseEvent('click', { bubbles: true })); } });
  }
  function exportJson() {
    const blob = new root.Blob([JSON.stringify({ version: 1, actual: state.params, escenarios: state.scenarios }, null, 2)], { type: 'application/json' });
    const a = doc.createElement('a'); a.href = root.URL.createObjectURL(blob); a.download = 'escenarios-simulador-oro.json'; a.click(); setTimeout(() => root.URL.revokeObjectURL(a.href), 500);
  }
  function importJson(f) {
    if (!f) return;
    const rd = new root.FileReader();
    rd.onload = () => { try { const j = JSON.parse(rd.result); const list = (j.escenarios || []).filter((s) => s && s.params); list.forEach((s) => addScenario(s.name || 'Importado', s.params)); if (j.actual) { state.params = Object.assign(GS.defaults(), j.actual); persist(); compute(); } render(); toast(list.length + ' escenarios importados'); } catch (err) { toast('El archivo no es un JSON válido'); } };
    rd.readAsText(f);
  }

  function start() {
    const h = (root.location.hash || '').slice(1); if (VIEW[h]) state.page = h;
    compute(); bind(); render();
    root.addEventListener('resize', () => { clearTimeout(start._t); start._t = setTimeout(renderGuide, 150); });
    root.addEventListener('hashchange', () => { const x = root.location.hash.slice(1); if (VIEW[x] && x !== state.page) go(x); });
  }
  GS.ui = { state, start, compute, render, go };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})(typeof globalThis !== 'undefined' ? globalThis : window);
