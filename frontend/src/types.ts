export interface GenerateRequest {
  storyTitle: string
  acceptanceCriteria: string
  description?: string
  additionalInfo?: string
}

export interface TestCase {
  id: string
  title: string
  steps: string[]
  testData?: string
  expectedResult: string
  category: string
}

export interface GenerateResponse {
  cases: TestCase[]
  model?: string
  promptTokens: number
  completionTokens: number
}

export interface JiraConfig {
  baseUrl: string
  email: string
  apiToken: string
}

export interface JiraStory {
  id: string
  key: string
  fields: {
    summary: string
    description: string
    customfield_10001?: string // Acceptance Criteria field
  }
}

export interface JiraConnection {
  isConnected: boolean
  stories: JiraStory[]
  selectedStory?: JiraStory
  error?: string
}