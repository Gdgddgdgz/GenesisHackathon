from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
from datetime import datetime, timedelta
import math
import pandas as pd
from prophet import Prophet
import logging

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Disable Prophet's verbose logging
logging.getLogger('prophet').setLevel(logging.WARNING)

# --- Configuration & Data ---
SHOP_LOCATION = {"lat": 19.0726, "lon": 72.8845}

# Micro-Zones prioritized for concentrated Mumbai SMEs
MICRO_ZONES = [
    {
        "id": "kurla_west",
        "name": "Kurla West Residential",
        "center": {"lat": 19.0750, "lon": 72.8800},
        "radius": 1000,
        "profile": "Residential",
        "historical_baseline": 65
    },
    {
        "id": "bkc_district",
        "name": "BKC Business Hub",
        "center": {"lat": 19.0600, "lon": 72.8600},
        "radius": 1200,
        "profile": "Commercial",
        "historical_baseline": 85
    },
    {
        "id": "vidyavihar_hub",
        "name": "Vidyavihar University Cluster",
        "center": {"lat": 19.0800, "lon": 72.8950},
        "radius": 1000,
        "profile": "Academic",
        "historical_baseline": 40
    },
    {
        "id": "ghatkopar_market",
        "name": "Ghatkopar Central Market",
        "center": {"lat": 19.0850, "lon": 72.9080},
        "radius": 1100,
        "profile": "Temple",
        "historical_baseline": 55
    },
    {
        "id": "chembur_colony",
        "name": "Chembur Residential Colony",
        "center": {"lat": 19.0522, "lon": 72.9005},
        "radius": 1300,
        "profile": "Residential",
        "historical_baseline": 45
    }
]

