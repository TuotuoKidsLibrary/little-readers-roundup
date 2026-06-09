/* eslint-disable */
// @ts-nocheck
// noinspection JSUnusedGlobalSymbols
// This file was manually updated to satisfy TanStack Router compilation constraints.

import { Route as rootRoute } from './routes/__root'
import { Route as IndexImport } from './pages/Index'
import { Route as ShelfImport } from './pages/Shelf'
import { Route as AccountImport } from './pages/Account'

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const ShelfRoute = ShelfImport.update({
  path: '/shelf',
  getParentRoute: () => rootRoute,
} as any)

const AccountRoute = AccountImport.update({
  path: '/account',
  getParentRoute: () => rootRoute,
} as any)

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/shelf': {
      id: '/shelf'
      path: '/shelf'
      fullPath: '/shelf'
      preLoaderRoute: typeof ShelfImport
      parentRoute: typeof rootRoute
    }
    '/account': {
      id: '/account'
      path: '/account'
      fullPath: '/account'
      preLoaderRoute: typeof AccountImport
      parentRoute: typeof rootRoute
    }
  }
}

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  ShelfRoute,
  AccountRoute,
])
