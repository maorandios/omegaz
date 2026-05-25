export interface LegalSection {
  heading: string
  body: string[]
  items?: { label: string; text: string }[]
}

export interface LegalDocument {
  id: 'terms' | 'privacy'
  title: string
  shortTitle: string
  lastUpdated: string
  intro: string[]
  sections: LegalSection[]
  footer?: string[]
}

export const TERMS_DOC: LegalDocument = {
  id: 'terms',
  title: 'Segments — Terms and Conditions of Service',
  shortTitle: 'Terms & Conditions',
  lastUpdated: 'May 2026',
  intro: [
    'Welcome to Segments. By accessing or using our Progressive Web Application (the "App") or our website (getsegments.co), you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please do not use the App.',
  ],
  sections: [
    {
      heading: '1. Description of Service',
      body: [
        'Segments provides a digital utility tool designed for drawing sheet metal profiles, calculating general dimensions, and exporting specification sheets into PDF formats ("Exports").',
      ],
    },
    {
      heading: '2. User Responsibility & Fabrication Liability',
      body: [
        'The Golden Rule: Segments is an assistant layout tool, not a certified structural engineering platform.',
      ],
      items: [
        {
          label: 'Final Verification',
          text: 'The User assumes 100% sole responsibility for verifying all millimeter measurements, angles, material tolerances, and dimensions prior to sending any Export to a metal fabrication shop or manufacturer.',
        },
        {
          label: 'Limitation of Liability',
          text: 'Segments (and its parent entity/operators) shall not be held liable for any financial losses, wasted material costs, structural installation errors, or project delays resulting from incorrect calculations, app glitches, software bugs, or user input errors.',
        },
      ],
    },
    {
      heading: '3. Accounts and Subscriptions',
      body: [],
      items: [
        {
          label: 'Access',
          text: 'To use the App, you must register using a valid email address or phone number via a One-Time Password (OTP). You are responsible for keeping your access secure.',
        },
        {
          label: 'Pricing & Billing',
          text: 'Premium features are billed on a subscription basis (€49 / £39 per month, plus applicable VAT). Subscriptions automatically renew unless cancelled by the user prior to the billing cycle date.',
        },
        {
          label: 'Refunds',
          text: 'Due to the digital utility nature of the software and the availability of free tiers/trials, payments are non-refundable once a billing cycle has cleared.',
        },
      ],
    },
    {
      heading: '4. Termination of Service',
      body: [
        'We reserve the right to suspend or terminate your access to the App at any time, without prior notice, if we suspect misuse, fraudulent activity, or a violation of these terms.',
      ],
    },
  ],
}

export const PRIVACY_DOC: LegalDocument = {
  id: 'privacy',
  title: 'Segments — Privacy Policy',
  shortTitle: 'Privacy Policy',
  lastUpdated: 'May 2026',
  intro: [
    'At Segments, we respect your privacy and are committed to protecting your personal data in full compliance with relevant data protection regulations, including the UK General Data Protection Regulation (UK GDPR).',
  ],
  sections: [
    {
      heading: '1. Data We Collect',
      body: ['To operate the App efficiently, we collect minimal, essential data:'],
      items: [
        {
          label: 'Identity Data',
          text: 'Your email address and/or mobile phone number provided during account registration and OTP authentication.',
        },
        {
          label: 'App Usage Data',
          text: 'Drawn profile configurations, metadata of generated PDF templates, and custom settings saved directly to your account workspace.',
        },
        {
          label: 'Payment Data',
          text: 'All subscription financial processing is handled securely via third-party encryption gateways (e.g., Stripe). Segments never stores or views your full credit card details.',
        },
      ],
    },
    {
      heading: '2. How We Use Your Data',
      body: ['We utilize your information strictly to:'],
      items: [
        { label: '', text: 'Authenticate your secure login via OTP.' },
        { label: '', text: 'Generate, store, and export your custom PDF flashing designs.' },
        {
          label: '',
          text: 'Provide direct, localized customer support via email or our WhatsApp business channel.',
        },
        { label: '', text: 'Manage billing and send essential transaction receipts.' },
      ],
    },
    {
      heading: '3. Sharing with Third Parties',
      body: [
        'We do not sell, trade, or rent your personal information to third parties. Data is only shared with trusted standard cloud microservices necessary to keep the app functional:',
      ],
      items: [
        { label: '', text: 'Secure authentication and database engines.' },
        {
          label: '',
          text: 'Transactional email/SMS delivery systems (to send your 6-digit codes).',
        },
        { label: '', text: 'Payment processing providers.' },
      ],
    },
    {
      heading: '4. Your Rights (UK GDPR)',
      body: [
        'As a user, you have the right to request access to the data we hold about you, request corrections, or request the total permanent deletion of your account and all associated profile drawings. To exercise these rights, contact us directly at support@getsegments.co.',
      ],
    },
  ],
}
