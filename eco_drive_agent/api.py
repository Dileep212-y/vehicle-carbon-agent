import os
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

from .services.end_to_end import run_eco_drive_pipeline
from .services.final_plan import generate_final_eco_plan


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="Eco Drive AI API",
    version="1.1.0",
    description=(
        "API bridge for the EcoDrive deterministic analysis pipeline "
        "and context-aware AI assistant."
    ),
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ANALYSIS REQUEST MODEL
# =========================================================

class EcoDriveRequest(BaseModel):
    mileage_km_per_litre: float = Field(gt=0, le=100)
    fuel_type: str = Field(min_length=1, max_length=40)
    vehicle_age_years: float = Field(ge=0, le=100)

    average_speed_kmh: float = Field(gt=0, le=300)
    max_speed_kmh: float = Field(gt=0, le=350)

    hard_accelerations: int = Field(ge=0, le=1000)
    hard_brakings: int = Field(ge=0, le=1000)
    idle_minutes: float = Field(ge=0, le=10000)

    ac_usage: str = Field(min_length=1, max_length=40)
    traffic_level: str = Field(min_length=1, max_length=40)
    vehicle_load: str = Field(min_length=1, max_length=40)

    acceleration_mps2: float = Field(ge=0, le=20)
    braking_mps2: float = Field(ge=0, le=20)

    distance_km: float = Field(gt=0, le=10000)
    road_type: str = Field(min_length=1, max_length=60)

    fuel_price_per_litre: float = Field(gt=0, le=1000)

    route_a_distance_km: float = Field(gt=0, le=10000)
    route_a_traffic_level: str = Field(
        min_length=1,
        max_length=40
    )

    route_b_distance_km: float = Field(gt=0, le=10000)
    route_b_traffic_level: str = Field(
        min_length=1,
        max_length=40
    )


# =========================================================
# CHAT REQUEST MODEL
# =========================================================

class EcoDriveChatRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=2000
    )

    session_id: str = Field(
        default="ecodrive-web-session",
        max_length=200
    )

    # The React frontend sends the latest analysis here.
    analysis: Optional[Dict[str, Any]] = None

    # Also support a generic context object for future versions.
    context: Optional[Dict[str, Any]] = None


# =========================================================
# BASIC ROUTES
# =========================================================

@app.get("/")
def root():
    return {
        "service": "Eco Drive AI API",
        "status": "online",
        "pipeline": "deterministic_local_pipeline",
        "assistant": "available",
    }


@app.get("/api/health")
def health():
    project_root = Path(__file__).resolve().parents[1]

    model_path = (
        project_root
        / "ml"
        / "fuel_prediction_model.joblib"
    )

    features_path = (
        project_root
        / "ml"
        / "model_features.joblib"
    )

    return {
        "status": "healthy",
        "service": "eco_drive_ai",
        "analysis_pipeline": "available",
        "assistant": "available",
        "fuel_model_available": (
            model_path.exists()
            and features_path.exists()
        ),
        "google_api_key_configured": bool(
            os.getenv("GOOGLE_API_KEY")
        ),
    }


# =========================================================
# COMPLETE ECO DRIVE ANALYSIS
# =========================================================

