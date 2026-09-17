"""Tools for comparing routes for fuel efficiency and carbon reduction."""


def compare_routes(
    route_a_distance_km: float,
    route_a_traffic_level: str,
    route_b_distance_km: float,
    route_b_traffic_level: str,
    mileage_km_per_litre: float,
    fuel_type: str,
    fuel_price_per_litre: float,
) -> dict:
    """Compare two routes and estimate fuel, cost and CO2."""

    if route_a_distance_km <= 0 or route_b_distance_km <= 0:
        return {"error": "Both route distances must be greater than 0 km."}

    if mileage_km_per_litre <= 0:
        return {"error": "Mileage must be greater than 0 km/L."}

    if fuel_price_per_litre < 0:
        return {"error": "Fuel price cannot be negative."}

    traffic_a = route_a_traffic_level.strip().lower()
    traffic_b = route_b_traffic_level.strip().lower()
    fuel = fuel_type.strip().lower()

    emission_factors = {
        "petrol": 2.31,
        "gasoline": 2.31,
        "diesel": 2.68,
        "cng": 2.75,
        "lpg": 1.51,
    }

    if fuel not in emission_factors:
        return {
            "error": (
                f"Unsupported fuel type '{fuel_type}'. "
                "Supported types: petrol, diesel, cng, lpg."
            )
        }

    # Prototype traffic adjustment.
    traffic_factor = {
        "low": 1.00,
        "moderate": 1.10,
        "heavy": 1.25,
    }

    if traffic_a not in traffic_factor or traffic_b not in traffic_factor:
        return {
            "error": "Traffic level must be low, moderate, or heavy."
        }

    def calculate_route(distance_km, traffic_level):
        adjusted_fuel = (
            distance_km / mileage_km_per_litre
        ) * traffic_factor[traffic_level]

        cost = adjusted_fuel * fuel_price_per_litre
        co2 = adjusted_fuel * emission_factors[fuel]

        return {
            "distance_km": round(distance_km, 2),
            "traffic_level": traffic_level,
            "estimated_fuel_litres": round(adjusted_fuel, 3),
            "estimated_fuel_cost": round(cost, 2),
            "estimated_co2_kg": round(co2, 3),
        }

    route_a = calculate_route(
        route_a_distance_km,
        traffic_a,
    )

    route_b = calculate_route(
        route_b_distance_km,
        traffic_b,
    )

    if route_a["estimated_co2_kg"] <= route_b["estimated_co2_kg"]:
        recommended_route = "Route A"
        better = route_a
        other = route_b
    else:
        recommended_route = "Route B"
        better = route_b
        other = route_a

    fuel_saving = (
        other["estimated_fuel_litres"]
        - better["estimated_fuel_litres"]
    )

    cost_saving = (
        other["estimated_fuel_cost"]
        - better["estimated_fuel_cost"]
    )

    co2_reduction = (
        other["estimated_co2_kg"]
        - better["estimated_co2_kg"]
    )

    return {
        "route_a": route_a,
        "route_b": route_b,
        "recommended_route": recommended_route,
        "estimated_fuel_saved_litres": round(
            max(fuel_saving, 0), 3
        ),
        "estimated_cost_saved": round(
            max(cost_saving, 0), 2
        ),
        "estimated_co2_reduction_kg": round(
            max(co2_reduction, 0), 3
        ),
        "note": (
            "Route values are prototype estimates. "
            "They are not live navigation results."
        ),
    }