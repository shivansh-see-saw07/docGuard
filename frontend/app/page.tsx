"use client"

declare global {
  interface Window {
    ethereum?: any
  }
}

import * as React from "react"
import { useState, useEffect } from "react"
import { Building2, Upload, CheckCircle2, Moon, Sun, Menu, X, FileCheck, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/text-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { useTheme } from "next-themes"
import LandingPage from "../landing/page"
import OrganizationRegistration from "../src/components/OrganizationRegistration"
import AdminDocumentUpload from "../src/components/AdminDocumentUpload"
import UserDocumentVerification from "../src/components/UserDocumentVerification"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import Link from "next/link"

export default function DocGuardApp() {
  const [currentView, setCurrentView] = useState<"landing" | "app">("landing")
  const [activeTab, setActiveTab] = useState("verify")
  const [isLoading, setIsLoading] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Enhanced logo component
  const DocGuardLogo = ({ size = "default" }: { size?: "default" | "large" }) => {
    const dimensions = size === "large" ? "w-16 h-16" : "w-10 h-10"
    const iconSize = size === "large" ? "w-8 h-8" : "w-6 h-6"

    return (
      <div className={`relative ${dimensions} group`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
        <div
          className={`relative ${dimensions} bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105`}
        >
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

  const handleRegisterOrg = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 1500)
  }

  if (!mounted) {
    return null
  }

  if (currentView === "landing") {
    return <LandingPage onEnterApp={() => setCurrentView("app")} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/5 to-cyan-400/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Header */}
      <header className="relative bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView("landing")}
                className="flex items-center space-x-2 hover:bg-muted/50 transition-all duration-200 group"
              >
                <DocGuardLogo />
                <div className="text-left">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    DocGuard
                  </h1>
                  <p className="text-xs text-muted-foreground">Document Verification</p>
                </div>
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800 hover:scale-105 transition-transform duration-200 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
                Blockchain Secured
              </Badge>

              {/* Wagmi Wallet Connect Button */}
              <ConnectButton />

              {isConnected && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="ml-2">
                    Admin Dashboard
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 hover:bg-muted/50 transition-all duration-200 hover:scale-105"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-muted/50 transition-colors duration-200"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Secure Document Verification
          </h2>
          <p className="text-lg text-muted-foreground">Verify document authenticity using blockchain technology</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-center w-full">
            <TabsList className="grid w-full max-w-xl grid-cols-3 lg:w-fit lg:grid-cols-3 bg-muted/50 backdrop-blur">
              <TabsTrigger
                value="register"
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-200"
              >
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Register Org</span>
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white transition-all duration-200"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload Doc</span>
              </TabsTrigger>
              <TabsTrigger
                value="verify"
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all duration-200"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Verify</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Register Organization Tab */}
          <TabsContent value="register" className="animate-fade-in">
            <Card className="w-full max-w-3xl mx-auto shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {/* No icon or text */}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <OrganizationRegistration />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload Document Tab */}
          <TabsContent value="upload" className="animate-fade-in">
            <Card className="w-full max-w-3xl mx-auto shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {/* No icon or text */}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <AdminDocumentUpload />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verify Document Tab */}
          <TabsContent value="verify" className="animate-fade-in">
            <Card className="w-full max-w-3xl mx-auto shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {/* No icon or text */}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <UserDocumentVerification />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
