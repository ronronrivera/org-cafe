import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import OrgPageView from '../components/OrgPageView'
import { getOrgPageBySlug } from '../lib/orgPage'
import { seedConfigFromOrg } from '../lib/pageBuilder'

const OrgPage = () => {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const { data, error } = await getOrgPageBySlug(slug)
      if (!active) return
      setData(data)
      setError(error)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading page…
      </div>
    )
  }
  if (error || !data) {
    return <div className="py-24 text-center text-red-600">{error || 'Organization not found.'}</div>
  }

  const config = data.config ?? seedConfigFromOrg(data.org)
  return <OrgPageView config={config} />
}

export default OrgPage
