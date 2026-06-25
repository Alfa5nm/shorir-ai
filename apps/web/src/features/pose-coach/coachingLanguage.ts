import type { LanguagePreference } from "@shorir/contracts";
import type { FeedbackCode } from "./exerciseAnalyzer";

const banglaFeedback: Record<FeedbackCode, string> = {
  ready: "প্রস্তুত থাকুন এবং ধীরে নড়াচড়া শুরু করুন।",
  low_confidence: "প্রয়োজনীয় জয়েন্টগুলো ক্যামেরায় পরিষ্কার রাখুন।",
  calibration_setup: "ক্যালিব্রেশনের জন্য পুরো শরীর ফ্রেমে রাখুন।",
  calibration_hold: "স্থির অবস্থান ধরে রাখুন।",
  calibration_move: "একটি নিয়ন্ত্রিত রিপ করুন।",
  calibration_return: "ধীরে শুরুর অবস্থানে ফিরুন।",
  calibration_complete: "ক্যালিব্রেশন সম্পন্ন। এখন নিয়ন্ত্রিত রিপ শুরু করুন।",
  calibration_required: "রিপ গণনার আগে ক্যালিব্রেশন করুন।",
  outside_region: "অ্যাক্টিভিটি বক্সের ভেতরে ফিরে আসুন।",
  too_close: "ক্যামেরা থেকে একটু দূরে যান।",
  too_far: "ক্যামেরার একটু কাছে আসুন।",
  hip_sag: "কোমর একটু ওপরে তুলে শরীর সোজা রাখুন।",
  hip_pike: "কোমর একটু নিচে নামিয়ে শরীর সোজা রাখুন।",
  wrist_alignment: "কাঁধ কবজির ওপর রাখুন।",
  unstable_pose: "স্থির হয়ে পরের রিপ শুরু করুন।",
  not_side_on: "নড়াচড়া বোঝার জন্য পাশ ফিরে দাঁড়ান।",
  waiting_for_stable_top: "শুরুর অবস্থান স্থিরভাবে ধরে রাখুন।",
  incomplete_depth: "নিচের অবস্থান অল্প সময় ধরে রাখুন।",
  cooldown: "রিপ গণনা হয়েছে। পরের রিপের আগে স্থির হন।",
  descending: "ধীরে নিচে নামুন।",
  bottom: "ভালো গভীরতা। নিয়ন্ত্রণ রেখে ওপরে উঠুন।",
  ascending: "ধীরে শুরুর অবস্থানে ফিরুন।",
  rep_completed: "রিপ গণনা হয়েছে।",
  shallow_rep: "রিপটি যথেষ্ট গভীর ছিল না।"
};

export function localizedCoachFeedback(
  code: FeedbackCode,
  english: string,
  language: LanguagePreference
) {
  if (language === "en") return english;
  const bangla = banglaFeedback[code];
  return language === "bn" ? bangla : `${bangla} ${english}`;
}

export function localizedCoachCopy(english: string, bangla: string, language: LanguagePreference) {
  if (language === "en") return english;
  return language === "bn" ? bangla : `${bangla} ${english}`;
}
