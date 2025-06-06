"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  User,
  Github,
  Linkedin,
  Code,
  Brain,
  Award,
  MapPin,
  Calendar,
  Zap,
  Target,
  Rocket,
  Heart,
  ExternalLink,
  GraduationCap,
  Globe,
  Database,
  Monitor,
} from "lucide-react"

export function AboutModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [animatedSkills, setAnimatedSkills] = useState({})

  const skills = [
    { name: "Python & AI/ML", level: 95, color: "from-emerald-400 to-teal-500", icon: Brain },
    { name: "React & Next.js", level: 92, color: "from-cyan-400 to-blue-500", icon: Code },
    { name: "Computer Vision", level: 90, color: "from-violet-400 to-purple-500", icon: Zap },
    { name: "Backend Development", level: 88, color: "from-orange-400 to-red-500", icon: Database },
    { name: "Cloud & DevOps", level: 85, color: "from-pink-400 to-rose-500", icon: Rocket },
    { name: "UI/UX Design", level: 82, color: "from-amber-400 to-yellow-500", icon: Monitor },
  ]

  const achievements = [
    { title: "W.E.A.L.T.H Platform", desc: "Financial management app with 8+ modules", icon: Target },
    { title: "Real-time Analytics", desc: "15+ interactive visualizations", icon: Zap },
    { title: "System Optimization", desc: "Sub-2-second load times", icon: Rocket },
    { title: "Open Source", desc: "Contributing to tech community", icon: Heart },
  ]

  const certifications = [
    { name: "Foundations of AI and ML", provider: "Microsoft", year: "2024" },
    { name: "Generative AI with LLMs", provider: "AWS", year: "2024" },
    { name: "Neural Networks & Deep Learning", provider: "DeepLearning.AI", year: "2025" },
  ]

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        skills.forEach((skill, index) => {
          setTimeout(() => {
            setAnimatedSkills((prev) => ({
              ...prev,
              [skill.name]: skill.level,
            }))
          }, index * 200)
        })
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setAnimatedSkills({})
    }
  }, [isOpen])

  const handleLinkClick = (url) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 right-4 z-50 border-slate-600/50 hover:bg-slate-800/80 bg-slate-900/60 backdrop-blur-xl hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <User className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl bg-slate-900/95 backdrop-blur-2xl border-slate-700/50 text-slate-100 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-cyan-500/5 to-violet-500/5 rounded-lg"></div>

        <DialogHeader className="text-center pb-6 relative z-10">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
            Arhaan Girdhar
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-lg">
            AI/ML Engineer & Full-Stack Developer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 relative z-10">
          {/* Hero Section */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-violet-500/10 rounded-2xl blur-xl"></div>
            <Card className="relative bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-slate-700/50 backdrop-blur-sm">
                      <img
                        src="/images/pfp.png"
                        alt="Arhaan Girdhar"
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </div>

                  <div className="flex-1 text-center lg:text-left">
                    <h3 className="text-3xl font-bold text-slate-100 mb-3">Computer Science & AI/ML Student</h3>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-4 text-slate-300">
                      <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm px-3 py-1 rounded-full">
                        <GraduationCap className="w-4 h-4 text-emerald-400" />
                        <span>MIT Manipal</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm px-3 py-1 rounded-full">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        <span>India</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm px-3 py-1 rounded-full">
                        <Calendar className="w-4 h-4 text-violet-400" />
                        <span>Available</span>
                      </div>
                    </div>
                    <p className="text-slate-300 text-lg leading-relaxed mb-6">
                      Passionate about creating intelligent solutions that bridge AI and real-world applications.
                      Currently working on <span className="text-emerald-400 font-semibold">DriveMind</span> - a
                      reinforcement learning-based smart navigation system. Specialized in{" "}
                      <span className="text-cyan-400 font-semibold">deep learning</span>,
                      <span className="text-violet-400 font-semibold"> multi-modal inference</span>, and
                      <span className="text-orange-400 font-semibold"> real-time optimization</span>.
                    </p>

                    {/* Quick Highlights */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/30">
                        <div className="text-2xl font-bold text-emerald-400">3+</div>
                        <div className="text-xs text-slate-400">Years Coding</div>
                      </div>
                      <div className="text-center p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/30">
                        <div className="text-2xl font-bold text-cyan-400">15+</div>
                        <div className="text-xs text-slate-400">Projects Built</div>
                      </div>
                      <div className="text-center p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/30">
                        <div className="text-2xl font-bold text-violet-400">10+</div>
                        <div className="text-xs text-slate-400">Certifications</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skills Section */}
          <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
            <CardContent className="p-6">
              <h4 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                  <Code className="w-5 h-5 text-white" />
                </div>
                Technical Expertise
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {skills.map((skill, index) => {
                  const Icon = skill.icon
                  return (
                    <div key={skill.name} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 bg-gradient-to-r ${skill.color} rounded-lg`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-slate-300 font-medium">{skill.name}</span>
                        </div>
                        <span className="text-sm text-slate-400 font-mono">{skill.level}%</span>
                      </div>
                      <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                        <div
                          className={`h-full bg-gradient-to-r ${skill.color} transition-all duration-1000 ease-out shadow-lg`}
                          style={{
                            width: `${animatedSkills[skill.name] || 0}%`,
                            transitionDelay: `${index * 200}ms`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Education & Certifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
              <CardContent className="p-6">
                <h4 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  Education
                </h4>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-700/30 rounded-xl backdrop-blur-sm border border-slate-600/30">
                    <h5 className="font-semibold text-slate-100">B.Tech Computer Science & Engineering (AI & ML)</h5>
                    <p className="text-violet-400 font-medium">Manipal Institute of Technology</p>
                    <p className="text-slate-400 text-sm">2022 - 2026 (Expected)</p>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-xl backdrop-blur-sm border border-slate-600/30">
                    <h5 className="font-semibold text-slate-100">STD X & XII</h5>
                    <p className="text-violet-400 font-medium">Delhi Public School Rajnagar</p>
                    <p className="text-slate-400 text-sm">2020 - 2022</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
              <CardContent className="p-6">
                <h4 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  Certifications
                </h4>
                <div className="space-y-3">
                  {certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-700/30 rounded-lg backdrop-blur-sm border border-slate-600/30"
                    >
                      <h5 className="font-medium text-slate-100 text-sm">{cert.name}</h5>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-orange-400 text-sm">{cert.provider}</p>
                        <span className="text-slate-400 text-xs">{cert.year}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon
              return (
                <Card
                  key={achievement.title}
                  className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 hover:bg-slate-700/50 transition-all duration-300 hover:scale-105 shadow-xl"
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-cyan-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h5 className="font-semibold text-slate-100 mb-1">{achievement.title}</h5>
                    <p className="text-sm text-slate-400">{achievement.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Contact Section */}
          <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
            <CardContent className="p-6">
              <h4 className="text-2xl font-bold text-slate-100 mb-6 text-center">Let's Connect & Collaborate</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => handleLinkClick("https://github.com/17arhaan")}
                  variant="outline"
                  className="border-slate-600/50 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 group backdrop-blur-sm"
                >
                  <Github className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  GitHub
                  <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
                <Button
                  onClick={() => handleLinkClick("https://linkedin.com/in/arhaan17")}
                  variant="outline"
                  className="border-slate-600/50 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 group backdrop-blur-sm"
                >
                  <Linkedin className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  LinkedIn
                  <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
                <Button
                  onClick={() => handleLinkClick("https://www.arhaanportfolio.in")}
                  variant="outline"
                  className="border-slate-600/50 hover:bg-violet-500/20 hover:border-violet-500/50 transition-all duration-300 group backdrop-blur-sm"
                >
                  <Globe className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Portfolio
                  <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center py-6 border-t border-slate-700/50 backdrop-blur-sm">
            <p className="text-slate-400 mb-2 flex items-center justify-center gap-2">
              Built with <Heart className="w-4 h-4 text-red-400 animate-pulse" /> for automotive safety and innovation
            </p>
            <p className="text-sm text-slate-500">
              © 2024 Arhaan Girdhar - Dedicated to saving lives through technology
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
