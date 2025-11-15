// scripts/generate_synthetic_locations.js
// Generates synthetic GPS location data for multiple devices over multiple days
// Output: scripts/synthetic_locations.json

const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT = path.join(__dirname, 'synthetic_locations.json');
const NUM_DEVICES = 1;
const DAYS_PER_DEVICE = 1;
// Start/End location (parking area)
const ORIGIN = { lat: 28.545496, lng: 77.187310 };
// IIT Delhi boundaries (approximate)
const IIT_BOUNDS = {
  minLat: 28.543,
  maxLat: 28.548,
  minLng: 77.183,
  maxLng: 77.195
};

// Key locations in IIT Delhi (only specified points)
const IIT_LOCATIONS = {
  parking: { lat: 28.545496, lng: 77.187310, name: 'Parking' },
  nilgiri: { lat: 28.547088, lng: 77.183433, name: 'Nilgiri' },
  sacCircle: { lat: 28.546768, lng: 77.185225, name: 'SAC Circle' },
  dograFront: { lat: 28.544392, lng: 77.192731, name: 'Dogra Front' },
  himadriCircle: { lat: 28.544911, lng: 77.194247, name: 'Himadri Circle' },
  designDept: { lat: 28.544091, lng: 77.191856, name: 'Design Dept' },
};

function constrainToIIT(lat, lng) {
  return {
    lat: Math.max(IIT_BOUNDS.minLat, Math.min(IIT_BOUNDS.maxLat, lat)),
    lng: Math.max(IIT_BOUNDS.minLng, Math.min(IIT_BOUNDS.maxLng, lng))
  };
}

// Approx helpers
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randint(min, max) {
  return Math.floor(rand(min, max));
}

// meters -> degrees approx
function metersToLat(m) {
  return m / 111111; // ~111.111 km per deg
}
function metersToLng(m, lat) {
  return m / (111111 * Math.cos((lat * Math.PI) / 180));
}

function makeImei(seed) {
  // 16-digit IMEI (string) - backend requires exactly 16 digits
  let s = String(seed || Date.now()).slice(-14);
  while (s.length < 14) s = '0' + s;
  // prefix with 86 to make 16
  return '86' + s;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function interpolate(a, b, t) {
  return a + (b - a) * t;
}

function interpolateLatLng(a, b, t) {
  return {
    latitude: interpolate(a.latitude, b.latitude, t),
    longitude: interpolate(a.longitude, b.longitude, t),
  };
}

function generatePath(start, end, durationMinutes, avgStepMinutes = 2) {
  const points = [];
  const steps = Math.max(1, Math.round(durationMinutes / avgStepMinutes));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = interpolateLatLng(start, end, t);
    // Minimal jitter to stay on road - only 2 meters
    const jitterM = rand(-2, 2);
    const jitterLng = metersToLng(jitterM, p.latitude);
    const jitterLat = metersToLat(rand(-2, 2));
    const constrained = constrainToIIT(p.latitude + jitterLat, p.longitude + jitterLng);
    points.push({ latitude: constrained.lat, longitude: constrained.lng });
  }
  return points;
}

function randomWalk(center, minutes, avgStepMinutes = 5, maxRadiusMeters = 15) {
  const pts = [];
  const steps = Math.max(1, Math.round(minutes / avgStepMinutes));
  let cur = { latitude: center.latitude, longitude: center.longitude };
  for (let i = 0; i < steps; i++) {
    // Very small move to stay near location
    const angle = rand(0, Math.PI * 2);
    const dist = rand(5, maxRadiusMeters);
    const dlat = metersToLat(Math.cos(angle) * dist);
    const dlng = metersToLng(Math.sin(angle) * dist, cur.latitude);
    const constrained = constrainToIIT(cur.latitude + dlat, cur.longitude + dlng);
    cur = { latitude: constrained.lat, longitude: constrained.lng };
    pts.push(cur);
  }
  return pts;
}

function speedForDistanceMeters(distanceMeters, minutes) {
  if (minutes <= 0) return 0;
  const hours = minutes / 60;
  const kmh = (distanceMeters / 1000) / hours;
  return Math.max(0, kmh);
}

