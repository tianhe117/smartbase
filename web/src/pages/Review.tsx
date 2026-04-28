import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getVolumes, getReviewNext, submitReviewResult, getReviewStats } from '../api/client'
import type { ReviewChar, ReviewStats, Volume } from '../types'

export default function Review() {
  const { volumeId } = useParams<{ volumeId: string }>()
  const navigate = useNavigate()
  const [volume, setVolume] = useState<Volume | null>(null)
  const [queue, setQueue] = useState<ReviewChar[]>([])
  const [index, setIndex] = useState(0)
  const [pinyinVisible, setPinyinVisible] = useState(false)
  const [wordsVisible, setWordsVisible] = useState(false)
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [sessionStats, setSessionStats] = useState({ known: 0, unknown: 0 })
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  const [streak, setStreak] = useState(0)

  const loadQueue = useCallback(async () => {
    if (!volumeId) return
    const vid = Number(volumeId)
    const [v, chars, s] = await Promise.all([
      getVolumes().then(vs => vs.find(x => x.id === vid) || null),
      getReviewNext(vid, 20),
      getReviewStats(vid),
    ])
    setVolume(v)
    setQueue(chars)
    setStats(s)
    setLoading(false)
  }, [volumeId])

  useEffect(() => { loadQueue() }, [loadQueue])

  const handleResult = async (known: boolean) => {
    const current = queue[index]
    await submitReviewResult(current.id, known)

    if (known) {
      setStreak(s => s + 1)
      setSessionStats(s => ({ ...s, known: s.known + 1 }))
    } else {
      setStreak(0)
      setSessionStats(s => ({ ...s, unknown: s.unknown + 1 }))
    }

    setPinyinVisible(false)
    setWordsVisible(false)

    if (index + 1 >= queue.length) {
      setFinished(true)
    } else {
      setIndex(i => i + 1)
    }
  }

  if (loading) return <div className="text-center text-gray-400 py-20">加载中...</div>

  if (queue.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">✨</div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">暂无复习内容</h2>
        <p className="text-gray-500 mb-6">先去学习一些汉字吧</p>
        <button onClick={() => navigate(`/learn/${volumeId}`)} className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
          去学习
        </button>
      </div>
    )
  }

  if (finished) {
    const total = sessionStats.known + sessionStats.unknown
    const rate = total > 0 ? Math.round((sessionStats.known / total) * 100) : 0
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">复习完成！</h2>
        <div className="inline-flex gap-8 bg-white rounded-xl shadow-sm px-8 py-6">
          <div>
            <div className="text-3xl font-bold text-gray-800">{total}</div>
            <div className="text-sm text-gray-500">复习字数</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">{sessionStats.known}</div>
            <div className="text-sm text-gray-500">认识</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-red-400">{sessionStats.unknown}</div>
            <div className="text-sm text-gray-500">不认识</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-500">{rate}%</div>
            <div className="text-sm text-gray-500">正确率</div>
          </div>
        </div>

        {stats && (
          <div className="mt-6 bg-white rounded-xl shadow-sm px-6 py-4 inline-block">
            <h3 className="text-sm font-medium text-gray-600 mb-3">整体进度</h3>
            <div className="flex gap-6 text-sm">
              <span className="text-green-600">已掌握: {stats.mastered}</span>
              <span className="text-amber-600">学习中: {stats.learning}</span>
              <span className="text-red-400">不熟悉: {stats.unfamiliar}</span>
              <span className="text-gray-400">未学习: {stats.new_chars}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center mt-8">
          <button onClick={() => { setIndex(0); setFinished(false); setSessionStats({ known: 0, unknown: 0 }); setStreak(0); loadQueue() }} className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
            再来一轮
          </button>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const current = queue[index]
  const words = [current.word_1, current.word_2, current.word_3].filter(Boolean)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-700">{volume?.name || '复习'}</h2>
        <div className="flex items-center gap-4">
          {streak >= 3 && (
            <span className="text-sm text-orange-500 font-medium">🔥 连续 {streak} 个</span>
          )}
          <span className="text-sm text-gray-500">{index + 1} / {queue.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div
          className="bg-amber-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((index + 1) / queue.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex flex-col items-center gap-4">
        {/* Pinyin */}
        <div className="h-8 flex items-center">
          {pinyinVisible ? (
            <span className="text-xl text-orange-500 font-medium">{current.pinyin}</span>
          ) : (
            <span className="text-xl text-transparent select-none">占位</span>
          )}
        </div>

        {/* Character */}
        <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center bg-white rounded-2xl shadow-lg border-2 border-amber-100">
          <span className="text-8xl sm:text-9xl font-bold text-gray-800 select-none">{current.char}</span>
        </div>

        {/* Info buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setPinyinVisible(!pinyinVisible)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              pinyinVisible ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
          >
            {pinyinVisible ? '隐藏拼音' : '查看拼音'}
          </button>
          <button
            onClick={() => setWordsVisible(!wordsVisible)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              wordsVisible ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            {wordsVisible ? '隐藏组词' : '查看组词'}
          </button>
        </div>

        {/* Words */}
        {wordsVisible && words.length > 0 && (
          <div className="flex gap-2 flex-wrap justify-center">
            {words.map((w, i) => (
              <span key={i} className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-800">
                {w}
              </span>
            ))}
          </div>
        )}

        {/* Result buttons */}
        <div className="flex gap-4 mt-2">
          <button
            onClick={() => handleResult(true)}
            className="w-28 py-3 bg-green-500 text-white text-lg font-bold rounded-xl hover:bg-green-600 active:scale-95 transition-all shadow-md"
          >
            认识 ✓
          </button>
          <button
            onClick={() => handleResult(false)}
            className="w-28 py-3 bg-red-400 text-white text-lg font-bold rounded-xl hover:bg-red-500 active:scale-95 transition-all shadow-md"
          >
            不认识
          </button>
        </div>
      </div>
    </div>
  )
}
