
export interface ApiPattern {
  name: string;
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  provider: string;
}

export const API_PATTERNS: ApiPattern[] = [
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical',
    description: 'Amazon Web Services access key detected',
    provider: 'AWS'
  },
  {
    name: 'AWS Secret Key',
    pattern: /[A-Za-z0-9/+=]{40}/g,
    severity: 'critical',
    description: 'Amazon Web Services secret key detected',
    provider: 'AWS'
  },
  {
    name: 'Google Cloud API Key',
    pattern: /AIza[0-9A-Za-z-_]{35}/g,
    severity: 'high',
    description: 'Google Cloud Platform API key detected',
    provider: 'Google Cloud'
  },
  {
    name: 'GitHub Token',
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    severity: 'high',
    description: 'GitHub personal access token detected',
    provider: 'GitHub'
  },
  {
    name: 'GitHub OAuth',
    pattern: /gho_[a-zA-Z0-9]{36}/g,
    severity: 'high',
    description: 'GitHub OAuth token detected',
    provider: 'GitHub'
  },
  {
    name: 'Stripe Publishable Key',
    pattern: /pk_live_[0-9a-zA-Z]{24}/g,
    severity: 'medium',
    description: 'Stripe publishable API key detected',
    provider: 'Stripe'
  },
  {
    name: 'Stripe Secret Key',
    pattern: /sk_live_[0-9a-zA-Z]{24}/g,
    severity: 'critical',
    description: 'Stripe secret API key detected',
    provider: 'Stripe'
  },
  {
    name: 'OpenAI API Key',
    pattern: /sk-[a-zA-Z0-9]{48}/g,
    severity: 'high',
    description: 'OpenAI API key detected',
    provider: 'OpenAI'
  },
  {
    name: 'Azure Subscription Key',
    pattern: /[0-9a-f]{32}/g,
    severity: 'high',
    description: 'Microsoft Azure subscription key detected',
    provider: 'Azure'
  },
  {
    name: 'Slack Token',
    pattern: /xox[baprs]-([0-9a-zA-Z]{10,48})/g,
    severity: 'high',
    description: 'Slack API token detected',
    provider: 'Slack'
  },
  {
    name: 'Discord Bot Token',
    pattern: /[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/g,
    severity: 'high',
    description: 'Discord bot token detected',
    provider: 'Discord'
  },
  {
    name: 'Twilio Account SID',
    pattern: /AC[a-zA-Z0-9_\-]{32}/g,
    severity: 'medium',
    description: 'Twilio Account SID detected',
    provider: 'Twilio'
  },
  {
    name: 'Twilio Auth Token',
    pattern: /SK[a-zA-Z0-9_\-]{32}/g,
    severity: 'critical',
    description: 'Twilio Auth Token detected',
    provider: 'Twilio'
  },
  {
    name: 'SendGrid API Key',
    pattern: /SG\.[a-zA-Z0-9_\-]{22}\.[a-zA-Z0-9_\-]{43}/g,
    severity: 'high',
    description: 'SendGrid API key detected',
    provider: 'SendGrid'
  },
  {
    name: 'Mailgun API Key',
    pattern: /key-[a-zA-Z0-9]{32}/g,
    severity: 'high',
    description: 'Mailgun API key detected',
    provider: 'Mailgun'
  },
  {
    name: 'Firebase API Key',
    pattern: /AIza[0-9A-Za-z\\-_]{35}/g,
    severity: 'medium',
    description: 'Firebase API key detected',
    provider: 'Firebase'
  },
  {
    name: 'Cloudinary URL',
    pattern: /cloudinary:\/\/[0-9]{15}:[a-zA-Z0-9_\-]{27}@[a-zA-Z0-9_\-]+/g,
    severity: 'medium',
    description: 'Cloudinary URL with credentials detected',
    provider: 'Cloudinary'
  },
  {
    name: 'JWT Token',
    pattern: /eyJ[a-zA-Z0-9_\-]*\.eyJ[a-zA-Z0-9_\-]*\.[a-zA-Z0-9_\-]*/g,
    severity: 'high',
    description: 'JSON Web Token detected',
    provider: 'Generic'
  },
  {
    name: 'MongoDB Connection String',
    pattern: /mongodb:\/\/[a-zA-Z0-9._\-]+:[a-zA-Z0-9._\-]+@[a-zA-Z0-9._\-]+/g,
    severity: 'critical',
    description: 'MongoDB connection string with credentials detected',
    provider: 'MongoDB'
  },
  {
    name: 'Redis URL',
    pattern: /redis:\/\/[a-zA-Z0-9._\-]*:[a-zA-Z0-9._\-]*@[a-zA-Z0-9._\-]+:[0-9]+/g,
    severity: 'high',
    description: 'Redis URL with credentials detected',
    provider: 'Redis'
  }
];

export const calculateEntropy = (str: string): number => {
  const freq: { [key: string]: number } = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  
  let entropy = 0;
  const len = str.length;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
};

export const isHighEntropyString = (str: string, minLength = 16): boolean => {
  if (str.length < minLength) return false;
  const entropy = calculateEntropy(str);
  return entropy > 4.5; // Threshold for high entropy
};
