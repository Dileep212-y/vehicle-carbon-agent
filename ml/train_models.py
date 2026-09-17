import joblib
import pandas as pd

from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# --------------------------------------------------
# Load preprocessed data
# --------------------------------------------------

X_train = pd.read_csv("ml/X_train.csv")
X_test = pd.read_csv("ml/X_test.csv")

y_train = pd.read_csv("ml/y_train.csv").squeeze("columns")
y_test = pd.read_csv("ml/y_test.csv").squeeze("columns")


# --------------------------------------------------
# Define candidate models
# --------------------------------------------------

models = {
    "Linear Regression": LinearRegression(),

    "Random Forest": RandomForestRegressor(
        n_estimators=200,
        random_state=42,
        n_jobs=-1,
    ),

    "Gradient Boosting": GradientBoostingRegressor(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=3,
        random_state=42,
    ),
}


results = []

best_model = None
best_model_name = None
best_rmse = float("inf")


# --------------------------------------------------
# Train and evaluate models
# --------------------------------------------------

print("Training and evaluating models...\n")


for name, model in models.items():

    print(f"Training: {name}")

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    mae = mean_absolute_error(
        y_test,
        predictions,
    )

    rmse = mean_squared_error(
        y_test,
        predictions,
    ) ** 0.5

    r2 = r2_score(
        y_test,
        predictions,
    )

    results.append(
        {
            "model": name,
            "MAE": mae,
            "RMSE": rmse,
            "R2": r2,
        }
    )

    print(f"  MAE : {mae:.4f}")
    print(f"  RMSE: {rmse:.4f}")
    print(f"  R2  : {r2:.4f}")
    print()

    # Select model using lowest RMSE.
    if rmse < best_rmse:
        best_rmse = rmse
        best_model = model
        best_model_name = name


# --------------------------------------------------
# Save comparison results
# --------------------------------------------------

results_df = pd.DataFrame(results)

results_df = results_df.sort_values(
    by="RMSE",
    ascending=True,
)

results_df.to_csv(
    "ml/model_comparison.csv",
    index=False,
)


# --------------------------------------------------
# Save the best model
# --------------------------------------------------

joblib.dump(
    best_model,
    "ml/fuel_prediction_model.joblib",
)


# --------------------------------------------------
# Save feature names
# --------------------------------------------------

joblib.dump(
    list(X_train.columns),
    "ml/model_features.joblib",
)


# --------------------------------------------------
# Display final results
# --------------------------------------------------

print("=" * 60)
print("MODEL COMPARISON")
print("=" * 60)

print(
    results_df.to_string(
        index=False,
        float_format=lambda x: f"{x:.4f}",
    )
)

print()
print(f"Best model based on RMSE: {best_model_name}")

print()
print("Saved model:")
print("ml/fuel_prediction_model.joblib")

print()
print("Saved feature list:")
print("ml/model_features.joblib")