import { apiSlice } from '../api/baseApi';

// Types for Workspace/Channel APIs
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  icon?: string;
  isDefault: boolean;
  createdAt: string;
  _count: {
    channels: number;
    members: number;
  };
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  topic?: string;
  type?: 'PUBLIC' | 'PRIVATE' | 'ANNOUNCEMENT' | 'GUEST';
  workspaceId: string;
  categoryId?: string;
  isDefault: boolean;
  isArchived: boolean;
  isReadOnly: boolean;
  position: number;
  createdAt: string;
  _count: {
    members: number;
    messages?: number;
  };
}

export interface ChannelCategory {
  id: string;
  name: string;
  position: number;
  workspaceId: string;
  channels: Channel[];
}

export interface ChannelMember {
  id: string;
  userId: string;
  channelId: string;
  role?: string;
  canPost: boolean;
  isMuted: boolean;
  isPinned: boolean;
  joinedAt: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
    status?: 'online' | 'offline' | 'away';
  };
}

export interface CreateChannelRequest {
  workspaceId: string;
  name: string;
  description?: string;
  topic?: string;
  type?: 'PUBLIC' | 'PRIVATE' | 'ANNOUNCEMENT' | 'GUEST';
  categoryId?: string;
  isDefault?: boolean;
}

export interface PaginatedChannels {
  channels: Channel[];
  total: number;
  page: number;
  totalPages: number;
}

