# Staging Site Deployment Guide
## 🚀 Deploy to https://staging3.roboloans.ai/

---

## **📋 Pre-Deployment Checklist**

- [ ] WordPress admin access to staging3.roboloans.ai
- [ ] Zoho CRM API token ready
- [ ] Plugin files prepared
- [ ] Assets folder with CSS/JS files

---

## **🎯 Step-by-Step Deployment**

### **Step 1: Access WordPress Admin**
1. Go to: `https://staging3.roboloans.ai/wp-admin`
2. Login with your WordPress credentials
3. Navigate to: `Plugins` → `Add New` → `Upload Plugin`

### **Step 2: Upload Plugin**
1. Choose `wordpress-only-plugin.php` file
2. Click `Install Now`
3. After installation, click `Activate Plugin`

### **Step 3: Create Assets Folder**
1. Via FTP/cPanel or WordPress File Manager:
   ```
   /wp-content/plugins/roboloans-chatbot/
   ├── wordpress-only-plugin.php (already uploaded)
   └── assets/ (create this folder)
       ├── chatbot-style.css
       └── wordpress-chatbot-script.js
   ```

### **Step 4: Upload Assets**
1. Upload `chatbot-style.css` to `/assets/` folder
2. Upload `wordpress-chatbot-script.js` to `/assets/` folder

### **Step 5: Configure Plugin**
1. In WordPress admin, go to `Roboloans Chatbot` menu
2. Enter your **Zoho API Token**
3. Set **Notification Email** (your email)
4. Configure **Display Settings**:
   - Auto-Open: Yes
   - Delay: 2 seconds
   - Position: Bottom-Right
   - Site-Wide Display: Yes
5. Click `Save Changes`

---

## **⚙️ Configuration for Staging**

### **Zoho API Configuration**
```php
// In WordPress admin → Roboloans Chatbot → Settings
Zoho API Token: 1000.bd0f029855f4cb60b28a9c2ddfafff33.4131d93c21de52816708a3319eb43060
Notification Email: your-email@roboloans.ai
Auto-Open Chat: Yes
Delay: 2 seconds
Position: Bottom-Right
Site-Wide Display: Yes
```

### **Staging-Specific Settings**
- **Debug Mode**: Enable for testing
- **Email Notifications**: Test with staging email
- **SSL Certificate**: Ensure HTTPS works
- **Caching**: Disable during testing

---

## **🧪 Testing Checklist**

### **Basic Functionality**
- [ ] Chatbot appears on page load
- [ ] Auto-opens after 2 seconds (first visit)
- [ ] Toggle button works
- [ ] Close button works
- [ ] Mobile responsive

### **Form Testing**
- [ ] Name field validation
- [ ] Email field validation  
- [ ] Mobile field validation
- [ ] Date of birth validation
- [ ] Button selections work
- [ ] Form submission completes

### **Integration Testing**
- [ ] Data saves to WordPress database
- [ ] Email notifications sent
- [ ] Zoho API integration works
- [ ] Admin dashboard shows submissions

---

## **🔍 Testing URLs**

### **Test Pages**
```
Homepage: https://staging3.roboloans.ai/
Admin: https://staging3.roboloans.ai/wp-admin
Chatbot Admin: https://staging3.roboloans.ai/wp-admin/admin.php?page=roboloans-chatbot
Submissions: https://staging3.roboloans.ai/wp-admin/admin.php?page=roboloans-submissions
```

### **Mobile Testing**
```
Mobile View: https://staging3.roboloans.ai/ (use browser dev tools)
Tablet View: Test responsive design
Touch Gestures: Test on actual mobile device
```

---

## **🐛 Common Staging Issues & Solutions**

### **Issue 1: Plugin Not Activating**
**Solution:**
- Check PHP version (requires 7.4+)
- Verify file permissions (755 for folders, 644 for files)
- Check WordPress version (5.0+)