@app.post("/api/eco-drive/analyze")
def analyze(request: EcoDriveRequest):

    try:

        pipeline_result = run_eco_drive_pipeline(
            mileage_km_per_litre=(
                request.mileage_km_per_litre
            ),

            fuel_type=request.fuel_type,

            vehicle_age_years=(
                request.vehicle_age_years
            ),

            average_speed_kmh=(
                request.average_speed_kmh
            ),

            max_speed_kmh=(
                request.max_speed_kmh
            ),

            hard_accelerations=(
                request.hard_accelerations
            ),

            hard_brakings=(
                request.hard_brakings
            ),

            idle_minutes=request.idle_minutes,

            ac_usage=request.ac_usage,

            traffic_level=request.traffic_level,

            vehicle_load=request.vehicle_load,

            acceleration_mps2=(
                request.acceleration_mps2
            ),

            braking_mps2=(
                request.braking_mps2
            ),

            distance_km=request.distance_km,

            road_type=request.road_type,

            fuel_price_per_litre=(
                request.fuel_price_per_litre
            ),

            route_a_distance_km=(
                request.route_a_distance_km
            ),

            route_a_traffic_level=(
                request.route_a_traffic_level
            ),

            route_b_distance_km=(
                request.route_b_distance_km
            ),

            route_b_traffic_level=(
                request.route_b_traffic_level
            ),
        )

        if pipeline_result.get(
            "pipeline_status"
        ) != "SUCCESS":

            raise HTTPException(
                status_code=422,
                detail={
                    "message": (
                        "Eco Drive pipeline failed."
                    ),
                    "pipeline": pipeline_result,
                },
            )

        final_plan = generate_final_eco_plan(
            pipeline_result
        )

        return {
            "success": True,
            "pipeline": pipeline_result,
            "final_plan": final_plan,
        }

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Eco Drive API error: {exc}",
        ) from exc


# =========================================================
# HELPER FUNCTIONS FOR ASSISTANT
# =========================================================

def _number(
    value: Any,
    default: float = 0.0
) -> float:

    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _get_pipeline(
    analysis: Optional[Dict[str, Any]],
    context: Optional[Dict[str, Any]]
) -> Dict[str, Any]:

    analysis = analysis or {}
    context = context or {}

    pipeline = analysis.get("pipeline")

    if isinstance(pipeline, dict):
        return pipeline

    pipeline = context.get("pipeline")

    if isinstance(pipeline, dict):
        return pipeline

    return {}


def _format_route(route: Dict[str, Any]) -> str:

    if not route:
        return "Route information is not available."

    name = (
        route.get("route_name")
        or route.get("name")
        or "Route"
    )

    distance = _number(
        route.get("distance_km")
        or route.get("distance"),
        0
    )

    traffic = (
        route.get("traffic_level")
        or route.get("traffic")
        or "unknown"
    )

    return (
        f"{name}: {distance:.1f} km, "
        f"traffic {str(traffic).title()}"
    )


# =========================================================
# DETERMINISTIC ECO DRIVE ASSISTANT
# =========================================================

