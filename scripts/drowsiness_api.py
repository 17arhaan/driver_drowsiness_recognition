from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import dlib
import numpy as np
from scipy.spatial import distance as dist
import base64
import os # For path joining
from math import atan2, cos, sin, sqrt, pi

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# --- Health Check Endpoint (defined early, independent of models) ---
@app.route('/health', methods=['GET'])
def health_check():
    print("[PYTHON_BACKEND] /health endpoint was called successfully.")
    return jsonify({"status": "Python backend is healthy and reachable!"}), 200

# --- Configuration & Model Loading ---
DLIB_SHAPE_PREDICTOR_FILENAME = "shape_predictor_68_face_landmarks.dat"
DLIB_SHAPE_PREDICTOR_PATH = os.path.join(os.path.dirname(__file__), DLIB_SHAPE_PREDICTOR_FILENAME)

detector = None
predictor = None
dlib_models_loaded_successfully = False

# Fine-tuned thresholds
EAR_THRESHOLD = 0.25  # Increased from 0.23 for better accuracy
EAR_CONSEC_FRAMES = 8  # Reduced from 10 for faster response
MAR_THRESHOLD = 0.35  # Reduced from 0.4 for better yawn detection
YAWN_CONSEC_FRAMES = 12  # Reduced from 15 for faster response
BLINK_THRESHOLD = 0.2  # New threshold for blink detection
BLINK_CONSEC_FRAMES = 3  # New threshold for consecutive blinks

# State tracking
ear_counter = 0
yawn_counter = 0
blink_counter = 0
last_ear_values = []  # Store last N EAR values for smoothing
last_mar_values = []  # Store last N MAR values for smoothing
SMOOTHING_WINDOW = 5  # Number of frames to average for smoothing

print("[PYTHON_BACKEND] Attempting to load Dlib models...")
try:
    if not os.path.exists(DLIB_SHAPE_PREDICTOR_PATH):
        print(f"[PYTHON_BACKEND] CRITICAL ERROR: Dlib shape predictor model NOT FOUND at '{DLIB_SHAPE_PREDICTOR_PATH}'")
        print("[PYTHON_BACKEND] Please download it and place it in the 'scripts' folder relative to this script.")
    else:
        detector = dlib.get_frontal_face_detector()
        predictor = dlib.shape_predictor(DLIB_SHAPE_PREDICTOR_PATH)
        dlib_models_loaded_successfully = True
        print(f"[PYTHON_BACKEND] Successfully loaded Dlib face detector and shape predictor from '{DLIB_SHAPE_PREDICTOR_PATH}'")
except RuntimeError as e:
    print(f"[PYTHON_BACKEND] RUNTIME ERROR loading Dlib model: {e}")
    print(f"[PYTHON_BACKEND] Ensure '{DLIB_SHAPE_PREDICTOR_PATH}' exists and is a valid model file.")
except Exception as e:
    print(f"[PYTHON_BACKEND] UNEXPECTED ERROR loading Dlib model: {e}")

if not dlib_models_loaded_successfully:
    print("[PYTHON_BACKEND] WARNING: Dlib models did NOT load successfully. /process_frame will fail.")


# --- Helper Functions ---
def eye_aspect_ratio(eye):
    A = dist.euclidean(eye[1], eye[5])
    B = dist.euclidean(eye[2], eye[4])
    C = dist.euclidean(eye[0], eye[3])
    if C == 0: return 100.0
    ear = (A + B) / (2.0 * C)
    return ear

def mouth_aspect_ratio(mouth_landmarks): # Expects 8 inner mouth points (60-67)
    # Vertical distance (inner lips)
    # Points 62 (mouth_landmarks[2]) and 66 (mouth_landmarks[6])
    A = dist.euclidean(mouth_landmarks[2], mouth_landmarks[6])
    # Horizontal distance (inner lips)
    # Points 60 (mouth_landmarks[0]) and 64 (mouth_landmarks[4])
    C = dist.euclidean(mouth_landmarks[0], mouth_landmarks[4])
    
    if C == 0: return 0.0
    mar = A / C
    return mar

(L_START, L_END) = (42, 48)
(R_START, R_END) = (36, 42)
# For MAR, we'll extract points 60-67 from the full shape

def calculate_smoothed_value(values, new_value, window_size=SMOOTHING_WINDOW):
    values.append(new_value)
    if len(values) > window_size:
        values.pop(0)
    return sum(values) / len(values)

def detect_blink(ear_value, threshold=BLINK_THRESHOLD):
    return ear_value < threshold

