"""
End-to-end deterministic Eco Drive pipeline.

Pipeline:
Vehicle Analysis
    -> Driving Analysis
    -> Fuel Prediction
    -> Route Comparison
    -> Carbon Impact
    -> Optimization
    -> Eco Performance Score
    -> Final Eco Plan

This pipeline does NOT call Gemini.
All numerical calculations are performed locally.
"""

from ..tools.vehicle_analysis import analyze_vehicle_efficiency
from ..tools.driving_analysis import analyze_driving_behavior
from ..tools.fuel_prediction import predict_fuel_consumption
from ..tools.route_analysis import compare_routes
from ..tools.trip_impact import calculate_trip_impact
from ..tools.optimization import generate_optimization_plan


def calculate_eco_performance_score(
    vehicle_score: float,
    driving_score: float,
    predicted_efficiency_kmpl: float,
    co2_per_km: float,
) -> dict:
    """
    Calculate a project-defined Eco Performance Score.

    The score is NOT an official automotive or environmental rating.

    Components:
        Vehicle efficiency  -> 25%
        Driving behavior   -> 30%
        Fuel efficiency    -> 25%
        Carbon intensity   -> 20%

    Returns:
        Dictionary containing component scores,
        weighted score and overall rating.
    """

    # ---------------------------------------------------------
    # VEHICLE SCORE
    # ---------------------------------------------------------

    vehicle_component = max(
        0,
        min(100, float(vehicle_score)),
    )

    # ---------------------------------------------------------
    # DRIVING SCORE
    # ---------------------------------------------------------

    driving_component = max(
        0,
        min(100, float(driving_score)),
    )

    # ---------------------------------------------------------
    # FUEL EFFICIENCY SCORE
    # ---------------------------------------------------------
    #
    # Prototype normalization:
    # 20 km/L or higher -> 100
    # 10 km/L           -> 50
    # 5 km/L or lower   -> 0
    #
    # This is a project-defined normalization,
    # not an industry standard.

    fuel_efficiency_score = (
        (predicted_efficiency_kmpl - 5)
        / (20 - 5)
    ) * 100

    fuel_efficiency_score = max(
        0,
        min(100, fuel_efficiency_score),
    )

    # ---------------------------------------------------------
    # CARBON SCORE
    # ---------------------------------------------------------
    #
    # Prototype normalization:
    # 0.10 kg CO2/km or lower -> 100
    # 0.30 kg CO2/km or higher -> 0
    #
    # This is a project-defined normalization,
    # not an environmental standard.

    carbon_score = (
        (0.30 - co2_per_km)
        / (0.30 - 0.10)
    ) * 100

    carbon_score = max(
        0,
        min(100, carbon_score),
    )

    # ---------------------------------------------------------
    # WEIGHTED SCORE
    # ---------------------------------------------------------

    weighted_score = (
        vehicle_component * 0.25
        + driving_component * 0.30
        + fuel_efficiency_score * 0.25
        + carbon_score * 0.20
    )

    weighted_score = round(
        max(0, min(100, weighted_score)),
        2,
    )

    # ---------------------------------------------------------
    # OVERALL RATING
    # ---------------------------------------------------------

    if weighted_score >= 85:
        rating = "Excellent"
    elif weighted_score >= 70:
        rating = "Good"
    elif weighted_score >= 50:
        rating = "Needs Improvement"
    else:
        rating = "Poor"

    return {
        "overall_score": weighted_score,
        "overall_rating": rating,
        "components": {
            "vehicle_efficiency_score": round(
                vehicle_component,
                2,
            ),
            "driving_behavior_score": round(
                driving_component,
                2,
            ),
            "fuel_efficiency_score": round(
                fuel_efficiency_score,
                2,
            ),
            "carbon_intensity_score": round(
                carbon_score,
                2,
            ),
        },
        "weights": {
            "vehicle_efficiency": 25,
            "driving_behavior": 30,
            "fuel_efficiency": 25,
            "carbon_intensity": 20,
        },
        "methodology": (
            "Project-defined weighted score using prototype "
            "normalization ranges. It is not an official "
            "automotive or environmental rating."
        ),
    }


