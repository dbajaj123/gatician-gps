# Gatician GPS Frontend - User Guide

## Getting Started

### Accessing the Application

1. Open your browser and navigate to: `http://localhost:3000`
2. You'll see the login page

### First Time Login

If you've run the seed script, use these credentials:
- **Admin Account**
  - Email: `admin@example.com`
  - Password: `admin123`
- **User Account**
  - Email: `user@example.com`
  - Password: `user123`

## Pages Overview

### 1. Login Page

**Features:**
- Email and password authentication
- Form validation
- Remember me option
- Link to registration page
- Password visibility toggle
- Beautiful gradient background

**How to Use:**
1. Enter your email address
2. Enter your password
3. (Optional) Check "Remember" to stay logged in
4. Click "Log in" button

### 2. Registration Page

**Features:**
- Create new user account
- Username, email, and password fields
- Password strength indicator
- Confirm password validation
- Form validation with error messages
- Password visibility toggle

**How to Use:**
1. Choose a unique username (3-50 alphanumeric characters)
2. Enter a valid email address
3. Create a strong password (minimum 8 characters)
4. Confirm your password
5. Click "Create Account"

**Password Strength:**
- Very Weak: Less than 8 characters
- Weak: 8+ characters
- Fair: Mixed case letters
- Good: Letters + numbers
- Strong: Letters + numbers + special characters

### 3. Dashboard

**Features:**
- Overview statistics (Total, Online, Offline, Unknown devices)
- Interactive map with device markers
- Device list with search
- Real-time updates every 7 seconds
- Device status indicators
- Selected device details panel

**How to Use:**

**View Device Statistics:**
- Check the stats cards at the top for quick overview
- Green = Online devices
- Red = Offline devices
- Gray = Unknown status devices

**Search for Devices:**
1. Use the search box in the device list
2. Type IMEI or device name
3. Results filter automatically

**View Device on Map:**
1. Click on a device in the left panel
2. The map will center on that device
3. Click map markers to see device popup
4. View detailed information below the map

**Device Status Colors:**
- 🟢 Green marker = Online (last seen < 5 minutes ago)
- 🔴 Red marker = Offline (5-60 minutes ago)
- ⚫ Gray marker = Unknown (> 60 minutes ago)

**Refresh Data:**
- Click the "Refresh" button in the top right
- Or wait for automatic refresh (every 7 seconds)

### 4. Devices Page

**Features:**
- Grid view of all devices
- Device cards with status and information
- Search and filter capabilities
- Add new device button
- Edit and delete device options

**How to Use:**

**View All Devices:**
- Devices are displayed in a responsive grid
- Each card shows device name, IMEI, model, and status

**Search Devices:**
1. Type in the search bar
2. Search by IMEI, name, or model
3. Results update instantly

**Add New Device:**
1. Click "Add Device" button (coming soon)
2. Fill in device details
3. Submit the form

**Edit Device:**
1. Click "Edit" button on device card
2. Update device information
3. Save changes

**Delete Device:**
1. Click "Delete" button on device card
2. Confirm deletion
3. Device will be removed

### 5. Monitor Page

**Features:**
- Full-screen device monitoring
- Detailed device information panels
- Real-time metrics (speed, direction, altitude, accuracy)
- Side-by-side device list and map
- Live location tracking

**How to Use:**

**Select a Device:**
1. Choose a device from the list on the left
2. The device will be highlighted
3. Map will center on the device
4. Detailed metrics will appear below

**View Real-Time Metrics:**
- **Speed**: Current speed in km/h
- **Direction**: Cardinal direction (N, NE, E, SE, S, SW, W, NW)
- **Altitude**: Height above sea level in meters
- **Accuracy**: GPS accuracy in meters

**Monitor Multiple Devices:**
1. Click different devices in the list
2. Map updates automatically
3. Compare device metrics

**Understand the Data:**
- Green indicators = Good signal/active
- Red indicators = Poor signal/inactive
- Timestamp shows last data received

### 6. Statistics Page

**Features:**
- Analytics dashboard (coming soon)
- Total distance traveled
- Active hours
- Average speed
- Historical data analysis

**Current Status:**
- Placeholder showing preview of upcoming features
- Will include charts and detailed analytics

## Common Tasks

### How to Track a Device in Real-Time

1. Go to **Monitor** page
2. Select your device from the list
3. Watch the map update automatically
4. Check the metrics panel for current speed, direction, etc.
5. System refreshes every 7 seconds

### How to Find a Specific Device

