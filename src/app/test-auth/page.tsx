'use client'

import { SessionProvider } from 'next-auth/react'
import TestAuthComponent from './TestAuthComponent'

export default function TestAuthPage() {
  return (
    <SessionProvider>
      <TestAuthComponent />
    </SessionProvider>
  )
}
