import { SignupForm } from '@/components/forms/create-admin-form'
import React from 'react'

const CreateAdmin = () => {
  return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  )
}

export default CreateAdmin