# Setup HTTPS with Nginx

## Option 1: Use Nginx as Reverse Proxy with Let's Encrypt SSL

### Install Nginx and Certbot
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/gatician-gps
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/gatician-gps /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Get SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

### Update Firewall
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000  # For GPS TCP
```

Now access: `https://your-domain.com/api/v1/auth/register`

---

## Option 2: For Testing Without Domain (HTTP only)

Just use HTTP for now:
```
http://34.131.177.135:3001/api/v1/auth/register
```

---

## Option 3: Add HTTPS Directly to Node.js (Not Recommended)

If you must, update src/index.js:

```javascript
const https = require('https');
const fs = require('fs');

// Load SSL certificates
const httpsOptions = {
  key: fs.readFileSync('/path/to/private-key.pem'),
  cert: fs.readFileSync('/path/to/certificate.pem')
};

// Replace app.listen with:
https.createServer(httpsOptions, this.app).listen(config.port, () => {
  logger.info(`🌐 HTTPS Server listening on port ${config.port}`);
});
```

---

## Quick Test (No SSL needed)

In Postman:
```
POST http://34.131.177.135:3001/api/v1/auth/register
Body (JSON):
{
  "username": "testuser",
  "email": "test@example.com", 
  "password": "Test12345!"
}
```
