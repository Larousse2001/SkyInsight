"""Pydantic request/response schemas."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class SatisfactionRequest(BaseModel):
    gender: Literal["Female", "Male"] = "Male"
    age: int = Field(40, ge=7, le=100)
    customer_type: Literal["First-time", "Returning"] = "Returning"
    type_of_travel: Literal["Business", "Personal"] = "Business"
    travel_class: Literal["Business", "Economy", "Economy Plus"] = Field("Business", alias="class")
    flight_distance: int = Field(1200, ge=0, le=10000)
    departure_delay: int = Field(0, ge=0)
    arrival_delay: int = Field(0, ge=0)
    departure_and_arrival_time_convenience: int = Field(3, ge=0, le=5)
    ease_of_online_booking: int = Field(3, ge=0, le=5)
    checkin_service: int = Field(3, ge=0, le=5)
    online_boarding: int = Field(3, ge=0, le=5)
    gate_location: int = Field(3, ge=0, le=5)
    onboard_service: int = Field(3, ge=0, le=5)
    seat_comfort: int = Field(3, ge=0, le=5)
    leg_room_service: int = Field(3, ge=0, le=5)
    cleanliness: int = Field(3, ge=0, le=5)
    food_and_drink: int = Field(3, ge=0, le=5)
    inflight_service: int = Field(3, ge=0, le=5)
    inflight_wifi_service: int = Field(3, ge=0, le=5)
    inflight_entertainment: int = Field(3, ge=0, le=5)
    baggage_handling: int = Field(3, ge=1, le=5)

    model_config = {"populate_by_name": True}


class DelayRequest(BaseModel):
    year: int = 2026
    month: int = Field(6, ge=1, le=12)
    arr_flights: float = 200
    arr_del15: float = 40
    carrier_ct: float = 10
    weather_ct: float = 2
    nas_ct: float = 8
    security_ct: float = 0
    late_aircraft_ct: float = 15
    arr_cancelled: float = 1
    arr_diverted: float = 0
    arr_delay: float = 1200
    carrier_delay: float = 500
    weather_delay: float = 100
    nas_delay: float = 300
    security_delay: float = 0
    late_aircraft_delay: float = 600


class PredictionResponse(BaseModel):
    label: str
    probabilities: dict[str, float]
    confidence: float
