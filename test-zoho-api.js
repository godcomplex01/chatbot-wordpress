const axios = require('axios');

async function testZohoAPI() {
  const testData = {
    "Status": "Knockout",
    "Full_Name": "Test User",
    "Email": "test@example.com",
    "Mobile": "1234567890",
    "Date_of_Birth": "12/12/2002",
    "Residency": "Australian Citizen",
    "Has_Licence": "No",
    "Bankrupt_Part9": "Yes"
  };

  try {
    console.log('Testing Zoho Chat_JSON API...');
    console.log('Data being sent:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(
      'https://www.zohoapis.com/crm/v2/Chat_JSON',
      {
        "data": [
          {
            "Chat_JSON": JSON.stringify(testData, null, 2)
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
    
    console.log('✅ SUCCESS:', response.data);
    
  } catch (error) {
    console.log('❌ ERROR:');
    console.log('Status:', error.response?.status);
    console.log('Error Details:', JSON.stringify(error.response?.data, null, 2));
    if (error.response?.data?.data?.[0]?.details) {
      console.log('Missing Fields:', JSON.stringify(error.response.data.data[0].details, null, 2));
    }
    console.log('Message:', error.message);
  }
}

testZohoAPI();
