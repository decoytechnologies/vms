const { ConfidentialClientApplication } = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

const msalConfig = {
  auth: {
    clientId: process.env.MS_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}`,
    clientSecret: process.env.MS_CLIENT_SECRET,
  },
};
const cca = new ConfidentialClientApplication(msalConfig);

const getGraphClient = async () => {
  const authResponse = await cca.acquireTokenByClientCredential({ scopes: ['https://graph.microsoft.com/.default'] });
  return Client.init({ authProvider: (done) => done(null, authResponse.accessToken) });
};

const findApprovalEmail = async (visitorName, employeeEmail) => {
  try {
    const client = await getGraphClient();
    const targetMailbox = process.env.TARGET_MAILBOX_USER_ID;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // THIS IS THE FIX: Escaping single quotes in the visitor's name to prevent syntax errors.
    const safeVisitorName = visitorName.replace(/'/g, "''");
    const filterQuery = `from/emailAddress/address eq '${employeeEmail}' and receivedDateTime ge ${sevenDaysAgo} and contains(subject, 'Visitor Approval Request for ${safeVisitorName}')`;

    const messages = await client.api(`/users/${targetMailbox}/mailFolders/inbox/messages`)
      .filter(filterQuery)
      .select('id')
      .top(1)
      .get();
      
    return messages.value.length > 0;
  } catch (error) {
    console.error('MS Graph Email Search Error:', error.message);
    return false;
  }
};

const sendApprovalRequest = async (employeeEmail, visitorName, visitId) => {
  try {
    const client = await getGraphClient();
    const webhookUrl = `${process.env.API_DOMAIN}/api/webhooks/teams-approval`;

    const adaptiveCard = {
      type: "AdaptiveCard", version: "1.4",
      body: [{ type: "TextBlock", size: "Medium", weight: "Bolder", text: "Visitor Arrival Notification" }, { type: "TextBlock", text: `A visitor, **${visitorName}**, has arrived.`, wrap: true }],
      actions: [{ type: "Action.Http", title: "Approve", method: "POST", url: webhookUrl, body: JSON.stringify({ visitId, action: "approved" }) }, { type: "Action.Http", title: "Deny", method: "POST", url: webhookUrl, body: JSON.stringify({ visitId, action: "denied" }), style: "destructive" }],
    };
    const chatMessage = { body: { contentType: 'application/vnd.microsoft.card.adaptive', content: JSON.stringify(adaptiveCard) } };
    const { id: chatId } = await client.api('/chats').post({ chatType: 'oneOnOne', members: [{ '@odata.type': '#microsoft.graph.aadUserConversationMember', roles: ['owner'], 'user@odata.bind': `https://graph.microsoft.com/v1.0/users/${employeeEmail}` }] });
    await client.api(`/chats/${chatId}/messages`).post(chatMessage);
    console.log(`Sent Teams approval for visit ${visitId} to ${employeeEmail}`);
  } catch (error) {
    console.error('MS Graph Teams Error:', error.message);
  }
};

module.exports = { findApprovalEmail, sendApprovalRequest };

