class ForecastInterpretRequest(BaseModel):
    forecast_text: str
    category: str = "unknown"

@app.post("/interpret-forecast")
async def interpret_forecast_endpoint(data: ForecastInterpretRequest):
    """
    Interprets a natural language forecast and returns zone color mappings.
    
    Input:
        {
            "forecast_text": "Demand for electronics will spike next week",
            "category": "electronics"
        }
    
    Output:
        {
            "category": "electronics",
            "trend": "increase",
            "affected_zones": ["COMMERCIAL"],
            "color_for_affected_zones": "green",
            "color_for_other_zones": "red"
        }
    """
    result = interpret_forecast(data.forecast_text, data.category)
    return result
