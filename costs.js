/* ============================================================================
 * costs.js — Módulo económico: ingresos, costos, flujo de caja, VPN, TIR,
 * costo por onza y puntos de equilibrio. Parte de los resultados del motor
 * (consumos de reactivos y energía ya calculados) y de los parámetros del
 * grupo «Economía». Todo en USD; la moneda de visualización se cambia con la TRM.
 *
 *  oz/año   = oz_d(motor) × días de operación
 *  Ingreso  = oz/año × pagabilidad × precio
 *  Regalía  = tasa × ingreso
 *  OPEX     = reactivos + energía + mina + mano de obra + mantenimiento + otros fijos
 *  CAPEX    = CAPEX_ref · (Q/Q_ref)^n
 *  UAI      = ingreso − regalía − OPEX − depreciación (línea recta)
 *  FCF_t    = UAI − impuesto + depreciación − capital de sostenimiento
 *  VPN      = −CAPEX + Σ FCF_t /(1+i)^t ;  TIR: VPN(TIR) = 0
 * ========================================================================== */
(function (root) {
  const GS = (root.GS = root.GS || {});

  /* ov = factores de sensibilidad {price, grade, rec, capex, labor, reag, energy, mining, rate(+puntos)} */
  GS.costs = function (p, r, ov) {
    ov = ov || {};
    const f = (k) => (ov[k] == null ? 1 : ov[k]);
    const days = p.opDays, tpy = p.feedTpd * days;
    const ozYear = r.au.oz_d * days * f('grade') * f('rec');
    const price = p.goldPrice * f('price');
    const gross = ozYear * (p.payable / 100) * price;
    const royalty = gross * (p.royalty / 100);

    /* reactivos (kg/d del motor × días × USD/kg) */
    const g = r.reag, kg = (x) => Math.max(0, x || 0) * days;
    const otherKg = kg(r.detox.smbs) + kg(r.elu.naoh_kg) + kg(g.floc) + kg(g.xanthate) + kg(g.mibc) + kg(g.pb);
    const reag = [
      { k: 'Cianuro de sodio', v: (kg(g.nacn) / 1000) * p.priceNaCN * f('reag'), q: kg(g.nacn) / 1000, u: 't/año' },
      { k: 'Cal viva', v: (kg(g.lime) / 1000) * p.priceLime * f('reag'), q: kg(g.lime) / 1000, u: 't/año' },
      { k: 'Carbón activado', v: (kg(g.carbon) / 1000) * p.priceCarbon * f('reag'), q: kg(g.carbon) / 1000, u: 't/año' },
      { k: 'Otros reactivos', v: otherKg * p.priceOther * f('reag'), q: otherKg / 1000, u: 't/año' },
    ];
    const reagTot = reag.reduce((a, c) => a + c.v, 0);
    const energy = r.energy.total * days * p.priceEnergy * f('energy');
    const mining = tpy * p.miningCost * f('mining');

    const capex = p.capexRef * 1e6 * Math.pow(p.feedTpd / p.qRef, p.capexN) * f('capex');
    const labor = ((p.staff * p.salMult * p.smmlv * 12 * p.loadFactor) / p.trm) * f('labor');
    const maint = (p.maintPct / 100) * capex;
    const fixedOther = p.fixedOther;
    const fixed = labor + maint + fixedOther;
    const opex = reagTot + energy + mining + fixed;
    const opexProc = opex - mining; // lo que corresponde a la planta
    const sust = (p.sustPct / 100) * capex;
    const dep = capex / p.lifeYears;
    const ebitda = gross - royalty - opex;
    const ebt = ebitda - dep;
    const tax = Math.max(0, ebt) * (p.taxRate / 100);
    const fcf = ebitda - tax - sust;
    const i = (p.discount + (ov.rate || 0)) / 100;
    const flows = [-capex];
    for (let t = 1; t <= p.lifeYears; t++) flows.push(fcf);
    const npvAt = (rate) => flows.reduce((a, c, t) => a + c / Math.pow(1 + rate, t), 0);
    const npv = npvAt(i);
    let irr = null;
    if (fcf > 0) {
      let lo = -0.9, hi = 50;
      if (npvAt(lo) > 0 && npvAt(hi) < 0) {
        for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if (npvAt(m) > 0) lo = m; else hi = m; }
        irr = (lo + hi) / 2;
      } else if (npvAt(hi) >= 0) irr = hi;
    }
    const payback = fcf > 0 ? capex / fcf : null;
    const sold = ozYear * (p.payable / 100);
    const cash = sold > 0 ? (opex + royalty) / sold : null; // cash cost: operación + regalías (+ refinación vía pagabilidad)
    const aisc = sold > 0 ? (opex + royalty + sust) / sold : null;
    const cumulative = []; let acc = 0;
    flows.forEach((c) => { acc += c; cumulative.push(acc); });

    return {
      days, tpy, ozYear, sold, price, gross, royalty, reag, reagTot, energy, mining, labor, maint, fixedOther, fixed, opex, opexProc,
      opexPerT: opex / tpy, opexProcPerT: opexProc / tpy, capex, capexPerTpd: capex / p.feedTpd, dep, ebitda, ebt, tax,
      net: ebt - tax, fcf, flows, cumulative, npv, irr, payback, cash, aisc, sust,
      margin: gross > 0 ? ebitda / gross : 0,
      // costo de mina máximo que anula el VPN (sólo si hoy es 0)
      miningMax: null,
    };
  };

  /* Punto de equilibrio por bisección sobre un factor multiplicativo (VPN = 0 o EBITDA = 0). */
  GS.breakEven = function (p, r, key, kind) {
    const val = (m) => { const c = GS.costs(p, r, { [key]: m }); return kind === 'cash' ? c.ebitda : c.npv; };
    let lo = 0.001, hi = 20;
    if (val(hi) < 0) return null;
    if (val(lo) >= 0) return lo;
    for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (val(m) > 0) hi = m; else lo = m; }
    return (lo + hi) / 2;
  };

  /* Costo de mina máximo (USD/t) con VPN = 0, manteniendo los demás supuestos. */
  GS.maxMiningCost = function (p, r) {
    const f = (x) => GS.costs(Object.assign({}, p, { miningCost: x }), r).npv;
    if (f(0) < 0) return 0;
    let lo = 0, hi = 5000;
    for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
    return (lo + hi) / 2;
  };

  /* Tornado: efecto de ±variación en cada factor sobre el VPN. */
  GS.tornado = function (p, r) {
    const base = GS.costs(p, r).npv;
    const rows = [
      ['Precio del oro ±25 %', 'price', 0.75, 1.25], ['Ley de cabeza ±25 %', 'grade', 0.75, 1.25], ['Recuperación ±5 %', 'rec', 0.95, 1.05],
      ['CAPEX ±30 %', 'capex', 0.7, 1.3], ['Mano de obra ±30 %', 'labor', 0.7, 1.3], ['Reactivos ±30 %', 'reag', 0.7, 1.3], ['Energía ±30 %', 'energy', 0.7, 1.3],
    ];
    const out = rows.map(([label, key, a, b]) => ({ label, lo: GS.costs(p, r, { [key]: a }).npv - base, hi: GS.costs(p, r, { [key]: b }).npv - base }));
    out.push({ label: 'Tasa de descuento ±3 pts', lo: GS.costs(p, r, { rate: 3 }).npv - base, hi: GS.costs(p, r, { rate: -3 }).npv - base });
    out.sort((x, y) => Math.max(Math.abs(y.lo), Math.abs(y.hi)) - Math.max(Math.abs(x.lo), Math.abs(x.hi)));
    return { base, rows: out };
  };

  /* Curva VPN vs precio y escenarios de precio (bajo/base/alto = ∓25 %). */
  GS.priceCurve = function (p, r, n) {
    const pts = []; n = n || 24;
    for (let k = 0; k <= n; k++) { const m = 0.3 + (1.9 * k) / n; pts.push({ price: p.goldPrice * m, npv: GS.costs(p, r, { price: m }).npv, ebitda: GS.costs(p, r, { price: m }).ebitda }); }
    return pts;
  };
  GS.priceScenarios = function (p, r) {
    return [['Bajo (−25 %)', 0.75], ['Base', 1], ['Alto (+25 %)', 1.25]].map(([name, m]) => Object.assign({ name, m }, GS.costs(p, r, { price: m })));
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
