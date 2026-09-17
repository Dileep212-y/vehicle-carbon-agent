"""
Optimization tool for reducing vehicle fuel consumption and CO2 emissions.

This tool combines:
- ML fuel prediction
- Driving behavior analysis
- Route comparison
- Fuel cost
- CO2 impact

It generates a prioritized optimization plan.
"""

EMISSION_FACTORS = {
    "petrol": 2.31,
    "gasoline": 2.31,
    "diesel": 2.68,
    "cng": 2.75,
    "lpg": 1.51,
}


def generate_optimization_plan(
    distance_km: float,
    predicted_fuel_consumption_l_per_100km: float,
    driving_efficiency_score: float,
    driving_issues: list,
    current_route_fuel_litres: float = 0.0,
    alternative_route_fuel_litres: float = 0.0,
    fuel_type: str = "petrol",
    fuel_price_per_litre: float = 0.0,
) -> dict:
    """
    Generate a prioritized fuel and carbon reduction plan.

    Args:
        distance_km:
            Trip distance in kilometres.

        predicted_fuel_consumption_l_per_100km:
            ML-predicted fuel consumption.

        driving_efficiency_score:
            Prototype driving-efficiency score from 0 to 100.

        driving_issues:
            Issues identified by the Driving Behavior tool.

        current_route_fuel_litres:
            Estimated fuel used by the current route.

        alternative_route_fuel_litres:
            Estimated fuel used by the alternative route.

        fuel_type:
            Petrol, diesel, CNG or LPG.

        fuel_price_per_litre:
            Fuel price per litre.

    Returns:
        Dictionary containing calculated trip impact,
        route savings and prioritized recommendations.
    """

    # =========================================================
    # INPUT VALIDATION
    # =========================================================

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

    if not 0 <= driving_efficiency_score <= 100:
        return {
            "error": (
                "Driving efficiency score must be "
                "between 0 and 100."
            )
        }

    if fuel_price_per_litre < 0:
        return {
            "error": "Fuel price cannot be negative."
        }

    if current_route_fuel_litres < 0:
        return {
            "error": "Current route fuel cannot be negative."
        }

    if alternative_route_fuel_litres < 0:
        return {
            "error": "Alternative route fuel cannot be negative."
        }

    fuel = fuel_type.strip().lower()

    if fuel not in EMISSION_FACTORS:
        return {
            "error": (
                f"Unsupported fuel type '{fuel_type}'. "
                "Supported types: petrol, diesel, cng, lpg."
            )
        }

    if not isinstance(driving_issues, list):
        return {
            "error": "Driving issues must be provided as a list."
        }

    # Normalize issue text.
    issues = [
        str(issue).strip().lower()
        for issue in driving_issues
    ]

    # =========================================================
    # RECOMMENDATION COLLECTION
    # =========================================================

    recommendations = []

    # ---------------------------------------------------------
    # DRIVING BEHAVIOR
    # ---------------------------------------------------------

    if any("acceleration" in issue for issue in issues):
        recommendations.append(
            {
                "base_priority": 1,
                "category": "Driving Behavior",
                "action": "Reduce hard acceleration",
                "reason": (
                    "Aggressive acceleration was identified "
                    "as a driving-efficiency issue."
                ),
            }
        )

    if any("braking" in issue for issue in issues):
        recommendations.append(
            {
                "base_priority": 2,
                "category": "Driving Behavior",
                "action": "Use smoother braking and anticipate traffic",
                "reason": (
                    "Frequent hard braking can indicate "
                    "stop-and-go driving behavior."
                ),
            }
        )

    if any("idling" in issue for issue in issues):
        recommendations.append(
            {
                "base_priority": 3,
                "category": "Driving Behavior",
                "action": "Reduce unnecessary idling",
                "reason": (
                    "Idling was identified as a factor "
                    "that may increase fuel consumption."
                ),
            }
        )

    if any("speed" in issue for issue in issues):
        recommendations.append(
            {
                "base_priority": 4,
                "category": "Driving Behavior",
                "action": "Maintain a smoother and appropriate speed",
                "reason": (
                    "Elevated vehicle speed was identified "
                    "as an efficiency concern."
                ),
            }
        )

    if any("ac" in issue for issue in issues):
        recommendations.append(
            {
                "base_priority": 6,
                "category": "Vehicle Usage",
                "action": "Use climate control efficiently",
                "reason": (
                    "High AC usage was identified as a "
                    "potential efficiency factor."
                ),
            }
        )

    if any("load" in issue for issue in issues):
        recommendations.append(
            {
                "base_priority": 7,
                "category": "Vehicle Usage",
                "action": "Avoid unnecessary vehicle load",
                "reason": (
                    "Heavy vehicle load was identified as "
                    "an efficiency factor."
                ),
            }
        )

    # ---------------------------------------------------------
    # TRAFFIC
    # ---------------------------------------------------------

    if any("traffic" in issue for issue in issues):
        recommendations.append(
            {
                "base_priority": 5,
                "category": "Route",
                "action": (
                    "Prefer routes with lower congestion "
                    "when practical"
                ),
                "reason": (
                    "Traffic conditions were identified as "
                    "an external efficiency factor."
                ),
            }
        )

    # =========================================================
    # DRIVING SCORE BASED RECOMMENDATION
    # =========================================================

    if driving_efficiency_score < 50:
        recommendations.append(
            {
                "base_priority": 1,
                "category": "Driving Behavior",
                "action": "Focus strongly on eco-driving behavior",
                "reason": (
                    "The prototype driving-efficiency score "
                    "indicates significant improvement potential."
                ),
            }
        )

    elif driving_efficiency_score < 70:
        recommendations.append(
            {
                "base_priority": 4,
                "category": "Driving Behavior",
                "action": (
                    "Improve consistency of eco-driving behavior"
                ),
                "reason": (
                    "The prototype driving-efficiency score "
                    "indicates that improvement is possible."
                ),
            }
        )

    # =========================================================
    # ROUTE SAVINGS
    # =========================================================

    route_savings_available = (
        current_route_fuel_litres > 0
        and alternative_route_fuel_litres > 0
        and alternative_route_fuel_litres
        < current_route_fuel_litres
    )

    if route_savings_available:

        fuel_saved = (
            current_route_fuel_litres
            - alternative_route_fuel_litres
        )

        cost_saved = (
            fuel_saved
            * fuel_price_per_litre
        )

        co2_saved = (
            fuel_saved
            * EMISSION_FACTORS[fuel]
        )

        recommendations.append(
            {
                "base_priority": 1,
                "category": "Route Optimization",
                "action": "Choose the lower-fuel route",
                "reason": (
                    "The alternative route has lower "
                    "estimated fuel consumption."
                ),
            }
        )

    else:

        fuel_saved = 0.0
        cost_saved = 0.0
        co2_saved = 0.0

    # =========================================================
    # FALLBACK
    # =========================================================

    if not recommendations:
        recommendations.append(
            {
                "base_priority": 1,
                "category": "General",
                "action": (
                    "Continue current eco-driving practices"
                ),
                "reason": (
                    "No major driving-efficiency issue was "
                    "identified from the supplied information."
                ),
            }
        )

    # =========================================================
    # REMOVE DUPLICATE ACTIONS
    # =========================================================

    unique_recommendations = []

    seen_actions = set()

    for recommendation in recommendations:

        action = recommendation["action"]

        if action not in seen_actions:
            unique_recommendations.append(recommendation)
            seen_actions.add(action)

    # =========================================================
    # SORT BY IMPORTANCE
    # =========================================================

    unique_recommendations.sort(
        key=lambda item: item["base_priority"]
    )

    # =========================================================
    # CONVERT TO CLEAN SEQUENTIAL PRIORITIES
    # =========================================================

    final_recommendations = []

    for index, recommendation in enumerate(
        unique_recommendations,
        start=1,
    ):

        final_recommendations.append(
            {
                "priority": index,
                "category": recommendation["category"],
                "action": recommendation["action"],
                "reason": recommendation["reason"],
            }
        )

    # =========================================================
    # TRIP CALCULATIONS
    # =========================================================

    predicted_trip_fuel = (
        distance_km
        * predicted_fuel_consumption_l_per_100km
        / 100
    )

    predicted_trip_cost = (
        predicted_trip_fuel
        * fuel_price_per_litre
    )

    predicted_trip_co2 = (
        predicted_trip_fuel
        * EMISSION_FACTORS[fuel]
    )

    # =========================================================
    # FINAL RESULT
    # =========================================================

    return {
        "distance_km": round(
            distance_km,
            2,
        ),

        "predicted_fuel_consumption_l_per_100km": round(
            predicted_fuel_consumption_l_per_100km,
            3,
        ),

        "estimated_trip_fuel_litres": round(
            predicted_trip_fuel,
            3,
        ),

        "estimated_trip_cost": round(
            predicted_trip_cost,
            2,
        ),

        "estimated_trip_co2_kg": round(
            predicted_trip_co2,
            3,
        ),

        "driving_efficiency_score": round(
            driving_efficiency_score,
            2,
        ),

        "current_route_fuel_litres": round(
            current_route_fuel_litres,
            3,
        ),

        "alternative_route_fuel_litres": round(
            alternative_route_fuel_litres,
            3,
        ),

        "route_fuel_saved_litres": round(
            fuel_saved,
            3,
        ),

        "route_cost_saved": round(
            cost_saved,
            2,
        ),

        "route_co2_reduction_kg": round(
            co2_saved,
            3,
        ),

        "recommendations": final_recommendations,

        "note": (
            "Recommendations are based only on the supplied "
            "prototype measurements and calculated estimates. "
            "No unsupported fuel-saving percentage is assumed."
        ),
    }