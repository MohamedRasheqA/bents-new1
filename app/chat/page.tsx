"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { ArrowRight, PlusCircle, ArrowDown, X } from "lucide-react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { v4 as uuidv4 } from "uuid"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import ReactMarkdown from "react-markdown"

import axios from "axios"
import Header from "@/components/Header"
import { useUser } from "@clerk/nextjs"
import { useSession } from "@/lib/hooks/useSession"
import { format } from "date-fns"
import { useAmplitude } from "@/lib/hooks/useAmplitude"

// Types
interface Conversation {
  id: string
  question: string
  text: string
  initial_answer?: string
  videoLinks?: VideoLinks
  related_products?: Product[]
  timestamp: string
}

interface Session {
  id: string
  conversations: Conversation[]
}

interface VideoInfo {
  urls: string[]
  video_title?: string
  description?: string
  timestamp?: string
}

interface VideoLinks {
  [key: string]: {
    urls: string[]
    timestamp: string
    video_title: string
    description: string
  }
}

interface Product {
  id: string
  title: string
  link: string
  tags: string[]
  description?: string
  price?: string
  category?: string
  image_data?: string
}

interface FAQQuestion {
  id: string
  question_text: string
  category?: string
}

// Add new interface for active query
interface ActiveQuery {
  question: string
  messageId?: string
  timestamp?: string
}

// Constants
const LOCAL_STORAGE_KEYS = {
  SESSIONS: "chat_sessions",
  CURRENT_SESSION_ID: "current_session_id",
  CURRENT_CONVERSATION: "current_conversation",
}

// Font family constant
const systemFontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

// Helper functions
const getYoutubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

const getStartTime = (timestamp: string): number => {
  const [minutes, seconds] = timestamp.split(":").map(Number)
  return minutes * 60 + seconds
}

// Add these utility functions at the top with other utility functions
const getYoutubeVideoIds = (urls: string[]) => {
  if (!urls || !Array.isArray(urls) || urls.length === 0) return []
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  return urls
    .map((url) => {
      if (!url || typeof url !== "string") return null
      const match = url.match(regExp)
      return match && match[2].length === 11 ? match[2] : null
    })
    .filter((id): id is string => id !== null)
}

// Helper function to load saved data
const loadSavedData = async () => {
  try {
    const response = await axios.get("/api/session")
    const savedSessions = response.data

    if (Array.isArray(savedSessions) && savedSessions.length > 0) {
      return {
        sessions: savedSessions,
        currentId: savedSessions[0].id,
        conversations: savedSessions[0].conversations || [],
      }
    }
  } catch (error) {
    console.error("Error loading saved data:", error)
  }

  const defaultSession = { id: uuidv4(), conversations: [] }
  return {
    sessions: [defaultSession],
    currentId: defaultSession.id,
    conversations: [],
  }
}

// Add function to save sessions to database
const saveSessionsToDatabase = async (sessions: Session[]) => {
  try {
    await axios.post("/api/session", {
      sessionData: sessions,
    })
  } catch (error) {
    console.error("Error saving sessions to database:", error)
  }
}

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <a
      href={product.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-none bg-white rounded-lg border min-w-[180px] px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      <p className="text-sm font-medium text-gray-900">{product.title}</p>
    </a>
  )
}

