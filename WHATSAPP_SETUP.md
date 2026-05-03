# WhatsApp Setup Guide for Kiswa

## Step 1: Create Twilio Account
- Go to twilio.com and create free account
- Get Account SID and Auth Token from dashboard

## Step 2: Activate WhatsApp Sandbox
- In Twilio Console: Messaging → Try it out → Send a WhatsApp message
- You'll get a sandbox number (like +1 415 523 8886)
- To activate: Send "join <your-sandbox-word>" to that number from your WhatsApp

## Step 3: Add to .env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
ADMIN_WHATSAPP_NUMBER=whatsapp:+923XXXXXXXXX
APP_URL=http://localhost:5173
ADMIN_URL=http://localhost:5173

## Step 4: Test
Place a test order and check WhatsApp

## For Production:
- Apply for Twilio WhatsApp Business API
- Or use: Interakt.co (Pakistani friendly, cheaper)
- Or use: Meta Graph API directly (free but more setup)
