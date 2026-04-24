import { createContext, useContext } from 'react'

interface PageNav {
  prev?: string
  next?: string
}

const PageNavContext = createContext<PageNav>({})

export const PageNavProvider = PageNavContext.Provider
export const usePageNav = () => useContext(PageNavContext)
