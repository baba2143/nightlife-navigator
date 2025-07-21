import { LocalStorageService } from './LocalStorageService.js';
import { AuditLogService } from './AuditLogService.js';

class ChatMessagingService {
  constructor() {
    if (ChatMessagingService.instance) {
      return ChatMessagingService.instance;
    }

    this.isInitialized = false;
    this.listeners = new Map();
    this.metrics = {
      totalMessages: 0,
      totalConversations: 0,
      totalGroupChats: 0,
      activeUsers: 0,
      averageResponseTime: 0,
      messageTypesCount: {},
      moderationActions: 0,
      spamDetected: 0,
      encryptedMessages: 0
    };

    this.conversations = new Map();
    this.messages = new Map();
    this.groupChats = new Map();
    this.userPresence = new Map();
    this.blockedUsers = new Map();
    this.messageReports = new Map();
    this.chatSettings = new Map();
    this.typingIndicators = new Map();
    this.messageQueue = new Map();

    ChatMessagingService.instance = this;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.storage = await LocalStorageService.getInstance();
      this.auditLog = await AuditLogService.getInstance();

      await this.loadConversations();
      await this.loadMessages();
      await this.loadGroupChats();
      await this.loadUserSettings();
      await this.loadBlockedUsers();
      await this.loadMetrics();

      this.startPresenceManagement();
      this.startMessageProcessing();
      this.startMetricsCollection();
      this.isInitialized = true;

      await this.auditLog.log('chat_messaging_service_initialized', {
        component: 'ChatMessagingService',
        timestamp: new Date().toISOString(),
        conversationsCount: this.conversations.size,
        messagesCount: this.messages.size,
        groupChatsCount: this.groupChats.size
      });

      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize ChatMessagingService:', error);
      throw error;
    }
  }

  async startConversation(userId, targetUserId, messageText) {
    try {
      if (userId === targetUserId) {
        throw new Error('Cannot start conversation with yourself');
      }

      if (await this.isUserBlocked(userId, targetUserId)) {
        throw new Error('Cannot message blocked user');
      }

      const conversationId = this.generateConversationId(userId, targetUserId);
      
      let conversation = this.conversations.get(conversationId);
      if (!conversation) {
        conversation = {
          id: conversationId,
          participants: [userId, targetUserId],
          type: 'direct',
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          lastMessageId: null,
          isActive: true,
          settings: {
            notifications: true,
            encryption: true,
            autoDelete: false
          }
        };

        this.conversations.set(conversationId, conversation);
        await this.storage.set(`conversation_${conversationId}`, conversation);
        this.metrics.totalConversations++;
      }

      const message = await this.sendMessage(userId, conversationId, messageText);

      await this.auditLog.log('conversation_started', {
        conversationId,
        initiator: userId,
        target: targetUserId,
        messageId: message.id,
        timestamp: new Date().toISOString()
      });

      this.emit('conversationStarted', { conversation, message });
      return { conversation, message };
    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    }
  }

  generateConversationId(userId1, userId2) {
    const sortedIds = [userId1, userId2].sort();
    return `conv_${sortedIds[0]}_${sortedIds[1]}`;
  }

  async sendMessage(senderId, conversationId, messageData) {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (!conversation.participants.includes(senderId)) {
        throw new Error('User not part of conversation');
      }

      if (typeof messageData === 'string') {
        messageData = { text: messageData, type: 'text' };
      }

      if (await this.isSpamMessage(messageData.text)) {
        throw new Error('Message flagged as spam');
      }

      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const message = {
        id: messageId,
        conversationId,
        senderId,
        type: messageData.type || 'text',
        content: await this.processMessageContent(messageData),
        timestamp: new Date().toISOString(),
        editedAt: null,
        status: 'sent',
        deliveredTo: [],
        readBy: [],
        reactions: {},
        replyToId: messageData.replyToId,
        forwardedFrom: messageData.forwardedFrom,
        isEncrypted: conversation.settings.encryption,
        metadata: {
          deviceInfo: messageData.deviceInfo,
          location: messageData.location
        }
      };

      if (message.isEncrypted) {
        message.content = await this.encryptMessage(message.content);
        this.metrics.encryptedMessages++;
      }

      this.messages.set(messageId, message);
      await this.storage.set(`message_${messageId}`, message);

      conversation.lastMessageAt = message.timestamp;
      conversation.lastMessageId = messageId;
      await this.storage.set(`conversation_${conversationId}`, conversation);

      await this.deliverMessage(message);

      this.metrics.totalMessages++;
      this.updateMessageTypeMetrics(message.type);

      await this.auditLog.log('message_sent', {
        messageId,
        conversationId,
        senderId,
        type: message.type,
        encrypted: message.isEncrypted,
        timestamp: new Date().toISOString()
      });

      this.emit('messageSent', { message, conversation });
      return message;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async processMessageContent(messageData) {
    switch (messageData.type) {
      case 'text':
        return { text: messageData.text };
      case 'image':
        return { 
          imageUrl: messageData.imageUrl,
          thumbnailUrl: messageData.thumbnailUrl,
          caption: messageData.caption
        };
      case 'video':
        return {
          videoUrl: messageData.videoUrl,
          thumbnailUrl: messageData.thumbnailUrl,
          duration: messageData.duration,
          caption: messageData.caption
        };
      case 'audio':
        return {
          audioUrl: messageData.audioUrl,
          duration: messageData.duration,
          waveform: messageData.waveform
        };
      case 'file':
        return {
          fileUrl: messageData.fileUrl,
          fileName: messageData.fileName,
          fileSize: messageData.fileSize,
          mimeType: messageData.mimeType
        };
      case 'location':
        return {
          latitude: messageData.latitude,
          longitude: messageData.longitude,
          address: messageData.address
        };
      case 'contact':
        return {
          name: messageData.name,
          phoneNumber: messageData.phoneNumber,
          email: messageData.email
        };
      default:
        return { text: messageData.text || '' };
    }
  }

  async encryptMessage(content) {
    const encrypted = btoa(JSON.stringify(content));
    return { encrypted: true, data: encrypted };
  }

  async decryptMessage(encryptedContent) {
    if (!encryptedContent.encrypted) return encryptedContent;
    return JSON.parse(atob(encryptedContent.data));
  }

  async deliverMessage(message) {
    const conversation = this.conversations.get(message.conversationId);
    const recipients = conversation.participants.filter(id => id !== message.senderId);

    for (const recipientId of recipients) {
      if (this.isUserOnline(recipientId)) {
        message.deliveredTo.push({
          userId: recipientId,
          timestamp: new Date().toISOString()
        });

        this.emit('messageDelivered', { 
          message, 
          recipientId,
          conversationId: message.conversationId
        });
      } else {
        await this.queueMessage(recipientId, message);
      }
    }

    await this.storage.set(`message_${message.id}`, message);
  }

  async markMessageAsRead(userId, messageId) {
    try {
      const message = this.messages.get(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      const conversation = this.conversations.get(message.conversationId);
      if (!conversation.participants.includes(userId)) {
        throw new Error('User not part of conversation');
      }

      const readEntry = message.readBy.find(entry => entry.userId === userId);
      if (!readEntry) {
        message.readBy.push({
          userId,
          timestamp: new Date().toISOString()
        });

        await this.storage.set(`message_${messageId}`, message);

        this.emit('messageRead', { message, userId });
      }

      return message;
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      throw error;
    }
  }

  async editMessage(userId, messageId, newContent) {
    try {
      const message = this.messages.get(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      if (message.senderId !== userId) {
        throw new Error('Cannot edit message from another user');
      }

      const timeSinceCreated = Date.now() - new Date(message.timestamp).getTime();
      const editTimeLimit = 24 * 60 * 60 * 1000;
      
      if (timeSinceCreated > editTimeLimit) {
        throw new Error('Message too old to edit');
      }

      message.content = await this.processMessageContent({ 
        text: newContent, 
        type: message.type 
      });
      message.editedAt = new Date().toISOString();

      if (message.isEncrypted) {
        message.content = await this.encryptMessage(message.content);
      }

      await this.storage.set(`message_${messageId}`, message);

      await this.auditLog.log('message_edited', {
        messageId,
        senderId: userId,
        conversationId: message.conversationId,
        timestamp: new Date().toISOString()
      });

      this.emit('messageEdited', { message });
      return message;
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error;
    }
  }

  async deleteMessage(userId, messageId) {
    try {
      const message = this.messages.get(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      if (message.senderId !== userId) {
        throw new Error('Cannot delete message from another user');
      }

      message.status = 'deleted';
      message.content = { text: 'This message was deleted' };
      message.deletedAt = new Date().toISOString();

      await this.storage.set(`message_${messageId}`, message);

      await this.auditLog.log('message_deleted', {
        messageId,
        senderId: userId,
        conversationId: message.conversationId,
        timestamp: new Date().toISOString()
      });

      this.emit('messageDeleted', { message });
      return message;
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  async createGroupChat(creatorId, groupData) {
    try {
      const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const groupChat = {
        id: groupId,
        name: groupData.name,
        description: groupData.description || '',
        creatorId,
        participants: [creatorId, ...groupData.participants],
        admins: [creatorId],
        type: 'group',
        avatar: groupData.avatar,
        settings: {
          allowMemberInvites: groupData.allowMemberInvites || false,
          requireApproval: groupData.requireApproval || false,
          maxMembers: groupData.maxMembers || 256,
          encryption: true,
          notifications: true
        },
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        lastMessageId: null,
        isActive: true
      };

      this.groupChats.set(groupId, groupChat);
      await this.storage.set(`group_chat_${groupId}`, groupChat);

      this.conversations.set(groupId, {
        id: groupId,
        participants: groupChat.participants,
        type: 'group',
        createdAt: groupChat.createdAt,
        lastMessageAt: groupChat.lastMessageAt,
        lastMessageId: null,
        isActive: true,
        settings: groupChat.settings
      });

      this.metrics.totalGroupChats++;

      await this.auditLog.log('group_chat_created', {
        groupId,
        creatorId,
        name: groupData.name,
        participantsCount: groupChat.participants.length,
        timestamp: new Date().toISOString()
      });

      this.emit('groupChatCreated', { groupChat });
      return groupChat;
    } catch (error) {
      console.error('Failed to create group chat:', error);
      throw error;
    }
  }

  async addUserToGroup(groupId, userId, addedBy) {
    try {
      const groupChat = this.groupChats.get(groupId);
      if (!groupChat) {
        throw new Error('Group chat not found');
      }

      if (!groupChat.admins.includes(addedBy) && !groupChat.settings.allowMemberInvites) {
        throw new Error('Only admins can add members');
      }

      if (groupChat.participants.includes(userId)) {
        throw new Error('User already in group');
      }

      if (groupChat.participants.length >= groupChat.settings.maxMembers) {
        throw new Error('Group has reached maximum members');
      }

      groupChat.participants.push(userId);
      await this.storage.set(`group_chat_${groupId}`, groupChat);

      const conversation = this.conversations.get(groupId);
      if (conversation) {
        conversation.participants = groupChat.participants;
        await this.storage.set(`conversation_${groupId}`, conversation);
      }

      await this.auditLog.log('user_added_to_group', {
        groupId,
        userId,
        addedBy,
        timestamp: new Date().toISOString()
      });

      this.emit('userAddedToGroup', { groupChat, userId, addedBy });
      return groupChat;
    } catch (error) {
      console.error('Failed to add user to group:', error);
      throw error;
    }
  }

  async setTypingIndicator(userId, conversationId, isTyping) {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation || !conversation.participants.includes(userId)) {
        return;
      }

      const typingKey = `${conversationId}_${userId}`;
      
      if (isTyping) {
        this.typingIndicators.set(typingKey, {
          userId,
          conversationId,
          startedAt: new Date().toISOString()
        });

        setTimeout(() => {
          this.typingIndicators.delete(typingKey);
          this.emit('typingStopped', { userId, conversationId });
        }, 5000);

        this.emit('typingStarted', { userId, conversationId });
      } else {
        this.typingIndicators.delete(typingKey);
        this.emit('typingStopped', { userId, conversationId });
      }
    } catch (error) {
      console.error('Failed to set typing indicator:', error);
    }
  }

  async getConversations(userId, options = {}) {
    try {
      const userConversations = Array.from(this.conversations.values())
        .filter(conv => conv.participants.includes(userId) && conv.isActive)
        .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

      const conversationsWithDetails = await Promise.all(
        userConversations.map(async (conv) => {
          const lastMessage = conv.lastMessageId ? this.messages.get(conv.lastMessageId) : null;
          const unreadCount = await this.getUnreadCount(userId, conv.id);

          return {
            ...conv,
            lastMessage: lastMessage ? await this.formatMessageForDisplay(lastMessage) : null,
            unreadCount
          };
        })
      );

      if (options.limit) {
        return conversationsWithDetails.slice(0, options.limit);
      }

      return conversationsWithDetails;
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  }

  async getMessages(userId, conversationId, options = {}) {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation || !conversation.participants.includes(userId)) {
        throw new Error('Access denied to conversation');
      }

      const conversationMessages = Array.from(this.messages.values())
        .filter(msg => msg.conversationId === conversationId && msg.status !== 'deleted')
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      const formattedMessages = await Promise.all(
        conversationMessages.map(msg => this.formatMessageForDisplay(msg))
      );

      if (options.limit) {
        return formattedMessages.slice(-options.limit);
      }

      return formattedMessages;
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  async formatMessageForDisplay(message) {
    let content = message.content;
    
    if (message.isEncrypted) {
      content = await this.decryptMessage(content);
    }

    return {
      ...message,
      content
    };
  }

  async getUnreadCount(userId, conversationId) {
    const conversationMessages = Array.from(this.messages.values())
      .filter(msg => 
        msg.conversationId === conversationId && 
        msg.senderId !== userId &&
        !msg.readBy.find(read => read.userId === userId)
      );

    return conversationMessages.length;
  }

  async blockUser(userId, targetUserId) {
    try {
      const blockKey = `${userId}_${targetUserId}`;
      
      if (!this.blockedUsers.has(blockKey)) {
        this.blockedUsers.set(blockKey, {
          blockerId: userId,
          blockedUserId: targetUserId,
          timestamp: new Date().toISOString()
        });

        await this.storage.set('blocked_users_all', Array.from(this.blockedUsers.values()));

        await this.auditLog.log('user_blocked', {
          blockerId: userId,
          blockedUserId: targetUserId,
          timestamp: new Date().toISOString()
        });

        this.emit('userBlocked', { blockerId: userId, blockedUserId: targetUserId });
      }
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  }

  async unblockUser(userId, targetUserId) {
    try {
      const blockKey = `${userId}_${targetUserId}`;
      
      if (this.blockedUsers.has(blockKey)) {
        this.blockedUsers.delete(blockKey);
        await this.storage.set('blocked_users_all', Array.from(this.blockedUsers.values()));

        await this.auditLog.log('user_unblocked', {
          blockerId: userId,
          unblockedUserId: targetUserId,
          timestamp: new Date().toISOString()
        });

        this.emit('userUnblocked', { blockerId: userId, unblockedUserId: targetUserId });
      }
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  }

  async isUserBlocked(userId, targetUserId) {
    const blockKey1 = `${userId}_${targetUserId}`;
    const blockKey2 = `${targetUserId}_${userId}`;
    
    return this.blockedUsers.has(blockKey1) || this.blockedUsers.has(blockKey2);
  }

  async isSpamMessage(messageText) {
    if (!messageText) return false;
    
    const spamKeywords = ['spam', 'scam', 'urgent', 'click here', 'free money'];
    const lowerText = messageText.toLowerCase();
    
    return spamKeywords.some(keyword => lowerText.includes(keyword));
  }

  async queueMessage(userId, message) {
    if (!this.messageQueue.has(userId)) {
      this.messageQueue.set(userId, []);
    }
    
    this.messageQueue.get(userId).push(message);
    await this.storage.set(`message_queue_${userId}`, this.messageQueue.get(userId));
  }

  setUserPresence(userId, status) {
    this.userPresence.set(userId, {
      status,
      lastSeen: new Date().toISOString(),
      isOnline: status === 'online'
    });

    this.emit('presenceChanged', { userId, status });
  }

  isUserOnline(userId) {
    const presence = this.userPresence.get(userId);
    return presence && presence.isOnline;
  }

  updateMessageTypeMetrics(messageType) {
    if (!this.metrics.messageTypesCount[messageType]) {
      this.metrics.messageTypesCount[messageType] = 0;
    }
    this.metrics.messageTypesCount[messageType]++;
  }

  async loadConversations() {
    try {
      const stored = await this.storage.get('conversations_all');
      if (stored && Array.isArray(stored)) {
        stored.forEach(conv => this.conversations.set(conv.id, conv));
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }

  async loadMessages() {
    try {
      const stored = await this.storage.get('messages_all');
      if (stored && Array.isArray(stored)) {
        stored.forEach(msg => this.messages.set(msg.id, msg));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }

  async loadGroupChats() {
    try {
      const stored = await this.storage.get('group_chats_all');
      if (stored && Array.isArray(stored)) {
        stored.forEach(group => this.groupChats.set(group.id, group));
      }
    } catch (error) {
      console.error('Failed to load group chats:', error);
    }
  }

  async loadUserSettings() {
    try {
      const stored = await this.storage.get('chat_settings_all');
      if (stored) {
        Object.entries(stored).forEach(([userId, settings]) => {
          this.chatSettings.set(userId, settings);
        });
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
    }
  }

  async loadBlockedUsers() {
    try {
      const stored = await this.storage.get('blocked_users_all');
      if (stored && Array.isArray(stored)) {
        stored.forEach(block => {
          const key = `${block.blockerId}_${block.blockedUserId}`;
          this.blockedUsers.set(key, block);
        });
      }
    } catch (error) {
      console.error('Failed to load blocked users:', error);
    }
  }

  async loadMetrics() {
    try {
      const stored = await this.storage.get('chat_messaging_metrics');
      if (stored) {
        this.metrics = { ...this.metrics, ...stored };
      }
    } catch (error) {
      console.error('Failed to load chat messaging metrics:', error);
    }
  }

  startPresenceManagement() {
    setInterval(() => {
      const now = new Date();
      for (const [userId, presence] of this.userPresence) {
        const lastSeen = new Date(presence.lastSeen);
        const timeDiff = now - lastSeen;
        
        if (timeDiff > 5 * 60 * 1000 && presence.isOnline) {
          presence.isOnline = false;
          presence.status = 'away';
          this.emit('presenceChanged', { userId, status: 'away' });
        }
      }
    }, 60000);
  }

  startMessageProcessing() {
    setInterval(async () => {
      await this.processMessageQueue();
      await this.cleanupOldTypingIndicators();
    }, 30000);
  }

  async processMessageQueue() {
    for (const [userId, messages] of this.messageQueue) {
      if (this.isUserOnline(userId) && messages.length > 0) {
        for (const message of messages) {
          this.emit('messageDelivered', { 
            message, 
            recipientId: userId,
            conversationId: message.conversationId
          });
        }
        
        this.messageQueue.set(userId, []);
        await this.storage.set(`message_queue_${userId}`, []);
      }
    }
  }

  async cleanupOldTypingIndicators() {
    const now = new Date();
    for (const [key, indicator] of this.typingIndicators) {
      const startTime = new Date(indicator.startedAt);
      if (now - startTime > 10000) {
        this.typingIndicators.delete(key);
      }
    }
  }

  startMetricsCollection() {
    setInterval(async () => {
      this.metrics.activeUsers = this.userPresence.size;
      await this.storage.set('chat_messaging_metrics', this.metrics);
    }, 60000);
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString()
    };
  }

  getMessagingAnalytics(period = 'month') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const periodMessages = Array.from(this.messages.values())
      .filter(msg => new Date(msg.timestamp) >= startDate);

    const uniqueSenders = new Set(periodMessages.map(msg => msg.senderId));

    return {
      period,
      messagesCount: periodMessages.length,
      activeSenders: uniqueSenders.size,
      messageTypes: this.metrics.messageTypesCount,
      encryptionRate: this.metrics.encryptedMessages / this.metrics.totalMessages * 100,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    };
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in chat messaging event listener for ${event}:`, error);
        }
      });
    }
  }

  async cleanup() {
    try {
      await this.storage.set('conversations_all', Array.from(this.conversations.values()));
      await this.storage.set('messages_all', Array.from(this.messages.values()));
      await this.storage.set('group_chats_all', Array.from(this.groupChats.values()));
      await this.storage.set('blocked_users_all', Array.from(this.blockedUsers.values()));
      await this.storage.set('chat_settings_all', Object.fromEntries(this.chatSettings));
      await this.storage.set('chat_messaging_metrics', this.metrics);

      this.listeners.clear();
      this.isInitialized = false;

      await this.auditLog.log('chat_messaging_service_cleanup', {
        component: 'ChatMessagingService',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup ChatMessagingService:', error);
    }
  }

  static async getInstance() {
    if (!ChatMessagingService.instance) {
      ChatMessagingService.instance = new ChatMessagingService();
    }
    if (!ChatMessagingService.instance.isInitialized) {
      await ChatMessagingService.instance.initialize();
    }
    return ChatMessagingService.instance;
  }
}

export { ChatMessagingService };