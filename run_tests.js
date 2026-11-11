/* Pruebas del motor: node tests/run_tests.js */
require('../src/params.js'); require('../src/engine.js'); require('../src/validate.js'); require('../src/costs.js');
const GS = globalThis.GS; let fail = 0;
const t = (name, ok, extra) => { console.log((ok ? 'OK   ' : 'FALLA'), name, extra || ''); if (!ok) fail++; };
const d = GS.defaults();
for (const row of GS.verifyDesign()) t(`Diseño: ${row.name}`, row.ok, `doc ${row.doc} · modelo ${row.model.toFixed(3)} ${row.unit}`);
const r = GS.run(d);
t('Recuperación CIL de diseño = 90 %', Math.abs(r.au.recCIL - 90) < 0.01, r.au.recCIL.toFixed(3));
t('Balance de oro cierra', Math.abs(r.au.closure) < 1e-9);
t('Balance de agua cierra', Math.abs(r.water.closure) < 1e-9);
// Casos extremos: ningún NaN y balances cierran
const cases = [{}, { feedTpd: 120 }, { feedTpd: 12 }, { headGrade: 25 }, { p80: 40 }, { p80: 200 }, { gravFree: 40, sulfAu: 30 }, { cilSolids: 55 }, { nacn: 800, ph: 12.5 }, { ph: 9 }, { oxidant: 'oxígeno', dox: 40 }, { tauMode: 'objetivo', tauTarget: 48 }, { waterRecycle: 0 }, { waterRecycle: 100 }, { nTanks: 3 }, { temp: 55, altitude: 3000 }, { carbonXfer: 20 }, { cycCL: 350, cycFeedSolids: 25 }];
for (const c of cases) {
  const p = Object.assign({}, d, c), x = GS.run(p), v = GS.validate(p, x);
  const nan = JSON.stringify(x.au).includes('null') || Object.values(x.au).some((n) => !isFinite(n));
  const bal = v.filter((e) => /Balance|Conservación|unidades/.test(e.cat) && e.lvl === 'error');
  t('Caso ' + JSON.stringify(c), !nan && bal.length === 0, `rec ${x.au.recCIL.toFixed(1)} % ${bal.map((b) => b.title).join('; ')}`);
}
const s = GS.sanity(d); s.forEach((e) => t('Coherencia: ' + e.text, e.ok, e.delta.toFixed(3)));
const o = GS.optimize(Object.assign({}, d), 'oro'); t('Optimizador devuelve resultados', o.length > 0, o[0] && JSON.stringify(o[0].vars) + ' ' + o[0].r.au.recGlobal.toFixed(2));

/* ---- Módulo de costos ---- */
{
  const c = GS.costs(d, r);
  t('Costos: oz/año = oz/d × días', Math.abs(c.ozYear - r.au.oz_d * d.opDays) < 1e-9, c.ozYear.toFixed(0));
  t('Costos: ingreso = oz × pagabilidad × precio', Math.abs(c.gross - c.ozYear * d.payable / 100 * d.goldPrice) < 1e-6);
  t('Costos: EBITDA = ingreso − regalía − OPEX', Math.abs(c.ebitda - (c.gross - c.royalty - c.opex)) < 1e-6);
  t('Costos: CAPEX escala (50/610)^0,75 × 15 M USD', Math.abs(c.capex - 15e6 * Math.pow(50 / 610, 0.75)) < 1, (c.capex / 1e6).toFixed(2) + ' M USD');
  t('Costos: VPN(TIR) = 0', c.irr == null || Math.abs(c.flows.reduce((a, x, k) => a + x / Math.pow(1 + c.irr, k), 0)) < 1, c.irr && (100 * c.irr).toFixed(1) + ' %');
  t('Costos: VPN crece con el precio', GS.costs(d, r, { price: 1.1 }).npv > c.npv && GS.costs(d, r, { price: 0.9 }).npv < c.npv);
  t('Costos: VPN decrece con la tasa', GS.costs(d, r, { rate: 3 }).npv < c.npv);
  const be = GS.breakEven(d, r, 'price', 'npv'); t('Costos: precio de equilibrio da VPN ≈ 0', be != null && Math.abs(GS.costs(d, r, { price: be }).npv) < 1000, be && (be * d.goldPrice).toFixed(0) + ' USD/oz');
  t('Costos: AISC ≥ cash cost', c.aisc >= c.cash, `cash ${c.cash.toFixed(0)} · AISC ${c.aisc.toFixed(0)} USD/oz`);
  t('Costos: suma de partidas = OPEX', Math.abs(c.reagTot + c.energy + c.mining + c.fixed - c.opex) < 1e-6);
  const mm = GS.maxMiningCost(d, r); t('Costos: costo de mina máximo da VPN ≈ 0', Math.abs(GS.costs(Object.assign({}, d, { miningCost: mm }), r).npv) < 1000, mm.toFixed(0) + ' USD/t');
  const bad = Object.assign({}, d, { headGrade: 1, goldPrice: 1500 }), cb = GS.costs(bad, GS.run(bad));
  t('Costos: caso sin rentabilidad → TIR nula, sin NaN', cb.irr === null && isFinite(cb.npv) && cb.payback === null);
  console.log('      OPEX', c.opexPerT.toFixed(1), 'USD/t · ingreso', (c.gross / 1e6).toFixed(2), 'M USD/año · VPN', (c.npv / 1e6).toFixed(1), 'M USD');
}
console.log(fail ? `\n${fail} FALLAS` : '\nTodas las pruebas pasan'); process.exit(fail ? 1 : 0);
