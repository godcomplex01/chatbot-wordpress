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
    refresh_token: "1000.cf094689fcbcc1e679cda435031fdb75.1b2fb0025afed6d167f09e8e8c2a3fa2",
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
        
        console.log("🔍 Zoho token response:", JSON.stringify(data, null, 2));
        console.log("🔍 Response status:", response.status);

        if (data.access_token) {
            currentAccessToken = data.access_token;
            // Set token expiry (Zoho tokens typically last 1 hour)
            tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
            console.log("✅ Zoho token refreshed successfully");
            return data.access_token;
        } else {
            console.error("❌ Token response error:", data);
            throw new Error(`No access token received. Response: ${JSON.stringify(data)}`);
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

        const accessToken = await getValidZohoToken();
        
        // Create payload with actual user data
        const payload = {
            data: [
                {
                    Full_Name: data.Full_Name || '',
                    Email: data.Email || '',
                    Mobile: data.Mobile || '',
                    Date_of_Birth: data.Date_of_Birth || '',
                    Residency: data.Residency || '',
                    Has_Licence: data.Has_Licence || '',
                    Which_State_Licence: data.Which_State_Licence || '',
                    Licence_Type: data.Licence_Type || '',
                    Bankrupt_Part9: data.Bankrupt_Part9 || '',
                    Self_Rated_Credit: data.Self_Rated_Credit || '',
                    Has_Loans: data.Has_Loans || '',
                    Has_Credit_Cards: data.Has_Credit_Cards || '',
                    Has_Small_Loans: data.Has_Small_Loans || '',
                    Has_Defaults: data.Has_Defaults || '',
                    Income_Type: data.Income_Type || '',
                    Employment_Basis: data.Employment_Basis || '',
                    Income_Amount: data.Income_Amount || '',
                    Income_Frequency: data.Income_Frequency || '',
                    Self_Emp_Type: data.Self_Emp_Type || '',
                    Has_ABN: data.Has_ABN || '',
                    ABN: data.ABN || '',
                    Beside_Centrelink: data.Beside_Centrelink || '',
                    Centrelink_Extra: data.Centrelink_Extra || '',
                    New_Start: data.New_Start || '',
                    Share_Expenses: data.Share_Expenses || '',
                    Relationship: data.Relationship || '',
                    Children: data.Children || '',
                    Children_No: data.Children_No || '',
                    Children_Ages: data.Children_Ages || '',
                    Current_Address: data.Current_Address || '',
                    Address_Types: data.Address_Types || '',
                    Renting: data.Renting || '',
                    Week_Rent: data.Week_Rent || '',
                    Current_Address_Time3yrs: data.Current_Address_Time3yrs || '',
                    prev_address_1: data.prev_address_1 || '',
                    prev_address_1_duration: data.prev_address_1_duration || '',
                    prev_address_2: data.prev_address_2 || '',
                    prev_address_2_duration: data.prev_address_2_duration || '',
                    Employed_Current_Work: data.Employed_Current_Work || '',
                    Employed_Current_Work_Industry: data.Employed_Current_Work_Industry || '',
                    Employed_Current_Job_Duration: data.Employed_Current_Job_Duration || '',
                    Employed_Prev_Occupation: data.Employed_Prev_Occupation || '',
                    Employed_Prev_Work_Industry: data.Employed_Prev_Work_Industry || '',
                    Employed_Prev_Job_Duration: data.Employed_Prev_Job_Duration || '',
                    Confirm_Loans: data.Confirm_Loans || '',
                    Confirm_Credit_Cards: data.Confirm_Credit_Cards || '',
                    Car_Asset: data.Car_Asset || '',
                    Cars_Value: data.Cars_Value || '',
                    Home_Asset: data.Home_Asset || '',
                    Home_Value: data.Home_Value || '',
                    Knocked_Out: data.Knocked_Out || false,
                    Knockout_Reason: data.Knockout_Reason || '',
                    Description: JSON.stringify(data, null, 2)
                }
            ]
        };
        
        console.log('📝 FINAL PAYLOAD WITH USER DATA:', JSON.stringify(payload, null, 2));

console.log('🔍 Attempting to send to Zoho CRM...');
console.log('🔍 Endpoint:', 'https://www.zohoapis.com/crm/v2.1/chat_data');
console.log('🔍 Payload keys:', Object.keys(payload.data[0]));


      const response = await axios.post(
  'https://www.zohoapis.com/crm/v2.1/chat_data',
  payload,
  {
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }
);
        
        console.log(
            '✅ Zoho CRM submission successful:',
            JSON.stringify(response.data, null, 2)
        );

        return {
            success: true,
            data: response.data
        };

    } catch (error) {

        console.error(
            '❌ Zoho CRM Error:',
            JSON.stringify(error.response?.data, null, 2)
        );

        throw new Error('Failed to send to Zoho');
    }
}


// Serve bot HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'botv1.html'));
});


app.get('/test-zoho', async (req, res) => {
  try {

    const tokenResponse = await axios.post(
      'https://accounts.zoho.com/oauth/v2/token',
      new URLSearchParams({
        refresh_token: ZOHO_CONFIG.refresh_token,
        client_id: ZOHO_CONFIG.client_id,
        client_secret: ZOHO_CONFIG.client_secret,
        grant_type: 'refresh_token'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    console.log("Fresh token:", accessToken);

    const response = await axios.get(
      'https://www.zohoapis.com/crm/v2/settings/modules',
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    console.log(
      "FULL ERROR:",
      JSON.stringify(error.response?.data, null, 2)
    );

    res.status(500).json(
      error.response?.data || error.message
    );
  }
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
