import React from "react";

export function ImagePanel({ title, openLabel, src, alt }) {
  return (
    <section className="problem-panel">
      <div className="problem-header">
        <h3>{title}</h3>
        <a href={src} target="_blank" rel="noreferrer">{openLabel}</a>
      </div>
      <img className="problem-image" src={src} alt={alt} />
    </section>
  );
}
