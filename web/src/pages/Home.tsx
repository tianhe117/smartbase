import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getVolumes } from '../api/client'
import type { Volume } from '../types'
import VolumeCard from '../components/VolumeCard'

export default function Home() {
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getVolumes().then(setVolumes).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-center text-gray-400 py-20">加载中...</div>
  }

  if (volumes.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">还没有课本</h2>
        <p className="text-gray-500 mb-6">去管理页面添加第一册课本吧</p>
        <button
          onClick={() => navigate('/manage')}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          去管理
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">选择课本</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {volumes.map(v => (
          <VolumeCard
            key={v.id}
            volume={v}
            onStudy={id => navigate(`/learn/${id}`)}
            onReview={id => navigate(`/review/${id}`)}
            onManage={() => navigate('/manage')}
          />
        ))}
      </div>
    </div>
  )
}
