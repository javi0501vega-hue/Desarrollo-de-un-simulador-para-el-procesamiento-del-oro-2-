/* ============================================================================
 * characters.js — Personajes ilustrados (originales) que explican el simulador,
 * las explicaciones «¿por qué este supuesto?» y los consejos por página/equipo.
 * Los dibujos son SVG propios, sin imágenes externas.
 * ========================================================================== */
(function (root) {
  const GS = (root.GS = root.GS || {});
  const INK = '#3b2f1c';
  const eyes = (x1, x2, y, r) => `<circle cx="${x1}" cy="${y}" r="${r}" fill="#fff" stroke="${INK}" stroke-width="1.6"/><circle cx="${x2}" cy="${y}" r="${r}" fill="#fff" stroke="${INK}" stroke-width="1.6"/><circle cx="${x1 + 0.8}" cy="${y + 0.6}" r="${r * 0.45}" fill="${INK}"/><circle cx="${x2 + 0.8}" cy="${y + 0.6}" r="${r * 0.45}" fill="${INK}"/>`;
  const smile = (x, y, w) => `<path d="M${x - w} ${y}q${w} ${w * 0.9} ${2 * w} 0" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`;
  const cheeks = (x1, x2, y) => `<circle cx="${x1}" cy="${y}" r="2.2" fill="#ff8a7a" opacity=".55"/><circle cx="${x2}" cy="${y}" r="2.2" fill="#ff8a7a" opacity=".55"/>`;

  /* Cada personaje: cuerpo en viewBox 0 0 64 64 */
  const ART = {
    // Pepita: pepita de oro con casco y lentes — guía general
    pepita: `<path d="M32 12c8-1 18 3 21 12 3 8 2 17-4 23-5 5-12 7-19 6-9-1-17-6-19-14-2-8 1-17 8-22 4-3 8-4 13-5z" fill="#f4b700" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M22 22c3-2 6-2 8 0M40 40c2 1 5 0 6-2" fill="none" stroke="#fff3b0" stroke-width="2" stroke-linecap="round" opacity=".8"/>
      <path d="M17 24c1-9 8-14 15-14s14 5 15 14z" fill="#ef6c1a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><rect x="14" y="23" width="36" height="4" rx="2" fill="#ffb347" stroke="${INK}" stroke-width="1.8"/><rect x="29" y="6" width="6" height="7" rx="2" fill="#ffb347" stroke="${INK}" stroke-width="1.6"/>
      ${eyes(25, 39, 36, 4.6)}<circle cx="25" cy="36" r="6.4" fill="none" stroke="${INK}" stroke-width="1.4"/><circle cx="39" cy="36" r="6.4" fill="none" stroke="${INK}" stroke-width="1.4"/><path d="M31.4 36h1.2" stroke="${INK}" stroke-width="1.4"/>
      ${smile(32, 47, 5)}${cheeks(19, 45, 44)}`,
    // Carbonín: gránulo de carbón activado poroso
    carbonin: `<path d="M14 24c0-7 6-12 14-12h10c9 0 14 6 14 14v12c0 9-6 15-15 15H27c-8 0-13-6-13-14z" fill="#4a4f58" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <g fill="#2b2f36"><circle cx="20" cy="22" r="1.7"/><circle cx="46" cy="20" r="1.5"/><circle cx="48" cy="38" r="1.8"/><circle cx="18" cy="42" r="1.6"/><circle cx="40" cy="52" r="1.5"/><circle cx="26" cy="52" r="1.3"/></g>
      <g fill="#8d95a3"><circle cx="24" cy="17" r="1.3"/><circle cx="43" cy="26" r="1.2"/><circle cx="21" cy="48" r="1.2"/></g>
      ${eyes(26, 40, 32, 4.6)}${smile(33, 42, 5)}${cheeks(21, 45, 40)}<circle cx="46" cy="9" r="2.4" fill="#f4b700" stroke="${INK}" stroke-width="1.4"/><circle cx="51" cy="14" r="1.6" fill="#f4b700" stroke="${INK}" stroke-width="1.2"/>`,
    // Dra. Cianita: matraz con gafas de laboratorio — química del cianuro, pH, O₂
    cianita: `<path d="M26 8h12v6l-1 9 15 26c3 5 0 10-6 10H18c-6 0-9-5-6-10l15-26-1-9z" fill="#e9f7f1" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M21 41c4-2 8 2 11 0s7 2 11 0l7 9c3 5 0 8-5 8H19c-5 0-8-3-5-8z" fill="#3dbb86" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <rect x="24" y="5" width="16" height="5" rx="2.5" fill="#cfd6df" stroke="${INK}" stroke-width="1.8"/>
      <circle cx="27" cy="34" r="1.8" fill="#fff" opacity=".9"/><circle cx="37" cy="30" r="1.3" fill="#fff" opacity=".9"/><circle cx="33" cy="26" r="1.1" fill="#fff" opacity=".9"/>
      <rect x="20" y="42" width="24" height="9" rx="4.5" fill="#d9efff" fill-opacity=".75" stroke="${INK}" stroke-width="1.6"/>${eyes(27, 37, 46.5, 2.6)}${smile(32, 53.5, 3)}`,
    // Moli: molino de bolas
    moli: `<circle cx="32" cy="31" r="21" fill="#9aa7b8" stroke="${INK}" stroke-width="2"/><path d="M11 31a21 21 0 0 1 42 0z" fill="#b6c2d1" opacity=".7"/><rect x="9" y="26" width="46" height="9" rx="4" fill="#6f7d90" stroke="${INK}" stroke-width="1.8"/>
      <g fill="#dfe5ec" stroke="${INK}" stroke-width="1.2"><circle cx="22" cy="46" r="3.2"/><circle cx="31" cy="49" r="3.2"/><circle cx="40" cy="46" r="3.2"/></g>
      <rect x="16" y="52" width="9" height="6" rx="2" fill="#6f7d90" stroke="${INK}" stroke-width="1.6"/><rect x="39" y="52" width="9" height="6" rx="2" fill="#6f7d90" stroke="${INK}" stroke-width="1.6"/>
      ${eyes(25, 39, 14.5, 4.2)}${smile(32, 21, 4.2)}`,
    // Don Peso: moneda con corbatín — costos
    peso: `<circle cx="32" cy="32" r="22" fill="#f6d44b" stroke="${INK}" stroke-width="2"/><circle cx="32" cy="32" r="17" fill="none" stroke="#c99a00" stroke-width="1.6" stroke-dasharray="2.4 2.6"/>
      <path d="M26 46l6 4 6-4-3-3h-6z" fill="#d6402e" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="32" cy="45.5" r="1.8" fill="#a82a1a" stroke="${INK}" stroke-width="1.2"/>
      ${eyes(25, 39, 27, 4.2)}${smile(32, 35, 4.6)}<text x="32" y="22" text-anchor="middle" font-size="9" font-weight="700" fill="${INK}" font-family="Arial, sans-serif">$</text>${cheeks(19, 45, 33)}`,
  };
  GS.CHARS = {
    pepita: { name: 'Pepita', role: 'tu guía en la planta' },
    carbonin: { name: 'Carbonín', role: 'carbón activado' },
    cianita: { name: 'Dra. Cianita', role: 'química de la lixiviación' },
    moli: { name: 'Moli', role: 'molienda' },
    peso: { name: 'Don Peso', role: 'costos y rentabilidad' },
  };
  GS.charSVG = (k, size) => `<svg class="chr" viewBox="0 0 64 64" width="${size || 56}" height="${size || 56}" role="img" aria-label="${GS.CHARS[k].name}">${ART[k]}</svg>`;

  /* ---- Quién habla en cada página ---- */
  GS.PAGE_CHAR = { inicio: 'pepita', flujo: 'pepita', variables: 'cianita', resultados: 'pepita', graficos: 'pepita', escenarios: 'pepita', costos: 'peso', equipos: 'moli', modelo: 'pepita' };

  /* ---- Consejos por página (estáticos) ---- */
  GS.PAGE_TIPS = {
    inicio: [
      '¡Hola! Soy Pepita. Cada número de este simulador tiene una etiqueta de color: dice si viene del Proyecto, de un libro, de internet con fecha, o si es un supuesto.',
      'Prueba un escenario rápido: toca «Molienda fina» y mira cómo sube la recuperación pero también la energía.',
      'La planta recibe 50 t/d con 10 g/t de oro: son 500 g de oro por día. El CIL del Proyecto recupera el 90 %.',
      'Para ver cuánto dinero deja la planta, visita la página Costos. Allí Don Peso te lo cuenta.',
    ],
    flujo: [
      'Toca cualquier equipo del diagrama: te muestro lo que entra, lo que sale y qué variables puedes mover.',
      'Los números sobre las líneas pueden ser sólidos, agua o gramos de oro. Cámbialo con los botones de arriba.',
      'El camino del oro: mineral → trituración → molienda → CIL → carbón → elución → electroobtención → fundición → barra doré.',
    ],
    variables: [
      'Soy la Dra. Cianita. Toca «¿por qué?» junto a cualquier dato que no venga del Proyecto y te explico de dónde sale.',
      'Con más cianuro la disolución del oro es más rápida, pero hay un tope: a partir de cierta concentración sólo gastas reactivo.',
      'El pH se mantiene cerca de 11 con cal: por debajo de 9,3 el cianuro libre se vuelve gas HCN, que es tóxico y se pierde.',
      'El oxígeno disuelto también manda: sin O₂ el oro no se disuelve. Con aire se alcanzan ≈ 8 mg/L.',
    ],
    resultados: [
      'Aquí reviso los balances. Si algo no cierra, el chip rojo de arriba te avisa.',
      'La recuperación global es lo que sale en doré dividido por lo que entró; el resto se va al relave.',
    ],
    graficos: [
      'Cada curva corre el modelo completo moviendo una sola variable. El punto marca dónde estás ahora.',
      'Si la curva se aplana, más esfuerzo ya no rinde: es la señal para dejar de gastar reactivo o energía.',
    ],
    escenarios: [
      'Guarda tus casos y compáralos lado a lado. Ahora también verás VPN y costo por onza en la comparación.',
      'El buscador prueba combinaciones de NaCN, pH, P80, sólidos y O₂ dentro de límites seguros.',
    ],
    costos: [
      'Soy Don Peso. Ingreso = onzas × pagabilidad × precio. Todo lo demás es restar.',
      'Ojo: la planta del Proyecto no incluye la mina. Con costo de mina = 0 el resultado es muy optimista; mira «costo de mina máximo».',
      'El CAPEX se escala desde una planta de 610 t/d con C₂ = C₁·(Q₂/Q₁)ⁿ. En plantas muy pequeñas esta regla suele quedarse corta.',
      'Cash cost = operación + regalías por onza vendida. AISC le suma el capital de sostenimiento.',
      'Cambia el precio del oro: la gráfica de VPN te muestra a qué precio dejas de ganar.',
    ],
    equipos: ['Soy Moli. Aquí tienes los 20 equipos del Proyecto con sus indicadores y el origen de cada especificación.'],
    modelo: [
      'Aquí está todo lo que no está en los documentos, con la razón de cada supuesto. Los que dicen «Literatura externa» llevan fuente y fecha.',
      'La adsorción en carbón usa ahora la forma de Nicol–Fleming con isoterma de Freundlich, en lugar de un factor inventado.',
    ],
  };

  /* ---- Cuentos por equipo (se muestran al seleccionar un nodo del diagrama) ---- */
  GS.NODE_TIPS = {
    1: ['pepita', 'Aquí llega el mineral tal como sale de la mina (ROM): piedras de hasta 60 cm con ≈ 5 % de humedad.'],
    2: ['pepita', 'La tolva de gruesos es la despensa: desacopla la mina de la trituración.'],
    3: ['moli', 'La mandíbula aplasta la roca entre dos placas. Reduce el tamaño unas 4 a 8 veces.'],
    4: ['moli', 'La criba devuelve a la mandíbula lo que sigue grueso. Así el circuito de trituración trabaja cerrado.'],
    5: ['moli', 'La tolva de finos permite que la molienda siga 24 h aunque la trituración sólo trabaje unas horas.'],
    6: ['moli', 'Soy yo, el molino de bolas. Mientras más fino muelas, más oro queda expuesto al cianuro… y más kWh gastas.'],
    7: ['moli', 'El hidrociclón separa: lo fino sigue a lixiviación, lo grueso vuelve al molino.'],
    8: ['moli', 'La pulpa es mineral molido con agua. El Proyecto trabaja con ≈ 40 % de sólidos en el CIL.'],
    9: ['pepita', 'El Knelson atrapa por gravedad el oro grueso y libre. Con 0 % de oro libre (caso del Proyecto) no recupera nada.'],
    10: ['pepita', 'La mesa Wilfley limpia el concentrado del Knelson sacudiéndolo sobre un plano inclinado.'],
    11: ['cianita', 'La flotación recoge los sulfuros que guardan oro «encerrado». Si no hay sulfuros, esta etapa queda en cero.'],
    12: ['cianita', 'El filtro prensa exprime el concentrado de flotación para devolverlo al circuito.'],
    13: ['cianita', 'El espesador quita agua a la pulpa para llegar a la densidad que necesita el CIL.'],
    14: ['carbonin', 'Aquí estoy yo, Carbonín. En el CIL el oro se disuelve y yo lo atrapo en mis poros al mismo tiempo. ¡Pido 10 g/L en los últimos tanques!'],
    15: ['carbonin', 'En la elución me lavan con solución caliente alcalina: el oro sale de mis poros hacia una solución concentrada.'],
    16: ['cianita', 'En la electroobtención una corriente eléctrica pega el oro de la solución rica sobre el cátodo.'],
    17: ['pepita', 'La fundición convierte el lodo de oro en barras de doré (60–95 % Au).'],
    18: ['pepita', 'La refinación lleva el doré a oro de alta pureza.'],
    19: ['cianita', 'Antes de soltar el agua hay que destruir el cianuro: el proceso INCO usa SO₂ y aire para llevarlo por debajo del límite.'],
    20: ['cianita', 'El último filtro prensa deja el relave con 15–20 % de humedad para disponerlo seguro.'],
  };

  /* ---- ¿Por qué este supuesto? Una explicación por parámetro ---- */
  GS.WHY = {
    gravFree: 'Los documentos nunca dicen qué parte del oro está libre. El Proyecto trata los 500 g/d como una sola alimentación al CIL, así que el caso base es 0 %. Si tu mena tiene oro grueso, súbelo: el Knelson lo atrapará antes del CIL.',
    sulfAu: 'Tampoco se menciona oro atrapado en sulfuros. El Proyecto sí incluye flotación, lo que sugiere que podría haberlo, pero no da el porcentaje. Se deja en 0 % y se activa si tu mena es refractaria.',
    sulfLeach: 'Sólo actúa si el oro en sulfuros es mayor que 0. Sin dato de oxidación previa se supone que el cianuro puede alcanzarlo (100 %).',
    romF80: 'El Proyecto da la abertura máxima del ROM (< 600 mm) pero no su granulometría. Se toma F80 ≈ ½ de la parrilla, regla usual para alimentación de mandíbula.',
    crushCap: 'La capacidad de la mandíbula no está en los documentos. El simulador te dice cuánto se requiere (mira el recuadro «Requerido») y avisa si la trituradora instalada no alcanza.',
    crushHours: 'El Proyecto menciona tolvas de gruesos y finos que permiten trituración parcial. 8 h/d es un turno; la tolva de finos alimenta la molienda las 24 h.',
    wi: 'Antes se suponía 14 kWh/t. Ahora se usa 16,5 kWh/t, el promedio de 183 ensayos Bond reales en menas de oro (Fred Bond; tabla de 911 Metallurgist). El rango real es enorme (3–42): sólo un ensayo de tu mena lo fija de verdad.',
    rrN: 'La forma de la distribución de tamaños del producto de molienda no está en los documentos. Rosin–Rammler con n ≈ 1,2 es un valor típico de circuitos cerrados con hidrociclón.',
    millPower: 'El Proyecto no da la potencia del motor. El simulador calcula la requerida con la ecuación de Bond y la compara con la instalada: 45 kW es el motor comercial inmediato por encima de lo requerido para 50 t/d.',
    wilfleyRec: 'Sin dato de la mesa Wilfley en los documentos. Con gravimetría en 0 % esta etapa no incide en el resultado base.',
    wilfleyMass: 'Fracción de masa del concentrado que va a la mesa. Sin dato; sólo cuenta si activas el oro libre.',
    flotPull: 'Los documentos no cuantifican la flotación. Con sulfuros en 0 % esta etapa no incide. Si la activas, 2 % de la masa es un orden de magnitud usual de concentrado de sulfuros.',
    flotAuRec: 'Recuperación del oro de los sulfuros en la flotación: sin dato. Sólo actúa si hay oro en sulfuros.',
    o2Purity: 'Si cambias de aire a oxígeno industrial, su pureza no está documentada. 90 % corresponde a oxígeno de adsorción por vaivén de presión (PSA).',
    carbonXfer: 'Es un número derivado, no inventado: 450 g Au/d ÷ 5 kg Au/t C = 90 kg/d de carbón. Los 5 kg/t están dentro del rango 1–10 del Proyecto.',
    kAds: 'La tesis (Ec. 35–36) dice que la adsorción es de primer orden pero no da la constante. Se fija para que el carbón del Proyecto adsorba ≥ 99 % del oro disuelto. Si tu carbón es viejo o la pulpa es viscosa, bájala.',
    kFre: 'Para quitar el factor «1 − q/qmáx» que yo había inventado, ahora la adsorción tiene una fuerza impulsora real: el oro en solución menos el que está en equilibrio con la carga del carbón. Ese equilibrio usa el valor K de los fabricantes (24–32 kg/t a 1 mg/L).',
    mFre: 'Con m = 1 la isoterma es lineal. Nicol, Fleming y Cromberge (1984) la usan así porque en una planta CIL el carbón está lejos de saturarse (< 30 % de su capacidad). Baja m para una isoterma de Freundlich curva.',
    qMax: 'Sólo se usa como alarma: la tesis reporta cargas de planta de hasta 20 000 g/t, y por encima del 80 % de ese valor te aviso.',
    cnSideFrac: 'Solo 0,22 kg/d de los 30 kg/d de NaCN reaccionan con el oro; el resto lo consumen otros metales (cianicidas), el pH y lo que sale en solución. El Proyecto no lo desglosa. La tesis reporta 0,51–0,55 kg/t en 24 h, consistente con los 0,6 kg/t del Proyecto, pero tampoco da el reparto.',
    eluEff: 'No hay dato de la eficiencia de la elución. 98 % es el orden de magnitud de columnas Zadra/AARL; el 2 % restante vuelve con el carbón al CIL y se contabiliza.',
    downRec: 'El Proyecto no documenta pérdidas en desorción, electroobtención ni fundición. 100 % significa que lo no recuperado en un paso recircula y no sale de la planta.',
    ewCells: 'Número de celdas de electroobtención: sin dato. Solo afecta la energía (voltaje × corriente × celdas).',
    waterRecycle: 'El Proyecto dice que el agua del filtrado y del espesador se recircula, sin fracción. 80 % fue tu respuesta cuando lo consulté.',
    opDays: 'Sirve sólo para pasar de gramos por día a onzas por año. 330 d equivale a 90 % de disponibilidad, una convención habitual para plantas nuevas.',
    goldPrice: 'Spot del oro cercano a 4.070 USD/oz el 8-nov-2026 (goldpricedata.com; Reuters 4.076,91 el 6-nov). Cambia a diario: actualízalo antes de presentar resultados. Goldman Sachs prevé 4.150 para fin de 2026.',
    trm: 'Solo convierte COP↔USD para mano de obra y para ver cifras en pesos. 3.237,83 COP/USD fue la TRM del 8-nov-2026.',
    payable: 'Es el descuento del refinador sobre el oro contenido en el doré. Es un parámetro propio (no hay ficha de refinadora en los documentos). 98 % es conservador; pide la oferta de tu refinadora.',
    royalty: 'En Colombia el oro paga regalía del 4 % (6 % si es de aluvión) sobre el precio base que fija la UPME. Aquí se aplica al ingreso bruto; si el precio base UPME es menor que el spot, tu regalía real es algo menor.',
    taxRate: 'Tarifa general de renta para sociedades en 2026 (Art. 240 ET, Ley 2277/2022). Hay un proyecto para bajarla a 31 % desde 2028, pero no está aprobado.',
    priceNaCN: 'Los índices de precio de cianuro de sodio andan entre 1.840 USD/t (EE.UU.) y 2.310 USD/t (Sudamérica, nov-2025). Se usa el de Sudamérica porque es el más cercano a Colombia.',
    priceLime: 'No hallé un precio público de cal viva en Colombia; la UPME sólo publica el de la caliza para regalías. El valor es un supuesto: cotiza con un proveedor. Pesa muy poco en el costo total.',
    priceCarbon: 'Carbón de coco para oro: 1.900–2.480 USD/t según la fuente (Expert Market Research, Intratec, fichas de proveedores). Se usa 2.100.',
    priceOther: 'SMBS, soda, floculante y colectores se juntan en un precio ponderado único porque no hallé cotizaciones verificables de cada uno. Es supuesto.',
    priceEnergy: 'Costo promedio de electricidad industrial en Colombia en 2025 (0,224 USD/kWh). Si tu planta tiene tarifa propia o energía solar, cámbialo.',
    smmlv: 'Salario mínimo oficial de 2026 (Decreto 1469 de 2025). Es la base para estimar la nómina.',
    staff: 'No hay dato de personal en los documentos. Se supone una planta de 24 h con 4 cuadrillas rotativas de 3 operarios más laboratorio, jefatura, HSE y mantenimiento.',
    salMult: 'Promedio entre operarios y profesionales. Es el supuesto con más incertidumbre de la nómina; usa tu estructura real.',
    loadFactor: 'Prestaciones sociales, salud, pensión, caja de compensación y dotación suman alrededor del 50 % sobre el salario.',
    maintPct: 'Regla práctica de plantas de proceso: 3–5 % del CAPEX por año. Sin fuente en los documentos.',
    fixedOther: 'Administración, seguridad, laboratorio y gestión ambiental. No existe dato público para una planta de 50 t/d en Colombia; se deja como supuesto editable.',
    miningCost: 'El Proyecto sólo describe la planta de beneficio, así que la mina no se cobra (0). Esto hace que el VPN sea optimista: mira «costo de mina máximo» en la página Costos para saber cuánto puede costar extraer y transportar el mineral.',
    capexRef: 'Única referencia de CAPEX que tengo: Gourbassi/Barani, 15 M USD (otra versión del mismo estudio da 20,4 M USD). Está lejos de tu tamaño, por eso se escala. Hay que verificarla en el NI 43-101 original.',
    qRef: 'Tamaño de la planta de referencia: 18,3 kt/mes ≈ 610 t/d.',
    capexN: 'Regla de escala de costos de capital: C₂ = C₁·(Q₂/Q₁)ⁿ. Con n entre 0,7 y 0,8 (Peters & Timmerhaus) el CAPEX de 50 t/d sale entre 2,0 y 2,6 M USD. Es un estimado de clase 5 (−30 %/+50 %).',
    sustPct: 'Gasto de capital para mantener la planta operando (reemplazos grandes). Sólo cambia el AISC y el flujo de caja. Supuesto.',
    lifeYears: 'La vida de la mina depende de las reservas, que no están en los documentos. 10 años es un supuesto para poder calcular VPN y TIR.',
    discount: 'Tasa con la que se descuentan los flujos futuros. 10 % es un valor de uso común; cámbiala por tu costo de capital.',
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
