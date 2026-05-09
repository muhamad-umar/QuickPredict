async function loadDashboard() {
    const c = document.getElementById('page-content');
    c.innerHTML = `
    <div class="page-container">
      <div class="dashboard-hero">
        <div class="hero-content"><div class="hero-text">
          <span class="hero-subtitle">Probability, Statistics & Machine Learning</span>
          <h1 class="hero-title">FOOD DELIVERY TIME PREDICTION</h1>
          <p class="hero-desc">End-to-end analysis of delivery operations: distance, weather, traffic, time of day, vehicle, prep time and courier experience — modeled with multivariate regression.</p>
        </div></div>
      </div>

      <header class="section-header">
        <h2>Executive Summary</h2>
        <p>Key performance metrics for the current order population.</p>
      </header>

      <div class="kpi-grid" id="dash-kpis"></div>

      <div class="grid-2">
        <div class="chart-container"><h3>Top 10 Longest Deliveries</h3>
          <div class="canvas-wrapper"><canvas id="cd-top"></canvas></div></div>
        <div class="chart-container"><h3>Weather Distribution</h3>
          <div class="canvas-wrapper"><canvas id="cd-weather"></canvas></div></div>
      </div>

      <div class="grid-2">
        <div class="chart-container"><h3>Vehicle Type Mix</h3>
          <div class="canvas-wrapper"><canvas id="cd-vehicle"></canvas></div></div>
        <div class="chart-container"><h3>Traffic Level Mix</h3>
          <div class="canvas-wrapper"><canvas id="cd-traffic"></canvas></div></div>
      </div>

      <div class="chart-container"><h3>Average Delivery Time by Weather</h3>
        <div class="canvas-wrapper"><canvas id="cd-avg"></canvas></div></div>
    </div>`;

    showLoading('dash-kpis');
    const data = await fetchAPI(`/dashboard`);
    if (data.error) { showError('dash-kpis', data.error); return; }

    const k = data.kpis;
    document.getElementById('dash-kpis').innerHTML = `
      <div class="card kpi-card"><span class="label">Total Orders</span><span class="value">${k.total_orders.toLocaleString()}</span></div>
      <div class="card kpi-card"><span class="label">Avg Delivery (min)</span><span class="value">${k.avg_delivery}</span></div>
      <div class="card kpi-card"><span class="label">Min / Max (min)</span><span class="value">${k.min_delivery} / ${k.max_delivery}</span></div>
      <div class="card kpi-card"><span class="label">Avg Distance (km)</span><span class="value">${k.avg_distance}</span></div>
      <div class="card kpi-card"><span class="label">Top Vehicle</span><span class="value">${k.common_vehicle}</span></div>
    `;

    const opt = {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:false } },
        scales:{ x:{ ticks:{color:darkTheme.ticks.color}, grid:{display:false} },
                 y:{ ticks:{color:darkTheme.ticks.color}, grid:{color:'rgba(255,255,255,0.03)'} } }
    };

    createChart('cd-top', {
        type:'bar',
        data:{ labels: data.top10.map(o => o.order_id),
               datasets:[{ label:'Delivery (min)',
                 data:data.top10.map(o => o.delivery),
                 backgroundColor:'rgba(24,226,255,0.45)', borderRadius:2 }] },
        options:{ ...opt, indexAxis:'y' }
    });

    const donutOpt = {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:true, position:'right',
                  labels:{ color:darkTheme.color, boxWidth:12 } } },
        cutout:'70%'
    };

    createChart('cd-weather', {
        type:'doughnut',
        data:{ labels:data.weather_dist.map(d => d.label),
               datasets:[{ data:data.weather_dist.map(d => d.count),
                 backgroundColor:data.weather_dist.map(d => WEATHER_COLORS[d.label] || '#18e2ff'),
                 borderWidth:0 }] }, options: donutOpt
    });

    createChart('cd-vehicle', {
        type:'bar',
        data:{ labels:data.vehicle_dist.map(d=>d.label),
               datasets:[{ data:data.vehicle_dist.map(d=>d.count),
                 backgroundColor:'rgba(46,230,164,0.45)', borderRadius:2 }] },
        options: opt
    });

    createChart('cd-traffic', {
        type:'doughnut',
        data:{ labels:data.traffic_dist.map(d=>d.label),
               datasets:[{ data:data.traffic_dist.map(d=>d.count),
                 backgroundColor:CHART_COLORS, borderWidth:0 }] }, options: donutOpt
    });

    createChart('cd-avg', {
        type:'bar',
        data:{ labels:data.avg_by_weather.map(d=>d.label),
               datasets:[{ label:'Avg Delivery (min)',
                 data:data.avg_by_weather.map(d=>d.avg),
                 backgroundColor:data.avg_by_weather.map(d => WEATHER_COLORS[d.label] || '#18e2ff'),
                 borderRadius:2 }] }, options: opt
    });
}
