import React, { useEffect, useState } from "react";
import { isSupabaseConfigured } from "../services/supabaseClient.js";
import { listSubmissionImages, uploadSubmissionImage } from "../services/submissionRepository.js";

export function SubmissionPanel({ subjectKey, year }) {
  const [images, setImages] = useState([]);
  const [state, setState] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!isSupabaseConfigured) {
      setImages([]);
      return undefined;
    }

    setState("読み込み中");
    listSubmissionImages(subjectKey, year)
      .then((items) => {
        if (!cancelled) {
          setImages(items);
          setState("");
        }
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setState("読み込み失敗");
      });

    return () => {
      cancelled = true;
    };
  }, [subjectKey, year]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setState("アップロード中");
    try {
      const saved = await uploadSubmissionImage(subjectKey, year, file);
      setImages((current) => [saved, ...current]);
      setState("");
    } catch (error) {
      console.error(error);
      setState("アップロード失敗");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <section className="submission-panel">
      <div className="submission-header">
        <h3>自分の答案</h3>
        <span>{state || (isSupabaseConfigured ? `${images.length}枚` : "Supabase未設定")}</span>
      </div>
      {isSupabaseConfigured ? (
        <>
          <label className="upload-button">
            画像を追加
            <input type="file" accept="image/*" onChange={handleUpload} />
          </label>
          <div className="submission-grid">
            {images.map((image) => (
              <a key={image.id} href={image.image_url} target="_blank" rel="noreferrer">
                <img src={image.image_url} alt={`${year}年度 自分の答案`} />
              </a>
            ))}
          </div>
        </>
      ) : (
        <p className="submission-empty">.env.localにSupabaseのURLとキーを入れると、答案画像を保存できます。</p>
      )}
    </section>
  );
}
