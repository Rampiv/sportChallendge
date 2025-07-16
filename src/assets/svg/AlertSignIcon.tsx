export const AlertSignIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="alert-sign">
      <defs>
        <style>{`
          .alert-ellipse { fill: #45413c; opacity: 0.15; }
          .alert-primary { fill: #ff6242; }
          .alert-secondary { fill: #ff866e; }
          .alert-outline { fill: none; stroke: #45413c; stroke-linecap: round; stroke-linejoin: round; }
        `}</style>
      </defs>
      <title>Одноразовая задача</title>
      <ellipse
        className="alert-ellipse"
        cx="24"
        cy="44.18"
        rx="8.48"
        ry="1.82"
      />
      <path
        className="alert-primary"
        d="M25.4,2.5H22.6c-1.86,0-3.34,1.18-3.23,2.57L21,26.32c.09,1.18,1.4,2.11,3,2.11s2.88-.93,3-2.11L28.63,5.07C28.74,3.68,27.26,2.5,25.4,2.5Z"
      />
      <path
        className="alert-secondary"
        d="M19.56,7.48a3.31,3.31,0,0,1,3-1.6h2.8a3.31,3.31,0,0,1,3,1.6l.19-2.41c.11-1.39-1.37-2.57-3.23-2.57H22.6c-1.86,0-3.34,1.18-3.23,2.57Z"
      />
      <path
        className="alert-outline"
        d="M25.4,2.5H22.6c-1.86,0-3.34,1.18-3.23,2.57L21,26.32c.09,1.18,1.4,2.11,3,2.11s2.88-.93,3-2.11L28.63,5.07C28.74,3.68,27.26,2.5,25.4,2.5Z"
      />
      <circle className="alert-primary" cx="24" cy="35.24" r="3.65" />
      <path
        className="alert-secondary"
        d="M24,33.93A3.58,3.58,0,0,1,27.57,36a3.94,3.94,0,0,0,.08-.77,3.65,3.65,0,1,0-7.3,0,3.94,3.94,0,0,0,.08.77A3.58,3.58,0,0,1,24,33.93Z"
      />
      <circle className="alert-outline" cx="24" cy="35.24" r="3.65" />
    </svg>
  )
}
