export function Lightbox({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  return (
    <div className="mre-lightbox" onClick={onClose}>
      <button onClick={onClose}>×</button>
      <img alt="" src={imageUrl} />
    </div>
  );
}
