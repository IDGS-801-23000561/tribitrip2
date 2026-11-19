import { useEffect, useState } from "react";
import { api } from "../../services/api";

export function useOportunidadesApi(path) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    let active = true;
    api(path)
      .then((data) => { if (active) setResult({ path, data }); })
      .catch((error) => { if (active) setResult({ path, error: error.message }); });
    return () => { active = false; };
  }, [path]);
  return result?.path === path ? result : {};
}
