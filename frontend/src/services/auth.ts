const API_URL = "http://127.0.0.1:8000";

// ============================================================
// TYPES
// ============================================================

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  plan: string;
  role: string;
  is_active?: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterResponse {
  status: string;
  message: string;
}

// ============================================================
// HELPERS
// ============================================================

function getErrorMessage(
  result: any,
  fallback: string
): string {
  if (typeof result?.detail === "string") {
    return result.detail;
  }

  if (Array.isArray(result?.detail)) {
    return result.detail
      .map(
        (item: any) =>
          item?.msg || "Invalid request"
      )
      .join(", ");
  }

  if (typeof result?.message === "string") {
    return result.message;
  }

  return fallback;
}

async function parseResponse(
  response: Response
) {
  return response
    .json()
    .catch(() => null);
}

function saveToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    "clipforge_token",
    token
  );
}

function clearToken() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    "clipforge_token"
  );
}

// ============================================================
// REGISTER
// ============================================================

export async function registerUser(
  data: RegisterData
): Promise<RegisterResponse> {
  const response = await fetch(
    `${API_URL}/register`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
        Accept:
          "application/json",
      },

      body: JSON.stringify({
        username:
          data.username.trim(),

        email:
          data.email.trim(),

        password:
          data.password,
      }),
    }
  );

  const result =
    await parseResponse(response);

  console.log(
    "REGISTER STATUS:",
    response.status
  );

  console.log(
    "REGISTER RESPONSE:",
    result
  );

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        result,
        "Registration failed."
      )
    );
  }

  if (
    result?.status === "error"
  ) {
    throw new Error(
      result.message ||
        "Registration failed."
    );
  }

  return result as RegisterResponse;
}

// ============================================================
// LOGIN
// ============================================================

export async function loginUser(
  data: LoginData
): Promise<LoginResponse> {
  const body =
    new URLSearchParams();

  body.append(
    "username",
    data.email.trim()
  );

  body.append(
    "password",
    data.password
  );

  const response = await fetch(
    `${API_URL}/login`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",

        Accept:
          "application/json",
      },

      body: body.toString(),
    }
  );

  const result =
    await parseResponse(response);

  console.log(
    "LOGIN STATUS:",
    response.status
  );

  console.log(
    "LOGIN RESPONSE:",
    result
  );

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        result,
        "Login failed."
      )
    );
  }

  if (!result?.access_token) {
    throw new Error(
      "Server access token qaytarmadi."
    );
  }

  saveToken(
    result.access_token
  );

  return result as LoginResponse;
}

// ============================================================
// TOKEN
// ============================================================

export function getToken():
  string | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  return localStorage.getItem(
    "clipforge_token"
  );
}

// ============================================================
// LOGOUT
// ============================================================

export function logoutUser(): void {
  clearToken();
}

// ============================================================
// CURRENT USER
// ============================================================

export async function getCurrentUser():
  Promise<User | null> {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const response =
      await fetch(
        `${API_URL}/me`,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          cache: "no-store",
        }
      );

    if (
      response.status === 401
    ) {
      clearToken();
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const result =
      await parseResponse(
        response
      );

    if (
      !result ||
      result.status === "error"
    ) {
      return null;
    }

    return result as User;
  } catch (error) {
    console.error(
      "GET CURRENT USER ERROR:",
      error
    );

    return null;
  }
}

// ============================================================
// GOOGLE AUTH
// ============================================================

export function loginWithGoogle(): void {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  window.location.href =
    `${API_URL}/auth/google`;
}

// ============================================================
// AUTHENTICATED FETCH
// ============================================================

export async function authFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Not authenticated"
    );
  }

  const response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,

        headers: {
          ...(options.headers || {}),

          Authorization:
            `Bearer ${token}`,

          Accept:
            "application/json",
        },

        cache: "no-store",
      }
    );

  const result =
    await parseResponse(
      response
    );

  if (
    response.status === 401
  ) {
    clearToken();

    throw new Error(
      "Session expired. Please login again."
    );
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        result,
        "Request failed."
      )
    );
  }

  return result;
}

// ============================================================
// ADMIN FETCH
// ============================================================

export async function adminFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Not authenticated"
    );
  }

  const response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,

        headers: {
          ...(options.headers || {}),

          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        cache: "no-store",
      }
    );

  const result =
    await parseResponse(
      response
    );

  if (
    response.status === 401
  ) {
    clearToken();

    throw new Error(
      "Session expired. Please login again."
    );
  }

  if (
    response.status === 403
  ) {
    throw new Error(
      "Admin access required."
    );
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        result,
        "Admin request failed."
      )
    );
  }

  return result;
}