// Generate data
(function main() {
  const all = [];
  const now = new Date();
  // create days: recent DAYS_PER_DEVICE days ending today
  for (let devIdx = 0; devIdx < NUM_DEVICES; devIdx++) {
    const imei = makeImei(100000 + devIdx);

    for (let d = 0; d < DAYS_PER_DEVICE; d++) {
      // choose day date
      const dayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);

      // Morning routine: Start at parking, travel through campus
      const departTime = new Date(dayDate);
      departTime.setHours(8, randint(0, 20), 0, 0);

      // Realistic route with proper timing: Parking -> Nilgiri -> SAC Circle -> Dogra Front -> Design Dept -> Himadri Circle -> Parking
      
      // Leg 1: Parking -> Nilgiri (8 min, ~400m)
      const path1 = generatePath(
        { latitude: IIT_LOCATIONS.parking.lat, longitude: IIT_LOCATIONS.parking.lng },
        { latitude: IIT_LOCATIONS.nilgiri.lat, longitude: IIT_LOCATIONS.nilgiri.lng },
        8, 2
      );

      // Brief stop at Nilgiri (10 min)
      const roam1 = randomWalk(
        { latitude: IIT_LOCATIONS.nilgiri.lat, longitude: IIT_LOCATIONS.nilgiri.lng },
        10, 5, 10
      );

      // Leg 2: Nilgiri -> SAC Circle (6 min)
      const path2 = generatePath(
        roam1.length ? roam1[roam1.length - 1] : { latitude: IIT_LOCATIONS.nilgiri.lat, longitude: IIT_LOCATIONS.nilgiri.lng },
        { latitude: IIT_LOCATIONS.sacCircle.lat, longitude: IIT_LOCATIONS.sacCircle.lng },
        6, 2
      );

      // Stop at SAC Circle (15 min)
      const roam2 = randomWalk(
        { latitude: IIT_LOCATIONS.sacCircle.lat, longitude: IIT_LOCATIONS.sacCircle.lng },
        15, 5, 10
      );

      // Leg 3: SAC Circle -> Dogra Front (10 min, ~800m)
      const path3 = generatePath(
        roam2.length ? roam2[roam2.length - 1] : { latitude: IIT_LOCATIONS.sacCircle.lat, longitude: IIT_LOCATIONS.sacCircle.lng },
        { latitude: IIT_LOCATIONS.dograFront.lat, longitude: IIT_LOCATIONS.dograFront.lng },
        10, 2
      );

      // Stop at Dogra Front (20 min)
      const roam3 = randomWalk(
        { latitude: IIT_LOCATIONS.dograFront.lat, longitude: IIT_LOCATIONS.dograFront.lng },
        20, 5, 10
      );

      // Leg 4: Dogra Front -> Design Dept (3 min, ~150m)
      const path4 = generatePath(
        roam3.length ? roam3[roam3.length - 1] : { latitude: IIT_LOCATIONS.dograFront.lat, longitude: IIT_LOCATIONS.dograFront.lng },
        { latitude: IIT_LOCATIONS.designDept.lat, longitude: IIT_LOCATIONS.designDept.lng },
        3, 2
      );

      // Stop at Design Dept (25 min)
      const roam4 = randomWalk(
        { latitude: IIT_LOCATIONS.designDept.lat, longitude: IIT_LOCATIONS.designDept.lng },
        25, 5, 10
      );

      // Leg 5: Design Dept -> Himadri Circle (3 min, ~150m)
      const path5 = generatePath(
        roam4.length ? roam4[roam4.length - 1] : { latitude: IIT_LOCATIONS.designDept.lat, longitude: IIT_LOCATIONS.designDept.lng },
        { latitude: IIT_LOCATIONS.himadriCircle.lat, longitude: IIT_LOCATIONS.himadriCircle.lng },
        3, 2
      );

      // Stop at Himadri Circle (20 min)
      const roam5 = randomWalk(
        { latitude: IIT_LOCATIONS.himadriCircle.lat, longitude: IIT_LOCATIONS.himadriCircle.lng },
        20, 5, 10
      );

      // Leg 6: Himadri Circle -> Parking via SAC Circle (15 min, ~900m)
      const path6 = generatePath(
        roam5.length ? roam5[roam5.length - 1] : { latitude: IIT_LOCATIONS.himadriCircle.lat, longitude: IIT_LOCATIONS.himadriCircle.lng },
        { latitude: IIT_LOCATIONS.sacCircle.lat, longitude: IIT_LOCATIONS.sacCircle.lng },
        8, 2
      );

      // Leg 7: SAC Circle -> Parking (final return, 8 min)
      const path7 = generatePath(
        path6.length ? path6[path6.length - 1] : { latitude: IIT_LOCATIONS.sacCircle.lat, longitude: IIT_LOCATIONS.sacCircle.lng },
        { latitude: IIT_LOCATIONS.parking.lat, longitude: IIT_LOCATIONS.parking.lng },
        8, 2
      );

      // End of day at parking
      const endTime = new Date(dayDate);
      endTime.setHours(randint(11, 13), randint(0, 59), 0, 0);

      // Assemble timeline
      const timeline = [];
      let curTime = new Date(departTime);

      const pushPoint = (pt, speed = 10, gpsStatus = 'valid', satellites = randint(6, 12)) => {
        if (!pt || pt.latitude === undefined || pt.longitude === undefined) {
          console.error('Invalid point:', pt);
          return;
        }
        timeline.push({
          imei,
          latitude: +pt.latitude.toFixed(6),
          longitude: +pt.longitude.toFixed(6),
          speed: +(speed || 0).toFixed(2),
          course: randint(0, 359),
          altitude: randint(215, 235), // IIT Delhi altitude ~220m
          accuracy: randint(3, 15),
          timestamp: new Date(curTime).toISOString(),
          gpsStatus,
          satellites,
        });
      };

      // Push all path points with timestamps
      // Path1: Parking -> Nilgiri (moving)
      for (let i = 0; i < path1.length; i++) {
        if (i > 0) curTime = addMinutes(curTime, 2);
        pushPoint(path1[i], rand(18, 25));
      }
      // Roam1: At Nilgiri (stationary/slow)
      for (let i = 0; i < roam1.length; i++) {
        curTime = addMinutes(curTime, 5);
        pushPoint(roam1[i], rand(0, 3));
      }
      // Path2: Nilgiri -> SAC Circle (moving)
      for (let i = 0; i < path2.length; i++) {
        curTime = addMinutes(curTime, 2);
        pushPoint(path2[i], rand(15, 22));
      }
      // Roam2: At SAC Circle (stationary/slow)
      for (let i = 0; i < roam2.length; i++) {
        curTime = addMinutes(curTime, 5);
        pushPoint(roam2[i], rand(0, 3));
      }
      // Path3: SAC Circle -> Dogra Front (moving)
      for (let i = 0; i < path3.length; i++) {
        curTime = addMinutes(curTime, 2);
        pushPoint(path3[i], rand(18, 25));
      }
      // Roam3: At Dogra Front (stationary/slow)
      for (let i = 0; i < roam3.length; i++) {
        curTime = addMinutes(curTime, 5);
        pushPoint(roam3[i], rand(0, 3));
      }
      // Path4: Dogra Front -> Design Dept (moving)
      for (let i = 0; i < path4.length; i++) {
        curTime = addMinutes(curTime, 2);
        pushPoint(path4[i], rand(12, 18));
      }
      // Roam4: At Design Dept (stationary/slow)
      for (let i = 0; i < roam4.length; i++) {
        curTime = addMinutes(curTime, 5);
        pushPoint(roam4[i], rand(0, 3));
      }
      // Path5: Design Dept -> Himadri Circle (moving)
      for (let i = 0; i < path5.length; i++) {
        curTime = addMinutes(curTime, 2);
        pushPoint(path5[i], rand(12, 18));
      }
      // Roam5: At Himadri Circle (stationary/slow)
      for (let i = 0; i < roam5.length; i++) {
        curTime = addMinutes(curTime, 5);
        pushPoint(roam5[i], rand(0, 3));
      }
      // Path6: Himadri Circle -> SAC Circle (moving)
      for (let i = 0; i < path6.length; i++) {
        curTime = addMinutes(curTime, 2);
        pushPoint(path6[i], rand(18, 25));
      }
      // Path7: SAC Circle -> Parking (final return, moving)
      for (let i = 0; i < path7.length; i++) {
        curTime = addMinutes(curTime, 2);
        pushPoint(path7[i], rand(15, 22));
      }
      // Final stop at parking
      curTime = new Date(endTime);
      pushPoint({ latitude: IIT_LOCATIONS.parking.lat, longitude: IIT_LOCATIONS.parking.lng }, 0);

      // Add to all
      for (const t of timeline) {
        all.push(t);
      }
    }
  }

  // write file
  fs.writeFileSync(OUTPUT, JSON.stringify(all, null, 2), 'utf8');
  console.log(`Generated ${all.length} location points for ${NUM_DEVICES} devices across ${DAYS_PER_DEVICE} days.`);
  console.log(`Output written to ${OUTPUT}`);
})();
