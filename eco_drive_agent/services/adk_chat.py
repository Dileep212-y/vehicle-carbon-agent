import asyncio
import os
from typing import Any

from google.genai import types


# ============================================================
# ECO DRIVE AI — ADK CHAT SERVICE
# ============================================================

APP_NAME = "eco_drive_ai"
DEFAULT_USER_ID = "ecodrive-web-user"

MAX_LLM_CALLS = 6
ATTEMPT_TIMEOUT_SECONDS = 18
MAX_ATTEMPTS = 2
RETRY_DELAY_SECONDS = 1

_runner = None
_runner_lock = asyncio.Lock()


# ============================================================
# SAFE HELPERS
# ============================================================

def _number(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _text(value: Any, default: str = "Unknown") -> str:
    if value is None:
        return default

    text = str(value).strip()

    return text if text else default


def _get_nested(data: dict, *keys, default=None):
    current = data

    for key in keys:
        if not isinstance(current, dict):
            return default

        current = current.get(key)

        if current is None:
            return default

    return current


# ============================================================
# GET ADK RUNNER
# ============================================================

async def _get_runner():
    """
    Create the Google ADK in-memory runner once per backend process.
    """

    global _runner

    if _runner is not None:
        return _runner

    async with _runner_lock:

        if _runner is not None:
            return _runner

        if not os.getenv("GOOGLE_API_KEY"):
            raise RuntimeError(
                "GOOGLE_API_KEY is not configured. "
                "Add it to eco_drive_agent/.env."
            )

        from google.adk.runners import InMemoryRunner

        from ..agent import root_agent

        _runner = InMemoryRunner(
            agent=root_agent,
            app_name=APP_NAME,
        )

    return _runner


# ============================================================
# RUN REAL GOOGLE ADK AGENT
# ============================================================

async def _run_agent(
    runner,
    user_id: str,
    session_id: str,
    content: types.Content,
):
    """
    Execute one Google ADK conversational turn.
    """

    from google.adk.agents.run_config import RunConfig

    run_config = RunConfig(
        max_llm_calls=MAX_LLM_CALLS
    )

    final_text = ""
    final_author = None
    event_count = 0
    tool_events = []

    async for event in runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=content,
        run_config=run_config,
    ):

        event_count += 1

        author = getattr(
            event,
            "author",
            None,
        )

        if author:
            final_author = author

        tool_call = getattr(
            event,
            "tool_call",
            None,
        )

        if tool_call:
            tool_events.append(
                str(tool_call)
            )

        if event.is_final_response():

            event_content = getattr(
                event,
                "content",
                None,
            )

            if event_content:

                parts = (
                    getattr(
                        event_content,
                        "parts",
                        None,
                    )
                    or []
                )

                text_parts = []

                for part in parts:

                    text = getattr(
                        part,
                        "text",
                        None,
                    )

                    if text:
                        text_parts.append(
                            text
                        )

                if text_parts:

                    final_text = (
                        "\n".join(
                            text_parts
                        )
                        .strip()
                    )

    return {
        "response": final_text,
        "agent": (
            final_author
            or "eco_drive_agent"
        ),
        "event_count": event_count,
        "tool_events": tool_events,
    }


# ============================================================
# ERROR CLASSIFICATION
# ============================================================

def _is_retryable_error(
    exc: Exception,
) -> bool:

    text = str(exc).lower()

    retry_words = (
        "503",
        "service unavailable",
        "temporarily unavailable",
        "unavailable",
        "high demand",
        "resource exhausted",
        "429",
        "rate limit",
        "deadline exceeded",
        "timeout",
        "timed out",
        "connection reset",
        "connection error",
        "internal server error",
        "500",
        "502",
        "504",
    )

    return any(
        word in text
        for word in retry_words
    )


# ============================================================
# EXTRACT ECO DRIVE CONTEXT
# ============================================================

