"""Tool for predicting vehicle fuel consumption using the trained ML model."""

import joblib
import pandas as pd


from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_ROOT / "ml" / "fuel_prediction_model.joblib"
FEATURES_PATH = PROJECT_ROOT / "ml" / "model_features.joblib"


def predict_fuel_consumption(
    speed_kmh: float,
    vehicle_mileage_kmpl: float,
    acceleration_mps2: float,
    braking_mps2: float,
    distance_km: float,
    traffic_level: str,
    ac_usage: str,
    vehicle_load: str,
    road_type: str,
) -> dict:
    """Predict vehicle fuel consumption.

    Args:
        speed_kmh: Average vehicle speed in km/h.
        vehicle_mileage_kmpl: Vehicle mileage in km/L.
        acceleration_mps2: Average acceleration in m/s².
        braking_mps2: Average braking intensity in m/s².
        distance_km: Trip distance in kilometres.
        traffic_level: low, moderate, or heavy.
        ac_usage: low, moderate, or high.
        vehicle_load: light, normal, or heavy.
        road_type: highway, city, or mixed.

    Returns:
        Dictionary containing predicted fuel consumption
        and equivalent fuel efficiency.
    """

    # ---------------------------------------------
    # Validate numerical inputs
    # ---------------------------------------------

    if speed_kmh < 0:
        return {"error": "Speed cannot be negative."}

    if vehicle_mileage_kmpl <= 0:
        return {"error": "Vehicle mileage must be greater than 0 km/L."}

    if acceleration_mps2 < 0:
        return {"error": "Acceleration cannot be negative."}

    if braking_mps2 < 0:
        return {"error": "Braking intensity cannot be negative."}

    if distance_km <= 0:
        return {"error": "Distance must be greater than 0 km."}


    # ---------------------------------------------
    # Normalize categorical inputs
    # ---------------------------------------------

    traffic = traffic_level.strip().lower()
    ac = ac_usage.strip().lower()
    load = vehicle_load.strip().lower()
    road = road_type.strip().lower()


    # ---------------------------------------------
    # Validate categorical inputs
    # ---------------------------------------------

    if traffic not in {"low", "moderate", "heavy"}:
        return {
            "error": (
                "Traffic level must be low, moderate, or heavy."
            )
        }

    if ac not in {"low", "moderate", "high"}:
        return {
            "error": (
                "AC usage must be low, moderate, or high."
            )
        }

    if load not in {"light", "normal", "heavy"}:
        return {
            "error": (
                "Vehicle load must be light, normal, or heavy."
            )
        }

    if road not in {"highway", "city", "mixed"}:
        return {
            "error": (
                "Road type must be highway, city, or mixed."
            )
        }


    # ---------------------------------------------
    # Load trained model and feature list
    # ---------------------------------------------

    try:
        model = joblib.load(MODEL_PATH)

        feature_columns = joblib.load(
            FEATURES_PATH
        )

    except FileNotFoundError:
        return {
            "error": (
                "Trained fuel prediction model was not found. "
                "Run ml/train_models.py first."
            )
        }


    # ---------------------------------------------
    # Create input record
    # ---------------------------------------------

    input_data = pd.DataFrame(
        [
            {
                "speed_kmh": speed_kmh,
                "vehicle_mileage_kmpl": vehicle_mileage_kmpl,
                "acceleration_mps2": acceleration_mps2,
                "braking_mps2": braking_mps2,
                "distance_km": distance_km,

                "traffic_level": traffic,
                "ac_usage": ac,
                "vehicle_load": load,
                "road_type": road,
            }
        ]
    )


    # ---------------------------------------------
    # Apply the same encoding used during training
    # ---------------------------------------------

    input_data = pd.get_dummies(
        input_data,
        columns=[
            "traffic_level",
            "ac_usage",
            "vehicle_load",
            "road_type",
        ],
        dtype=int,
    )


    # Make sure the prediction input has exactly
    # the same columns and order as the training data.

    input_data = input_data.reindex(
        columns=feature_columns,
        fill_value=0,
    )


    # ---------------------------------------------
    # Generate prediction
    # ---------------------------------------------

    prediction = model.predict(input_data)[0]

    prediction = max(
        float(prediction),
        0.1,
    )


    # Convert L/100 km into km/L.

    predicted_kmpl = 100 / prediction


    # ---------------------------------------------
    # Return result
    # ---------------------------------------------

    return {
        "predicted_fuel_consumption_l_per_100km": round(
            prediction,
            3,
        ),

        "equivalent_fuel_efficiency_kmpl": round(
            predicted_kmpl,
            3,
        ),

        "input_speed_kmh": round(
            speed_kmh,
            2,
        ),

        "input_vehicle_mileage_kmpl": round(
            vehicle_mileage_kmpl,
            2,
        ),

        "distance_km": round(
            distance_km,
            2,
        ),

        "traffic_level": traffic,
        "ac_usage": ac,
        "vehicle_load": load,
        "road_type": road,

        "model": "Gradient Boosting Regressor",

        "note": (
            "Prediction is based on the project's current "
            "synthetic training dataset and should be treated "
            "as a prototype estimate, not a real-world "
            "vehicle measurement."
        ),
    }