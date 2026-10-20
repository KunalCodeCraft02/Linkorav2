import { useEffect, useState } from 'react'
import WebsiteRenderer from '../components/WebsiteRenderer'
import { apiRequest } from '../lib/api'

/**
 * Public page for a published website. It is reachable without a Linkora
 * account and renders only the last published snapshot.
 */
export default function PublicWebsitePage({ slug }) {
  const [website, setWebsite] = useState(null)

  useEffect(() => {
    apiRequest(`/websites/public/${slug}`)
      .then((result) => setWebsite(result.website))
      .catch(() => setWebsite(false))
  }, [slug])

  if (!website) {
    return (
      <main className="editor-loading">
        {website === false ? 'This website is not published.' : 'Loading website...'}
      </main>
    )
  }

  return (
    <main className="public-site">
      <WebsiteRenderer website={website} />
      <a className="public-brand" href="/">
        Made with Linkora
      </a>
    </main>
  )
}
