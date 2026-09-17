"""Tool for calculating trip fuel, cost and carbon impact."""


EMISSION_FACTORS = {
    "petrol": 2.31,
    "gasoline": 2.31,
    "diesel": 2.68,
    "cng": 2.75,
    "lpg": 1.51,
}


def calculate_trip_impact(
    distance_km: float,
    predicted_fuel_consumption_l_per_100km: float,
    fuel_type: str,
    fuel_price_per_litre: float,
) -> dict:
    """Calculate fuel, cost and CO2 impact for a trip.

    Args:
        distance_km: Trip distance in kilometres.
        predicted_fuel_consumption_l_per_100km:
            Predicted fuel consumption in litres per 100 km.
        fuel_type: Petrol, diesel, CNG or LPG.
        fuel_price_per_litre: Fuel price per litre.

    Returns:
        Dictionary containing estimated fuel use, cost and CO2.
    """

    # -----------------------------------------
    # Validate numerical inputs
    # -----------------------------------------

    if distance_km <= 0:
        return {
            "error": "Distance must be greater than 0 km."
        }

    if predicted_fuel_consumption_l_per_100km <= 0:
        return {
            "error": (
                "Predicted fuel consumption must be "
                "greater than 0 L/100 km."
            )
        }

    if fuel_price_per_litre < 0:
        return {
            "error": "Fuel price cannot be negative."
        }


    # -----------------------------------------
    # Normalize fuel type
    # -----------------------------------------

    fuel = fuel_type.strip().lower()


    if fuel not in EMISSION_FACTORS:
        return {
            "error": (
                f"Unsupported fuel type '{fuel_type}'. "
                "Supported types: petrol, diesel, cng, lpg."
            )
        }


    emission_factor = EMISSION_FACTORS[fuel]


    # -----------------------------------------
    # Calculate fuel consumed
    # -----------------------------------------

    fuel_consumed_litres = (
        distance_km
        * predicted_fuel_consumption_l_per_100km
        / 100
    )


    # -----------------------------------------
    # Calculate fuel cost
    # -----------------------------------------

    fuel_cost = (
        fuel_consumed_litres
        * fuel_price_per_litre
    )


    # -----------------------------------------
    # Calculate CO2 emissions
    # -----------------------------------------

    co2_emissions_kg = (
        fuel_consumed_litres
        * emission_factor
    )


    # -----------------------------------------
    # Calculate per-kilometre metrics
    # -----------------------------------------

    fuel_per_km = (
        fuel_consumed_litres
        / distance_km
    )

    cost_per_km = (
        fuel_cost
        / distance_km
    )

    co2_per_km = (
        co2_emissions_kg
        / distance_km
    )


    # -----------------------------------------
    # Return results
    # -----------------------------------------

    return {
        "distance_km": round(
            distance_km,
            2,
        ),

        "predicted_fuel_consumption_l_per_100km": round(
            predicted_fuel_consumption_l_per_100km,
            3,
        ),

        "fuel_type": fuel,

        "emission_factor_kg_co2_per_litre": emission_factor,

        "fuel_price_per_litre": round(
            fuel_price_per_litre,
            2,
        ),

        "estimated_fuel_consumed_litres": round(
            fuel_consumed_litres,
            3,
        ),

        "estimated_fuel_cost": round(
            fuel_cost,
            2,
        ),

        "estimated_co2_emissions_kg": round(
            co2_emissions_kg,
            3,
        ),

        "fuel_consumed_per_km": round(
            fuel_per_km,
            4,
        ),

        "cost_per_km": round(
            cost_per_km,
            2,
        ),

        "co2_per_km": round(
            co2_per_km,
            4,
        ),

        "note": (
            "CO2 values are prototype tailpipe estimates "
            "based on the configured emission factor."
        ),
    }