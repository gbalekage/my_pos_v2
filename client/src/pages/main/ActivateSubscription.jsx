import { ActivateForm } from '@/components/forms/activate-form'
import React from 'react'

const ActivateSubscription = () => {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ActivateForm />
      </div>
    </div>
  )
}

export default ActivateSubscription