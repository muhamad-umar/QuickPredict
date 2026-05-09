async function loadProbability() {
    const c = document.getElementById('page-content');
    c.innerHTML = `
    <div class="page-container">
      <header class="section-header"><h2>Probability Distributions</h2>
        <p>Modeling delivery time using normal, binomial and Poisson distributions.</p></header>
      <div id="prob-loading"></div>
      <div id="prob-content" style="display:none;">



        <div style="margin-bottom:16px;"><span class="section-tag">Continuous Distributions</span></div>
        <div style="margin-bottom:32px;">
          <div class="chart-container"><h3>Normal Distribution of Delivery Time</h3>
            <div class="canvas-wrapper"><canvas id="cp-normal"></canvas></div></div>
        </div>

        <div style="margin-bottom:16px;"><span class="section-tag">Discrete Distributions</span></div>
        <div style="margin-bottom:32px;">
          <div class="chart-container"><h3 id="cp-binom-title">Binomial Distribution</h3>
            <div class="canvas-wrapper"><canvas id="cp-binom"></canvas></div></div>
        </div>

        <div class="grid-2" style="margin-bottom:32px;">
          <div class="chart-container"><h3>Z-Score Distribution</h3>
            <div class="canvas-wrapper"><canvas id="cp-z"></canvas></div></div>
          <div class="chart-container"><h3>Empirical vs Theoretical CDF</h3>
            <div class="canvas-wrapper"><canvas id="cp-cdf"></canvas></div></div>
        </div>
      </div>
    </div>`;

    showLoading('prob-loading');
    const data = await fetchAPI(`/probability`);
    document.getElementById('prob-loading').style.display = 'none';
    if (data.error) { showError('prob-content', data.error);
        document.getElementById('prob-content').style.display='block'; return; }
    document.getElementById('prob-content').style.display='block';


    const opt = { responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:true,labels:{color:darkTheme.color}}},
        scales:{ x:{type:'linear',ticks:{color:darkTheme.ticks.color},grid:{display:false}},
                 y:{ticks:{color:darkTheme.ticks.color},grid:{color:'rgba(255,255,255,0.03)'}} }};

    // Normal PDF with shaded
    createChart('cp-normal', {
        type:'line',
        data:{ datasets:[
          { label:'PDF', data:data.normal.x.map((x,i)=>({x,y:data.normal.y[i]})),
            borderColor:'#18e2ff', borderWidth:2, pointRadius:0, tension:0.3, parsing:false },
          { label:`Late (≥${data.normal.delay_threshold})`,
            data:data.normal.shade_late_x.map((x,i)=>({x,y:data.normal.shade_late_y[i]})),
            borderColor:'#ff4d5e', backgroundColor:'rgba(255,77,94,0.35)', fill:'origin', pointRadius:0, parsing:false },
          { label:`Fast (≤${data.normal.fast_threshold})`,
            data:data.normal.shade_fast_x.map((x,i)=>({x,y:data.normal.shade_fast_y[i]})),
            borderColor:'#2ee6a4', backgroundColor:'rgba(46,230,164,0.35)', fill:'origin', pointRadius:0, parsing:false }
        ]}, options: opt
    });

    // Binomial
    document.getElementById('cp-binom-title').textContent =
        `Binomial: n=${data.binomial.n}, p=${data.binomial.p.toFixed(3)} (P late)`;
    createChart('cp-binom', {
        type:'bar',
        data:{ labels:data.binomial.k, datasets:[{ label:'PMF',
          data:data.binomial.pmf, backgroundColor:'rgba(245,196,81,0.55)', borderRadius:2 }] },
        options:{ ...opt, scales:{ x:{ticks:{color:darkTheme.ticks.color},grid:{display:false}},
            y:{ticks:{color:darkTheme.ticks.color},grid:{color:'rgba(255,255,255,0.03)'}} } }
    });

    // Z
    createChart('cp-z', {
        type:'bar',
        data:{ labels:data.zscore.labels.map(v=>v.toFixed(2)),
               datasets:[{ data:data.zscore.values, backgroundColor:'rgba(24,226,255,0.4)',
                 borderRadius:1, barPercentage:1, categoryPercentage:1 }] },
        options:{ ...opt, plugins:{legend:{display:false}}, scales:{
            x:{ticks:{color:darkTheme.ticks.color},grid:{display:false}},
            y:{ticks:{color:darkTheme.ticks.color},grid:{color:'rgba(255,255,255,0.03)'}} } }
    });

    // CDF
    createChart('cp-cdf', {
        type:'line',
        data:{ datasets:[
          { label:'Empirical', data:data.cdf.empirical_x.map((x,i)=>({x,y:data.cdf.empirical_y[i]})),
            borderColor:'#18e2ff', borderWidth:2, pointRadius:0, parsing:false },
          { label:'Theoretical (Normal)', data:data.cdf.theoretical_x.map((x,i)=>({x,y:data.cdf.theoretical_y[i]})),
            borderColor:'#f5c451', borderWidth:2, borderDash:[6,4], pointRadius:0, parsing:false }
        ]}, options: opt
    });
}
