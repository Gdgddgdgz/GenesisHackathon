import React, { useState, useEffect } from 'react';
import LeafletMap from '../components/LeafletMap';
import { aiApi } from '../services/api';
import { MapPin } from 'lucide-react';
import axios from 'axios'; // Added axios import

const GeospatialMap = () => {
    const [points, setPoints] = useState([]);
    const [shopLocation, setShopLocation] = useState(null);
    const [regions, setRegions] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState('');
    const [loading, setLoading] = useState(true);
    const [segment, setSegment] = useState('apparel'); // Default segment

    const fetchHeatmap = async (region = '', currentSegment = segment) => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:8000/heatmap?segment=${currentSegment}`);
            // Filtering on frontend for regions if needed, though AI service could do it
            let data = res.data.features;
            if (region) {
                data = data.filter(f => f.properties.name === region);
            }
            setPoints(data);
            setShopLocation(res.data.shop_location);
        } catch (error) {
            console.error("Error fetching heatmap:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        const init = async () => {
            try {
                const regRes = await axios.get('http://localhost:8000/regions');
                setRegions(regRes.data);
                fetchHeatmap('', segment);
            } catch (err) {
                console.error(err);
            }
        };
        init();
    }, []);

    const handleRegionChange = (e) => {
        const region = e.target.value;
        setSelectedRegion(region);
        fetchHeatmap(region, segment);
    };

    const handleSegmentChange = (e) => {
        const newSegment = e.target.value;
        setSegment(newSegment);
        fetchHeatmap(selectedRegion, newSegment);
    };

    const handleUpdateZones = () => {
        fetchHeatmap(selectedRegion, segment);
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Geospatial Intelligence</h1>
                    <p className="text-slate-500 mt-1">Hyper-local demand hotspots & delivery zones</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <select
                            value={segment}
                            onChange={handleSegmentChange}
                            className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                        >
                            <optgroup label="Retail & Consumer Goods">
                                <option value="apparel">Apparel / Clothing</option>
                                <option value="footwear">Footwear</option>
                                <option value="fashion_accessories">Fashion Accessories</option>
                                <option value="stationery">Stationery</option>
                                <option value="books_magazines">Books & Magazines</option>
                                <option value="toys_games">Toys & Games</option>
                                <option value="gifts_handicrafts">Gifts & Handicrafts</option>
                            </optgroup>
                            <optgroup label="Food & Beverages">
                                <option value="sweets_confectionery">Sweets & Confectionery</option>
                                <option value="bakery_products">Bakery Products</option>
                                <option value="dairy_products">Dairy Products</option>
                                <option value="fruits_vegetables">Fruits & Vegetables</option>
                                <option value="packaged_food_snacks">Packaged Food & Snacks</option>
                                <option value="beverages_tea_coffee_soft_drinks">Beverages (Tea, Coffee, Soft Drinks)</option>
                                <option value="spices_masalas">Spices & Masalas</option>
                            </optgroup>
                            <optgroup label="Daily Needs">
                                <option value="grocery_kirana">Grocery & Kirana</option>
                                <option value="household_essentials">Household Essentials</option>
                                <option value="cleaning_supplies">Cleaning Supplies</option>
                                <option value="personal_care_cosmetics">Personal Care & Cosmetics</option>
                            </optgroup>
                            <optgroup label="Electronics & Utilities">
                                <option value="mobile_accessories">Mobile & Accessories</option>
                                <option value="consumer_electronics">Consumer Electronics</option>
                                <option value="electrical_hardware">Electrical & Hardware</option>
                            </optgroup>
                            <optgroup label="Health & Lifestyle">
                                <option value="pharmacy_medical_supplies">Pharmacy & Medical Supplies</option>
                                <option value="fitness_sports_equipment">Fitness & Sports Equipment</option>
                                <option value="wellness_ayurveda">Wellness & Ayurveda</option>
                            </optgroup>
                            <optgroup label="Specialized / Local Businesses">
                                <option value="jewellery">Jewellery</option>
                                <option value="furniture_home_decor">Furniture & Home Decor</option>
                                <option value="pet_supplies">Pet Supplies</option>
                                <option value="automobile_accessories">Automobile Accessories</option>
                                <option value="printing_packaging">Printing & Packaging</option>
                                <option value="local_services_repair">Local Services & Repair</option>
                            </optgroup>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            value={selectedRegion}
                            onChange={handleRegionChange}
                            className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                        >
                            <option value="">All Regions</option>
                            {regions.map(reg => (
                                <option key={reg} value={reg}>{reg}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        </div>
                    </div>
                    <button
                        onClick={handleUpdateZones}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                        <MapPin size={16} /> Update Zones
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 p-1 overflow-hidden relative z-0">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-slate-400">Loading Map...</span>
                    </div>
                ) : (
                    <LeafletMap points={points} shopLocation={shopLocation} />
                )}
                {/* Floating Map Controls (Optional/Light) */}
            </div>

            {/* Optimized Business Intelligence Legend - Zero Noise */}
            <div className="mt-6 bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Demand Visualization Guide</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                        <div className="w-4 h-4 rounded-full bg-[#ef4444]"></div>
                        <div>
                            <p className="text-xs font-bold text-red-700">High Demand</p>
                            <p className="text-[10px] text-red-600">Surge &gt; 30%</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                        <div className="w-4 h-4 rounded-full bg-[#f59e0b]"></div>
                        <div>
                            <p className="text-xs font-bold text-orange-700">Medium Demand</p>
                            <p className="text-[10px] text-orange-600">Surge 10% - 30%</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-sky-50 border border-sky-100">
                        <div className="w-4 h-4 rounded-full bg-[#0EA5E9]"></div>
                        <div>
                            <p className="text-xs font-bold text-sky-700">Stable Market</p>
                            <p className="text-[10px] text-sky-600">Baseline Trend</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                        <div className="w-4 h-4 rounded-full bg-[#4338ca]"></div>
                        <div>
                            <p className="text-xs font-bold text-indigo-700">Low Demand</p>
                            <p className="text-[10px] text-indigo-600">Deficit &lt; -10%</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeospatialMap;
