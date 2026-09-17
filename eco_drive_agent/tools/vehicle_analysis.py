"""Tools for analyzing vehicle efficiency."""


def analyze_vehicle_efficiency(
    mileage_km_per_litre: float,
    fuel_type: str,
    vehicle_age_years: float = 0,
) -> dict:
    """Analyze the basic fuel efficiency of a vehicle.

    Args:
        mileage_km_per_litre: Current vehicle mileage in km/L.
        fuel_type: Vehicle fuel type.
        vehicle_age_years: Approximate vehicle age in years.

    Returns:
        Dictionary containing an efficiency classification and score.
    """

    if mileage_km_per_litre <= 0:
        return {"error": "Mileage must be greater than 0 km/L."}

    fuel = fuel_type.strip().lower()

    # Prototype thresholds.
    # These will be refined later using vehicle-class-specific data.
    if mileage_km_per_litre >= 20:
        efficiency_level = "High"
        efficiency_score = 90
    elif mileage_km_per_litre >= 15:
        efficiency_level = "Moderate"
        efficiency_score = 75
    elif mileage_km_per_litre >= 10:
        efficiency_level = "Low"
        efficiency_score = 55
    else:
        efficiency_level = "Very Low"
        efficiency_score = 35

    observations = []

    if mileage_km_per_litre < 15:
        observations.append(
            "Current mileage indicates potential for fuel-efficiency improvement."
        )

    if vehicle_age_years >= 8:
        observations.append(
            "Vehicle age may justify checking maintenance-related factors."
        )

    if not observations:
        observations.append(
            "No major efficiency concern is indicated from mileage alone."
        )

    return {
        "fuel_type": fuel,
        "mileage_km_per_litre": round(mileage_km_per_litre, 2),
        "vehicle_age_years": round(max(vehicle_age_years, 0), 1),
        "efficiency_level": efficiency_level,
        "efficiency_score": efficiency_score,
        "observations": observations,
    }