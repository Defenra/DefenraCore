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
      ssl: {
        enabled: {
          type: Boolean,
          default: false,
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
          token: {
            type: String,
            default: "",
          },
          keyAuthorization: {
            type: String,
            default: "",
          },
        },
      },
      luaCode: {
        type: String,
        default: "",
      },
      antiDDoS: {
        enabled: {
          type: Boolean,
          default: false,
        },
        rateLimit: {
          windowSeconds: {
            type: Number,
            default: 5,
          },
          maxRequests: {
            type: Number,
            default: 100,
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
  },
  {
    timestamps: true,
  },
);

const Domain =
  mongoose.models?.Domain || mongoose.model("Domain", DomainSchema);

export default Domain;
