// External Node.js Server for Chatbot Backend
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Zoho API Configuration
const ZOHO_TOKEN = '1000.bd0f029855f4cb60b28a9c2ddfafff33.4131d93c21de52816708a3319eb43060';

// Store submissions (in production, use database)
const submissions = [];

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
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
                    'Authorization': `Zoho-oauthtoken ${ZOHO_TOKEN}`,
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
                        'Authorization': `Zoho-oauthtoken ${ZOHO_TOKEN}`,
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

// Serve static files (for admin panel)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Chatbot Server running on port ${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
    console.log(`🔗 API endpoint: http://localhost:${PORT}/api/submit`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
