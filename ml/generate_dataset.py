import random

import pandas as pd


# Make the generated dataset reproducible.
random.seed(42)


rows = []


for _ in range(3000):

    # -----------------------------
    # Vehicle characteristics
    # -----------------------------

    vehicle_mileage = random.uniform(12, 22)


    # -----------------------------
    # Driving conditions
    # -----------------------------

    speed = random.uniform(20, 120)

    acceleration = random.uniform(0, 4)

    braking = random.uniform(0, 4)

    distance = random.uniform(5, 300)


    # -----------------------------
    # Environmental / usage factors
    # -----------------------------

    traffic = random.choice(
        [
            "low",
            "moderate",
            "heavy",
        ]
    )

    ac_usage = random.choice(
        [
            "low",
            "moderate",
            "high",
        ]
    )

    vehicle_load = random.choice(
        [
            "light",
            "normal",
            "heavy",
        ]
    )

    road_type = random.choice(
        [
            "highway",
            "city",
            "mixed",
        ]
    )


    # -----------------------------
    # Base fuel consumption
    # -----------------------------

    # Convert vehicle mileage from km/L
    # into litres per 100 km.

    base_consumption = 100 / vehicle_mileage


    # -----------------------------
    # Speed effect
    # -----------------------------

    speed_effect = 0

    if speed > 90:
        speed_effect += (speed - 90) * 0.015


    # -----------------------------
    # Driving behavior effects
    # -----------------------------

    acceleration_effect = acceleration * 0.35

    braking_effect = braking * 0.20


    # -----------------------------
    # Traffic effect
    # -----------------------------

    traffic_effect = {
        "low": 0.0,
        "moderate": 0.8,
        "heavy": 1.8,
    }[traffic]


    # -----------------------------
    # AC usage effect
    # -----------------------------

    ac_effect = {
        "low": 0.0,
        "moderate": 0.4,
        "high": 0.9,
    }[ac_usage]


    # -----------------------------
    # Vehicle load effect
    # -----------------------------

    load_effect = {
        "light": -0.2,
        "normal": 0.0,
        "heavy": 0.7,
    }[vehicle_load]


    # -----------------------------
    # Road type effect
    # -----------------------------

    road_effect = {
        "highway": -0.5,
        "city": 1.2,
        "mixed": 0.4,
    }[road_type]


    # -----------------------------
    # Final fuel consumption
    # -----------------------------

    fuel_consumption = (
        base_consumption
        + speed_effect
        + acceleration_effect
        + braking_effect
        + traffic_effect
        + ac_effect
        + load_effect
        + road_effect
        + random.gauss(0, 0.15)
    )


    # Prevent unrealistic negative values.
    fuel_consumption = max(
        fuel_consumption,
        2.0,
    )


    # -----------------------------
    # Store one dataset record
    # -----------------------------

    rows.append(
        {
            "speed_kmh": round(speed, 2),

            "vehicle_mileage_kmpl": round(
                vehicle_mileage,
                2,
            ),

            "acceleration_mps2": round(
                acceleration,
                2,
            ),

            "braking_mps2": round(
                braking,
                2,
            ),

            "distance_km": round(
                distance,
                2,
            ),

            "traffic_level": traffic,

            "ac_usage": ac_usage,

            "vehicle_load": vehicle_load,

            "road_type": road_type,

            "fuel_consumption_l_per_100km": round(
                fuel_consumption,
                2,
            ),
        }
    )


# -----------------------------
# Create DataFrame
# -----------------------------

df = pd.DataFrame(rows)


# -----------------------------
# Save dataset
# -----------------------------

df.to_csv(
    "ml/fuel_consumption_dataset.csv",
    index=False,
)


# -----------------------------
# Display information
# -----------------------------

print("Dataset created successfully.")

print(f"Rows: {len(df)}")

print(f"Columns: {len(df.columns)}")

print("\nColumns:")

for column in df.columns:
    print(f"- {column}")

print("\nFirst 5 records:")

print(df.head().to_string(index=False))