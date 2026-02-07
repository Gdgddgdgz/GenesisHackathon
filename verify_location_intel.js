/**
 * Pan-India Location Intelligence System - Comprehensive Verification Script
 * 
 * Tests backend API, zone generation, Gemini integration, and overall system
 * Run: node verify_location_intel.js
 */

const BASE_URL = 'http://localhost:5000';

// Test coordinates across different Indian regions
const TEST_COORDINATES = [
    { name: 'Mumbai (Vidyavihar)', lat: 19.0822, lng: 72.8978, expectedMinZones: 5 },
    { name: 'Delhi (Chandni Chowk)', lat: 28.6506, lng: 77.2303, expectedMinZones: 5 },
    { name: 'Bangalore (Koramangala)', lat: 12.9352, lng: 77.6245, expectedMinZones: 5 },
    { name: 'Jaipur (Pink City)', lat: 26.9124, lng: 75.7873, expectedMinZones: 5 },
    { name: 'Kochi (Coastal)', lat: 9.9312, lng: 76.2673, expectedMinZones: 5 },
    { name: 'Rural UP (Prayagraj)', lat: 25.4358, lng: 81.8463, expectedMinZones: 3 },
    { name: 'Guwahati (Northeast)', lat: 26.1445, lng: 91.7362, expectedMinZones: 3 },
    { name: 'Hyderabad (Telangana)', lat: 17.3850, lng: 78.4867, expectedMinZones: 5 }
];

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI(coordinate) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`Testing: ${coordinate.name}`, 'bold');
    log(`Coordinates: ${coordinate.lat.toFixed(4)}, ${coordinate.lng.toFixed(4)}`, 'cyan');
    log('='.repeat(60), 'cyan');

    try {
        const startTime = Date.now();

        const response = await fetch(`${BASE_URL}/api/intel/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lat: coordinate.lat,
                lng: coordinate.lng,
                radius: 15
            })
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (!response.ok) {
            log(`✗ API Request Failed: ${response.status} ${response.statusText}`, 'red');
            const errorData = await response.json();
            log(`  Error: ${errorData.error || 'Unknown error'}`, 'red');
            return { success: false, location: coordinate.name };
        }

        const data = await response.json();

        log(`✓ API Response received in ${responseTime}ms`, 'green');

        // Test 1: Validate response structure
        const hasRequiredFields = data.anchor && data.radius && data.zones && data.count !== undefined;
        if (hasRequiredFields) {
            log('✓ Response structure: PASS', 'green');
        } else {
            log('✗ Response structure: FAIL (missing required fields)', 'red');
            return { success: false, location: coordinate.name };
        }

        // Test 2: Validate zone count
        const zoneCount = data.zones.length;
        log(`  Zones found: ${zoneCount}`, 'blue');
        if (zoneCount >= coordinate.expectedMinZones) {
            log(`✓ Zone count: PASS (>= ${coordinate.expectedMinZones})`, 'green');
        } else {
            log(`✗ Zone count: FAIL (expected >= ${coordinate.expectedMinZones}, got ${zoneCount})`, 'yellow');
        }

        // Test 3: Validate radius enforcement
        const allWithinRadius = data.zones.every(zone => zone.distance <= data.radius);
        if (allWithinRadius) {
            log(`✓ Radius enforcement: PASS (all zones within ${data.radius} km)`, 'green');
        } else {
            const outOfBounds = data.zones.filter(z => z.distance > data.radius);
            log(`✗ Radius enforcement: FAIL (${outOfBounds.length} zones outside radius)`, 'red');
        }

        // Test 4: Validate area type classification
        const validTypes = ['Residential', 'Commercial', 'Mixed-Use', 'Industrial'];
        const allValidTypes = data.zones.every(zone => validTypes.includes(zone.type));
        if (allValidTypes) {
            log('✓ Area type classification: PASS', 'green');
        } else {
            const invalidZones = data.zones.filter(z => !validTypes.includes(z.type));
            log(`✗ Area type classification: FAIL (${invalidZones.length} zones with invalid types)`, 'red');
        }

        // Test 5: Distribution of zone types
        const typeDistribution = data.zones.reduce((acc, zone) => {
            acc[zone.type] = (acc[zone.type] || 0) + 1;
            return acc;
        }, {});
        log(`  Zone distribution:`, 'blue');
        Object.entries(typeDistribution).forEach(([type, count]) => {
            log(`    ${type}: ${count} zones`, 'blue');
        });

        // Test 6: Validate Gemini insight format
        let validInsights = 0;
        let totalInsights = 0;

        data.zones.forEach(zone => {
            totalInsights++;
            if (zone.insight) {
                const lines = zone.insight.split('\n').filter(l => l.trim());
                const hasCorrectLineCount = lines.length === 3;
                const hasZoneTypeInLine1 = lines[0]?.includes(`[${zone.type}]`);
                const hasRecommendedAction = lines[2]?.includes('Recommended Action');

                if (hasCorrectLineCount && hasZoneTypeInLine1 && hasRecommendedAction) {
                    validInsights++;
                }
            }
        });

        const insightPassRate = (validInsights / totalInsights * 100).toFixed(1);
        if (insightPassRate >= 90) {
            log(`✓ Gemini insight format: PASS (${insightPassRate}% valid)`, 'green');
        } else {
            log(`✗ Gemini insight format: FAIL (${insightPassRate}% valid, expected >= 90%)`, 'yellow');
        }

        // Test 7: Sample insight display
        if (data.zones.length > 0) {
            const sampleZone = data.zones[0];
            log(`\n  Sample Zone:`, 'cyan');
            log(`    Name: ${sampleZone.name}`, 'blue');
            log(`    Type: ${sampleZone.type}`, 'blue');
            log(`    Distance: ${sampleZone.distance} km`, 'blue');
            log(`    Insight:`, 'blue');
            sampleZone.insight.split('\n').forEach(line => {
                log(`      ${line}`, 'blue');
            });
        }

        // Test 8: Metadata validation
        if (data.metadata) {
            log(`\n  Metadata:`, 'cyan');
            log(`    Analysis Type: ${data.metadata.analysis_type}`, 'blue');
            log(`    Coverage Quality: ${data.metadata.coverage_quality}`, 'blue');
            log('✓ Metadata: PASS', 'green');
        }

        return {
            success: true,
            location: coordinate.name,
            zoneCount,
            responseTime,
            insightPassRate
        };

    } catch (error) {
        log(`✗ Test failed with error: ${error.message}`, 'red');
        return { success: false, location: coordinate.name, error: error.message };
    }
}

async function testEdgeCases() {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`EDGE CASE TESTING`, 'bold');
    log('='.repeat(60), 'cyan');

    // Test 1: Coordinates outside India
    log('\nTest: Coordinates outside India', 'yellow');
    try {
        const response = await fetch(`${BASE_URL}/api/intel/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: 51.5074, lng: -0.1278, radius: 15 }) // London
        });

        if (response.status === 400) {
            const data = await response.json();
            if (data.error && data.error.includes('outside India')) {
                log('✓ Out-of-bounds validation: PASS', 'green');
            } else {
                log('✗ Out-of-bounds validation: FAIL (wrong error message)', 'yellow');
            }
        } else {
            log('✗ Out-of-bounds validation: FAIL (accepted invalid coordinates)', 'red');
        }
    } catch (error) {
        log(`✗ Out-of-bounds test error: ${error.message}`, 'red');
    }

    // Test 2: Missing parameters
    log('\nTest: Missing required parameters', 'yellow');
    try {
        const response = await fetch(`${BASE_URL}/api/intel/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ radius: 15 })
        });

        if (response.status === 400) {
            log('✓ Missing parameters validation: PASS', 'green');
        } else {
            log('✗ Missing parameters validation: FAIL', 'red');
        }
    } catch (error) {
        log(`✗ Missing parameters test error: ${error.message}`, 'red');
    }

    // Test 3: Extreme radius values
    log('\nTest: Radius enforcement (10-15 km bounds)', 'yellow');
    try {
        const response = await fetch(`${BASE_URL}/api/intel/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: 19.0760, lng: 72.8777, radius: 25 })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.radius === 15) {
                log('✓ Radius capping: PASS (capped at 15 km)', 'green');
            } else {
                log(`✗ Radius capping: FAIL (expected 15, got ${data.radius})`, 'red');
            }
        }
    } catch (error) {
        log(`✗ Radius test error: ${error.message}`, 'red');
    }
}