def _extract_context(
    context: dict | None,
) -> dict:

    if not isinstance(context, dict):
        return {}

    # Frontend normally sends:
    #
    # {
    #     "pipeline": {...}
    # }
    #
    # But we also support:
    #
    # {
    #     "analysis": {
    #         "pipeline": {...}
    #     }
    # }

    pipeline = context.get(
        "pipeline"
    )

    if not isinstance(
        pipeline,
        dict,
    ):

        analysis = context.get(
            "analysis"
        )

        if isinstance(
            analysis,
            dict,
        ):

            pipeline = analysis.get(
                "pipeline"
            )

    if not isinstance(
        pipeline,
        dict,
    ):
        pipeline = context

    vehicle = pipeline.get(
        "vehicle_analysis",
        {},
    )

    driving = pipeline.get(
        "driving_analysis",
        {},
    )

    fuel = pipeline.get(
        "fuel_prediction",
        {},
    )

    route = pipeline.get(
        "route_comparison",
        {},
    )

    carbon = pipeline.get(
        "carbon_impact",
        {},
    )

    eco = pipeline.get(
        "eco_performance",
        {},
    )

    optimization = pipeline.get(
        "optimization",
        {},
    )

    return {
        "pipeline": pipeline,
        "vehicle": (
            vehicle
            if isinstance(
                vehicle,
                dict,
            )
            else {}
        ),
        "driving": (
            driving
            if isinstance(
                driving,
                dict,
            )
            else {}
        ),
        "fuel": (
            fuel
            if isinstance(
                fuel,
                dict,
            )
            else {}
        ),
        "route": (
            route
            if isinstance(
                route,
                dict,
            )
            else {}
        ),
        "carbon": (
            carbon
            if isinstance(
                carbon,
                dict,
            )
            else {}
        ),
        "eco": (
            eco
            if isinstance(
                eco,
                dict,
            )
            else {}
        ),
        "optimization": (
            optimization
            if isinstance(
                optimization,
                dict,
            )
            else {}
        ),
    }


# ============================================================
# INTENT DETECTION
# ============================================================

def _detect_intent(
    message: str,
) -> str:

    text = message.lower().strip()

    # CO2 / emissions
    if any(
        word in text
        for word in (
            "co2",
            "co₂",
            "carbon",
            "emission",
            "emissions",
            "pollution",
        )
    ):
        return "carbon"

    # Route
    if any(
        word in text
        for word in (
            "route",
            "routes",
            "way to travel",
            "which way",
            "best route",
            "fastest route",
            "road choice",
            "which road",
        )
    ):
        return "route"

    # Fuel
    if any(
        word in text
        for word in (
            "fuel",
            "petrol",
            "diesel",
            "mileage",
            "km/l",
            "kmpl",
            "consumption",
            "litre",
            "liter",
        )
    ):
        return "fuel"

    # Driving
    if any(
        word in text
        for word in (
            "driving",
            "driver",
            "acceleration",
            "accelerat",
            "braking",
            "brake",
            "speed",
            "idle",
            "idling",
            "traffic",
            "smooth",
        )
    ):
        return "driving"

    # Eco score
    if any(
        word in text
        for word in (
            "eco score",
            "score",
            "performance",
            "improve my eco",
            "improve my score",
            "rating",
        )
    ):
        return "eco"

    # Vehicle
    if any(
        word in text
        for word in (
            "vehicle",
            "car",
            "engine",
            "powertrain",
            "efficiency",
        )
    ):
        return "vehicle"

    return "general"


# ============================================================
# DETERMINISTIC CONTEXT-AWARE RESPONSES
# ============================================================

