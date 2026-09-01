(function attachAnalysisProgress(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.KANWANLA_ANALYSIS_PROGRESS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createApi() {
  "use strict";

  const BASE_PROGRESS = Object.freeze({
    preparing: 12,
    requesting: 28,
    streaming: 42,
    parsing: 92,
    rendering: 96,
    done: 100,
    error: 100,
  });

  function phaseProgress(stage, activityCount = 0) {
    if (stage === "streaming") {
      // Activity is real, but the provider exposes no total token count. Grow
      // within the model phase and cap it below parsing instead of inventing a
      // completion percentage.
      return Math.min(88, BASE_PROGRESS.streaming + activityCount * 2);
    }
    return BASE_PROGRESS[stage] ?? 0;
  }

  function analysisRequestIdForVideo(videoId) {
    const stableVideoId = String(videoId || "").trim();
    return stableVideoId ? `analysis:${stableVideoId.slice(0, 500)}` : "";
  }

  function createProgressTracker({
    requestId,
    emit,
    now = () => Date.now(),
    throttleMs = 250,
  }) {
    if (!requestId) throw new TypeError("requestId is required");
    if (typeof emit !== "function") throw new TypeError("emit is required");
    const startedAt = now();
    let stage = "preparing";
    let activityCount = 0;
    let lastEmissionAt = -Infinity;
    let terminal = false;

    function eventFor(nextStage, detail = {}) {
      return {
        requestId,
        stage: nextStage,
        elapsedMs: Math.max(0, now() - startedAt),
        activityCount,
        phaseProgress: phaseProgress(nextStage, activityCount),
        terminal: nextStage === "done" || nextStage === "error",
        ...detail,
      };
    }

    function publish(nextStage, detail = {}, force = true) {
      if (terminal) return null;
      const timestamp = now();
      if (!force && timestamp - lastEmissionAt < throttleMs) return null;
      stage = nextStage;
      const event = eventFor(nextStage, detail);
      lastEmissionAt = timestamp;
      emit(event);
      if (event.terminal) terminal = true;
      return event;
    }

    return {
      update(nextStage, detail) {
        return publish(nextStage, detail, true);
      },
      activity(detail) {
        activityCount += 1;
        return publish("streaming", detail, false);
      },
      finish(nextStage = "done", detail) {
        return publish(nextStage, detail, true);
      },
      snapshot() {
        return eventFor(stage);
      },
    };
  }

  function shouldApplyProgressEvent(event, activeRequestId) {
    return Boolean(
      event &&
        typeof event.requestId === "string" &&
        event.requestId === activeRequestId,
    );
  }

  return {
    BASE_PROGRESS,
    analysisRequestIdForVideo,
    createProgressTracker,
    phaseProgress,
    shouldApplyProgressEvent,
  };
});
