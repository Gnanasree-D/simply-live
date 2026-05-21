import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FAF8F4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "20%",
        }}
      >
        <div
          style={{
            width: "55%",
            height: "55%",
            borderRadius: "50%",
            background: "#6B8F71",
          }}
        />
      </div>
    ),
    size,
  );
}
