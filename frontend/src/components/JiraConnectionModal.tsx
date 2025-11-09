import React, { useState } from 'react'
import { JiraConfig } from '../types'

interface JiraConnectionModalProps {
  onConnect: (config: JiraConfig) => Promise<void>
  onClose: () => void
}

export function JiraConnectionModal({ onConnect, onClose }: JiraConnectionModalProps) {
  const [config, setConfig] = useState<JiraConfig>({
    baseUrl: '',
    email: '',
    apiToken: ''
  })
  const [error, setError] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsConnecting(true)

    try {
      await onConnect(config)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Jira')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Connect to Jira</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Jira Base URL
              </label>
              <input
                type="url"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://your-domain.atlassian.net"
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                API Token
              </label>
              <input
                type="password"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={config.apiToken}
                onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 text-red-600 text-sm">{error}</div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isConnecting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}