const paths = {
  logo: '<path d="M5 19v-7m5 7V5m5 14V9m5 10V3"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11M15 9v11"/>',
  chart: '<path d="M4 19V5m0 14h16"/><path d="m7 15 4-5 3 2 5-7"/><circle cx="7" cy="15" r="1"/><circle cx="11" cy="10" r="1"/><circle cx="14" cy="12" r="1"/><circle cx="19" cy="5" r="1"/>',
  brain: '<path d="M9.5 4.5A3 3 0 0 0 4.8 7 3.5 3.5 0 0 0 4 13.5 3.5 3.5 0 0 0 6 19a3 3 0 0 0 5.5.5v-14a3 3 0 0 0-2-1Z"/><path d="M14.5 4.5A3 3 0 0 1 19.2 7a3.5 3.5 0 0 1 .8 6.5 3.5 3.5 0 0 1-2 5.5 3 3 0 0 1-5.5.5v-14a3 3 0 0 1 2-1ZM7 10h2.5m5 4H17m-7 5v-3m4-9V4"/>',
  gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 13 4-4"/><path d="M5 20h14"/><circle cx="12" cy="14" r="1"/>',
  rocket: '<path d="M14 5c3.5-3.5 6-2 6-2s1.5 2.5-2 6l-5 5-4-4 5-5Z"/><path d="m9 10-4 1-2 3 6 1m4-1 1 5-3 2-2-6M6 16l-3 4 4-2"/><circle cx="15.5" cy="7.5" r="1.5"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5.5a3 3 0 0 1 0 5.5m2 3a5 5 0 0 1 3 4v2"/>',
  arrowRight: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  arrowLeft: '<path d="M19 12H5m5 5-5-5 5-5"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  book: '<path d="M4 5a3 3 0 0 1 3-2h5v16H7a3 3 0 0 0-3 2V5Zm16 0a3 3 0 0 0-3-2h-5v16h5a3 3 0 0 1 3 2V5Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  lightbulb: '<path d="M9 18h6m-5 3h4M8.5 15.5a7 7 0 1 1 7 0L15 18H9l-.5-2.5Z"/>',
  reset: '<path d="M3 11a9 9 0 1 1 2.5 7M3 4v7h7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  external: '<path d="M14 4h6v6m0-6-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  sparkles: '<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3ZM5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16Zm14-3 1 2.5 2.5 1-2.5 1L19 20l-1-2.5-2.5-1 2.5-1 1-2.5Z"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Zm4 9v5m-4 2h8M8 6H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4"/>',
  flask: '<path d="M9 3h6m-5 0v6L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9V3"/><path d="M7 15h10"/>',
  code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  home: '<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9Z"/>',
  medal: '<circle cx="12" cy="15" r="6"/><path d="m8 10-3-8h5l2 6 2-6h5l-3 8m-7 5 3 3 4-5"/>',
};

