const axios = require('axios');

async function insertChatData() {
  try {
    const response = await axios.post(
      'https://www.zohoapis.com/crm/v2.1/chat_data',
      {
        data: [
          {
            data: "dfgdf"
          }
        ]
      },
      {
        headers: {
          'Authorization': 'Zoho-oauthtoken 1000.1710a87844424b3b1b074f9d22a840cd.10679d4cc2799dbe859e254dadf66c93',
          'Content-Type':  'application/json'
        }
      }
    );

    console.log('✅ Success:', response.data);

  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
}

insertChatData();
