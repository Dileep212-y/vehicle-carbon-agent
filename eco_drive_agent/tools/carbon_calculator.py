"""Tools for calculating vehicle fuel consumption and carbon emissions."""

# Approximate tailpipe CO2 emission factors.
# These are configurable placeholders for the prototype.
EMISSION_FACTORS = {
    "petrol": 2.31,
    "gasoline": 2.31,
    "diesel": 2.68,
    "cng": 2.75,
    "lpg": 1.51,
}


def calculate_carbon_emission(
    distance_km: float,
    mileage_km_per_litre: float,
    fuel_type: str,
    fuel_price_per_litre: float = 0.0,
) -> dict:
    """Calculate fuel consumption, CO2 emissions and fuel cost.

    Args:
        distance_km: Trip distance in kilometres.
        mileage_km_per_litre: Vehicle mileage in km per litre.
        fuel_type: Fuel type such as petrol, diesel, cng or lpg.
        fuel_price_per_litre: Fuel price in local currency per litre.

    Returns:
        A dictionary containing fuel consumption, CO2 emissions,
        fuel cost and related metrics.
    """

    if distance_km <= 0:
        return {"error": "Distance must be greater than 0 km."}

    if mileage_km_per_litre <= 0:
        return {"error": "Mileage must be greater than 0 km/L."}

    normalized_fuel = fuel_type.strip().lower()

    if normalized_fuel not in EMISSION_FACTORS:
        return {
            "error": (
                f"Unsupported fuel type '{fuel_type}'. "
                f"Supported types: {', '.join(EMISSION_FACTORS.keys())}."
            )
        }

    emission_factor = EMISSION_FACTORS[normalized_fuel]

    fuel_consumed_litres = distance_km / mileage_km_per_litre

    co2_kg = fuel_consumed_litres * emission_factor

    fuel_cost = fuel_consumed_litres * max(fuel_price_per_litre, 0)

    co2_per_km = co2_kg / distance_km

    cost_per_km = fuel_cost / distance_km

    return {
        "distance_km": round(distance_km, 2),
        "mileage_km_per_litre": round(mileage_km_per_litre, 2),
        "fuel_type": normalized_fuel,
        "emission_factor_kg_co2_per_litre": emission_factor,
        "fuel_consumed_litres": round(fuel_consumed_litres, 3),
        "co2_emissions_kg": round(co2_kg, 3),
        "co2_per_km": round(co2_per_km, 4),
        "fuel_price_per_litre": round(max(fuel_price_per_litre, 0), 2),
        "fuel_cost": round(fuel_cost, 2),
        "cost_per_km": round(cost_per_km, 2),
    }