// Channel/Workspace API Slice
export const channelApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ==================== WORKSPACE ENDPOINTS ====================

    // List workspaces user has access to
    listWorkspaces: builder.query<Workspace[], void>({
      query: () => '/workspaces',
      transformResponse: (response: { success: boolean; workspaces: Workspace[] }) => response.workspaces,
      providesTags: ['Workspaces'],
    }),

    // Get workspace by ID
    getWorkspace: builder.query<Workspace, string>({
      query: (id) => `/workspaces/${id}`,
      transformResponse: (response: { success: boolean; workspace: Workspace }) => response.workspace,
      providesTags: (_result, _error, id) => [{ type: 'Workspaces', id }],
    }),

    // ==================== CHANNEL ENDPOINTS ====================

    // List channels in workspace
    listChannels: builder.query<Channel[], { workspaceId: string; includeArchived?: boolean }>({
      query: ({ workspaceId, includeArchived }) => ({
        url: `/workspaces/${workspaceId}/channels`,
        params: { includeArchived },
      }),
      transformResponse: (response: { success: boolean; channels: Channel[] }) => response.channels,
      providesTags: ['Channels'],
    }),

    // Browse public channels (with pagination)
    browseChannels: builder.query<PaginatedChannels, { workspaceId: string; page?: number; limit?: number; search?: string }>({
      query: ({ workspaceId, ...params }) => ({
        url: `/workspaces/${workspaceId}/channels/browse`,
        params,
      }),
      transformResponse: (response: any) => ({
        channels: response.channels || response.items || [],
        total: response.total || 0,
        page: response.page || 1,
        totalPages: response.totalPages || 1,
      }),
    }),

    // Get channel details
    getChannel: builder.query<Channel & { members: ChannelMember[] }, string>({
      query: (channelId) => `/channels/${channelId}`,
      transformResponse: (response: { success: boolean; channel: Channel & { members: ChannelMember[] } }) => response.channel,
      providesTags: (_result, _error, id) => [{ type: 'Channels', id }],
    }),

    // Create channel
    createChannel: builder.mutation<Channel, CreateChannelRequest>({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/channels`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: { success: boolean; channel: Channel }) => response.channel,
      invalidatesTags: ['Channels'],
    }),

    // Update channel
    updateChannel: builder.mutation<Channel, { channelId: string; name?: string; description?: string; topic?: string; isReadOnly?: boolean }>({
      query: ({ channelId, ...body }) => ({
        url: `/channels/${channelId}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: { success: boolean; channel: Channel }) => response.channel,
      invalidatesTags: (_result, _error, { channelId }) => [{ type: 'Channels', id: channelId }],
    }),

    // Delete channel
    deleteChannel: builder.mutation<void, string>({
      query: (channelId) => ({
        url: `/channels/${channelId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Channels'],
    }),

    // Archive channel
    archiveChannel: builder.mutation<Channel, string>({
      query: (channelId) => ({
        url: `/channels/${channelId}/archive`,
        method: 'POST',
      }),
      transformResponse: (response: { success: boolean; channel: Channel }) => response.channel,
      invalidatesTags: ['Channels'],
    }),

    // Unarchive channel
    unarchiveChannel: builder.mutation<Channel, string>({
      query: (channelId) => ({
        url: `/channels/${channelId}/unarchive`,
        method: 'POST',
      }),
      transformResponse: (response: { success: boolean; channel: Channel }) => response.channel,
      invalidatesTags: ['Channels'],
    }),

    // Join public channel
    joinChannel: builder.mutation<ChannelMember, string>({
      query: (channelId) => ({
        url: `/channels/${channelId}/join`,
        method: 'POST',
      }),
      transformResponse: (response: { success: boolean; member: ChannelMember }) => response.member,
      invalidatesTags: ['Channels'],
    }),

    // Leave channel
    leaveChannel: builder.mutation<void, string>({
      query: (channelId) => ({
        url: `/channels/${channelId}/leave`,
        method: 'POST',
      }),
      invalidatesTags: ['Channels'],
    }),

    // ==================== MEMBER ENDPOINTS ====================

    // Get channel members
    getChannelMembers: builder.query<{ members: ChannelMember[]; total: number }, string>({
      query: (channelId) => `/channels/${channelId}/members`,
      transformResponse: (response: { success: boolean; members: ChannelMember[]; total: number }) => ({
        members: response.members,
        total: response.total,
      }),
      providesTags: (_result, _error, id) => [{ type: 'Members', id }],
    }),

    // Add member to channel
    addChannelMember: builder.mutation<ChannelMember, { channelId: string; targetUserId: string }>({
      query: ({ channelId, targetUserId }) => ({
        url: `/channels/${channelId}/members`,
        method: 'POST',
        body: { targetUserId },
      }),
      transformResponse: (response: { success: boolean; member: ChannelMember }) => response.member,
      invalidatesTags: (_result, _error, { channelId }) => [{ type: 'Members', id: channelId }],
    }),

    // Remove member from channel
    removeChannelMember: builder.mutation<void, { channelId: string; targetUserId: string }>({
      query: ({ channelId, targetUserId }) => ({
        url: `/channels/${channelId}/members/${targetUserId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { channelId }) => [{ type: 'Members', id: channelId }],
    }),

    // Update member permissions
    updateMemberPermissions: builder.mutation<ChannelMember, { channelId: string; targetUserId: string; canPost: boolean }>({
      query: ({ channelId, targetUserId, canPost }) => ({
        url: `/channels/${channelId}/members/${targetUserId}`,
        method: 'PUT',
        body: { canPost },
      }),
      transformResponse: (response: { success: boolean; member: ChannelMember }) => response.member,
      invalidatesTags: (_result, _error, { channelId }) => [{ type: 'Members', id: channelId }],
    }),

    // Update channel preferences (mute/pin)
    updateChannelPreferences: builder.mutation<ChannelMember, { channelId: string; isMuted?: boolean; isPinned?: boolean }>({
      query: ({ channelId, ...body }) => ({
        url: `/channels/${channelId}/preferences`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: { success: boolean; member: ChannelMember }) => response.member,
      invalidatesTags: ['Channels'],
    }),

    // Set channel as default
    setDefaultChannel: builder.mutation<Channel, { channelId: string; isDefault: boolean }>({
      query: ({ channelId, isDefault }) => ({
        url: `/channels/${channelId}/default`,
        method: 'PUT',
        body: { isDefault },
      }),
      transformResponse: (response: { success: boolean; channel: Channel }) => response.channel,
      invalidatesTags: ['Channels'],
    }),
  }),
});

export const {
  useListWorkspacesQuery,
  useGetWorkspaceQuery,
  useListChannelsQuery,
  useBrowseChannelsQuery,
  useGetChannelQuery,
  useCreateChannelMutation,
  useUpdateChannelMutation,
  useDeleteChannelMutation,
  useArchiveChannelMutation,
  useUnarchiveChannelMutation,
  useJoinChannelMutation,
  useLeaveChannelMutation,
  useGetChannelMembersQuery,
  useAddChannelMemberMutation,
  useRemoveChannelMemberMutation,
  useUpdateMemberPermissionsMutation,
  useUpdateChannelPreferencesMutation,
  useSetDefaultChannelMutation,
} = channelApi;