// Updated FixedMarkdownRenderer component
const FixedMarkdownRenderer = ({ content }: { content: string }) => (
  <ReactMarkdown
    className="markdown-content"
    components={{
      root: ({ children, ...props }) => (
        <div className="w-full text-gray-800" {...props}>
          {children}
        </div>
      ),
      p: ({ children, ...props }) => (
        <p className="text-base leading-relaxed mb-3" style={{ fontFamily: systemFontFamily }} {...props}>
          {children}
        </p>
      ),
      pre: ({ children, ...props }) => (
        <pre className="w-full p-4 rounded bg-gray-50 my-4 overflow-x-auto" {...props}>
          {children}
        </pre>
      ),
      code: ({ children, inline, ...props }) =>
        inline ? (
          <code className="px-1.5 py-0.5 rounded bg-gray-100 text-sm font-mono" {...props}>
            {children}
          </code>
        ) : (
          <code className="block w-full font-mono text-sm" {...props}>
            {children}
          </code>
        ),
      ul: ({ children, ...props }) => (
        <ul className="list-disc pl-8 mb-3 space-y-1" {...props}>
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol className="list-decimal pl-8 mb-3 space-y-1" {...props}>
          {children}
        </ol>
      ),
      li: ({ children, ...props }) => (
        <li className="mb-2 pl-2" {...props}>
          {children}
        </li>
      ),
      h1: ({ children, ...props }) => (
        <h1 className="text-xl font-medium mb-1" {...props}>
          {children}
        </h1>
      ),
      h2: ({ children, ...props }) => (
        <h2 className="text-lg font-medium mb-1" {...props}>
          {children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3 className="text-base font-medium mb-1" {...props}>
          {children}
        </h3>
      ),
      blockquote: ({ children, ...props }) => (
        <blockquote className="border-l-4 border-gray-200 pl-4 my-2 italic" {...props}>
          {children}
        </blockquote>
      ),
      a: ({ children, href, ...props }) => (
        <a
          href={href}
          className="text-blue-600 hover:text-blue-800 underline"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      ),
    }}
  >
    {content}
  </ReactMarkdown>
)

// Update ConversationItem component
const ConversationItem = ({
  conv,
  index,
  isLatest,
}: {
  conv: Conversation
  index: number
  isLatest: boolean
}) => {
  const conversationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLatest) {
      conversationRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [isLatest])

  // Add renderSourceVideos function inside ConversationItem
  const renderSourceVideos = (videoLinks: VideoLinks | undefined) => {
    if (!videoLinks || Object.keys(videoLinks).length === 0) return null

    const allVideos = Object.values(videoLinks).filter((video) => video && video.urls?.[0])

    if (allVideos.length === 0) return null

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-3">Related Videos</h3>
        <div className="relative">
          <div
            className="overflow-x-scroll"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#888 #f1f1f1",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div className="flex gap-4 pb-4">
              {allVideos.map((video, index) => {
                const videoId = getYoutubeVideoIds([video.urls[0]])[0]
                if (!videoId) return null

                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                const fullVideoUrl = video.urls[0].split("&t=")[0]

                return (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[250px] bg-white rounded-[8px] border shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                  >
                    <a
                      href={`${video.urls[0]}${video.timestamp ? `&t=${getStartTime(video.timestamp)}s` : ""}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block flex-grow"
                    >
                      <div className="relative">
                        <img
                          src={thumbnailUrl || "/placeholder.svg"}
                          alt={video.video_title || "Video thumbnail"}
                          className="w-full h-[140px] object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-black/75 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 flex-grow">
                        <h4 className="font-medium text-sm line-clamp-2 mb-2">{video.video_title || "Video Title"}</h4>
                        {video.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {video.description.replace(/"/g, "")}
                          </p>
                        )}
                        {video.timestamp && (
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>Click here to</span>
                            <a
                              href={`${video.urls[0]}${video.timestamp ? `&t=${getStartTime(video.timestamp)}s` : ""}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700 hover:underline mx-1"
                            >
                              Start
                            </a>
                            <span> at {video.timestamp}</span>
                          </div>
                        )}
                      </div>
                    </a>
                    <div className="border-t bg-gray-50">
                      <a
                        href={fullVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 flex items-center justify-center hover:bg-gray-100 transition-colors group"
                      >
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                          Watch Full Video
                        </span>
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={conversationRef} className="w-full bg-white rounded-lg shadow-sm p-6 mb-4 mt-0 sm:mb-6">
      {/* Question Section */}
      <div className="mb-3 pb-3 border-b">
        <div className="flex items-center gap-2">
          <p className="text-gray-800 break-words font-bold" style={{ fontFamily: systemFontFamily }}>
            {conv.question}
          </p>
        </div>
      </div>

      {/* Answer Section */}
      <div className="prose prose-sm max-w-none mb-3">
        <FixedMarkdownRenderer content={conv.text} />
      </div>

      {/* Videos Section - Now using renderSourceVideos */}
      {renderSourceVideos(conv.videoLinks)}

      {/* Products Section */}
      {conv.related_products && conv.related_products.length > 0 && (
        <div className="mt-4">
          <h3 className="text-base font-semibold mb-3" style={{ fontFamily: systemFontFamily }}>
            Related Products
          </h3>
          <div className="relative">
            <div
              className="overflow-x-scroll"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#888 #f1f1f1",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <div className="flex gap-4 pb-4">
                {conv.related_products.map((product, idx) => (
                  <ProductCard key={idx} product={product} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Add ProcessingCard component near other component definitions
const ProcessingCard = ({
  query,
  loadingProgress,
  setLoadingProgress,
}: {
  query: string
  loadingProgress: number
  setLoadingProgress: React.Dispatch<React.SetStateAction<number>>
}) => {
  const loadingCardRef = useRef<HTMLDivElement>(null)
  const currentStep = Math.min(Math.floor(loadingProgress / 25), 3)

  useEffect(() => {
    if (loadingCardRef.current) {
      setTimeout(() => {
        loadingCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }, 100)
    }
  }, [])

  useEffect(() => {
    if (loadingProgress < 100) {
      const timer = setTimeout(() => {
        setLoadingProgress((prev) => Math.min(prev + 1, 100))
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [loadingProgress, setLoadingProgress])

  return (
    <div ref={loadingCardRef} className="w-full bg-white rounded-lg p-6 mb-4 mt-0">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Processing Your Query</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-[rgba(23,155,215,255)] border-t-transparent"></div>
        </div>

        <div className="space-y-3">
          {processingSteps.map((step, index) => {
            const isComplete = index < currentStep
            const isCurrent = index === currentStep

            return (
              <div key={step} className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    isComplete || isCurrent ? "bg-[rgba(23,155,215,255)]" : "bg-gray-200",
                  )}
                >
                  {isComplete ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isCurrent ? (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  )}
                </div>
                <span className={cn("text-base", isComplete || isCurrent ? "text-black font-medium" : "text-gray-400")}>
                  {step}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Add this near the top where other components are defined
const ConversationHistoryButton = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewConversation,
}: {
  sessions: Session[]
  currentSessionId: string
  onSessionSelect: (id: string) => void
  onNewConversation: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
        <span>History</span>
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/20" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border overflow-hidden z-50">
            <div className="p-2">
              <Button
                onClick={() => {
                  onNewConversation()
                  setIsOpen(false)
                }}
                className="w-full justify-start text-left mb-2"
                variant="ghost"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                New Conversation
              </Button>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {sessions.map((session) => (
                  <Button
                    key={session.id}
                    onClick={() => {
                      onSessionSelect(session.id)
                      setIsOpen(false)
                    }}
                    variant={session.id === currentSessionId ? "secondary" : "ghost"}
                    className="w-full justify-start text-left"
                  >
                    {session.conversations?.[0]?.question || "New Conversation"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Add this near the ConversationHistoryButton component
const ChatSidebar = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewConversation,
}: {
  isOpen: boolean
  onClose: () => void
  sessions: Session[]
  currentSessionId: string | null
  onSessionSelect: (sessionId: string) => void
  onNewConversation: () => void
}) => {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed top-0 left-0 h-full w-80 bg-white transform transition-transform duration-300 ease-in-out overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Chat History</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    onNewConversation()
                    onClose()
                  }}
                  className="w-full px-4 py-2 text-white bg-[rgba(23,155,215,255)] rounded-md hover:bg-[rgba(20,139,193,255)]"
                >
                  New Chat
                </button>

                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => {
                      onSessionSelect(session.id)
                      onClose()
                    }}
                    className={cn(
                      "p-4 rounded-lg cursor-pointer transition-all",
                      "hover:bg-gray-100",
                      session.id === currentSessionId ? "bg-gray-100" : "bg-white",
                      "border border-gray-200",
                    )}
                  >
                    <p className="font-medium text-gray-900 line-clamp-2">
                      {session.conversations[0]?.question || "New conversation"}
                    </p>
                    {session.conversations[0]?.timestamp && (
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(session.conversations[0].timestamp), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Main Chat Page Component
export default function ChatPage() {
  const { user } = useUser()
  const userId = user?.id
  const username = user?.username || user?.firstName || "User"

  // Add this console log to see the username
  console.log("Current user:", { userId, username, user })

  const { trackEvent } = useAmplitude()
  const {
    sessions,
    setSessions,
    currentSessionId,
    setCurrentSessionId,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useSession()

  // Initialize with empty values
  const [currentConversation, setCurrentConversation] = useState<Conversation[]>([])

  // Error states
  const [error, setError] = useState<string | null>(null)
  const [wsError, setWsError] = useState<string | null>(null)

  // Add effect to track page view with username
  useEffect(() => {
    if (userId) {
      trackEvent("chat_page_viewed", {
        username: username,
      })
    }
  }, [userId, username, trackEvent])

  // Add effect to handle page load/refresh
  useEffect(() => {
    if (userId) {
      const initializeNewSession = async () => {
        try {
          const newSessionId = uuidv4()
          const newSession: Session = {
            id: newSessionId,
            conversations: [],
          }

          setSessions([newSession])
          setCurrentSessionId(newSessionId)
          setShowInitialQuestions(true)
          currentQuestionRef.current = ""
          setCurrentConversation([])

          trackEvent("new_chat_session_created", {
            session_id: newSessionId,
          })

          if (userId) {
            await axios.post(
              "/api/set-session",
              {
                sessions: [newSession],
              },
              {
                headers: {
                  "x-user-id": userId,
                },
              },
            )
          }
        } catch (error) {
          console.error("Error initializing new session:", error)
          trackEvent("chat_session_error", {
            error_type: "initialization_failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }

      initializeNewSession()
    }
  }, [userId, setSessions, setCurrentSessionId, trackEvent])

  const manageSession = useCallback(async () => {
    try {
      // Clear existing state
      setCurrentConversation([])
      setShowInitialQuestions(true)
      setProcessingQuery("")
      setSearchQuery("")

      const newSessionId = uuidv4()
      const newSession: Session = {
        id: newSessionId,
        conversations: [],
      }

      if (userId) {
        const response = await axios.post(
          "/api/set-session",
          {
            sessions: [newSession],
          },
          {
            headers: {
              "x-user-id": userId,
            },
          },
        )

        if (response.data.success) {
          setSessions((prevSessions) => [...prevSessions, newSession])
          setCurrentSessionId(newSessionId)
          setShowInitialQuestions(true)
          currentQuestionRef.current = ""
        } else {
          throw new Error("Failed to save new session")
        }
      }
    } catch (error) {
      console.error("Error in manageSession:", error)
      setError("Failed to create new session")
    }
  }, [userId, setSessions, setCurrentSessionId])

  // Update handleNewConversation to use manageSession
  const handleNewConversation = useCallback(() => {
    manageSession()
  }, [manageSession])

  // Other states
  const [showInitialQuestions, setShowInitialQuestions] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [loadingQuestionIndex, setLoadingQuestionIndex] = useState<number | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [processingQuery, setProcessingQuery] = useState<string>("")
  const [randomQuestions, setRandomQuestions] = useState<string[]>([])

  // Response states
  const [firstResponse, setFirstResponse] = useState<{ question: string; content: string } | null>(null)
  const [secondResponse, setSecondResponse] = useState<{ videoLinks: VideoLinks; relatedProducts: Product[] } | null>(
    null,
  )
  const [isSecondResponseLoading, setIsSecondResponseLoading] = useState(false)

  // Refs
  const messageEndRef = useRef<HTMLDivElement>(null)
  const currentQuestionRef = useRef<string>("")

  // Add new refs and state for scrolling
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [userHasScrolled, setUserHasScrolled] = useState(false)
  const lastScrollPosition = useRef(0)

  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: [],
    headers: {
      "x-user-id": userId || "",
    },
    onResponse: (response) => {
      setIsStreaming(true)
      setLoadingProgress(3)
      setError(null)
      setWsError(null)
    },
    onFinish: async (message) => {
      setIsStreaming(false)

      const currentQuestion = currentQuestionRef.current
      if (!currentQuestion?.trim() || !currentSessionId) {
        return
      }

      setIsSecondResponseLoading(true)
      try {
        const linksResponse = await axios.post(
          "/api/links",
          {
            answer: message.content,
          },
          {
            headers: {
              "x-user-id": userId || "",
            },
          },
        )

        const newConversation = {
          id: uuidv4(),
          question: currentQuestion,
          text: message.content,
          timestamp: new Date().toISOString(),
          videoLinks: linksResponse.data.videoReferences || {},
          related_products: linksResponse.data.relatedProducts || [],
        }

        // Update both database and local state
        if (userId) {
          const updatedSession = {
            id: currentSessionId,
            conversations: [...currentConversation, newConversation],
          }

          // Update database
          await axios.post(
            "/api/set-session",
            {
              sessions: [updatedSession],
            },
            {
              headers: {
                "x-user-id": userId,
              },
            },
          )

          // Update local state
          setSessions((prevSessions) => prevSessions.map((s) => (s.id === currentSessionId ? updatedSession : s)))
          setCurrentConversation((prev) => [...prev, newConversation])
        }
      } catch (error) {
        console.error("Error in onFinish:", error)
        setError("Error updating chat history")
        // Attempt to recover state
        await recoverState()
      } finally {
        setIsSecondResponseLoading(false)
        setProcessingQuery("")
      }
    },
  })

  // Add recoverState function
  const recoverState = useCallback(async () => {
    if (!userId) return

    try {
      const response = await axios.get("/api/get-session", {
        headers: {
          "x-user-id": userId,
        },
      })

      if (Array.isArray(response.data) && response.data.length > 0) {
        setSessions(response.data)
        const lastSession = response.data[response.data.length - 1]
        setCurrentSessionId(lastSession.id)
        setCurrentConversation(lastSession.conversations || [])
        setShowInitialQuestions(!(lastSession.conversations?.length > 0))
      }
    } catch (error) {
      console.error("Failed to recover state:", error)
      setError("Failed to load chat history")
    }
  }, [userId, setSessions, setCurrentSessionId])

  // Add check if near bottom function
  const checkIfNearBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return true

    const threshold = 100 // pixels from bottom
    const position = container.scrollHeight - container.scrollTop - container.clientHeight
    return position < threshold
  }, [])

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    // Detect if user is scrolling up
    if (container.scrollTop < lastScrollPosition.current) {
      setUserHasScrolled(true)
      setIsAutoScrollEnabled(false)
    }

    // Show/hide scroll button based on position
    setShowScrollButton(!checkIfNearBottom())
    lastScrollPosition.current = container.scrollTop
  }, [checkIfNearBottom])

  const scrollToBottom = () => {
    const container = containerRef.current
    if (!container) return

    setIsAutoScrollEnabled(true)
    setUserHasScrolled(false)

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    })
  }

  // Add these useEffects:
  useEffect(() => {
    const container = containerRef.current
    if (!container || !isStreaming || !isAutoScrollEnabled) return

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    })
  }, [isStreaming, isAutoScrollEnabled])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  useEffect(() => {
    if (isStreaming) {
      setIsAutoScrollEnabled(!userHasScrolled)
    } else {
      setUserHasScrolled(false)
      setIsAutoScrollEnabled(true)
    }
  }, [isStreaming])

  // Update handleSearch to include error handling and state recovery
  const handleSearch = async (e: React.FormEvent | null, index?: number) => {
    if (e) e.preventDefault()
    const query = index !== undefined ? randomQuestions[index] : searchQuery

    if (!query.trim() || isLoading) return

    setProcessingQuery(query)
    currentQuestionRef.current = query
    setShowInitialQuestions(false)

    try {
      if (!currentSessionId) {
        await manageSession()
      }

      await append({
        role: "user",
        content: query,
        createdAt: new Date(),
      })

      setSearchQuery("")

      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } catch (error) {
      console.error("Search Error:", error)
      setError("Error processing your request")
      await recoverState()
    }
  }

  // Loading State Component
  const LoadingState = () => (
    <div className="w-full">
      <div className="mt-4">
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="space-y-4">
            {/* Video skeleton loader */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="animate-pulse w-8 h-8 rounded-full bg-[rgba(23,155,215,255)]/20 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-[rgba(23,155,215,255)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-medium text-gray-900">Processing Related Videos</h3>
              </div>
              <div className="flex overflow-x-auto space-x-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex-none w-[280px] bg-white border rounded-lg overflow-hidden">
                    <div className="aspect-video w-full bg-gray-200 animate-pulse" />
                    <div className="p-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Products skeleton loader */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="animate-pulse w-8 h-8 rounded-full bg-[rgba(23,155,215,255)]/20 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-[rgba(23,155,215,255)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-medium text-gray-900">Finding Related Products</h3>
              </div>
              <div className="flex overflow-x-auto space-x-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex-none min-w-[180px] bg-white border rounded-lg px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Replace the existing renderConversations function
  const renderConversations = () => {
    const messageId = messages.length > 0 ? messages[messages.length - 1].id : "default"

    return (
      <div className="relative" key="conversations-container">
        <div
          ref={containerRef}
          className="w-full overflow-y-auto scrollbar-none mt-0"
          style={{
            height: "calc(100vh - 160px)",
            paddingBottom: "0px",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          <style jsx global>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {/* Map over completed conversations */}
          {currentConversation.map((conv, index) => (
            <ConversationItem
              key={`conv-${conv.id}-${index}`}
              conv={conv}
              index={index}
              isLatest={conv.id === currentConversation[currentConversation.length - 1]?.id}
            />
          ))}

          {/* Processing Card */}
          {isLoading && !isStreaming && (
            <ProcessingCard
              query={processingQuery}
              loadingProgress={loadingProgress}
              setLoadingProgress={setLoadingProgress}
            />
          )}

          {/* Single container for both streaming and processing states */}
          {(isStreaming || isSecondResponseLoading) &&
            messages.length > 0 &&
            !currentConversation.find((conv) => conv.question === processingQuery) && (
              <div key={`streaming-${messageId}`} className="w-full bg-white rounded-lg shadow-sm p-6 mb-4 mt-0">
                <div className="mb-3 pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <p className="text-gray-800 break-words font-bold" style={{ fontFamily: systemFontFamily }}>
                      {processingQuery}
                    </p>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none mb-3">
                  <div className="text-base leading-relaxed" style={{ fontFamily: systemFontFamily }}>
                    <FixedMarkdownRenderer
                      key={`markdown-${messageId}`}
                      content={messages[messages.length - 1].content}
                    />
                  </div>
                </div>

                {isSecondResponseLoading && (
                  <div className="w-full">
                    <div className="mt-3">
                      <div className="bg-white rounded-lg p-4 mb-3">
                        <div className="space-y-4">
                          {/* Video skeleton loader */}
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="animate-pulse w-8 h-8 rounded-full bg-[rgba(23,155,215,255)]/20 flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-[rgba(23,155,215,255)]"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                              <h3 className="text-base font-medium text-gray-900">Processing Related Videos</h3>
                            </div>
                            <div className="flex overflow-x-auto space-x-4">
                              {[1, 2].map((i) => (
                                <div key={i} className="flex-none w-[280px] bg-white border rounded-lg overflow-hidden">
                                  <div className="aspect-video w-full bg-gray-200 animate-pulse" />
                                  <div className="p-3">
                                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Products skeleton loader */}
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="animate-pulse w-8 h-8 rounded-full bg-[rgba(23,155,215,255)]/20 flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-[rgba(23,155,215,255)]"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                  />
                                </svg>
                              </div>
                              <h3 className="text-base font-medium text-gray-900">Finding Related Products</h3>
                            </div>
                            <div className="flex overflow-x-auto space-x-4">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="flex-none min-w-[180px] bg-white border rounded-lg px-4 py-3">
                                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Scroll button remains unchanged */}
          {showScrollButton && (isStreaming || isSecondResponseLoading) && (
            <button
              onClick={scrollToBottom}
              type="button"
              className="fixed bottom-24 right-8 bg-gray-800 text-white rounded-full p-3 shadow-lg hover:bg-gray-700 transition-colors z-50 flex items-center gap-2"
            >
              <ArrowDown className="w-5 h-5" />
              <span className="text-sm font-medium pr-2">New content</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  // Effects
  useEffect(() => {
    const handleWebSocketError = (event: Event) => {
      const customError = {
        type: "WebSocketError",
        originalMessage: event instanceof ErrorEvent ? event.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }

      console.error("WebSocket error:", customError)
      setWsError(customError.originalMessage)
      setIsStreaming(false)
      setLoadingProgress(0)
    }

    window.addEventListener("websocketerror", handleWebSocketError)
    return () => window.removeEventListener("websocketerror", handleWebSocketError)
  }, [])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const selectedSession = sessions.find((session) => session.id === currentSessionId)
    if (selectedSession) {
      setCurrentConversation(selectedSession.conversations)
      setShowInitialQuestions(selectedSession.conversations.length === 0)
    }
  }, [sessions, currentSessionId])

  useEffect(() => {
    if (isLoading && loadingProgress < 3) {
      const timer = setTimeout(() => {
        setLoadingProgress((prev) => Math.min(prev + 1, 3))
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isLoading, loadingProgress])

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get("/api/random")
        setRandomQuestions(response.data.map((q: any) => q.question_text))
      } catch (error) {
        console.error("Error fetching questions:", error)
      }
    }

    fetchQuestions()
  }, [])

  // Handlers
  const handleQuestionSelect = (question: string, index: number) => {
    setLoadingQuestionIndex(index)
    setProcessingQuery(question)
    setShowInitialQuestions(false)
    setLoadingProgress(0)
    setCurrentConversation([]) // Clear existing conversations

    // Delay the search to allow UI to update
    setTimeout(() => {
      handleSearch(null, index)
    }, 100)
  }

  const handleSessionSelect = (sessionId: string) => {
    const selectedSession = sessions.find((session) => session.id === sessionId)
    if (selectedSession) {
      setCurrentSessionId(sessionId)
      setCurrentConversation(selectedSession.conversations)
      setShowInitialQuestions(selectedSession.conversations.length === 0)
    }
  }

  const saveSessionsToDB = async (updatedSessions: Session[]) => {
    if (!userId) {
      console.log("No user ID available, skipping session save")
      return
    }

    // Validate and clean sessions data
    const validSessions = updatedSessions.filter(
      (session) =>
        session &&
        session.id &&
        Array.isArray(session.conversations) &&
        session.conversations.every((conv) => conv.question && conv.text && conv.timestamp),
    )

    if (validSessions.length === 0) {
      console.error("No valid sessions to save")
      return
    }

    try {
      const currentSession = validSessions.find((s) => s.id === currentSessionId)
      if (!currentSession) {
        console.error("Current session not found in valid sessions")
        return
      }

      const response = await axios.post(
        "/api/set-session",
        {
          sessions: [currentSession], // Only save the current session
        },
        {
          headers: {
            "x-user-id": userId,
          },
        },
      )

      if (!response.data.success) {
        throw new Error("Failed to save session")
      }

      // Update local state to match database
      setSessions(validSessions)
    } catch (error) {
      console.error("Failed to save sessions to database:", error)
      setError("Failed to save chat history")
    }
  }

  // Add this useEffect to handle Chrome mobile viewport issues
  useEffect(() => {
    // Function to update actual viewport height (especially for Chrome mobile)
    const updateViewportHeight = () => {
      // Get the actual viewport height
      const vh = window.innerHeight * 0.01;
      // Set the --vh custom property to the root of the document
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set the initial height
    updateViewportHeight();

    // Update the height on resize and orientation change
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  // Main render
  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA]" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Fixed Header - Always visible and completely separate with higher z-index */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-white border-b shadow-sm">
        <Header
          userId={userId || null}
          username={username}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewConversation={handleNewConversation}
        />
      </header>
      
      {/* Main content with extra padding to push content below the header */}
      <main 
        className="flex-1 w-full overflow-x-hidden" 
        style={{ 
          paddingTop: "90px", // Extra padding for Chrome mobile
          paddingBottom: !showInitialQuestions ? "80px" : "0px",
          height: 'calc(var(--vh, 1vh) * 100)'
        }}
      >
        {/* Conversation area with proper positioning */}
        <div className="w-full h-full bg-[#F8F9FA] px-4">
          {currentConversation.length === 0 && showInitialQuestions && !isStreaming && !isLoading ? (
            // Initial questions view with safe spacing for Chrome mobile
            <div className="w-full flex flex-col items-center overflow-y-auto">
              <div className="text-center mb-6 mt-4">
                <h1 className="text-2xl font-semibold text-gray-900">A question creates knowledge</h1>
              </div>

              <div className="w-full max-w-2xl mx-auto mb-8 px-4">
                <SearchBar
                  loading={isLoading}
                  searchQuery={searchQuery}
                  processingQuery={processingQuery}
                  onSearch={handleSearch}
                  onNewConversation={handleNewConversation}
                  setSearchQuery={setSearchQuery}
                />
              </div>

              <div className="w-full max-w-2xl grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mx-auto px-4 pb-10">
                {randomQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionSelect(question, index)}
                    disabled={isLoading && loadingQuestionIndex === index}
                    className={cn(
                      "flex items-center",
                      "border rounded-xl shadow-sm hover:bg-[#F9FAFB]",
                      "ring-offset-background transition-colors",
                      "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                      "w-full p-4 text-left",
                      "bg-transparent",
                      isLoading && loadingQuestionIndex === index
                        ? "opacity-70 cursor-not-allowed"
                        : "cursor-pointer",
                    )}
                  >
                    <span className="text-sm text-gray-900">{question}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Conversation container with explicit height calculation and shadow
            <div className="bg-white rounded-lg shadow-sm overflow-hidden my-4">
              {/* Scrollable conversation area */}
              <div
                ref={containerRef}
                className="w-full overflow-y-auto scrollbar-none"
                style={{
                  height: `calc((var(--vh, 1vh) * 100) - ${!showInitialQuestions ? "180px" : "110px"})`,
                  msOverflowStyle: "none",
                  scrollbarWidth: "none",
                }}
              >
                <style jsx global>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                  
                  /* Prevent iOS Safari overscroll behavior */
                  html, body {
                    overscroll-behavior-y: none;
                    overflow: hidden;
                    position: fixed;
                    width: 100%;
                    height: 100%;
                  }
                `}</style>

                <div className="p-4">
                  {/* Map over completed conversations */}
                  {currentConversation.map((conv, index) => (
                    <ConversationItem
                      key={`conv-${conv.id}-${index}`}
                      conv={conv}
                      index={index}
                      isLatest={conv.id === currentConversation[currentConversation.length - 1]?.id}
                    />
                  ))}

                  {/* Processing Card */}
                  {isLoading && !isStreaming && (
                    <ProcessingCard
                      query={processingQuery}
                      loadingProgress={loadingProgress}
                      setLoadingProgress={setLoadingProgress}
                    />
                  )}

                  {/* Single container for both streaming and processing states */}
                  {(isStreaming || isSecondResponseLoading) &&
                    messages.length > 0 &&
                    !currentConversation.find((conv) => conv.question === processingQuery) && (
                      <div key={`streaming-${messages[messages.length - 1].id}`} className="w-full bg-white rounded-lg shadow-sm p-6 mb-4 mt-0">
                        <div className="mb-3 pb-3 border-b">
                          <div className="flex items-center gap-2">
                            <p className="text-gray-800 break-words font-bold" style={{ fontFamily: systemFontFamily }}>
                              {processingQuery}
                            </p>
                          </div>
                        </div>

                        <div className="prose prose-sm max-w-none mb-3">
                          <div className="text-base leading-relaxed" style={{ fontFamily: systemFontFamily }}>
                            <FixedMarkdownRenderer
                              key={`markdown-${messages[messages.length - 1].id}`}
                              content={messages[messages.length - 1].content}
                            />
                          </div>
                        </div>

                        {isSecondResponseLoading && (
                          <div className="w-full">
                            <div className="mt-3">
                              <div className="bg-white rounded-lg p-4 mb-3">
                                <div className="space-y-4">
                                  {/* Video skeleton loader */}
                                  <div>
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="animate-pulse w-8 h-8 rounded-full bg-[rgba(23,155,215,255)]/20 flex items-center justify-center">
                                        <svg
                                          className="w-4 h-4 text-[rgba(23,155,215,255)]"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                          />
                                        </svg>
                                      </div>
                                      <h3 className="text-base font-medium text-gray-900">Processing Related Videos</h3>
                                    </div>
                                    <div className="flex overflow-x-auto space-x-4">
                                      {[1, 2].map((i) => (
                                        <div key={i} className="flex-none w-[280px] bg-white border rounded-lg overflow-hidden">
                                          <div className="aspect-video w-full bg-gray-200 animate-pulse" />
                                          <div className="p-3">
                                            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                                            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Products skeleton loader */}
                                  <div>
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="animate-pulse w-8 h-8 rounded-full bg-[rgba(23,155,215,255)]/20 flex items-center justify-center">
                                        <svg
                                          className="w-4 h-4 text-[rgba(23,155,215,255)]"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                          />
                                        </svg>
                                      </div>
                                      <h3 className="text-base font-medium text-gray-900">Finding Related Products</h3>
                                    </div>
                                    <div className="flex overflow-x-auto space-x-4">
                                      {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex-none min-w-[180px] bg-white border rounded-lg px-4 py-3">
                                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                                          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Fixed input area at the bottom with higher z-index */}
      {!showInitialQuestions && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-20 shadow-sm">
          <div className="w-full mx-auto">
            <SearchBar
              loading={isLoading}
              searchQuery={searchQuery}
              processingQuery={processingQuery}
              onSearch={handleSearch}
              onNewConversation={handleNewConversation}
              setSearchQuery={setSearchQuery}
              className="py-3"
              isLarge={true}
            />
          </div>
        </div>
      )}

      {/* Scroll button with highest z-index */}
      {showScrollButton && (isStreaming || isSecondResponseLoading) && (
        <button
          onClick={scrollToBottom}
          type="button"
          className="fixed bottom-24 right-8 bg-gray-800 text-white rounded-full p-3 shadow-lg hover:bg-gray-700 transition-colors z-30 flex items-center gap-2"
        >
          <ArrowDown className="w-5 h-5" />
          <span className="text-sm font-medium pr-2">New content</span>
        </button>
      )}
    </div>
  )
}

// SearchBar Component
const SearchBar = ({
  loading,
  searchQuery,
  processingQuery,
  onSearch,
  onNewConversation,
  setSearchQuery,
  className,
  isLarge = false,
  disabled = false,
}: {
  loading: boolean
  searchQuery: string
  processingQuery: string
  onSearch: (e: React.FormEvent) => void
  onNewConversation: () => void
  setSearchQuery: (query: string) => void
  className?: string
  isLarge?: boolean
  disabled?: boolean
}) => {
  // Add handler for key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!loading && searchQuery.trim()) {
        onSearch(e)
      }
    }
  }

  // Add button click handler
  const handleButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await onNewConversation()
    } catch (error) {
      console.error("Error creating new conversation:", error)
    }
  }

  return (
    <div className="w-full py-1">
      <form
        onSubmit={onSearch}
        className={cn("w-full flex items-center bg-white py-1.5", "px-4 md:px-8 lg:px-12", disabled && "bg-gray-50")}
      >
        <Button
          onClick={handleButtonClick}
          variant="ghost"
          size="icon"
          className={cn(
            "flex items-center justify-center flex-shrink-0 ml-4",
            isLarge ? "h-[46px] w-[46px]" : "h-[42px] w-[42px]",
          )}
          disabled={disabled}
        >
          <PlusCircle className={cn(isLarge ? "h-6 w-6" : "h-5 w-5", "text-gray-400", disabled && "text-gray-300")} />
        </Button>

        <Textarea
          value={loading ? processingQuery : searchQuery}
          onChange={(e) => !loading && setSearchQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask your question..."
          disabled={disabled}
          className={cn(
            "flex-grow mx-2",
            isLarge ? "text-base" : "text-sm",
            "transition-all duration-200 ease-out",
            "placeholder:text-gray-400",
            "focus:placeholder:opacity-0",
            "resize-none",
            "question-textarea",
            "hide-scrollbar",
            "border-none",
            "focus:outline-none",
            "focus:ring-0",
            "focus-visible:ring-0",
            "focus-visible:outline-none",
            "focus:border-0",
            "active:outline-none",
            "active:ring-0",
            "touch-none",
            "outline-none",
            "flex items-center",
            "py-0",
            "scrollbar-none",
            "overflow-hidden",
            loading && "opacity-50",
            disabled && "bg-transparent cursor-default",
          )}
          style={{
            minHeight: isLarge ? "46px" : "42px",
            height: searchQuery ? "auto" : isLarge ? "46px" : "42px",
            resize: "none",
            lineHeight: "1.5",
            outline: "none",
            boxShadow: "none",
            paddingTop: isLarge ? "12px" : "10px",
            paddingBottom: isLarge ? "12px" : "10px",
            overflow: "hidden",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        />

        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className={cn(
            "flex items-center justify-center flex-shrink-0 mr-4",
            isLarge ? "h-[46px] w-[46px]" : "h-[42px] w-[42px]",
          )}
          disabled={loading || disabled}
        >
          {loading ? (
            <span className="animate-spin">⌛</span>
          ) : (
            <ArrowRight className={cn(isLarge ? "h-6 w-6" : "h-5 w-5", "text-gray-400", disabled && "text-gray-300")} />
          )}
        </Button>
      </form>
    </div>
  )
}

const processingSteps = ["Understanding Query", "Searching Knowledge Base", "Processing Data", "Generating Answer"]