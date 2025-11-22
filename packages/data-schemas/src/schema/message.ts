import mongoose, { Schema } from 'mongoose';
import type { IMessage } from '~/types/message';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption';

const messageSchema: Schema<IMessage> = new Schema(
  {
    messageId: {
      type: String,
      unique: true,
      required: true,
      index: true,
      meiliIndex: true,
    },
    conversationId: {
      type: String,
      index: true,
      required: true,
      meiliIndex: true,
    },
    user: {
      type: String,
      index: true,
      required: true,
      default: null,
      meiliIndex: true,
    },
    model: {
      type: String,
      default: null,
    },
    endpoint: {
      type: String,
    },
    conversationSignature: {
      type: String,
    },
    clientId: {
      type: String,
    },
    invocationId: {
      type: Number,
    },
    parentMessageId: {
      type: String,
    },
    tokenCount: {
      type: Number,
    },
    summaryTokenCount: {
      type: Number,
    },
    sender: {
      type: String,
      meiliIndex: true,
    },
    text: {
      type: String,
      meiliIndex: true,
    },
    summary: {
      type: String,
    },
    isCreatedByUser: {
      type: Boolean,
      required: true,
      default: false,
    },
    unfinished: {
      type: Boolean,
      default: false,
    },
    error: {
      type: Boolean,
      default: false,
    },
    finish_reason: {
      type: String,
    },
    feedback: {
      type: {
        rating: {
          type: String,
          enum: ['thumbsUp', 'thumbsDown'],
          required: true,
        },
        tag: {
          type: mongoose.Schema.Types.Mixed,
          required: false,
        },
        text: {
          type: String,
          required: false,
        },
      },
      default: undefined,
      required: false,
    },
    _meiliIndex: {
      type: Boolean,
      required: false,
      select: false,
      default: false,
    },
    files: { type: [{ type: mongoose.Schema.Types.Mixed }], default: undefined },
    plugin: {
      type: {
        latest: {
          type: String,
          required: false,
        },
        inputs: {
          type: [mongoose.Schema.Types.Mixed],
          required: false,
          default: undefined,
        },
        outputs: {
          type: String,
          required: false,
        },
      },
      default: undefined,
    },
    plugins: { type: [{ type: mongoose.Schema.Types.Mixed }], default: undefined },
    content: {
      type: [{ type: mongoose.Schema.Types.Mixed }],
      default: undefined,
      meiliIndex: true,
    },
    thread_id: {
      type: String,
    },
    /* frontend components */
    iconURL: {
      type: String,
    },
    attachments: { type: [{ type: mongoose.Schema.Types.Mixed }], default: undefined },
    /*
    attachments: {
      type: [
        {
          file_id: String,
          filename: String,
          filepath: String,
          expiresAt: Date,
          width: Number,
          height: Number,
          type: String,
          conversationId: String,
          messageId: {
            type: String,
            required: true,
          },
          toolCallId: String,
        },
      ],
      default: undefined,
    },
    */
    expiredAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Encrypt sensitive fields before saving
messageSchema.pre('save', function (next) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    console.warn('ENCRYPTION_KEY not set - messages will not be encrypted');
    return next();
  }
  
  try {
    // Encrypt text field if it exists and is not already encrypted
    if (this.text && !isEncrypted(this.text)) {
      this.text = encrypt(this.text, encryptionKey);
    }
    
    // Encrypt summary field if it exists
    if (this.summary && !isEncrypted(this.summary)) {
      this.summary = encrypt(this.summary, encryptionKey);
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Decrypt fields after retrieving from database
messageSchema.post('find', function (docs: IMessage[]) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey || !docs || docs.length === 0) {
    return;
  }
  
  docs.forEach((doc) => {
    try {
      if (doc.text && isEncrypted(doc.text)) {
        doc.text = decrypt(doc.text, encryptionKey);
      }
      
      if (doc.summary && isEncrypted(doc.summary)) {
        doc.summary = decrypt(doc.summary, encryptionKey);
      }
    } catch (error) {
      console.error('Error decrypting message:', error);
    }
  });
});

// Decrypt fields after findOne
messageSchema.post('findOne', function (doc: IMessage | null) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey || !doc) {
    return;
  }
  
  try {
    if (doc.text && isEncrypted(doc.text)) {
      doc.text = decrypt(doc.text, encryptionKey);
    }
    
    if (doc.summary && isEncrypted(doc.summary)) {
      doc.summary = decrypt(doc.summary, encryptionKey);
    }
  } catch (error) {
    console.error('Error decrypting message:', error);
  }
});

// EXISTING INDEXES
// messageSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });
// Keep it for temporary chats but with shorter TTL
messageSchema.index(
  { expiredAt: 1 }, 
  { 
    expireAfterSeconds: 3600, // 1 hour for temporary chats
    name: 'expiredAt_temp_1hour',
    partialFilterExpression: { expiredAt: { $exists: true, $ne: null } }
  }
);
// messageSchema.index({ createdAt: 1 });
messageSchema.index({ messageId: 1, user: 1 }, { unique: true });

// NEW: Add automatic TTL index for privacy compliance (30 days)
messageSchema.index(
  { createdAt: 1 }, 
  { 
    expireAfterSeconds: 2592000, // 30 days
    name: 'createdAt_ttl_30days'
  }
);


export default messageSchema;
