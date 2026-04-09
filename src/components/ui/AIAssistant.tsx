'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Check } from 'lucide-react'

interface ActionData {
  type: string; tenantId?: string; tenantName?: string;
  houseName?: string; roomCode?: string; field?: string;
  oldValue?: string | number; newValue?: string | number;
}
interface Message {
  role: 'user' | 'assistant'
  content: string
  action?: ActionData
  confirmed?: boolean
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '안녕하세요! 자연어로 데이터를 수정할 수 있어요.\n예: "워너비 302호 김민준 월세 50만으로 변경해줘"' }
  ])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const QUICK = ['월세 변경', '입주자 등록', '이슈 완료 처리', '공실 처리']

  async function send(text?: string) {
    const userMsg = text || input.trim()
    if (!userMsg) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()

      if (!data.understood) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.description || '요청을 이해하지 못했어요.' }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.description, action: data.action }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '오류가 발생했어요. 다시 시도해주세요.' }])
    }
    setLoading(false)
  }

  async function confirm(msg: Message) {
    if (!msg.action?.tenantId || !msg.action?.field) return
    try {
      const body: Record<string, unknown> = {}
      body[msg.action.field] = msg.action.newValue
      const res = await fetch(`/api/tenants/${msg.action.tenantId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setMessages(prev => prev.map(m => m === msg ? { ...m, confirmed: true } : m))
        setMessages(prev => [...prev, { role: 'assistant', content: '✅ 수정 완료! Google Sheets에도 반영됐어요.' }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '수정 중 오류가 발생했어요.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '수정 중 오류가 발생했어요.' }])
    }
  }

  function cancel(msg: Message) {
    setMessages(prev => prev.map(m => m === msg ? { ...m, confirmed: false } : m))
    setMessages(prev => [...prev, { role: 'assistant', content: '취소했어요. 다른 수정 사항이 있으면 말씀해주세요.' }])
  }

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-[#3182F6] flex items-center justify-center"
          style={{ boxShadow: '0 4px 20px rgba(49,130,246,0.45)' }}>
          <MessageCircle size={24} color="white" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-[430px] bg-[var(--bg)] rounded-t-2xl" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-[var(--border)]" /></div>
            <div className="flex justify-between items-center px-5 py-3">
              <div>
                <p className="text-[16px] font-bold">AI 데이터 수정</p>
                <p className="text-[12px] text-[var(--sub)] mt-0.5">자연어로 말씀해주세요</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-[var(--card)] flex items-center justify-center">
                <X size={16} color="var(--sub)" />
              </button>
            </div>

            <div className="flex gap-2 px-5 pb-3 overflow-x-auto no-scrollbar">
              {QUICK.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="shrink-0 text-[11px] px-3 py-1.5 rounded-full bg-[var(--card)] text-[var(--sub)] border border-[var(--border)]">{q}</button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-3" style={{ minHeight: 0 }}>
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="bg-[#3182F6] rounded-[14px_4px_14px_14px] px-4 py-2.5 max-w-[75%]">
                        <p className="text-[14px] text-white leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-start">
                      <div className="w-7 h-7 rounded-full bg-[#3182F6] flex-shrink-0 flex items-center justify-center mt-0.5">
                        <MessageCircle size={13} color="white" />
                      </div>
                      <div className="max-w-[80%]">
                        <div className="bg-[var(--card)] rounded-[4px_14px_14px_14px] px-4 py-2.5 mb-2">
                          <p className="text-[14px] leading-relaxed whitespace-pre-line">{msg.content}</p>
                        </div>
                        {msg.action && msg.confirmed === undefined && (
                          <div className="flex gap-2">
                            <button onClick={() => confirm(msg)} className="flex-1 py-2 rounded-xl bg-[#3182F6] text-white text-[13px] font-bold">확인</button>
                            <button onClick={() => cancel(msg)} className="flex-1 py-2 rounded-xl bg-[var(--card)] text-[var(--sub)] text-[13px] border border-[var(--border)]">취소</button>
                          </div>
                        )}
                        {msg.confirmed === true && <p className="text-[12px] text-[#27500A] ml-1">✓ 적용됨</p>}
                        {msg.confirmed === false && <p className="text-[12px] text-[var(--sub)] ml-1">취소됨</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 items-center">
                  <div className="w-7 h-7 rounded-full bg-[#3182F6] flex-shrink-0 flex items-center justify-center">
                    <MessageCircle size={13} color="white" />
                  </div>
                  <div className="bg-[var(--card)] rounded-[4px_14px_14px_14px] px-4 py-2.5">
                    <div className="flex gap-1 items-center h-5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--sub)] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--sub)] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--sub)] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="px-5 py-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-2 bg-[var(--card)] rounded-2xl px-4 py-2.5 border border-[var(--border)]">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="예: 워너비 302호 월세 50만으로 변경해줘"
                  className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-[var(--sub)]" />
                <button onClick={() => send()} disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-full bg-[#3182F6] flex items-center justify-center disabled:opacity-40">
                  <Send size={14} color="white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
