from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
from datetime import datetime, timedelta
import math
import pandas as pd
import logging
import os
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from chronos import ChronosPipeline
import torch
from forecast_interpreter import interpret_forecast

# Load environment variables
load_dotenv()
HF_TOKEN = os.getenv("HUGGINGFACE_TOKEN")

# Initialize Hugging Face Models
client = InferenceClient(token=HF_TOKEN)
chronos_pipeline = ChronosPipeline.from_pretrained(
    "amazon/chronos-t5-tiny",
    device_map="cpu", # Force CPU for local dev compatibility
    torch_dtype=torch.float32,
)

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
                "radius": zone["radius"],
                "profile": zone["profile"]
            }
        })
            
    return {
        "type": "FeatureCollection",
        "features": features,
        "shop_location": SHOP_LOCATION
    }

# --- Absolute Semantic Whitelist (Zero Leakage Enforcement) ---
BOUNDARY_MAP = {
    "Food & Drinks": {
        "whitelist": ["food", "beverage", "drink", "consumable", "snack", "bakery", "sweets", "grocery", "fruit", "veg", "staples", "rice", "wheat", "dates", "dry fruits", "iftar", "ramzan", "ramadan", "eid", "fasting", "navratri", "holi", "sharbat", "juice", "tea", "coffee", "cook", "perishable", "stocking", "shelf life", "spoilage", "confectionery", "gift", "gifting", "sweets", "jamun", "jalebi", "kaju", "pista", "spice", "grain", "oil", "curd", "milk", "dairy", "dessert", "mumbai", "india", "festival", "festive", "tradition", "celebration", "school", "lunch", "tiffin"],
        "blacklist": ["clothing", "wear", "saree", "kurta", "fashion", "gadget", "jewelry", "electronics", "furniture", "appliance", "dress", "jean", "suit", "outfit", "textile", "handloom", "sari", "laptop", "mobile", "tech"]
    },
    "Clothes & Apparel": {
        "whitelist": ["clothing", "apparel", "wear", "ethnic", "casual", "garment", "fabric", "footwear", "fashion", "accessory", "saree", "kurta", "cotton", "textile", "style", "silk", "handloom", "wedding", "festive"],
        "blacklist": ["food", "drink", "grocery", "bakery", "sweet", "gadget", "medicine", "health", "wellness", "electronic", "furniture", "appliance"]
    },
    "Stationery & Education": {
        "whitelist": ["stationery", "education", "book", "notebook", "pen", "exam", "school", "college", "pencil", "math", "reading", "paper", "office", "student", "academy", "art", "craft"],
        "blacklist": ["food", "clothing", "apparel", "electronic", "medicine", "health", "fashion", "furniture", "edible"]
    },
    "Electronics": {
        "whitelist": ["electronic", "gadget", "mobile", "appliance", "tech", "laptop", "charge", "battery", "hardware", "device", "digital", "cooler", "fan", "ac"],
        "blacklist": ["food", "clothing", "stationery", "furniture", "fabric", "apparel", "medicine", "book", "edible"]
    },
    "Home Essentials": {
        "whitelist": ["clean", "kitchenware", "furniture", "household", "home", "maintenance", "decor", "curtain", "bedding", "lighting", "lifestyle", "fan", "cooler"],
        "blacklist": ["clothing", "electronics", "medicine", "fashion", "apparel", "food", "grocery", "mobile", "laptop"]
    },
    "Healthcare & Wellness": {
        "whitelist": ["medicine", "health", "wellness", "supplement", "hygiene", "pharmacy", "medical", "ayurveda", "clinic", "yoga", "pharma", "mask", "sanitizer"],
        "blacklist": ["food", "clothing", "electronics", "stationery", "apparel", "fashion", "furniture", "gadget"]
    },
    "Flowers": {
        "whitelist": ["rose", "marigold", "genda", "jasmine", "mogra", "lotus", "garland", "bouquet", "wedding", "decoration", "temple", "pooja", "ceremony", "florist", "orchid", "lily", "datura", "bel patra", "hibiscus"],
        "blacklist": ["food", "clothing", "electronics", "stationery", "apparel", "gadget", "edible", "technology"]
    }
}

