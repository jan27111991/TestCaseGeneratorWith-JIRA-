import axios from 'axios';
import { JiraConfig, JiraStory, JiraResponse } from './types';

export class JiraClient {
    private baseUrl: string;
    private auth: {
        username: string;
        password: string;
    };
    private lastError: string | null = null;

    constructor() {
        this.baseUrl = '';
        this.auth = {
            username: '',
            password: ''
        };
    }

    setConfig(config: JiraConfig) {
        // Normalize base URL: remove trailing slashes
        const normalized = config.baseUrl.replace(/\/+$/, '');
        // If caller already provided the REST path, don't append it twice
        if (/\/rest\/api\/3$/i.test(normalized)) {
            this.baseUrl = normalized;
        } else {
            this.baseUrl = `${normalized}/rest/api/3`;
        }

        // Trim possible surrounding quotes from the token and whitespace
        const token = (config.apiToken || '').toString().trim().replace(/^"|"$/g, '');

        this.auth = {
            username: config.email,
            password: token
        };
        this.lastError = null;
    }

    private getHeaders() {
        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Atlassian-Token': 'no-check'
        };
    }

    private validateState() {
        if (!this.baseUrl || !this.auth.username || !this.auth.password) {
            throw new Error('Jira configuration not set');
        }
    }

    async validateConnection(): Promise<boolean> {
        try {
            this.validateState();
            const response = await axios({
                method: 'GET',
                url: `${this.baseUrl}/myself`,
                auth: this.auth,
                headers: this.getHeaders()
            });
            console.log('Jira connection validated:', response.data);
            return response.status === 200;
        } catch (error: any) {
            const status = error.response?.status;
            const data = error.response?.data;
            const message = error.message || 'Unknown error';
            this.lastError = (data && (data.errorMessages || data.message || JSON.stringify(data))) || message;
            console.error('Jira connection validation failed:', { status, data, message });
            return false;
        }
    }

    async getStories(): Promise<JiraResponse<JiraStory[]>> {
        try {
            this.validateState();
            const jql = 'type in (Story) ORDER BY created DESC';
            // Use the new search/jql endpoint per Atlassian migration (CHANGE-2046)
            const response = await axios({
                method: 'GET',
                url: `${this.baseUrl}/search/jql`,
                auth: this.auth,
                params: {
                    jql,
                    fields: 'summary,description,customfield_10016,acceptance',
                    maxResults: 100
                },
                headers: this.getHeaders()
            });

            if (!response.data.issues) {
                console.error('Jira response:', response.data);
                throw new Error('No issues found in Jira response');
            }

            return {
                success: true,
                data: response.data.issues.map((issue: any) => ({
                    id: issue.id,
                    key: issue.key,
                    fields: {
                        summary: issue.fields.summary,
                        description: issue.fields.description,
                        customfield_10001: issue.fields.customfield_10001
                    }
                }))
            };
        } catch (error: any) {
            const status = error.response?.status;
            const data = error.response?.data;
            const message = error.message || 'Unknown error';
            this.lastError = (data && (data.errorMessages || data.message || JSON.stringify(data))) || message;
            console.error('Error fetching Jira stories:', { status, data, message });
            return {
                success: false,
                error: this.lastError || 'Failed to fetch stories'
            };
        }
    }

    async getStoryDetails(storyKey: string): Promise<JiraResponse<JiraStory>> {
        try {
            this.validateState();
            const response = await axios({
                method: 'GET',
                url: `${this.baseUrl}/issue/${storyKey}`,
                auth: this.auth,
                params: {
                    fields: 'summary,description,customfield_10016,acceptance'
                },
                headers: this.getHeaders()
            });

            const issue = response.data;
            return {
                success: true,
                data: {
                    id: issue.id,
                    key: issue.key,
                    fields: {
                        summary: issue.fields.summary,
                        description: issue.fields.description,
                        customfield_10001: issue.fields.customfield_10001
                    }
                }
            };
        } catch (error: any) {
            const status = error.response?.status;
            const data = error.response?.data;
            const message = error.message || 'Unknown error';
            this.lastError = (data && (data.errorMessages || data.message || JSON.stringify(data))) || message;
            console.error('Error fetching story details:', { status, data, message });
            return {
                success: false,
                error: this.lastError || 'Failed to fetch story details'
            };
        }
    }

    getLastError(): string | null {
        return this.lastError;
    }
}