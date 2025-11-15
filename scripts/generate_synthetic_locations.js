const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const NUM_DEVICES = 1;
const DAYS_PER_DEVICE = 2; // October 14-15, 2025
const OUTPUT_FILE = path.join(__dirname, 'synthetic_locations.json');

// Key locations in IIT Delhi - Updated with new coordinates
const IIT_LOCATIONS = {
  start: { lat: 28.545486, lng: 77.187404, name: 'Start' },
  dms: { lat: 28.542325, lng: 77.183109, name: 'DMS' },
  vikramshila: { lat: 28.543259, lng: 77.181422, name: 'Vikramshila Apartments' },
  jwala: { lat: 28.548984, lng: 77.184442, name: 'Jwala Circle' },
  vindy: { lat: 28.548572, lng: 77.185742, name: 'Vindy' },
  drona: { lat: 28.546760, lng: 77.186993, name: 'Drona' },
  satpura: { lat: 28.548046, lng: 77.186812, name: 'Satpura' },
  shivalik: { lat: 28.547962, lng: 77.185487, name: 'Shivalik' },
  kailash: { lat: 28.544200, lng: 77.195658, name: 'Kailash' },
  himadri: { lat: 28.544832, lng: 77.197442, name: 'Himadri' },
  iitMarket: { lat: 28.542857, lng: 77.199256, name: 'IIT Market' },
  iitMarket2: { lat: 28.542096, lng: 77.198617, name: 'IIT Market II' },
  iitMarket3: { lat: 28.540263, lng: 77.196891, name: 'IIT Market III' },
  rniRoad: { lat: 28.542114, lng: 77.191880, name: 'RNI Road' },
  rniRoad2: { lat: 28.543120, lng: 77.189159, name: 'RNI Road II' },
  ara: { lat: 28.548188, lng: 77.184036, name: 'Ara' },
  kara: { lat: 28.547202, lng: 77.183470, name: 'Kara' },
  gate4: { lat: 28.546026, lng: 77.179426, name: 'Gate 4' },
};

// IIT Delhi campus bounds for validation
const IIT_BOUNDS = {
  minLat: 28.540,
  maxLat: 28.550,
  minLng: 77.180,
  maxLng: 77.200,
};

