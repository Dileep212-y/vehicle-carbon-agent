"""Tools for analyzing driving behavior and its potential impact on efficiency."""


def analyze_driving_behavior(
    average_speed_kmh: float,
    max_speed_kmh: float,
    hard_accelerations: int,
    hard_brakings: int,
    idle_minutes: float,
    ac_usage: str,
    traffic_level: str,
    vehicle_load: str = "normal",
) -> dict:
    """Analyze driving behavior and calculate a prototype eco-driving score.

    Args:
        average_speed_kmh: Average trip speed.
        max_speed_kmh: Maximum recorded speed.
        hard_accelerations: Number of aggressive acceleration events.
        hard_brakings: Number of hard braking events.
        idle_minutes: Approximate minutes spent idling.
        ac_usage: low, moderate, or high.
        traffic_level: low, moderate, or heavy.
        vehicle_load: light, normal, or heavy.

    Returns:
        Dictionary containing driving score, observations,
        and prioritized improvement areas.
    """

    if average_speed_kmh < 0:
        return {"error": "Average speed cannot be negative."}

    if max_speed_kmh < 0:
        return {"error": "Maximum speed cannot be negative."}

    if hard_accelerations < 0 or hard_brakings < 0:
        return {"error": "Acceleration and braking counts cannot be negative."}

    if idle_minutes < 0:
        return {"error": "Idle time cannot be negative."}

    ac = ac_usage.strip().lower()
    traffic = traffic_level.strip().lower()
    load = vehicle_load.strip().lower()

    score = 100
    issues = []

    # Aggressive acceleration
    if hard_accelerations >= 10:
        score -= 20
        issues.append("Frequent hard acceleration")
    elif hard_accelerations >= 5:
        score -= 10
        issues.append("Moderate hard acceleration")

    # Hard braking
    if hard_brakings >= 10:
        score -= 15
        issues.append("Frequent hard braking")
    elif hard_brakings >= 5:
        score -= 8
        issues.append("Moderate hard braking")

    # Idling
    if idle_minutes >= 20:
        score -= 15
        issues.append("Excessive idling")
    elif idle_minutes >= 10:
        score -= 8
        issues.append("Moderate idling")

    # Speed
    if max_speed_kmh > 120:
        score -= 12
        issues.append("High maximum speed")
    elif max_speed_kmh > 100:
        score -= 6
        issues.append("Elevated maximum speed")

    # AC
    if ac == "high":
        score -= 5
        issues.append("High AC usage")
    elif ac == "moderate":
        score -= 2

    # Traffic
    if traffic == "heavy":
        score -= 8
        issues.append("Heavy traffic")
    elif traffic == "moderate":
        score -= 4

    # Load
    if load == "heavy":
        score -= 5
        issues.append("Heavy vehicle load")

    score = max(0, min(score, 100))

    if score >= 85:
        rating = "Excellent"
    elif score >= 70:
        rating = "Good"
    elif score >= 50:
        rating = "Needs Improvement"
    else:
        rating = "Poor"

    if not issues:
        issues.append("No major driving-efficiency issue detected.")

    return {
        "average_speed_kmh": round(average_speed_kmh, 2),
        "max_speed_kmh": round(max_speed_kmh, 2),
        "hard_accelerations": hard_accelerations,
        "hard_brakings": hard_brakings,
        "idle_minutes": round(idle_minutes, 2),
        "ac_usage": ac,
        "traffic_level": traffic,
        "vehicle_load": load,
        "driving_efficiency_score": score,
        "driving_rating": rating,
        "issues": issues,
    }