# Roboloans Chatbot WordPress Installation Guide

## 🚀 WordPress पर Chatbot Install करने के Complete Guide

---

## **Method 1: Plugin Install (Recommended)**

### **Step 1: Plugin Upload**
1. WordPress admin में login करें
2. `Plugins` → `Add New` → `Upload Plugin` पर जाएं
3. `roboloans-chatbot-plugin.php` file upload करें
4. `Install Now` और फिर `Activate` करें

### **Step 2: Plugin Configuration**
1. `Settings` → `Roboloans Chatbot` पर जाएं
2. निम्नलिखित settings configure करें:
   - **Server URL**: `http://your-server-ip:3000` (जहाँ आपका Node.js server चल रहा है)
   - **Zoho API Token**: आपका Zoho API token
   - **Auto-Open Chat**: `Yes` (first-time visitors के लिए)
   - **Site-Wide Display**: `Yes` (सभी pages पर show करने के लिए)

### **Step 3: Files Upload**
Plugin folder के अंदर `assets` folder बनाएं और उसमें ये files upload करें:
- `assets/chatbot-style.css`
- `assets/chatbot-script.js`

---

## **Method 2: Direct HTML Embed (Simple)**

### **Step 1: HTML Block में Code Add करें**
1. WordPress page/post edit करें
2. `+` बटन click करें और `Custom HTML` block select करें
3. `wordpress-chatbot.html` file का complete code paste करें

### **Step 2: Server URL Update**
HTML code में ये line find करके update करें:
```javascript
const response = await fetch('http://your-server-ip:3000/send-to-zoho', {
```

---

## **Method 3: Shortcode Usage**

### **Basic Usage**
```
[roboloans_chatbot]
```

### **Advanced Options**
```
[roboloans_chatbot position="bottom-right" auto_open="yes" delay="2"]
```

**Available Positions:**
- `bottom-right` (default)
- `bottom-left`
- `top-right`
- `top-left`

---

## **Method 4: Theme Template Integration**

### **PHP Code Add करें**
अपनी theme की `footer.php` file में ये code add करें:
```php
<?php echo do_shortcode('[roboloans_chatbot]'); ?>
```

---

## **Server Setup Requirements**

### **Node.js Server Configuration**
```bash
# Server को public IP पर run करें
node server.js

# या PM2 के साथ production deploy करें
npm install -g pm2
pm2 start server.js --name "roboloans-chatbot"
pm2 startup
pm2 save
```

### **Firewall Settings**
```bash
# Port 3000 open करें
sudo ufw allow 3000
sudo ufw reload
```

### **Nginx Reverse Proxy (Optional)**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## **Testing & Verification**

### **Step 1: Server Test**
```bash
# Server working है या check करें
curl http://your-server-ip:3000/health
```

### **Step 2: WordPress Test**
1. WordPress site open करें
2. 2 seconds wait करें (auto-open के लिए)
3. Chatbot automatically open होना चाहिए
4. Manual toggle button भी test करें

### **Step 3: Form Submission Test**
1. Chatbot में form fill करें
2. Submit करें
3. Browser console में check करें:
   ```javascript
   // Network tab में POST request check करें
   // /send-to-zoho endpoint
   ```

---

## **Troubleshooting**

### **Common Issues & Solutions**

#### **Issue 1: Chatbot नहीं दिख रहा**
**Solution:**
- Plugin properly activated है?
- WordPress footer में `wp_footer()` call है?
- Browser console में JavaScript errors check करें

#### **Issue 2: Server Connection Error**
**Solution:**
- Server IP address correct है?
- Port 3000 open है?
- CORS settings proper हैं?

#### **Issue 3: Zoho Integration Not Working**
**Solution:**
- API token valid है?
- Server logs check करें
- Zoho CRM permissions check करें

---

## **Security Considerations**

### **WordPress Security**
```php
// Plugin में security add करें
define('WP_DEBUG', false);
wp_nonce_field('roboloans_nonce', 'roboloans_nonce_field');
```

### **Server Security**
```javascript
// Rate limiting add करें
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
```

---

## **Performance Optimization**

### **WordPress Caching**
- WP Super Cache या W3 Total Cache use करें
- CSS/JS files minify करें

### **Server Optimization**
```bash
# PM2 cluster mode use करें
pm2 start server.js -i max --name "roboloans-chatbot"
```

---

## **Mobile Responsiveness**

Chatbot automatically mobile-friendly है:
- Small screens पर size adjust हो जाता है
- Touch gestures properly work करते हैं
- Keyboard input mobile पर optimized है

---

## **Support & Maintenance**

### **Regular Updates**
1. WordPress plugin update करते रहें
2. Zoho API token periodically refresh करें
3. Server logs monitor करें

### **Backup Strategy**
```bash
# WordPress files backup
wp plugin export roboloans-chatbot

# Server files backup
tar -czf roboloans-backup.tar.gz /path/to/bot/
```

---

## **Quick Start Checklist**

- [ ] Node.js server running on public IP
- [ ] WordPress plugin uploaded & activated
- [ ] Server URL configured in WordPress
- [ ] Zoho API token added
- [ ] Auto-open enabled
- [ ] Mobile responsiveness tested
- [ ] Form submission working
- [ ] Error handling tested

---

## **Contact Support**

अगर कोई issue आए तो:
1. Browser console logs check करें
2. Server logs check करें
3. WordPress debug mode enable करें
4. Above troubleshooting steps follow करें

**🎉 Congratulations! आपका Roboloans Chatbot WordPress पर live है!**
