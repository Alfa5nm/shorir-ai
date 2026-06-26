import type { ImageSession, MealReview } from "@shorir/contracts";
import { Camera, ImageUp, Loader2, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAppServices } from "../../app/providers";
import { ensureProfileId } from "../../app/profileSession";
import { StatusPill } from "../../components/ui/StatusPill";
import { useAppLanguage } from "../../app/language";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxBytes = 6 * 1024 * 1024;

function MealReviewResult({ review }: { review: MealReview }) {
  const { t } = useAppLanguage();

  const translateProbableDishes = (dishes: string[]) => {
    return dishes.map(d => {
      if (d === "Meal image received") return t("Meal image received", "খাবারের ছবি পাওয়া গেছে");
      return d;
    }).join(", ");
  };

  const translateConfidence = (level: string) => {
    if (level === "low") return t("low", "নিম্ন");
    if (level === "medium") return t("medium", "মাঝারি");
    if (level === "high") return t("high", "উচ্চ");
    return level;
  };

  const translateCalorieRange = (range: string | null | undefined) => {
    if (!range) return t("Needs portion confirmation", "পরিমাণ নিশ্চিতকরণ প্রয়োজন");
    if (range === "Unknown until Gemini adapter is enabled") {
      return t("Unknown until Gemini adapter is enabled", "জেমিনি অ্যাডাপ্টার সক্রিয় না হওয়া পর্যন্ত অজানা");
    }
    return range;
  };

  const translateMacroNote = (note: string) => {
    if (note === "Use manual confirmation before saving nutrition assumptions.") {
      return t(note, "পুষ্টির অনুমান সংরক্ষণ করার আগে ম্যানুয়ালি নিশ্চিত করুন।");
    }
    return note;
  };

  const translatePortionQuestion = (question: string) => {
    if (question === "What was the approximate portion size?") {
      return t(question, "আনুমানিক পরিবেশন আকার কত ছিল?");
    }
    if (question === "Was extra oil or ghee used?") {
      return t(question, "অতিরিক্ত তেল বা ঘি ব্যবহার করা হয়েছিল?");
    }
    return question;
  };

  const translateLimitation = (limitation: string) => {
    if (limitation === "This is scaffold output and not a precise calorie estimate.") {
      return t(limitation, "এটি একটি ডেমো আউটপুট এবং সঠিক ক্যালোরি অনুমান নয়।");
    }
    return limitation;
  };

  return (
    <section className="meal-result">
      <StatusPill tone="success">{t("Review ready", "পর্যালোচনা প্রস্তুত")}</StatusPill>
      <h2>{review.probableDishes.length ? translateProbableDishes(review.probableDishes) : t("Meal review", "খাবার পর্যালোচনা")}</h2>
      <p>{t("Confidence:", "বিশ্বাসযোগ্যতা:")} {translateConfidence(review.confidenceLevel)}. {t("This is a visual estimate, not a medical assessment.", "এটি একটি চাক্ষুষ প্রাক্কলন, কোনো চিকিৎসাগত মূল্যায়ন নয়।")}</p>
      <p className="calorie-estimate">{t("Estimated calories:", "আনুমানিক ক্যালোরি:")} {translateCalorieRange(review.calorieRange)}</p>
      <div className="meal-result__grid">
        <article>
          <h3>{t("Calorie range", "ক্যালোরি পরিসীমা")}</h3>
          <strong>{translateCalorieRange(review.calorieRange)}</strong>
          <p>{t("Use this as a rough planning range only; oil, portion size, and mixed ingredients can change it.", "এটি শুধুমাত্র একটি আনুমানিক পরিকল্পনা পরিসীমা হিসেবে ব্যবহার করুন; তেল, পরিবেশনের আকার এবং মিশ্র উপাদানগুলোর কারণে এটি পরিবর্তিত হতে পারে।")}</p>
        </article>
        <article>
          <h3>{t("Macro notes", "ম্যাক্রো নোট")}</h3>
          <ul>{review.macroNotes.map((note) => <li key={note}>{translateMacroNote(note)}</li>)}</ul>
        </article>
        <article>
          <h3>{t("Questions", "জিজ্ঞাসা")}</h3>
          <ul>{review.portionQuestions.map((question) => <li key={question}>{translatePortionQuestion(question)}</li>)}</ul>
        </article>
        <article>
          <h3>{t("Limitations", "সীমাবদ্ধতা সমূহ")}</h3>
          <ul>{review.limitations.map((note) => <li key={note}>{translateLimitation(note)}</li>)}</ul>
        </article>
      </div>
    </section>
  );
}

