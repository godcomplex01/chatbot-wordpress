const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Store submissions (in production, use database)
const submissions = [];

// Zoho OAuth configuration
const ZOHO_CONFIG = {
    refresh_token: "1000.af1bc19a73fe647600ca9645ebb1e0ad.b3bb7cba00dc14d7feacaefcf289a884",
    client_id: "1000.UIDY0FULCCZQ5BRXHA8CSDY3UW4WZV",
    client_secret: "217ee51e20bc96fc882c0e8d9a392a22e5c677db11",
    redirect_uri: "http://www.google.call2back"
};

// Store current access token
let currentAccessToken = null;
let tokenExpiry = null;

async function getZohoAccessToken() {
    try {
        const response = await fetch("https://accounts.zoho.com.au/oauth/v2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                refresh_token: ZOHO_CONFIG.refresh_token,
                client_id: ZOHO_CONFIG.client_id,
                client_secret: ZOHO_CONFIG.client_secret,
                redirect_uri: ZOHO_CONFIG.redirect_uri,
                grant_type: "refresh_token"
            })
        });

        const data = await response.json();

        if (data.access_token) {
            currentAccessToken = data.access_token;
            // Set token expiry (Zoho tokens typically last 1 hour)
            tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
            console.log("✅ Zoho token refreshed successfully");
            return data.access_token;
        } else {
            throw new Error("No access token received");
        }

    } catch (error) {
        console.error("❌ Zoho token refresh error:", error);
        throw error;
    }
}

async function getValidZohoToken() {
    // Check if we have a valid token
    if (currentAccessToken && tokenExpiry && Date.now() < tokenExpiry) {
        return currentAccessToken;
    }
    
    // Get new token
    return await getZohoAccessToken();
}

// Send to Zoho CRM
async function sendToZoho(data) {
    try {
        // Get valid access token
        const accessToken = await getValidZohoToken();
        
        const response = await axios.post(
            'https://www.zohoapis.com.au/crm/v2/Leads',
            {
                data: [{
                    Last_Name: data.Full_Name || 'Unknown',
                    Email: data.Email || '',
                    Phone: data.Mobile || '',
                    Description: JSON.stringify(data, null, 2)
                }]
            },
            {
                headers: {
                    'Authorization': `Zoho-oauthtoken ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log('✅ Zoho CRM submission successful:', response.data);
        return {
            status: response.status,
            data: response.data,
            success: true
        };
        
    } catch (error) {
        console.error('❌ Zoho CRM API error:', error.response?.data || error.message);
        throw new Error('Failed to send to Zoho CRM');
    }
}

// Serve bot HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'botv1.html'));
});

// Handle chatbot submission
app.post('/api/submit', async (req, res) => {
    try {
        console.log('📝 Received submission:', req.body);
        
        const { data } = req.body;
        
        // Validate required fields
        if (!data.Full_Name || !data.Email) {
            return res.status(400).json({
                success: false,
                message: 'Name and email are required'
            });
        }
        
        // Store submission
        const submission = {
            id: Date.now(),
            ...data,
            timestamp: new Date().toISOString(),
            status: 'Pending'
        };
        
        submissions.push(submission);
        
        // Send to Zoho
        let zohoResponse = null;
        try {
            zohoResponse = await sendToZoho(data);
            submission.status = 'Sent to Zoho';
            submission.zohoResponse = zohoResponse;
        } catch (error) {
            console.error('❌ Zoho submission error:', error.message);
            submission.zohoError = error.message;
        }
        
        console.log('📧 Submission processed:', submission.id);
        
        res.json({
            success: true,
            message: 'Application submitted successfully!',
            submission_id: submission.id,
            zoho_response: zohoResponse
        });
        
    } catch (error) {
        console.error('❌ Submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get all submissions (for admin)
app.get('/api/submissions', (req, res) => {
    res.json({
        success: true,
        submissions: submissions.reverse() // Latest first
    });
});

// Get single submission
app.get('/api/submissions/:id', (req, res) => {
    const submission = submissions.find(s => s.id == req.params.id);
    if (!submission) {
        return res.status(404).json({
            success: false,
            message: 'Submission not found'
        });
    }
    
    res.json({
        success: true,
        submission: submission
    });
});

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🤖 Bot available at: https://chatbot-wordpress.onrender.com`);
  console.log(`📊 Admin panel: https://chatbot-wordpress.onrender.com/admin`);
});
