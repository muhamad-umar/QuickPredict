# Food Delivery Time Prediction System

A university-level **Probability & Statistics + Machine Learning** project that analyzes food delivery operations and predicts delivery time using regression modeling.

## Dataset Variables

| Variable | Description | Notes |
|---|---|---|
| `Order_ID` | Unique identifier | **Display only** — never used in analysis or modeling |
| `Distance_km` | Delivery distance (km) | Numeric feature |
| `Weather` | Clear / Rainy / Snowy / Foggy / Windy | Categorical |
| `Traffic_Level` | Low / Medium / High | Categorical |
| `Time_of_Day` | Morning / Afternoon / Evening / Night | Categorical |
| `Vehicle_Type` | Bike / Scooter / Car | Categorical |
| `Preparation_Time_min` | Order prep time | Numeric feature |
| `Courier_Experience_yrs` | Courier experience | Numeric feature |
| `Delivery_Time_min` | **Target** | Numeric |

A 1000-row synthetic dataset is generated automatically with realistic relationships (weather/traffic/vehicle multipliers, experience effect, gaussian noise).

## Pages

1. **Dashboard Overview** — KPIs, top deliveries, weather/traffic/vehicle mix.
2. **Graphical Analysis** — Histogram + Normal fit, Boxplot by Traffic, scatter plots, correlation heatmap.
3. **Descriptive Statistics** — Mean / median / mode / std / variance / CVar / skew / kurt, 95% CIs, group means, percentiles.
4. **Probability Distributions** — Normal PDF (with late/fast shading), Binomial (n=20, p=P(late)), Poisson (λ = mean orders per weather), Z-scores, ECDF vs theoretical, conditional probabilities, Shapiro-Wilk test.
5. **Regression Modeling** — Regression modeling with one-hot categoricals; R², MAE, RMSE; actual-vs-predicted, coefficient impact, residuals, equation.
6. **ETA Predictor** — Interactive form posting to `/api/predict` for live predictions with delivery tier (EXPRESS / ON TIME / MODERATE / DELAYED).
7. **Dataset Explorer** — Browse raw orders (Order_ID for display only).

## Tech Stack

- **Backend**: Python · FastAPI · pandas · NumPy · SciPy · scikit-learn
- **Frontend**: Vanilla HTML / CSS / JavaScript · Chart.js
- **Design**: Dark dashboard UI with cyan/gold accents

## How to Run

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API will be live at `http://localhost:8000` (interactive docs at `/docs`).

### 2. Frontend

Open `frontend/index.html` directly in a browser, **or** serve it:

```bash
cd frontend
python -m http.server 5500
# visit http://localhost:5500
```

The frontend talks to the backend at `http://localhost:8000/api`.

## Project Structure

```
FoodDelivery_Project/
├── backend/
│   ├── main.py              # FastAPI app + dataset generator + ML
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── main.js          # Filters, navigation, init
│       ├── dashboard.js
│       ├── graphical.js
│       ├── stats.js
│       ├── probability.js
│       ├── regression.js
│       ├── predict.js
│       └── dataset.js
└── README.md
```

## Statistical Highlights

- **Order_ID is dropped** from the working DataFrame before any computation: `df = df_full.drop("Order_ID", axis=1)`.
- Continuous distribution: Normal fit on `Delivery_Time_min` with shaded regions for *late* (≥45 min) and *fast* (≤25 min).
- Discrete distributions: Binomial models the number of late deliveries out of 20; Poisson models orders per weather category.
- Conditional probabilities: P(Late | Rainy), P(Late | High Traffic), P(Fast | Bike).
- Regression typically achieves **R² ≈ 0.85–0.92** on the synthetic data.

---
*University Probability & Statistics + ML project.*
