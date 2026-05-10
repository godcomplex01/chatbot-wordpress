const axios = require('axios');

async function getAccessToken() {
  const response = await axios.post(
    'https://accounts.zoho.com/oauth/v2/token',
    new URLSearchParams({
      refresh_token: '1000.af1bc19a73fe647600ca9645ebb1e0ad.b3bb7cba00dc14d7feacaefcf289a884',
      client_id:     '1000.UIDY0FULCCZQ5BRXHA8CSDY3UW4WZV',
      client_secret: '217ee51e20bc96fc882c0e8d9a392a22e5c677db11',
      redirect_uri:  'http://www.google.call2back',
      grant_type:    'refresh_token'
    })
  );
  return response.data.access_token;
}

async function saveChatData(chatbotData) {
  const accessToken = await getAccessToken();

  const response = await axios.post(
    'https://www.zohoapis.com/crm/v2.1/chat_data',
    {
      data: [{
        Data: chatbotData  // yahan apne multiline field ka exact API name daal
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
const chatbotData = `User: Hello
Bot: Hi! How can I help?
User: I need support
Bot: Sure, let me help you!`;

saveChatData(chatbotData)
  .catch(err => console.error('❌ Error:', err.response?.data || err.message));