def generate_assistant_reply(
    message: str,
    analysis: Optional[Dict[str, Any]],
    context: Optional[Dict[str, Any]]
) -> str:

    question = message.lower().strip()

    pipeline = _get_pipeline(
        analysis,
        context
    )

    # -----------------------------------------------------
    # Extract pipeline sections
    # -----------------------------------------------------

    vehicle = pipeline.get(
        "vehicle_analysis",
        {}
    )

    driving = pipeline.get(
        "driving_analysis",
        {}
    )

    fuel = pipeline.get(
        "fuel_prediction",
        {}
    )

    route = pipeline.get(
        "route_comparison",
        {}
    )

    carbon = pipeline.get(
        "carbon_impact",
        {}
    )

    optimization = pipeline.get(
        "optimization",
        {}
    )

    eco = pipeline.get(
        "eco_performance",
        {}
    )

    summary = pipeline.get(
        "summary",
        {}
    )

    # -----------------------------------------------------
    # Important values
    # -----------------------------------------------------

    driving_score = _number(
        driving.get(
            "driving_efficiency_score"
        ),
        0
    )

    predicted_fuel = _number(
        fuel.get(
            "predicted_fuel_consumption_l_per_100km"
        ),
        0
    )

    predicted_efficiency = _number(
        fuel.get(
            "equivalent_fuel_efficiency_kmpl"
        ),
        0
    )

    co2_kg = _number(
        carbon.get(
            "estimated_co2_emissions_kg"
        ),
        0
    )

    co2_per_km = _number(
        carbon.get(
            "co2_per_km"
        ),
        0
    )

    distance = _number(
        carbon.get(
            "distance_km"
        ),
        0
    )

    fuel_used = _number(
        carbon.get(
            "estimated_fuel_consumed_litres"
        ),
        0
    )

    fuel_cost = _number(
        carbon.get(
            "fuel_cost"
        ),
        0
    )

    eco_score = _number(
        eco.get(
            "eco_performance_score"
        )
        or eco.get(
            "score"
        ),
        0
    )

    eco_rating = (
        eco.get("rating")
        or eco.get("eco_rating")
        or "Not available"
    )

    vehicle_score = _number(
        vehicle.get(
            "efficiency_score"
        ),
        0
    )

    driving_rating = (
        driving.get(
            "driving_rating"
        )
        or "Not available"
    )

    recommended_route = (
        route.get(
            "recommended_route"
        )
        or route.get(
            "recommended"
        )
        or "Not available"
    )

    fuel_saved = _number(
        route.get(
            "fuel_saved_litres"
        )
        or route.get(
            "fuel_saved"
        ),
        0
    )

    cost_saved = _number(
        route.get(
            "cost_saved"
        ),
        0
    )

    route_co2_reduction = _number(
        route.get(
            "co2_reduction_kg"
        )
        or route.get(
            "co2_reduction"
        ),
        0
    )

    # -----------------------------------------------------
    # No analysis yet
    # -----------------------------------------------------

    if not pipeline:

        return (
            "I’m ready to analyze your drive. "
            "Run an EcoDrive trip analysis first so I can "
            "use your vehicle, driving, fuel, route and "
            "carbon results. You can then ask me about "
            "fuel consumption, CO₂ emissions, route choice "
            "or your eco score."
        )

    # -----------------------------------------------------
    # FUEL QUESTIONS
    # -----------------------------------------------------

    if any(
        word in question
        for word in [
            "fuel",
            "mileage",
            "petrol",
            "diesel",
            "consumption",
            "efficiency",
        ]
    ):

        return (
            f"Your current EcoDrive ML prediction is "
            f"{predicted_fuel:.3f} L/100 km, equivalent "
            f"to about {predicted_efficiency:.3f} km/L. "
            f"The model used is "
            f"Gradient Boosting Regressor. "
            f"To improve fuel efficiency, focus on smoother "
            f"acceleration, steady speed, reduced idling "
            f"and lower-congestion routes. "
            f"This prediction is a prototype estimate based "
            f"on the project's current synthetic training "
            f"dataset."
        )

    # -----------------------------------------------------
    # CO2 / CARBON QUESTIONS
    # -----------------------------------------------------

    if any(
        word in question
        for word in [
            "co2",
            "carbon",
            "emission",
            "emissions",
            "pollution",
            "environment",
        ]
    ):

        return (
            f"Your current trip estimate is "
            f"{co2_kg:.3f} kg of CO₂ over "
            f"{distance:.1f} km. "
            f"That corresponds to approximately "
            f"{co2_per_km * 1000:.0f} g/km. "
            f"The estimated fuel used for the trip is "
            f"{fuel_used:.3f} L, with an estimated fuel "
            f"cost of ₹{fuel_cost:.2f}. "
            f"Reducing unnecessary acceleration, braking "
            f"and idling can help lower the impact."
        )

    # -----------------------------------------------------
    # DRIVING QUESTIONS
    # -----------------------------------------------------

    if any(
        word in question
        for word in [
            "driving",
            "braking",
            "brake",
            "acceleration",
            "accelerating",
            "idle",
            "speed",
            "behavior",
            "behaviour",
        ]
    ):

        issues = driving.get(
            "issues",
            []
        )

        issue_text = ""

        if issues:
            issue_text = (
                " The backend identified these areas: "
                + "; ".join(
                    str(item)
                    for item in issues[:4]
                )
                + "."
            )

        return (
            f"Your driving efficiency score is "
            f"{driving_score:.0f}/100, rated "
            f"{driving_rating}. "
            f"Your average speed is "
            f"{_number(driving.get('average_speed_kmh')):.0f} "
            f"km/h and maximum speed is "
            f"{_number(driving.get('max_speed_kmh')):.0f} "
            f"km/h. "
            f"You recorded "
            f"{driving.get('hard_accelerations', 0)} "
            f"hard acceleration events and "
            f"{driving.get('hard_brakings', 0)} "
            f"hard braking events, with "
            f"{_number(driving.get('idle_minutes')):.0f} "
            f"minutes of idling."
            f"{issue_text}"
        )

    # -----------------------------------------------------
    # ROUTE QUESTIONS
    # -----------------------------------------------------

    if any(
        word in question
        for word in [
            "route",
            "road",
            "path",
            "which way",
            "destination",
        ]
    ):

        return (
            f"The EcoDrive route comparison currently "
            f"recommends {recommended_route}. "
            f"The route analysis estimates about "
            f"{fuel_saved:.3f} L of fuel savings, "
            f"₹{cost_saved:.2f} in cost savings and "
            f"{route_co2_reduction:.3f} kg of CO₂ reduction "
            f"compared with the alternative. "
            f"These are prototype route estimates based "
            f"on the route distances and traffic levels "
            f"provided to the local EcoDrive pipeline."
        )

    # -----------------------------------------------------
    # ECO SCORE QUESTIONS
    # -----------------------------------------------------

    if any(
        word in question
        for word in [
            "eco score",
            "score",
            "rating",
            "green",
            "improve",
            "improvement",
            "better",
            "optimize",
            "optimization",
        ]
    ):

        return (
            f"Your current Eco Performance Score is "
            f"{eco_score:.1f}/100, with a rating of "
            f"{eco_rating}. "
            f"Your vehicle efficiency score is "
            f"{vehicle_score:.0f}/100 and your driving "
            f"behavior score is "
            f"{driving_score:.0f}/100. "
            f"The biggest practical improvements are to "
            f"use smoother throttle inputs, anticipate "
            f"slowdowns, reduce unnecessary idling and "
            f"choose lower-congestion routes when "
            f"appropriate."
        )

    # -----------------------------------------------------
    # GENERAL HELP
    # -----------------------------------------------------

    if any(
        word in question
        for word in [
            "hello",
            "hi",
            "hey",
            "help",
            "what can you do",
        ]
    ):

        return (
            "I’m your EcoDrive AI Assistant. "
            "I can explain your fuel prediction, driving "
            "behavior, CO₂ impact, route recommendation "
            "and Eco Performance Score. "
            "Try asking: "
            "\"How can I reduce my fuel consumption?\" "
            "or "
            "\"What is my current CO₂ impact?\""
        )

    # -----------------------------------------------------
    # GENERAL CONTEXT-AWARE RESPONSE
    # -----------------------------------------------------

    return (
        f"I can help you interpret your current EcoDrive "
        f"analysis. Your Eco Performance Score is "
        f"{eco_score:.1f}/100, your predicted fuel "
        f"consumption is {predicted_fuel:.3f} L/100 km, "
        f"and your estimated CO₂ intensity is "
        f"{co2_per_km * 1000:.0f} g/km. "
        f"Ask me specifically about fuel, driving behavior, "
        f"routes, CO₂ emissions or your eco score and "
        f"I’ll explain the relevant result."
    )


# =========================================================
# AI ASSISTANT CHAT ENDPOINT
# =========================================================

@app.post("/api/eco-drive/chat")
def eco_drive_chat(
    request: EcoDriveChatRequest
):

    try:

        reply = generate_assistant_reply(
            message=request.message,
            analysis=request.analysis,
            context=request.context,
        )

        return {
            "success": True,
            "reply": reply,
            "source": "ecodrive-local-assistant",
            "session_id": request.session_id,
            "backend_connected": True,
        }

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                f"EcoDrive Assistant error: {exc}"
            ),
        ) from exc