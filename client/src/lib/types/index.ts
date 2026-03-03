export type ProjectType = {
    projectId: string;
    postUuid: string;
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
    postUuid: string;
    title: string
    description: string;
    buttons: Array<{ content: string, url: string }>;
    thumbnail: string;
    place: string;
    startAt: number;
    endAt: number;
    userId: string;
    userDisplayName: string;
    userAvatar: string;
    organizationId: string;
    organizationDisplayName: string;
    organizationAvatar: string;
};

export type PollType = {
    pollId: string;
    postUuid: string;
    title: string;
    description: string;
    pollChoices: Array<{ name: string, count: number }>
    thumbnail: string;
    userId: string;
    userDisplayName: string;
    userAvatar: string;
    organizationId: string;
    organizationDisplayName: string;
    organizationAvatar: string;
}

export type QuestionType = {
    questionId: string;
    title: string;
    description: string;
    thumbnail: string;
    bestCommentUuid: string | null;
    postUuid: string;
    userId: string;
    userDisplayName: string;
    userAvatar: string;
    organizationId: string;
    organizationDisplayName: string;
    organizationAvatar: string;
    createdAt: number;
    updatedAt: number;
};

export type CommentType = {
    commentUuid: string;
    postUuid: string;
    content: string;
    userId: string;
    userDisplayName: string;
    userAvatar: string;
    createdAt: number;
    updatedAt: number;
};

export type ReplyType = {
    replyUuid: string;
    commentUuid: string;
    content: string;
    userId: string;
    userDisplayName: string;
    userAvatar: string;
    createdAt: number;
    updatedAt: number;
};

export type UserType = {
    userId: string;
    displayName: string;
    bio: string | null;
    avatar: string;
    instagramId: string | null;
    threadsId: string | null;
    twitterId: string | null;
    email: string | null;
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
    email: string | null;
    users: Omit<UserType, "organizationId" | "organizationDisplayName" | "organizationAvatar">[]
}