/** Parser liviano de User-Agent para auditoría (sin dependencias). */
export interface ParsedUA {
  browser: string;
  device: string;
}

export function parseUserAgent(ua: string | null | undefined): ParsedUA {
  if (!ua) return { browser: "Desconocido", device: "Desconocido" };

  const browser =
    /Edg\//i.test(ua) ? "Edge" :
    /OPR\//i.test(ua) ? "Opera" :
    /Chrome\//i.test(ua) ? "Chrome" :
    /Firefox\//i.test(ua) ? "Firefox" :
    /Safari\//i.test(ua) ? "Safari" :
    "Otro";

  const device =
    /Mobile|Android|iPhone/i.test(ua) ? "Móvil" :
    /iPad|Tablet/i.test(ua) ? "Tablet" :
    "Escritorio";

  return { browser, device };
}

/** Extrae la IP aproximada de los headers de la request. */
export function getClientIp(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? null;
  return headers.get("x-real-ip");
}
