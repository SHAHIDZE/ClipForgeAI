const API_URL =
  "http://127.0.0.1:8000";


// ============================================================
// UPLOAD VIDEO
// ============================================================

export async function uploadVideo(
  file: File
) {
  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  const response =
    await fetch(
      `${API_URL}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

  if (!response.ok) {
    const error =
      await response
        .json()
        .catch(() => null);

    throw new Error(
      error?.detail ||
        "Video upload failed."
    );
  }

  return response.json();
}


// ============================================================
// DOWNLOAD VIDEO FROM URL
// ============================================================

export async function downloadVideoFromUrl(
  url: string
) {
  const response =
    await fetch(
      `${API_URL}/youtube`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          url: url.trim(),
        }),
      }
    );

  if (!response.ok) {
    const error =
      await response
        .json()
        .catch(() => null);

    throw new Error(
      error?.detail ||
        "Video link orqali yuklab bo'lmadi."
    );
  }

  return response.json();
}


// ============================================================
// START PROCESSING
// ============================================================

export async function startProcessing(
  filename: string,
  startTime = 0,
  endTime: number | null = null
) {
  const params =
    new URLSearchParams();

  params.set(
    "range_start",
    String(startTime)
  );

  if (endTime !== null) {
    params.set(
      "range_end",
      String(endTime)
    );
  }

  const response =
    await fetch(
      `${API_URL}/process/${encodeURIComponent(
        filename
      )}?${params.toString()}`,
      {
        method: "POST",
      }
    );

  if (!response.ok) {
    const error =
      await response
        .json()
        .catch(() => null);

    throw new Error(
      error?.detail ||
        "Video processing boshlanmadi."
    );
  }

  return response.json();
}


// ============================================================
// GET PROCESSING STATUS
// ============================================================

export async function getProcessingStatus(
  filename: string
) {
  const response =
    await fetch(
      `${API_URL}/process-status/${encodeURIComponent(
        filename
      )}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  if (!response.ok) {
    const error =
      await response
        .json()
        .catch(() => null);

    throw new Error(
      error?.detail ||
        "Processing statusni olishda xatolik."
    );
  }

  return response.json();
}


// ============================================================
// DOWNLOAD GENERATED SHORT
// ============================================================

export function getDownloadUrl(
  filename: string
) {
  return `${API_URL}/download/${encodeURIComponent(
    filename
  )}`;
}


// ============================================================
// GET EXPORT VIDEO URL
// ============================================================

export function getExportUrl(
  filename: string
) {
  return `${API_URL}/exports/${encodeURIComponent(
    filename
  )}`;
}


// ============================================================
// ANALYZE VIDEO
// ============================================================

export async function analyzeVideo(filename: string) {
  const response = await fetch(
    `${API_URL}/analyze/${encodeURIComponent(filename)}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.detail ||
        "Video ma'lumotlarini olishda xatolik."
    );
  }

  return response.json();
}