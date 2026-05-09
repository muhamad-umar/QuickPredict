async function loadStats() {
    const c = document.getElementById('page-content');
    c.innerHTML = `
    <div class="page-container">
      <header class="section-header"><h2>Measures of Central Tendency & Dispersion</h2>
        <p>Detailed statistical breakdown of numeric delivery variables.</p></header>
      <div id="stats-loading"></div>
      <div id="stats-content" style="display:none;">

        <div style="margin:16px 0;"><span class="section-tag">Tabular Representation</span></div>
        <div class="table-container" style="margin-bottom:32px;">
          <table><thead><tr>
            <th>Variable</th><th>Mean</th><th>Median</th><th>Mode</th>
            <th>Std Dev</th><th>Variance</th>
            <th style="background:rgba(24,226,255,0.05);">CVar (%)</th>
            <th>Min</th><th>Max</th><th>Skew</th>
          </tr></thead><tbody id="tb-desc"></tbody></table>
        </div>

        <div style="margin-bottom:16px;"><span class="section-tag">Group Means — Delivery Time by Category</span></div>
        <div class="table-container" style="margin-bottom:32px;">
          <table><thead><tr>
            <th>Variable</th><th>Group</th><th style="text-align:right;">n</th>
            <th style="text-align:right;">Mean Delivery (min)</th><th style="text-align:right;">Std</th>
          </tr></thead><tbody id="tb-grp"></tbody></table>
        </div>

        <div class="grid-2">
          <div class="chart-container"><h3>Coefficient of Variation</h3>
            <div class="canvas-wrapper"><canvas id="cs-cvar"></canvas></div></div>
          <div class="chart-container"><h3>Skewness</h3>
            <div class="canvas-wrapper"><canvas id="cs-skew"></canvas></div></div>
        </div>

        <div style="margin-bottom:16px;"><span class="section-tag">Delivery Time Positional Statistics</span></div>
        <div class="table-container" style="margin-bottom:32px;">
          <table><thead><tr>
            <th>Type</th><th>Label</th><th style="text-align:right;">Delivery Time (min)</th><th>Meaning</th>
          </tr></thead><tbody id="tb-pos"></tbody></table>
        </div>

        <div class="chart-container"><h3>Delivery Time Positional Statistics</h3>
          <div class="canvas-wrapper"><canvas id="cs-pct"></canvas></div></div>

        <div class="card" style="border-left:4px solid var(--primary); padding:32px; margin-top:24px;">
          <h4 class="section-tag">Statistical Note</h4>
          <p style="font-size:0.9rem;color:var(--text-sub);line-height:1.7;">
            <b>CVar</b> normalizes std dev relative to the mean — useful for comparing variables on different scales
            (e.g. delivery time in minutes vs courier experience in years).</p>
        </div>
      </div>
    </div>`;

    showLoading('stats-loading');
    const data = await fetchAPI(`/stats`);
    document.getElementById('stats-loading').style.display = 'none';
    if (data.error) { showError('stats-content', data.error);
        document.getElementById('stats-content').style.display='block'; return; }
    document.getElementById('stats-content').style.display='block';

    document.getElementById('tb-desc').innerHTML = data.descriptive.map(r => `
      <tr><td style="font-weight:700;font-size:0.75rem;">${r.variable}</td>
      <td class="mono">${r.mean}</td><td class="mono">${r.median}</td>
      <td class="mono">${r.mode!==null?r.mode:'-'}</td>
      <td class="mono">${r.std}</td><td class="mono">${r.variance}</td>
      <td class="mono" style="font-weight:700;color:var(--primary);">${r.cvar}%</td>
      <td class="mono">${r.min}</td><td class="mono">${r.max}</td>
      <td class="mono">${r.skewness}</td></tr>`).join('');

    document.getElementById('tb-grp').innerHTML = data.group_means.map(r => `
      <tr><td style="font-weight:700;font-size:0.75rem;">${r.variable}</td>
      <td>${r.group}</td><td class="mono">${r.n}</td>
      <td class="mono" style="color:var(--primary);font-weight:700;">${r.mean}</td>
      <td class="mono">${r.std}</td></tr>`).join('');

    const pMap = {};
    data.percentiles.forEach(p => pMap[p.label] = p.value);
    const posRows = [
      { type: 'Quartile', label: 'Q1 (P25)', val: pMap['P25'], meaning: '25% deliveries below this' },
      { type: 'Quartile', label: 'Q2 (P50)', val: pMap['P50'], meaning: 'Median delivery time' },
      { type: 'Quartile', label: 'Q3 (P75)', val: pMap['P75'], meaning: '75% deliveries below this' },
      { type: 'Decile', label: 'D1 (P10)', val: pMap['P10'], meaning: '10% deliveries below this' },
      { type: 'Decile', label: 'D5 (P50)', val: pMap['P50'], meaning: 'Middle delivery point' },
      { type: 'Decile', label: 'D9 (P90)', val: pMap['P90'], meaning: '90% deliveries below this' },
      { type: 'Percentile', label: 'P95', val: pMap['P95'], meaning: '95% deliveries below this' },
      { type: 'Percentile', label: 'P99', val: pMap['P99'], meaning: 'Extreme delivery threshold' }
    ];
    document.getElementById('tb-pos').innerHTML = posRows.map(r => `
      <tr><td style="font-weight:700;font-size:0.75rem;">${r.type}</td>
      <td style="color:var(--primary);font-weight:700;">${r.label}</td>
      <td class="mono" style="font-weight:800;">${r.val}</td>
      <td style="color:var(--text-sub);">${r.meaning}</td></tr>`).join('');

    const opt = { responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{ x:{ticks:{color:darkTheme.ticks.color},grid:{display:false}},
                 y:{ticks:{color:darkTheme.ticks.color},grid:{color:'rgba(255,255,255,0.03)'}} }};

    createChart('cs-cvar', {
        type:'bar',
        data:{ labels:data.descriptive.map(d=>d.variable),
               datasets:[{ data:data.descriptive.map(d=>d.cvar),
                 backgroundColor:'rgba(24,226,255,0.4)', borderRadius:2 }] },
        options:{ ...opt, indexAxis:'y' }
    });

    createChart('cs-skew', {
        type:'bar',
        data:{ labels:data.skew_kurt.map(d=>d.attr),
               datasets:[
                 { label:'Skewness', data:data.skew_kurt.map(d=>d.skewness), backgroundColor:'rgba(245,196,81,0.5)', borderRadius:2 }
               ] },
        options:{ ...opt, plugins:{legend:{display:true,labels:{color:darkTheme.color}}} }
    });

    const pctChartLabels = data.percentiles.map(p => {
        if (p.label === 'P10') return 'D1 (P10)';
        if (p.label === 'P25') return 'Q1 (P25)';
        if (p.label === 'P50') return 'Q2 (P50)';
        if (p.label === 'P75') return 'Q3 (P75)';
        if (p.label === 'P90') return 'D9 (P90)';
        return p.label;
    });

    createChart('cs-pct', {
        type:'bar',
        data:{ labels:pctChartLabels,
               datasets:[{ data:data.percentiles.map(p=>p.value),
                 backgroundColor:'rgba(46,230,164,0.5)', borderRadius:2 }] }, options:opt
    });
}
