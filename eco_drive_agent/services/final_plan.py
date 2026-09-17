"""
Final Eco Plan generator.

Converts the structured output of the Eco Drive pipeline
into a clean human-readable report.

No Gemini API calls are made here.
"""


def generate_final_eco_plan(pipeline_result: dict) -> str:
    """
    Generate a human-readable final Eco Drive plan.

    Args:
        pipeline_result:
            Result returned by run_eco_drive_pipeline().

    Returns:
        Formatted final Eco Drive report as a string.
    """

    # =========================================================
    # VALIDATE PIPELINE RESULT
    # =========================================================

    if not isinstance(pipeline_result, dict):
        return "ERROR: Invalid pipeline result."

    if pipeline_result.get("pipeline_status") != "SUCCESS":
        error = pipeline_result.get(
            "error",
            "Unknown pipeline error.",
        )

        failed_stage = pipeline_result.get(
            "failed_stage",
            "unknown",
        )

        return (
            "ECO DRIVE AI PIPELINE FAILED\n"
            f"Stage: {failed_stage}\n"
            f"Error: {error}"
        )

    # =========================================================
    # EXTRACT RESULTS
    # =========================================================

    vehicle = pipeline_result["vehicle_analysis"]

    driving = pipeline_result["driving_analysis"]

    fuel = pipeline_result["fuel_prediction"]

    route = pipeline_result["route_comparison"]

    impact = pipeline_result["carbon_impact"]

    optimization = pipeline_result["optimization"]

    eco = pipeline_result["eco_performance"]

    summary = pipeline_result["summary"]

    # =========================================================
    # BASIC INFORMATION
    # =========================================================

    fuel_type = vehicle["fuel_type"].title()

    mileage = vehicle["mileage_km_per_litre"]

    vehicle_age = vehicle["vehicle_age_years"]

    efficiency_level = vehicle["efficiency_level"]

    vehicle_score = vehicle["efficiency_score"]

    # =========================================================
    # DRIVING INFORMATION
    # =========================================================

    driving_score = driving["driving_efficiency_score"]

    driving_rating = driving["driving_rating"]

    driving_issues = driving["issues"]

    # =========================================================
    # ML INFORMATION
    # =========================================================

    model_name = fuel["model"]

    predicted_consumption = (
        fuel["predicted_fuel_consumption_l_per_100km"]
    )

    predicted_efficiency = (
        fuel["equivalent_fuel_efficiency_kmpl"]
    )

    # =========================================================
    # TRIP IMPACT
    # =========================================================

    distance = impact["distance_km"]

    trip_fuel = impact["estimated_fuel_consumed_litres"]

    trip_cost = impact["estimated_fuel_cost"]

    trip_co2 = impact["estimated_co2_emissions_kg"]

    co2_per_km = impact["co2_per_km"]

    # =========================================================
    # ROUTE INFORMATION
    # =========================================================

    recommended_route = route["recommended_route"]

    route_fuel_saved = (
        route["estimated_fuel_saved_litres"]
    )

    route_cost_saved = (
        route["estimated_cost_saved"]
    )

    route_co2_reduction = (
        route["estimated_co2_reduction_kg"]
    )

    # =========================================================
    # ECO SCORE
    # =========================================================

    overall_score = eco["overall_score"]

    overall_rating = eco["overall_rating"]

    components = eco["components"]

    # =========================================================
    # BUILD REPORT
    # =========================================================

    lines = []

    lines.append("")
    lines.append("=" * 60)
    lines.append("                 ECO DRIVE AI")
    lines.append("          FINAL ECO PERFORMANCE PLAN")
    lines.append("=" * 60)

    # ---------------------------------------------------------
    # ECO SCORE
    # ---------------------------------------------------------

    lines.append("")
    lines.append("ECO PERFORMANCE SCORE")
    lines.append("-" * 60)

    lines.append(
        f"Overall Score          : {overall_score:.2f} / 100"
    )

    lines.append(
        f"Overall Rating         : {overall_rating}"
    )

    lines.append("")

    lines.append(
        f"Vehicle Efficiency     : "
        f"{components['vehicle_efficiency_score']:.2f}"
    )

    lines.append(
        f"Driving Behavior       : "
        f"{components['driving_behavior_score']:.2f}"
    )

    lines.append(
        f"Fuel Efficiency        : "
        f"{components['fuel_efficiency_score']:.2f}"
    )

    lines.append(
        f"Carbon Intensity       : "
        f"{components['carbon_intensity_score']:.2f}"
    )

    # ---------------------------------------------------------
    # VEHICLE
    # ---------------------------------------------------------

    lines.append("")
    lines.append("VEHICLE ANALYSIS")
    lines.append("-" * 60)

    lines.append(
        f"Fuel Type              : {fuel_type}"
    )

    lines.append(
        f"Current Mileage        : {mileage:.2f} km/L"
    )

    lines.append(
        f"Vehicle Age            : {vehicle_age:.1f} years"
    )

    lines.append(
        f"Efficiency Level       : {efficiency_level}"
    )

    lines.append(
        f"Vehicle Efficiency     : {vehicle_score}/100"
    )

    # ---------------------------------------------------------
    # DRIVING
    # ---------------------------------------------------------

    lines.append("")
    lines.append("DRIVING BEHAVIOR")
    lines.append("-" * 60)

    lines.append(
        f"Driving Score          : {driving_score}/100"
    )

    lines.append(
        f"Driving Rating         : {driving_rating}"
    )

    lines.append("")
    lines.append("Detected Issues:")

    for index, issue in enumerate(
        driving_issues,
        start=1,
    ):
        lines.append(
            f"  {index}. {issue}"
        )

    # ---------------------------------------------------------
    # ML PREDICTION
    # ---------------------------------------------------------

    lines.append("")
    lines.append("ML FUEL PREDICTION")
    lines.append("-" * 60)

    lines.append(
        f"Model                  : {model_name}"
    )

    lines.append(
        f"Predicted Consumption  : "
        f"{predicted_consumption:.3f} L/100 km"
    )

    lines.append(
        f"Equivalent Efficiency  : "
        f"{predicted_efficiency:.2f} km/L"
    )

    lines.append(
        "Prediction Type        : Prototype ML estimate"
    )

    # ---------------------------------------------------------
    # TRIP IMPACT
    # ---------------------------------------------------------

    lines.append("")
    lines.append("TRIP IMPACT")
    lines.append("-" * 60)

    lines.append(
        f"Trip Distance          : {distance:.2f} km"
    )

    lines.append(
        f"Estimated Fuel         : {trip_fuel:.3f} L"
    )

    lines.append(
        f"Estimated Fuel Cost    : ₹{trip_cost:.2f}"
    )

    lines.append(
        f"Estimated CO2          : {trip_co2:.3f} kg"
    )

    lines.append(
        f"CO2 per km             : {co2_per_km:.3f} kg/km"
    )

    # ---------------------------------------------------------
    # ROUTE OPTIMIZATION
    # ---------------------------------------------------------

    lines.append("")
    lines.append("ROUTE OPTIMIZATION")
    lines.append("-" * 60)

    lines.append(
        f"Recommended Route      : {recommended_route}"
    )

    lines.append(
        f"Estimated Fuel Saved   : "
        f"{route_fuel_saved:.2f} L"
    )

    lines.append(
        f"Estimated Cost Saved   : "
        f"₹{route_cost_saved:.2f}"
    )

    lines.append(
        f"Estimated CO2 Reduced  : "
        f"{route_co2_reduction:.2f} kg"
    )

    # ---------------------------------------------------------
    # OPTIMIZATION PLAN
    # ---------------------------------------------------------

    lines.append("")
    lines.append("PRIORITIZED OPTIMIZATION PLAN")
    lines.append("-" * 60)

    recommendations = optimization[
        "recommendations"
    ]

    for recommendation in recommendations:

        priority = recommendation["priority"]

        category = recommendation["category"]

        action = recommendation["action"]

        reason = recommendation["reason"]

        lines.append(
            f"{priority}. [{category}] {action}"
        )

        lines.append(
            f"   Reason: {reason}"
        )

    # ---------------------------------------------------------
    # LIMITATIONS
    # ---------------------------------------------------------

    lines.append("")
    lines.append("IMPORTANT PROJECT LIMITATIONS")
    lines.append("-" * 60)

    lines.append(
        "• ML fuel prediction uses the project's "
        "synthetic training dataset."
    )

    lines.append(
        "• ML predictions are prototype estimates, "
        "not real-world vehicle measurements."
    )

    lines.append(
        "• Route values are prototype estimates, "
        "not live navigation results."
    )

    lines.append(
        "• CO2 values represent prototype tailpipe "
        "estimates using the configured emission factor."
    )

    lines.append(
        "• Eco Performance Score is a project-defined "
        "indicator, not an official rating."
    )

    # ---------------------------------------------------------
    # FINAL MESSAGE
    # ---------------------------------------------------------

    lines.append("")
    lines.append("=" * 60)
    lines.append("                  END OF REPORT")
    lines.append("=" * 60)
    lines.append("")

    return "\n".join(lines)