import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class SocialService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.friendships = new Map();
    this.friendRequests = new Map();
    this.userConnections = new Map();
    this.socialGroups = new Map();
    this.groupMemberships = new Map();
    this.socialPosts = new Map();
    this.postLikes = new Map();
    this.postComments = new Map();
    this.userActivities = new Map();
    this.blockedUsers = new Map();
    this.privacySettings = new Map();
    this.socialMetrics = {
      totalFriendships: 0,
      activeFriendRequests: 0,
      totalGroups: 0,
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      averageFriendsPerUser: 0,
      popularActivities: {}
    };
    this.listeners = [];
    this.socialConfig = {
      maxFriends: 1000,
      maxGroupsPerUser: 50,
      maxGroupMembers: 500,
      enablePublicProfile: true,
      enableLocationSharing: true,
      enableActivitySharing: true,
      requireFriendApproval: true,
      allowFriendOfFriend: true,
      maxPostLength: 500,
      maxPhotosPerPost: 10,
      enablePostComments: true,
      enablePostLikes: true,
      enableGroupInvitations: true,
      autoModeratePosts: true
    };
    this.friendshipStatuses = [
      { id: 'pending', name: 'Pending' },
      { id: 'accepted', name: 'Friends' },
      { id: 'declined', name: 'Declined' },
      { id: 'blocked', name: 'Blocked' }
    ];
    this.activityTypes = [
      { id: 'check_in', name: 'Checked in', icon: '📍' },
      { id: 'event_rsvp', name: 'RSVP to event', icon: '🎉' },
      { id: 'venue_review', name: 'Reviewed venue', icon: '⭐' },
      { id: 'photo_share', name: 'Shared photo', icon: '📸' },
      { id: 'friend_add', name: 'New friend', icon: '👥' },
      { id: 'group_join', name: 'Joined group', icon: '👫' },
      { id: 'achievement', name: 'Achievement unlocked', icon: '🏆' }
    ];
    this.privacyLevels = [
      { id: 'public', name: 'Public' },
      { id: 'friends', name: 'Friends Only' },
      { id: 'friends_of_friends', name: 'Friends of Friends' },
      { id: 'private', name: 'Private' }
    ];
  }

  static getInstance() {
    if (!SocialService.instance) {
      SocialService.instance = new SocialService();
    }
    return SocialService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadFriendships();
      await this.loadFriendRequests();
      await this.loadUserConnections();
      await this.loadSocialGroups();
      await this.loadGroupMemberships();
      await this.loadSocialPosts();
      await this.loadPostLikes();
      await this.loadPostComments();
      await this.loadUserActivities();
      await this.loadBlockedUsers();
      await this.loadPrivacySettings();
      await this.loadSocialMetrics();
      await this.loadSocialConfig();
      
      this.initialized = true;
      
      await this.auditService.logEvent('social_service_initialized', {
        timestamp: new Date().toISOString(),
        friendships: this.friendships.size,
        groups: this.socialGroups.size,
        posts: this.socialPosts.size,
        activity_types: this.activityTypes.length
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize SocialService:', error);
      throw error;
    }
  }

  async loadFriendships() {
    try {
      const friendships = await this.storageService.getItem('friendships');
      const friendshipList = friendships || [];

      this.friendships.clear();
      friendshipList.forEach(friendship => {
        this.friendships.set(friendship.id, friendship);
      });
    } catch (error) {
      console.error('Failed to load friendships:', error);
      this.friendships.clear();
    }
  }

  async loadFriendRequests() {
    try {
      const requests = await this.storageService.getItem('friend_requests');
      const requestList = requests || [];

      this.friendRequests.clear();
      requestList.forEach(request => {
        this.friendRequests.set(request.id, request);
      });
    } catch (error) {
      console.error('Failed to load friend requests:', error);
      this.friendRequests.clear();
    }
  }

  async loadUserConnections() {
    try {
      const connections = await this.storageService.getItem('user_connections');
      const connectionList = connections || [];

      this.userConnections.clear();
      connectionList.forEach(connection => {
        this.userConnections.set(connection.userId, connection);
      });
    } catch (error) {
      console.error('Failed to load user connections:', error);
      this.userConnections.clear();
    }
  }

  async loadSocialGroups() {
    try {
      const groups = await this.storageService.getItem('social_groups');
      const groupList = groups || [];

      this.socialGroups.clear();
      groupList.forEach(group => {
        this.socialGroups.set(group.id, group);
      });
    } catch (error) {
      console.error('Failed to load social groups:', error);
      this.socialGroups.clear();
    }
  }

  async loadGroupMemberships() {
    try {
      const memberships = await this.storageService.getItem('group_memberships');
      const membershipList = memberships || [];

      this.groupMemberships.clear();
      membershipList.forEach(membership => {
        this.groupMemberships.set(membership.id, membership);
      });
    } catch (error) {
      console.error('Failed to load group memberships:', error);
      this.groupMemberships.clear();
    }
  }

  async loadSocialPosts() {
    try {
      const posts = await this.storageService.getItem('social_posts');
      const postList = posts || [];

      this.socialPosts.clear();
      postList.forEach(post => {
        this.socialPosts.set(post.id, post);
      });
    } catch (error) {
      console.error('Failed to load social posts:', error);
      this.socialPosts.clear();
    }
  }

  async loadPostLikes() {
    try {
      const likes = await this.storageService.getItem('post_likes');
      const likeList = likes || [];

      this.postLikes.clear();
      likeList.forEach(like => {
        this.postLikes.set(like.id, like);
      });
    } catch (error) {
      console.error('Failed to load post likes:', error);
      this.postLikes.clear();
    }
  }

  async loadPostComments() {
    try {
      const comments = await this.storageService.getItem('post_comments');
      const commentList = comments || [];

      this.postComments.clear();
      commentList.forEach(comment => {
        this.postComments.set(comment.id, comment);
      });
    } catch (error) {
      console.error('Failed to load post comments:', error);
      this.postComments.clear();
    }
  }

  async loadUserActivities() {
    try {
      const activities = await this.storageService.getItem('user_activities');
      const activityList = activities || [];

      this.userActivities.clear();
      activityList.forEach(activity => {
        this.userActivities.set(activity.id, activity);
      });
    } catch (error) {
      console.error('Failed to load user activities:', error);
      this.userActivities.clear();
    }
  }

  async loadBlockedUsers() {
    try {
      const blocked = await this.storageService.getItem('blocked_users');
      const blockedList = blocked || [];

      this.blockedUsers.clear();
      blockedList.forEach(block => {
        this.blockedUsers.set(block.id, block);
      });
    } catch (error) {
      console.error('Failed to load blocked users:', error);
      this.blockedUsers.clear();
    }
  }

  async loadPrivacySettings() {
    try {
      const settings = await this.storageService.getItem('privacy_settings');
      const settingsList = settings || [];

      this.privacySettings.clear();
      settingsList.forEach(setting => {
        this.privacySettings.set(setting.userId, setting);
      });
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
      this.privacySettings.clear();
    }
  }

  async loadSocialMetrics() {
    try {
      const metrics = await this.storageService.getItem('social_metrics');
      if (metrics) {
        this.socialMetrics = { ...this.socialMetrics, ...metrics };
      }
    } catch (error) {
      console.error('Failed to load social metrics:', error);
    }
  }

  async loadSocialConfig() {
    try {
      const config = await this.storageService.getItem('social_config');
      if (config) {
        this.socialConfig = { ...this.socialConfig, ...config };
      }
    } catch (error) {
      console.error('Failed to load social config:', error);
    }
  }

  async sendFriendRequest(fromUserId, toUserId, message = '') {
    try {
      // Validate users
      if (fromUserId === toUserId) {
        throw new Error('Cannot send friend request to yourself');
      }

      // Check if users are blocked
      if (await this.areUsersBlocked(fromUserId, toUserId)) {
        throw new Error('Cannot send friend request to blocked user');
      }

      // Check if already friends or request exists
      const existingFriendship = await this.getFriendship(fromUserId, toUserId);
      if (existingFriendship) {
        throw new Error('Users are already friends or request exists');
      }

      // Check friend limits
      const fromUserConnections = await this.getUserConnections(fromUserId);
      if (fromUserConnections.friends.length >= this.socialConfig.maxFriends) {
        throw new Error('Maximum friend limit reached');
      }

      const friendRequest = {
        id: `friend_request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fromUserId: fromUserId,
        toUserId: toUserId,
        message: message,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.friendRequests.set(friendRequest.id, friendRequest);
      await this.saveFriendRequests();

      // Update user connections
      await this.updateUserConnections(fromUserId);
      await this.updateUserConnections(toUserId);

      // Update metrics
      this.socialMetrics.activeFriendRequests++;
      await this.saveSocialMetrics();

      await this.auditService.logEvent('friend_request_sent', {
        request_id: friendRequest.id,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        message_length: message.length,
        timestamp: new Date().toISOString()
      });

      this.emit('friendRequestSent', friendRequest);
      return friendRequest;
    } catch (error) {
      console.error('Failed to send friend request:', error);
      throw error;
    }
  }

  async respondToFriendRequest(requestId, userId, response, message = '') {
    try {
      const request = this.friendRequests.get(requestId);
      if (!request) {
        throw new Error('Friend request not found');
      }

      if (request.toUserId !== userId) {
        throw new Error('Unauthorized: User can only respond to their own friend requests');
      }

      if (request.status !== 'pending') {
        throw new Error('Friend request has already been responded to');
      }

      // Update request status
      request.status = response; // 'accepted' or 'declined'
      request.responseMessage = message;
      request.respondedAt = new Date().toISOString();
      request.updatedAt = new Date().toISOString();

      this.friendRequests.set(requestId, request);
      await this.saveFriendRequests();

      // If accepted, create friendship
      if (response === 'accepted') {
        await this.createFriendship(request.fromUserId, request.toUserId);
      }

      // Update metrics
      this.socialMetrics.activeFriendRequests--;
      await this.saveSocialMetrics();

      await this.auditService.logEvent('friend_request_responded', {
        request_id: requestId,
        from_user_id: request.fromUserId,
        to_user_id: request.toUserId,
        response: response,
        timestamp: new Date().toISOString()
      });

      this.emit('friendRequestResponded', { request, response });
      return request;
    } catch (error) {
      console.error('Failed to respond to friend request:', error);
      throw error;
    }
  }

  async createFriendship(user1Id, user2Id) {
    try {
      const friendship = {
        id: `friendship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user1Id: user1Id,
        user2Id: user2Id,
        status: 'active',
        createdAt: new Date().toISOString(),
        mutualFriends: [],
        interactionCount: 0,
        lastInteraction: null
      };

      this.friendships.set(friendship.id, friendship);
      await this.saveFriendships();

      // Update user connections
      await this.updateUserConnections(user1Id);
      await this.updateUserConnections(user2Id);

      // Calculate mutual friends
      await this.updateMutualFriends(friendship.id);

      // Update metrics
      this.socialMetrics.totalFriendships++;
      await this.updateSocialMetrics();

      // Create activity posts
      await this.createActivity(user1Id, 'friend_add', {
        friendId: user2Id,
        friendshipId: friendship.id
      });

      await this.createActivity(user2Id, 'friend_add', {
        friendId: user1Id,
        friendshipId: friendship.id
      });

      await this.auditService.logEvent('friendship_created', {
        friendship_id: friendship.id,
        user1_id: user1Id,
        user2_id: user2Id,
        timestamp: new Date().toISOString()
      });

      this.emit('friendshipCreated', friendship);
      return friendship;
    } catch (error) {
      console.error('Failed to create friendship:', error);
      throw error;
    }
  }

  async removeFriend(userId, friendId) {
    try {
      const friendship = await this.getFriendship(userId, friendId);
      if (!friendship) {
        throw new Error('Friendship not found');
      }

      // Update friendship status
      friendship.status = 'removed';
      friendship.removedAt = new Date().toISOString();
      friendship.removedBy = userId;

      this.friendships.set(friendship.id, friendship);
      await this.saveFriendships();

      // Update user connections
      await this.updateUserConnections(userId);
      await this.updateUserConnections(friendId);

      // Update metrics
      this.socialMetrics.totalFriendships--;
      await this.saveSocialMetrics();

      await this.auditService.logEvent('friendship_removed', {
        friendship_id: friendship.id,
        removed_by: userId,
        friend_id: friendId,
        timestamp: new Date().toISOString()
      });

      this.emit('friendshipRemoved', { friendship, removedBy: userId });
      return friendship;
    } catch (error) {
      console.error('Failed to remove friend:', error);
      throw error;
    }
  }

  async blockUser(userId, blockedUserId, reason = '') {
    try {
      if (userId === blockedUserId) {
        throw new Error('Cannot block yourself');
      }

      // Check if already blocked
      const existingBlock = await this.getBlockedUser(userId, blockedUserId);
      if (existingBlock) {
        throw new Error('User is already blocked');
      }

      const block = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        blockedUserId: blockedUserId,
        reason: reason,
        createdAt: new Date().toISOString()
      };

      this.blockedUsers.set(block.id, block);
      await this.saveBlockedUsers();

      // Remove existing friendship if exists
      const friendship = await this.getFriendship(userId, blockedUserId);
      if (friendship) {
        await this.removeFriend(userId, blockedUserId);
      }

      // Remove pending friend requests
      await this.removePendingFriendRequests(userId, blockedUserId);

      await this.auditService.logEvent('user_blocked', {
        block_id: block.id,
        user_id: userId,
        blocked_user_id: blockedUserId,
        reason: reason,
        timestamp: new Date().toISOString()
      });

      this.emit('userBlocked', block);
      return block;
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  }

  async unblockUser(userId, blockedUserId) {
    try {
      const block = await this.getBlockedUser(userId, blockedUserId);
      if (!block) {
        throw new Error('User is not blocked');
      }

      this.blockedUsers.delete(block.id);
      await this.saveBlockedUsers();

      await this.auditService.logEvent('user_unblocked', {
        block_id: block.id,
        user_id: userId,
        unblocked_user_id: blockedUserId,
        timestamp: new Date().toISOString()
      });

      this.emit('userUnblocked', { userId, unblockedUserId: blockedUserId });
      return true;
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  }

  async createSocialGroup(creatorId, groupData) {
    try {
      // Validate group data
      const validation = this.validateGroupData(groupData);
      if (!validation.isValid) {
        throw new Error(`Invalid group data: ${validation.errors.join(', ')}`);
      }

      const group = {
        id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: groupData.name,
        description: groupData.description,
        creatorId: creatorId,
        privacy: groupData.privacy || 'public',
        category: groupData.category || 'general',
        tags: groupData.tags || [],
        image: groupData.image || null,
        rules: groupData.rules || [],
        maxMembers: Math.min(groupData.maxMembers || 100, this.socialConfig.maxGroupMembers),
        memberCount: 1, // Creator is first member
        isActive: true,
        allowInvitations: groupData.allowInvitations !== false,
        requireApproval: groupData.requireApproval || false,
        allowPosting: groupData.allowPosting !== false,
        allowComments: groupData.allowComments !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.socialGroups.set(group.id, group);
      await this.saveSocialGroups();

      // Add creator as admin member
      await this.addGroupMember(group.id, creatorId, 'admin');

      // Update metrics
      this.socialMetrics.totalGroups++;
      await this.saveSocialMetrics();

      // Create activity
      await this.createActivity(creatorId, 'group_create', {
        groupId: group.id,
        groupName: group.name
      });

      await this.auditService.logEvent('social_group_created', {
        group_id: group.id,
        creator_id: creatorId,
        name: group.name,
        privacy: group.privacy,
        max_members: group.maxMembers,
        timestamp: new Date().toISOString()
      });

      this.emit('groupCreated', group);
      return group;
    } catch (error) {
      console.error('Failed to create social group:', error);
      throw error;
    }
  }

  async joinGroup(groupId, userId, invitationCode = null) {
    try {
      const group = this.socialGroups.get(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      if (!group.isActive) {
        throw new Error('Group is not active');
      }

      // Check if already a member
      const existingMembership = await this.getGroupMembership(groupId, userId);
      if (existingMembership) {
        throw new Error('User is already a member of this group');
      }

      // Check member limit
      if (group.memberCount >= group.maxMembers) {
        throw new Error('Group has reached maximum member capacity');
      }

      // Check privacy and approval requirements
      if (group.privacy === 'private' && !invitationCode) {
        throw new Error('Invitation required to join private group');
      }

      const membershipStatus = group.requireApproval ? 'pending' : 'active';

      const membership = {
        id: `membership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        groupId: groupId,
        userId: userId,
        role: 'member',
        status: membershipStatus,
        joinedAt: new Date().toISOString(),
        invitedBy: null,
        invitationCode: invitationCode,
        contributions: {
          posts: 0,
          comments: 0,
          likes: 0
        },
        lastActivity: new Date().toISOString()
      };

      this.groupMemberships.set(membership.id, membership);
      await this.saveGroupMemberships();

      // Update group member count if approved
      if (membershipStatus === 'active') {
        group.memberCount++;
        group.updatedAt = new Date().toISOString();
        this.socialGroups.set(groupId, group);
        await this.saveSocialGroups();

        // Create activity
        await this.createActivity(userId, 'group_join', {
          groupId: groupId,
          groupName: group.name
        });
      }

      await this.auditService.logEvent('group_joined', {
        membership_id: membership.id,
        group_id: groupId,
        user_id: userId,
        status: membershipStatus,
        invitation_code: invitationCode ? 'used' : 'none',
        timestamp: new Date().toISOString()
      });

      this.emit('groupJoined', { group, membership });
      return membership;
    } catch (error) {
      console.error('Failed to join group:', error);
      throw error;
    }
  }

  async leaveGroup(groupId, userId) {
    try {
      const membership = await this.getGroupMembership(groupId, userId);
      if (!membership) {
        throw new Error('User is not a member of this group');
      }

      const group = this.socialGroups.get(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Remove membership
      this.groupMemberships.delete(membership.id);
      await this.saveGroupMemberships();

      // Update group member count
      group.memberCount = Math.max(0, group.memberCount - 1);
      group.updatedAt = new Date().toISOString();
      this.socialGroups.set(groupId, group);
      await this.saveSocialGroups();

      // If creator leaves and there are other members, transfer ownership
      if (group.creatorId === userId && group.memberCount > 0) {
        await this.transferGroupOwnership(groupId);
      }

      await this.auditService.logEvent('group_left', {
        membership_id: membership.id,
        group_id: groupId,
        user_id: userId,
        was_creator: group.creatorId === userId,
        timestamp: new Date().toISOString()
      });

      this.emit('groupLeft', { group, membership, userId });
      return true;
    } catch (error) {
      console.error('Failed to leave group:', error);
      throw error;
    }
  }

  async createSocialPost(userId, postData) {
    try {
      // Validate post data
      const validation = this.validatePostData(postData);
      if (!validation.isValid) {
        throw new Error(`Invalid post data: ${validation.errors.join(', ')}`);
      }

      const post = {
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        content: postData.content,
        photos: postData.photos || [],
        location: postData.location || null,
        venueId: postData.venueId || null,
        eventId: postData.eventId || null,
        groupId: postData.groupId || null,
        privacy: postData.privacy || 'friends',
        tags: postData.tags || [],
        mentions: postData.mentions || [],
        type: postData.type || 'text', // text, photo, check_in, event_share
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        isEdited: false,
        editHistory: [],
        reportCount: 0,
        isHidden: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Auto-moderate if enabled
      if (this.socialConfig.autoModeratePosts) {
        const moderationResult = await this.moderatePost(post);
        if (moderationResult.shouldHide) {
          post.isHidden = true;
          post.moderationFlags = moderationResult.flags;
        }
      }

      this.socialPosts.set(post.id, post);
      await this.saveSocialPosts();

      // Update metrics
      this.socialMetrics.totalPosts++;
      await this.saveSocialMetrics();

      // Create activity if it's a public post
      if (post.privacy === 'public' || post.privacy === 'friends') {
        await this.createActivity(userId, 'post_create', {
          postId: post.id,
          postType: post.type,
          hasPhotos: post.photos.length > 0
        });
      }

      await this.auditService.logEvent('social_post_created', {
        post_id: post.id,
        user_id: userId,
        type: post.type,
        privacy: post.privacy,
        content_length: post.content.length,
        photo_count: post.photos.length,
        venue_id: post.venueId,
        event_id: post.eventId,
        group_id: post.groupId,
        is_hidden: post.isHidden,
        timestamp: new Date().toISOString()
      });

      this.emit('postCreated', post);
      return post;
    } catch (error) {
      console.error('Failed to create social post:', error);
      throw error;
    }
  }

  async likePost(postId, userId) {
    try {
      const post = this.socialPosts.get(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      // Check if user can see this post
      const canView = await this.canUserViewPost(post, userId);
      if (!canView) {
        throw new Error('Post not accessible');
      }

      // Check if already liked
      const existingLike = await this.getPostLike(postId, userId);
      if (existingLike) {
        throw new Error('Post already liked');
      }

      const like = {
        id: `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        postId: postId,
        userId: userId,
        createdAt: new Date().toISOString()
      };

      this.postLikes.set(like.id, like);
      await this.savePostLikes();

      // Update post like count
      post.likeCount++;
      post.updatedAt = new Date().toISOString();
      this.socialPosts.set(postId, post);
      await this.saveSocialPosts();

      // Update metrics
      this.socialMetrics.totalLikes++;
      await this.saveSocialMetrics();

      await this.auditService.logEvent('post_liked', {
        like_id: like.id,
        post_id: postId,
        user_id: userId,
        post_owner_id: post.userId,
        timestamp: new Date().toISOString()
      });

      this.emit('postLiked', { post, like });
      return like;
    } catch (error) {
      console.error('Failed to like post:', error);
      throw error;
    }
  }

  async unlikePost(postId, userId) {
    try {
      const like = await this.getPostLike(postId, userId);
      if (!like) {
        throw new Error('Post not liked');
      }

      const post = this.socialPosts.get(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      // Remove like
      this.postLikes.delete(like.id);
      await this.savePostLikes();

      // Update post like count
      post.likeCount = Math.max(0, post.likeCount - 1);
      post.updatedAt = new Date().toISOString();
      this.socialPosts.set(postId, post);
      await this.saveSocialPosts();

      // Update metrics
      this.socialMetrics.totalLikes--;
      await this.saveSocialMetrics();

      await this.auditService.logEvent('post_unliked', {
        like_id: like.id,
        post_id: postId,
        user_id: userId,
        post_owner_id: post.userId,
        timestamp: new Date().toISOString()
      });

      this.emit('postUnliked', { post, userId });
      return true;
    } catch (error) {
      console.error('Failed to unlike post:', error);
      throw error;
    }
  }

  async commentOnPost(postId, userId, commentData) {
    try {
      const post = this.socialPosts.get(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      // Check if user can see and comment on this post
      const canView = await this.canUserViewPost(post, userId);
      if (!canView) {
        throw new Error('Post not accessible');
      }

      if (!this.socialConfig.enablePostComments) {
        throw new Error('Comments are disabled');
      }

      // Validate comment
      if (!commentData.content || commentData.content.trim().length === 0) {
        throw new Error('Comment content is required');
      }

      if (commentData.content.length > 300) {
        throw new Error('Comment too long');
      }

      const comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        postId: postId,
        userId: userId,
        content: commentData.content.trim(),
        parentCommentId: commentData.parentCommentId || null,
        likeCount: 0,
        replyCount: 0,
        isEdited: false,
        editHistory: [],
        reportCount: 0,
        isHidden: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.postComments.set(comment.id, comment);
      await this.savePostComments();

      // Update post comment count
      post.commentCount++;
      post.updatedAt = new Date().toISOString();
      this.socialPosts.set(postId, post);
      await this.saveSocialPosts();

      // Update parent comment reply count if this is a reply
      if (comment.parentCommentId) {
        const parentComment = this.postComments.get(comment.parentCommentId);
        if (parentComment) {
          parentComment.replyCount++;
          parentComment.updatedAt = new Date().toISOString();
          this.postComments.set(comment.parentCommentId, parentComment);
        }
      }

      // Update metrics
      this.socialMetrics.totalComments++;
      await this.saveSocialMetrics();

      await this.auditService.logEvent('post_commented', {
        comment_id: comment.id,
        post_id: postId,
        user_id: userId,
        post_owner_id: post.userId,
        parent_comment_id: comment.parentCommentId,
        content_length: comment.content.length,
        timestamp: new Date().toISOString()
      });

      this.emit('postCommented', { post, comment });
      return comment;
    } catch (error) {
      console.error('Failed to comment on post:', error);
      throw error;
    }
  }

  async createActivity(userId, activityType, activityData = {}) {
    try {
      const activity = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        type: activityType,
        data: activityData,
        privacy: activityData.privacy || 'friends',
        isVisible: true,
        createdAt: new Date().toISOString()
      };

      this.userActivities.set(activity.id, activity);
      await this.saveUserActivities();

      // Update activity metrics
      if (!this.socialMetrics.popularActivities[activityType]) {
        this.socialMetrics.popularActivities[activityType] = 0;
      }
      this.socialMetrics.popularActivities[activityType]++;
      await this.saveSocialMetrics();

      await this.auditService.logEvent('user_activity_created', {
        activity_id: activity.id,
        user_id: userId,
        type: activityType,
        privacy: activity.privacy,
        timestamp: new Date().toISOString()
      });

      this.emit('activityCreated', activity);
      return activity;
    } catch (error) {
      console.error('Failed to create activity:', error);
      throw error;
    }
  }

  async getFriends(userId, options = {}) {
    try {
      const userConnections = await this.getUserConnections(userId);
      let friends = userConnections.friends;

      // Apply search filter
      if (options.search && options.search.trim() !== '') {
        const searchTerm = options.search.toLowerCase();
        friends = friends.filter(friend => 
          friend.name && friend.name.toLowerCase().includes(searchTerm)
        );
      }

      // Apply sorting
      if (options.sortBy === 'name') {
        friends.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      } else if (options.sortBy === 'recent') {
        friends.sort((a, b) => new Date(b.lastInteraction || 0) - new Date(a.lastInteraction || 0));
      }

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 50;
      const startIndex = (page - 1) * limit;
      const paginatedFriends = friends.slice(startIndex, startIndex + limit);

      return {
        friends: paginatedFriends,
        total: friends.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(friends.length / limit)
      };
    } catch (error) {
      console.error('Failed to get friends:', error);
      return { friends: [], total: 0, page: 1, limit: 50, totalPages: 0 };
    }
  }

  async getFeed(userId, options = {}) {
    try {
      // Get user's privacy settings
      const privacySettings = await this.getUserPrivacySettings(userId);
      
      // Get friend IDs
      const userConnections = await this.getUserConnections(userId);
      const friendIds = userConnections.friends.map(f => f.userId);
      
      // Get posts from friends and public posts
      let posts = Array.from(this.socialPosts.values())
        .filter(post => {
          // Include user's own posts
          if (post.userId === userId) return true;
          
          // Include friends' posts if privacy allows
          if (friendIds.includes(post.userId) && 
              (post.privacy === 'friends' || post.privacy === 'public')) {
            return true;
          }
          
          // Include public posts
          if (post.privacy === 'public') return true;
          
          return false;
        })
        .filter(post => !post.isHidden);

      // Get activities
      let activities = Array.from(this.userActivities.values())
        .filter(activity => {
          if (activity.userId === userId) return true;
          if (friendIds.includes(activity.userId) && 
              (activity.privacy === 'friends' || activity.privacy === 'public')) {
            return true;
          }
          if (activity.privacy === 'public') return true;
          return false;
        })
        .filter(activity => activity.isVisible);

      // Combine and sort by creation time
      const feedItems = [
        ...posts.map(post => ({ ...post, feedType: 'post' })),
        ...activities.map(activity => ({ ...activity, feedType: 'activity' }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedFeed = feedItems.slice(startIndex, startIndex + limit);

      return {
        feed: paginatedFeed,
        total: feedItems.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(feedItems.length / limit)
      };
    } catch (error) {
      console.error('Failed to get feed:', error);
      return { feed: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
  }

  // Helper methods

  async getFriendship(user1Id, user2Id) {
    for (const [id, friendship] of this.friendships) {
      if (friendship.status === 'active' &&
          ((friendship.user1Id === user1Id && friendship.user2Id === user2Id) ||
           (friendship.user1Id === user2Id && friendship.user2Id === user1Id))) {
        return friendship;
      }
    }
    return null;
  }

  async getBlockedUser(userId, blockedUserId) {
    for (const [id, block] of this.blockedUsers) {
      if (block.userId === userId && block.blockedUserId === blockedUserId) {
        return block;
      }
    }
    return null;
  }

  async areUsersBlocked(user1Id, user2Id) {
    const block1 = await this.getBlockedUser(user1Id, user2Id);
    const block2 = await this.getBlockedUser(user2Id, user1Id);
    return !!(block1 || block2);
  }

  async getUserConnections(userId) {
    if (!this.userConnections.has(userId)) {
      // Initialize user connections
      const connections = {
        userId: userId,
        friends: [],
        pendingRequests: [],
        sentRequests: [],
        groups: [],
        totalConnections: 0,
        updatedAt: new Date().toISOString()
      };
      this.userConnections.set(userId, connections);
      await this.saveUserConnections();
      return connections;
    }
    return this.userConnections.get(userId);
  }

  async updateUserConnections(userId) {
    try {
      const connections = await this.getUserConnections(userId);

      // Update friends list
      connections.friends = Array.from(this.friendships.values())
        .filter(friendship => 
          friendship.status === 'active' &&
          (friendship.user1Id === userId || friendship.user2Id === userId)
        )
        .map(friendship => ({
          userId: friendship.user1Id === userId ? friendship.user2Id : friendship.user1Id,
          friendshipId: friendship.id,
          since: friendship.createdAt,
          lastInteraction: friendship.lastInteraction,
          mutualFriends: friendship.mutualFriends.length
        }));

      // Update pending requests
      connections.pendingRequests = Array.from(this.friendRequests.values())
        .filter(request => request.toUserId === userId && request.status === 'pending')
        .map(request => ({
          requestId: request.id,
          fromUserId: request.fromUserId,
          message: request.message,
          createdAt: request.createdAt
        }));

      // Update sent requests
      connections.sentRequests = Array.from(this.friendRequests.values())
        .filter(request => request.fromUserId === userId && request.status === 'pending')
        .map(request => ({
          requestId: request.id,
          toUserId: request.toUserId,
          message: request.message,
          createdAt: request.createdAt
        }));

      // Update groups
      connections.groups = Array.from(this.groupMemberships.values())
        .filter(membership => membership.userId === userId && membership.status === 'active')
        .map(membership => ({
          groupId: membership.groupId,
          membershipId: membership.id,
          role: membership.role,
          joinedAt: membership.joinedAt
        }));

      connections.totalConnections = connections.friends.length;
      connections.updatedAt = new Date().toISOString();

      this.userConnections.set(userId, connections);
      await this.saveUserConnections();
    } catch (error) {
      console.error('Failed to update user connections:', error);
    }
  }

  async getGroupMembership(groupId, userId) {
    for (const [id, membership] of this.groupMemberships) {
      if (membership.groupId === groupId && membership.userId === userId) {
        return membership;
      }
    }
    return null;
  }

  async addGroupMember(groupId, userId, role = 'member') {
    const membership = {
      id: `membership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId: groupId,
      userId: userId,
      role: role,
      status: 'active',
      joinedAt: new Date().toISOString(),
      invitedBy: null,
      contributions: {
        posts: 0,
        comments: 0,
        likes: 0
      },
      lastActivity: new Date().toISOString()
    };

    this.groupMemberships.set(membership.id, membership);
    await this.saveGroupMemberships();
    return membership;
  }

  async transferGroupOwnership(groupId) {
    try {
      const group = this.socialGroups.get(groupId);
      if (!group) return;

      // Find an admin member to transfer to
      const adminMemberships = Array.from(this.groupMemberships.values())
        .filter(m => m.groupId === groupId && m.role === 'admin' && m.status === 'active');

      if (adminMemberships.length > 0) {
        // Transfer to first admin
        group.creatorId = adminMemberships[0].userId;
      } else {
        // Find any active member
        const memberMemberships = Array.from(this.groupMemberships.values())
          .filter(m => m.groupId === groupId && m.status === 'active');

        if (memberMemberships.length > 0) {
          group.creatorId = memberMemberships[0].userId;
          // Promote to admin
          memberMemberships[0].role = 'admin';
          this.groupMemberships.set(memberMemberships[0].id, memberMemberships[0]);
        }
      }

      group.updatedAt = new Date().toISOString();
      this.socialGroups.set(groupId, group);
      await this.saveSocialGroups();
      await this.saveGroupMemberships();
    } catch (error) {
      console.error('Failed to transfer group ownership:', error);
    }
  }

  async getPostLike(postId, userId) {
    for (const [id, like] of this.postLikes) {
      if (like.postId === postId && like.userId === userId) {
        return like;
      }
    }
    return null;
  }

  async canUserViewPost(post, userId) {
    // User can always view their own posts
    if (post.userId === userId) return true;

    // Public posts are viewable by everyone
    if (post.privacy === 'public') return true;

    // Check if users are friends for friends-only posts
    if (post.privacy === 'friends') {
      const friendship = await this.getFriendship(post.userId, userId);
      return !!friendship;
    }

    // Private posts are only viewable by the owner
    if (post.privacy === 'private') return false;

    return false;
  }

  async removePendingFriendRequests(user1Id, user2Id) {
    try {
      const requestsToRemove = Array.from(this.friendRequests.values())
        .filter(request => 
          request.status === 'pending' &&
          ((request.fromUserId === user1Id && request.toUserId === user2Id) ||
           (request.fromUserId === user2Id && request.toUserId === user1Id))
        );

      for (const request of requestsToRemove) {
        this.friendRequests.delete(request.id);
      }

      await this.saveFriendRequests();
    } catch (error) {
      console.error('Failed to remove pending friend requests:', error);
    }
  }

  async updateMutualFriends(friendshipId) {
    try {
      const friendship = this.friendships.get(friendshipId);
      if (!friendship) return;

      const user1Connections = await this.getUserConnections(friendship.user1Id);
      const user2Connections = await this.getUserConnections(friendship.user2Id);

      const user1Friends = user1Connections.friends.map(f => f.userId);
      const user2Friends = user2Connections.friends.map(f => f.userId);

      const mutualFriends = user1Friends.filter(friendId => user2Friends.includes(friendId));

      friendship.mutualFriends = mutualFriends;
      friendship.updatedAt = new Date().toISOString();

      this.friendships.set(friendshipId, friendship);
      await this.saveFriendships();
    } catch (error) {
      console.error('Failed to update mutual friends:', error);
    }
  }

  async getUserPrivacySettings(userId) {
    if (!this.privacySettings.has(userId)) {
      // Initialize default privacy settings
      const defaultSettings = {
        userId: userId,
        profileVisibility: 'friends',
        friendListVisibility: 'friends',
        activityVisibility: 'friends',
        locationSharing: false,
        friendRequestsFrom: 'everyone',
        groupInvitations: 'friends',
        messagePermissions: 'friends',
        photoTagging: 'friends',
        searchability: 'friends',
        showOnlineStatus: true,
        allowFriendOfFriendRequests: true,
        updatedAt: new Date().toISOString()
      };
      this.privacySettings.set(userId, defaultSettings);
      await this.savePrivacySettings();
      return defaultSettings;
    }
    return this.privacySettings.get(userId);
  }

  async moderatePost(post) {
    // Simple content moderation
    const flags = [];
    let shouldHide = false;

    // Check for spam indicators
    if (post.content.includes('http') || post.content.includes('www.')) {
      flags.push('potential_spam');
    }

    // Check for excessive caps
    const capsCount = (post.content.match(/[A-Z]/g) || []).length;
    if (capsCount > post.content.length * 0.7) {
      flags.push('excessive_caps');
    }

    // Check for repeated characters
    if (/(.)\1{5,}/.test(post.content)) {
      flags.push('repeated_characters');
    }

    shouldHide = flags.length > 2;

    return { shouldHide, flags };
  }

  validateGroupData(groupData) {
    const errors = [];

    if (!groupData.name || groupData.name.trim().length === 0) {
      errors.push('Group name is required');
    }

    if (groupData.name && groupData.name.length > 100) {
      errors.push('Group name is too long');
    }

    if (groupData.description && groupData.description.length > 500) {
      errors.push('Group description is too long');
    }

    if (groupData.maxMembers && (groupData.maxMembers < 2 || groupData.maxMembers > this.socialConfig.maxGroupMembers)) {
      errors.push(`Max members must be between 2 and ${this.socialConfig.maxGroupMembers}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  validatePostData(postData) {
    const errors = [];

    if (!postData.content || postData.content.trim().length === 0) {
      errors.push('Post content is required');
    }

    if (postData.content && postData.content.length > this.socialConfig.maxPostLength) {
      errors.push(`Post content exceeds maximum length of ${this.socialConfig.maxPostLength} characters`);
    }

    if (postData.photos && postData.photos.length > this.socialConfig.maxPhotosPerPost) {
      errors.push(`Maximum ${this.socialConfig.maxPhotosPerPost} photos allowed per post`);
    }

    if (postData.privacy && !this.privacyLevels.some(level => level.id === postData.privacy)) {
      errors.push('Invalid privacy setting');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  async updateSocialMetrics() {
    try {
      // Calculate average friends per user
      const totalUsers = this.userConnections.size;
      const totalFriendships = Array.from(this.friendships.values())
        .filter(f => f.status === 'active').length;
      
      this.socialMetrics.averageFriendsPerUser = totalUsers > 0 ? 
        (totalFriendships * 2) / totalUsers : 0;

      await this.saveSocialMetrics();
    } catch (error) {
      console.error('Failed to update social metrics:', error);
    }
  }

  // Save methods
  async saveFriendships() {
    try {
      const friendshipList = Array.from(this.friendships.values());
      await this.storageService.setItem('friendships', friendshipList);
    } catch (error) {
      console.error('Failed to save friendships:', error);
    }
  }

  async saveFriendRequests() {
    try {
      const requestList = Array.from(this.friendRequests.values());
      await this.storageService.setItem('friend_requests', requestList);
    } catch (error) {
      console.error('Failed to save friend requests:', error);
    }
  }

  async saveUserConnections() {
    try {
      const connectionList = Array.from(this.userConnections.values());
      await this.storageService.setItem('user_connections', connectionList);
    } catch (error) {
      console.error('Failed to save user connections:', error);
    }
  }

  async saveSocialGroups() {
    try {
      const groupList = Array.from(this.socialGroups.values());
      await this.storageService.setItem('social_groups', groupList);
    } catch (error) {
      console.error('Failed to save social groups:', error);
    }
  }

  async saveGroupMemberships() {
    try {
      const membershipList = Array.from(this.groupMemberships.values());
      await this.storageService.setItem('group_memberships', membershipList);
    } catch (error) {
      console.error('Failed to save group memberships:', error);
    }
  }

  async saveSocialPosts() {
    try {
      const postList = Array.from(this.socialPosts.values());
      await this.storageService.setItem('social_posts', postList);
    } catch (error) {
      console.error('Failed to save social posts:', error);
    }
  }

  async savePostLikes() {
    try {
      const likeList = Array.from(this.postLikes.values());
      await this.storageService.setItem('post_likes', likeList);
    } catch (error) {
      console.error('Failed to save post likes:', error);
    }
  }

  async savePostComments() {
    try {
      const commentList = Array.from(this.postComments.values());
      await this.storageService.setItem('post_comments', commentList);
    } catch (error) {
      console.error('Failed to save post comments:', error);
    }
  }

  async saveUserActivities() {
    try {
      const activityList = Array.from(this.userActivities.values());
      await this.storageService.setItem('user_activities', activityList);
    } catch (error) {
      console.error('Failed to save user activities:', error);
    }
  }

  async saveBlockedUsers() {
    try {
      const blockedList = Array.from(this.blockedUsers.values());
      await this.storageService.setItem('blocked_users', blockedList);
    } catch (error) {
      console.error('Failed to save blocked users:', error);
    }
  }

  async savePrivacySettings() {
    try {
      const settingsList = Array.from(this.privacySettings.values());
      await this.storageService.setItem('privacy_settings', settingsList);
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
    }
  }

  async saveSocialMetrics() {
    try {
      await this.storageService.setItem('social_metrics', this.socialMetrics);
    } catch (error) {
      console.error('Failed to save social metrics:', error);
    }
  }

  // Getter methods
  getFriendshipStatuses() {
    return this.friendshipStatuses;
  }

  getActivityTypes() {
    return this.activityTypes;
  }

  getPrivacyLevels() {
    return this.privacyLevels;
  }

  getSocialMetrics() {
    return this.socialMetrics;
  }

  getSocialGroups() {
    return Array.from(this.socialGroups.values());
  }

  addEventListener(eventType, callback) {
    this.listeners.push({ eventType, callback });
  }

  removeEventListener(eventType, callback) {
    this.listeners = this.listeners.filter(
      listener => listener.eventType !== eventType || listener.callback !== callback
    );
  }

  emit(eventType, data) {
    this.listeners
      .filter(listener => listener.eventType === eventType)
      .forEach(listener => listener.callback(data));
  }

  async cleanup() {
    try {
      this.listeners = [];
      this.friendships.clear();
      this.friendRequests.clear();
      this.userConnections.clear();
      this.socialGroups.clear();
      this.groupMemberships.clear();
      this.socialPosts.clear();
      this.postLikes.clear();
      this.postComments.clear();
      this.userActivities.clear();
      this.blockedUsers.clear();
      this.privacySettings.clear();
      this.initialized = false;
      
      await this.auditService.logEvent('social_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup SocialService:', error);
    }
  }
}

export { SocialService };