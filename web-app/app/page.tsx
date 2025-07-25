"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import {
  Bot,
  Chrome,
  Target,
  FileText,
  BarChart3,
  Users,
  CheckCircle,
  ArrowRight,
  Download,
  Play,
  Menu,
  X,
  Sparkles,
  Minus,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { AuthModal } from "@/components/AuthModal"

// Paper Plane Animation Component
function PaperPlaneBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Paper Planes */}
      <div className="paper-plane paper-plane-1">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-500">
          <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" fillOpacity="0.7" />
        </svg>
      </div>

      <div className="paper-plane paper-plane-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-600">
          <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" fillOpacity="0.6" />
        </svg>
      </div>

      <div className="paper-plane paper-plane-3">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-blue-400">
          <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" fillOpacity="0.8" />
        </svg>
      </div>

      <div className="paper-plane paper-plane-4">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-blue-700">
          <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" fillOpacity="0.5" />
        </svg>
      </div>

      <div className="paper-plane paper-plane-5">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-blue-500">
          <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" fillOpacity="0.7" />
        </svg>
      </div>

      <div className="paper-plane paper-plane-6">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-blue-600">
          <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" fillOpacity="0.6" />
        </svg>
      </div>

      <div className="paper-plane paper-plane-7">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-400">
          <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" fillOpacity="0.8" />
        </svg>
      </div>

      <div className="paper-plane paper-plane-8">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-700">
          <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" fillOpacity="0.5" />
        </svg>
      </div>
    </div>
  )
}

// Floating Orbs Component
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full animate-pulse"></div>
      <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-blue-400/5 rounded-full animate-pulse delay-500"></div>
    </div>
  )
}

// 3D Floating Cards Component
function Floating3DCards() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Floating cards blur effects removed */}
    </div>
  )
}

// 3D Geometric Shapes
function Geometric3DShapes() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="geometric-shape-1 absolute top-1/4 left-1/4 w-16 h-16"></div>
      <div className="geometric-shape-2 absolute top-3/4 right-1/3 w-12 h-12"></div>
      <div className="geometric-shape-3 absolute top-1/2 right-1/4 w-20 h-20"></div>
      <div className="geometric-shape-4 absolute bottom-1/3 left-1/3 w-14 h-14"></div>
    </div>
  )
}

