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
    // refresh_token: "1000.cf094689fcbcc1e679cda435031fdb75.1b2fb0025afed6d167f09e8e8c2a3fa2",
    // client_id: "1000.UIDY0FULCCZQ5BRXHA8CSDY3UW4WZV",
    // client_secret: "217ee51e20bc96fc882c0e8d9a392a22e5c677db11",
    refresh_token: '1000.d3556f7834a913ff8a21de22fdf597fb.bdc917e26ab53d1f66d0f8178168ee1a',
      client_id:     '1000.UIDY0FULCCZQ5BRXHA8CSDY3UW4WZV',
      client_secret: '217ee51e20bc96fc882c0e8d9a392a22e5c677db11',
      redirect_uri:  'http://www.google.call2back',
      grant_type:    'refresh_token'
};

// Store current access token
let currentAccessToken = null;
let tokenExpiry = null;

async function getZohoAccessToken() {
    try {
        const response = await fetch("https://accounts.zoho.com/oauth/v2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                refresh_token: ZOHO_CONFIG.refresh_token,
                client_id: ZOHO_CONFIG.client_id,
                client_secret: ZOHO_CONFIG.client_secret,
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

        const accessToken = await getValidZohoToken();
 

// Try with standard Zoho CRM fields first
const payload = {
    data: [
          {
            Key: "keyValue"
          }
        ]
};


     
console.log(
  'FINAL CLEAN PAYLOAD:',
  JSON.stringify(payload, null, 2)
);

console.log('🔍 Attempting to send to Zoho CRM...');
console.log('🔍 Endpoint:', 'https://www.zohoapis.com/crm/v2.1/chat_data');
console.log('🔍 Payload keys:', Object.keys(payload.data[0]));


      const response = await axios.post(
  'https://www.zohoapis.com/crm/v2.1/chat_data',
  {
    data: [
      {
        Key: "Status: Knockout\nFull_Name: sdaf\nEmail: sadf@gmail.com\nMobile: \nDate_of_Birth: 12/12/2002\nResidency: Australian Citizen\nHas_Licence: No\nWhich_State_Licence: \nLicence_Type: \nBankrupt_Part9: Yes\nSelf_Rated_Credit: \nHas_Loans: \nHas_Credit_Cards: \nHas_Small_Loans: \nHas_Defaults: \nIncome_Type: \nEmployment_Basis: \nIncome_Amount: \nIncome_Frequency: \nSelf_Emp_Type: \nHas_ABN: \nABN: \nBeside_Centrelink: \nCentrelink_Extra: \nNew_Start: \nShare_Expenses: \nRelationship: \nChildren: \nChildren_No: \nChildren_Ages: \nCurrent_Address: \nAddress_Types: \nRenting: \nWeek_Rent: \nCurrent_Address_Time3yrs: \nprev_address_1: \nprev_address_1_duration: \nprev_address_2: \nprev_address_2_duration: \nEmployed_Current_Work: \nEmployed_Current_Work_Industry: \nEmployed_Current_Job_Duration: \nEmployed_Prev_Occupation: \nEmployed_Prev_Work_Industry: \nEmployed_Prev_Job_Duration: \nCar_Asset: \nCars_Value: \nHome_Asset: \nHome_Value: \nProperty_Asset: \nOther_Property_Value: \nHas_Savings: \nSavings_Amount: \nHas_Super: \nSuper_Amount: \nConsent: \nCentrelink_History_Profile: \nLoans: []\nCredit_Cards: []"
      }
    ]
  },
  {
    headers: {
      'Authorization': `Zoho-oauthtoken 1000.cf094689fcbcc1e679cda435031fdb75.1b2fb0025afed6d167f09e8e8c2a3fa2`,
      'Content-Type':  'application/json'
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
