async function loadGraphical() {
    const c = document.getElementById('page-content');
    c.innerHTML = `
    <div class="page-container">
      <header class="section-header"><h2>Graphical Analysis</h2>
        <p>Visualization of delivery time distributions and key relationships.</p></header>
      <div id="graph-loading"></div>
      <div id="graph-content" style="display:none;">
        <div class="grid-2">
          <div class="chart-container"><h3>Delivery Time Distribution</h3>
            <div class="canvas-wrapper"><canvas id="cg-hist"></canvas></div></div>
          <div class="chart-container"><h3>IQR by Traffic Level (Boxplot Bars)</h3>
            <div class="canvas-wrapper"><canvas id="cg-box"></canvas></div></div>
        </div>
        <div class="grid-2">
          <div class="chart-container"><h3>Distance vs Delivery Time</h3>
            <div class="canvas-wrapper"><canvas id="cg-scat1"></canvas></div></div>
          <div class="chart-container"><h3>Preparation Time vs Delivery Time</h3>
            <div class="canvas-wrapper"><canvas id="cg-scat2"></canvas></div></div>
        </div>
        <div class="grid-2">
          <div class="chart-container"><h3>Avg Delivery Time by Vehicle</h3>
            <div class="canvas-wrapper"><canvas id="cg-veh"></canvas></div></div>
          <div class="chart-container"><h3>Avg Delivery Time by Time of Day</h3>
            <div class="canvas-wrapper"><canvas id="cg-tod"></canvas></div></div>
        </div>

        <div class="card" style="border-left:4px solid var(--primary); padding:32px; margin-top:24px;">
          <h4 style="font-size:0.8rem;text-transform:uppercase;letter-spacing:2px;color:var(--primary);font-weight:800;margin-bottom:12px;">Interpretation</h4>
          <p style="font-size:0.9rem;color:var(--text-sub);line-height:1.7;">
            The histogram shows the empirical distribution of delivery times overlaid with the fitted normal curve.
            Boxplots reveal how traffic level shifts the median and IQR. Scatter plots demonstrate the strong
            positive relationships of <b>Distance</b> and <b>Preparation Time</b> with the target.</p>
        </div>
      </div>
    </div>`;

    showLoading('graph-loading');
    const data = await fetchAPI(`/graphical`);
    document.getElementById('graph-loading').style.display = 'none';
    if (data.error) { showError('graph-content', data.error);
        document.getElementById('graph-content').style.display='block'; return; }
    document.getElementById('graph-content').style.display='block';

    const opt = { responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{ x:{ticks:{color:darkTheme.ticks.color}, grid:{display:false}},
                 y:{ticks:{color:darkTheme.ticks.color}, grid:{color:'rgba(255,255,255,0.03)'}} }};

    createChart('cg-hist', {
        data:{ labels: data.histogram.labels.map(v => v.toFixed(1)),
               datasets:[
                 { type:'bar', label:'Frequency', data:data.histogram.values,
                   backgroundColor:'rgba(24,226,255,0.4)', borderRadius:1, barPercentage:1, categoryPercentage:1 },
                 { type:'line', label:'Normal Fit',
                   data:data.histogram.normal_y.map((y,i) => ({x:data.histogram.normal_x[i], y})),
                   borderColor:'#f5c451', borderWidth:2, pointRadius:0, tension:0.3,
                   xAxisID:'xLine', parsing:false }
               ] },
        options:{ ...opt, scales:{ ...opt.scales,
            x: { ...opt.scales.x, title: { display: true, text: 'Delivery Time (min)', color: '#8a94a6' } },
            y: { ...opt.scales.y, title: { display: true, text: 'Frequency (Number of Orders)', color: '#8a94a6' } },
            xLine:{ display:false, type:'linear', min:Math.min(...data.histogram.normal_x), max:Math.max(...data.histogram.normal_x) } },
            plugins:{ legend:{display:true,labels:{color:darkTheme.color}} } }
    });

    createChart('cg-box', {
        type:'bar',
        data:{ labels: data.boxplot.map(b => b.label),
               datasets:[
                 { label:'IQR', data: data.boxplot.map(b => [b.q1, b.q3]),
                   backgroundColor:'rgba(46,230,164,0.5)', borderRadius:2 },
                 { label:'Median', data: data.boxplot.map(b => [b.median, b.median + 0.4]),
                   backgroundColor:'#f5c451' }
               ] },
        options:{ ...opt, plugins:{legend:{display:true,labels:{color:darkTheme.color}}} }
    });

    createChart('cg-scat1', {
        type:'scatter',
        data:{ datasets:[{ data:data.scatter_distance.map(p=>({x:p.x,y:p.y})),
            backgroundColor:'rgba(24,226,255,0.4)', pointRadius:2 }] },
        options:{ ...opt, scales:{
            x:{title:{display:true,text:'Distance (km)',color:'#8a94a6'},ticks:{color:darkTheme.ticks.color},grid:{display:false}},
            y:{title:{display:true,text:'Delivery (min)',color:'#8a94a6'},ticks:{color:darkTheme.ticks.color},grid:{color:'rgba(255,255,255,0.03)'}} } }
    });

    createChart('cg-scat2', {
        type:'scatter',
        data:{ datasets:[{ data:data.scatter_prep.map(p=>({x:p.x,y:p.y})),
            backgroundColor:'rgba(245,196,81,0.4)', pointRadius:2 }] },
        options:{ ...opt, scales:{
            x:{title:{display:true,text:'Preparation Time (min)',color:'#8a94a6'},ticks:{color:darkTheme.ticks.color},grid:{display:false}},
            y:{title:{display:true,text:'Delivery (min)',color:'#8a94a6'},ticks:{color:darkTheme.ticks.color},grid:{color:'rgba(255,255,255,0.03)'}} } }
    });

    createChart('cg-veh', {
        type:'bar',
        data:{ labels:data.vehicle_avg.map(d=>d.label),
               datasets:[{ data:data.vehicle_avg.map(d=>d.avg),
                 backgroundColor:'rgba(176,107,255,0.5)', borderRadius:2 }] }, options:opt
    });

    createChart('cg-tod', {
        type:'bar',
        data:{ labels:data.tod_avg.map(d=>d.label),
               datasets:[{ data:data.tod_avg.map(d=>d.avg),
                 backgroundColor:'rgba(255,77,94,0.45)', borderRadius:2 }] }, options:opt
    });


}
