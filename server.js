const axios = require('axios');

async function insertChatData() {
  try {
    const response = await axios.post(
      'https://www.zohoapis.com/crm/v2.1/chat_data',
      {
        data: [
          {
            data: "hello"
          }
        ]
      },
      {
        headers: {
          'Authorization': 'Zoho-oauthtoken 1000.ebe72d5a76711f7fb87afe4862fe504c.2f744c2a02cc187f2434a8fa413467b0',
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
