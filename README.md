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

1. **Dashboard Overview** — Essential KPIs, top recent deliveries, and operational mix (weather/traffic/vehicle).
2. **Graphical Analysis** — Histogram with Normal fit, Boxplots by Traffic, scatter plots, and correlation heatmap.
3. **Descriptive Statistics** — Central tendency (Mean/Median/Mode), Dispersion (Std/Var/CVar), Skewness/Kurtosis, 95% Confidence Intervals, and Percentiles.
4. **Probability Distributions** — Visualized Normal PDF (with late/fast shading), Binomial (n=20, p=P(late)), and Z-score distributions. Includes axis-labeled interactive charts.
5. **Regression Modeling** — Regression modeling with Pearson Correlation (r) KPI cards, R², MAE, RMSE, actual-vs-predicted analysis, and coefficient impact visuals.
6. **ETA Predictor** — Interactive form that uses the trained model to return expected delivery time and tier (EXPRESS / ON TIME / MODERATE / DELAYED).
7. **Dataset Explorer** — Browse original delivery records collected for analytical and predictive insights.

## Tech Stack

- **Backend**: Python · FastAPI · pandas · NumPy · SciPy · scikit-learn
- **Frontend**: Vanilla HTML / CSS / JavaScript · Chart.js
- **Design**: Modern Light dashboard UI with blue/orange/green/purple accents and subtle background imagery.

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
- **Pearson Correlation**: Real-time calculation of $r$ with visual scatter plot validation.
- **Normal Distribution**: Dynamic PDF modeling on `Delivery_Time_min` with shaded regions for operational outliers.
- **Binomial Distribution**: Models the frequency of "late" deliveries (X ≥ 45 min) in sample batches.
- **Regression Accuracy**: Typically achieves **R² ≈ 0.85–0.92** on the synthetic data.

---
*University Probability & Statistics + ML project.*
