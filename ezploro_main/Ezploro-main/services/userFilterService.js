import AsyncStorage from "@react-native-async-storage/async-storage";
import userBlockService from "./userBlockService";

class UserFilterService {
  constructor() {
    this.blockedUsersCache = new Set();
    this.cacheExpiry = 0;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  // Get current user's blocked users list
  async getBlockedUsers(currentUserId) {
    try {
      const now = Date.now();
      
      // Return cached data if still valid
      if (this.cacheExpiry > now && this.blockedUsersCache.size > 0) {
        return Array.from(this.blockedUsersCache);
      }

      const token = await AsyncStorage.getItem("token");
      if (!token || !currentUserId) {
        return [];
      }

      const blockedUsers = await userBlockService.getBlockedUsers(token, currentUserId);
      
      // Update cache
      this.blockedUsersCache.clear();
      blockedUsers.forEach(userId => this.blockedUsersCache.add(userId.toString()));
      this.cacheExpiry = now + this.CACHE_DURATION;
      
      return blockedUsers;
    } catch (error) {
      console.warn("⚠️ Could not fetch blocked users:", error);
      return [];
    }
  }

  // Check if a user is blocked
  async isUserBlocked(currentUserId, targetUserId) {
    if (!currentUserId || !targetUserId) return false;
    
    const blockedUsers = await this.getBlockedUsers(currentUserId);
    return blockedUsers.includes(targetUserId.toString()) || blockedUsers.includes(parseInt(targetUserId));
  }

  // Filter out blocked users from a list
  async filterBlockedUsers(currentUserId, userList, userIdField = 'user_id') {
    if (!currentUserId || !Array.isArray(userList)) {
      return userList || [];
    }

    try {
      const blockedUsers = await this.getBlockedUsers(currentUserId);
      
      if (blockedUsers.length === 0) {
        return userList;
      }

      return userList.filter(item => {
        if (!item) return false;
        
        // Handle different data structures
        let userId;
        if (typeof item === 'object') {
          // Try different possible user ID fields
          userId = item[userIdField] || 
                   item.userId || 
                   item.id || 
                   item.user?.user_id || 
                   item.user?.id ||
                   item.sender_id ||
                   item.receiver_id;
        } else {
          userId = item;
        }

        if (!userId) return true; // Keep items without user IDs
        
        const isBlocked = blockedUsers.includes(userId.toString()) || 
                         blockedUsers.includes(parseInt(userId));
        
        return !isBlocked;
      });
    } catch (error) {
      console.warn("⚠️ Error filtering blocked users:", error);
      return userList; // Return original list on error
    }
  }

  // Filter blocked users from chat conversations
  async filterChatConversations(currentUserId, conversations) {
    return this.filterBlockedUsers(currentUserId, conversations, 'user_id');
  }

  // Filter blocked users from event attendees
  async filterEventAttendees(currentUserId, attendees) {
    if (!Array.isArray(attendees)) return attendees || [];
    
    return this.filterBlockedUsers(currentUserId, attendees.map(attendee => ({
      ...attendee,
      user_id: attendee.user?.user_id || attendee.user_id
    })), 'user_id');
  }

  // Filter blocked users from search results
  async filterSearchResults(currentUserId, searchResults) {
    return this.filterBlockedUsers(currentUserId, searchResults, 'user_id');
  }

  // Filter blocked users from friend requests
  async filterFriendRequests(currentUserId, friendRequests) {
    if (!Array.isArray(friendRequests)) return friendRequests || [];
    
    return this.filterBlockedUsers(currentUserId, friendRequests.map(request => ({
      ...request,
      user_id: request.sender_id || request.receiver_id
    })), 'user_id');
  }

  // Filter blocked users from group members
  async filterGroupMembers(currentUserId, members) {
    return this.filterBlockedUsers(currentUserId, members, 'user_id');
  }

  // Clear cache (call when user blocks/unblocks someone)
  clearCache() {
    this.blockedUsersCache.clear();
    this.cacheExpiry = 0;
  }

  // Add user to blocked cache (for immediate UI updates)
  addToBlockedCache(userId) {
    this.blockedUsersCache.add(userId.toString());
  }

  // Remove user from blocked cache (for immediate UI updates)
  removeFromBlockedCache(userId) {
    this.blockedUsersCache.delete(userId.toString());
  }
}

export default new UserFilterService();