@app.route('/process_frame', methods=['POST'])
def process_frame_route():
    global ear_counter, yawn_counter, blink_counter, last_ear_values, last_mar_values

    if not dlib_models_loaded_successfully:
        print("[PYTHON_BACKEND] /process_frame called, but Dlib models are not loaded.")
        return jsonify({"error": "Dlib models not loaded on server. Check server startup logs."}), 500

    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({"error": "No image data provided or invalid JSON"}), 400

    try:
        image_data = data['image'].split(',')[1]
        decoded_image = base64.b64decode(image_data)
        nparr = np.frombuffer(decoded_image, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as e:
        print(f"[PYTHON_BACKEND] Error decoding image: {e}")
        return jsonify({"error": f"Could not decode image: {e}"}), 400

    if frame is None:
        return jsonify({"error": "Decoded image is None"}), 400

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    rects = detector(gray, 0)

    drowsiness_score = 0
    current_ear = 0.3
    current_mar = 0.0
    is_yawning_detected = False
    is_phone_detected_placeholder = False
    gaze_direction_placeholder = "forward"
    blink_detected = False

    if not rects:
        # Reset counters when no face is detected
        ear_counter = 0
        yawn_counter = 0
        blink_counter = 0
    else:
        for rect in rects:
            shape = predictor(gray, rect)
            shape_np = np.array([[p.x, p.y] for p in shape.parts()])

            left_eye = shape_np[L_START:L_END]
            right_eye = shape_np[R_START:R_END]
            inner_mouth_points = shape_np[60:68]

            left_ear = eye_aspect_ratio(left_eye)
            right_ear = eye_aspect_ratio(right_eye)
            current_ear = (left_ear + right_ear) / 2.0
            current_mar = mouth_aspect_ratio(inner_mouth_points)

            # Apply smoothing
            smoothed_ear = calculate_smoothed_value(last_ear_values, current_ear)
            smoothed_mar = calculate_smoothed_value(last_mar_values, current_mar)

            # Blink detection
            if detect_blink(smoothed_ear):
                blink_counter += 1
                if blink_counter >= BLINK_CONSEC_FRAMES:
                    blink_detected = True
                    drowsiness_score += 15  # Add score for rapid blinking
            else:
                blink_counter = 0

            # Eye closure detection with smoothed values
            if smoothed_ear < EAR_THRESHOLD:
                ear_counter += 1
                if ear_counter >= EAR_CONSEC_FRAMES:
                    drowsiness_score += 50  # Reduced from 60 for better balance
            else:
                ear_counter = 0

            # Yawn detection with smoothed values
            if smoothed_mar > MAR_THRESHOLD:
                yawn_counter += 1
                if yawn_counter >= YAWN_CONSEC_FRAMES:
                    is_yawning_detected = True
                    drowsiness_score += 35  # Reduced from 40 for better balance
            else:
                yawn_counter = 0

            # Simulated phone detection (replace with actual detection)
            if np.random.rand() < 0.05:
                is_phone_detected_placeholder = True
                drowsiness_score += 20

            # Simulated gaze detection (replace with actual detection)
            if np.random.rand() < 0.1:
                gaze_direction_placeholder = "side"
                drowsiness_score += 10
            break

    # Ensure score stays within bounds
    drowsiness_score = min(drowsiness_score, 100)

    return jsonify({
        "drowsinessScore": drowsiness_score,
        "earValue": float(current_ear),
        "isYawning": is_yawning_detected,
        "isPhoneDetected": is_phone_detected_placeholder,
        "gazeDirection": gaze_direction_placeholder,
        "blinkDetected": blink_detected
    })

if __name__ == '__main__':
    print("--- [PYTHON_BACKEND] Starting Python Flask Drowsiness Detection API ---")
    if not dlib_models_loaded_successfully:
        print("[PYTHON_BACKEND] CRITICAL WARNING: Dlib models FAILED to load. /process_frame endpoint will return errors.")
    else:
        print("[PYTHON_BACKEND] Dlib models loaded. Ready to process frames.")
    
    print(f"[PYTHON_BACKEND] Flask server will listen on http://0.0.0.0:5001")
    print(f"[PYTHON_BACKEND] Frontend should connect to this address for API calls.")
    print("[PYTHON_BACKEND] Ensure 'shape_predictor_68_face_landmarks.dat' is in the 'scripts' folder.")
    print("--- [PYTHON_BACKEND] Use Ctrl+C to stop the server. ---")
    try:
        app.run(host='0.0.0.0', port=5001, debug=False)
    except Exception as e:
        print(f"[PYTHON_BACKEND] Failed to start Flask server: {e}")
