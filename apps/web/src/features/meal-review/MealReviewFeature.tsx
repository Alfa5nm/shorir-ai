import type { ImageSession, MealReview } from "@shorir/contracts";
import { Camera, ImageUp, Loader2, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAppServices } from "../../app/providers";
import { ensureProfileId } from "../../app/profileSession";
import { StatusPill } from "../../components/ui/StatusPill";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxBytes = 6 * 1024 * 1024;

function MealReviewResult({ review }: { review: MealReview }) {
  return (
    <section className="meal-result">
      <StatusPill tone="success">Review ready</StatusPill>
      <h2>{review.probableDishes.length ? review.probableDishes.join(", ") : "Meal review"}</h2>
      <p>Confidence: {review.confidenceLevel}. This is a visual estimate, not a medical assessment.</p>
      {review.calorieRange && (
        <p className="calorie-estimate" style={{ color: "#00d2ff", fontWeight: "bold", fontSize: "1.1rem" }}>
          Estimated Calories: {review.calorieRange}
        </p>
      )}
      <div className="meal-result__grid">
        <article>
          <h3>Macro notes</h3>
          <ul>{review.macroNotes.map((note) => <li key={note}>{note}</li>)}</ul>
        </article>
        <article>
          <h3>Questions</h3>
          <ul>{review.portionQuestions.map((question) => <li key={question}>{question}</li>)}</ul>
        </article>
        <article>
          <h3>Limitations</h3>
          <ul>{review.limitations.map((note) => <li key={note}>{note}</li>)}</ul>
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
      throw new Error("Use a JPEG, PNG, or WebP image.");
    }
    if (file.size > maxBytes) {
      throw new Error("Image must be smaller than 6 MB.");
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
      setError(caught instanceof Error ? caught.message : "Unable to review this image.");
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
        }).catch(() => setError("Unable to check the phone upload."));
      }, 1000);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create a phone upload.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="meal-review">
      <header className="feature-header">
        <StatusPill tone={review ? "success" : "neutral"}>{review ? "Processed" : "Meal image"}</StatusPill>
        <h1>Cautious meal review</h1>
        <p>Upload one clear meal photo. SHORIR returns probable dishes, questions, and limitations rather than certainty.</p>
      </header>

      <div className="meal-workspace">
        <div className="meal-upload">
          <div className="meal-preview">
            {previewUrl ? <img src={previewUrl} alt="Selected meal" /> : <Camera size={42} aria-hidden="true" />}
          </div>
          <div className="meal-actions">
            <label className="primary-action">
              {isBusy ? <Loader2 className="spin" size={18} /> : <ImageUp size={18} />}
              Upload from this device
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
              Upload from phone
            </button>
          </div>
          <small>JPEG, PNG, or WebP. Maximum 6 MB.</small>
          {error && <p className="inline-error">{error}</p>}
        </div>

        {imageSession && !review && captureUrl && (
          <aside className="meal-qr">
            <QRCodeSVG value={captureUrl} size={190} level="M" />
            <h2>Scan with your phone</h2>
            <p>Choose a meal photo on the phone. This screen updates when processing finishes.</p>
          </aside>
        )}
      </div>

      {review && <MealReviewResult review={review} />}
    </section>
  );
}
