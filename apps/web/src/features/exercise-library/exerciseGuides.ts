export interface ExerciseGuide {
  id: "squat" | "push-up" | "lunge";
  nameEn: string;
  nameBn: string;
  difficulty: "beginner" | "returning" | "intermediate";
  equipment: string[];
  setupSteps: string[];
  movementSteps: string[];
  commonMistakes: string[];
  safetyCues: string[];
  cameraGuidance: string[];
  liveCoaching: boolean;
}

export const exerciseGuides: ExerciseGuide[] = [
  {
    id: "squat",
    nameEn: "Bodyweight squat",
    nameBn: "বডিওয়েট স্কোয়াট",
    difficulty: "beginner",
    equipment: ["No equipment"],
    setupSteps: ["Stand with feet around shoulder width.", "Turn side-on to the camera and keep your full body visible."],
    movementSteps: ["Send the hips back and bend the knees.", "Reach a comfortable depth, then stand tall with control."],
    commonMistakes: ["Heels lifting", "Rushing the bottom position", "Leaving the calibrated camera area"],
    safetyCues: ["Use a pain-free range.", "Stop if you feel sharp knee, hip, or back pain."],
    cameraGuidance: ["Use a side view.", "Place the device far enough away to show shoulders through ankles."],
    liveCoaching: true
  },
  {
    id: "push-up",
    nameEn: "Standard floor push-up",
    nameBn: "স্ট্যান্ডার্ড পুশ-আপ",
    difficulty: "returning",
    equipment: ["Exercise mat"],
    setupSteps: ["Place hands slightly wider than shoulder width.", "Form a straight line from shoulders through hips to ankles."],
    movementSteps: ["Bend the elbows and lower with control.", "Reach a comfortable depth, then press back to a straight top plank."],
    commonMistakes: ["Hips sagging", "Hips piked too high", "Shoulders not stacked over wrists", "Shallow repetitions"],
    safetyCues: ["Use a pain-free shoulder and wrist range.", "Stop if you feel sharp pain or cannot maintain control."],
    cameraGuidance: ["Use a clear side view.", "Keep shoulder, elbow, wrist, hip, and ankle visible."],
    liveCoaching: true
  },
  {
    id: "lunge",
    nameEn: "Forward lunge",
    nameBn: "ফরোয়ার্ড লাঞ্জ",
    difficulty: "returning",
    equipment: ["No equipment"],
    setupSteps: ["Stand tall with clear space in front of you."],
    movementSteps: ["Step forward and lower under control.", "Push through the front foot to return."],
    commonMistakes: ["Narrow stance", "Uncontrolled front knee", "Rushing the return"],
    safetyCues: ["Use support if balance is uncertain.", "Stop if the movement causes pain."],
    cameraGuidance: ["A side or slight front angle can show both legs."],
    liveCoaching: false
  }
];
