import React, { useEffect, useState } from "react";
import { listAssets, uploadAsset } from "../services/assetRepository.js";
import { isSupabaseConfigured } from "../services/supabaseClient.js";

const assetTypes = ["問題", "解答", "メモ", "参考"];

export function AssetPanel({ ownerType, ownerId, subject }) {
  const [assets, setAssets] = useState([]);
  const [assetType, setAssetType] = useState("問題");
  const [state, setState] = useState("");

  useEffect(() => {
    let cancelled = false;
    setState("読み込み中");
    listAssets(ownerType, ownerId)
      .then((items) => {
        if (!cancelled) {
          setAssets(items);
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
  }, [ownerType, ownerId]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setState("アップロード中");
    try {
      const saved = await uploadAsset({ ownerType, ownerId, subject, assetType, file });
      setAssets((current) => [saved, ...current]);
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
        <h3>写真</h3>
        <span>{state || `${assets.length}枚`}</span>
      </div>
      <div className="asset-controls">
        <select value={assetType} onChange={(event) => setAssetType(event.target.value)}>
          {assetTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <label className="upload-button">
          写真を追加
          <input type="file" accept="image/*" onChange={handleUpload} />
        </label>
      </div>
      {!isSupabaseConfigured && (
        <p className="submission-empty">ローカル保存では、追加した写真はこのブラウザだけの一時表示になります。</p>
      )}
      <div className="submission-grid">
        {assets.map((asset) => (
          <a key={asset.id} href={asset.image_url} target="_blank" rel="noreferrer">
            <span>{asset.asset_type}</span>
            <img src={asset.image_url} alt={`${asset.asset_type} 写真`} />
          </a>
        ))}
      </div>
    </section>
  );
}
