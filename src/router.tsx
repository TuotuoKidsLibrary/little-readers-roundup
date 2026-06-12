import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { Route as rootRoute } from './routes/__root'
import { Route as WelcomeRoute } from './routes/welcome'
import { Route as ShelfRoute } from './routes/shelf'
import { Route as AccountRoute } from './routes/account'
import { Route as IndexRoute } from './routes/index'

// Manually build the tree so Vite doesn't look for the missing .gen file
const routeTree = rootRoute.addChildren([
  IndexRoute.update({ path: '/' }),
  AccountRoute.update({ path: '/account' }),
  ShelfRoute.update({ path: '/shelf' }),
  WelcomeRoute.update({ path: '/welcome' }),
])

export function createRouter() {
  return createTanStackRouter({
    routeTree,
    defaultPreload: 'intent',
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
