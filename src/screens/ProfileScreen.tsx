import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/store/appStore'

export function ProfileScreen() {
  const user = useAppStore((s) => s.user)
  const setUser = useAppStore((s) => s.setUser)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Profile</h2>
        <p className="mt-1 text-sm text-zinc-400">Your account details</p>
      </div>

      <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="space-y-2">
          <Label htmlFor="first-name">First name</Label>
          <Input
            id="first-name"
            value={user.firstName}
            onChange={(e) => setUser({ firstName: e.target.value.trim() || 'Guest' })}
            autoComplete="given-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last-name">Last name</Label>
          <Input
            id="last-name"
            value={user.lastName ?? ''}
            onChange={(e) => setUser({ lastName: e.target.value })}
            autoComplete="family-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user.email ?? ''}
            onChange={(e) => setUser({ email: e.target.value })}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
      </div>
    </div>
  )
}
