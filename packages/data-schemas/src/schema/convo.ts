import { Schema } from 'mongoose';
import { conversationPreset } from './defaults';
import { IConversation } from '~/types';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption';

const convoSchema: Schema<IConversation> = new Schema(
  {
    conversationId: {
      type: String,
      unique: true,
      required: true,
      index: true,
      meiliIndex: true,
    },
    title: {
      type: String,
      default: 'New Chat',
      meiliIndex: true,
    },
    user: {
      type: String,
      index: true,
      meiliIndex: true,
    },
    messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
    agentOptions: {
      type: Schema.Types.Mixed,
    },
    ...conversationPreset,
    agent_id: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
      meiliIndex: true,
    },
    files: {
      type: [String],
    },
    expiredAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Encrypt title before saving
convoSchema.pre('save', function (next) {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey || !this.title || this.title === 'New Chat') {
    return next();
  }

  try {
    if (!isEncrypted(this.title)) {
      this.title = encrypt(this.title, encryptionKey);
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Helper function to decrypt conversation document
function decryptConversation(doc: any) {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey || !doc || !doc.title) {
    return;
  }

  try {
    if (isEncrypted(doc.title)) {
      doc.title = decrypt(doc.title, encryptionKey);
    }
  } catch (error) {
    console.error('Error decrypting conversation title:', error);
  }
}

// Decrypt after all query types
convoSchema.post('find', function (docs: IConversation[]) {
  if (!docs || docs.length === 0) return;
  docs.forEach(decryptConversation);
});

convoSchema.post('findOne', function (doc: IConversation | null) {
  decryptConversation(doc);
});

convoSchema.post('findOneAndUpdate', function (doc: IConversation | null) {
  decryptConversation(doc);
});

convoSchema.post('updateOne', function (doc: IConversation | null) {
  decryptConversation(doc);
});

convoSchema.post('save', function (doc: IConversation) {
  decryptConversation(doc);
});

// convoSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });
// OPTION 2: Keep it for temporary chats but with shorter TTL
convoSchema.index(
  { expiredAt: 1 },
  {
    expireAfterSeconds: 3600, // 1 hour for temporary chats
    name: 'expiredAt_temp_1hour',
    partialFilterExpression: { expiredAt: { $exists: true, $ne: null } }
  }
);
// convoSchema.index({ createdAt: 1, updatedAt: 1 });
convoSchema.index({ conversationId: 1, user: 1 }, { unique: true });

// NEW: Add automatic TTL index for privacy compliance (30 days)
convoSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 2592000, // 30 days
    name: 'createdAt_ttl_30days'
  }
);

// ADD SEPARATE INDEX FOR updatedAt:
convoSchema.index({ updatedAt: 1 });

export default convoSchema;
