import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  getVolumes, getReviewNext, submitReviewResult, getReviewStats,
  getAllCharacters, getReviewStatsAll,
} from '../api/client'
import type { ReviewStats, Character } from '../types'

interface QueueItem {
  id: number
  char: string
  pinyin: string
  word_1: string
  word_2: string | null
  word_3: string | null
}

export default function Review() {
  const { volumeId } = useParams<{ volumeId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('复习')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [index, setIndex] = useState(0)
  const [pinyinVisible, setPinyinVisible] = useState(false)
  const [wordsVisible, setWordsVisible] = useState(false)
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [sessionStats, setSessionStats] = useState({ known: 0, unknown: 0 })
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  const [streak, setStreak] = useState(0)

  const mode = searchParams.get('mode') || 'smart'

  const loadQueue = useCallback(async () => {
    const lessonsParam = searchParams.get('lessons')
    const volumesParam = searchParams.get('volumes')

    let items: QueueItem[] = []
    let statsData: ReviewStats | null = null
    let name = '复习'

    if (volumeId === 'all') {
      const vids = volumesParam ? volumesParam.split(',').map(Number) : undefined
      name = '总复习'
      if (mode === 'smart') {
        const allChars: QueueItem[] = []
        if (vids) {
          for (const vid of vids) {
            const chars = await getReviewNext(vid, 20)
            allChars.push(...chars)
          }
        }
        items = allChars.sort(() => Math.random() - 0.5).slice(0, 30)
        statsData = await getReviewStatsAll()
      } else {
        const chars = await getAllCharacters(vids?.[0])
        items = chars.map(c => ({ ...c }))
        if (vids && vids.length > 1) {
          const all: Character[] = []
          for (const vid of vids) {
            all.push(...await getAllCharacters(vid))
          }
          items = all.map(c => ({ ...c }))
        }
        statsData = await getReviewStatsAll()
      }
    } else {
      const vid = Number(volumeId)
      const lessonIds = lessonsParam && lessonsParam !== 'all'
        ? lessonsParam.split(',').map(Number)
        : undefined
      const v = await getVolumes().then(vs => vs.find(x => x.id === vid) || null)
      name = v?.name || '复习'

      if (mode === 'smart') {
        items = await getReviewNext(vid, 20, lessonIds)
      } else {
        const chars = await getAllCharacters(vid)
        items = chars.map(c => ({ ...c }))
      }
      statsData = await getReviewStats(vid)
    }

    setTitle(name)
    setQueue(items)
    setStats(statsData)
    setLoading(false)
  }, [volumeId, searchParams, mode])

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
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
          返回首页
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
    <div className="flex flex-col" style={{ height: 'calc(100vh - 72px)' }}>
      <div className="flex items-center justify-between shrink-0">
        <h2 className="font-bold text-gray-700">{title}</h2>
        <div className="flex items-center gap-3">
          {streak >= 3 && (
            <span className="text-sm text-orange-500 font-medium">🔥 {streak}</span>
          )}
          <span className="text-sm text-gray-500">{index + 1} / {queue.length}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <div className="flex flex-col h-full transition-all duration-300">
          {/* Top: content area */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 gap-1">
            {/* Pinyin */}
            {pinyinVisible ? (
              <span className="font-pinyin text-[10vw] sm:text-[5vh] text-orange-500 font-medium leading-none animate-fade-in">
                {current.pinyin}
              </span>
            ) : (
              <button
                onClick={() => setPinyinVisible(true)}
                className="px-6 py-1.5 text-base font-medium text-orange-600 bg-orange-50 border-2 border-orange-200 border-dashed rounded-xl hover:bg-orange-100 hover:border-orange-300 transition-colors"
              >
                拼音
              </button>
            )}

            {/* Character */}
            <div className="flex-1 flex items-center justify-center w-full min-h-0">
              <span className="font-song text-[min(40vw,35vh)] font-bold text-gray-800 select-none leading-none">
                {current.char}
              </span>
            </div>

            {/* Words */}
            {wordsVisible && words.length > 0 ? (
              <div className="flex gap-2 flex-wrap justify-center animate-fade-in">
                {words.map((w, i) => (
                  <span key={i} className="font-pinyin px-4 py-1 bg-amber-50 border border-amber-200 rounded-full text-lg sm:text-2xl text-amber-800">
                    {w}
                  </span>
                ))}
              </div>
            ) : (
              <button
                onClick={() => setWordsVisible(true)}
                className="px-6 py-1.5 text-base font-medium text-amber-600 bg-amber-50 border-2 border-amber-200 border-dashed rounded-xl hover:bg-amber-100 hover:border-amber-300 transition-colors"
              >
                组词
              </button>
            )}
          </div>

          {/* Bottom: action buttons */}
          <div className="flex gap-3 justify-center items-center pt-2 pb-1">
            <button
              onClick={() => handleResult(true)}
              className="px-5 py-2 bg-green-500 text-white text-lg font-bold rounded-xl hover:bg-green-600 active:scale-95 transition-all shadow-md whitespace-nowrap"
            >
              认识 ✓
            </button>
            <button
              onClick={() => handleResult(false)}
              className="px-5 py-2 bg-red-400 text-white text-lg font-bold rounded-xl hover:bg-red-500 active:scale-95 transition-all shadow-md whitespace-nowrap"
            >
              不认识
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
