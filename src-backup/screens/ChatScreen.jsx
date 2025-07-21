import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../components/common/ThemeProvider';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

import { ChatMessagingService } from '../services/ChatMessagingService';

const { width, height } = Dimensions.get('window');

const ChatScreen = ({ navigation, route }) => {
  const { colors, spacing, typography, borderRadius } = useTheme();
  const flatListRef = useRef(null);
  const textInputRef = useRef(null);
  
  // Route params
  const conversationId = route.params?.conversationId;
  const venue = route.params?.venue;
  const user = route.params?.user;
  const groupId = route.params?.groupId;

  // State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Services
  const [chatService, setChatService] = useState(null);

  // Initialize service
  useEffect(() => {
    const initService = async () => {
      try {
        const chat = await ChatMessagingService.getInstance();
        setChatService(chat);
      } catch (error) {
        console.error('Failed to initialize chat service:', error);
      }
    };

    initService();
  }, []);

  // Load conversation data
  const loadConversation = useCallback(async () => {
    if (!chatService) return;

    try {
      setLoading(true);

      // Load conversation details
      if (conversationId) {
        const conv = await chatService.getConversation(conversationId);
        setConversation(conv);

        // Load participants
        const convParticipants = await chatService.getConversationParticipants(conversationId);
        setParticipants(convParticipants);
      }

      // Load messages
      const conversationMessages = await chatService.getConversationMessages(
        conversationId || 'temp_conversation',
        { limit: 50 }
      );
      setMessages(conversationMessages.reverse());

    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, chatService]);

  useFocusEffect(
    useCallback(() => {
      loadConversation();
    }, [loadConversation])
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !chatService) return;

    try {
      setSending(true);

      const messageData = {
        content: newMessage.trim(),
        type: 'text',
        conversationId: conversationId || 'temp_conversation',
        senderId: 'user_123', // Mock user ID
        metadata: venue ? { venue } : undefined,
      };

      const sentMessage = await chatService.sendMessage(messageData);
      
      setMessages(prevMessages => [...prevMessages, sentMessage]);
      setNewMessage('');

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle image/media sharing
  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission needed', 'Please grant access to your photos to share images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.cancelled && result.assets?.[0]) {
        await handleSendMediaMessage(result.assets[0]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const handleSendMediaMessage = async (asset) => {
    if (!chatService) return;

    try {
      setSending(true);

      const messageData = {
        content: asset.uri,
        type: 'image',
        conversationId: conversationId || 'temp_conversation',
        senderId: 'user_123',
        metadata: {
          fileName: asset.fileName || 'image.jpg',
          fileSize: asset.fileSize,
          mimeType: 'image/jpeg',
        },
      };

      const sentMessage = await chatService.sendMessage(messageData);
      setMessages(prevMessages => [...prevMessages, sentMessage]);

    } catch (error) {
      console.error('Failed to send media message:', error);
      Alert.alert('Error', 'Failed to send image. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle message actions
  const handleMessageLongPress = (message) => {
    setSelectedMessage(message);
    setShowOptions(true);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage || !chatService) return;

    try {
      await chatService.deleteMessage(selectedMessage.id);
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== selectedMessage.id)
      );
      setShowOptions(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
      Alert.alert('Error', 'Failed to delete message.');
    }
  };

  const handleEditMessage = () => {
    if (!selectedMessage) return;
    
    setNewMessage(selectedMessage.content);
    setShowOptions(false);
    setSelectedMessage(null);
    textInputRef.current?.focus();
  };

  // Format time
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  // Render message item
  const renderMessage = ({ item: message, index }) => {
    const isOwnMessage = message.senderId === 'user_123';
    const showAvatar = !isOwnMessage && (
      index === 0 || 
      messages[index - 1]?.senderId !== message.senderId
    );
    const showTimestamp = index === 0 || 
      new Date(message.timestamp).getTime() - new Date(messages[index - 1]?.timestamp).getTime() > 300000; // 5 minutes

    return (
      <View style={styles.messageContainer}>
        {showTimestamp && (
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {formatMessageTime(message.timestamp)}
          </Text>
        )}
        
        <View style={[
          styles.messageRow,
          isOwnMessage && styles.ownMessageRow
        ]}>
          {!isOwnMessage && showAvatar && (
            <Image
              source={{ uri: message.senderAvatar || 'https://via.placeholder.com/32' }}
              style={styles.avatar}
            />
          )}
          
          {!isOwnMessage && !showAvatar && (
            <View style={styles.avatarSpacer} />
          )}

          <TouchableOpacity
            style={[
              styles.messageBubble,
              isOwnMessage ? [styles.ownMessage, { backgroundColor: colors.primary }] 
                           : [styles.otherMessage, { backgroundColor: colors.surface }]
            ]}
            onLongPress={() => handleMessageLongPress(message)}
            activeOpacity={0.8}
          >
            {message.type === 'image' ? (
              <Image
                source={{ uri: message.content }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={[
                styles.messageText,
                { color: isOwnMessage ? '#FFFFFF' : colors.text }
              ]}>
                {message.content}
              </Text>
            )}
            
            {message.isEdited && (
              <Text style={[
                styles.editedLabel,
                { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
              ]}>
                edited
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render input section
  const renderInputSection = () => (
    <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.inputRow, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.mediaButton}
          onPress={handleImagePicker}
        >
          <Ionicons name="camera" size={24} color={colors.primary} />
        </TouchableOpacity>

        <TextInput
          ref={textInputRef}
          style={[styles.textInput, { color: colors.text }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={handleSendMessage}
          blurOnSubmit={false}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: newMessage.trim() ? colors.primary : colors.textSecondary }
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          <Ionicons 
            name={sending ? "hourglass" : "send"} 
            size={20} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render conversation header
  const renderHeader = () => {
    const title = conversation?.name || 
                  (venue ? `${venue.name} Chat` : 'Chat') ||
                  (participants.length > 0 ? participants.map(p => p.name).join(', ') : 'Chat');

    const subtitle = venue ? venue.address : 
                     (participants.length > 1 ? `${participants.length} participants` : '');

    return (
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.headerAction}
          onPress={() => {
            // TODO: Navigate to conversation settings
            Alert.alert('Chat Info', 'Chat settings coming soon!');
          }}
        >
          <Ionicons name="information-circle-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  };

  // Render options modal
  const renderOptionsModal = () => (
    <Modal
      visible={showOptions}
      transparent
      animationType="fade"
      onRequestClose={() => setShowOptions(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowOptions(false)}
      >
        <View style={[styles.optionsModal, { backgroundColor: colors.card }]}>
          {selectedMessage?.senderId === 'user_123' && (
            <>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleEditMessage}
              >
                <Ionicons name="create-outline" size={20} color={colors.text} />
                <Text style={[styles.optionText, { color: colors.text }]}>
                  Edit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleDeleteMessage}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
                <Text style={[styles.optionText, { color: colors.error }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => {
              // TODO: Implement reply functionality
              setShowOptions(false);
            }}
          >
            <Ionicons name="arrow-undo-outline" size={20} color={colors.text} />
            <Text style={[styles.optionText, { color: colors.text }]}>
              Reply
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => {
              // TODO: Implement copy functionality
              setShowOptions(false);
            }}
          >
            <Ionicons name="copy-outline" size={20} color={colors.text} />
            <Text style={[styles.optionText, { color: colors.text }]}>
              Copy
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading conversation...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {renderHeader()}

      <FlatList
        ref={flatListRef}
        style={styles.messagesList}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Start the conversation
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Send a message to get the chat started
            </Text>
          </View>
        )}
      />

      {isTyping && (
        <View style={[styles.typingIndicator, { backgroundColor: colors.surface }]}>
          <Text style={[styles.typingText, { color: colors.textSecondary }]}>
            Someone is typing...
          </Text>
        </View>
      )}

      {renderInputSection()}
      {renderOptionsModal()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  headerAction: {
    padding: 4,
    marginLeft: 12,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 2,
  },
  timestamp: {
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 2,
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarSpacer: {
    width: 40,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessage: {
    borderBottomRightRadius: 6,
  },
  otherMessage: {
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  editedLabel: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
  },
  mediaButton: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 100,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsModal: {
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
  },
});

export default ChatScreen;