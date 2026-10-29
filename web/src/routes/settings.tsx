import { createFileRoute, redirect } from '@tanstack/react-router'

import { getToken } from '#/lib/session'

export const Route = createFileRoute('/settings')({
  ssr: false,
  beforeLoad() {
    throw redirect({ to: getToken() ? '/dashboard' : '/login' })
  },
  component: () => null,
})
