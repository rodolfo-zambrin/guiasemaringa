import type { UserProfile } from './common.types'

export interface AuthUser {
  id: string
  email: string
  profile: UserProfile
}
