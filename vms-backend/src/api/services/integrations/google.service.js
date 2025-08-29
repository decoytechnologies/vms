const { google } = require('googleapis');

const getJwtClient = () => {
  try {
    const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    return new google.auth.JWT(
      serviceAccountKey.client_email,
      null,
      serviceAccountKey.private_key,
      [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/chat.bot'
      ],
      process.env.GOOGLE_TARGET_MAILBOX_EMAIL
    );
  } catch (error) {
    console.error("Error parsing GOOGLE_SERVICE_ACCOUNT_KEY. Make sure it's a valid JSON string in your .env file.", error);
    return null;
  }
};

const findApprovalEmail = async (visitorName, employeeEmail) => {
  const auth = getJwtClient();
  if (!auth) return false;

  try {
    const gmail = google.gmail({ version: 'v1', auth });
    const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    const query = `subject:"Visitor Approval Request for ${visitorName}" from:"${employeeEmail}" after:${sevenDaysAgo}`;

    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 1,
    });

    return res.data.messages?.length > 0;
  } catch (error) {
    console.error('Google Gmail Search Error:', error.message);
    return false;
  }
};

const sendApprovalRequest = async (employeeEmail, visitorName, visitId) => {
  const auth = getJwtClient();
  if (!auth) return;
  
  try {
    const chat = google.chat({ version: 'v1', auth });
    const webhookUrl = `${process.env.API_DOMAIN}/api/webhooks/google-chat-approval`;

    const card = {
      cardsV2: [{
        cardId: `visit-approval-${visitId}`,
        card: {
          header: { title: "Visitor Arrival Notification" },
          sections: [{
            widgets: [
              { textParagraph: { text: `A visitor, <b>${visitorName}</b>, has arrived and is waiting for your approval.` } },
              { buttonList: { buttons: [
                { text: "Approve", onClick: { action: { function: webhookUrl, parameters: [{ key: "visitId", value: visitId }, { key: "action", value: "approved" }] } } },
                { text: "Deny", onClick: { action: { function: webhookUrl, parameters: [{ key: "visitId", value: visitId }, { key: "action", value: "denied" }] } }, }
              ]}}
            ]
          }]
        }
      }]
    };
    
    await chat.spaces.messages.create({
      parent: `spaces/users/${employeeEmail}`,
      requestBody: card,
    });
    console.log(`Sent Google Chat approval for visit ${visitId} to ${employeeEmail}`);
  } catch (error) {
    console.error(`Google Chat Error: ${error.message}`);
  }
};

module.exports = { findApprovalEmail, sendApprovalRequest };
