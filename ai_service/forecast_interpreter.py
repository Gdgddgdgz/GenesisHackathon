"""
Deterministic Forecast-to-Geospatial Interpreter
Converts natural language forecasts into zone color mappings
"""

CATEGORY_ZONE_MAP = {
    "electrical_appliances": ["RESIDENTIAL"],
    "electronics": ["COMMERCIAL"],
    "furniture": ["RESIDENTIAL", "COMMERCIAL"],
    "groceries": ["RESIDENTIAL", "RETAIL"],
    "flowers": ["RESIDENTIAL", "COMMERCIAL"],
    "food": ["RESIDENTIAL", "RETAIL"],
    "apparel": ["COMMERCIAL", "RETAIL"],
    "stationery": ["COMMERCIAL"],
    "unknown": []
}

ALLOWED_TRENDS = ["increase", "decrease", "stable", "unknown"]

def interpret_forecast(forecast_text: str, category: str = "unknown") -> dict:
    """
    Interprets a forecast and returns zone color mappings.
    
    Args:
        forecast_text: Natural language demand forecast
        category: Product category (e.g., 'groceries', 'electronics')
    
    Returns:
        dict with category, trend, affected_zones, and color mappings
    """
    # Normalize category
    category = category.lower().replace(" ", "_").replace("&", "").replace("__", "_")
    
    # Determine trend from forecast text
    forecast_lower = forecast_text.lower()
    
    if any(word in forecast_lower for word in ["surge", "increase", "spike", "rise", "grow", "boom", "high demand", "peak", "bullish", "uptick", "expansion"]):
        trend = "increase"
    elif any(word in forecast_lower for word in ["decrease", "drop", "fall", "decline", "reduce", "low demand", "bearish", "slump", "downturn", "contraction"]):
        trend = "decrease"
    elif any(word in forecast_lower for word in ["stable", "steady", "maintain", "consistent", "unchanged", "plateau"]):
        trend = "stable"

    else:
        trend = "unknown"
    
    # Get affected zones from mapping
    affected_zones = CATEGORY_ZONE_MAP.get(category, [])
    
    # Determine colors based on trend
    if trend == "increase":
        color_for_affected = "green"
        color_for_others = "red"
    elif trend == "decrease":
        color_for_affected = "red"
        color_for_others = "green"
    else:  # stable or unknown
        # Be more decisive: non-surging zones represent low immediate opportunity
        color_for_affected = "red" 
        color_for_others = "red"

    
    return {
        "category": category if category in CATEGORY_ZONE_MAP else "unknown",
        "trend": trend,
        "affected_zones": affected_zones,
        "color_for_affected_zones": color_for_affected,
        "color_for_other_zones": color_for_others
    }