def _build_context_response(
    message: str,
    context: dict,
) -> str:

    data = _extract_context(
        context
    )

    intent = _detect_intent(
        message
    )

    vehicle = data["vehicle"]
    driving = data["driving"]
    fuel = data["fuel"]
    route = data["route"]
    carbon = data["carbon"]
    eco = data["eco"]
    optimization = data[
        "optimization"
    ]

    # --------------------------------------------------------
    # VALUES
    # --------------------------------------------------------

    fuel_consumption = _number(
        fuel.get(
            "predicted_fuel_consumption_l_per_100km",
            fuel.get(
                "predicted_fuel_consumption",
                fuel.get(
                    "fuel_consumption_l_per_100km",
                    0,
                ),
            ),
        )
    )

    efficiency = _number(
        fuel.get(
            "equivalent_efficiency_kmpl",
            fuel.get(
                "equivalent_efficiency",
                0,
            ),
        )
    )

    distance = _number(
        data["pipeline"].get(
            "distance_km",
            0,
        )
    )

    co2 = _number(
        carbon.get(
            "co2_emissions_kg",
            carbon.get(
                "trip_co2_kg",
                carbon.get(
                    "total_co2_kg",
                    0,
                ),
            ),
        )
    )

    co2_per_km = _number(
        carbon.get(
            "co2_per_km",
            carbon.get(
                "carbon_intensity_g_per_km",
                carbon.get(
                    "co2_intensity_g_per_km",
                    0,
                ),
            ),
        )
    )

    # If backend gives kg/km, convert to g/km.
    if (
        0 < co2_per_km < 1
    ):
        co2_per_km = (
            co2_per_km * 1000
        )

    driving_score = _number(
        driving.get(
            "driving_efficiency_score",
            0,
        )
    )

    driving_rating = _text(
        driving.get(
            "driving_rating"
        ),
        "Not available",
    )

    eco_score = _number(
        eco.get(
            "eco_performance_score",
            eco.get(
                "score",
                eco.get(
                    "eco_score",
                    0,
                ),
            ),
        )
    )

    recommended_route = _text(
        route.get(
            "recommended_route",
            route.get(
                "best_route",
                route.get(
                    "recommended",
                    "Not available",
                ),
            )
        )
    )

    fuel_saved = _number(
        route.get(
            "fuel_saved_litres",
            route.get(
                "fuel_saved",
                0,
            ),
        )
    )

    cost_saved = _number(
        route.get(
            "cost_saved",
            route.get(
                "cost_saved_inr",
                0,
            ),
        )
    )

    route_co2_reduction = _number(
        route.get(
            "co2_reduction_kg",
            route.get(
                "co2_saved_kg",
                0,
            ),
        )
    )

    average_speed = _number(
        driving.get(
            "average_speed_kmh",
            0,
        )
    )

    max_speed = _number(
        driving.get(
            "max_speed_kmh",
            0,
        )
    )

    hard_accelerations = int(
        _number(
            driving.get(
                "hard_accelerations",
                0,
            )
        )
    )

    hard_brakings = int(
        _number(
            driving.get(
                "hard_brakings",
                0,
            )
        )
    )

    idle_minutes = _number(
        driving.get(
            "idle_minutes",
            0,
        )
    )

    issues = driving.get(
        "issues",
        [],
    )

    if not isinstance(
        issues,
        list,
    ):
        issues = []

    # --------------------------------------------------------
    # FUEL
    # --------------------------------------------------------

    if intent == "fuel":

        if fuel_consumption > 0:

            response = (
                "Based on your current EcoDrive ML analysis, "
                f"your predicted fuel consumption is "
                f"{fuel_consumption:.3f} L/100 km."
            )

            if efficiency > 0:
                response += (
                    f" That corresponds to approximately "
                    f"{efficiency:.3f} km/L."
                )

            if distance > 0:
                response += (
                    f" For your {distance:.1f} km trip, "
                    "reducing aggressive acceleration, "
                    "maintaining smoother speed and "
                    "avoiding unnecessary idling can help "
                    "reduce fuel use."
                )

            return response

        return (
            "The current EcoDrive analysis does not contain "
            "a usable fuel-prediction value yet. Run the "
            "trip analysis again and then ask me about fuel."
        )

    # --------------------------------------------------------
    # CARBON
    # --------------------------------------------------------

    if intent == "carbon":

        if co2 > 0 or co2_per_km > 0:

            response = (
                "Your current EcoDrive carbon analysis "
                "estimates "
            )

            if co2 > 0:
                response += (
                    f"{co2:.3f} kg of CO₂ for the trip"
                )

            if (
                co2 > 0
                and co2_per_km > 0
            ):
                response += (
                    f", with an estimated intensity of "
                    f"{co2_per_km:.0f} g/km"
                )
            elif co2_per_km > 0:
                response += (
                    f"an estimated intensity of "
                    f"{co2_per_km:.0f} g/km"
                )

            response += (
                ". To reduce this impact, focus on "
                "smooth acceleration, smoother braking, "
                "lower unnecessary speed variation and "
                "less idling."
            )

            return response

        return (
            "The current analysis does not contain a usable "
            "CO₂ result yet. Run the EcoDrive trip analysis "
            "first."
        )

    # --------------------------------------------------------
    # DRIVING
    # --------------------------------------------------------

    if intent == "driving":

        if driving_score > 0:

            response = (
                f"Your current driving efficiency score is "
                f"{driving_score:.0f}/100 "
                f"({driving_rating}). "
            )

            if average_speed > 0:
                response += (
                    f"Your average speed is "
                    f"{average_speed:.0f} km/h"
                )

            if max_speed > 0:
                response += (
                    f", with a maximum of "
                    f"{max_speed:.0f} km/h"
                )

            response += "."

            if hard_accelerations > 0:
                response += (
                    f" The analysis detected "
                    f"{hard_accelerations} hard acceleration "
                    "event(s)."
                )

            if hard_brakings > 0:
                response += (
                    f" It also detected "
                    f"{hard_brakings} hard braking event(s)."
                )

            if idle_minutes > 0:
                response += (
                    f" Idling was recorded for approximately "
                    f"{idle_minutes:.0f} minutes."
                )

            if issues:

                clean_issues = [
                    str(item)
                    for item in issues[:3]
                ]

                response += (
                    " Main improvement areas: "
                    + "; ".join(
                        clean_issues
                    )
                    + "."
                )

            return response

        return (
            "The current driving analysis is not available "
            "yet. Run the EcoDrive trip analysis first."
        )

    # --------------------------------------------------------
    # ROUTE
    # --------------------------------------------------------

    if intent == "route":

        if recommended_route != "Not available":

            response = (
                f"The EcoDrive route analysis recommends "
                f"{recommended_route} based on the current "
                "prototype route comparison."
            )

            if fuel_saved > 0:
                response += (
                    f" The comparison estimates about "
                    f"{fuel_saved:.3f} L of fuel saved."
                )

            if cost_saved > 0:
                response += (
                    f" That is approximately ₹"
                    f"{cost_saved:.2f} in fuel cost savings."
                )

            if route_co2_reduction > 0:
                response += (
                    f" Estimated CO₂ reduction is "
                    f"{route_co2_reduction:.3f} kg."
                )

            response += (
                " Note that the current route engine uses "
                "prototype route data rather than live "
                "navigation traffic."
            )

            return response

        return (
            "A route comparison is not available in the "
            "current analysis. Run the trip analysis first."
        )

    # --------------------------------------------------------
    # ECO SCORE
    # --------------------------------------------------------

    if intent == "eco":

        if eco_score > 0:

            response = (
                f"Your current Eco Performance Score is "
                f"{eco_score:.1f}/100."
            )

            if driving_score > 0:
                response += (
                    f" Your driving behavior contributes "
                    f"{driving_score:.0f}/100."
                )

            if fuel_consumption > 0:
                response += (
                    f" The ML model predicts "
                    f"{fuel_consumption:.3f} L/100 km."
                )

            response += (
                " To improve the score, prioritize smoother "
                "acceleration and braking, reduce idling, "
                "maintain a steadier appropriate speed and "
                "choose lower-congestion routes when practical."
            )

            return response

        return (
            "The current Eco Performance Score is not "
            "available yet. Run the complete EcoDrive "
            "analysis first."
        )

    # --------------------------------------------------------
    # VEHICLE
    # --------------------------------------------------------

    if intent == "vehicle":

        vehicle_score = _number(
            vehicle.get(
                "efficiency_score",
                vehicle.get(
                    "vehicle_efficiency_score",
                    0,
                ),
            )
        )

        vehicle_level = _text(
            vehicle.get(
                "efficiency_level",
                vehicle.get(
                    "efficiency_rating"
                ),
            ),
            "Not available",
        )

        if (
            vehicle_score > 0
            or vehicle_level != "Not available"
        ):

            response = (
                "Your current vehicle analysis reports "
            )

            if vehicle_level != "Not available":
                response += (
                    f"a {vehicle_level} efficiency level"
                )

            if vehicle_score > 0:
                response += (
                    f" with an efficiency score of "
                    f"{vehicle_score:.0f}/100"
                )

            response += "."

            if efficiency > 0:
                response += (
                    f" The current ML estimate is "
                    f"{efficiency:.3f} km/L."
                )

            return response

        return (
            "Vehicle analysis data is not available in the "
            "current dashboard context yet."
        )

    # --------------------------------------------------------
    # GENERAL
    # --------------------------------------------------------

    summary_parts = []

    if eco_score > 0:
        summary_parts.append(
            f"Eco Performance Score: "
            f"{eco_score:.1f}/100"
        )

    if driving_score > 0:
        summary_parts.append(
            f"Driving: "
            f"{driving_score:.0f}/100"
        )

    if fuel_consumption > 0:
        summary_parts.append(
            f"Fuel: "
            f"{fuel_consumption:.3f} L/100 km"
        )

    if co2_per_km > 0:
        summary_parts.append(
            f"CO₂ intensity: "
            f"{co2_per_km:.0f} g/km"
        )

    if recommended_route != "Not available":
        summary_parts.append(
            f"Recommended route: "
            f"{recommended_route}"
        )

    if summary_parts:

        return (
            "Here is the current EcoDrive picture: "
            + " | ".join(
                summary_parts
            )
            + ". Ask me specifically about fuel, CO₂, "
              "driving behavior, routes or your eco score "
              "and I will explain that part of the analysis."
        )

    return (
        "I don't have a completed EcoDrive analysis "
        "context yet. Run the trip analysis first, then "
        "ask me about fuel, CO₂, driving behavior, routes "
        "or your eco score."
    )


