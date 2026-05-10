const axios = require('axios');

async function getAccessToken() {
  const response = await axios.post(
    'https://accounts.zoho.com/oauth/v2/token',
    new URLSearchParams({
      refresh_token: 'YOUR_REFRESH_TOKEN',
      client_id: 'YOUR_CLIENT_ID',
      client_secret: 'YOUR_CLIENT_SECRET',
      grant_type: 'refresh_token'
    })
  );

  return response.data.access_token;
}

async function saveChatData(chatbotData) {
  const accessToken = await getAccessToken();

  const response = await axios.post(
    'https://www.zohoapis.com/crm/v2/Chat_Data',
    {
      data: [
        {
          Chat_Content: chatbotData
        }
      ]
    },
    {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  console.log(response.data);
}

saveChatData("hello world");
