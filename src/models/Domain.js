import mongoose from "mongoose";

const DnsRecordSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA"],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    ttl: {
      type: Number,
      default: 3600,
    },
    priority: {
      type: Number,
      default: null,
    },
    httpProxyEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true },
);

const DomainSchema = new mongoose.Schema(
  {
    domain: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    httpProxy: {
      type: {
        type: String,
        enum: ["http", "https", "both"],
        default: "both",
      },
      enabled: {
        type: Boolean,
        default: true,
      },
      // Anycast Routing (BETA)
      routingMode: {
        type: String,
        enum: ["direct", "anycast"],
        default: "direct",
      },
      agentPool: [
        {
          id: {
            type: String,
            required: true,
          },
          endpoint: {
            type: String,
            required: true,
          },
          region: {
            type: String,
            default: "",
          },
          priority: {
            type: Number,
            default: 0,
          },
        },
      ],
      maxHops: {
        type: Number,
        default: 3,
        min: 1,
        max: 10,
      },
      ssl: {
        enabled: {
          type: Boolean,
          default: false,
        },
        encryptionMode: {
          type: String,
          enum: ["off", "flexible", "full", "full_strict"],
          default: "full_strict",
        },
        certificate: {
          type: String,
          default: "",
        },
        privateKey: {
          type: String,
          default: "",
        },
        autoRenew: {
          type: Boolean,
          default: false,
        },
        acmeEmail: {
          type: String,
          default: "",
        },
        expiresAt: {
          type: Date,
          default: null,
        },
        httpRedirectToHttps: {
          type: Boolean,
          default: false,
        },
        issuer: {
          type: String,
          default: "",
        },
        lastRenewal: {
          type: Date,
          default: null,
        },
        renewalStatus: {
          type: String,
          enum: ["idle", "pending", "success", "failed"],
          default: "idle",
        },
        renewalError: {
          type: String,
          default: "",
        },
        acmeHttpChallenge: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },
      luaCode: {
        type: String,
        default: "",
      },
      antiDDoS: {
        enabled: {
          type: Boolean,
          default: true, // Enable anti-DDoS protection by default
        },
        rateLimit: {
          windowSeconds: {
            type: Number,
            default: 5,
          },
          maxRequests: {
            type: Number,
            default: 30, // Reduced from 100
          },
        },
        blockDurationSeconds: {
          type: Number,
          default: 300,
        },
        slowloris: {
          minContentLength: {
            type: Number,
            default: 128,
          },
          maxHeaderTimeoutSeconds: {
            type: Number,
            default: 20,
          },
          maxConnections: {
            type: Number,
            default: 1000,
          },
        },
        jsChallenge: {
          enabled: {
            type: Boolean,
            default: false,
          },
          cookieName: {
            type: String,
            default: "defenra_js_challenge",
          },
          ttlSeconds: {
            type: Number,
            default: 900,
          },
        },
        logging: {
          enabled: {
            type: Boolean,
            default: true,
          },
        },
        ipWhitelist: {
          type: [String],
          default: [],
        },
        proxyIpHeaders: {
          type: [String],
          default: [],
        },
        // L7 Protection (Advanced Anti-DDoS)
        l7Protection: {
          enabled: {
            type: Boolean,
            default: true, // Enable L7 protection by default
          },
          tlsFingerprintEnabled: {
            type: Boolean,
            default: true,
          },
          botDetectionEnabled: {
            type: Boolean,
            default: true,
          },
          browserValidationEnabled: {
            type: Boolean,
            default: true,
          },
          fingerprintRateLimit: {
            type: Number,
            default: 20, // Reduced from 50
          },
          ipRateLimit: {
            type: Number,
            default: 30, // Reduced from 100
          },
          failChallengeRateLimit: {
            type: Number,
            default: 5, // Reduced from 10
          },
          suspiciousThreshold: {
            type: Number,
            default: 1,
          },
          blockedFingerprints: {
            type: [String],
            default: [],
          },
          allowedFingerprints: {
            type: [String],
            default: [],
          },
        },
        // Challenge Settings
        challengeSettings: {
          cookieChallenge: {
            enabled: {
              type: Boolean,
              default: true,
            },
            ttl: {
              type: Number,
              default: 3600,
            },
          },
          jsChallenge: {
            enabled: {
              type: Boolean,
              default: true,
            },
            difficulty: {
              type: Number,
              default: 4,
              min: 1,
              max: 8,
            },
            ttl: {
              type: Number,
              default: 1800,
            },
          },
          captchaChallenge: {
            enabled: {
              type: Boolean,
              default: true,
            },
            ttl: {
              type: Number,
              default: 300,
            },
          },
        },
        // Custom Firewall Rules
        customRules: [
          {
            name: {
              type: String,
              required: true,
            },
            expression: {
              type: String,
              required: true,
            },
            action: {
              type: String,
              required: true,
            },
            enabled: {
              type: Boolean,
              default: true,
            },
          },
        ],
      },
    },
    dnsRecords: [DnsRecordSchema],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    // GeoDNS Configuration - defines which agents serve which locations
    geoDnsConfig: [
      {
        code: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["continent", "country", "custom"],
          required: true,
        },
        agentIds: [
          {
            type: String,
          },
        ],
      },
    ],
    // Page Rules - CloudFlare-like rules for specific URL patterns
    pageRules: [
      {
        enabled: {
          type: Boolean,
          default: true,
        },
        priority: {
          type: Number,
          default: 1,
        },
        urlPattern: {
          type: String,
          required: true,
        },
        actions: {
          // Security Level
          securityLevel: {
            type: String,
            enum: [
              "off",
              "essentially_off",
              "low",
              "medium",
              "high",
              "under_attack",
            ],
            default: null,
          },
          // Cache Level
          cacheLevel: {
            type: String,
            enum: [
              "bypass",
              "no_query_string",
              "ignore_query_string",
              "standard",
              "cache_everything",
            ],
            default: null,
          },
          // Browser Cache TTL
          browserCacheTtl: {
            type: Number,
            default: null,
          },
          // Edge Cache TTL
          edgeCacheTtl: {
            type: Number,
            default: null,
          },
          // Always Use HTTPS
          alwaysUseHttps: {
            type: Boolean,
            default: null,
          },
          // Forwarding URL (redirect)
          forwardingUrl: {
            statusCode: {
              type: Number,
              enum: [301, 302],
              default: null,
            },
            url: {
              type: String,
              default: null,
            },
          },
          // Disable Security (bypass WAF)
          disableSecurity: {
            type: Boolean,
            default: null,
          },
          // Disable Rate Limiting
          disableRateLimiting: {
            type: Boolean,
            default: null,
          },
          // Custom Headers
          customHeaders: {
            type: Map,
            of: String,
            default: null,
          },
          // IP Geolocation Header
          ipGeolocationHeader: {
            type: Boolean,
            default: null,
          },
          // Origin Cache Control
          originCacheControl: {
            type: Boolean,
            default: null,
          },
          // Resolve Override (change backend)
          resolveOverride: {
            type: String,
            default: null,
          },
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Domain =
  mongoose.models?.Domain || mongoose.model("Domain", DomainSchema);

export default Domain;
