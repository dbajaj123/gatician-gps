const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    imei: {
      type: String,
      required: [true, 'IMEI is required'],
      index: true,
      validate: {
        validator: function(v) {
          return /^[0-9]{15,16}$/.test(v);
        },
        message: 'IMEI must be a 15 or 16-digit number',
      },
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    speed: {
      type: Number,
      default: 0,
      min: [0, 'Speed cannot be negative'],
    },
    course: {
      type: Number,
      min: [0, 'Course must be between 0 and 360'],
      max: [360, 'Course must be between 0 and 360'],
    },
    altitude: {
      type: Number,
    },
    accuracy: {
      type: Number,
      min: [0, 'Accuracy cannot be negative'],
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
      index: true,
    },
    gpsStatus: {
      type: String,
      enum: ['valid', 'invalid', 'unknown'],
      default: 'unknown',
    },
    satellites: {
      type: Number,
      min: [0, 'Satellites count cannot be negative'],
    },
    rawData: {
      type: String,
      select: false, // Don't return by default
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
locationSchema.index({ imei: 1, timestamp: -1 });
locationSchema.index({ timestamp: -1 });

// GeoJSON index for geospatial queries
locationSchema.index({ location: '2dsphere' });

// Virtual for GeoJSON format
locationSchema.virtual('geoJson').get(function () {
  return {
    type: 'Point',
    coordinates: [this.longitude, this.latitude],
  };
});

// Static method to get latest location for a device
locationSchema.statics.getLatestByImei = async function (imei) {
  return this.findOne({ imei }).sort({ timestamp: -1 });
};

// Static method to get location history
locationSchema.statics.getHistory = async function (imei, startDate, endDate, limit = 10000, sort = 'desc') {
  const query = { imei };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  const sortOrder = sort === 'asc' ? 1 : -1;
  
  return this.find(query)
    .sort({ timestamp: sortOrder })
    .limit(limit);
};

// Static method to get locations within a radius
locationSchema.statics.getWithinRadius = async function (longitude, latitude, radiusInKm) {
  const radiusInMeters = radiusInKm * 1000;
  
  return this.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        distanceField: 'distance',
        maxDistance: radiusInMeters,
        spherical: true,
      },
    },
    {
      $sort: { timestamp: -1 },
    },
  ]);
};

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
