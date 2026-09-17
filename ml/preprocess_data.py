import pandas as pd

from sklearn.model_selection import train_test_split


DATA_PATH = "ml/fuel_consumption_dataset.csv"

df = pd.read_csv(DATA_PATH)

print("Dataset loaded successfully.")
print(f"Rows: {len(df)}")
print(f"Columns: {len(df.columns)}")

print("\nColumns:")
print(list(df.columns))

# Separate features and target.
target_column = "fuel_consumption_l_per_100km"

X = df.drop(columns=[target_column])
y = df[target_column]

# Convert categorical columns into numerical values.
X = pd.get_dummies(
    X,
    columns=[
        "traffic_level",
        "ac_usage",
        "vehicle_load",
        "road_type",
    ],
    dtype=int,
)

# Split into training and testing data.
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
)

# Save prepared data.
X_train.to_csv("ml/X_train.csv", index=False)
X_test.to_csv("ml/X_test.csv", index=False)
y_train.to_csv("ml/y_train.csv", index=False)
y_test.to_csv("ml/y_test.csv", index=False)

print("\nPreprocessing completed successfully.")

print(f"Training samples: {len(X_train)}")
print(f"Testing samples: {len(X_test)}")
print(f"Number of features after encoding: {X_train.shape[1]}")

print("\nFeature columns:")
for column in X_train.columns:
    print(f"- {column}")