// scripts/generate_synthetic_locations.js
// Generates synthetic GPS location data for multiple devices over multiple days
// Output: scripts/synthetic_locations.json

const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT = path.join(__dirname, 'synthetic_locations.json');
const NUM_DEVICES = 1; // Changed to 1 device
const DAYS_PER_DEVICE = 4;
const ORIGIN = { lat: 28.545370, lng: 77.187257 }; // starting point

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

function generatePath(start, end, durationMinutes, avgStepMinutes = 1) {
  const points = [];
  // choose small jitter for each step
  const steps = Math.max(1, Math.round(durationMinutes / avgStepMinutes));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = interpolateLatLng(start, end, t);
    // jitter up to few meters
    const jitterM = rand(-8, 8);
    const jitterLng = metersToLng(jitterM, p.latitude);
    const jitterLat = metersToLat(rand(-8, 8));
    points.push({ latitude: p.latitude + jitterLat, longitude: p.longitude + jitterLng });
  }
  return points;
}

function randomWalk(center, minutes, avgStepMinutes = 2) {
  const pts = [];
  const steps = Math.max(1, Math.round(minutes / avgStepMinutes));
  let cur = { latitude: center.latitude, longitude: center.longitude };
  for (let i = 0; i < steps; i++) {
    // small move within 150-500 meters
    const angle = rand(0, Math.PI * 2);
    const dist = rand(20, 150);
    const dlat = metersToLat(Math.cos(angle) * dist);
    const dlng = metersToLng(Math.sin(angle) * dist, cur.latitude);
    cur = { latitude: cur.latitude + dlat, longitude: cur.longitude + dlng };
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
    // device-specific small offset so they don't all follow identical tracks
    const deviceOffsetMeters = { x: rand(-80, 80), y: rand(-80, 80) };
    const deviceOrigin = {
      latitude: ORIGIN.lat + metersToLat(deviceOffsetMeters.y),
      longitude: ORIGIN.lng + metersToLng(deviceOffsetMeters.x, ORIGIN.lat),
    };

    for (let d = 0; d < DAYS_PER_DEVICE; d++) {
      // choose day date
      const dayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);

      // morning departure between 07:00-08:00
      const departHour = rand(7, 8);
      const departTime = new Date(dayDate);
      departTime.setHours(Math.floor(departHour), Math.floor((departHour % 1) * 60), 0, 0);

      // Boys hostel point approx ~500-1200 meters away from origin
      const bhDist = rand(400, 1200);
      const bhAngle = rand(0, Math.PI * 2);
      const bhLat = deviceOrigin.latitude + metersToLat(Math.cos(bhAngle) * bhDist);
      const bhLng = deviceOrigin.longitude + metersToLng(Math.sin(bhAngle) * bhDist, deviceOrigin.latitude);
      const boysHostel = { latitude: bhLat, longitude: bhLng };

      // morning travel: depart -> boysHostel over 10-30 minutes
      const morningDuration = rand(10, 30);
      const path1 = generatePath(deviceOrigin, boysHostel, morningDuration, 1);

      // roaming around campus until lunch (duration 120-240 minutes)
      const roamBeforeLunchMinutes = rand(90, 240);
      const roam1 = randomWalk(boysHostel, roamBeforeLunchMinutes, 2);

      // return to origin by lunch between 11:30 and 13:00
      const lunchHour = rand(11.5, 13);
      const lunchTime = new Date(dayDate);
      lunchTime.setHours(Math.floor(lunchHour), Math.floor((lunchHour % 1) * 60), 0, 0);
      const returnDuration = Math.max(10, Math.round((lunchTime - addMinutes(departTime, morningDuration + roamBeforeLunchMinutes)) / 60000));
      const pathBack = generatePath(roam1.length ? roam1[roam1.length - 1] : boysHostel, deviceOrigin, returnDuration, 1);

      // midday stop (lunch) 30-90 minutes
      const lunchStopMinutes = randint(20, 90);

      // afternoon roam
      const roamAfternoonMinutes = rand(120, 360);
      const roam2 = randomWalk(deviceOrigin, roamAfternoonMinutes, 2);

      // battery replacement: occasionally do a long stop of 30-120 mins with speed=0
      const batteryReplace = Math.random() < 0.3; // 30% chance
      const batteryStopMinutes = batteryReplace ? randint(30, 120) : 0;

      // day end time - choose between 20:00 and 22:00
      const endHour = rand(20, 22);
      const endTime = new Date(dayDate);
      endTime.setHours(Math.floor(endHour), Math.floor((endHour % 1) * 60), 0, 0);

      // move back to origin before end of day
      const finalReturnDuration = rand(10, 60);
      const pathToOrigin = generatePath(roam2.length ? roam2[roam2.length - 1] : deviceOrigin, deviceOrigin, finalReturnDuration, 1);

      // assemble timeline
      const timeline = [];
      let curTime = new Date(departTime);

      const pushPoint = (pt, speed = 10, gpsStatus = 'valid', satellites = randint(5, 12), note) => {
        timeline.push({
          imei,
          latitude: +pt.latitude.toFixed(6),
          longitude: +pt.longitude.toFixed(6),
          speed: +(speed || 0).toFixed(2),
          course: randint(0, 359),
          altitude: randint(200, 240),
          accuracy: randint(3, 20),
          timestamp: new Date(curTime).toISOString(),
          gpsStatus,
          satellites,
          rawData: note || undefined,
        });
      };

      // depart path1
      for (let i = 0; i < path1.length; i++) {
        const pt = path1[i];
        // step minutes ~ distributed across morningDuration
        const stepMin = morningDuration / Math.max(1, path1.length - 1);
        if (i > 0) curTime = addMinutes(curTime, stepMin + rand(-0.5, 0.5));
        pushPoint(pt, rand(15, 40));
      }

      // roam1
      for (let i = 0; i < roam1.length; i++) {
        curTime = addMinutes(curTime, rand(1, 4));
        pushPoint(roam1[i], rand(5, 30));
      }

      // path back
      for (let i = 0; i < pathBack.length; i++) {
        const pt = pathBack[i];
        const stepMin = Math.max(1, returnDuration / Math.max(1, pathBack.length - 1));
        curTime = addMinutes(curTime, stepMin + rand(-0.5, 0.5));
        pushPoint(pt, rand(10, 40));
      }

      // lunch stop (stationary)
      if (lunchStopMinutes > 0) {
        curTime = addMinutes(curTime, randint(5, 10));
        pushPoint(deviceOrigin, 0, 'valid', randint(5, 8), 'lunch_stop');
        curTime = addMinutes(curTime, lunchStopMinutes);
        pushPoint(deviceOrigin, 0, 'valid', randint(5, 8), 'lunch_end');
      }

      // roam afternoon
      for (let i = 0; i < roam2.length; i++) {
        curTime = addMinutes(curTime, rand(1, 5));
        pushPoint(roam2[i], rand(5, 50));
      }

      // battery replacement stop
      if (batteryReplace) {
        curTime = addMinutes(curTime, randint(1, 5));
        pushPoint(deviceOrigin, 0, 'valid', randint(0, 3), 'battery_replacement_start');
        curTime = addMinutes(curTime, batteryStopMinutes);
        pushPoint(deviceOrigin, 0, 'valid', randint(5, 8), 'battery_replacement_end');
      }

      // path to origin before end
      for (let i = 0; i < pathToOrigin.length; i++) {
        const pt = pathToOrigin[i];
        const stepMin = Math.max(1, finalReturnDuration / Math.max(1, pathToOrigin.length - 1));
        curTime = addMinutes(curTime, stepMin + rand(-0.5, 0.5));
        pushPoint(pt, rand(10, 40));
      }

      // ensure final stop time somewhere between 20:00-22:00
      const finalStopHours = (endTime - curTime) / (1000 * 60 * 60);
      if (finalStopHours > 0) {
        // add a few roaming points and then final stop
        const roams = Math.min(6, Math.max(1, Math.round(finalStopHours * 2)));
        for (let r = 0; r < roams; r++) {
          curTime = addMinutes(curTime, randint(5, 60));
          // stay near origin
          const jitter = { latitude: deviceOrigin.latitude + metersToLat(rand(-30, 30)), longitude: deviceOrigin.longitude + metersToLng(rand(-30, 30), deviceOrigin.latitude) };
          pushPoint(jitter, rand(0, 30));
        }
      }

      // final stop at origin at endTime
      curTime = new Date(endTime);
      pushPoint(deviceOrigin, 0, 'valid', randint(5, 10), 'end_of_day');

      // add timeline entries to all
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