export function MealReviewFeature() {
  const { apiClient } = useAppServices();
  const pollRef = useRef<number | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [imageSession, setImageSession] = useState<ImageSession | null>(null);
  const [publicOrigin, setPublicOrigin] = useState(window.location.origin);
  const [review, setReview] = useState<MealReview | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useAppLanguage();

  const captureUrl = useMemo(
    () => imageSession ? `${publicOrigin.replace(/\/$/, "")}/capture/${imageSession.id}` : "",
    [imageSession, publicOrigin]
  );

  useEffect(() => () => {
    if (pollRef.current !== null) window.clearInterval(pollRef.current);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function processFile(file: File) {
    if (!acceptedTypes.includes(file.type)) {
      throw new Error(t("Use a JPEG, PNG, or WebP image.", "দয়া করে জেপিজি, পিএনজি বা ওয়েবপি ছবি ব্যবহার করুন।"));
    }
    if (file.size > maxBytes) {
      throw new Error(t("Image must be smaller than 6 MB.", "ছবি অবশ্যই ৬ মেগাবাইটের চেয়ে ছোট হতে হবে।"));
    }
    const profileId = await ensureProfileId(apiClient);
    const session = await apiClient.createImageSession({ profileId });
    setImageSession(session);
    const result = await apiClient.uploadMealImage(session.id, file);
    setReview(result);
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsBusy(true);
    setError(null);
    setReview(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    try {
      await processFile(file);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("Unable to review this image.", "এই ছবিটি পর্যালোচনা করা সম্ভব হয়নি।"));
    } finally {
      setIsBusy(false);
      event.target.value = "";
    }
  }

  async function createPhoneUpload() {
    setIsBusy(true);
    setError(null);
    setReview(null);
    try {
      const profileId = await ensureProfileId(apiClient);
      const origin =
        window.location.protocol === "https:" || !["localhost", "127.0.0.1"].includes(window.location.hostname)
          ? window.location.origin
          : (await apiClient.ensurePhoneCameraTunnel()).publicUrl;
      const session = await apiClient.createImageSession({ profileId });
      setPublicOrigin(origin);
      setImageSession(session);
      if (pollRef.current !== null) window.clearInterval(pollRef.current);
      pollRef.current = window.setInterval(() => {
        void apiClient.getImageSessionReview(session.id).then((result) => {
          if (result) {
            setReview(result);
            if (pollRef.current !== null) window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }).catch(() => setError(t("Unable to check the phone upload.", "ফোনের আপলোড পরীক্ষা করা যাচ্ছে না।")));
      }, 1000);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("Unable to create a phone upload.", "ফোন আপলোড সেশন তৈরি করা যায়নি।"));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="meal-review">
      <header className="feature-header">
        <StatusPill tone={review ? "success" : "neutral"}>{review ? t("Processed", "সম্পন্ন") : t("Meal image", "খাবারের ছবি")}</StatusPill>
        <h1>{t("Calorie and meal check", "ক্যালোরি এবং খাবার চেক")}</h1>
        <p>{t("Upload one clear meal photo. SHORIR returns probable dishes, a cautious calorie range, questions, and limitations rather than certainty.", "আপনার খাবারের একটি পরিষ্কার ছবি আপলোড করুন। শরীর এআই সম্ভাব্য খাবার, একটি সতর্কতাপূর্ণ ক্যালোরি পরিসীমা, প্রশ্নাবলী এবং সীমাবদ্ধতা প্রদান করে।")}</p>
      </header>

      <div className="meal-workspace">
        <div className="meal-upload">
          <div className="meal-preview">
            {previewUrl ? <img src={previewUrl} alt={t("Selected meal", "নির্বাচিত খাবার")} /> : <Camera size={42} aria-hidden="true" />}
          </div>
          <div className="meal-actions">
            <label className="primary-action">
              {isBusy ? <Loader2 className="spin" size={18} /> : <ImageUp size={18} />}
              {t("Upload from this device", "এই ডিভাইস থেকে আপলোড করুন")}
              <input
                className="visually-hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={chooseFile}
                disabled={isBusy}
              />
            </label>
            <button type="button" onClick={createPhoneUpload} disabled={isBusy}>
              <Smartphone size={18} />
              {t("Capture from phone", "ফোন থেকে ক্যাপচার করুন")}
            </button>
          </div>
          <small>{t("JPEG, PNG, or WebP. Maximum 6 MB.", "জেপিজি, পিএনজি বা ওয়েবপি। সর্বোচ্চ ৬ মেগাবাইট।")}</small>
          {error && <p className="inline-error">{error}</p>}
        </div>

        {imageSession && !review && captureUrl && (
          <aside className="meal-qr">
            <QRCodeSVG value={captureUrl} size={190} level="M" />
            <h2>{t("Scan with your phone", "আপনার ফোন দিয়ে স্ক্যান করুন")}</h2>
            <p>{t("Choose or capture a meal photo on the phone. This screen updates with the calorie check when processing finishes.", "ফোনে খাবারের ছবি বেছে নিন বা তুলুন। প্রসেসিং শেষ হলে এই স্ক্রিনটি ক্যালোরি চেকের তথ্য দিয়ে আপডেট হবে।")}</p>
          </aside>
        )}
      </div>

      {review && <MealReviewResult review={review} />}
    </section>
  );
}
