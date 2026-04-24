import { createContext, useContext } from 'react'

type NavigateFn = (to: string) => void

const NavigateContext = createContext<NavigateFn>(() => {})

export const NavigateProvider = NavigateContext.Provider
export const useNavigate = () => useContext(NavigateContext)
