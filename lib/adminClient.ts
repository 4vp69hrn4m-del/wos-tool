const STORAGE_KEY = "wos_admin_password";

// 一度入力したパスワードはブラウザのセッション内で使い回す
export function getStoredAdminPassword(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export function promptAdminPassword(): string | null {
  const existing = getStoredAdminPassword();
  if (existing) return existing;
  const pw = window.prompt("管理者パスワードを入力してください");
  if (pw) {
    sessionStorage.setItem(STORAGE_KEY, pw);
  }
  return pw;
}

export function clearStoredAdminPassword() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

// 削除・編集のfetchをこの関数でラップする。
// パスワードが違えば自動でキャッシュを消してアラートを出す。
export async function adminFetch(
  url: string,
  options: { method: string; body?: string; headers?: Record<string, string> }
): Promise<Response | null> {
  const pw = promptAdminPassword();
  if (!pw) return null;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "X-Admin-Password": pw,
    },
  });

  if (res.status === 401) {
    clearStoredAdminPassword();
    alert("管理者パスワードが違います。もう一度お試しください。");
    return null;
  }

  return res;
}
