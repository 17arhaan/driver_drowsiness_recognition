"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DrowsinessProgress } from "./components/drowsiness-progress"
import { AboutModal } from "./components/about-modal"
import {
  Eye,
  EyeOff,
  Phone,
  AlertTriangle,
  Activity,
  Camera,
  Cpu,
  Wifi,
  Battery,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  VideoOff,
  Clock,
  Bell,
} from "lucide-react"

const PYTHON_BACKEND_URL = "https://driver-drowsiness-recognition-backend.up.railway.app/process_frame?t=" + Date.now()
const PYTHON_HEALTH_CHECK_URL = "https://driver-drowsiness-recognition-backend.up.railway.app/health?t=" + Date.now()

export default function DrowsinessDetectionDashboard() {
  const [isActive, setIsActive] = useState(false)
  const [drowsinessScore, setDrowsinessScore] = useState(0)
  const [smoothedDrowsinessScore, setSmoothedDrowsinessScore] = useState(0)
  const [earValue, setEarValue] = useState(0.3)
  const [isYawning, setIsYawning] = useState(false)
  const [isPhoneDetected, setIsPhoneDetected] = useState(false)
  const [gazeDirection, setGazeDirection] = useState("forward")
  const [alertActive, setAlertActive] = useState(false)
  const [isBlinking, setIsBlinking] = useState(false)

  const [fps, setFps] = useState(0)
  const [cpuUsage, setCpuUsage] = useState(0)
  const [batteryLevel, setBatteryLevel] = useState(null) // Initialize to null or a placeholder
  const [isBatteryApiSupported, setIsBatteryApiSupported] = useState(true)
  const [isConnectedToBackend, setIsConnectedToBackend] = useState(false)

  const [audioEnabled, setAudioEnabled] = useState(true)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [earThreshold, setEarThreshold] = useState([0.25])
  const [alertDelay, setAlertDelay] = useState([1.5])
  const [distractionThreshold, setDistractionThreshold] = useState([2.0])

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const requestRef = useRef()
  const [isCameraError, setIsCameraError] = useState(false)
  const [backendErrorMessage, setBackendErrorMessage] = useState("Checking backend status...") // Initial message

  const [memoryUsage, setMemoryUsage] = useState(0)
  const [alertHistory, setAlertHistory] = useState([])
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [totalAlerts, setTotalAlerts] = useState(0)
  const [averageScore, setAverageScore] = useState(0)

  const performBackendHealthCheck = useCallback(async () => {
    console.log("[FRONTEND] Performing backend health check to:", PYTHON_HEALTH_CHECK_URL)
    setBackendErrorMessage("Attempting to connect to backend...")
    try {
      const response = await fetch(PYTHON_HEALTH_CHECK_URL, { cache: "no-store" }) // no-store to prevent caching issues
      if (response.ok) {
        const data = await response.json()
        console.log("[FRONTEND] Backend health check successful:", data)
        setIsConnectedToBackend(true)
        setBackendErrorMessage("") // Clear error on success
      } else {
        console.error("[FRONTEND] Backend health check failed. Status:", response.status)
        setIsConnectedToBackend(false)
        setBackendErrorMessage(
          `Backend not responding at ${PYTHON_HEALTH_CHECK_URL} (Status: ${response.status}). Is it running?`,
        )
      }
    } catch (error) {
      console.error("[FRONTEND] Error during backend health check (fetch failed):", error)
      setIsConnectedToBackend(false)
      setBackendErrorMessage(
        `Failed to connect to backend at ${PYTHON_HEALTH_CHECK_URL}. Is the Python server running and accessible? Details: ${error.message}`,
      )
    }
  }, [])

  useEffect(() => {
    performBackendHealthCheck() // Check on mount
  }, [performBackendHealthCheck])

  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2 || !isActive) {
      if (isActive) requestRef.current = requestAnimationFrame(processFrame)
      return
    }

    const videoNode = videoRef.current
    const canvasNode = canvasRef.current

    canvasNode.width = videoNode.videoWidth
    canvasNode.height = videoNode.videoHeight
    const ctx = canvasNode.getContext("2d")
    ctx.drawImage(videoNode, 0, 0, videoNode.videoWidth, videoNode.videoHeight)

    const imageDataUrl = canvasNode.toDataURL("image/jpeg", 0.7)

    try {
      const startTime = performance.now()
      const response = await fetch(PYTHON_BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageDataUrl }),
      })

      const endTime = performance.now()
      const currentFps = 1000 / (endTime - startTime)
      setFps((prevFps) => prevFps * 0.9 + currentFps * 0.1)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[FRONTEND] Backend error on /process_frame:", response.status, errorText)
        setBackendErrorMessage(`Backend error: ${response.status}. ${errorText.substring(0, 100)}`)
        setIsConnectedToBackend(false) // Assume disconnected on error
      } else {
        const data = await response.json()
        if (data.error) {
          console.error("[FRONTEND] Backend processing error:", data.error)
          setBackendErrorMessage(`Backend processing error: ${data.error}`)
        } else {
          setDrowsinessScore(data.drowsinessScore)
          setEarValue(data.earValue)
          setIsYawning(data.isYawning)
          setIsPhoneDetected(data.isPhoneDetected)
          setGazeDirection(data.gazeDirection)
          setIsBlinking(data.blinkDetected)
          setAlertActive(data.drowsinessScore > 75)
          if (backendErrorMessage) setBackendErrorMessage("") // Clear error if processing succeeds
          if (!isConnectedToBackend) setIsConnectedToBackend(true) // Mark as connected if it wasn't
        }
      }
    } catch (error) {
      console.error("[FRONTEND] Error sending frame to backend (fetch failed):", error)
      setBackendErrorMessage(`Failed to fetch from backend: ${error.message}. Is it running at ${PYTHON_BACKEND_URL}?`)
      setIsConnectedToBackend(false)
    }

    if (isActive) {
      requestRef.current = requestAnimationFrame(processFrame)
    }
  }, [isActive, backendErrorMessage, isConnectedToBackend, performBackendHealthCheck]) // Added performBackendHealthCheck if needed for re-check

  useEffect(() => {
    if (isActive) {
      setIsCameraError(false)
      // Attempt health check again before starting camera if not connected
      if (!isConnectedToBackend) {
        performBackendHealthCheck().then(() => {
          // Only proceed if health check is now successful
          if (isConnectedToBackend) {
            startCameraAndProcessing()
          } else {
            setIsActive(false) // Keep system off if backend still not reachable
          }
        })
      } else {
        startCameraAndProcessing()
      }
    } else {
      // Cleanup when isActive becomes false
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
        videoRef.current.srcObject = null
      }
      setFps(0)
    }

    return () => {
      // Cleanup on unmount or when isActive changes
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]) // isConnectedToBackend removed from here to avoid loop, managed inside.

  const startCameraAndProcessing = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            if (isActive) {
              // Double check isActive
              requestRef.current = requestAnimationFrame(processFrame)
            }
          }
        }
      })
      .catch((err) => {
        console.error("[FRONTEND] Error accessing camera:", err)
        setIsCameraError(true)
        setIsActive(false)
      })
  }

  useEffect(() => {
    if (drowsinessScore > 75 && isActive) {
      const alertElement = document.querySelector(".drowsiness-alert")
      if (alertElement) {
        alertElement.classList.add("show")
        alertElement.classList.add("animate-pulse")
      }
    } else {
      const alertElement = document.querySelector(".drowsiness-alert")
      if (alertElement) {
        alertElement.classList.remove("show")
        alertElement.classList.remove("animate-pulse")
      }
    }
  }, [drowsinessScore, isActive])

  // Add debounced alert state
  const [debouncedAlertActive, setDebouncedAlertActive] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAlertActive(alertActive)
    }, 300) // 300ms debounce
    return () => clearTimeout(timer)
  }, [alertActive])

  const toggleSystem = () => {
    setIsActive((prevIsActive) => !prevIsActive)
    if (isActive) {
      // Means it's being turned OFF
      setDrowsinessScore(0)
      setAlertActive(false)
      setEarValue(0.3)
      setIsYawning(false)
      setIsPhoneDetected(false)
      setGazeDirection("forward")
      // Don't clear backendErrorMessage here, let health check manage it
    } else {
      // Means it's being turned ON
      performBackendHealthCheck() // Check health again when user tries to start
    }
  }

  const resetSystem = () => {
    setIsActive(false)
    setDrowsinessScore(0)
    setEarValue(0.3)
    setIsYawning(false)
    setIsPhoneDetected(false)
    setGazeDirection("forward")
    setAlertActive(false)
    setIsCameraError(false)
    setBackendErrorMessage("")
    setFps(0)
    performBackendHealthCheck() // Check health on reset
  }

  useEffect(() => {
    let batteryManager = null

    const updateBatteryStatus = (battery) => {
      if (battery) {
        setBatteryLevel(Math.round(battery.level * 100))
        // You can also get battery.charging, battery.chargingTime, battery.dischargingTime
      }
    }

    const handleBatteryChanges = (event) => {
      updateBatteryStatus(event.target)
    }

    if ("getBattery" in navigator) {
      navigator
        .getBattery()
        .then((battery) => {
          batteryManager = battery
          updateBatteryStatus(batteryManager)

          batteryManager.addEventListener("levelchange", handleBatteryChanges)
          batteryManager.addEventListener("chargingchange", handleBatteryChanges)
          // batteryManager.addEventListener("chargingtimechange", handleBatteryChanges);
          // batteryManager.addEventListener("dischargingtimechange", handleBatteryChanges);
        })
        .catch((err) => {
          console.error("Error getting battery status:", err)
          setIsBatteryApiSupported(false)
          setBatteryLevel(null) // Or set to a "N/A" indicator
        })
    } else {
      console.warn("Battery Status API not supported.")
      setIsBatteryApiSupported(false)
      setBatteryLevel(null) // Or set to a "N/A" indicator
    }

    return () => {
      if (batteryManager) {
        batteryManager.removeEventListener("levelchange", handleBatteryChanges)
        batteryManager.removeEventListener("chargingchange", handleBatteryChanges)
        // batteryManager.removeEventListener("chargingtimechange", handleBatteryChanges);
        // batteryManager.removeEventListener("dischargingtimechange", handleBatteryChanges);
      }
    }
  }, [])

  // Add smoothing effect for drowsiness score
  useEffect(() => {
    const smoothingFactor = 0.3 // Adjust this value between 0 and 1 (lower = smoother)
    const timer = setTimeout(() => {
      setSmoothedDrowsinessScore(prev => 
        prev + (drowsinessScore - prev) * smoothingFactor
      )
    }, 50) // Update every 50ms
    return () => clearTimeout(timer)
  }, [drowsinessScore])

  // Add this effect to track session duration
  useEffect(() => {
    if (isActive && !sessionStartTime) {
      setSessionStartTime(new Date())
    } else if (!isActive) {
      setSessionStartTime(null)
    }
  }, [isActive])

  // Add this effect to track alerts
  useEffect(() => {
    if (alertActive) {
      setTotalAlerts(prev => prev + 1)
      setAlertHistory(prev => [{
        type: "Drowsiness Alert",
        description: "Eye closure detected for 3 seconds",
        timestamp: new Date()
      }, ...prev].slice(0, 10))
    }
  }, [alertActive])

  // Add this effect to calculate average score
  useEffect(() => {
    if (drowsinessScore > 0) {
      setAverageScore(prev => (prev + drowsinessScore) / 2)
    }
  }, [drowsinessScore])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div
        className={`max-w-7xl mx-auto space-y-6 page-container ${drowsinessScore > 75 && isActive ? "critical-alert" : ""}`}
      >
        <AboutModal />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Drowsiness Monitor</h1>
            <p className="text-gray-400">Real-time drowsiness and distraction detection system</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant={isConnectedToBackend ? "default" : "destructive"}
              className={`flex items-center gap-1 ${isConnectedToBackend ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600"}`}
            >
              <Wifi className="w-3 h-3" />
              {isConnectedToBackend ? "Backend Connected" : "Backend Disconnected"}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 border-gray-600 text-gray-300">
              <Battery className="w-3 h-3" />
              {batteryLevel !== null ? `${batteryLevel}%` : "N/A"}
            </Badge>
          </div>
        </div>

        {isCameraError && (
          <Alert variant="destructive">
            <VideoOff className="h-4 w-4" />
            <AlertTitle>Camera Error</AlertTitle>
            <AlertDescription>
              Could not access the camera. Please check permissions and ensure no other application is using it.
            </AlertDescription>
          </Alert>
        )}
        {backendErrorMessage &&
          !isCameraError && ( // Only show backend error if no camera error
            <Alert
              variant={isConnectedToBackend ? "default" : "destructive"}
              className={isConnectedToBackend ? "border-blue-500 bg-blue-950/50" : ""}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{isConnectedToBackend ? "Backend Status" : "Backend Issue"}</AlertTitle>
              <AlertDescription>{backendErrorMessage}</AlertDescription>
            </Alert>
          )}

        {debouncedAlertActive && (
          <Alert className="border-red-500 bg-red-950/50 backdrop-blur drowsiness-alert">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-red-300">DROWSINESS ALERT</AlertTitle>
            <AlertDescription className="text-red-400">
              Driver appears drowsy. Please pull over safely and take a break.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="monitor" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900 border-gray-700">
            <TabsTrigger value="monitor" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              Live Monitor
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              Settings
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              System Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitor" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Camera className="w-5 h-5" />
                      Live Camera Feed
                    </CardTitle>
                    <CardDescription className="text-gray-400">Real-time face and landmark detection</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={toggleSystem}
                      variant={isActive ? "destructive" : "default"}
                      className="flex items-center gap-2"
                      disabled={!isConnectedToBackend && !isActive} // Disable start if backend not connected
                    >
                      {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isActive ? "Stop" : "Start"}
                    </Button>
                    <Button
                      onClick={resetSystem}
                      variant="outline"
                      size="icon"
                      className="border-gray-600 hover:bg-gray-800"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className="relative bg-black rounded-lg overflow-hidden border border-gray-800"
                    style={{ aspectRatio: "16/9" }}
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ display: isActive ? "block" : "none" }}
                    />
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                    {!isActive && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white text-center">
                          <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">Camera Inactive</p>
                          <p className="text-sm opacity-75">
                            {isConnectedToBackend
                              ? "Click Start to begin monitoring"
                              : "Backend not connected. Please start Python server."}
                          </p>
                        </div>
                      </div>
                    )}
                    {isActive && videoRef.current?.srcObject && (
                      <div className="absolute top-4 right-4 bg-black/50 p-2 rounded">
                        <p className="text-xs text-white">FPS: {fps.toFixed(1)}</p>
                      </div>
                    )}
                    {isActive && (
                      <>
                        <div className="absolute top-4 left-4 space-y-2">
                          <Badge
                            variant={earValue < earThreshold[0] ? "destructive" : "default"}
                            className="bg-gray-800/80 backdrop-blur transition-all duration-300"
                          >
                            EAR: {earValue.toFixed(3)}
                          </Badge>
                          {isYawning && (
                            <Badge variant="secondary" className="bg-yellow-600/80 text-yellow-100 backdrop-blur">
                              Yawning Detected
                            </Badge>
                          )}
                          {isPhoneDetected && (
                            <Badge variant="destructive" className="bg-red-600/80 backdrop-blur">
                              Phone Detected
                            </Badge>
                          )}
                          <Badge
                            variant={gazeDirection === "forward" ? "default" : "secondary"}
                            className="bg-gray-800/80 backdrop-blur"
                          >
                            Gaze: {gazeDirection}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Activity className="w-5 h-5" />
                      Drowsiness Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div
                          className={`text-4xl font-bold transition-all duration-300 ease-out ${
                            smoothedDrowsinessScore > 75
                              ? "text-red-400"
                              : smoothedDrowsinessScore > 40
                                ? "text-yellow-400"
                                : "text-green-400"
                          }`}
                        >
                          {Math.round(smoothedDrowsinessScore)}
                        </div>
                        <p className="text-sm text-gray-400">out of 100</p>
                      </div>
                      <DrowsinessProgress value={smoothedDrowsinessScore} className="h-3" />
                      <div className="text-xs text-center text-gray-400">
                        {smoothedDrowsinessScore <= 30 ? "Alert" : smoothedDrowsinessScore <= 70 ? "Moderate Risk" : "High Risk"}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Detection Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {earValue < earThreshold[0] ? (
                          <EyeOff className="w-4 h-4 text-gray-300" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-300" />
                        )}
                        <span className="text-sm text-gray-300">Eyes</span>
                      </div>
                      <Badge
                        variant={earValue < earThreshold[0] ? "destructive" : "default"}
                        className={earValue < earThreshold[0] ? "bg-red-600" : "bg-green-600"}
                      >
                        {earValue < earThreshold[0] ? "Closed" : "Open"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-300" />
                        <span className="text-sm text-gray-300">Blinking</span>
                      </div>
                      <Badge
                        variant={isBlinking ? "secondary" : "default"}
                        className={isBlinking ? "bg-yellow-600" : "bg-green-600"}
                      >
                        {isBlinking ? "Rapid" : "Normal"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-300" />
                        <span className="text-sm text-gray-300">Phone Usage</span>
                      </div>
                      <Badge
                        variant={isPhoneDetected ? "destructive" : "default"}
                        className={isPhoneDetected ? "bg-red-600" : "bg-green-600"}
                      >
                        {isPhoneDetected ? "Detected" : "None"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-300" />
                        <span className="text-sm text-gray-300">Yawning</span>
                      </div>
                      <Badge
                        variant={isYawning ? "secondary" : "default"}
                        className={isYawning ? "bg-yellow-600" : "bg-green-600"}
                      >
                        {isYawning ? "Detected" : "None"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Alert System</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {audioEnabled ? (
                          <Volume2 className="w-4 h-4 text-gray-300" />
                        ) : (
                          <VolumeX className="w-4 h-4 text-gray-300" />
                        )}
                        <Label htmlFor="audio" className="text-gray-300">
                          Audio Alerts
                        </Label>
                      </div>
                      <Switch id="audio" checked={audioEnabled} onCheckedChange={setAudioEnabled} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-300" />
                        <Label htmlFor="vibration" className="text-gray-300">
                          Vibration
                        </Label>
                      </div>
                      <Switch id="vibration" checked={vibrationEnabled} onCheckedChange={setVibrationEnabled} />
                    </div>
                    {alertActive && (
                      <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg backdrop-blur">
                        <div className="flex items-center gap-2 text-red-300">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium">Alert Active</span>
                        </div>
                        <p className="text-sm text-red-400 mt-1">Driver attention required</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Alerts Today</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{totalAlerts}</div>
                  <p className="text-xs text-gray-400">Alerts in current session</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Average Drowsiness Score</CardTitle>
                  <Activity className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{Math.round(averageScore)}%</div>
                  <p className="text-xs text-gray-400">Current session average</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Most Common Alert</CardTitle>
                  <EyeOff className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">Eye Closure</div>
                  <p className="text-xs text-gray-400">Primary detection method</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Session Duration</CardTitle>
                  <Clock className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {sessionStartTime ? Math.round((new Date() - sessionStartTime) / 1000 / 60) : 0}m
                  </div>
                  <p className="text-xs text-gray-400">Current session</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Alert History</CardTitle>
                <CardDescription>Recent drowsiness alerts and their causes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alertHistory.map((alert, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        <div>
                          <p className="font-medium text-white">{alert.type}</p>
                          <p className="text-sm text-gray-400">{alert.description}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {Math.round((new Date() - alert.timestamp) / 1000 / 60)}m ago
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Detection Thresholds</CardTitle>
                  <CardDescription className="text-gray-400">
                    Adjust sensitivity for drowsiness detection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">Eye Closure Threshold (EAR)</Label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0.15"
                          max="0.35"
                          step="0.01"
                          value={earThreshold[0]}
                          onChange={(e) => setEarThreshold([parseFloat(e.target.value)])}
                          className="w-full"
                        />
                        <span className="text-sm text-gray-400">{earThreshold[0].toFixed(2)}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300">Alert Delay (seconds)</Label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0.5"
                          max="3"
                          step="0.1"
                          value={alertDelay[0]}
                          onChange={(e) => setAlertDelay([parseFloat(e.target.value)])}
                          className="w-full"
                        />
                        <span className="text-sm text-gray-400">{alertDelay[0].toFixed(1)}s</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300">Distraction Threshold</Label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.1"
                          value={distractionThreshold[0]}
                          onChange={(e) => setDistractionThreshold([parseFloat(e.target.value)])}
                          className="w-full"
                        />
                        <span className="text-sm text-gray-400">{distractionThreshold[0].toFixed(1)}s</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Alert Preferences</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure how you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-gray-300" />
                        <Label htmlFor="audio" className="text-gray-300">
                          Audio Alerts
                        </Label>
                      </div>
                      <Switch id="audio" checked={audioEnabled} onCheckedChange={setAudioEnabled} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-300" />
                        <Label htmlFor="vibration" className="text-gray-300">
                          Vibration
                        </Label>
                      </div>
                      <Switch id="vibration" checked={vibrationEnabled} onCheckedChange={setVibrationEnabled} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-gray-300" />
                        <Label htmlFor="notifications" className="text-gray-300">
                          Desktop Notifications
                        </Label>
                      </div>
                      <Switch id="notifications" checked={true} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Cpu className="w-5 h-5" />
                    Hardware Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Frontend FPS</span>
                    <span className="text-sm font-medium text-white">{fps.toFixed(1)} FPS</span>
                  </div>
                  <Progress value={Math.min(fps, 60)} max={60} className="h-2 bg-gray-800 [&>div]:bg-blue-500" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">CPU Usage</span>
                    <span className="text-sm font-medium text-white">{cpuUsage}%</span>
                  </div>
                  <Progress value={cpuUsage} max={100} className="h-2 bg-gray-800 [&>div]:bg-green-500" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Memory Usage</span>
                    <span className="text-sm font-medium text-white">{memoryUsage}%</span>
                  </div>
                  <Progress value={memoryUsage} max={100} className="h-2 bg-gray-800 [&>div]:bg-yellow-500" />
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Wifi className="w-5 h-5" />
                    Network Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Backend Connection</span>
                    <Badge variant={isConnectedToBackend ? "default" : "destructive"}>
                      {isConnectedToBackend ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">API Response Time</span>
                    <span className="text-sm font-medium text-white">{(1000/fps).toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Backend Status</span>
                    <Badge variant="outline" className="border-gray-600">
                      {backendErrorMessage ? "Error" : "Healthy"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Battery className="w-5 h-5" />
                    Power Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Battery Level</span>
                    <span className="text-sm font-medium text-white">{batteryLevel !== null ? `${batteryLevel}%` : "N/A"}</span>
                  </div>
                  <Progress 
                    value={batteryLevel || 0} 
                    max={100} 
                    className="h-2 bg-gray-800 [&>div]:bg-blue-500" 
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Power Mode</span>
                    <Badge variant="outline" className="border-gray-600">
                      Balanced
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
