import { atom } from 'jotai'
import type { Filter, SortOption } from '../../../types'

export const filtersAtom = atom<Filter>({})

export const sortAtom = atom<SortOption>('relevance')

export const searchQueryAtom = atom<string>('')

