"use client";

import { useEffect, useState } from "react";

interface NetworkInformation extends EventTarget {
  readonly saveData: boolean;
}

interface NavigatorWithConnection extends Navigator {
  readonly connection?: NetworkInformation;
  readonly mozConnection?: NetworkInformation;
  readonly webkitConnection?: NetworkInformation;
}

/**
 * Hook to detect the user's Save-Data preference.
 * Respects the 'Save-Data' header/hint via navigator.connection.saveData.
 */
export function useSaveData() {
  const [saveData, setSaveData] = useState(() => {
    if (typeof navigator === "undefined") return false;
    const nav = navigator as NavigatorWithConnection;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    return conn?.saveData === true;
  });

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const nav = navigator as NavigatorWithConnection;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (conn) {
      const handleChange = () => setSaveData(conn.saveData === true);
      conn.addEventListener("change", handleChange);
      return () => conn.removeEventListener("change", handleChange);
    }
  }, []);

  return saveData;
}
