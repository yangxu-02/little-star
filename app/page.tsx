'use client'

import React from "react"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Send, Sparkles, Copy, Check, LogIn, LogOut, UserPlus, CreditCard, X } from 'lucide-react'
import { StarAvatar } from '@/components/star-avatar'
import { MoodTags } from '@/components/mood-tags'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const STORAGE_KEY = 'warmstar_users'

function getStoredUsers(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setStoredUsers(users: Record<string, string>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好呀！我是小暖星 ✨ 今天的心情是什么天气呢？',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatCount, setChatCount] = useState(1)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (content?: string) => {
    const messageContent = content || input.trim()
    if (!messageContent || isLoading) return

    if (!isLoggedIn) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '请先登录后再开始聊天哦 🌟',
          timestamp: new Date(),
        },
      ])
      setShowLoginModal(true)
      return
    }

    const userMessage: Message = {
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setChatCount((prev) => prev + 1)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '', timestamp: new Date() },
      ])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          assistantMessage += chunk
          
          setMessages((prev) => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1].content = assistantMessage
            return newMessages
          })
        }
      }
    } catch (error) {
      console.error('[v0] Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '抱歉，我好像遇到了一点小问题... 我们可以稍后再聊吗？🌟',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleMoodClick = (mood: string) => {
    let moodMessage = ''
    switch (mood) {
      case 'relaxed':
        moodMessage = '今天想轻松聊聊天 ✨'
        break
      case 'share':
        moodMessage = '我有些想法想要分享 🌈'
        break
      case 'listen':
        moodMessage = '今天只想静静听你说说话 ☁️'
        break
    }
    setInput(moodMessage)
    textareaRef.current?.focus()
  }

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      console.error('[v0] Copy failed:', error)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const users = getStoredUsers()
    if (users[username.trim()] === password) {
      setIsLoggedIn(true)
      setShowLoginModal(false)
      setUsername('')
      setPassword('')
      setLoginError('')
      setRegisterError('')
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '欢迎回来！很高兴见到你 ✨',
          timestamp: new Date(),
        },
      ])
    } else {
      setLoginError('用户名或密码错误')
    }
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    const users = getStoredUsers()
    const name = username.trim()
    if (users[name]) {
      setRegisterError('该用户名已被注册')
      return
    }
    if (!username.trim()) {
      setRegisterError('请输入用户名')
      return
    }
    if (!password || password.length < 6) {
      setRegisterError('密码至少 6 位')
      return
    }
    if (password !== confirmPassword) {
      setRegisterError('两次输入的密码不一致')
      return
    }
    setStoredUsers({ ...users, [name]: password })
    setIsRegisterMode(false)
    setRegisterError('')
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setLoginError('')
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '注册成功！请登录开始聊天 ✨',
        timestamp: new Date(),
      },
    ])
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setMessages([
      {
        role: 'assistant',
        content: '你好呀！我是小暖星 ✨ 今天的心情是什么天气呢？',
        timestamp: new Date(),
      },
    ])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2a2055] via-[#3a2f5e] to-[#2f2548] relative overflow-hidden">
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto h-screen flex flex-col p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <StarAvatar isAnimating={isLoading} />
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-white flex items-center gap-2">
                小暖星
                <Sparkles className="w-5 h-5 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground">在线陪伴中</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowSubscribeModal(true)}
              variant="outline"
              className="gap-2 bg-transparent"
            >
              <CreditCard className="w-4 h-4" />
              订阅
            </Button>
            {isLoggedIn ? (
              <Button
                onClick={handleLogout}
                variant="outline"
                className="gap-2 bg-transparent"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </Button>
            ) : (
              <Button
                onClick={() => setShowLoginModal(true)}
                variant="outline"
                className="gap-2 bg-transparent"
              >
                <LogIn className="w-4 h-4" />
                登录
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <Card className="flex-1 bg-card/40 backdrop-blur-md border-border overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <StarAvatar size="sm" />
                  </div>
                )}
                <div className="group relative max-w-[80%]">
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(message.content, index)}
                    className={`absolute ${
                      message.role === 'user' ? '-left-8' : '-right-8'
                    } top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted`}
                    title="复制"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground">
                    你
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0">
                  <StarAvatar size="sm" isAnimating />
                </div>
                <div className="bg-secondary rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <span
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                    <span
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border bg-card/60 backdrop-blur-sm p-4">
            <MoodTags onMoodClick={handleMoodClick} />
            <div className="flex gap-2 mt-3">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="和小暖星说说话..."
                className="min-h-[60px] max-h-[120px] resize-none bg-input border-border text-foreground placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-[60px] w-[60px] bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Login / Register Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-card border-border p-6">
            <div className="flex items-center justify-center mb-6">
              <StarAvatar size="lg" />
            </div>
            <h2 className="text-2xl font-semibold text-center text-foreground mb-2">
              {isRegisterMode ? '注册小暖星' : '登录到小暖星'}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {isRegisterMode
                ? '注册后即可登录并开始与小暖星对话'
                : '登录后即可开始与小暖星对话'}
            </p>
            <form
              onSubmit={isRegisterMode ? handleRegister : handleLogin}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  用户名
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="请输入用户名"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={isRegisterMode ? '请输入密码（至少 6 位）' : '请输入密码'}
                  required
                />
              </div>
              {isRegisterMode && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    确认密码
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="请再次输入密码"
                    required
                  />
                </div>
              )}
              {(loginError || registerError) && (
                <p className="text-sm text-destructive text-center">
                  {isRegisterMode ? registerError : loginError}
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false)
                    setLoginError('')
                    setRegisterError('')
                    setIsRegisterMode(false)
                    setUsername('')
                    setPassword('')
                    setConfirmPassword('')
                  }}
                  variant="outline"
                  className="flex-1 bg-transparent"
                >
                  取消
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  {isRegisterMode ? (
                    <>
                      <UserPlus className="w-4 h-4 mr-1" />
                      注册
                    </>
                  ) : (
                    '登录'
                  )}
                </Button>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {isRegisterMode ? (
                  <>
                    已有账号？{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(false)
                        setRegisterError('')
                        setConfirmPassword('')
                      }}
                      className="text-primary hover:underline"
                    >
                      去登录
                    </button>
                  </>
                ) : (
                  <>
                    没有账号？{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(true)
                        setLoginError('')
                        setConfirmPassword('')
                      }}
                      className="text-primary hover:underline"
                    >
                      去注册
                    </button>
                  </>
                )}
              </p>
            </form>
          </Card>
        </div>
      )}

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-card border-border p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground">订阅套餐</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSubscribeModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              选择适合你的套餐，解锁更多小暖星陪伴时光 ✨
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* 套餐一 */}
              <div className="rounded-xl border border-border bg-card/60 p-4 flex flex-col">
                <h3 className="font-medium text-foreground mb-1">基础版</h3>
                <p className="text-2xl font-semibold text-primary mb-2">￥48</p>
                <p className="text-xs text-muted-foreground mb-4 flex-1">月付 · 基础陪伴</p>
                <Button variant="outline" className="w-full" disabled>
                  敬请期待
                </Button>
              </div>
              {/* 套餐二 ￥98 - 跳转支付 */}
              <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 flex flex-col relative">
                <span className="absolute -top-2 left-4 px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                  推荐
                </span>
                <h3 className="font-medium text-foreground mb-1">畅享版</h3>
                <p className="text-2xl font-semibold text-primary mb-2">￥98</p>
                <p className="text-xs text-muted-foreground mb-4 flex-1">月付 · 畅享陪伴</p>
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => {
                    window.location.href =
                      ' https://www.creem.io/test/checkout/prod_iFAFbMbukp4AvJI81uIII/ch_6laO61zUeaPgGM4V59iIe7'
                  }}
                >
                  立即支付
                </Button>
              </div>
              {/* 套餐三 */}
              <div className="rounded-xl border border-border bg-card/60 p-4 flex flex-col">
                <h3 className="font-medium text-foreground mb-1">尊享版</h3>
                <p className="text-2xl font-semibold text-primary mb-2">￥168</p>
                <p className="text-xs text-muted-foreground mb-4 flex-1">月付 · 尊享陪伴</p>
                <Button variant="outline" className="w-full" disabled>
                  敬请期待
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <style jsx>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
