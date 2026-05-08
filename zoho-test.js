// Test script to find correct Zoho CRM module
const axios = require('axios');

const testData = {
  Email: 'test@example.com',
  Company: 'Roboloans'
};

const modules = ['Leads', 'Contacts', 'Deals', 'Accounts', 'Potentials', 'Campaigns'];

async function testModules() {
  // First test API connectivity with GET request
  try {
    console.log('Testing API connectivity...');
    const getResponse = await axios.get(
      'https://www.zohoapis.com/crm/v2/Leads',
      {
        headers: {
          'Authorization': 'Zoho-oauthtoken 1000.d995696195872d1bfd0b8ce220690f87.c71aee2afa5f753c3ee8f684061fca57'
        }
      }
    );
    console.log('✅ API connectivity OK - GET request works');
    console.log('GET Response:', getResponse.data);
  } catch (getError) {
    console.log('❌ API connectivity failed:', getError.response?.status, getError.response?.statusText);
    console.log('GET Error details:', JSON.stringify(getError.response?.data, null, 2) || getError.message);
    return null;
  }

  for (const module of modules) {
    try {
      console.log(`Testing ${module} module...`);
      const response = await axios.post(
        `https://www.zohoapis.com/crm/v2/${module}`,
        {
          data: [testData]
        },
        {
          headers: {
            'Authorization': 'Zoho-oauthtoken 1000.d995696195872d1bfd0b8ce220690f87.c71aee2afa5f753c3ee8f684061fca57',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data[0] && response.data[0].code === 'SUCCESS') {
        console.log(`✅ ${module} module WORKS!`);
        console.log('Response:', response.data[0]);
        return module;
      } else {
        console.log(`❌ ${module} module failed:`, response.data[0]?.message || 'Unknown error');
      }
    } catch (error) {
      console.log(`❌ ${module} module error:`, error.response?.status, error.response?.statusText);
      console.log('Full error:', JSON.stringify(error.response?.data, null, 2) || error.message);
      console.log('Request URL:', `https://www.zohoapis.com/crm/v2/${module}`);
      console.log('Request data:', JSON.stringify(testData, null, 2));
    }
  }
}

testModules().then(workingModule => {
  if (workingModule) {
    console.log(`\n🎉 WORKING MODULE: ${workingModule}`);
    console.log('Update your server.js to use this module!');
  } else {
    console.log('\n❌ No working modules found. Check:');
    console.log('1. API Token permissions');
    console.log('2. Module access in Zoho CRM');
    console.log('3. Correct field names');
  }
});
