// ============================================================
// ClipForgeAI - Video API Service
// ============================================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

// ============================================================
// TYPES
// ============================================================

export interface ProcessingResult {
  code?: string;
  message?: string;
  filename?: string;

  project_id?: number;
  job_id?: number;
  task_id?: string | null;

  progress?: number;
  step?: string;

  generated?: number;
  total?: number;

  files?: string[];

  status?: string;
  error?: string;

  duration?: number;
  video_duration?: number;

  start_time?: number;
  end_time?: number;

  [key: string]: any;
}

// ============================================================
// TOKEN
// ============================================================

function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawToken =
      localStorage.getItem("clipforge_token");

    if (!rawToken) {
      return null;
    }

    const token = rawToken
      .trim()
      .replace(/^Bearer\s+/i, "")
      .trim();

    return token || null;
  } catch (error) {
    console.error(
      "GET ACCESS TOKEN ERROR:",
      error
    );

    return null;
  }
}

// ============================================================
// AUTH HEADERS
// ============================================================

function getAuthHeaders(
  extraHeaders: Record<string, string> = {}
): Record<string, string> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    ...extraHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

// ============================================================
// RESPONSE HANDLER
// ============================================================

async function handleResponse(
  response: Response
): Promise<any> {
  let result: any = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    console.error(
      "API ERROR:",
      response.status,
      result
    );

    const detail = result?.detail;

    if (response.status === 401) {
      throw new Error(
        `AUTH_ERROR:${
          typeof detail === "string"
            ? detail
            : "Sessiya tugagan. Qayta login qiling."
        }`
      );
    }

    if (
      detail &&
      typeof detail === "object"
    ) {
      throw new Error(
        detail.message ||
          detail.detail ||
          detail.error ||
          JSON.stringify(detail)
      );
    }

    if (typeof detail === "string") {
      throw new Error(detail);
    }

    if (
      typeof result?.message === "string"
    ) {
      throw new Error(result.message);
    }

    throw new Error(
      `Request failed (${response.status})`
    );
  }

  return result;
}

// ============================================================
// UPLOAD VIDEO
// ============================================================

export async function uploadVideo(
  file: File
): Promise<ProcessingResult> {
  const token = getAccessToken();

  if (!token) {
    throw new Error(
      "AUTH_ERROR: Login qilinmagan. Avval akkauntga kiring."
    );
  }

  const formData = new FormData();

  formData.append(
    "file",
    file
  );

  console.log(
    "UPLOAD:",
    file.name
  );

  const response = await fetch(
    `${API_URL}/upload`,
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },

      body: formData,
    }
  );

  return handleResponse(
    response
  );
}

// ============================================================
// ANALYZE VIDEO
// IMPORTANT:
// Backend:
// GET /analyze/{filename}
// ============================================================

export async function analyzeVideo(
  filename: string
): Promise<ProcessingResult> {
  const token = getAccessToken();

  if (!token) {
    throw new Error(
      "AUTH_ERROR: Login qilinmagan."
    );
  }

  const safeFilename =
    encodeURIComponent(filename);

  const response = await fetch(
    `${API_URL}/analyze/${safeFilename}`,
    {
      method: "GET",

      headers:
        getAuthHeaders(),

      cache: "no-store",
    }
  );

  return handleResponse(
    response
  );
}

// ============================================================
// START PROCESSING
//
// Backend:
// POST /process/{filename}
//
// Query:
// ?range_start=0&range_end=60
// ============================================================

export async function startProcessing(
  filename: string,
  startTime = 0,
  endTime?: number
): Promise<ProcessingResult> {
  const token = getAccessToken();

  if (!token) {
    throw new Error(
      "AUTH_ERROR: Login qilinmagan."
    );
  }

  const safeFilename =
    encodeURIComponent(filename);

  const params =
    new URLSearchParams();

  params.set(
    "range_start",
    String(startTime)
  );

  if (
    typeof endTime === "number" &&
    Number.isFinite(endTime)
  ) {
    params.set(
      "range_end",
      String(endTime)
    );
  }

  const response = await fetch(
    `${API_URL}/process/${safeFilename}?${params.toString()}`,
    {
      method: "POST",

      headers:
        getAuthHeaders(),

      cache: "no-store",
    }
  );

  return handleResponse(
    response
  );
}

// ============================================================
// ALIASES
// ============================================================

export async function startVideoProcessing(
  filename: string,
  startTime = 0,
  endTime?: number
): Promise<ProcessingResult> {
  return startProcessing(
    filename,
    startTime,
    endTime
  );
}

export async function generateShorts(
  filename: string,
  startTime = 0,
  endTime?: number
): Promise<ProcessingResult> {
  return startProcessing(
    filename,
    startTime,
    endTime
  );
}

// ============================================================
// GET PROCESSING STATUS
//
// Backend:
// GET /process-status/{filename}
// ============================================================

export async function getProcessingStatus(
  filename: string
): Promise<ProcessingResult> {
  const token = getAccessToken();

  if (!token) {
    throw new Error(
      "AUTH_ERROR: Login qilinmagan."
    );
  }

  const safeFilename =
    encodeURIComponent(filename);

  const response = await fetch(
    `${API_URL}/process-status/${safeFilename}`,
    {
      method: "GET",

      headers:
        getAuthHeaders(),

      cache: "no-store",
    }
  );

  return handleResponse(
    response
  );
}

// ============================================================
// ALIAS
// ============================================================

export async function getJobStatus(
  filename: string
): Promise<ProcessingResult> {
  return getProcessingStatus(
    filename
  );
}

// ============================================================
// GET PROJECTS
// ============================================================

export async function getProjects() {
  const token = getAccessToken();

  if (!token) {
    throw new Error(
      "AUTH_ERROR: Login qilinmagan."
    );
  }

  const response = await fetch(
    `${API_URL}/projects`,
    {
      method: "GET",

      headers:
        getAuthHeaders(),

      cache: "no-store",
    }
  );

  return handleResponse(
    response
  );
}

// ============================================================
// DOWNLOAD VIDEO
// ============================================================

export async function downloadVideoFromUrl(
  url: string
) {
  try {
    const token =
      getAccessToken();

    const response =
      await fetch(
        url.startsWith("http")
          ? url
          : `${API_URL}${url}`,
        {
          method: "GET",

          headers: token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {},
        }
      );

    if (!response.ok) {
      throw new Error(
        `Download failed: ${response.status}`
      );
    }

    const blob =
      await response.blob();

    const objectUrl =
      window.URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href =
      objectUrl;

    let filename =
      "clipforge-video.mp4";

    try {
      const pathname =
        new URL(
          url,
          API_URL
        ).pathname;

      const lastPart =
        pathname
          .split("/")
          .pop();

      if (lastPart) {
        filename =
          decodeURIComponent(
            lastPart
          );
      }
    } catch {
      // default filename
    }

    link.download =
      filename;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    window.URL.revokeObjectURL(
      objectUrl
    );

    return true;
  } catch (error) {
    console.error(
      "DOWNLOAD ERROR:",
      error
    );

    throw error;
  }
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

const videoApi = {
  uploadVideo,

  analyzeVideo,

  startProcessing,

  startVideoProcessing,

  generateShorts,

  getProcessingStatus,

  getJobStatus,

  getProjects,

  downloadVideoFromUrl,
};

export default videoApi;