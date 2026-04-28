import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getLearningChars, getVolumes } from '../api/client'
import type { Character, Volume } from '../types'
import CharacterCard from '../components/CharacterCard'

export default function Learn() {
  const { volumeId } = useParams<{ volumeId: string }>()
  const navigate = useNavigate()
  const [volume, setVolume] = useState<Volume | null>(null)
  const [chars, setChars] = useState<Character[]>([])
  const [index, setIndex] = useState(0)
  const [stats, setStats] = useState({ known: 0, unknown: 0 })
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (!volumeId) return
    const vid = Number(volumeId)
    Promise.all([
      getVolumes().then(vs => vs.find(v => v.id === vid) || null),
      getLearningChars(vid),
    ]).then(([v, c]) => {
      setVolume(v)
      setChars(c)
      setLoading(false)
    })
  }, [volumeId])

  if (loading) return <div className="text-center text-gray-400 py-20">加载中...</div>
  if (chars.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📝</div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">该册还没有汉字</h2>
        <button onClick={() => navigate('/manage')} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
          去添加
        </button>
      </div>
    )
  }

  if (finished) {
    const total = stats.known + stats.unknown
    const rate = total > 0 ? Math.round((stats.known / total) * 100) : 0
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">学习完成！</h2>
        <div className="inline-flex gap-8 bg-white rounded-xl shadow-sm px-8 py-6">
          <div>
            <div className="text-3xl font-bold text-gray-800">{total}</div>
            <div className="text-sm text-gray-500">总字数</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">{stats.known}</div>
            <div className="text-sm text-gray-500">认识</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-red-400">{stats.unknown}</div>
            <div className="text-sm text-gray-500">不认识</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-500">{rate}%</div>
            <div className="text-sm text-gray-500">正确率</div>
          </div>
        </div>
        <div className="flex gap-3 justify-center mt-8">
          <button onClick={() => navigate(`/review/${volumeId}`)} className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
            去复习
          </button>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-gray-700">{volume?.name || '学习'}</h2>
        <div className="text-sm text-gray-500">
          {index + 1} / {chars.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div
          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((index + 1) / chars.length) * 100}%` }}
        />
      </div>

      {/* Character card */}
      <div className="flex justify-center py-4">
        <CharacterCard
          key={chars[index].id}
          character={chars[index]}
          onKnown={() => {
            setStats(s => ({ ...s, known: s.known + 1 }))
            if (index + 1 >= chars.length) setFinished(true)
            else setIndex(i => i + 1)
          }}
          onUnknown={() => {
            setStats(s => ({ ...s, unknown: s.unknown + 1 }))
            if (index + 1 >= chars.length) setFinished(true)
            else setIndex(i => i + 1)
          }}
        />
      </div>
    </div>
  )
}
