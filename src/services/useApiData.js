import { useEffect, useState } from "react";
import { api } from "./api";

export function useApiData(path) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (!path) return;
    let active = true;
    api(path)
      .then((data) => { if (active) setResult({ path, data }); })
      .catch((error) => { if (active) setResult({ path, error: error.message }); });
    return () => { active = false; };
  }, [path]);
  return result?.path === path ? result : {};
}
