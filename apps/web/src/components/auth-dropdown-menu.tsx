'use client'

import * as React from 'react'
import Link from 'next/link'
import { SignOutButton } from '@clerk/nextjs'
import {
  HelpCircleIcon,
  Loader2Icon,
  LogOutIcon,
  SettingsIcon,
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface IProps {
  children: React.ReactNode
}

export default function AuthDropdownMenu({ children }: IProps) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  return (
    <>
      <DropdownMenu
        open={isDropdownOpen}
        onOpenChange={(open) => {
          if (isLoggingOut) return
          setIsDropdownOpen(open)
        }}
      >
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent className="w-52">
          <DropdownMenuItem>
            <Link href="/profile" className="flex items-center">
              <SettingsIcon className="mr-2 h-4 w-4" />
              Manage account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link
              href="https://context-builder.gitbook.io/helpdocument/"
              className="flex items-center"
              target="_blank"
            >
              <HelpCircleIcon className="mr-2 h-4 w-4" />
              Help document
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <SignOutButton
            signOutCallback={() => {
              location.replace('/')
            }}
          >
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setIsLoggingOut(true)}
            >
              {isLoggingOut ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOutIcon className="mr-2 h-4 w-4" />
              )}
              <span>Sign out</span>
            </DropdownMenuItem>
          </SignOutButton>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
