import cv2
import numpy as np
import dlib
from typing import Dict, Tuple, Optional
import base64
from io import BytesIO
from PIL import Image

class DrowsinessDetector:
    def __init__(self):
        # Initialize face detector and facial landmark predictor
        self.face_detector = dlib.get_frontal_face_detector()
        self.landmark_predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
        
        # Constants for drowsiness detection
        self.EAR_THRESHOLD = 0.25  # Eye Aspect Ratio threshold
        self.MAR_THRESHOLD = 0.5   # Mouth Aspect Ratio threshold
        self.CONSECUTIVE_FRAMES = 3  # Number of consecutive frames for drowsiness detection
        
        # Initialize counters
        self.blink_counter = 0
        self.yawn_counter = 0
        
    def _decode_base64_image(self, image_data: str) -> np.ndarray:
        """Convert base64 image to numpy array."""
        try:
            # Remove the data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode base64 string
            image_bytes = base64.b64decode(image_data)
            image = Image.open(BytesIO(image_bytes))
            return np.array(image)
        except Exception as e:
            raise ValueError(f"Error decoding image: {str(e)}")

    def _calculate_ear(self, landmarks) -> float:
        """Calculate Eye Aspect Ratio."""
        # Extract eye landmarks
        left_eye = np.array([(landmarks.part(36+i).x, landmarks.part(36+i).y) for i in range(6)])
        right_eye = np.array([(landmarks.part(42+i).x, landmarks.part(42+i).y) for i in range(6)])
        
        # Calculate EAR for both eyes
        left_ear = self._get_ear(left_eye)
        right_ear = self._get_ear(right_eye)
        
        # Return average EAR
        return (left_ear + right_ear) / 2.0

    def _get_ear(self, eye_points) -> float:
        """Calculate EAR for a single eye."""
        # Compute vertical distances
        v1 = np.linalg.norm(eye_points[1] - eye_points[5])
        v2 = np.linalg.norm(eye_points[2] - eye_points[4])
        
        # Compute horizontal distance
        h = np.linalg.norm(eye_points[0] - eye_points[3])
        
        # Calculate EAR
        ear = (v1 + v2) / (2.0 * h)
        return ear

    def _calculate_mar(self, landmarks) -> float:
        """Calculate Mouth Aspect Ratio."""
        # Extract mouth landmarks
        mouth_points = np.array([(landmarks.part(48+i).x, landmarks.part(48+i).y) for i in range(12)])
        
        # Calculate vertical distances
        v1 = np.linalg.norm(mouth_points[3] - mouth_points[9])
        v2 = np.linalg.norm(mouth_points[2] - mouth_points[10])
        v3 = np.linalg.norm(mouth_points[4] - mouth_points[8])
        
        # Calculate horizontal distance
        h = np.linalg.norm(mouth_points[0] - mouth_points[6])
        
        # Calculate MAR
        mar = (v1 + v2 + v3) / (2.0 * h)
        return mar

    def _detect_phone(self, frame: np.ndarray) -> bool:
        """Detect if a phone is being used."""
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Apply edge detection
        edges = cv2.Canny(gray, 50, 150)
        
        # Look for rectangular shapes that might be phones
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = float(w)/h
            
            # Phones typically have an aspect ratio between 0.5 and 2.0
            if 0.5 <= aspect_ratio <= 2.0 and w > 50 and h > 50:
                return True
        return False

    def _get_gaze_direction(self, landmarks) -> str:
        """Determine gaze direction based on eye landmarks."""
        # Get eye center points
        left_eye_center = np.mean([(landmarks.part(36+i).x, landmarks.part(36+i).y) for i in range(6)], axis=0)
        right_eye_center = np.mean([(landmarks.part(42+i).x, landmarks.part(42+i).y) for i in range(6)], axis=0)
        
        # Get face center
        face_center = np.mean([(landmarks.part(i).x, landmarks.part(i).y) for i in range(17)], axis=0)
        
        # Calculate horizontal offset
        offset = (left_eye_center[0] + right_eye_center[0])/2 - face_center[0]
        
        if offset < -10:
            return "left"
        elif offset > 10:
            return "right"
        else:
            return "forward"

    def process_frame(self, image_data: str) -> Dict:
        """Process a single frame and return drowsiness metrics."""
        try:
            # Decode image
            frame = self._decode_base64_image(image_data)
            
            # Convert to grayscale
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_detector(gray)
            
            if len(faces) == 0:
                return {
                    "drowsinessScore": 0,
                    "earValue": 0,
                    "isYawning": False,
                    "isPhoneDetected": False,
                    "gazeDirection": "unknown",
                    "blinkDetected": False,
                    "error": "No face detected"
                }
            
            # Get landmarks for the first face
            landmarks = self.landmark_predictor(gray, faces[0])
            
            # Calculate metrics
            ear = self._calculate_ear(landmarks)
            mar = self._calculate_mar(landmarks)
            is_phone = self._detect_phone(frame)
            gaze = self._get_gaze_direction(landmarks)
            
            # Update counters
            if ear < self.EAR_THRESHOLD:
                self.blink_counter += 1
            else:
                self.blink_counter = 0
                
            if mar > self.MAR_THRESHOLD:
                self.yawn_counter += 1
            else:
                self.yawn_counter = 0
            
            # Calculate drowsiness score (0-100)
            drowsiness_score = min(100, (self.blink_counter + self.yawn_counter) * 20)
            
            return {
                "drowsinessScore": drowsiness_score,
                "earValue": float(ear),
                "isYawning": mar > self.MAR_THRESHOLD,
                "isPhoneDetected": is_phone,
                "gazeDirection": gaze,
                "blinkDetected": ear < self.EAR_THRESHOLD
            }
            
        except Exception as e:
            return {
                "drowsinessScore": 0,
                "earValue": 0,
                "isYawning": False,
                "isPhoneDetected": False,
                "gazeDirection": "unknown",
                "blinkDetected": False,
                "error": str(e)
            } 