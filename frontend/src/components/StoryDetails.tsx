import { JiraStory } from '../types'

interface StoryDetailsProps {
  story: JiraStory
}

function extractTextFromADF(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(v => extractTextFromADF(v)).join('\n')

  // Traverse Atlassian Document Format (ADF) nodes
  const walk = (node: any): string => {
    if (!node) return ''
    if (node.type === 'text') return node.text || ''
    if (Array.isArray(node.content)) {
      return node.content.map((c: any) => walk(c)).join('')
    }
    return ''
  }

  // If root has content, flatten it
  if (value.content) return walk(value).trim()
  return String(value)
}

function extractADFSection(root: any, headingTitle: string): string {
  if (!root) return ''
  // If it's a string, nothing to do
  if (typeof root === 'string') return ''
  const nodes = root.content || []
  let collecting = false
  const out: string[] = []

  const nodeText = (node: any) => {
    if (!node) return ''
    if (node.type === 'text') return node.text || ''
    if (Array.isArray(node.content)) return node.content.map((c: any) => nodeText(c)).join('')
    return ''
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.type === 'heading') {
      const title = nodeText(node).trim().toLowerCase()
      if (collecting) {
        // stop collecting when we hit the next heading
        break
      }
      if (title.includes(headingTitle.toLowerCase())) {
        collecting = true
        continue
      }
    }
    if (collecting) {
      // convert node to text
      out.push(nodeText(node))
    }
  }

  return out.map(s => s.trim()).filter(Boolean).join('\n\n').trim()
}

export function StoryDetails({ story }: StoryDetailsProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Story Details</h3>
        <p className="text-sm text-gray-500">{story.key}</p>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900">Summary</h4>
        <p className="mt-1 text-sm text-gray-600">{story.fields.summary}</p>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900">Description</h4>
        <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
          {extractTextFromADF(story.fields.description) || 'No description provided'}
        </p>
      </div>

      { (story.fields.customfield_10001 || extractADFSection(story.fields.description, 'Acceptance Criteria')) && (
        <div>
          <h4 className="text-md font-medium text-gray-900">Acceptance Criteria</h4>
          <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
            {story.fields.customfield_10001
              ? extractTextFromADF(story.fields.customfield_10001)
              : extractADFSection(story.fields.description, 'Acceptance Criteria')}
          </p>
        </div>
      )}
    </div>
  )
}