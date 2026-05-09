const API = 'http://localhost:8000/api';

Chart.defaults.color = '#8a94a6';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.responsive = true;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.title.font = { family: "'Outfit', sans-serif", size: 16, weight: '900' };
Chart.defaults.plugins.title.color = '#1e293b';

const darkTheme = {
    color: '#9CA4B4',
    grid: { color: 'rgba(0,0,0,0.05)' },
    ticks: { color: '#475569' }
};
const CHART_COLORS = ['#18e2ff', '#2ee6a4', '#f5c451', '#ff4d5e', '#b06bff', '#f0f4f8'];

const WEATHER_COLORS = {
    'Clear': '#18e2ff', 'Rainy': '#2ee6a4', 'Snowy': '#b06bff', 'Foggy': '#8a94a6', 'Windy': '#f5c451'
};


async function fetchAPI(endpoint, options = {}) {
    try {
        const r = await fetch(`${API}${endpoint}`, options);
        if (!r.ok) throw new Error('API Error ' + r.status);
        return await r.json();
    } catch (e) { console.error(e); return { error: e.message }; }
}

function showLoading(id) { const el = document.getElementById(id); if (el) el.innerHTML = '<div class="spinner"></div>'; }
function showError(id, m) { const el = document.getElementById(id); if (el) el.innerHTML = `<div class="error-msg">${m || 'Error'}</div>`; }

function createChart(id, config) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    const existing = Chart.getChart(id); if (existing) existing.destroy();
    return new Chart(ctx, config);
}

let currentPage = 'dashboard';
const pageLabels = {
    dashboard: 'Dashboard Overview', graphical: 'Graphical Analysis',
    stats: 'Descriptive Statistics', probability: 'Probability Distributions',
    regression: 'Regression Modeling', predict: 'Delivery Time Predictor', dataset: 'Dataset Explorer'
};
const syllabusMap = {
    dashboard: 'Project Overview', graphical: 'Graphical Representation',
    stats: 'Central Tendency & Dispersion', probability: 'Probability & Distributions',
    regression: 'Multivariate Modeling', predict: 'Applied ML Prediction',
    dataset: 'Raw Data Repository'
};

async function loadPage(name) {
    currentPage = name;
    const content = document.getElementById('page-content');
    content.innerHTML = '';
    document.getElementById('current-page-label').textContent = pageLabels[name] || name.toUpperCase();
    document.getElementById('syllabus-badge').textContent = syllabusMap[name] || 'FOOD DELIVERY';

    const pages = ['dashboard', 'graphical', 'stats', 'probability', 'regression', 'predict', 'dataset'];
    const i = pages.indexOf(name);
    const footer = document.getElementById('footer-nav-container');
    if (i !== -1 && i < pages.length - 1) {
        const next = pages[i + 1];
        footer.innerHTML = `<div class="footer-nav"><button class="next-page-btn" onclick="loadPage('${next}')">Next Topic: ${pageLabels[next]} »</button></div>`;
    } else footer.innerHTML = '';

    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('active');
        if (l.dataset.page === name) l.classList.add('active');
    });

    const fns = {
        dashboard: loadDashboard, graphical: loadGraphical, stats: loadStats,
        probability: loadProbability, regression: loadRegression,
        predict: loadPredict, dataset: loadDataset
    };
    if (typeof fns[name] === 'function') fns[name]();
}

async function updateOrderCount() {
    // Badge text is now statically set to "Predict, Analyze, Deliver."
}

document.addEventListener('DOMContentLoaded', async () => {

    document.querySelectorAll('.nav-link').forEach(l => {
        l.addEventListener('click', () => loadPage(l.dataset.page));
    });

    updateOrderCount();
    loadPage('dashboard');
});
