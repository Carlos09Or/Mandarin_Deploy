import { useState } from 'react'
import { deleteAccount, signInForDevelopment, signInWithGoogle, signOut, syncNow, useAccount } from '../lib/account'

const GoogleG = () => (
  <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
    <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
)

const when = (ms: number) => {
  const m = Math.round((Date.now() - ms) / 60_000)
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`
}

/** Sign in, sync status and sign out. Shows nothing where there are no accounts (static hosting). */
export function Account() {
  const a = useAccount()
  const [ask, setAsk] = useState<'out' | 'unsynced' | 'delete' | null>(null)
  const [email, setEmail] = useState('')

  if (!a.available) {
    return <p className="text-sm text-muted">Your progress is saved on this device.</p>
  }
  if (a.loading) return null

  if (!a.user) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          Your progress is saved on this device. Sign in to keep it in your account and carry on from any phone or computer.
        </p>
        {a.google && (
          <button type="button" onClick={signInWithGoogle} className="btn btn-ghost normal-case">
            <GoogleG /> Sign in with Google
          </button>
        )}
        {a.dev && (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void signInForDevelopment(email)
            }}
          >
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dev email"
              className="min-w-0 flex-1 rounded-2xl border-2 border-line-dark bg-card px-4 py-2 text-sm"
            />
            <button type="submit" className="btn btn-ghost">
              Dev sign-in
            </button>
          </form>
        )}
        {!a.google && !a.dev && <p className="text-sm text-muted">Accounts are not switched on yet.</p>}
        {a.problem && <p className="text-sm font-bold text-wrong">{a.problem}</p>}
      </div>
    )
  }

  const status =
    a.sync === 'syncing'
      ? 'Syncing…'
      : a.sync === 'error'
        ? 'Not synced yet — it will try again when you are online.'
        : a.syncedAt
          ? `Synced ${when(a.syncedAt)}`
          : 'Synced'

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-extrabold">{a.user.name}</p>
        <p className="text-sm text-muted">{a.user.email}</p>
        <button type="button" onClick={() => void syncNow()} className="mt-1 text-left text-sm font-bold text-sky-dark">
          {status}
        </button>
      </div>

      {a.user.isAdmin && (
        <a href="/admin" className="btn btn-ghost">
          Learners (admin)
        </a>
      )}

      {ask === 'unsynced' && (
        <div className="flex flex-col gap-2 rounded-2xl bg-wrong-soft p-4">
          <p className="text-sm font-bold text-wrong-dark">Some of your latest progress hasn’t reached your account. Signing out now would lose it.</p>
          <button type="button" onClick={() => setAsk(null)} className="btn btn-ghost">
            Stay signed in
          </button>
          <button type="button" onClick={() => void signOut(true).then(() => setAsk(null))} className="btn btn-wrong">
            Sign out and lose it
          </button>
        </div>
      )}
      {ask === 'delete' && (
        <div className="flex flex-col gap-2 rounded-2xl bg-wrong-soft p-4">
          <p className="text-sm font-bold text-wrong-dark">
            This deletes your account and the progress stored in it. The progress on this device stays.
          </p>
          <button type="button" onClick={() => setAsk(null)} className="btn btn-ghost">
            Keep my account
          </button>
          <button type="button" onClick={() => void deleteAccount().then(() => setAsk(null))} className="btn btn-wrong">
            Delete my account
          </button>
        </div>
      )}
      {ask === null && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void signOut().then((r) => setAsk(r === 'unsynced' ? 'unsynced' : null))}
            className="btn btn-ghost flex-1"
          >
            Sign out
          </button>
          <button type="button" onClick={() => setAsk('delete')} className="btn btn-ghost flex-1 text-wrong">
            Delete account
          </button>
        </div>
      )}
      {ask === null && <p className="text-xs text-muted">Signing out also clears this device. Your progress stays in your account.</p>}
    </div>
  )
}
