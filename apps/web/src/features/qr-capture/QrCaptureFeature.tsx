import { Check, ImageUp, Loader2 } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppServices } from "../../app/providers";
import { StatusPill } from "../../components/ui/StatusPill";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

export function QrCaptureFeature() {
  const { id } = useParams();
  const { apiClient } = useAppServices();
  const [isValid, setIsValid] = useState(false);
  const [isBusy, setIsBusy] = useState(true);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Missing upload session.");
      setIsBusy(false);
      return;
    }
    void apiClient.getImageSession(id)
      .then((session) => setIsValid(session.status !== "expired"))
      .catch(() => setError("This upload link is invalid or expired."))
      .finally(() => setIsBusy(false));
  }, [apiClient, id]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !id) return;
    if (!acceptedTypes.includes(file.type) || file.size > 6 * 1024 * 1024) {
      setError("Use a JPEG, PNG, or WebP image under 6 MB.");
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      await apiClient.uploadMealImage(id, file);
      setComplete(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to upload the meal image.");
    } finally {
      setIsBusy(false);
      event.target.value = "";
    }
  }

  return (
    <section className="phone-upload-page">
      <StatusPill tone={complete ? "success" : error ? "warning" : "neutral"}>
        {complete ? "Uploaded" : "Phone meal upload"}
      </StatusPill>
      <h1>{complete ? "Meal review is ready" : "Choose a meal photo"}</h1>
      <p>{complete ? "Return to the desktop screen to see the review." : "Use one clear photo showing the full plate."}</p>
      {isBusy && <Loader2 className="spin" size={28} />}
      {!isBusy && isValid && !complete && (
        <label className="primary-action">
          <ImageUp size={18} />
          Choose and upload photo
          <input
            className="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={upload}
          />
        </label>
      )}
      {complete && <Check size={44} aria-hidden="true" />}
      {error && <p className="inline-error">{error}</p>}
    </section>
  );
}
