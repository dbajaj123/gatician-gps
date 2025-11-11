const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    imei: {
      type: String,
      required: [true, 'IMEI is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[0-9]{15}$/.test(v);
        },
        message: 'IMEI must be a 15-digit number',
      },
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Device name cannot exceed 100 characters'],
    },
    model: {
      type: String,
      trim: true,
      maxlength: [50, 'Model name cannot exceed 50 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastConnection: {
      type: Date,
    },
    connectionStatus: {
      type: String,
      enum: ['online', 'offline', 'unknown'],
      default: 'unknown',
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
deviceSchema.index({ imei: 1, owner: 1 });
deviceSchema.index({ isActive: 1 });

// Virtual for latest location
deviceSchema.virtual('latestLocation', {
  ref: 'Location',
  localField: 'imei',
  foreignField: 'imei',
  justOne: true,
  options: { sort: { timestamp: -1 } },
});

// Method to update connection status
deviceSchema.methods.updateConnectionStatus = async function () {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  if (this.lastConnection && this.lastConnection > fiveMinutesAgo) {
    this.connectionStatus = 'online';
  } else if (this.lastConnection) {
    this.connectionStatus = 'offline';
  } else {
    this.connectionStatus = 'unknown';
  }
  
  await this.save();
};

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
