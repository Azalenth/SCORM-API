'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TestPage() {
  const [learnerId, setLearnerId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [completionStatus, setCompletionStatus] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStore = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learnerId, courseId, completionStatus }),
      })
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(JSON.stringify({ error: 'Failed to store data' }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const handleRetrieve = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/completion?learnerId=${encodeURIComponent(learnerId)}&courseId=${encodeURIComponent(courseId)}`
      )
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(JSON.stringify({ error: 'Failed to retrieve data' }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold">SCORM Completion Tracker Test</h1>
        
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="learnerId">Learner ID</Label>
            <Input
              id="learnerId"
              value={learnerId}
              onChange={(e) => setLearnerId(e.target.value)}
              placeholder="Enter learner ID"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="courseId">Course ID</Label>
            <Input
              id="courseId"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="Enter course ID"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="completionStatus">Completion Status</Label>
            <Input
              id="completionStatus"
              value={completionStatus}
              onChange={(e) => setCompletionStatus(e.target.value)}
              placeholder="Enter completion status"
            />
          </div>
          
          <div className="flex gap-4">
            <Button onClick={handleStore} disabled={loading}>
              Store Completion
            </Button>
            <Button onClick={handleRetrieve} disabled={loading} variant="outline">
              Retrieve Completion
            </Button>
          </div>
          
          {result && (
            <div className="mt-4">
              <Label>Result:</Label>
              <pre className="mt-2 rounded-lg bg-gray-100 p-4 text-sm">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

