/**
 * Settings Page Component (Teacher only)
 */

import React, { useState } from 'react'
import { Card, Button, Input, Skeleton } from '@/components/ui'
import { useAsync, useForm } from '@/hooks'
import { apiClient } from '@/utils/api'
import { Mail, CheckCircle, AlertTriangle, Key } from 'lucide-react'

interface SettingsData {
  gmail: string
}

export const SettingsPage: React.FC = () => {
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { data: settings, loading } = useAsync<SettingsData>(() =>
    apiClient.client.get('/settings').then((res) => res.data.data || { gmail: '' })
  )

  const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm(
    { gmail: '', app_password: '' },
    async (values) => {
      setSuccessMsg('')
      setErrorMsg('')
      try {
        const res = await apiClient.client.put('/settings', {
          gmail: values.gmail,
          app_password: values.app_password
        })
        setSuccessMsg(res.data.message || 'Gmail connected! Test email sent.')
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Connection failed. Check your password.')
      }
    }
  )

  return (
    <main className="flex-1 overflow-auto">
      <div className="p-6 max-w-xl mx-auto animate-fadeInUp">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">⚙️ Email Settings</h2>
          <p className="text-muted">Configure Gmail connections to send automated updates and alerts</p>
        </div>

        {loading ? (
          <Skeleton count={1} className="h-48" />
        ) : (
          <div className="space-y-6">
            <Card title="Gmail Integration">
              <p className="text-sm text-muted mb-6">
                Connect your institutional or personal Gmail account. ClassConnect will use this to automatically email students about overdue assignments, exam notifications, and general announcements.
              </p>

              {settings?.gmail && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-green/20 bg-green/5 text-green text-sm mb-6 font-medium">
                  <CheckCircle size={18} />
                  Currently Connected: {settings.gmail}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-lg border border-green/30 bg-green/10 text-green text-sm mb-6 font-semibold animate-pulse">
                  {successMsg}
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-lg border border-red/30 bg-red/10 text-red text-sm mb-6 font-semibold">
                  {errorMsg}
                </div>
              )}

              <form className="space-y-4">
                <Input
                  label="Gmail Address"
                  name="gmail"
                  type="email"
                  placeholder="your.email@gmail.com"
                  value={values.gmail}
                  onChange={handleChange}
                  error={errors.gmail as string}
                />
                
                <Input
                  label="App Password"
                  name="app_password"
                  type="password"
                  placeholder="16-character App Password"
                  value={values.app_password}
                  onChange={handleChange}
                  error={errors.app_password as string}
                />

                <div className="flex gap-2 items-start p-3 bg-white/[0.02] border border-border/50 rounded-lg text-xs text-muted">
                  <Key size={18} className="text-amber flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-text">How to get a Gmail App Password:</span>
                    <ol className="list-decimal list-inside space-y-1 mt-1">
                      <li>Go to your Google Account Settings &rarr; Security.</li>
                      <li>Turn on <span className="font-semibold text-text">2-Step Verification</span>.</li>
                      <li>Search for <span className="font-semibold text-text">App Passwords</span> and generate a new password named "ClassConnect".</li>
                      <li>Copy and paste the 16-character password here (spaces do not matter).</li>
                    </ol>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => handleSubmit()}
                  isLoading={isSubmitting}
                  className="w-full mt-4"
                >
                  <Mail size={16} />
                  Connect &amp; Test Connection
                </Button>
              </form>
            </Card>

            <div className="p-4 rounded-xl border border-amber/20 bg-amber/5 text-amber text-xs flex gap-2">
              <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
              <p>
                We do not store your primary Google password. Your 16-character App Password is stored locally on this machine to authorize SMTP connections.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
export default SettingsPage
