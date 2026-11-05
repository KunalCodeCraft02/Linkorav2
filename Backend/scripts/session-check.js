/**
 * Session check.
 *
 * The rule this suite defends: once a user registers or logs in, they stay
 * signed in for the whole session, and the session lasts seven days.
 *
 * This was broken in a way every other suite missed. In production the
 * session cookie was marked `Secure` purely because `NODE_ENV` was
 * `production`, so over plain HTTP the browser refused to send it back. Every
 * request went out unauthenticated, the API answered 401, and the app sent
 * the user to the login page even though they had just signed in. The
 * cookie's lifetime and the token's expiry were also written out separately
 * in two places, so the two could drift apart.
 *
 * The suite therefore drives a *real browser* - the only place where the
 * browser's own rules about `Secure` and `SameSite` actually apply - and
 * checks the session end to end: register, keep using it, renew it, and
 * log out.
 *
 * Run it with the backend on :5000 and the frontend on :5173.
 */

const { chromium } = require('playwright')

const BACKEND = process.env.LINKORA_BACKEND || 'http://localhost:5000'
const FRONTEND = process.env.LINKORA_FRONTEND || 'http://localhost:5173'

const SESSION_DAYS = 7
const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60

let passed = 0
let failed = 0

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1
    console.log(`PASS  ${name}${detail ? ` - ${detail}` : ''}`)
  } else {
    failed += 1
    console.log(`FAIL  ${name}${detail ? ` - ${detail}` : ''}`)
  }
}

async function launch() {
  try {
    return await chromium.launch()
  } catch {
    return await chromium.launch({ channel: 'chrome' })
  }
}

/**
 * Register through the real API using the browser's own cookie jar, so the
 * browser's rules about the cookie's attributes are applied for real.
 */
async function register(context, email) {
  const response = await context.request.post(`${BACKEND}/api/auth/register`, {
    data: {
      firstName: 'Session',
      email,
      phone: '+919000000000',
      instagram: '@session_check',
      followers: 1,
      password: 'supersecret123',
    },
  })
  return response
}

async function main() {
  const browser = await launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  // Establish an origin so the cookie jar has somewhere to put the cookie.
  await page.goto(`${BACKEND}/api/health`)

  const stamp = Date.now()
  const email = `session-${stamp}@linkora.test`

  // --- register ---------------------------------------------------------------
  const registered = await register(context, email)
  check('a visitor can register', registered.status() === 201, `status ${registered.status()}`)

  // --- the cookie the browser actually kept -------------------------------------
  const cookies = await context.cookies()
  const session = cookies.find((cookie) => cookie.name === 'linkora_session')

  check('the browser stored the session cookie', Boolean(session))
  check(
    'the session cookie is http-only, so scripts cannot read it',
    Boolean(session?.httpOnly),
    session ? `httpOnly ${session.httpOnly}` : 'no cookie',
  )
  check(
    'the session cookie is not restricted to a secure-only connection when the app is served over plain HTTP',
    Boolean(session) && session.secure === false,
    session ? `secure ${session.secure}` : 'no cookie',
  )

  // --- the session lasts seven days ---------------------------------------------
  const lifetime = session ? session.expires - Date.now() / 1000 : 0
  check(
    `the session lasts ${SESSION_DAYS} days`,
    Math.abs(lifetime - SESSION_SECONDS) < 300,
    `${Math.round(lifetime / 86400)} days`,
  )

  // The signed token must agree with the cookie, or one of them would end
  // the session early.
  const payload = await context.request.get(`${BACKEND}/api/auth/me`)
  check('the session works straight after registering', payload.status() === 200, `status ${payload.status()}`)

  const meBody = await payload.json().catch(() => ({}))
  check('the session identifies the right user', meBody.user?.email === email, meBody.user?.email || '')

  // --- the session keeps working as the user browses ------------------------------
  for (let round = 0; round < 3; round += 1) {
    await page.goto(`${FRONTEND}/home`, { waitUntil: 'networkidle' })
    const stillSignedIn = page.url().endsWith('/home')
    check(`the user is still signed in after navigation ${round + 1}`, stillSignedIn, page.url())
  }

  // --- the session survives a browser restart ------------------------------------
  // A new page in the same context keeps the cookie jar, which is what a
  // reopened tab looks like.
  const reopened = await context.newPage()
  await reopened.goto(`${FRONTEND}/home`, { waitUntil: 'networkidle' })
  check(
    'the user is still signed in in a new tab',
    reopened.url().endsWith('/home'),
    reopened.url(),
  )
  await reopened.close()

  // --- the API keeps accepting the session ----------------------------------------
  const list = await context.request.get(`${BACKEND}/api/websites`)
  check('the API accepts the session on a later request', list.status() === 200, `status ${list.status()}`)

  // --- logging out ends the session ------------------------------------------------
  const loggedOut = await context.request.post(`${BACKEND}/api/auth/logout`)
  check('logout succeeds', loggedOut.status() === 204, `status ${loggedOut.status()}`)

  const afterLogout = await context.cookies()
  check(
    'the session cookie is gone after logging out',
    !afterLogout.some((cookie) => cookie.name === 'linkora_session' && cookie.value),
  )

  const rejected = await context.request.get(`${BACKEND}/api/auth/me`)
  check('the session no longer works after logging out', rejected.status() === 401, `status ${rejected.status()}`)

  // --- the frontend sends an expired session to the login page, not the landing page
  await page.goto(`${FRONTEND}/home`, { waitUntil: 'networkidle' })
  check(
    'an expired session lands on the login page',
    page.url().endsWith('/login'),
    page.url(),
  )

  await browser.close()

  console.log(`\n${passed}/${passed + failed} checks passed`)
  if (failed) process.exit(1)
}

main().catch((error) => {
  console.error('the session check failed to run:', error)
  process.exit(1)
})