export function icon(name, className = '') {
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.sparkles}</svg>`;
}

export function heroChart() {
  return '<svg viewBox="0 0 340 110" role="img" aria-label="A line chart showing improvement over time"><defs><linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6956d9" stop-opacity=".2"/><stop offset="1" stop-color="#6956d9" stop-opacity="0"/></linearGradient></defs><path d="M10 95H330M10 65H330M10 35H330" stroke="#eceee8"/><path d="M10 94 48 83 85 85 122 62 160 70 198 45 235 50 275 24 325 12V105H10Z" fill="url(#heroArea)"/><path d="M10 94 48 83 85 85 122 62 160 70 198 45 235 50 275 24 325 12" fill="none" stroke="#6956d9" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><g fill="#fff" stroke="#6956d9" stroke-width="2"><circle cx="122" cy="62" r="4"/><circle cx="198" cy="45" r="4"/><circle cx="275" cy="24" r="4"/></g><circle cx="325" cy="12" r="5" fill="#d6f785" stroke="#6956d9" stroke-width="2"/></svg>';
}

export function miniChart(type) {
  const grid = '<path d="M10 20H150M10 45H150M10 70H150" stroke="#eceee8" stroke-width="1"/>';
  let content = '';
  if (type === 'line') {
    content = '<path d="M12 68 35 56 57 60 79 38 103 45 126 25 148 16" fill="none" stroke="#6956d9" stroke-width="3" stroke-linecap="round"/><path d="M12 68 35 56 57 60 79 38 103 45 126 25 148 16" fill="none" stroke="#6956d9" stroke-width="7" stroke-opacity=".08"/>';
  } else if (type === 'bar') {
    content = '<g fill="#6956d9" rx="3"><rect x="17" y="48" width="19" height="28" rx="3"/><rect x="48" y="30" width="19" height="46" rx="3"/><rect x="79" y="41" width="19" height="35" rx="3"/><rect x="110" y="18" width="19" height="58" rx="3"/></g>';
  } else if (type === 'scatter') {
    content = '<g fill="#6956d9" opacity=".75"><circle cx="22" cy="66" r="4"/><circle cx="37" cy="58" r="4"/><circle cx="48" cy="64" r="4"/><circle cx="61" cy="48" r="4"/><circle cx="76" cy="51" r="4"/><circle cx="88" cy="34" r="4"/><circle cx="101" cy="39" r="4"/><circle cx="117" cy="25" r="4"/><circle cx="137" cy="19" r="4"/></g>';
  } else {
    content = '<g stroke="#6956d9" fill="#eeeafd" stroke-width="2"><path d="M35 27v40M23 27h24M23 67h24"/><rect x="23" y="39" width="24" height="17" rx="2"/><path d="M23 47h24M102 20v47M90 20h24M90 67h24"/><rect x="90" y="30" width="24" height="23" rx="2"/><path d="M90 41h24"/></g>';
  }
  return `<svg viewBox="0 0 160 90" aria-hidden="true">${grid}${content}</svg>`;
}

export function scatterChart() {
  const points = [[12, 70], [25, 64], [35, 68], [48, 52], [60, 57], [70, 44], [82, 50], [94, 34], [108, 38], [122, 27], [138, 32], [152, 18], [169, 26], [184, 14]];
  const dots = points.map(([x, y]) => `<circle cx="${x + 25}" cy="${y + 12}" r="5" fill="#6956d9" opacity=".75"/>`).join('');
  return `<svg class="scatter-svg" viewBox="0 0 235 115" role="img" aria-label="Scatter plot showing a positive but imperfect association between temperature and rentals"><path d="M25 12V94H215" fill="none" stroke="#b9c0b4"/><path d="M25 73H215M25 52H215M25 31H215" stroke="#e7eae2"/>${dots}<text x="120" y="111" text-anchor="middle" font-size="8" fill="#66707d">Temperature →</text><text x="8" y="54" text-anchor="middle" font-size="8" fill="#66707d" transform="rotate(-90 8 54)">Rentals →</text></svg>`;
}

export function cvChart() {
  const a = [0.002, 0.003, 0.004, 0.003, 0.003];
  const b = [0.011, -0.004, 0.009, -0.003, 0.004];
  const scale = 520;
  const bars = a.map((value, index) => {
    const x = 40 + index * 69;
    const aHeight = value * scale;
    const bHeight = Math.abs(b[index]) * scale;
    const aY = 60 - aHeight;
    const bY = b[index] >= 0 ? 60 - bHeight : 60;
    return `<text x="${x + 17}" y="94" text-anchor="middle" font-size="8" fill="#66707d">Fold ${index + 1}</text><rect x="${x}" y="${aY}" width="14" height="${aHeight}" rx="2" fill="#6956d9"/><rect x="${x + 19}" y="${bY}" width="14" height="${bHeight}" rx="2" fill="${b[index] >= 0 ? '#e99552' : '#cb565e'}"/>`;
  }).join('');
  return `<svg class="cv-svg" viewBox="0 0 390 112" role="img" aria-label="Change A improves all five folds; Change B improves three folds and worsens two"><path d="M30 60H375" stroke="#aeb5a9"/><path d="M30 34H375M30 8H375" stroke="#edf0e8"/>${bars}<rect x="42" y="100" width="8" height="8" rx="2" fill="#6956d9"/><text x="54" y="107" font-size="8" fill="#66707d">Change A</text><rect x="115" y="100" width="8" height="8" rx="2" fill="#e99552"/><text x="127" y="107" font-size="8" fill="#66707d">Change B</text><text x="375" y="107" text-anchor="end" font-size="8" fill="#66707d">AUC gain</text></svg>`;
}

export function tuningChart(mission, selectedDepth) {
  const xFor = (index) => 35 + index * 55;
  const yFor = (value) => 116 - (value - 70) * 2.6;
  const trainingPoints = mission.training.map((value, index) => `${xFor(index)},${yFor(value)}`).join(' ');
  const validationPoints = mission.validation.map((value, index) => `${xFor(index)},${yFor(value)}`).join(' ');
  const selectedIndex = mission.depths.indexOf(Number(selectedDepth));
  const dots = mission.depths.map((depth, index) => `<circle cx="${xFor(index)}" cy="${yFor(mission.training[index])}" r="3" fill="#6956d9"/><circle cx="${xFor(index)}" cy="${yFor(mission.validation[index])}" r="3.5" fill="#24795a"/><text x="${xFor(index)}" y="130" text-anchor="middle" font-size="8" fill="#66707d">${depth}</text>`).join('');
  return `<svg viewBox="0 0 325 138" role="img" aria-label="Training accuracy keeps increasing while validation accuracy peaks at depth 3"><path d="M35 12V116H310M35 90H310M35 64H310M35 38H310M35 12H310" stroke="#e4e7df" fill="none"/><text x="15" y="41" font-size="7" fill="#8a9286">90%</text><text x="12" y="119" font-size="7" fill="#8a9286">70%</text><line x1="${xFor(selectedIndex)}" x2="${xFor(selectedIndex)}" y1="8" y2="116" stroke="#d6f785" stroke-width="9" opacity=".55"/><polyline points="${trainingPoints}" fill="none" stroke="#6956d9" stroke-width="2"/><polyline points="${validationPoints}" fill="none" stroke="#24795a" stroke-width="2.5"/>${dots}<text x="310" y="11" text-anchor="end" font-size="8" fill="#6956d9">● Training</text><text x="310" y="24" text-anchor="end" font-size="8" fill="#24795a">● Validation</text></svg>`;
}
