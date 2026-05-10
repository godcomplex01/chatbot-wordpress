const axios = require('axios');

async function insertChatData() {
  try {
    const response = await axios.post(
      'https://www.zohoapis.com/crm/v2.1/chat_data',
      {
        data: [
          {
            name: "value"
          }
        ]
      },
      {
        headers: {
          Authorization: 'Zoho-oauthtoken 1000.3a26812340880e9f788d79d21f40ab03.92d6d42d64cb10bba19123b7811db669',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Success:', response.data);

  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
}

insertChatData();