def run_eco_drive_pipeline(
    mileage_km_per_litre: float,
    fuel_type: str,
    vehicle_age_years: float,
    average_speed_kmh: float,
    max_speed_kmh: float,
    hard_accelerations: int,
    hard_brakings: int,
    idle_minutes: float,
    ac_usage: str,
    traffic_level: str,
    vehicle_load: str,
    acceleration_mps2: float,
    braking_mps2: float,
    distance_km: float,
    road_type: str,
    fuel_price_per_litre: float,
    route_a_distance_km: float,
    route_a_traffic_level: str,
    route_b_distance_km: float,
    route_b_traffic_level: str,
) -> dict:
    """
    Run the complete Eco Drive analysis pipeline.

    Returns:
        A structured dictionary containing all analysis stages,
        Eco Performance Score and final recommendations.
    """

    # =========================================================
    # 1. VEHICLE ANALYSIS
    # =========================================================

    vehicle_result = analyze_vehicle_efficiency(
        mileage_km_per_litre=mileage_km_per_litre,
        fuel_type=fuel_type,
        vehicle_age_years=vehicle_age_years,
    )

    if "error" in vehicle_result:
        return {
            "pipeline_status": "FAILED",
            "failed_stage": "vehicle_analysis",
            "error": vehicle_result["error"],
        }

    # =========================================================
    # 2. DRIVING BEHAVIOR ANALYSIS
    # =========================================================

    driving_result = analyze_driving_behavior(
        average_speed_kmh=average_speed_kmh,
        max_speed_kmh=max_speed_kmh,
        hard_accelerations=hard_accelerations,
        hard_brakings=hard_brakings,
        idle_minutes=idle_minutes,
        ac_usage=ac_usage,
        traffic_level=traffic_level,
        vehicle_load=vehicle_load,
    )

    if "error" in driving_result:
        return {
            "pipeline_status": "FAILED",
            "failed_stage": "driving_analysis",
            "error": driving_result["error"],
        }

    # =========================================================
    # 3. ML FUEL PREDICTION
    # =========================================================

    fuel_prediction_result = predict_fuel_consumption(
        speed_kmh=average_speed_kmh,
        vehicle_mileage_kmpl=mileage_km_per_litre,
        acceleration_mps2=acceleration_mps2,
        braking_mps2=braking_mps2,
        distance_km=distance_km,
        traffic_level=traffic_level,
        ac_usage=ac_usage,
        vehicle_load=vehicle_load,
        road_type=road_type,
    )

    if "error" in fuel_prediction_result:
        return {
            "pipeline_status": "FAILED",
            "failed_stage": "fuel_prediction",
            "error": fuel_prediction_result["error"],
        }

    predicted_consumption = fuel_prediction_result[
        "predicted_fuel_consumption_l_per_100km"
    ]

    predicted_efficiency = fuel_prediction_result[
        "equivalent_fuel_efficiency_kmpl"
    ]

    # =========================================================
    # 4. ROUTE COMPARISON
    # =========================================================

    route_result = compare_routes(
        route_a_distance_km=route_a_distance_km,
        route_a_traffic_level=route_a_traffic_level,
        route_b_distance_km=route_b_distance_km,
        route_b_traffic_level=route_b_traffic_level,
        mileage_km_per_litre=mileage_km_per_litre,
        fuel_type=fuel_type,
        fuel_price_per_litre=fuel_price_per_litre,
    )

    if "error" in route_result:
        return {
            "pipeline_status": "FAILED",
            "failed_stage": "route_comparison",
            "error": route_result["error"],
        }

    # =========================================================
    # 5. CARBON / TRIP IMPACT
    # =========================================================

    impact_result = calculate_trip_impact(
        distance_km=distance_km,
        predicted_fuel_consumption_l_per_100km=predicted_consumption,
        fuel_type=fuel_type,
        fuel_price_per_litre=fuel_price_per_litre,
    )

    if "error" in impact_result:
        return {
            "pipeline_status": "FAILED",
            "failed_stage": "carbon_impact",
            "error": impact_result["error"],
        }

    # =========================================================
    # 6. OPTIMIZATION
    # =========================================================

    current_route_fuel = route_result["route_a"][
        "estimated_fuel_litres"
    ]

    alternative_route_fuel = route_result["route_b"][
        "estimated_fuel_litres"
    ]

    optimization_result = generate_optimization_plan(
        distance_km=distance_km,
        predicted_fuel_consumption_l_per_100km=predicted_consumption,
        driving_efficiency_score=driving_result[
            "driving_efficiency_score"
        ],
        driving_issues=driving_result["issues"],
        current_route_fuel_litres=current_route_fuel,
        alternative_route_fuel_litres=alternative_route_fuel,
        fuel_type=fuel_type,
        fuel_price_per_litre=fuel_price_per_litre,
    )

    if "error" in optimization_result:
        return {
            "pipeline_status": "FAILED",
            "failed_stage": "optimization",
            "error": optimization_result["error"],
        }

    # =========================================================
    # 7. ECO PERFORMANCE SCORE
    # =========================================================

    eco_score_result = calculate_eco_performance_score(
        vehicle_score=vehicle_result["efficiency_score"],
        driving_score=driving_result[
            "driving_efficiency_score"
        ],
        predicted_efficiency_kmpl=predicted_efficiency,
        co2_per_km=impact_result["co2_per_km"],
    )

    # =========================================================
    # 8. FINAL SUMMARY
    # =========================================================

    summary = {
        "eco_performance_score": (
            eco_score_result["overall_score"]
        ),

        "eco_performance_rating": (
            eco_score_result["overall_rating"]
        ),

        "vehicle_efficiency_level": (
            vehicle_result["efficiency_level"]
        ),

        "driving_score": (
            driving_result["driving_efficiency_score"]
        ),

        "driving_rating": (
            driving_result["driving_rating"]
        ),

        "predicted_fuel_consumption_l_per_100km": (
            predicted_consumption
        ),

        "equivalent_fuel_efficiency_kmpl": (
            predicted_efficiency
        ),

        "estimated_trip_fuel_litres": (
            impact_result["estimated_fuel_consumed_litres"]
        ),

        "estimated_trip_cost": (
            impact_result["estimated_fuel_cost"]
        ),

        "estimated_trip_co2_kg": (
            impact_result["estimated_co2_emissions_kg"]
        ),

        "co2_per_km": (
            impact_result["co2_per_km"]
        ),

        "recommended_route": (
            route_result["recommended_route"]
        ),

        "route_fuel_saved_litres": (
            route_result["estimated_fuel_saved_litres"]
        ),

        "route_cost_saved": (
            route_result["estimated_cost_saved"]
        ),

        "route_co2_reduction_kg": (
            route_result["estimated_co2_reduction_kg"]
        ),
    }

    # =========================================================
    # 9. FINAL RESULT
    # =========================================================

    return {
        "pipeline_status": "SUCCESS",

        "vehicle_analysis": vehicle_result,

        "driving_analysis": driving_result,

        "fuel_prediction": fuel_prediction_result,

        "route_comparison": route_result,

        "carbon_impact": impact_result,

        "optimization": optimization_result,

        "eco_performance": eco_score_result,

        "summary": summary,

        "limitations": [
            (
                "Fuel prediction currently uses the project's "
                "synthetic training dataset."
            ),
            (
                "Fuel prediction is a prototype ML estimate "
                "and not a real-world vehicle measurement."
            ),
            (
                "Route values are prototype estimates and are "
                "not live navigation results."
            ),
            (
                "CO2 values are prototype tailpipe estimates "
                "using the configured emission factor."
            ),
            (
                "Eco Performance Score is a project-defined "
                "indicator and is not an official rating."
            ),
        ],
    }