export default function LandingPage() {
  // Enhanced mouse tracking with multiple effects
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [mouseVelocity, setMouseVelocity] = useState({ x: 0, y: 0 })
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 })
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  
  // Authentication state
  const { user, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin')

  // Enhanced mouse tracking with immediate response
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)

    const handleMouseMove = (e: MouseEvent) => {
      const newPosition = { x: e.clientX, y: e.clientY }

      // Calculate velocity for dynamic effects
      const velocity = {
        x: newPosition.x - lastMousePosition.x,
        y: newPosition.y - lastMousePosition.y,
      }

      setMousePosition(newPosition)
      setMouseVelocity(velocity)
      setLastMousePosition(newPosition)

      // Immediate CSS variable updates for instant response
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100

      document.documentElement.style.setProperty("--mouse-x", `${x}%`)
      document.documentElement.style.setProperty("--mouse-y", `${y}%`)

      // Update interactive planes position immediately
      const planes = document.querySelectorAll(".interactive-plane-1, .interactive-plane-2, .interactive-plane-3")
      planes.forEach((plane, index) => {
        const element = plane as HTMLElement
        const offsetX = (index - 1) * 50
        const offsetY = (index - 1) * 30

        // Remove setTimeout for instant response
        element.style.left = `${e.clientX + offsetX}px`
        element.style.top = `${e.clientY + offsetY}px`
      })
    }

    window.addEventListener("scroll", handleScroll)
    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [lastMousePosition])

  // Mouse Trail Effect Component - More Responsive
  function MouseTrailEffect() {
    const [trails, setTrails] = useState<Array<{ x: number; y: number; id: number }>>([])

    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        const newTrail = {
          x: e.clientX,
          y: e.clientY,
          id: Date.now() + Math.random(), // More unique IDs
        }

        setTrails((prev) => [...prev.slice(-5), newTrail]) // Reduced to 5 for better performance
      }

      // Use passive listener for better performance
      window.addEventListener("mousemove", handleMouseMove, { passive: true })
      return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [])

    return (
      <div className="fixed inset-0 pointer-events-none z-5">
        {trails.map((trail, index) => (
          <div
            key={trail.id}
            className="absolute w-2 h-2 bg-blue-400 rounded-full"
            style={{
              left: trail.x - 4,
              top: trail.y - 4,
              opacity: ((index + 1) / trails.length) * 0.8,
              animation: `trail-fade 0.8s ease-out forwards`,
              animationDelay: `${index * 20}ms`,
            }}
          />
        ))}
      </div>
    )
  }

  // Interactive Paper Planes Component
  function InteractivePaperPlanes() {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Interactive paper planes that follow mouse */}
        <div className="paper-plane interactive-plane-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-500">
            <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" fillOpacity="0.4" />
          </svg>
        </div>

        <div className="paper-plane interactive-plane-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-600">
            <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" fillOpacity="0.3" />
          </svg>
        </div>

        <div className="paper-plane interactive-plane-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-blue-400">
            <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" fillOpacity="0.5" />
          </svg>
        </div>
      </div>
    )
  }

  // Magnetic Field Effect Component
  function MagneticFieldEffect() {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="magnetic-particle magnetic-particle-1"></div>
        <div className="magnetic-particle magnetic-particle-2"></div>
        <div className="magnetic-particle magnetic-particle-3"></div>
        <div className="magnetic-particle magnetic-particle-4"></div>
        <div className="magnetic-particle magnetic-particle-5"></div>
        <div className="magnetic-particle magnetic-particle-6"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-gray-900 overflow-x-hidden relative">
      {/* Centered Logo at the Top */}
      {/* Remove the logo from the body/top of the main content */}

      {/* Background Video - Full size */}
      <div className="fixed inset-0 w-full h-full z-0 flex items-center justify-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ 
            objectPosition: 'center center',
            transform: 'scale(1.2)'
          }}
        >
          <source src="/landing-bg.mp4" type="video/mp4" />
        </video>
      </div>

      {/* All animated/dynamic background elements removed */}

      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrollY > 50 ? "bg-white/95 border-b border-gray-200 shadow-lg" : "bg-white/80"
        }`}
        style={{ height: 88 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between h-20">
            {/* Logo left, vertically centered with more space */}
            <div className="flex items-center py-2">
              <Image src="/logo.png" alt="Apply Pilot Logo" width={100} height={100} priority className="drop-shadow-sm" />
            </div>
            {/* Nav links right */}
            <div className="hidden md:flex items-center space-x-8">
              <Button variant="ghost" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all" onClick={() => document.getElementById('feature-comparison')?.scrollIntoView({ behavior: 'smooth' })}>
                Features
              </Button>
              <Button variant="ghost" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                Pricing
              </Button>
              {user ? (
                <Button variant="ghost" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all" onClick={() => signOut()}>
                  Sign Out
                </Button>
              ) : (
                <Button variant="ghost" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all" onClick={() => {
                  setAuthModalTab('signin')
                  setShowAuthModal(true)
                }}>
                  Sign In
                </Button>
              )}
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center gap-2" onClick={() => {
                // TODO: Replace with actual Chrome Web Store URL when extension is published
                window.open('https://chrome.google.com/webstore/category/extensions', '_blank')
              }}>
                <img src="/chrome-logo.jpg" alt="Chrome Logo" className="w-5 h-5 rounded-full" />
                Get Extension
              </Button>
            </div>
            <button className="md:hidden text-gray-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 border-t border-gray-200 shadow-lg">
            <div className="px-4 py-2 space-y-2">
              <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-blue-600">
                Features
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-blue-600">
                Pricing
              </Button>
              {user ? (
                <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-blue-600" onClick={() => signOut()}>
                  Sign Out
                </Button>
              ) : (
                <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-blue-600" onClick={() => {
                  setAuthModalTab('signin')
                  setShowAuthModal(true)
                  setIsMenuOpen(false)
                }}>
                  Sign In
                </Button>
              )}
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2" onClick={() => {
                // TODO: Replace with actual Chrome Web Store URL when extension is published
                window.open('https://chrome.google.com/webstore/category/extensions', '_blank')
                setIsMenuOpen(false)
              }}>
                <img src="/chrome-logo.jpg" alt="Chrome Logo" className="w-5 h-5 rounded-full" />
                Get Extension
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 z-10 bg-white/20">
        <div className="max-w-7xl mx-auto">
          {/* Logo Section removed */}

          <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight text-center">
            <span className="text-gray-900">Supercharge Your Job Search</span>
            <br />
            <span className="text-blue-600">with Smart Tools</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your entire job search workflow with AI-powered tools that capture opportunities, analyze fit, and generate professional documents tailored to every application.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all group flex items-center gap-2"
              onClick={() => {
                if (user) {
                  window.location.href = '/dashboard'
                } else {
                  setAuthModalTab('signup')
                  setShowAuthModal(true)
                }
              }}
            >
              Try for Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-4 text-lg bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 hover:scale-105 transition-all group"
              onClick={() => document.getElementById('feature-comparison')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              See How It Works
            </Button>
          </div>




        </div>
      </section>

      {/* Supported Job Sites Section */}
      <section className="relative py-12 z-10 bg-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-gray-800">
              Supported job sites
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 md:gap-16">
              <div className="flex items-center justify-center h-24 w-48 grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110">
                <Image
                  src="/ziprecruiter.png"
                  alt="ZipRecruiter"
                  width={200}
                  height={80}
                  className="object-contain"
                />
              </div>
              <div className="flex items-center justify-center h-16 w-32 grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110">
                <Image
                  src="/indeed.png"
                  alt="Indeed"
                  width={120}
                  height={40}
                  className="object-contain max-h-12"
                />
              </div>
              <div className="flex items-center justify-center h-16 w-32 grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110">
                <Image
                  src="/linkedin.png"
                  alt="LinkedIn"
                  width={120}
                  height={40}
                  className="object-contain max-h-12"
                />
              </div>
              <div className="flex items-center justify-center h-24 w-48 grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110">
                <Image
                  src="/glassdoor.png"
                  alt="Glassdoor"
                  width={150}
                  height={50}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Timeline Section */}
      <section className="relative py-16 z-10 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">4 steps. 4 clicks. Instantly go from job post to tailored application.</p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4 relative">
            {/* Step 1 */}
            <div className="flex-1 rounded-2xl bg-gradient-to-br from-blue-50 to-white shadow-md border border-blue-100 p-8 flex flex-col items-center group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-300 min-h-[340px]">
              <div className="mb-4 flex flex-col items-center justify-center">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-white flex items-center justify-center text-xl font-bold shadow-lg mb-2">1</span>
                <img src="/chrome-logo.jpg" alt="Chrome Logo" className="w-10 h-10 rounded-full shadow border border-gray-200" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 text-center">Add Extension</h3>
              <p className="text-gray-700 text-center text-base">Install in 2 clicks—no sign-up required.</p>
            </div>
            {/* Dotted Arrow (desktop only) */}
            <div className="hidden md:block w-8 h-1 flex-shrink-0 flex items-center justify-center">
              <svg width="32" height="8" viewBox="0 0 32 8" fill="none"><line x1="2" y1="4" x2="30" y2="4" stroke="#a0aec0" strokeWidth="2" strokeDasharray="4 4"/></svg>
            </div>
            {/* Step 2 */}
            <div className="flex-1 rounded-2xl bg-gradient-to-br from-purple-50 to-white shadow-md border border-purple-100 p-8 flex flex-col items-center group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-purple-300 min-h-[340px]">
              <div className="mb-4 flex items-center justify-center">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center text-xl font-bold shadow-lg mr-3">2</span>
              </div>
              <div className="w-full flex justify-center mb-4">
                <Image 
                  src="/capture-button-example.png" 
                  alt="Capture Button Example" 
                  width={160} 
                  height={50} 
                  className="rounded-lg shadow-md border border-gray-200 object-contain"
                />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 text-center">Spot the Button</h3>
              <p className="text-gray-700 text-center text-base">A smart "Capture" button appears on every job listing you view.</p>
            </div>
            <div className="hidden md:block w-8 h-1 flex-shrink-0 flex items-center justify-center">
              <svg width="32" height="8" viewBox="0 0 32 8" fill="none"><line x1="2" y1="4" x2="30" y2="4" stroke="#a0aec0" strokeWidth="2" strokeDasharray="4 4"/></svg>
            </div>
            {/* Step 3 */}
            <div className="flex-1 rounded-2xl bg-gradient-to-br from-blue-100 to-white shadow-md border border-blue-200 p-8 flex flex-col items-center group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-300 min-h-[340px]">
              <div className="mb-4 flex items-center justify-center">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-lg mr-3">3</span>
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 text-center">Capture & Store</h3>
              <p className="text-gray-700 text-center text-base">Click "Capture" to extract and store job details in your dashboard for analysis.</p>
            </div>
            <div className="hidden md:block w-8 h-1 flex-shrink-0 flex items-center justify-center">
              <svg width="32" height="8" viewBox="0 0 32 8" fill="none"><line x1="2" y1="4" x2="30" y2="4" stroke="#a0aec0" strokeWidth="2" strokeDasharray="4 4"/></svg>
            </div>
            {/* Step 4 */}
            <div className="flex-1 rounded-2xl bg-gradient-to-br from-green-50 to-white shadow-md border border-green-100 p-8 flex flex-col items-center group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-green-300 min-h-[340px]">
              <div className="mb-4 flex items-center justify-center">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center text-xl font-bold shadow-lg mr-3">4</span>
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 text-center">Tailor & Apply</h3>
              <p className="text-gray-700 text-center text-base">Generate a bespoke résumé & cover letter—auto-stored in your dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section id="feature-comparison" className="relative py-16 z-10 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">Feature Comparison</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Compare Apply Pilot AI with other tools
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span className="flex items-center gap-2">
                      <Image src="/applypilot.png" alt="Apply Pilot AI" width={28} height={28} className="object-contain rounded" />
                      Apply Pilot AI
                    </span>
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span className="flex items-center gap-2">
                      <Image src="/tealhq.png" alt="TealHQ" width={28} height={28} className="object-contain rounded" />
                      TealHQ
                    </span>
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span className="flex items-center gap-2">
                      <Image src="/jobscan.png" alt="Jobscan" width={28} height={28} className="object-contain rounded" />
                      Jobscan
                    </span>
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span className="flex items-center gap-2">
                      <Image src="/rezi.png" alt="Rezi" width={28} height={28} className="object-contain rounded" />
                      Rezi
                    </span>
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span className="flex items-center gap-2">
                      <Image src="/kickresume.png" alt="Kickresume" width={28} height={28} className="object-contain rounded" />
                      Kickresume
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {[
                  { feature: "Chrome Extension Job Capture", applyPilot: true, tealHQ: true, jobscan: false, rezi: false, kickresume: false },
                  { feature: "Resume & Cover Letter Generator", applyPilot: true, tealHQ: true, jobscan: true, rezi: true, kickresume: true },
                  { feature: "Match Score + Gap Analysis", applyPilot: true, tealHQ: null, jobscan: true, rezi: false, kickresume: false },
                  { feature: "AI-Powered Job Matching", applyPilot: true, tealHQ: null, jobscan: false, rezi: false, kickresume: false },
                  { feature: "ATS Keyword Optimization", applyPilot: true, tealHQ: true, jobscan: true, rezi: true, kickresume: true },
                ].map((row, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.applyPilot ? <CheckCircle className="text-green-500" /> : <X className="text-red-500" />}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.tealHQ === null ? <Minus className="text-yellow-500" /> : row.tealHQ ? <CheckCircle className="text-green-500" /> : <X className="text-red-500" />}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.jobscan ? <CheckCircle className="text-green-500" /> : <X className="text-red-500" />}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.rezi ? <CheckCircle className="text-green-500" /> : <X className="text-red-500" />}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.kickresume ? <CheckCircle className="text-green-500" /> : <X className="text-red-500" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing Table Section */}
      <section id="pricing" className="relative py-16 z-10 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">Pricing</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Flexible plans for every job seeker. Pay only for what you use—credits are tied to smart document and scoring actions.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {/* Basic (Free) */}
            <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white shadow-md border border-gray-200 p-8 flex flex-col items-center">
              <h3 className="text-2xl font-bold mb-2 text-gray-900 text-center">Basic (Free)</h3>
              <div className="text-3xl font-extrabold text-blue-600 mb-2">$0</div>
              <div className="text-gray-700 mb-4">3 AI credits (e.g., 2 scores + 1 doc)</div>
              <div className="text-gray-500 mb-2">Blocked until upgrade after credits used</div>
            </div>
            {/* Starter */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-white shadow-md border border-blue-200 p-8 flex flex-col items-center">
              <h3 className="text-2xl font-bold mb-2 text-gray-900 text-center">Starter</h3>
              <div className="text-3xl font-extrabold text-blue-600 mb-2">$9<span className="text-lg font-medium text-gray-600">/mo</span></div>
              <div className="text-gray-700 mb-4">75 credits / mo (≈ 50 scores + 8 docs)</div>
              <div className="text-gray-500 mb-2">$0.20 per extra credit</div>
            </div>
            {/* Pro */}
            <div className="rounded-2xl bg-gradient-to-br from-green-50 to-white shadow-md border border-green-200 p-8 flex flex-col items-center">
              <h3 className="text-2xl font-bold mb-2 text-gray-900 text-center">Pro</h3>
              <div className="text-3xl font-extrabold text-green-600 mb-2">$19<span className="text-lg font-medium text-gray-600">/mo</span></div>
              <div className="text-gray-700 mb-4">300 credits / mo (≈ 200 scores + 30 docs)</div>
              <div className="text-gray-500 mb-2">$0.15 per extra</div>
            </div>
            {/* Professional (Combined Unlimited + Team) */}
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-white shadow-md border border-purple-200 p-8 flex flex-col items-center relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600 text-white">Most Popular</Badge>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-gray-900 text-center">Professional</h3>
              <div className="text-3xl font-extrabold text-purple-600 mb-2">$59<span className="text-lg font-medium text-gray-600">/mo</span></div>
              <div className="text-gray-700 mb-2 text-center">Unlimited credits (fair-use)</div>
              <div className="text-gray-700 mb-2 text-center">+ Team features (up to 5 seats)</div>
              <div className="text-gray-500 mb-2">$0.12 per extra credit after soft limit</div>
            </div>
          </div>
          <div className="text-center mt-12 text-gray-500 text-sm max-w-2xl mx-auto">
            <p>1 credit = 1 match score or 1/3 document generation. Overage is billed monthly. Free plan lets you try the core features before upgrading. Team plan includes shared credits and advanced analytics.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 z-10 bg-white/30">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12 text-white shadow-2xl shadow-blue-500/20">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Transform Your Job Search?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of job seekers who have already accelerated their careers with Apply Pilot.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 hover:text-blue-700 px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                onClick={() => {
                  if (user) {
                    window.location.href = '/dashboard'
                  } else {
                    setAuthModalTab('signup')
                    setShowAuthModal(true)
                  }
                }}
              >
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg bg-transparent hover:scale-105 transition-all"
                onClick={() => document.getElementById('feature-comparison')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-white/90 border-t border-gray-200 py-4 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          © 2024 Apply Pilot. All rights reserved. | support@applypilot.com
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        defaultTab={authModalTab}
      />
    </div>
  )
}
