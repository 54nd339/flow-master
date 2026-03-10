"use client";

import { useEffect, useRef } from "react";

import { audio } from "@/lib/audio";

export function useGameSoundEffects(connectedFlows: Set<string>, muted: boolean) {
  const prevConnectedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (muted) {
      prevConnectedRef.current = connectedFlows;
      return;
    }

    for (const flowId of connectedFlows) {
      if (!prevConnectedRef.current.has(flowId)) {
        audio.flowComplete();
        break;
      }
    }

    prevConnectedRef.current = connectedFlows;
  }, [connectedFlows, muted]);
}
