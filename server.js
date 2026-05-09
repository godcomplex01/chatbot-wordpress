const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Store submissions (in production, use database)
const submissions = [];

// Serve the bot HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'botv1.html'));
});

// Handle chatbot submission
app.post('/api/submit', async (req, res) => {
    try {
        console.log('Received submission:', req.body);
        
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
            console.error('Zoho error:', error.message);
            submission.zohoError = error.message;
        }
        
        // Send email notification (you can integrate email service here)
        console.log('Email notification sent for submission:', submission.id);
        
        res.json({
            success: true,
            message: 'Application submitted successfully!',
            submission_id: submission.id,
            zoho_response: zohoResponse
        });
        
    } catch (error) {
        console.error('Submission error:', error);
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

// Send to Zoho CRM
async function sendToZoho(data) {
    try {
        const response = await axios.post(
            'https://www.zohoapis.com/crm/v2/Chat_JSON',
            {
                data: [{
                    Name: data.Full_Name || 'Unknown',
                    Email: data.Email || '',
                    Mobile: data.Mobile || '',
                    Chat_JSON: JSON.stringify(data, null, 2)
                }]
            },
            {
                headers: {
                    'Authorization': 'Zoho-oauthtoken 1000.bd0f029855f4cb60b28a9c2ddfafff33.4131d93c21de52816708a3319eb43060',
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        
        console.log('Zoho response:', response.data);
        return {
            status: response.status,
            data: response.data,
            success: true
        };
        
    } catch (error) {
        console.error('Zoho API error:', error.response?.data || error.message);
        
        // Try alternative Zoho endpoint
        try {
            const altResponse = await axios.post(
                'https://creator.zoho.com/api/v2/timi-chatbot/form/Webhook',
                {
                    data: {
                        Multi_Line: JSON.stringify(data, null, 2)
                    }
                },
                {
                    headers: {
                        'Authorization': 'Zoho-oauthtoken 1000.bd0f029855f4cb60b28a9c2ddfafff33.4131d93c21de52816708a3319eb43060',
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
            
            console.log('Alternative Zoho response:', altResponse.data);
            return {
                status: altResponse.status,
                data: altResponse.data,
                success: true,
                method: 'Creator Webhook'
            };
            
        } catch (altError) {
            console.error('Alternative Zoho error:', altError.message);
            throw new Error('Failed to send to Zoho CRM');
        }
    }
}

// Zoho webhook endpoint
app.post('/send-to-zoho', async (req, res) => {
  const { data } = req.body;
  
  try {
    // Log received data
    console.log('Received data:', JSON.stringify(data, null, 2));
    
    // Send to Zoho Creator Webhook (Alternative Solution)
    let response;
    
    response = await axios.post(
      'https://creator.zoho.com/api/v2/timi-chatbot/form/Webhook',
      {
        data: {
          Multi_Line: JSON.stringify(data, null, 2)
        }
      },
      {
        headers: {
          'Authorization': 'Zoho-oauthtoken 1000.bd0f029855f4cb60b28a9c2ddfafff33.4131d93c21de52816708a3319eb43060',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Zoho response:', response.data);
    res.json({ 
      success: true, 
      message: 'Data sent to Zoho successfully',
      zohoResponse: response.data 
    });
    
  } catch (error) {
      console.log('Chat_JSON field failed, trying individual fields...');
      
      // Method 2: Use correct Zoho CRM field names
      console.log('Attempting Zoho CRM with Email:', data.Email);
      
      // Use correct field names from GET response analysis
      const zohoData = {
        Email: data.Email || '',
        Last_Name: data.Full_Name || '',
        Mobile: data.Mobile || '',
        Company: 'Roboloans', // Add mandatory Company field
        Description: JSON.stringify(data, null, 2)
      };
      
      try {
        response = await axios.post(
          'https://www.zohoapis.com/crm/v2/Chat_JSON',
          {
            "data": [
                {
                    "Name": data.Full_Name || 'Unknown',
                    "Chat_JSON": JSON.stringify(data, null, 2)
                }
            ]
          },
          {
            headers: {
              'Authorization': 'Zoho-oauthtoken 1000.bd0f029855f4cb60b28a9c2ddfafff33.4131d93c21de52816708a3319eb43060',
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Zoho response:', response.data);
        res.json({ 
          success: true, 
          message: 'Data sent to Zoho successfully',
          zohoResponse: response.data 
        });
        return;
      } catch (fieldError) {
        console.log('Chat_JSON field failed, trying with different module...');
        console.log('Error details:', JSON.stringify(fieldError.response?.data, null, 2) || 'No details available');
        console.log('Full error:', fieldError.message);
        
        // Try with different module names
        const modules = ['Leads', 'Contacts', 'Deals', 'Accounts'];
        for (const module of modules) {
          try {
            response = await axios.post(
              `https://www.zohoapis.com/crm/v2/${module}`,
              {
                data: [{
                 "Name": "abc",
            "Chat_JSON": JSON.stringify(data, null, 2)

                  
                }]
              },
              {
                headers: {
                  'Authorization': 'Zoho-oauthtoken 1000.bd0f029855f4cb60b28a9c2ddfafff33.4131d93c21de52816708a3319eb43060',
                  'Content-Type': 'application/json'
                }
              }
            );
            console.log(`${module} module success!`);
            console.log('Zoho response:', response.data);
            res.json({ 
              success: true, 
              message: 'Data sent to Zoho successfully',
              zohoResponse: response.data 
            });
            return;
          } catch (moduleError) {
            console.log(`${module} module failed:`, moduleError.response?.data || moduleError.message);
          }
        }
      }
    }  // <-- Missing closing brace for the try block at line 64
    console.error('Error sending to Zoho:', error.message);
    if (error.response) {
      console.error('Zoho Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      console.error('Full Error Response:', JSON.stringify(error.response.data, null, 2));
    }
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data || 'No additional details'
    });
  });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Bot available at: https://chatbot-wordpress.onrender.com`);
  console.log('Zoho webhook endpoint: /send-to-zoho');
});
