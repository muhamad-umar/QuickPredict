async function loadRegression() {
  const c = document.getElementById('page-content');
  c.innerHTML = `
    <div class="page-container">
      <header class="section-header"><h2>Regression Modeling</h2>
        <p>Predicting Delivery_Time_min from distance, prep time, experience, weather, traffic, time of day & vehicle.</p></header>
      <div id="reg-loading"></div>
      <div id="reg-content" style="display:none;">

        <div style="margin:16px 0; display: flex; justify-content: space-between; align-items: center;">
          <span class="section-tag">Pearson Correlation Coefficient</span>
          <select id="corr-var" style="width:300px; padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--bg-card); color: var(--text-main);">
            <option value="Distance_km" selected>Distance vs Delivery Time</option>
            <option value="Preparation_Time_min">Preparation Time vs Delivery Time</option>
            <option value="Traffic_Level">Traffic Level vs Delivery Time</option>
            <option value="Weather">Weather vs Delivery Time</option>
          </select>
        </div>

        <div class="table-container" style="margin-bottom:16px;">
          <table>
            <thead><tr>
              <th style="text-align:right;">∑x</th>
              <th style="text-align:right;">∑y</th>
              <th style="text-align:right;">∑xy</th>
              <th style="text-align:right;">∑x²</th>
              <th style="text-align:right;">∑y²</th>
              <th style="text-align:right;">n</th>
            </tr></thead>
            <tbody id="tb-pearson-stats"></tbody>
          </table>
        </div>
        
        <div class="card" style="margin-bottom:32px; padding:24px; text-align:center; font-size:1.5rem; font-weight:800; color:var(--primary);">
          r = <span id="pearson-r"></span>
        </div>

        <div class="chart-container" style="margin-bottom:32px;">
          <h3>Correlation Scatter Plot</h3>
          <div class="canvas-wrapper"><canvas id="cs-pearson"></canvas></div>
        </div>

        <div style="margin:16px 0;"><span class="section-tag">Model Performance Metrics</span></div>
        <div class="kpi-grid" id="reg-metrics" style="margin-bottom:32px;"></div>

        <div class="grid-2" style="margin-bottom:32px;">
          <div class="chart-container"><h3>Actual vs Predicted</h3>
            <div class="canvas-wrapper"><canvas id="cr-scatter"></canvas></div></div>
          <div class="chart-container"><h3>Coefficient Impact</h3>
            <div class="canvas-wrapper"><canvas id="cr-coef"></canvas></div></div>
        </div>

        <div class="chart-container" style="margin-bottom:32px;">
          <h3>Residuals Histogram</h3>
          <div class="canvas-wrapper"><canvas id="cr-res"></canvas></div>
        </div>

        <div class="card" style="background:rgba(0,0,0,0.3);border-left:4px solid var(--primary);padding:32px;border-radius:16px;">
          <h4 class="section-tag">Regression Equation</h4>
          <pre id="reg-eq" style="font-family:'JetBrains Mono',monospace;font-size:0.85rem;white-space:pre-wrap;line-height:1.7;color:var(--text-main);"></pre>
        </div>
      </div>
    </div>`;

  showLoading('reg-loading');
  const data = await fetchAPI(`/regression`);
  document.getElementById('reg-loading').style.display = 'none';
  if (data.error) {
    showError('reg-content', data.error);
    document.getElementById('reg-content').style.display = 'block'; return;
  }
  document.getElementById('reg-content').style.display = 'block';

  const rawData = data.raw_data;
  const yVals = rawData.Delivery_Time_min;
  const trafficMap = { 'Low': 1, 'Medium': 2, 'High': 3 };
  const weatherMap = { 'Clear': 1, 'Cloudy': 2, 'Windy': 3, 'Foggy': 4, 'Rainy': 5, 'Snowy': 6 };

  function renderPearson(variable) {
    let xVals = rawData[variable];
    if (variable === 'Traffic_Level') xVals = xVals.map(v => trafficMap[v] || 0);
    if (variable === 'Weather') xVals = xVals.map(v => weatherMap[v] || 0);

    let sum_x = 0, sum_y = 0, sum_xy = 0, sum_x2 = 0, sum_y2 = 0;
    const n = xVals.length;
    const scatterPoints = [];

    for (let i = 0; i < n; i++) {
      const x = xVals[i];
      const y = yVals[i];
      sum_x += x; sum_y += y;
      sum_xy += x * y;
      sum_x2 += x * x; sum_y2 += y * y;
      scatterPoints.push({ x, y });
    }

    const numerator = (n * sum_xy) - (sum_x * sum_y);
    const denom = Math.sqrt((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y));
    const r = denom === 0 ? 0 : numerator / denom;

    document.getElementById('tb-pearson-stats').innerHTML = `
            <tr>
              <td class="mono" style="text-align:right;">${sum_x.toFixed(2)}</td>
              <td class="mono" style="text-align:right;">${sum_y.toFixed(2)}</td>
              <td class="mono" style="text-align:right;">${sum_xy.toFixed(2)}</td>
              <td class="mono" style="text-align:right;">${sum_x2.toFixed(2)}</td>
              <td class="mono" style="text-align:right;">${sum_y2.toFixed(2)}</td>
              <td class="mono" style="text-align:right;">${n}</td>
            </tr>`;
    document.getElementById('pearson-r').textContent = r.toFixed(4);

    const existing = Chart.getChart('cs-pearson');
    if (existing) existing.destroy();
    createChart('cs-pearson', {
      type: 'scatter',
      data: { datasets: [{ label: variable + ' vs Delivery Time', data: scatterPoints, backgroundColor: 'rgba(176,107,255,0.6)', pointRadius: 3 }] },
      options: {
        responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: variable, color: '#8a94a6' }, ticks: { color: darkTheme.ticks.color }, grid: { display: false } },
          y: { title: { display: true, text: 'Delivery Time (min)', color: '#8a94a6' }, ticks: { color: darkTheme.ticks.color }, grid: { color: 'rgba(255,255,255,0.03)' } }
        }
      }
    });
  }

  document.getElementById('corr-var').addEventListener('change', (e) => renderPearson(e.target.value));
  renderPearson('Distance_km');

  document.getElementById('reg-metrics').innerHTML = `
      <div class="card kpi-card" style="border-left-color:var(--green);"><span class="label">Train Size</span><span class="value">${data.metrics.train_size}</span></div>`;

  createChart('cr-scatter', {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Predictions',
          data: data.actual_vs_pred.map(d => ({ x: d.actual, y: d.predicted })),
          backgroundColor: 'rgba(24,226,255,0.4)', pointRadius: 2
        },
        {
          type: 'line', data: [{ x: 0, y: 0 }, { x: 120, y: 120 }],
          borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderDash: [5, 5], pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: 'Actual Delivery (min)', color: '#8a94a6' }, ticks: { color: darkTheme.ticks.color }, grid: { display: false } },
        y: { title: { display: true, text: 'Predicted (min)', color: '#8a94a6' }, ticks: { color: darkTheme.ticks.color }, grid: { color: 'rgba(255,255,255,0.03)' } }
      }
    }
  });

  createChart('cr-coef', {
    type: 'bar',
    data: {
      labels: data.coefficients.map(d => d.feature),
      datasets: [{
        data: data.coefficients.map(d => d.value),
        backgroundColor: data.coefficients.map(d => d.value >= 0 ? 'rgba(24,226,255,0.6)' : 'rgba(255,77,94,0.6)'),
        borderRadius: 2
      }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: darkTheme.ticks.color }, grid: { color: 'rgba(255,255,255,0.03)' } },
        y: { ticks: { color: darkTheme.ticks.color, font: { size: 10 } }, grid: { display: false } }
      }
    }
  });

  createChart('cr-res', {
    type: 'bar',
    data: {
      labels: data.residuals_hist.labels.map(v => v.toFixed(1)),
      datasets: [{
        data: data.residuals_hist.values,
        backgroundColor: 'rgba(46,230,164,0.4)', borderRadius: 1, barPercentage: 1, categoryPercentage: 1
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: darkTheme.ticks.color }, grid: { display: false } },
        y: { ticks: { color: darkTheme.ticks.color }, grid: { color: 'rgba(255,255,255,0.03)' } }
      }
    }
  });

  const terms = data.equation.terms.map(t => {
    const sign = t.coef >= 0 ? '+' : '-';
    return `    ${sign} (${Math.abs(t.coef).toFixed(4)} × ${t.feature})`;
  }).join('\n');
  document.getElementById('reg-eq').textContent =
    `ŷ (Delivery_Time_min) = ${data.equation.intercept.toFixed(4)}\n${terms}`;
}