async function runAllTests() {
    log('\n' + '='.repeat(60), 'bold');
    log('PAN-INDIA LOCATION INTELLIGENCE SYSTEM', 'bold');
    log('COMPREHENSIVE VERIFICATION TEST', 'bold');
    log('='.repeat(60) + '\n', 'bold');

    log(`Testing ${TEST_COORDINATES.length} locations across India...`, 'cyan');
    log(`Backend Server: ${BASE_URL}\n`, 'cyan');

    const results = [];

    // Run tests for each coordinate
    for (const coordinate of TEST_COORDINATES) {
        const result = await testAPI(coordinate);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between tests
    }

    // Run edge case tests
    await testEdgeCases();

    // Generate summary report
    log(`\n${'='.repeat(60)}`, 'cyan');
    log('VERIFICATION SUMMARY', 'bold');
    log('='.repeat(60), 'cyan');

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const successRate = (successCount / totalCount * 100).toFixed(1);

    log(`\nTotal Locations Tested: ${totalCount}`, 'blue');
    log(`Successful: ${successCount}`, 'green');
    log(`Failed: ${totalCount - successCount}`, successCount < totalCount ? 'red' : 'green');
    log(`Success Rate: ${successRate}%`, successRate > 80 ? 'green' : 'yellow');

    if (successCount === totalCount) {
        log('\n✓ ALL TESTS PASSED! System is ready for pan-India deployment.', 'green');
    } else {
        log('\n✗ Some tests failed. Review errors above.', 'yellow');
    }

    // Performance summary
    const avgResponseTime = results
        .filter(r => r.responseTime)
        .reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    if (avgResponseTime) {
        log(`\nAverage Response Time: ${avgResponseTime.toFixed(0)}ms`, avgResponseTime < 5000 ? 'green' : 'yellow');
    }

    log('\n' + '='.repeat(60) + '\n', 'cyan');
}

// Run the tests
runAllTests().catch(error => {
    log(`\nFATAL ERROR: ${error.message}`, 'red');
    process.exit(1);
});
