import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import userFilterService from '../services/userFilterService';

export const useBlockedUsersFilter = () => {
  const { user } = useAuth();

  const filterUsers = useCallback(async (userList, userIdField = 'user_id') => {
    if (!user?.user_id) return userList || [];
    return await userFilterService.filterBlockedUsers(user.user_id, userList, userIdField);
  }, [user?.user_id]);

  const filterChatConversations = useCallback(async (conversations) => {
    if (!user?.user_id) return conversations || [];
    return await userFilterService.filterChatConversations(user.user_id, conversations);
  }, [user?.user_id]);

  const filterEventAttendees = useCallback(async (attendees) => {
    if (!user?.user_id) return attendees || [];
    return await userFilterService.filterEventAttendees(user.user_id, attendees);
  }, [user?.user_id]);

  const filterSearchResults = useCallback(async (searchResults) => {
    if (!user?.user_id) return searchResults || [];
    return await userFilterService.filterSearchResults(user.user_id, searchResults);
  }, [user?.user_id]);

  const filterFriendRequests = useCallback(async (friendRequests) => {
    if (!user?.user_id) return friendRequests || [];
    return await userFilterService.filterFriendRequests(user.user_id, friendRequests);
  }, [user?.user_id]);

  const filterGroupMembers = useCallback(async (members) => {
    if (!user?.user_id) return members || [];
    return await userFilterService.filterGroupMembers(user.user_id, members);
  }, [user?.user_id]);

  const isUserBlocked = useCallback(async (targetUserId) => {
    if (!user?.user_id || !targetUserId) return false;
    return await userFilterService.isUserBlocked(user.user_id, targetUserId);
  }, [user?.user_id]);

  return {
    filterUsers,
    filterChatConversations,
    filterEventAttendees,
    filterSearchResults,
    filterFriendRequests,
    filterGroupMembers,
    isUserBlocked,
  };
};

export default useBlockedUsersFilter;