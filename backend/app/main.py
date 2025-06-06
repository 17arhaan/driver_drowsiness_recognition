from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv
import random

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Driver Drowsiness Detection API",
    description="API for detecting driver drowsiness using computer vision",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:3000",  # Local development
    "http://localhost:3001",  # Local development alternative port
    "http://localhost:8000",  # Local development alternative port
    "https://driver-drowsiness-recognition.vercel.app",  # Production Vercel domain
    "https://driver-drowsiness-recognition-mmo2oays1-arhaan17.vercel.app",  # Deployed Vercel domain
    "https://driver-drowsiness-recognition-gg2ra3d2n-arhaan17.vercel.app",  # New Vercel deployment
    "https://*.vercel.app",  # Any Vercel preview deployments
    "http://localhost:*",  # Allow any localhost port during development
    "https://backend-drowsiness-project-production.up.railway.app",  # Production Railway backend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,  # Changed to False since we're using credentials: 'omit'
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600
)

class HealthCheck(BaseModel):
    status: str = "healthy"

class FrameData(BaseModel):
    image: str

@app.get("/")
async def root():
    return {"message": "Driver Drowsiness Detection API is running"}

@app.get("/health", response_model=HealthCheck)
async def health_check():
    return HealthCheck()

@app.post("/process_frame")
async def process_frame(frame_data: FrameData):
    try:
        # Validate the image data
        if not frame_data.image:
            raise HTTPException(status_code=400, detail="No image data provided")
            
        # For now, return a mock response with some variation
        return {
            "drowsinessScore": random.randint(0, 100),
            "earValue": random.uniform(0.2, 0.4),
            "isYawning": random.choice([True, False]),
            "isPhoneDetected": random.choice([True, False]),
            "gazeDirection": random.choice(["forward", "left", "right"]),
            "blinkDetected": random.choice([True, False])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True) 