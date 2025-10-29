# EVENT-CONNECT Deployment Guide

## 🚀 Phase 4: Production Deployment

### Prerequisites

1. **GitHub Account** - For code repository and version control
2. **Lovable Account** - For continuous development
3. **Domain** (Optional) - Custom domain for your app
4. **Third-party Accounts**:
   - Google Analytics account
   - Sentry account (for error monitoring)
   - Resend account (for email notifications)
   - Twilio account (for WhatsApp notifications)
   - Google Cloud Console (for Calendar API)

---

## 📊 Analytics Setup

### Google Analytics

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new property for EVENT-CONNECT
3. Get your Measurement ID (format: `G-XXXXXXXXXX`)
4. Add to Lovable project:
   - Go to Settings → Environment Variables
   - Add `VITE_GA_MEASUREMENT_ID` with your measurement ID

**Features Tracked:**
- Page views
- Search queries
- Vendor views
- Booking flows
- Payment events
- User signups/logins

---

## 🐛 Error Monitoring Setup

### Sentry

1. Sign up at [Sentry.io](https://sentry.io/)
2. Create a new project for React
3. Copy your DSN (Data Source Name)
4. Add to Lovable project:
   - Settings → Environment Variables
   - Add `VITE_SENTRY_DSN` with your DSN

**Features:**
- Automatic error capture
- Performance monitoring
- Session replays
- User context tracking
- Breadcrumb trails

---

## 📧 Email Notifications Setup

### Resend

1. Sign up at [Resend.com](https://resend.com/)
2. Verify your domain at [resend.com/domains](https://resend.com/domains)
3. Create API key at [resend.com/api-keys](https://resend.com/api-keys)
4. Add to Lovable Cloud:
   - Backend → Secrets
   - Add `RESEND_API_KEY` with your API key

**Email Templates:**
- Booking confirmations
- Payment receipts
- Event reminders
- Vendor notifications

**Edge Function:** `send-booking-confirmation`

---

## 📱 WhatsApp Notifications Setup

### Twilio

1. Sign up at [Twilio.com](https://www.twilio.com/)
2. Get WhatsApp-enabled phone number from Twilio
3. Copy your Account SID and Auth Token
4. Add to Lovable Cloud secrets:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_NUMBER` (format: `whatsapp:+1234567890`)

**Notifications:**
- Booking confirmations
- Event reminders
- Status updates
- Vendor alerts

**Edge Function:** `whatsapp-notify`

---

## 📅 Google Calendar Integration

### Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

**Features:**
- Auto-add events to user's calendar
- Event reminders
- Calendar invites
- iCal file generation

**Edge Function:** `google-calendar-sync`

**Note:** This requires client-side Google Calendar API integration. The edge function prepares event data and provides iCal download links.

---

## 🔗 GitHub Integration

### Connect Repository

1. In Lovable editor, click **GitHub → Connect to GitHub**
2. Authorize Lovable GitHub App
3. Select your GitHub account/organization
4. Click **Create Repository**

**Benefits:**
- Automatic bidirectional sync
- Version control
- Collaborate with developers
- CI/CD integration ready
- Self-hosting option

---

## 🌐 Deployment Options

### Option 1: Lovable Hosting (Recommended)

**Steps:**
1. Click **Publish** button (top-right in desktop, bottom-right in preview mode)
2. Your app is live at `your-app.lovable.app`
3. Connect custom domain (requires paid plan):
   - Settings → Domains
   - Follow DNS configuration instructions

**Features:**
- Instant deployment
- Automatic SSL
- CDN distribution
- Zero configuration
- Auto-scaling

### Option 2: Self-Hosting

After connecting to GitHub, you can deploy anywhere:

**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**AWS/Render/Railway:** Follow their React deployment guides

---

## 🔐 Environment Variables

### Required Variables

**Frontend (.env):**
```env
# Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Error Monitoring
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Google Maps (if not using default)
VITE_GOOGLE_MAPS_API_KEY=your_key_here

# Stripe (if using payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_xxx
```

**Backend (Lovable Cloud Secrets):**
```env
# AI (Auto-configured)
LOVABLE_API_KEY=auto_configured

# Email
RESEND_API_KEY=re_xxxxx

# WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Frontend URL (for emails)
FRONTEND_URL=https://your-app.lovable.app
```

---

## 📈 Monitoring & Analytics

### Key Metrics to Track

1. **User Engagement:**
   - Daily/Monthly active users
   - Session duration
   - Pages per session

2. **Conversion Funnel:**
   - Search → Vendor View → Booking Started → Payment → Completion
   - Track dropoff at each stage

3. **Performance:**
   - Page load times
   - API response times
   - Error rates

4. **Business Metrics:**
   - Total bookings
   - Revenue
   - Average order value
   - Vendor retention

### Dashboard Access

- **Google Analytics:** [analytics.google.com](https://analytics.google.com/)
- **Sentry:** [sentry.io](https://sentry.io/)
- **Lovable Cloud Logs:** Backend → Logs

---

## 🧪 Testing Checklist

Before launch, verify:

- [ ] All edge functions deployed
- [ ] Email notifications working
- [ ] WhatsApp notifications working
- [ ] Payment flow complete
- [ ] Analytics tracking correctly
- [ ] Error monitoring active
- [ ] Mobile responsive design
- [ ] Cross-browser compatibility
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)

---

## 🚨 Common Issues & Solutions

### Email not sending
- Verify domain at resend.com/domains
- Check RESEND_API_KEY is correct
- Review edge function logs

### WhatsApp not working
- Verify phone number format includes country code
- Check Twilio credentials
- Ensure WhatsApp number is approved by Twilio

### Analytics not tracking
- Verify GA_MEASUREMENT_ID is correct
- Check browser console for errors
- Test in incognito mode (ad blockers may interfere)

### Deployment failed
- Check build logs for errors
- Verify all environment variables are set
- Test locally first

---

## 📞 Support

- **Lovable Docs:** [docs.lovable.dev](https://docs.lovable.dev/)
- **Lovable Discord:** [discord.com/channels/1119885301872070706](https://discord.com/channels/1119885301872070706/1280461670979993613)
- **GitHub Issues:** Create issues in your repository

---

## 🎉 Launch Checklist

- [ ] Connect GitHub repository
- [ ] Configure all environment variables
- [ ] Set up analytics tracking
- [ ] Enable error monitoring
- [ ] Test email notifications
- [ ] Test WhatsApp notifications
- [ ] Verify payment processing
- [ ] Test on multiple devices
- [ ] Deploy to production
- [ ] Configure custom domain (optional)
- [ ] Monitor initial user activity
- [ ] Gather feedback

---

**Your EVENT-CONNECT app is now production-ready!** 🚀