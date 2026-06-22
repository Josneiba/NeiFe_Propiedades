/**
 * Helper para hacer requests HTTP de forma segura con validación de JSON
 * Evita el error "Unexpected end of JSON input" cuando la respuesta es vacía o inválida
 */

export async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const res = await fetch(url, options);
    const status = res.status;

    // Intentar leer el text primero
    const text = await res.text();

    // Si no hay contenido o está vacío
    if (!text || text.trim() === "") {
      if (!res.ok) {
        return {
          data: null,
          error: `HTTP ${status}: Empty response`,
          status,
        };
      }
      return { data: null, error: null, status };
    }

    // Intentar parsear como JSON
    try {
      const data = JSON.parse(text) as T;
      if (!res.ok) {
        const errorMsg = (data as any).error || `HTTP ${status}`;
        return { data: null, error: errorMsg, status };
      }
      return { data, error: null, status };
    } catch (parseError) {
      console.error(`Invalid JSON from ${url}:`, text.slice(0, 200));
      return {
        data: null,
        error: `Invalid JSON response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
        status,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`Fetch error for ${url}:`, errorMsg);
    return { data: null, error: errorMsg, status: 0 };
  }
}