// Helper: Fetch route from OSRM API (campus-only routing)
function getRoute(fromLat, fromLng, toLat, toLng) {
  return new Promise((resolve, reject) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.code === 'Ok' && json.routes && json.routes[0]) {
            const route = json.routes[0];
            const coordinates = route.geometry.coordinates; // [lng, lat] pairs
            const duration = route.duration; // seconds
            resolve({ coordinates, duration });
          } else {
            reject(new Error(`OSRM routing failed: ${json.code || 'Unknown error'}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Helper: Convert route coordinates to location points with smooth transitions
function routeToPoints(coordinates, durationSeconds) {
  const points = [];
  // High point density: 10-second intervals for very smooth, uniform paths
  const totalPoints = Math.max(15, Math.floor(durationSeconds / 10)); // Point every 10 seconds
  
  for (let i = 0; i < totalPoints; i++) {
    const idx = Math.floor((i / (totalPoints - 1)) * (coordinates.length - 1));
    const [lng, lat] = coordinates[idx];
    
    // Add minimal GPS jitter (~0.3m for very smooth paths)
    const jitterLat = (Math.random() - 0.5) * 0.000003; // ~0.3m
    const jitterLng = (Math.random() - 0.5) * 0.000003;
    
    points.push({
      latitude: lat + jitterLat,
      longitude: lng + jitterLng,
    });
  }
  
  return points;
}

// Helper: Generate random walk for stationary periods
function randomWalk(center, durationMinutes, intervalMinutes, radiusMeters) {
  const steps = Math.floor(durationMinutes / intervalMinutes);
  const walk = [];
  
  for (let i = 0; i < steps; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const r = Math.random() * (radiusMeters * 0.3); // Stay within 30% of radius
    const latOffset = (r * Math.cos(angle)) / 111111;
    const lngOffset = (r * Math.sin(angle)) / (111111 * Math.cos((center.latitude * Math.PI) / 180));
    
    walk.push({
      latitude: center.latitude + latOffset,
      longitude: center.longitude + lngOffset,
    });
  }
  
  return walk;
}

// Helper: IMEI generator
function makeImei(seed) {
  let s = String(seed || Date.now()).slice(-14);
  while (s.length < 14) s = '0' + s;
  return '86' + s;
}

// Helper: Add minutes to date
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

// Helper: Random integer
function randint(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: Random float
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// Helper: Shuffle array
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper: Generate randomized route for a day
function generateDailyRoute() {
  // Key locations to visit (excluding start and special locations)
  const visitableLocations = [
    IIT_LOCATIONS.drona,
    IIT_LOCATIONS.satpura,
    IIT_LOCATIONS.shivalik,
    IIT_LOCATIONS.vindy,
    IIT_LOCATIONS.kailash,
    IIT_LOCATIONS.iitMarket2,
    IIT_LOCATIONS.iitMarket3,
    IIT_LOCATIONS.rniRoad,
    IIT_LOCATIONS.rniRoad2,
    IIT_LOCATIONS.ara,
    IIT_LOCATIONS.kara,
  ];
  
  // Special locations that trigger return to start
  const specialLocations = [
    IIT_LOCATIONS.jwala, 
    IIT_LOCATIONS.dms, 
    IIT_LOCATIONS.iitMarket,
    IIT_LOCATIONS.himadri,
    IIT_LOCATIONS.vikramshila,
    IIT_LOCATIONS.gate4
  ];
  
  // Shuffle and select random subset of locations
  const shuffled = shuffle(visitableLocations);
  const numStops = randint(8, 12); // Random number of stops per day
  const selectedLocations = shuffled.slice(0, numStops);
  
  // Randomly insert special locations
  const numSpecialVisits = randint(2, 3);
  for (let i = 0; i < numSpecialVisits; i++) {
    const specialLoc = specialLocations[randint(0, specialLocations.length - 1)];
    const insertPos = randint(2, selectedLocations.length - 1);
    selectedLocations.splice(insertPos, 0, specialLoc);
  }
  
  const route = [];
  let currentLoc = IIT_LOCATIONS.start;
  
  for (let i = 0; i < selectedLocations.length; i++) {
    const nextLoc = selectedLocations[i];
    const stopMinutes = randint(5, 20);
    
    route.push({ from: currentLoc, to: nextLoc, stopMinutes });
    currentLoc = nextLoc;
    
    // If at jwala, dms, or iitMarket, return to start
    const isSpecialLocation = specialLocations.some(loc => 
      loc.lat === nextLoc.lat && loc.lng === nextLoc.lng
    );
    
    if (isSpecialLocation && i < selectedLocations.length - 1) {
      const breakMinutes = randint(20, 45);
      route.push({ from: currentLoc, to: IIT_LOCATIONS.start, stopMinutes: breakMinutes });
      currentLoc = IIT_LOCATIONS.start;
    }
  }
  
  // Final return to start
  if (currentLoc.lat !== IIT_LOCATIONS.start.lat || currentLoc.lng !== IIT_LOCATIONS.start.lng) {
    route.push({ from: currentLoc, to: IIT_LOCATIONS.start, stopMinutes: 0 });
  }
  
  return route;
}

// Main generation function
async function generateSyntheticData() {
  console.log('🚗 Generating synthetic GPS data using OSRM routing...\n');
  
  const allLocations = [];
  
  for (let devIdx = 0; devIdx < NUM_DEVICES; devIdx++) {
    const imei = makeImei(100000 + devIdx);
    console.log(`📱 Device ${devIdx + 1}/${NUM_DEVICES}: ${imei}`);
    
    for (let dayIdx = 0; dayIdx < DAYS_PER_DEVICE; dayIdx++) {
      const dayDate = new Date('2025-10-14');
      dayDate.setDate(dayDate.getDate() + dayIdx);
      // Randomize start time between 6:30 AM and 7:30 AM
      dayDate.setHours(6, randint(30, 90), 0, 0);
      
      console.log(`   Day ${dayIdx + 1}: ${dayDate.toDateString()}`);
      
      let curTime = new Date(dayDate);
      const timeline = [];
      
      const pushPoint = (loc, speed, gpsStatus = 'valid', satellites = 12) => {
        timeline.push({
          imei,
          timestamp: curTime.toISOString(),
          latitude: loc.latitude,
          longitude: loc.longitude,
          speed,
          course: randint(0, 359),
          altitude: randint(200, 230),
          gpsStatus,
          satellites,
        });
      };
      
      try {
        // Generate randomized route for this day
        const route = generateDailyRoute();
        
        // Start at start location
        pushPoint({ latitude: IIT_LOCATIONS.start.lat, longitude: IIT_LOCATIONS.start.lng }, 0);
        
        // Process each leg
        for (let i = 0; i < route.length; i++) {
          const leg = route[i];
          console.log(`      ${leg.from.name} → ${leg.to.name}`);
          
          // Get route from OSRM
          const { coordinates, duration } = await getRoute(
            leg.from.lat, leg.from.lng,
            leg.to.lat, leg.to.lng
          );
          
          const pathPoints = routeToPoints(coordinates, duration);
          
          // Add path points
          const timePerPoint = (duration / pathPoints.length) / 60; // minutes
          for (let j = 0; j < pathPoints.length; j++) {
            if (j > 0) curTime = addMinutes(curTime, timePerPoint);
            // Realistic campus speeds: 15-30 km/h
            pushPoint(pathPoints[j], rand(15, 30));
          }
          
          // Stop at destination
          if (leg.stopMinutes > 0) {
            const roam = randomWalk(
              { latitude: leg.to.lat, longitude: leg.to.lng },
              leg.stopMinutes,
              2, // Every 2 minutes for more points
              4 // 4m radius
            );
            
            for (let j = 0; j < roam.length; j++) {
              curTime = addMinutes(curTime, 2);
              pushPoint(roam[j], rand(0, 2)); // Low speed while stationary
            }
          }
        }
        
        // Final point at start location (ensure end time is around 9 PM)
        const endHour = 20 + randint(0, 2); // 8-10 PM
        const endMinute = randint(0, 59);
        const targetEndTime = new Date(dayDate);
        targetEndTime.setHours(endHour, endMinute, 0, 0);
        
        // If current time is before target, add the difference
        if (curTime < targetEndTime) {
          const remainingMinutes = (targetEndTime - curTime) / (60 * 1000);
          if (remainingMinutes > 5) {
            curTime = addMinutes(curTime, remainingMinutes - 5);
          }
        }
        
        curTime = addMinutes(curTime, 5);
        pushPoint({ latitude: IIT_LOCATIONS.start.lat, longitude: IIT_LOCATIONS.start.lng }, 0);
        
        allLocations.push(...timeline);
        console.log(`      ✅ Generated ${timeline.length} points`);
        
      } catch (error) {
        console.error(`      ❌ Error: ${error.message}`);
      }
    }
  }
  
  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allLocations, null, 2), 'utf8');
  console.log(`\n✅ Generated ${allLocations.length} location points for ${NUM_DEVICES} devices across ${DAYS_PER_DEVICE} days.`);
  console.log(`💾 Output written to ${OUTPUT_FILE}`);
}

// Run
generateSyntheticData().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
