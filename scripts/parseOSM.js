// scripts/parseOSM.js
// Parse OSM file to extract road network and find paths between points

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const OSM_FILE = path.join(__dirname, '..', 'map.osm');

// Target locations
const LOCATIONS = {
  parking: { lat: 28.545496, lng: 77.187310 },
  nilgiri: { lat: 28.547088, lng: 77.183433 },
  rajdhani: { lat: 28.546411, lng: 77.186882 },
  sacCircle: { lat: 28.546768, lng: 77.185225 },
  dograFront: { lat: 28.544392, lng: 77.192731 },
  himadriCircle: { lat: 28.544911, lng: 77.194247 },
  designDept: { lat: 28.544091, lng: 77.191856 },
  rniPark: { lat: 28.543806, lng: 77.187598 },
  dms: { lat: 28.546612, lng: 77.185078 },
};

function distance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

async function parseOSM() {
  try {
    console.log('📂 Reading OSM file...');
    const osmData = fs.readFileSync(OSM_FILE, 'utf8');
    
    console.log('🔍 Parsing XML...');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(osmData);
    
    // Extract nodes
    const nodes = {};
    if (result.osm && result.osm.node) {
      result.osm.node.forEach(node => {
        const id = node.$.id;
        const lat = parseFloat(node.$.lat);
        const lon = parseFloat(node.$.lon);
        nodes[id] = { lat, lon };
      });
    }
    
    console.log(`✅ Found ${Object.keys(nodes).length} nodes`);
    
    // Extract ways (roads)
    const roads = [];
    if (result.osm && result.osm.way) {
      result.osm.way.forEach(way => {
        const tags = {};
        if (way.tag) {
          way.tag.forEach(tag => {
            tags[tag.$.k] = tag.$.v;
          });
        }
        
        // Only include roads
        if (tags.highway && way.nd) {
          const nodeRefs = way.nd.map(nd => nd.$.ref);
          const coords = nodeRefs
            .map(ref => nodes[ref])
            .filter(node => node !== undefined);
          
          if (coords.length > 1) {
            roads.push({
              id: way.$.id,
              highway: tags.highway,
              name: tags.name || 'Unnamed',
              coords
            });
          }
        }
      });
    }
    
    console.log(`✅ Found ${roads.length} roads\n`);
    
    // Find nearest road nodes for each location
    console.log('📍 Finding nearest road nodes for each location:');
    const nearestNodes = {};
    
    Object.entries(LOCATIONS).forEach(([name, loc]) => {
      let minDist = Infinity;
      let nearest = null;
      
      roads.forEach(road => {
        road.coords.forEach(coord => {
          const dist = distance(loc.lat, loc.lng, coord.lat, coord.lon);
          if (dist < minDist) {
            minDist = dist;
            nearest = coord;
          }
        });
      });
      
      nearestNodes[name] = {
        ...nearest,
        distance: Math.round(minDist)
      };
      
      console.log(`  ${name.padEnd(15)} -> ${minDist < 50 ? '✅' : '⚠️ '} ${Math.round(minDist)}m away (${nearest.lat.toFixed(6)}, ${nearest.lon.toFixed(6)})`);
    });
    
    // Export nearest nodes
    const output = {
      locations: LOCATIONS,
      nearestRoadNodes: nearestNodes,
      stats: {
        totalNodes: Object.keys(nodes).length,
        totalRoads: roads.length
      }
    };
    
    const outputFile = path.join(__dirname, 'osm_road_nodes.json');
    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log(`\n💾 Saved road nodes to ${outputFile}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

parseOSM();