**Method 1: Dashboard Search**
1. Go to **Dashboard**
2. Use the search box in the device list
3. Type the IMEI or device name
4. Click on the device to view on map

**Method 2: Devices Page Search**
1. Go to **Devices**
2. Use the search bar at the top
3. Browse the filtered results

### How to Check Device Status

1. Go to **Dashboard** or **Devices**
2. Look at the status badge on each device
3. Status options:
   - **Online**: Device is actively sending data
   - **Offline**: Device hasn't reported recently
   - **Unknown**: No recent connection data

### How to View Device History

(Coming Soon)
- Click on a device
- Select "History" or "Playback"
- Choose date/time range
- View route on map

## Navigation

### Sidebar Menu
- **Dashboard**: Main overview with map and devices
- **Devices**: Manage all GPS devices
- **Monitor**: Real-time device monitoring
- **Statistics**: Analytics and insights

### Header
- **Search**: Quick device search
- **Notifications**: System alerts (bell icon)
- **Menu**: Toggle sidebar on mobile

### User Profile
- Located in sidebar
- Shows username and email
- **Logout**: Click to sign out

## Tips & Best Practices

### Performance Tips
1. **Limit visible devices**: Use search to filter when many devices
2. **Close unused tabs**: Reduces browser memory usage
3. **Update regularly**: Refresh your browser for latest features

### Security Tips
1. **Use strong passwords**: Mix letters, numbers, and symbols
2. **Log out when done**: Especially on shared computers
3. **Don't share credentials**: Each user should have their own account

### Data Management
1. **Regular monitoring**: Check devices daily for issues
2. **Verify accuracy**: GPS accuracy can vary by location
3. **Update device info**: Keep device names and details current

## Troubleshooting

### Map Not Loading
- Check internet connection
- Refresh the page (F5)
- Clear browser cache
- Ensure backend is running

### Devices Not Showing
- Verify backend server is running
- Check if devices are registered
- Ensure GPS devices are sending data
- Check device IMEI is correct

### Location Not Updating
- Verify device is powered on
- Check GPS signal strength
- Ensure device has network connectivity
- Wait for next update cycle (7 seconds)

### Login Issues
- Verify email and password
- Check caps lock is off
- Ensure account is active
- Try password reset (if available)

### Performance Issues
- Close unnecessary browser tabs
- Clear browser cache and cookies
- Update to latest browser version
- Check network connection speed

## Keyboard Shortcuts

(Coming Soon)
- `Ctrl + K`: Quick search
- `Esc`: Close modals
- `F5`: Refresh page
- `Ctrl + ,`: Settings

## Mobile Usage

The application is fully responsive and works on mobile devices:

**Features:**
- Touch-friendly interface
- Swipe gestures
- Mobile-optimized layouts
- Sidebar toggles on mobile

**Tips for Mobile:**
1. Use landscape mode for better map view
2. Pinch to zoom on maps
3. Tap markers for device info
4. Use hamburger menu to navigate

## Data Refresh

### Automatic Refresh
- Dashboard: Every 7 seconds
- Monitor: Every 7 seconds
- Devices: On page load

### Manual Refresh
- Click "Refresh" button
- Pull to refresh (mobile)
- Press F5 to reload page

## System Requirements

### Minimum Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Screen resolution: 1024x768 or higher

### Recommended
- Latest browser version
- Stable internet connection
- Screen resolution: 1920x1080 or higher
- 4GB RAM or more

## Support

### Getting Help
1. Check this user guide
2. Review the SETUP_GUIDE.md
3. Check browser console for errors
4. Contact system administrator

### Reporting Issues
When reporting issues, include:
- What you were trying to do
- What happened instead
- Browser and version
- Screenshot if possible
- Error messages from console

## Updates

The application is regularly updated with:
- New features
- Bug fixes
- Performance improvements
- Security patches

To get updates:
1. System admin will update the backend
2. Refresh your browser (Ctrl + F5)
3. Clear cache if needed

## Privacy & Security

### Your Data
- Location data is stored securely
- Only authorized users can view your devices
- Data is encrypted in transit
- Regular security audits

### Permissions
- User: View own devices
- Admin: View all devices, manage users

### Best Practices
- Use HTTPS in production
- Enable two-factor authentication (when available)
- Review active sessions regularly
- Report suspicious activity

## Future Features

Coming soon:
- Device history playback
- Geofencing alerts
- Route analysis
- Detailed statistics
- Mobile apps
- Email notifications
- Custom dashboards
- Device sharing
- Export data to CSV/PDF
- API access for developers

---

**Last Updated**: November 2025
**Version**: 1.0.0
