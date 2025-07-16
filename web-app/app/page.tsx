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
          <source src="/logo5.mp4" type="video/mp4" />
        </video>
                  {/* Video Overlay removed */}
      </div>

      {/* Animated Background Elements */}
      <PaperPlaneBackground />
      <InteractivePaperPlanes />
      <MouseTrailEffect />
      <MagneticFieldEffect />
      <FloatingOrbs />
      <Floating3DCards />
      <Geometric3DShapes />

      {/* Enhanced Cursor Effects */}
      <div
        className="fixed w-96 h-96 bg-blue-500/10 rounded-full pointer-events-none z-0 transition-all duration-300 ease-out"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          transform: `scale(${1 + Math.abs(mouseVelocity.x + mouseVelocity.y) * 0.001})`,
        }}
      />

      {/* Secondary cursor ripple */}
      <div
        className="fixed w-64 h-64 bg-blue-400/5 rounded-full pointer-events-none z-0 transition-all duration-500 ease-out"
        style={{
          left: mousePosition.x - 128,
          top: mousePosition.y - 128,
          transform: `scale(${1.2 + Math.abs(mouseVelocity.x + mouseVelocity.y) * 0.002})`,
        }}
      />

      {/* Velocity-based directional glow */}
      <div
        className="fixed w-32 h-32 bg-blue-600/8 rounded-full pointer-events-none z-0 transition-all duration-200 ease-out"
        style={{
          left: mousePosition.x - 64 + mouseVelocity.x * 0.5,
          top: mousePosition.y - 64 + mouseVelocity.y * 0.5,
        }}
      />

      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrollY > 50 ? "bg-white/95 border-b border-gray-200 shadow-lg" : "bg-white/80"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 group">
              {/* Logo removed */}
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Button variant="ghost" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all">
                Features
              </Button>
              <Button variant="ghost" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all">
                Pricing
              </Button>
              <Button variant="ghost" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all">
                Sign In
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
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
              <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-blue-600">
                Sign In
              </Button>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Get Extension</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 z-10 bg-white/20">
        <div className="max-w-7xl mx-auto">
          {/* Logo Section removed */}

          <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight text-center">
            <span className="text-gray-900">Supercharge Your Job Search</span>
            <br />
            <span className="text-blue-600">with Smart Tools</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Capture job postings instantly, generate tailored resumes and cover letters, and track your applications
            with advanced analytics. Your complete job search platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all group"
              onClick={() => window.location.href = '/dashboard'}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-4 text-lg bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 hover:scale-105 transition-all group"
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
              <div className="flex items-center justify-center h-16 w-32 grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110">
                <Image
                  src="/glassdoor.png"
                  alt="Glassdoor"
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
              <div className="flex items-center justify-center h-16 w-32 grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110">
                <Image
                  src="/indeed.png"
                  alt="Indeed"
                  width={120}
                  height={40}
                  className="object-contain max-h-12"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-16 z-10 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">Seamless Chrome Extension Integration</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes with our powerful Chrome extension
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Download,
                title: "Install Extension",
                description: "Get our Chrome extension to capture jobs instantly from any job site.",
                delay: "delay-0",
              },
              {
                icon: Target,
                title: "Capture Jobs",
                description: "Use the floating button to capture job postings with one click.",
                delay: "delay-100",
              },
              {
                icon: BarChart3,
                title: "Unlock Web App",
                description: "Access advanced analytics, team features, and premium templates.",
                delay: "delay-200",
              },
            ].map((step, index) => (
              <Card
                key={index}
                className={`bg-white/80 border-gray-200 hover:bg-white hover:border-blue-300 transition-all transform-3d hover:rotateY-10 hover:rotateX-5 hover:translateZ-20 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10 group ${step.delay} perspective-1000`}
              >
                <CardContent className="pt-6 p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-all">
                    <step.icon className="h-8 w-8 text-blue-600 group-hover:text-blue-700 group-hover:scale-110 transition-all" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-blue-700 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 group-hover:text-gray-700 transition-colors">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all group"
            >
              <Chrome className="mr-2 h-5 w-5 group-hover:animate-spin" />
              Install Chrome Extension
            </Button>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="relative py-16 z-10 bg-white/60">
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
                    Apply Pilot AI
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    TealHQ
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Jobscan
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rezi
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Kickresume
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
              >
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg bg-transparent hover:scale-105 transition-all"
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
    </div>
  )
}
