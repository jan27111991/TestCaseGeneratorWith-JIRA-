export interface JiraConfig {
    baseUrl: string;
    email: string;
    apiToken: string;
}

export interface JiraStory {
    id: string;
    key: string;
    fields: {
        summary: string;
        description: string;
        customfield_10001?: string; // Acceptance Criteria field
    };
}

export interface JiraResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}