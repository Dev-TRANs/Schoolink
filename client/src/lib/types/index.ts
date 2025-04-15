export type ProjectType = {
    projectId: string;
    title: string
    description: string;
    buttons: Array<{ content: string, url: string }>;
    thumbnail: string;
    userId: string;
    userDisplayName: string;
    userAvatar: string;
    organizationId: string;
    organizationDisplayName: string;
    organizationAvatar: string;
};

export type EventType = {
    eventId: string;
    title: string
    description: string;
    buttons: Array<{ content: string, url: string }>;
    thumbnail: string;
    userId: string;
    userDisplayName: string;
    userAvatar: string;
    organizationId: string;
    organizationDisplayName: string;
    organizationAvatar: string;
};

export type InteractionType = {
    interactionId: string;
    title: string
    description: string;
    buttons: Array<{ content: string, url: string }>;
    thumbnail: string;
    userId: string;
    userDisplayName: string;
    userAvatar: string;
    organizationId: string;
    organizationDisplayName: string;
    organizationAvatar: string;
};

export type UserType = {
    userId: string;
    displayName: string;
    bio: string | null;
    avatar: string;
    instagramId: string | null;
    threadsId: string | null;
    twitterId: string | null;
    organizationId: string;
    organizationDisplayName: string;
    organizationAvatar: string;
    role: "admin" | "member";
};

export type OrganizationType = {
    organizationId: string;
    displayName: string;
    bio: string;
    avatar: string;
    instagramId: string;
    threadsId: string;
    twitterId: string;
    users: Omit<userType, "organizationId" | "organizationDisplayName" | "organizationAvatar">[]
}