### **Issue 2: CSS/JS Not Loading**
**Solution:**
- Verify assets folder structure
- Check file paths in plugin
- Clear WordPress cache
- Check browser console for 404 errors

### **Issue 3: Zoho API Failing**
**Solution:**
- Verify API token is correct
- Check Zoho CRM permissions
- Test API endpoint directly:
  ```bash
  curl -X POST https://www.zohoapis.com/crm/v2/Chat_JSON \
    -H "Authorization: Zoho-oauthtoken YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"data": [{"Name": "Test", "Chat_JSON": "{}"}]}'
  ```

### **Issue 4: Form Not Submitting**
**Solution:**
- Check WordPress AJAX URL
- Verify nonce generation
- Review browser network tab
- Check WordPress debug log

---

## **📊 Performance Testing**

### **Page Load Impact**
```bash
# Test page speed before and after
curl -w "@curl-format.txt" -o /dev/null -s https://staging3.roboloans.ai/
```

### **Database Performance**
```sql
-- Check submissions table
SELECT COUNT(*) FROM wp_roboloans_submissions;
SELECT * FROM wp_roboloans_submissions ORDER BY created_at DESC LIMIT 5;
```

---

## **🔧 Debug Mode Setup**

### **Enable WordPress Debug**
Add to `wp-config.php`:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

### **Check Debug Log**
```bash
# View debug log
tail -f /wp-content/debug.log
```

### **Browser Console Debug**
```javascript
// Check for JavaScript errors
console.log('Roboloans Chatbot Debug:');
console.log('AJAX URL:', roboloans_vars.ajax_url);
console.log('Plugin URL:', roboloans_vars.plugin_url);
```

---

## **📱 Mobile Testing Checklist**

### **Responsive Design**
- [ ] Chat fits on mobile screens
- [ ] Buttons are touch-friendly
- [ ] Text is readable
- [ ] Keyboard works properly

### **Performance**
- [ ] Fast loading on mobile
- [ ] Smooth animations
- [ ] No layout shifts

### **Functionality**
- [ ] Touch gestures work
- [ ] Form inputs work
- [ ] Auto-open works
- [ ] Close button accessible

---

## **🔄 Post-Deployment Tasks**

### **Immediate**
1. Test all functionality
2. Verify database tables created
3. Check email notifications
4. Confirm Zoho integration

### **Within 24 Hours**
1. Monitor error logs
2. Check submission data
3. Verify email delivery
4. Test on multiple devices

### **Weekly Maintenance**
1. Review submission logs
2. Check API limits
3. Monitor performance
4. Update if needed

---

## **📞 Support Contacts**

### **WordPress Issues**
- Check WordPress admin dashboard
- Review plugin settings
- Clear cache

### **Zoho Integration**
- Verify API token
- Check Zoho CRM status
- Review API documentation

### **Emergency**
- Disable plugin if issues occur
- Restore from backup if needed
- Contact hosting support

---

## **✅ Go-Live Checklist**

- [ ] Plugin uploaded and activated
- [ ] Assets uploaded correctly
- [ ] Zoho API configured
- [ ] Email notifications working
- [ ] Database tables created
- [ ] Chatbot visible on site
- [ ] Mobile responsive tested
- [ ] Form submission tested
- [ ] Admin dashboard working
- [ ] Error monitoring setup

---

## **🎉 Success Metrics**

### **Technical Success**
- Plugin loads without errors
- Chatbot appears correctly
- Forms submit successfully
- Data syncs with Zoho

### **User Experience**
- Fast loading times
- Mobile friendly
- Easy to use
- Professional appearance

### **Business Success**
- Lead capture working
- Data quality good
- Notifications received
- Integration complete

---

## **🚀 Ready for Production!**

Once all tests pass on staging, you're ready to deploy to production. The same plugin and settings will work on your live site.

**Next Steps:**
1. Complete staging testing
2. Document any issues
3. Prepare for production deployment
4. Monitor performance

**🎊 Your chatbot will be live on staging3.roboloans.ai!**
