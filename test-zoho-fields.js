const axios = require('axios');

async function testDifferentFields() {
  const testData = {
    "Status": "Knockout",
    "Full_Name": "Test User",
    "Email": "test@example.com",
    "Mobile": "1234567890"
  };

  // Test 1: Just Chat_JSON field (like your curl example)
  try {
    console.log('=== Test 1: Only Chat_JSON field ===');
    const response1 = await axios.post(
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
    console.log('✅ Test 1 SUCCESS:', response1.data);
  } catch (error) {
    console.log('❌ Test 1 FAILED:', error.response?.data);
  }

  // Test 2: Add Name field (common mandatory field)
  try {
    console.log('\n=== Test 2: Chat_JSON + Name ===');
    const response2 = await axios.post(
      'https://www.zohoapis.com/crm/v2/Chat_JSON',
      {
        "data": [
          {
            "Name": "Test User",
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
    console.log('✅ Test 2 SUCCESS:', response2.data);
  } catch (error) {
    console.log('❌ Test 2 FAILED:', error.response?.data);
  }

  // Test 3: Add common mandatory fields
  try {
    console.log('\n=== Test 3: Chat_JSON + common fields ===');
    const response3 = await axios.post(
      'https://www.zohoapis.com/crm/v2/Chat_JSON',
      {
        "data": [
          {
            "Name": "Test User",
            "Email": "test@example.com",
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
    console.log('✅ Test 3 SUCCESS:', response3.data);
  } catch (error) {
    console.log('❌ Test 3 FAILED:', error.response?.data);
  }
}

testDifferentFields();
