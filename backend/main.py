"""
Food Delivery Time Prediction System — FastAPI Backend
Probability & Statistics + Machine Learning project.

Variables:
  Order_ID                — display only (NOT used in analysis/modeling)
  Distance_km             — numeric
  Weather                 — Clear, Rainy, Snowy, Foggy, Windy
  Traffic_Level           — Low, Medium, High
  Time_of_Day             — Morning, Afternoon, Evening, Night
  Vehicle_Type            — Bike, Scooter, Car
  Preparation_Time_min    — numeric
  Courier_Experience_yrs  — numeric
  Delivery_Time_min       — TARGET (numeric)
"""
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from scipy import stats
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import math
from typing import List, Optional

class NumpyEncoder:
    @staticmethod
    def encode(obj):
        if isinstance(obj, (np.integer, np.int64, np.int32)):
            return int(obj)
        if isinstance(obj, (np.floating, np.float64, np.float32)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        raise TypeError(f"Type {type(obj)} not serializable")

app = FastAPI(
    title="Food Delivery Time Prediction API",
    json_encoders={
        np.integer: lambda v: int(v),
        np.int64: lambda v: int(v),
        np.int32: lambda v: int(v),
        np.floating: lambda v: float(v),
        np.float64: lambda v: float(v),
        np.float32: lambda v: float(v),
        np.ndarray: lambda v: v.tolist(),
    }
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

# ---------------------------------------------------------------------------
# Synthetic dataset generator (realistic relationships)
# ---------------------------------------------------------------------------
WEATHER       = ["Clear", "Rainy", "Snowy", "Foggy", "Windy"]
TRAFFIC       = ["Low", "Medium", "High"]
TIME_OF_DAY   = ["Morning", "Afternoon", "Evening", "Night"]
VEHICLE       = ["Bike", "Scooter", "Car"]

import os

# Full dataset (with Order_ID, kept ONLY for display)
dataset_path = os.path.join(os.path.dirname(__file__), "dataset.csv")
df_full = pd.read_csv(dataset_path)
# Drop rows with missing values
df_full = df_full.dropna()
# Working dataset — Order_ID dropped: never used in stats / probability / ML
df = df_full.drop("Order_ID", axis=1).copy()
print(f"✅ Dataset ready: {len(df_full)} orders.")

NUMERIC = ["Distance_km", "Preparation_Time_min", "Courier_Experience_yrs", "Delivery_Time_min"]
CATEG   = ["Weather", "Traffic_Level", "Time_of_Day", "Vehicle_Type"]

# ---------------------------------------------------------------------------
# Filters
# ---------------------------------------------------------------------------
def split_csv(values):
    if values and len(values) == 1 and "," in values[0]:
        return [v.strip() for v in values[0].split(",")]
    return values

def get_filtered(weather=None, traffic=None, tod=None, vehicle=None,
                 dist_min=None, dist_max=None, exp_min=None, exp_max=None):
    f = df.copy()
    weather = split_csv(weather); traffic = split_csv(traffic)
    tod = split_csv(tod); vehicle = split_csv(vehicle)
    if weather: f = f[f["Weather"].isin(weather)]
    if traffic: f = f[f["Traffic_Level"].isin(traffic)]
    if tod:     f = f[f["Time_of_Day"].isin(tod)]
    if vehicle: f = f[f["Vehicle_Type"].isin(vehicle)]
    if dist_min is not None: f = f[f["Distance_km"] >= dist_min]
    if dist_max is not None: f = f[f["Distance_km"] <= dist_max]
    if exp_min is not None:  f = f[f["Courier_Experience_yrs"] >= exp_min]
    if exp_max is not None:  f = f[f["Courier_Experience_yrs"] <= exp_max]
    return f

def common_query(weather, traffic, tod, vehicle, dist_min, dist_max, exp_min, exp_max):
    return get_filtered(weather, traffic, tod, vehicle, dist_min, dist_max, exp_min, exp_max)

# ---------------------------------------------------------------------------
# /api/filters
# ---------------------------------------------------------------------------
@app.get("/api/filters")
def filters():
    return {
        "weather":  WEATHER,
        "traffic":  TRAFFIC,
        "time_of_day": TIME_OF_DAY,
        "vehicle":  VEHICLE,
        "dist_min": float(df["Distance_km"].min()),
        "dist_max": float(df["Distance_km"].max()),
        "exp_min":  float(df["Courier_Experience_yrs"].min()),
        "exp_max":  float(df["Courier_Experience_yrs"].max()),
    }

# ---------------------------------------------------------------------------
# /api/dashboard
# ---------------------------------------------------------------------------
@app.get("/api/dashboard")
def dashboard(weather: Optional[List[str]] = Query(None),
              traffic: Optional[List[str]] = Query(None),
              tod: Optional[List[str]] = Query(None),
              vehicle: Optional[List[str]] = Query(None),
              dist_min: Optional[float] = Query(None), dist_max: Optional[float] = Query(None),
              exp_min: Optional[float] = Query(None), exp_max: Optional[float] = Query(None)):
    f = common_query(weather, traffic, tod, vehicle, dist_min, dist_max, exp_min, exp_max)
    if f.empty: return {"error": "No orders match the current filters."}

    # Top 10 longest deliveries (display order_id from full dataset by index)
    top10_idx = f.nlargest(10, "Delivery_Time_min").index
    top10 = []
    for i in top10_idx:
        top10.append({
            "order_id": int(df_full.loc[i, "Order_ID"]),
            "delivery": float(f.loc[i, "Delivery_Time_min"]),
            "distance": float(f.loc[i, "Distance_km"]),
            "weather":  str(f.loc[i, "Weather"]),
        })

    avg_by_weather = f.groupby("Weather")["Delivery_Time_min"].mean().reset_index()
    avg_by_weather = [{"label": r["Weather"], "avg": round(float(r["Delivery_Time_min"]), 2)}
                      for _, r in avg_by_weather.iterrows()]

    return {
        "kpis": {
            "total_orders": int(len(f)),
            "avg_delivery": round(float(f["Delivery_Time_min"].mean()), 1),
            "max_delivery": round(float(f["Delivery_Time_min"].max()), 1),
            "min_delivery": round(float(f["Delivery_Time_min"].min()), 1),
            "avg_distance": round(float(f["Distance_km"].mean()), 2),
            "common_vehicle": f["Vehicle_Type"].mode()[0],
        },
        "top10": top10,
        "weather_dist": [{"label": k, "count": int(v)} for k, v in f["Weather"].value_counts().items()],
        "traffic_dist": [{"label": k, "count": int(v)} for k, v in f["Traffic_Level"].value_counts().items()],
        "vehicle_dist": [{"label": k, "count": int(v)} for k, v in f["Vehicle_Type"].value_counts().items()],
        "tod_dist":     [{"label": k, "count": int(v)} for k, v in f["Time_of_Day"].value_counts().items()],
        "avg_by_weather": avg_by_weather,
    }

# ---------------------------------------------------------------------------
# /api/graphical
# ---------------------------------------------------------------------------
@app.get("/api/graphical")
def graphical(weather: Optional[List[str]] = Query(None),
              traffic: Optional[List[str]] = Query(None),
              tod: Optional[List[str]] = Query(None),
              vehicle: Optional[List[str]] = Query(None),
              dist_min: Optional[float] = Query(None), dist_max: Optional[float] = Query(None),
              exp_min: Optional[float] = Query(None), exp_max: Optional[float] = Query(None)):
    f = common_query(weather, traffic, tod, vehicle, dist_min, dist_max, exp_min, exp_max)
    if f.empty: return {"error": "No data"}

    # Histogram of Delivery_Time_min + normal overlay
    series = f["Delivery_Time_min"].dropna()
    counts, bins = np.histogram(series, bins=30)
    centers = (bins[:-1] + bins[1:]) / 2
    mu, std = float(series.mean()), float(series.std())
    x = np.linspace(series.min(), series.max(), 100)
    y_scaled = stats.norm.pdf(x, mu, std) * len(series) * (bins[1] - bins[0])

    histogram = {"labels": centers.tolist(), "values": counts.tolist(),
                 "normal_x": x.tolist(), "normal_y": y_scaled.tolist()}

    # Boxplot — Delivery_Time_min by Traffic_Level
    boxplot = []
    for cat in TRAFFIC:
        s = f[f["Traffic_Level"] == cat]["Delivery_Time_min"].dropna()
        if not s.empty:
            boxplot.append({
                "label": cat, "min": float(s.min()), "q1": float(s.quantile(0.25)),
                "median": float(s.median()), "q3": float(s.quantile(0.75)), "max": float(s.max())
            })

    # Scatter Distance vs Delivery
    samp = f.sample(min(500, len(f)), random_state=1)
    scatter_dist = [{"x": float(r["Distance_km"]), "y": float(r["Delivery_Time_min"]),
                     "weather": r["Weather"]} for _, r in samp.iterrows()]
    scatter_prep = [{"x": float(r["Preparation_Time_min"]), "y": float(r["Delivery_Time_min"])}
                    for _, r in samp.iterrows()]

    # Vehicle bar
    vehicle_avg = f.groupby("Vehicle_Type")["Delivery_Time_min"].mean().reset_index()
    vehicle_avg = [{"label": r["Vehicle_Type"], "avg": round(float(r["Delivery_Time_min"]), 2)}
                   for _, r in vehicle_avg.iterrows()]

    # Time of day grouped means
    tod_avg = f.groupby("Time_of_Day")["Delivery_Time_min"].mean().reset_index()
    tod_avg = [{"label": r["Time_of_Day"], "avg": round(float(r["Delivery_Time_min"]), 2)}
               for _, r in tod_avg.iterrows()]

    return {"histogram": histogram, "boxplot": boxplot,
            "scatter_distance": scatter_dist, "scatter_prep": scatter_prep,
            "vehicle_avg": vehicle_avg, "tod_avg": tod_avg}

# ---------------------------------------------------------------------------
# /api/stats
# ---------------------------------------------------------------------------
@app.get("/api/stats")
def descriptive(weather: Optional[List[str]] = Query(None),
                traffic: Optional[List[str]] = Query(None),
                tod: Optional[List[str]] = Query(None),
                vehicle: Optional[List[str]] = Query(None),
                dist_min: Optional[float] = Query(None), dist_max: Optional[float] = Query(None),
                exp_min: Optional[float] = Query(None), exp_max: Optional[float] = Query(None)):
    f = common_query(weather, traffic, tod, vehicle, dist_min, dist_max, exp_min, exp_max)
    if f.empty: return {"error": "Insufficient data"}

    desc = []
    for v in NUMERIC:
        s = f[v].dropna()
        if s.empty: continue
        mean, std, n = float(s.mean()), float(s.std()), len(s)
        mode = float(s.mode().iloc[0]) if not s.mode().empty else None
        desc.append({"variable": v, "count": n,
                     "mean": round(mean, 3), "median": round(float(s.median()), 3),
                     "mode": round(mode, 3) if mode is not None else None,
                     "std": round(std, 3), "variance": round(float(s.var()), 3),
                     "cvar": round((std / mean) * 100, 2) if mean else 0,
                     "min": round(float(s.min()), 2), "max": round(float(s.max()), 2),
                     "skewness": round(float(s.skew()), 3)})

    skew_kurt = [{"attr": r["variable"], "skewness": r["skewness"]} for r in desc]

    p_labels = [5, 10, 25, 50, 75, 90, 95, 99]
    s = f["Delivery_Time_min"].dropna()
    percentiles = [{"label": f"P{p}", "value": round(float(s.quantile(p / 100)), 2)} for p in p_labels]

    # Group means table — Delivery_Time_min by each categorical variable
    groups = []
    for cat in CATEG:
        for k, sub in f.groupby(cat):
            groups.append({"variable": cat, "group": k,
                           "n": int(len(sub)),
                           "mean": round(float(sub["Delivery_Time_min"].mean()), 2),
                           "std":  round(float(sub["Delivery_Time_min"].std() or 0), 2)})

    return {"descriptive": desc, "skew_kurt": skew_kurt,
            "percentiles": percentiles, "group_means": groups}

# ---------------------------------------------------------------------------
# /api/probability
# ---------------------------------------------------------------------------
@app.get("/api/probability")
def probability(weather: Optional[List[str]] = Query(None),
                traffic: Optional[List[str]] = Query(None),
                tod: Optional[List[str]] = Query(None),
                vehicle: Optional[List[str]] = Query(None),
                dist_min: Optional[float] = Query(None), dist_max: Optional[float] = Query(None),
                exp_min: Optional[float] = Query(None), exp_max: Optional[float] = Query(None)):
    f = common_query(weather, traffic, tod, vehicle, dist_min, dist_max, exp_min, exp_max)
    if f.empty or len(f) < 5: return {"error": "Not enough data"}

    delivery = f["Delivery_Time_min"].dropna()
    mu, std = float(delivery.mean()), float(delivery.std())
    x = np.linspace(delivery.min() - 5, delivery.max() + 5, 120)
    pdf = stats.norm.pdf(x, mu, std)
    DELAY = float(delivery.quantile(0.75))
    FAST = float(delivery.quantile(0.25))
    delay_mask = x >= DELAY
    fast_mask  = x <= FAST
    normal = {"x": x.tolist(), "y": pdf.tolist(), "mean": mu, "std": std,
              "shade_late_x": x[delay_mask].tolist(), "shade_late_y": pdf[delay_mask].tolist(),
              "shade_fast_x": x[fast_mask].tolist(), "shade_fast_y": pdf[fast_mask].tolist(),
              "delay_threshold": round(DELAY, 2), "fast_threshold": round(FAST, 2)}

    # Binomial — n=20 deliveries, p=P(late)
    p_late = float((delivery > DELAY).mean())
    n_b = 20
    k = np.arange(0, n_b + 1)
    binom_pmf = stats.binom.pmf(k, n_b, p_late)
    binomial = {"k": k.tolist(), "pmf": binom_pmf.tolist(),
                "expected": float(n_b * p_late), "p": p_late, "n": n_b}

    # Z-scores
    zs = stats.zscore(delivery)
    zc, zb = np.histogram(zs, bins=30)
    zcenters = (zb[:-1] + zb[1:]) / 2
    zscore = {"labels": zcenters.tolist(), "values": zc.tolist()}

    # ECDF vs theoretical
    sorted_d = np.sort(delivery)
    emp_y = np.arange(1, len(sorted_d) + 1) / len(sorted_d)
    theo_y = stats.norm.cdf(sorted_d, mu, std)
    cdf = {"empirical_x": sorted_d.tolist(), "empirical_y": emp_y.tolist(),
           "theoretical_x": sorted_d.tolist(), "theoretical_y": theo_y.tolist()}


    return {"normal": normal, "binomial": binomial,
            "zscore": zscore, "cdf": cdf}

# ---------------------------------------------------------------------------
# /api/regression
# ---------------------------------------------------------------------------
NUM_FEATURES = ["Distance_km", "Preparation_Time_min", "Courier_Experience_yrs"]

def build_design_matrix(frame: pd.DataFrame):
    X = frame[NUM_FEATURES].copy()
    X = pd.concat([
        X,
        pd.get_dummies(frame["Weather"],       prefix="W", drop_first=True),
        pd.get_dummies(frame["Traffic_Level"], prefix="T", drop_first=True),
        pd.get_dummies(frame["Time_of_Day"],   prefix="D", drop_first=True),
        pd.get_dummies(frame["Vehicle_Type"],  prefix="V", drop_first=True),
    ], axis=1).astype(float)
    return X

@app.get("/api/regression")
def regression(weather: Optional[List[str]] = Query(None),
               traffic: Optional[List[str]] = Query(None),
               tod: Optional[List[str]] = Query(None),
               vehicle: Optional[List[str]] = Query(None),
               dist_min: Optional[float] = Query(None), dist_max: Optional[float] = Query(None),
               exp_min: Optional[float] = Query(None), exp_max: Optional[float] = Query(None)):
    f = common_query(weather, traffic, tod, vehicle, dist_min, dist_max, exp_min, exp_max)
    if len(f) < 30: return {"error": "Insufficient data"}

    X = build_design_matrix(f)
    y = f["Delivery_Time_min"].values
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = LinearRegression().fit(X_train, y_train)
    y_pred = model.predict(X_test)

    metrics = {"train_size": int(len(X_train))}

    actual_vs_pred = [{"actual": float(a), "predicted": float(p)}
                      for a, p in zip(y_test[:400], y_pred[:400])]

    coefficients = sorted(
        [{"feature": c, "value": float(v)} for c, v in zip(X.columns, model.coef_)],
        key=lambda d: d["value"])

    residuals = y_test - y_pred
    rc, rb = np.histogram(residuals, bins=30)
    res_centers = (rb[:-1] + rb[1:]) / 2
    residuals_hist = {"labels": res_centers.tolist(), "values": rc.tolist()}

    equation = {"intercept": float(model.intercept_),
                "terms": [{"feature": c, "coef": float(v)} for c, v in zip(X.columns, model.coef_)]}

    feature_ranges = {f_: {"min": float(df[f_].min()), "max": float(df[f_].max()),
                           "mean": float(df[f_].mean())} for f_ in NUM_FEATURES}

    raw_data = {
        "Delivery_Time_min": f["Delivery_Time_min"].tolist(),
        "Distance_km": f["Distance_km"].tolist(),
        "Preparation_Time_min": f["Preparation_Time_min"].tolist(),
        "Traffic_Level": f["Traffic_Level"].tolist(),
        "Weather": f["Weather"].tolist()
    }

    return {"metrics": metrics, "actual_vs_pred": actual_vs_pred,
            "coefficients": coefficients, "residuals_hist": residuals_hist,
            "equation": equation, "feature_ranges": feature_ranges,
            "categories": {"weather": WEATHER, "traffic": TRAFFIC,
                           "tod": TIME_OF_DAY, "vehicle": VEHICLE},
            "raw_data": raw_data}

# ---------------------------------------------------------------------------
# /api/predict
# ---------------------------------------------------------------------------
class PredictionRequest(BaseModel):
    Distance_km: float
    Preparation_Time_min: float
    Courier_Experience_yrs: float
    Weather: str
    Traffic_Level: str
    Time_of_Day: str
    Vehicle_Type: str

# train once on full df
_X_full = build_design_matrix(df)
_y_full = df["Delivery_Time_min"].values
_MODEL  = LinearRegression().fit(_X_full, _y_full)
_FEATURE_COLUMNS = list(_X_full.columns)

@app.post("/api/predict")
def predict(body: PredictionRequest):
    row_dict = {
        "Distance_km": body.Distance_km,
        "Preparation_Time_min": body.Preparation_Time_min,
        "Courier_Experience_yrs": body.Courier_Experience_yrs,
        f"W_{body.Weather}": 1.0,
        f"T_{body.Traffic_Level}": 1.0,
        f"D_{body.Time_of_Day}": 1.0,
        f"V_{body.Vehicle_Type}": 1.0,
    }
    X = pd.DataFrame([row_dict]).reindex(columns=_FEATURE_COLUMNS, fill_value=0.0)
    pred = float(_MODEL.predict(X)[0])

    q1 = df["Delivery_Time_min"].quantile(0.25)
    q2 = df["Delivery_Time_min"].quantile(0.50)
    q3 = df["Delivery_Time_min"].quantile(0.75)

    if pred <= q1:
        tier, color = "EXPRESS",   "#2ee6a4"
    elif pred <= q2:
        tier, color = "ON TIME",   "#18e2ff"
    elif pred <= q3:
        tier, color = "MODERATE",  "#f5c451"
    else:
        tier, color = "DELAYED",   "#ff4d5e"

    return {"predicted": round(pred, 1), "tier": tier, "color": color,
            "thresholds": {"q1": round(float(q1), 1), "q2": round(float(q2), 1), "q3": round(float(q3), 1)}}

# ---------------------------------------------------------------------------
# /api/dataset  (Order_ID shown for display only)
# ---------------------------------------------------------------------------
@app.get("/api/dataset")
def dataset(weather: Optional[List[str]] = Query(None),
            traffic: Optional[List[str]] = Query(None),
            tod: Optional[List[str]] = Query(None),
            vehicle: Optional[List[str]] = Query(None),
            dist_min: Optional[float] = Query(None), dist_max: Optional[float] = Query(None),
            exp_min: Optional[float] = Query(None), exp_max: Optional[float] = Query(None)):
    f = common_query(weather, traffic, tod, vehicle, dist_min, dist_max, exp_min, exp_max)
    if f.empty: return {"error": "No orders match the current filters."}

    summary = {"total_orders": int(len(f)),
               "avg_delivery": round(float(f["Delivery_Time_min"].mean()), 2),
               "avg_distance": round(float(f["Distance_km"].mean()), 2),
               "avg_prep":     round(float(f["Preparation_Time_min"].mean()), 2),
               "avg_experience": round(float(f["Courier_Experience_yrs"].mean()), 2),
               "common_weather": str(f["Weather"].mode()[0]),
               "common_traffic": str(f["Traffic_Level"].mode()[0]),
               "common_vehicle": str(f["Vehicle_Type"].mode()[0])}

    # Attach Order_ID from the full frame for display only
    sample = f.head(500).copy()
    sample.insert(0, "Order_ID", df_full.loc[sample.index, "Order_ID"].values)
    rows = []
    for _, row in sample.iterrows():
        row_dict = {}
        for col, val in row.items():
            if isinstance(val, (np.integer, np.int64)):
                row_dict[col] = int(val)
            elif isinstance(val, (np.floating, np.float64)):
                row_dict[col] = float(val)
            else:
                row_dict[col] = val
        rows.append(row_dict)
    return {"summary": summary, "rows": rows, "total_shown": len(rows)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
