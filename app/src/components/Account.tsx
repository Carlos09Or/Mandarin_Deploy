import { useState } from 'react'
import { useT } from '../i18n'
import { needsHomeScreen } from '../lib/storage'
import { GoogleG } from './GoogleButton'
import { deleteAccount, signInForDevelopment, signInWithGoogle, signOut, syncNow, useAccount } from '../lib/account'

/** Sign in, sync status and sign out. Shows nothing where there are no accounts (static hosting). */
export function Account() {
  const a = useAccount()
  const t = useT().account
  const when = (ms: number) => {
    const m = Math.round((Date.now() - ms) / 60_000)
    return m < 1 ? t.justNow : m < 60 ? t.minAgo(m) : t.hAgo(Math.round(m / 60))
  }
  const [ask, setAsk] = useState<'out' | 'unsynced' | 'delete' | null>(null)
  const [email, setEmail] = useState('')

  if (!a.available) {
    return <p className="text-sm text-muted">{t.saved}</p>
  }
  if (a.loading) return null

  if (!a.user) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          {t.guest}
        </p>
        {needsHomeScreen() && (
          <p className="text-sm text-muted">{t.iphone}</p>
        )}
        {a.google && (
          <button type="button" onClick={signInWithGoogle} className="btn btn-ghost normal-case">
            <GoogleG /> {t.signIn}
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
        {!a.google && !a.dev && <p className="text-sm text-muted">{t.notOn}</p>}
        {a.problem && <p className="text-sm font-bold text-wrong">{t.problems[a.problem] ?? a.problem}</p>}
      </div>
    )
  }

  const status =
    a.sync === 'syncing'
      ? t.syncing
      : a.sync === 'error'
        ? t.syncError
        : a.syncedAt
          ? t.syncedAgo(when(a.syncedAt))
          : t.synced

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
          {t.admin}
        </a>
      )}

      {ask === 'unsynced' && (
        <div className="flex flex-col gap-2 rounded-2xl bg-wrong-soft p-4">
          <p className="text-sm font-bold text-wrong-dark">{t.unsynced}</p>
          <button type="button" onClick={() => setAsk(null)} className="btn btn-ghost">
            {t.stay}
          </button>
          <button type="button" onClick={() => void signOut(true).then(() => setAsk(null))} className="btn btn-wrong">
            {t.loseIt}
          </button>
        </div>
      )}
      {ask === 'delete' && (
        <div className="flex flex-col gap-2 rounded-2xl bg-wrong-soft p-4">
          <p className="text-sm font-bold text-wrong-dark">
            {t.deleteText}
          </p>
          <button type="button" onClick={() => setAsk(null)} className="btn btn-ghost">
            {t.keep}
          </button>
          <button type="button" onClick={() => void deleteAccount().then(() => setAsk(null))} className="btn btn-wrong">
            {t.deleteMine}
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
            {t.signOut}
          </button>
          <button type="button" onClick={() => setAsk('delete')} className="btn btn-ghost flex-1 text-wrong">
            {t.delete}
          </button>
        </div>
      )}
      {ask === null && <p className="text-xs text-muted">{t.signOutNote}</p>}
    </div>
  )
}