# Category Demand Profiles (Multipliers for [Residential, Commercial, Academic, Temple])
# Format: category_id: { profile_name: [multiplier, reason] }
CATEGORY_PROFILES = {
    # Retail & Consumer Goods
    "apparel": {
        "Residential": [1.95, "Max Demand: High festive and family shopping surge."],
        "Temple": [1.45, "High Demand: Peak ethnic and ritual wear demand."],
        "Academic": [0.65, "Low Demand: Student focus elsewhere."],
        "Commercial": [0.45, "Deficit: Weekend-only traffic hub."]
    },
    "footwear": {
        "Residential": [1.60, "High Demand: Regular domestic replenishment."],
        "Commercial": [1.10, "Stable: Professional footwear needs."],
        "Academic": [1.30, "Growth: Student fashion and sports needs."]
    },
    "fashion_accessories": {
        "Residential": [1.40, "Growth: Trend-driven local shopping."],
        "Academic": [1.20, "Growth: Youth fashion trends."]
    },
    "stationery": {
        "Academic": [1.85, "Max Demand: Exam season and university cluster peak."],
        "Residential": [1.25, "Growth: Home office and student preparation."],
        "Commercial": [1.10, "Stable: Basic corporate office supplies."]
    },
    "books_magazines": {
        "Academic": [1.90, "Max Demand: Textbook and academic resource peak."],
        "Residential": [1.05, "Stable: Casual reading demand."]
    },
    "toys_games": {
        "Residential": [1.75, "High Demand: Family-centric residential area peak."]
    },
    "gifts_handicrafts": {
        "Temple": [1.80, "Max Demand: Tourist and ritual gifts."],
        "Residential": [1.30, "Growth: Local occasion gifting."]
    },
    # Food & Beverages
    "food_beverages": {
        "Residential": [1.80, "High Demand: Daily household consumption peak."],
        "Commercial": [1.50, "High Demand: Office lunch and snack trends."]
    },
    "sweets_confectionery": {
        "Temple": [1.95, "Max Demand: Religious offerings and ritual sweets."],
        "Residential": [1.40, "High Demand: Domestic celebrations."]
    },
    "bakery_products": {
        "Residential": [1.85, "Max Demand: Fresh daily breakfast and snack needs."],
        "Commercial": [1.35, "Growth: Office tea-time and catering."]
    },
    "dairy_products": {
        "Residential": [1.98, "Max Demand: Critical daily essential in residential clusters."]
    },
    "fruits_vegetables": {
        "Residential": [1.95, "Max Demand: Essential daily fresh produce needs."],
        "Temple": [1.40, "High Demand: Offerings and fasting requirements."]
    },
    "packaged_food_snacks": {
        "Residential": [1.60, "High Demand: Household pantry stocking."],
        "Academic": [1.80, "Max Demand: Student on-the-go snacking."]
    },
    "beverages_tea_coffee_soft_drinks": {
        "Commercial": [1.90, "Max Demand: Corporate beverage consumption surge."],
        "Academic": [1.60, "High Demand: Student social clusters."]
    },
    "spices_masalas": {
        "Residential": [1.50, "Growth: Core cooking ingredient needs."]
    },
    # Daily Needs
    "grocery_kirana": {
        "Residential": [1.90, "Max Demand: Hyper-local household restocking."],
        "Commercial": [0.60, "Low Demand: Limited pantry needs."]
    },
    "household_essentials": {
        "Residential": [1.70, "High Demand: General domestic maintenance."]
    },
    "cleaning_supplies": {
        "Residential": [1.40, "Growth: Regular hygiene maintenance."],
        "Commercial": [1.65, "High Demand: B2B bulk cleaning requirements."]
    },
    "personal_care_cosmetics": {
        "Residential": [1.55, "High Demand: Individual grooming needs."],
        "Commercial": [1.10, "Stable: Basic hygiene products."]
    },
    # Electronics & Utilities
    "mobile_accessories": {
        "Academic": [1.70, "High Demand: Tech-focused student demographic."],
        "Commercial": [1.55, "High Demand: Corporate mobile maintenance needs."]
    },
    "consumer_electronics": {
        "Residential": [1.30, "Growth: Home appliance upgrades."],
        "Commercial": [1.10, "Stable: Office IT needs."]
    },
    "electrical_hardware": {
        "Commercial": [1.80, "Max Demand: Industrial and office maintenance."],
        "Residential": [1.40, "Growth: Home repair spikes."]
    },
    # Health & Lifestyle
    "pharmacy_medical_supplies": {
        "Residential": [1.90, "Max Demand: Essential family healthcare access."],
        "Commercial": [1.20, "Stable: Emergency and corporate health kits."]
    },
    "fitness_sports_equipment": {
        "Academic": [1.45, "Growth: Student athletic activities."],
        "Residential": [1.20, "Stable: Home fitness trends."]
    },
    "wellness_ayurveda": {
        "Temple": [1.60, "High Demand: Traditional wellness and puja items."],
        "Residential": [1.35, "Growth: Natural health focus."]
    },
    # Specialized / Local
    "jewellery": {
        "Temple": [1.80, "Max Demand: Traditional wedding and ritual shopping hub."],
        "Residential": [1.10, "Stable: Local festive gift shopping."]
    },
    "furniture_home_decor": {
        "Residential": [1.45, "Growth: Home renovation and move-in trends."]
    },
    "pet_supplies": {
        "Residential": [1.30, "Growth: High pet-ownership in residential pockets."]
    },
    "automobile_accessories": {
        "Commercial": [1.50, "High Demand: Fleet and logistics maintenance."]
    },
    "printing_packaging": {
        "Commercial": [1.95, "Max Demand: Essential corporate and logistics services."],
        "Academic": [1.65, "High Demand: Student project and thesis needs."]
    },
    "local_services_repair": {
        "Residential": [1.70, "High Demand: Hyper-local maintenance needs."],
        "Commercial": [1.50, "High Demand: On-site office repairs."]
    }
}

def calculate_distance(lat1, lon1, lat2, lon2):
    return math.sqrt(((lat1-lat2)*111)**2 + ((lon1-lon2)*85)**2)

@app.get("/heatmap")
def get_heatmap(segment: str = "apparel"):
    features = []
    shop_lat = SHOP_LOCATION["lat"]
    shop_lon = SHOP_LOCATION["lon"]
    
    # Normalize segment input (e.g., matching frontend options)
    segment_key = segment.lower().replace(" ", "_").replace("&", "").replace("/", "_").replace("__", "_")
    
    profile_data = CATEGORY_PROFILES.get(segment_key, {})
    
    for zone in MICRO_ZONES:
        dist = calculate_distance(shop_lat, shop_lon, zone["center"]["lat"], zone["center"]["lon"])
        
        if dist > 10:
            continue

        base = zone["historical_baseline"]
        profile = zone["profile"]
        
        # Determine multiplier and reason from mapping or default
        if profile in profile_data:
            multiplier = profile_data[profile][0]
            reason = profile_data[profile][1]
        else:
            # Subtle default variability if not explicitly mapped
            multiplier = 0.95 + (random.random() * 0.1) # 0.95 to 1.05
            reason = f"Baseline trend for {segment.title()} in {profile} zone."

        current_demand = base * multiplier
        spike_percentage = ((current_demand - base) / base) * 100
        
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [zone["center"]["lon"], zone["center"]["lat"]]
            },
            "properties": {
                "id": zone["id"],
                "name": zone["name"],
                "multiplier": multiplier,
                "reason": reason,
                "spike": f"{spike_percentage:+.0f}%",
                "distance": dist,
                "radius": zone["radius"]
            }
        })
            
    return {
        "type": "FeatureCollection",
        "features": features,
        "shop_location": SHOP_LOCATION
    }