# ============================================================
# CHECK WHETHER AN ADK RESPONSE IS TOO GENERIC
# ============================================================

def _looks_like_generic_response(
    response: str,
) -> bool:

    if not response:
        return True

    text = response.lower().strip()

    generic_phrases = (
        "run an ecodrive trip analysis first",
        "i'm ready to analyze your drive",
        "i am ready to analyze your drive",
        "ask me about fuel consumption",
        "ask me specifically about fuel",
    )

    return any(
        phrase in text
        for phrase in generic_phrases
    )


# ============================================================
# MAIN CHAT FUNCTION
# ============================================================

async def chat_with_adk(
    message: str,
    session_id: str | None = None,
    user_id: str = DEFAULT_USER_ID,
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Send one conversational turn to the EcoDrive ADK root agent.

    The service first attempts the real Google ADK agent.
    If the model returns a generic/non-useful response while
    dashboard context is available, a deterministic context-aware
    EcoDrive response is returned instead.
    """

    message = (
        message
        .strip()
    )

    if not message:
        raise ValueError(
            "Message cannot be empty."
        )

    session_id = (
        session_id
        or "default"
    )

    # --------------------------------------------------------
    # If dashboard context exists, prepare deterministic answer.
    # --------------------------------------------------------

    context_response = (
        _build_context_response(
            message=message,
            context=context or {},
        )
    )

    # --------------------------------------------------------
    # Try Google ADK.
    # --------------------------------------------------------

    try:

        runner = await _get_runner()

        session = await (
            runner
            .session_service
            .get_session(
                app_name=APP_NAME,
                user_id=user_id,
                session_id=session_id,
            )
        )

        if session is None:

            session = await (
                runner
                .session_service
                .create_session(
                    app_name=APP_NAME,
                    user_id=user_id,
                    session_id=session_id,
                )
            )

        # ----------------------------------------------------
        # Strong prompt instructions.
        # ----------------------------------------------------

        prompt = (
            "You are EcoDrive AI, the intelligent assistant "
            "inside a vehicle carbon-footprinting application.\n\n"

            "Answer the USER REQUEST directly.\n\n"

            "The dashboard context below is PROJECT DATA. "
            "Use it to answer the question.\n\n"

            "IMPORTANT RULES:\n"
            "1. Answer the exact question asked.\n"
            "2. Do not repeat a generic welcome message.\n"
            "3. Do not tell the user to run analysis if "
            "valid dashboard values are already supplied.\n"
            "4. Do not invent numerical values.\n"
            "5. Use the supplied numerical values exactly "
            "when relevant.\n"
            "6. If the user asks about CO2, focus on CO2.\n"
            "7. If the user asks about fuel, focus on fuel.\n"
            "8. If the user asks about driving, focus on driving.\n"
            "9. If the user asks about routes, focus on routes.\n"
            "10. If the user asks about eco score, focus on "
            "the Eco Performance Score.\n"
            "11. Keep the answer practical and concise.\n\n"

            "LATEST ECODRIVE DASHBOARD CONTEXT:\n"
            f"{context or {}}\n\n"

            "USER REQUEST:\n"
            f"{message}\n\n"

            "Now answer the user's request specifically."
        )

        content = types.Content(
            role="user",
            parts=[
                types.Part.from_text(
                    text=prompt
                )
            ],
        )

        last_error = None

        for attempt in range(
            1,
            MAX_ATTEMPTS + 1,
        ):

            try:

                result = await asyncio.wait_for(
                    _run_agent(
                        runner=runner,
                        user_id=user_id,
                        session_id=session.id,
                        content=content,
                    ),
                    timeout=ATTEMPT_TIMEOUT_SECONDS,
                )

                response = (
                    result.get(
                        "response",
                        "",
                    )
                    or ""
                ).strip()

                # ------------------------------------------------
                # Accept a useful ADK answer.
                # ------------------------------------------------

                if response and not (
                    _looks_like_generic_response(
                        response
                    )
                    and context
                ):

                    return {
                        "success": True,
                        "session_id": session.id,
                        "user_id": user_id,
                        "response": response,
                        "agent": result.get(
                            "agent",
                            "eco_drive_agent",
                        ),
                        "event_count": result.get(
                            "event_count",
                            0,
                        ),
                        "tool_events": result.get(
                            "tool_events",
                            [],
                        ),
                    }

                # If Gemini returned a generic response while
                # context is available, use deterministic answer.
                if context:

                    return {
                        "success": True,
                        "session_id": session.id,
                        "user_id": user_id,
                        "response": context_response,
                        "agent": "eco_drive_context_agent",
                        "event_count": result.get(
                            "event_count",
                            0,
                        ),
                        "tool_events": result.get(
                            "tool_events",
                            [],
                        ),
                    }

                last_error = RuntimeError(
                    "ADK completed without a useful response."
                )

            except asyncio.TimeoutError as exc:

                last_error = TimeoutError(
                    "Gemini/ADK attempt "
                    f"{attempt} exceeded "
                    f"{ATTEMPT_TIMEOUT_SECONDS} seconds."
                )

            except Exception as exc:

                last_error = exc

                if not _is_retryable_error(
                    exc
                ):
                    break

            if attempt < MAX_ATTEMPTS:

                await asyncio.sleep(
                    RETRY_DELAY_SECONDS
                )

        # --------------------------------------------------------
        # Deterministic fallback when ADK is unavailable.
        # --------------------------------------------------------

        if context:

            return {
                "success": True,
                "session_id": session.id,
                "user_id": user_id,
                "response": context_response,
                "agent": "eco_drive_context_agent",
                "event_count": 0,
                "tool_events": [],
                "fallback": True,
            }

        raise TimeoutError(
            "EcoDrive ADK could not return a response."
        ) from last_error

    except Exception as exc:

        # --------------------------------------------------------
        # Final context-aware fallback.
        # --------------------------------------------------------

        if context:

            return {
                "success": True,
                "session_id": session_id,
                "user_id": user_id,
                "response": context_response,
                "agent": "eco_drive_context_agent",
                "event_count": 0,
                "tool_events": [],
                "fallback": True,
                "adk_error": str(exc),
            }

        raise