# Location Intelligence Platform - Quick Start

## 🚀 Getting Started

### 1. Navigate to Location Intel
- Start the app (if not running): `npm run dev` in `/client`
- Open: http://localhost:5173/map-intel
- Or click **"🌍 Location Intel"** in the sidebar

### 2. How to Use

#### Set Anchor Point
1. Click anywhere in India on the map
2. A **red marker** appears at your anchor
3. A **blue 15km radius circle** is drawn automatically

#### View Zones
- Colored markers appear for zones within 15km:
  - 🟢 **Green** = Residential
  - 🟠 **Orange** = Commercial  
  - 🟣 **Purple** = Mixed-Use
  - ⚫ **Gray** = Industrial

#### Get Insights
1. Click any zone marker
2. View the **Gemini-powered insight** in the sidebar:
   - Zone type and distance
   - Community context
   - Business recommendation

### 3. Example Locations to Try

**Mumbai (Vidyavihar)**:
- Click near: `19.0822, 72.8978`
- Expect: Residential, Mixed-Use, and Commercial zones

**Delhi (Chandni Chowk)**:
- Click near: `28.6506, 77.2303`
- Expect: Historic mixed-use zones

**Bangalore (Koramangala)**:
- Click near: `12.9352, 77.6245`
- Expect: Tech hub commercial zones

---

## 🔧 Technical Details

### Strict Radius Rule
- **ALL analysis confined to 15km**
- No global comparisons
- No city-level summaries
- **Radius enforcement:** Haversine distance calculation

### Data Coverage
Currently includes **18 pre-seeded zones** across:
- Mumbai (6 zones)
- Delhi (4 zones)
- Bangalore (3 zones)
- Chennai (2 zones)
- Kolkata (2 zones)
- Other major cities (1 zone)

### Gemini Output Format
Every insight follows the **strict 3-line format**:
```
[Area Type] Zone — [X.X km from anchor]
Aggregated community & activity context.
Recommended Action: Specific business step.
```

---

## ⚙️ Environment Setup

**Already Configured:**
- ✅ Mapbox Token: `pk.eyJ1IjoiZ2RnZGRnZG...`
- ✅ Gemini API: Configured in `server/.env`

**To Expand:**
Add more zones to `server/db/zones.js` following the existing pattern.

---

## 🎯 System Architecture

```
User Click (Mapbox) 
    ↓
Frontend: Turf.js draws 15km circle
    ↓
API: POST /api/intel/analyze { lat, lng, radius: 15 }
    ↓
Backend: Filter zones by Haversine distance
    ↓
Gemini: Generate formatted insights
    ↓
Frontend: Display zones + insights
```

---

## 🔒 Privacy & Compliance
- **Population-level** insights only
- **No individual targeting**
- **Aggregated** community data
- **Non-personal** business recommendations