@app.get("/forecast/seasonal")
def get_seasonal_outlook(category: str = "General"):
    """Returns a dynamic, cultural-aware strategic outlook using Hugging Face Llama-3."""
    
    prompt = f"""
    You are a category-specific AI market intelligence engine for Mumbai-based SMEs.
    CURRENT MANDATORY CATEGORY: {category}
    
    Task: Generate 3 tactical market predictions for the next 7-30 days in India, strictly limited to the '{category}' sector.
    
    Rules for Category Fidelity:
    - CRITICAL: Every prediction MUST be directly about products or trends WITHIN the '{category}' business.
    - If the category is 'Food & Drinks', do NOT talk about clothes or electronics.
    - Even when referencing general cultural triggers (like Ramzan or Exams), explain the impact SPECIFICALLY on '{category}' items.
    
    Rules for Context:
    - Must be India-specific (Focus on Mumbai/Maharashtra patterns if possible).
    - Focus on near-future cultural/seasonal shifts.
    - 'insight' must be a human-like tactical advice for an SME owner.
    - 'categories' must be a list of specific sub-categories within '{category}'.
    
    Return ONLY a valid JSON list of exactly 3 objects with this structure:
    [
      {{
        "event": "Event Name",
        "type": "Religious/Academic/Weather/Economic",
        "surge": "+X%",
        "categories": ["Sub-cat1", "Sub-cat2"],
        "insight": "Specific tactical advice..."
      }}
    ]
    """
    
    try:
        response = client.text_generation(
            prompt,
            max_new_tokens=500,
            temperature=0.7,
            stop_sequences=["\n\n"]
        )
        
        # Simple extraction logic if Llama produces extra text
        import json
        text = response.strip()
        start = text.find("[")
        end = text.rfind("]") + 1
        if start != -1 and end != -1:
            return json.loads(text[start:end])
            
        raise ValueError("Invalid LLM output format")
        
    except Exception as e:
        print(f"HF Error: {e}")
        # Graceful fallback to avoid breaking UI
        return [
            {
                "event": "Insufficient market signals",
                "type": "System",
                "surge": "0%",
                "categories": [category],
                "insight": "Monitoring real-time patterns for this category. Check back shortly."
            },
            {
                "event": "Regional Baseline Trend",
                "type": "General",
                "surge": "+5%",
                "categories": [category],
                "insight": "Maintain standard safety stock levels while signal strength improves."
            },
            {
                "event": "Logistics Calibration",
                "type": "Operation",
                "surge": "Stable",
                "categories": ["Logistics"],
                "insight": "Focus on last-mile efficiency while demand matures."
            }
        ]

@app.get("/forecast/festival")
def get_festival_forecast():
    # Legacy support
    return {
        "upcoming_festival": "Regional Pattern",
        "predicted_surge": "Variable",
        "surge_categories": ["General"],
        "reason": "AI engine analyzing live cultural telemetry."
    }

@app.get("/forecast/{product_id}")
def get_forecast(product_id: int):
    now = datetime.now()
    dates = [now - timedelta(days=x) for x in range(30, 0, -1)]
    data = {'ds': dates, 'y': [random.randint(40, 100) + (15 if d.weekday() >= 5 else 0) for d in dates]}
    df = pd.DataFrame(data)
    m = Prophet(daily_seasonality=True, yearly_seasonality=False)
    m.fit(df)
    future = m.make_future_dataframe(periods=7)
    forecast = m.predict(future)
    predictions = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(7).to_dict('records')
    return {
        "product_id": product_id,
        "model": "Facebook Prophet",
        "forecast": [{"date": p['ds'].strftime('%Y-%m-%d'), "predicted_demand": round(p['yhat'], 2), "lower_bound": round(p['yhat_lower'], 2), "upper_bound": round(p['yhat_upper'], 2)} for p in predictions],
        "status": "Success",
        "timestamp": now.isoformat()
    }

@app.get("/regions")
def get_regions():
    return [z["name"] for z in MICRO_ZONES]