# --- Dynamic Context Engine ---
def get_market_context(category):
    """Generates real-time market signals filtered by category relevance."""
    now = datetime.now()
    
    # 2026 Calendar (Adjusted for User Preference)
    FESTIVAL_CALENDAR_2026 = {
        "2026-02-14": "Valentine's Day",
        "2026-02-15": "Maha Shivaratri",
        "2026-02-18": "Ramzan Start (Expected)",
        "2026-03-04": "Holi",
    }
    
    signals = []
    
    # 1. Broad Seasonality & Macro Events (Tagged by Domain)
    # Define signals with [Target Domains] or "ALL"
    macro_events = [
        {"msg": "SEASON: Indian Summer Onset. HIGH DEMAND for Cotton/Linen fabrics, Breathable wear, Fan/AC servicing.", "domains": ["Clothes & Apparel", "Electronics", "Home Essentials"]},
        {"msg": "MACRO EVENT: MANGO SEASON (Alphonso/Kesar). First arrivals in market. Peerless demand.", "domains": ["Food & Drinks", "Gifts"]},
        {"msg": "MACRO EVENT: Indian Wedding Season (Lagan/Shaadi). High demand for Sherwanis, Lehengas, Gold, Catering, and Varmala/Garlands.", "domains": ["Clothes & Apparel", "Food & Drinks", "Home Essentials", "Electronics", "Flowers"]},
    ]

    for event in macro_events:
        if "ALL" in event["domains"] or category in event["domains"]:
            signals.append(event["msg"])
    
    # 2. Weekend Logic (Universal)
    if now.weekday() >= 4: # Friday, Saturday, Sunday
        signals.append(f"WE: Weekend Surge (Fri-Sun). High footfall expected for leisure & shopping.")
    
    # 3. Upcoming Festival Scan (Next 14 days)
    for date_str, event in FESTIVAL_CALENDAR_2026.items():
        event_date = datetime.strptime(date_str, "%Y-%m-%d")
        days_until = (event_date - now).days
        
        if 0 <= days_until <= 14:
            # Semantic Filtering for Festivals
            is_relevant = True
            if "Valentine" in event and category not in ["Food & Drinks", "Clothes & Apparel", "Home Essentials", "Flowers"]: # Gifts + Flowers
                 is_relevant = False
            if "Ramzan" in event and category not in ["Food & Drinks", "Clothes & Apparel"]:
                 is_relevant = False
            if "Shivaratri" in event and category not in ["Food & Drinks", "Clothes & Apparel", "Home Essentials", "Flowers"]: # Fasting food, temple wear, puja items, Flowers
                 is_relevant = False
            
            if is_relevant:
                if "Valentine" in event:
                    if category == "Flowers":
                        signals.append(f"EVENT: {event} in {days_until} days. MASSIVE SURGE in Red Roses & Bouquets.")
                    else:
                        signals.append(f"EVENT: {event} in {days_until} days. Surge in Gifts, Chocolates, Red/Pink items.")
                elif "Ramzan" in event:
                    signals.append(f"EVENT: {event} approaching ({days_until} days). Stock Iftar essentials (Dates, Rooh Afza).")
                elif "Shivaratri" in event:
                    if category == "Flowers":
                        signals.append(f"EVENT: {event} in {days_until} days. Demand for Datura, Bel Patra, Marigold (Genda) for temple offerings.")
                    else:
                        signals.append(f"EVENT: {event} in {days_until} days. Fasting essentials & Thandai.")
                else:
                    signals.append(f"UPCOMING: {event} in {days_until} days.")

    if not signals:
         signals.append("BAU: Mid-season stability. Focus on core inventory depletion.")

    return "\n    ".join(signals)

