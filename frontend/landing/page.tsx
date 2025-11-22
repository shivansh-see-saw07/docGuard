"use client"

import { useState, useEffect } from "react"
import { Shield, Zap, Lock, Globe, ArrowRight, Star, Sparkles, Moon, Sun, FileCheck, Database, Cpu, Github, Linkedin } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { useTheme } from "next-themes"

interface LandingPageProps {
  onEnterApp: () => void
}

export default function LandingPage({ onEnterApp }: LandingPageProps) {
  const [mounted, setMounted] = useState(false)
  const [currentStat, setCurrentStat] = useState(0)
  const [animatedNumbers, setAnimatedNumbers] = useState({
    documents: 0,
    organizations: 0,
    uptime: 0,
  })
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)

    // Animate numbers on mount
    const animateNumber = (target: number, key: keyof typeof animatedNumbers, duration = 2000) => {
      const start = 0
      const increment = target / (duration / 16)
      let current = start

      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(timer)
        }
        setAnimatedNumbers((prev) => ({ ...prev, [key]: Math.floor(current) }))
      }, 16)
    }

    setTimeout(() => {
      animateNumber(100, "documents", 2000)
      animateNumber(10, "organizations", 1800)
      animateNumber(99.9, "uptime", 2200)
    }, 500)

    // Cycle through stats
    const statInterval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % 4)
    }, 3000)

    return () => clearInterval(statInterval)
  }, [])

  // Enhanced logo component
  const DocGuardLogo = ({ size = "default" }: { size?: "default" | "large" }) => {
    const dimensions = size === "large" ? "w-16 h-16" : "w-10 h-10"
    const iconSize = size === "large" ? "w-8 h-8" : "w-6 h-6"

    return (
      <div className={`relative ${dimensions} group`}>
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity duration-300" />

        {/* Main logo container */}
        <div
          className={`relative ${dimensions} bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105`}
        >
          {/* Document with checkmark overlay */}
          <div className="relative">
            <FileCheck className={`${iconSize} text-white drop-shadow-sm`} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const features = [
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Documents are secured using immutable blockchain technology, ensuring tamper-proof verification.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Zap,
      title: "Instant Verification",
      description: "Verify document authenticity in seconds with our advanced OCR and perceptual hash (p-hash) comparison system.",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      icon: Lock,
      title: "Enterprise Grade",
      description: "Built for organizations that require the highest levels of security and compliance.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Access your documents and verification system from anywhere in the world, 24/7.",
      gradient: "from-purple-500 to-pink-500",
    },
  ]

  const stats = [
    { number: `${animatedNumbers.documents.toLocaleString()}+`, label: "Documents Verified", icon: FileCheck },
    { number: `${animatedNumbers.organizations}+`, label: "Organizations", icon: Database },
    { number: `${animatedNumbers.uptime}%`, label: "Uptime", icon: Cpu },
    { number: "24/7", label: "Support", icon: Shield },
  ]

  const testimonials = [
    {
      name: "Linkedin User",
      role: "",
      content:
        "This is great",
      rating: 5,
      avatar: "L",
    },
    {
      name: "Shivansh Sisodia",
      role: "Joint Secretary, Tech-Society IIIT-Bhubaneshwar",
      content:
        "Damn, this is something isn't it?",
      rating: 5,
      avatar: "SS",
    },
    {
      name: "Linkedin User",
      role: "",
      content:
        "Excellent work Shivansh !!",
      rating: 5,
      avatar: "L",
    },
  ]

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Header */}
      <header className="relative bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <DocGuardLogo />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DocGuard
                </h1>
                <p className="text-xs text-muted-foreground">Document Verification System</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 hover:bg-muted/50 transition-colors duration-200"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              <Button
                onClick={onEnterApp}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Launch App
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-fade-in-up">
              <Badge
                variant="secondary"
                className="mb-4 bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800 hover:scale-105 transition-transform duration-200"
              >
                <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
                Blockchain Powered
              </Badge>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
                Secure Document
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
                  {" "}
                  Verification
                </span>
              </h1>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Verify document authenticity instantly using blockchain technology. DocGuard leverages advanced OCR and perceptual hash (p-hash) technology to ensure your documents are tamper-proof and visually verified, providing enterprise-grade security and global verifiability.
              </p>
            </div>

            <div
              className="animate-fade-in-up flex flex-col sm:flex-row gap-4 justify-center"
              style={{ animationDelay: "0.6s" }}
            >
              <Button
                size="lg"
                onClick={onEnterApp}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Stats Section */}
      <section className="py-16 bg-muted/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center transform transition-all duration-500 hover:scale-110 ${currentStat === index ? "scale-110 opacity-100" : "opacity-75"
                  }`}
              >
                <div className="flex justify-center mb-2">
                  <stat.icon
                    className="w-8 h-8 text-blue-600 animate-bounce"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Choose DocGuard?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built with cutting-edge technology to provide unmatched security and reliability for your document
              verification needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group cursor-pointer bg-gradient-to-br from-background to-muted/20"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <feature.icon className="w-6 h-6 text-white drop-shadow-sm" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-blue-600 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced How It Works Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple, secure, and efficient document verification in three easy steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: "Upload Document",
                description:
                  "Upload your document to our secure platform. Our OCR technology extracts the text and a perceptual hash (p-hash) is generated from the document image for visual fingerprinting.",
                gradient: "from-green-500 to-blue-500",
              },
              {
                step: 2,
                title: "Blockchain Storage",
                description:
                  "Document hash and p-hash are stored on the blockchain, creating an immutable record that cannot be tampered with.",
                gradient: "from-blue-500 to-purple-500",
              },
              {
                step: 3,
                title: "Instant Verification",
                description: "Verify any document instantly by comparing both its text hash and p-hash (visual fingerprint) against our blockchain records for unmatched security.",
                gradient: "from-purple-500 to-pink-500",
              },
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${item.gradient} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl`}
                >
                  <span className="text-2xl font-bold text-white drop-shadow-sm">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-blue-600 transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Trusted by Organizations Worldwide</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our customers have to say about their experience with DocGuard.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-yellow-400 fill-current group-hover:scale-110 transition-transform duration-200"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          {/* <DocGuardLogo size="large" /> */}
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 mt-6">Ready to Secure Your Documents?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of organizations already using DocGuard for secure document verification.
          </p>
          <Button
            size="lg"
            onClick={onEnterApp}
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Start Verifying Now
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <DocGuardLogo />
              <div>
                <div className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DocGuard
                </div>
                <div className="text-xs text-muted-foreground">Secure. Reliable. Verified.</div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center justify-center space-x-4">
              <a
                href="https://github.com/shivansh-see-saw07"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-all duration-200 hover:scale-110 group"
                title="GitHub"
              >
                <Github className="w-5 h-5 text-foreground group-hover:text-blue-600 transition-colors duration-200" />
              </a>
              <a
                href="https://www.linkedin.com/in/shivansh-sisodia-541391284/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-all duration-200 hover:scale-110 group"
                title="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-foreground group-hover:text-blue-600 transition-colors duration-200" />
              </a>
            </div>

            <div className="text-sm text-muted-foreground ">DocGuard • All rights reserved © 2025.</div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
