import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtomValue, useAtom } from 'jotai'
import { api } from '../api'
import type { User } from '../../types'
import type { UpdateProfileRequest } from '../api'
import { authAtom, setAuthStateAtom } from '../atoms/auth'

export function useProfile() {
  const authState = useAtomValue(authAtom)

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      return await api.profile.getProfile()
    },
    enabled: authState.isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const [, setAuthState] = useAtom(setAuthStateAtom)
  const authState = useAtomValue(authAtom)

  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      return await api.profile.updateProfile(data)
    },
    onSuccess: async (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      // Update auth state with new user data
      // Get current tokens from tokenManager to ensure we have the latest
      const accessToken = await api.tokenManager.getAccessToken()
      const refreshToken = await api.tokenManager.getRefreshToken()
      
      if (accessToken) {
        setAuthState({
          user: updatedUser,
          accessToken,
          refreshToken: refreshToken || undefined,
        })
      }
    },
  })
}

export function useUploadProfilePicture() {
  const queryClient = useQueryClient()
  const [, setAuthState] = useAtom(setAuthStateAtom)

  return useMutation({
    mutationFn: async ({ uri, type }: { uri: string; type?: string }) => {
      return await api.profile.uploadProfilePicture(uri, type)
    },
    onSuccess: async (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      // Update auth state with new user data
      // Get current tokens from tokenManager to ensure we have the latest
      const accessToken = await api.tokenManager.getAccessToken()
      const refreshToken = await api.tokenManager.getRefreshToken()
      
      if (accessToken) {
        setAuthState({
          user: updatedUser,
          accessToken,
          refreshToken: refreshToken || undefined,
        })
      }
    },
  })
}