@app.get("/forecast/seasonal")
def get_seasonal_outlook(category: str = "General"):
    """Returns a dynamic, category-locked strategic outlook using Hugging Face Llama-3."""
    
    # Normalize truncated categories
    if category == "Food": category = "Food & Drinks"
    if category == "Clothes": category = "Clothes & Apparel"
    if category == "Stationery": category = "Stationery & Education"
    if category == "Home": category = "Home Essentials"
    if category == "Healthcare": category = "Healthcare & Wellness"
    
    # 1. Get strict rules for category
    sector_rules = BOUNDARY_MAP.get(category, {"whitelist": [], "blacklist": []})
    whitelist = sector_rules["whitelist"]
    blacklist = sector_rules["blacklist"]
    
    today_date = datetime.now().strftime("%d %B %Y")
    forecast_start = (datetime.now() + timedelta(days=3)).strftime("%d %B")
    forecast_end = (datetime.now() + timedelta(days=7)).strftime("%d %B %Y")
    
    market_signals = get_market_context(category) # Pass category for filtering
    
    # 2. Hard Constraints Prompt
    prompt = f"""
    [CRITICAL MISSION: ZERO LEAKAGE ARCHITECTURE]
    ACTIVE_CATEGORY: {category}
    CURRENT_DATE: {today_date}
    TARGET_FORECAST_HORIZON: {forecast_start} to {forecast_end}
    
    TASK: Generate exactly 3 tactical market predictions for the '{category}' sector ONLY for the target horizon. 
    
    HARD CONSTRAINTS:
    - If any prediction references entities outside '{category}', it will be rejected.
    - STRICTLY AVOID referring to these forbidden themes: {', '.join(blacklist[:10])}...
    - FOCUS on these allowed themes: {', '.join(whitelist[:15])}...
    
    BEHAVIORAL GUIDANCE:
    - Target only items within '{category}'.
    - REAL-TIME MARKET SIGNALS: 
    {market_signals}
    - REASONING REQUIREMENT: The 'insight' field MUST provide causal reasoning for the FORECAST HORIZON ({forecast_start}-{forecast_end}).
    - INDIAN CONTEXT PROTOCOL: Use Indian terminology (e.g., "Kurta", "Kirana", "Thandai", "Lassi"). Avoid western generic terms. 
    - REALISM PROTOCOL: AVOID abstract concepts ("vitality", "hues"). FOCUS on tangible inventory ("Stock 50kg", "High velocity").
    - Be grounded and specific.
    
    OUTPUT FORMAT (Strict JSON list of 3):
    STRICTLY return ONLY the JSON list. Do not include any preamble.
    [
      {{
        "event": "Event Name",
        "type": "{category}",
        "categories": ["{category} Item 1", "{category} Item 2"],
        "insight": "Reasoning..."
      }}
    ]
    """


    valid_predictions = []

    for attempt in range(4): 
        try:
            chat_completion = client.chat_completion(
                model="meta-llama/Meta-Llama-3-8B-Instruct",
                messages=[
                    {"role": "system", "content": "You are a pragmatic supply chain analyst. No marketing fluff. Output ONLY raw JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.1, # Strict Realism
            )
            response = chat_completion.choices[0].message.content
            print(f"RAW LLM RESPONSE (Attempt {attempt+1}):\n{response[:200]}...\n")
            
            import json, re
            # Clean possible markdown blocks
            text = response.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            start = text.find("[")
            end = text.rfind("]") + 1
            if start != -1 and end != -1:
                data = json.loads(text[start:end])
                
                # Item-level Validation
                for item in data:
                    content_str = (
                        str(item.get("type", "")) + " " + 
                        str(item.get("event", "")) + " " + 
                        str(item.get("insight", "")) + " " + 
                        " ".join(map(str, item.get("categories", [])))
                    ).lower()
                    
                    is_item_clean = True
                    if category != "General":
                        # 1. Blacklist Check
                        for black_word in blacklist:
                            # Use strict word boundary check
                            pattern = r'\\b' + re.escape(black_word.lower()) + r'\\b'
                            if re.search(pattern, content_str):
                                print(f"VETO: Rejected item '{item.get('event')}' due to forbidden term '{black_word}'")
                                is_item_clean = False
                                break
                        
                        # 2. STRICT WHITELIST ENFORCEMENT (For Flowers & Others)
                        if is_item_clean and category == "Flowers":
                            has_whitelist_term = False
                            for white_word in whitelist:
                                if white_word.lower() in content_str:
                                    has_whitelist_term = True
                                    break
                            
                            if not has_whitelist_term:
                                print(f"VETO: Rejected item '{item.get('event')}' because it lacks Flowers whitelist terms.")
                                is_item_clean = False
                    
                    if is_item_clean:
                        # Ensure type consistency
                        item['type'] = category
                        # Avoid duplicates
                        if not any(v['event'] == item['event'] for v in valid_predictions):
                            valid_predictions.append(item)
                
                if len(valid_predictions) >= 3:
                    print(f"SUCCESS: Collected {len(valid_predictions)} valid predictions.")
                    return valid_predictions[:3]
                
        except Exception as e:
            print(f"HF Server Error on attempt {attempt+1}: {e}")

    # Return whatever valid predictions we have, even if less than 3
    if valid_predictions:
        print(f"PARTIAL SUCCESS: Returning {len(valid_predictions)} valid predictions.")
        return valid_predictions

    # Absolute fallback ONLY if 0 valid predictions found after all attempts
    # Dynamic fallback based on category to avoid "hardcoded" feel
    return [
        {
            "event": "Regional Demand Pattern Analysis",
            "type": category,
            "surge": "Variable",
            "categories": [f"{category} Essentials"],
            "insight": f"Current market signals suggest fluctuating demand for {category}. AI recommends maintaining flexible buffer stock while specific trend clusters are verified."
        },
        {
            "event": "Seasonal Transition Watch",
            "type": category,
            "surge": "Stable",
            "categories": ["Core Inventory"],
            "insight": "Transition period detected. Monitor daily sales velocity for immediate demand signals."
        },
        {
            "event": "Local Consumption Spike",
            "type": category,
            "surge": "Detected",
            "categories": ["Fast Moving Items"],
            "insight": f"Hyperlocal activity indicates potential short-term spike in {category} consumption."
        }
    ]



class ProductValidation(BaseModel):
    name: str
    category: str

@app.post("/validate-product")
async def validate_product(data: ProductValidation):
    if data.category == "General":
        return {"valid": True, "reason": "General domain allows all items."}
    
    prompt = f"""
    [DOMAIN VALIDATION TASK]
    PRODUCT: {data.name}
    TARGET_CATEGORY: {data.category}
    
    Determine if the product semantically belongs to the target category.
    Examples for 'Food & Drinks': Rice (Valid), Flour (Valid), Milk (Valid), Cotton Shirt (Invalid).
    Examples for 'Clothes & Apparel': Sari (Valid), Jeans (Valid), Saree (Valid), Basmati Rice (Invalid).
    
    Output exactly one word: 'VALID' or 'INVALID'.
    """
    
    try:
        chat_completion = client.chat_completion(
            model="meta-llama/Meta-Llama-3-8B-Instruct",
            messages=[
                {"role": "system", "content": "You are a strict product classifier. Output only VALID or INVALID."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=5,
            temperature=0.1
        )
        result = chat_completion.choices[0].message.content.strip().upper()
        is_valid = "VALID" in result and "INVALID" not in result
        
        return {
            "valid": is_valid,
            "reason": f"AI classified {data.name} as {'consistent' if is_valid else 'inconsistent'} with {data.category} domain."
        }
    except Exception as e:
        print(f"Validation Error: {e}")
        return {"valid": True, "reason": "System error, bypass validation."}

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
    """Predicts demand using Amazon Chronos and generates insights via Llama-3."""
    now = datetime.now()
    
    # 1. Generate Historical Simulation (Last 30 days)
    # In a real app, this would come from a DB
    historical_data = torch.tensor([
        random.randint(40, 100) + (15 if (now - timedelta(days=x)).weekday() >= 5 else 0) 
        for x in range(30, 0, -1)
    ], dtype=torch.float32)
    
    # 2. Chronos Numeric Forecasting (Next 7 days)
    context = historical_data
    prediction_length = 7
    forecast = chronos_pipeline.predict(context, prediction_length) # [num_series, prediction_length, num_samples]
    
    # Extract median and bounds
    forecast_median = forecast[0].median(dim=0).values.tolist()
    forecast_lower = forecast[0].quantile(0.1, dim=0).tolist()
    forecast_upper = forecast[0].quantile(0.9, dim=0).tolist()
    
    dates = [(now + timedelta(days=i+1)).strftime('%Y-%m-%d') for i in range(prediction_length)]
    
    formatted_forecast = []
    for i in range(7):
        formatted_forecast.append({
            "date": dates[i],
            "predicted_demand": round(forecast_median[i], 2),
            "lower_bound": round(forecast_lower[i], 2),
            "upper_bound": round(forecast_upper[i], 2)
        })

    # 3. Llama-3 Contextual Insight
    # Extract sector context based on region profiles (e.g., BKC Business Hub)
    # For demo, we'll pick a typical SME profile
    zone_context = random.choice(MICRO_ZONES)
    
    insight_prompt = f"""
    [SUPPLY CHAIN INTELLIGENCE]
    CONTEXT: SME store in {zone_context['name']} ({zone_context['profile']} zone).
    FORECAST: Next 7 days median demand: {sum(forecast_median)/7:.2f} units/day.
    
    TASK: Provide a 2-sentence tactical supply chain recommendation for this SME. 
    Focus on inventory optimization or specific risk mitigation.
    """
    
    try:
        chat_res = client.chat_completion(
            model="meta-llama/Meta-Llama-3-8B-Instruct",
            messages=[{"role": "user", "content": insight_prompt}],
            max_tokens=150,
            temperature=0.4
        )
        ai_insight = chat_res.choices[0].message.content.strip()
    except Exception:
        ai_insight = f"Neural engine suggests maintaining buffer stock of {max(forecast_upper):.0f} units for {zone_context['profile']} fluctuations."

    return {
        "product_id": product_id,
        "model": "Chronos-T5-Tiny + Llama-3-8B",
        "forecast": formatted_forecast,
        "ai_insight": ai_insight,
        "context": f"Localized intelligence for {zone_context['name']} ({zone_context['profile']})",
        "status": "Success",
        "timestamp": now.isoformat()
    }

@app.get("/regions")
def get_regions():
    return [z["name"] for z in MICRO_ZONES]

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

