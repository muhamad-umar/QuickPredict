async function loadDataset() {
    const c = document.getElementById('page-content');
    c.innerHTML = `
    <div class="page-container">
      <header class="section-header"><h2>Dataset Explorer</h2>
        <p>Browse the original delivery records collected for analytical and predictive insights</p></header>

      <div id="ds-loading"></div>
      <div id="ds-content" style="display:none;">
        <div class="kpi-grid" id="ds-summary" style="margin-bottom:24px;"></div>

        <div class="table-container">
          <table id="ds-table">
            <thead><tr>
              <th>Order_ID</th><th>Distance (km)</th><th>Weather</th><th>Traffic</th>
              <th>Time of Day</th><th>Vehicle</th><th>Prep (min)</th>
              <th>Experience (yrs)</th><th>Delivery (min)</th>
            </tr></thead>
            <tbody id="ds-body"></tbody>
          </table>
        </div>
        <p style="font-size:0.8rem;color:var(--text-sub);margin-top:12px;text-align:right;">
          Showing first <span id="ds-count">0</span> rows of filtered data.
        </p>
      </div>
    </div>`;

    showLoading('ds-loading');
    const data = await fetchAPI(`/dataset`);
    document.getElementById('ds-loading').style.display='none';
    if (data.error) { showError('ds-content', data.error);
        document.getElementById('ds-content').style.display='block'; return; }
    document.getElementById('ds-content').style.display='block';

    const s = data.summary;
    document.getElementById('ds-summary').innerHTML = `
      <div class="card kpi-card"><span class="label">Total Orders</span><span class="value">${s.total_orders}</span></div>
      <div class="card kpi-card"><span class="label">Avg Delivery (min)</span><span class="value">${s.avg_delivery}</span></div>
      <div class="card kpi-card"><span class="label">Avg Distance (km)</span><span class="value">${s.avg_distance}</span></div>
      <div class="card kpi-card"><span class="label">Avg Prep (min)</span><span class="value">${s.avg_prep}</span></div>
      <div class="card kpi-card"><span class="label">Avg Experience (yrs)</span><span class="value">${s.avg_experience}</span></div>
      <div class="card kpi-card"><span class="label">Common Weather</span><span class="value">${s.common_weather}</span></div>
      <div class="card kpi-card"><span class="label">Common Vehicle</span><span class="value">${s.common_vehicle}</span></div>
    `;

    document.getElementById('ds-body').innerHTML = data.rows.map(r => `
      <tr>
        <td class="mono" style="color:var(--text-sub);">${r.Order_ID}</td>
        <td class="mono">${r.Distance_km}</td>
        <td>${r.Weather}</td>
        <td>${r.Traffic_Level}</td>
        <td>${r.Time_of_Day}</td>
        <td>${r.Vehicle_Type}</td>
        <td class="mono">${r.Preparation_Time_min}</td>
        <td class="mono">${r.Courier_Experience_yrs}</td>
        <td class="mono" style="color:var(--primary);font-weight:700;">${r.Delivery_Time_min}</td>
      </tr>`).join('');

    document.getElementById('ds-count').textContent = data.total_shown;
}
