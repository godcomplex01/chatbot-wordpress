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

// async function sendToZoho(data) {
//     try {

//         const accessToken = await getValidZohoToken();

//         // CRM custom module payload
 

// const payload = {
//     data: [
//         {
//             Full_Name: data.Full_Name || '',
//             Email: data.Email || '',
//             Mobile: data.Mobile || '',
//             Date_of_Birth: data.Date_of_Birth || '',
//             Residency: data.Residency || '',
//             Has_Licence: data.Has_Licence || '',
//             Bankrupt_Part9: data.Bankrupt_Part9 || '',
//             Status: data.Status || ''
//         }
//     ]
// };


     
// console.log(
//   'FINAL CLEAN PAYLOAD:',
//   JSON.stringify(payload, null, 2)
// );


//         const response = await axios.post(
//             'https://www.zohoapis.com/crm/v2.1/chat_data',
//             payload,
//             {
//                 headers: {
//                     Authorization: `Zoho-oauthtoken ${accessToken}`,
//                     'Content-Type': 'application/json'
//                 },
//                 timeout: 30000
//             }
//         );

//         console.log(
//             '✅ Zoho CRM submission successful:',
//             JSON.stringify(response.data, null, 2)
//         );

//         return {
//             success: true,
//             data: response.data
//         };

//     } catch (error) {

//         console.error(
//             '❌ Zoho CRM Error:',
//             JSON.stringify(error.response?.data, null, 2)
//         );

//         throw new Error('Failed to send to Zoho');
//     }
// }

 async function saveChatData(chatbotData) {
  const accessToken = await getAccessToken();
     const payload = {
    data: [
        {
            Full_Name: data.Full_Name || '',
            Email: data.Email || '',
            Mobile: data.Mobile || '',
            Date_of_Birth: data.Date_of_Birth || '',
            Residency: data.Residency || '',
            Has_Licence: data.Has_Licence || '',
            Bankrupt_Part9: data.Bankrupt_Part9 || '',
            Status: data.Status || ''
        }
    ]
};

  const response = await axios.post(
    'https://www.zohoapis.com/crm/v2.1/chat_data',
    {
      data: [{
        Data: payLoad  // yahan apne multiline field ka exact API name daal
      }]
    },
    {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type':  'application/json'
      }
    }
  );

  console.log('✅ Saved:', response.data);
}

// Chatbot se jo bhi data aaye woh yahan pass karo


saveChatData(payLoad)
  .catch(err => console.error('❌ Error:', err.response?.data || err.message));

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
