async function loadPredict() {
    const c = document.getElementById('page-content');
    c.innerHTML = `
    <div class="page-container">
      <header class="section-header"><h2>Delivery Time Predictor</h2>
        <p>Provide order details — the trained regression model returns the expected delivery time.</p></header>

      <div id="pr-loading"></div>
      <div id="pr-content" style="display:none;">
        <div class="grid-2">
          <div class="card" style="padding:32px;">
            <h3 class="section-tag">Order Inputs</h3>
            <div id="pr-inputs"></div>
            <button id="pr-go" class="next-page-btn" style="margin-top:20px;width:100%;">Predict Delivery Time »</button>
          </div>

          <div class="card predict-result" style="display:flex;flex-direction:column;justify-content:center;align-items:center;border:2px solid var(--border-color);padding:40px;">
            <span style="font-size:12px;text-transform:uppercase;letter-spacing:2.5px;color:var(--text-sub);font-weight:700;">Predicted ETA</span>
            <div id="pr-val" style="font-size:80px;font-weight:900;color:var(--primary);line-height:1;margin:18px 0 12px;font-family:'JetBrains Mono',monospace;">--</div>
            <div style="font-size:13px;color:var(--text-sub);">minutes</div>
            <div id="pr-tier" style="margin-top:24px;font-size:18px;font-weight:800;letter-spacing:4px;">READY</div>
            <div id="pr-delay" style="margin-top:24px;font-size:13px;color:var(--text-sub);"></div>
          </div>
        </div>

        <div class="card" style="margin-top:24px;border-left:4px solid var(--primary);padding:32px;">
          <h4 class="section-tag">How it works</h4>
          <p style="color:var(--text-sub);font-size:0.9rem;line-height:1.7;">
            The backend builds a regression modeling on the full dataset using
            numeric features (Distance, Preparation Time, Courier Experience) and one-hot encoded
            categorical features (Weather, Traffic Level, Time of Day, Vehicle Type).
            <b>Order_ID is excluded</b> from training and prediction — it exists only as a display label.</p>
        </div>
      </div>
    </div>`;

    showLoading('pr-loading');
    const data = await fetchAPI(`/regression`);
    document.getElementById('pr-loading').style.display='none';
    if (data.error) { showError('pr-content', data.error);
        document.getElementById('pr-content').style.display='block'; return; }
    document.getElementById('pr-content').style.display='block';

    const fr = data.feature_ranges, cats = data.categories;
    const slider = (label, id, min, max, val, step=0.1) => `
      <div class="filter-group" style="margin-bottom:18px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:0.7rem;font-weight:800;color:var(--text-sub);text-transform:uppercase;letter-spacing:1px;">${label}</span>
          <span id="lbl-${id}" class="mono" style="font-weight:700;color:var(--primary);">${val}</span>
        </div>
        <input type="range" id="${id}" min="${min}" max="${max}" value="${val}" step="${step}" class="pred-input">
      </div>`;

    const select = (label, id, options) => `
      <div class="filter-group" style="margin-bottom:18px;">
        <span style="font-size:0.7rem;font-weight:800;color:var(--text-sub);text-transform:uppercase;letter-spacing:1px;">${label}</span>
        <select id="${id}" class="pred-select">
          ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
        </select>
      </div>`;

    document.getElementById('pr-inputs').innerHTML =
        slider('Distance (km)', 'in-dist', Math.floor(fr.Distance_km.min), Math.ceil(fr.Distance_km.max), fr.Distance_km.mean.toFixed(1)) +
        slider('Preparation Time (min)', 'in-prep', Math.floor(fr.Preparation_Time_min.min), Math.ceil(fr.Preparation_Time_min.max), fr.Preparation_Time_min.mean.toFixed(1)) +
        slider('Courier Experience (yrs)', 'in-exp', Math.floor(fr.Courier_Experience_yrs.min), Math.ceil(fr.Courier_Experience_yrs.max), fr.Courier_Experience_yrs.mean.toFixed(1)) +
        select('Weather', 'in-weather', cats.weather) +
        select('Traffic Level', 'in-traffic', cats.traffic) +
        select('Time of Day', 'in-tod', cats.tod) +
        select('Vehicle Type', 'in-vehicle', cats.vehicle);

    ['in-dist','in-prep','in-exp'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('input', () => {
            document.getElementById('lbl-'+id).textContent = parseFloat(el.value).toFixed(1);
        });
    });

    const doPredict = async () => {
        const body = {
            Distance_km: parseFloat(document.getElementById('in-dist').value),
            Preparation_Time_min: parseFloat(document.getElementById('in-prep').value),
            Courier_Experience_yrs: parseFloat(document.getElementById('in-exp').value),
            Weather: document.getElementById('in-weather').value,
            Traffic_Level: document.getElementById('in-traffic').value,
            Time_of_Day: document.getElementById('in-tod').value,
            Vehicle_Type: document.getElementById('in-vehicle').value
        };
        const res = await fetchAPI('/predict', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify(body)
        });
        if (res.error) return;
        const v = document.getElementById('pr-val');
        const t = document.getElementById('pr-tier');
        v.textContent = res.predicted; v.style.color = res.color;
        t.textContent = res.tier; t.style.color = res.color;
        document.getElementById('pr-delay').innerHTML =
            `<div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;color:var(--text-sub);">
              <span><b style="color:#000">EXPRESS</b> &le; ${res.thresholds.q1}m</span>
              <span><b style="color:#000">ON TIME</b> &le; ${res.thresholds.q2}m</span>
              <span><b style="color:#000">MODERATE</b> &le; ${res.thresholds.q3}m</span>
              <span><b style="color:#000">DELAYED</b> &gt; ${res.thresholds.q3}m</span>
            </div>`;
    };
    document.getElementById('pr-go').addEventListener('click', doPredict);
    doPredict();
}
