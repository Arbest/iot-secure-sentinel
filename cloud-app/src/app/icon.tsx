import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, hsl(263 90% 65%), hsl(280 85% 55%) 60%, hsl(220 90% 55%))",
          borderRadius: 8,
          color: "rgba(255, 255, 255, 0.95)",
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: -1,
        }}
      >
        I
      </div>
    ),
    { ...size },
  );
}
